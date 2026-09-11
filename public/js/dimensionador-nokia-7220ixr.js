'use strict';
// Dimensionador de fabric de datacenter Nokia 7220 IXR — diseño Clos de dos capas
// (leaf-spine, malla completa / full-mesh ECMP).
//
// POR QUÉ ESTA PÁGINA NO SE PARECE A LAS OTRAS SEIS
// Los demás dimensionadores comparan un requerimiento contra un eje de capacidad y eligen UN
// equipo (ver js/ficha.js). Un fabric no se resuelve con un equipo: se resuelve con un LEAF y
// un SPINE, cada uno con su cantidad, así que esta página no reutiliza ficha.js — construye su
// propio resultado de dos tarjetas. Sí reutiliza bom.js (la tabla de materiales ya admite
// varias líneas) y estado.js (el estado sigue siendo enlazable/persistente, es solo la forma
// del resultado la que cambia).
//
// EL MOTOR, EN TRES PASOS
//   1. Puertos de acceso necesarios = servidores × (2 si es doble-homed, si no 1).
//   2. Se elige el ÚNICO leaf de la línea 7220 IXR con puertos de acceso a la velocidad
//      pedida (en este catálogo de 4 modelos no hay eleccion real entre varios: 1G→D1,
//      25G→D2L, 100G→D3L). Con oversubscripción se calculan los uplinks que necesita CADA
//      leaf — con puertos dedicados si el modelo los separa (D1, D2L), o repartiendo el mismo
//      pool de puertos entre acceso y subida si el modelo es uniforme (D3L: "Leaf / Spine
//      compacto", sus 32×100GE sirven para lo uno o lo otro).
//   3. El número de spines es igual a los uplinks por leaf (malla completa: cada leaf manda
//      un puerto a CADA spine, para ECMP). El spine elegido tiene que tener, a esa misma
//      velocidad de uplink, al menos tantos puertos como leafs haya — si no alcanza, se
//      reporta el hueco en vez de inventar una solución (más spines en paralelo partiría la
//      malla en dos fabrics separados, que es un diseño distinto y no lo decide esta
//      calculadora sola).

(function () {
  const $ = (id) => document.getElementById(id);

  let CATALOGO = { models: [] };

  // ── Motor puro ──────────────────────────────────────────────────────────────
  function puertosDe(modelo, veloc, usos) {
    return (modelo.puertos || [])
      .filter((p) => usos.includes(p.uso) && p.veloc === veloc)
      .reduce((s, p) => s + p.cantidad, 0);
  }

  function velocidadesFabric(modelo) {
    return [...new Set((modelo.puertos || [])
      .filter((p) => p.uso === 'fabric' || p.uso === 'ambos')
      .map((p) => p.veloc))];
  }

  // Cuando acceso y fabric comparten el mismo pool de puertos a la misma velocidad (D3L usado
  // como leaf), hay que repartir: más puertos de acceso deja menos para subir, y viceversa.
  // Se busca el reparto que sirve a MÁS servidores por leaf sin dejar de cumplir la
  // sobresuscripción pedida — menos leafs es siempre mejor con el mismo hardware.
  function repartoCompartido(totalPuertos, oversub) {
    for (let acceso = totalPuertos; acceso >= 1; acceso--) {
      const uplinks = Math.ceil(acceso / oversub);
      if (acceso + uplinks <= totalPuertos) return { acceso, uplinks };
    }
    return { acceso: 0, uplinks: 0 };
  }

  function calcularFabric({ models, servers, accesoVel, dual, oversub }) {
    const totalAcceso = Math.max(1, Math.round(servers)) * (dual ? 2 : 1);

    const leaf = models.find((m) => (m.rol || []).includes('leaf')
      && puertosDe(m, accesoVel, ['acceso', 'ambos']) > 0);
    if (!leaf) {
      return { ok: false, motivo: `Ningún modelo de la línea 7220 IXR ofrece puertos de acceso a ${accesoVel} GbE.` };
    }

    const esCompartido = !(leaf.puertos || []).some((p) => p.uso === 'acceso' && p.veloc === accesoVel)
      || (leaf.puertos || []).some((p) => p.uso === 'ambos' && p.veloc === accesoVel);

    let accesoPorLeaf; let uplinksPorLeaf; let velocUplink; let uplinksDisponiblesLeaf;

    if (esCompartido) {
      // Pool único (D3L): acceso y subida salen del mismo grupo de puertos, a la misma
      // velocidad — se resuelve el reparto en vez de sumar dos grupos separados.
      const totalPool = puertosDe(leaf, accesoVel, ['ambos']);
      const reparto = repartoCompartido(totalPool, oversub);
      accesoPorLeaf = reparto.acceso;
      uplinksPorLeaf = reparto.uplinks;
      velocUplink = accesoVel;
      uplinksDisponiblesLeaf = totalPool - accesoPorLeaf;
    } else {
      accesoPorLeaf = puertosDe(leaf, accesoVel, ['acceso']);
      const velsFabric = velocidadesFabric(leaf);
      velocUplink = velsFabric[0];
      const puertosFabricLeaf = puertosDe(leaf, velocUplink, ['fabric']);
      const capacidadAccesoGbps = accesoPorLeaf * accesoVel;
      const capacidadUplinkNecesaria = capacidadAccesoGbps / oversub;
      uplinksPorLeaf = Math.min(
        Math.max(1, Math.ceil(capacidadUplinkNecesaria / velocUplink)),
        puertosFabricLeaf,
      );
      uplinksDisponiblesLeaf = puertosFabricLeaf;
    }

    if (accesoPorLeaf <= 0) {
      return { ok: false, motivo: `El ${leaf.id} no tiene margen para servir puertos de acceso a ${accesoVel} GbE con esa sobresuscripción.` };
    }

    const numLeafs = Math.ceil(totalAcceso / accesoPorLeaf);
    const oversubReal = (accesoPorLeaf * accesoVel) / (uplinksPorLeaf * velocUplink);
    const uplinkInsuficiente = uplinksPorLeaf > uplinksDisponiblesLeaf;

    const spine = models.find((m) => (m.rol || []).includes('spine')
      && puertosDe(m, velocUplink, ['fabric', 'ambos']) > 0);
    if (!spine) {
      return {
        ok: false,
        motivo: `Los uplinks del ${leaf.id} son de ${velocUplink} GbE y ningún modelo de la línea 7220 IXR tiene puertos de spine a esa velocidad — hace falta un modelo intermedio de agregación que este catálogo todavía no cubre.`,
      };
    }
    const puertosPorSpine = puertosDe(spine, velocUplink, ['fabric', 'ambos']);
    const numSpines = uplinksPorLeaf;
    const spineInsuficiente = puertosPorSpine < numLeafs;

    return {
      ok: true,
      totalAcceso, accesoVel, oversub, dual,
      leaf, numLeafs, accesoPorLeaf, uplinksPorLeaf, velocUplink, oversubReal, uplinkInsuficiente,
      spine, numSpines, puertosPorSpine, spineInsuficiente,
    };
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function leerEntrada() {
    return {
      models: CATALOGO.models,
      servers: Number($('servers').value) || 0,
      accesoVel: Number($('accesoVel').value),
      dual: $('chkDual').checked,
      oversub: Number($('oversub').value),
    };
  }

  function render() {
    const r = calcularFabric(leerEntrada());
    const verdict = $('verdict');
    const diseno = $('disenoBox');
    const sizing = $('sizingBox');

    if (!r.ok) {
      verdict.innerHTML = `<p class="tag bad">Sin diseño posible</p><p class="cifra">${BOM.esc(r.motivo)}</p>`;
      diseno.innerHTML = '';
      sizing.innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Ajusta los parámetros para ver un diseño de fabric.</p>';
      window.__nokiaResultado = null;
      // El BOM tambien tiene que enterarse: sin esto se quedaba mostrando los leafs y spines
      // del ultimo diseño que si salio, que es una lista de materiales exportable de un
      // diseño que ya no existe.
      $('bomTabla').innerHTML = BOM.avisoDesvio({ hayCandidato: false });
      return;
    }

    verdict.innerHTML = `<p class="tag">Sobresuscripción lograda</p>`
      + `<p class="cifra"><em>${r.oversubReal.toFixed(1)}:1</em> — pedida ${r.oversub}:1</p>`
      + `<p>${r.totalAcceso} puertos de acceso a ${r.accesoVel} GbE (${r.dual ? 'doble homing' : 'single homing'}), uplinks a ${r.velocUplink} GbE.</p>`;

    diseno.innerHTML = `
      <div class="rolCard">
        <h3>Leaf</h3>
        <p class="modelo">${BOM.esc(r.leaf.id)}</p>
        <p class="cant"><b>${r.numLeafs}</b> unidad(es)</p>
        <ul>
          <li><span>Acceso usado por leaf</span><b>${r.accesoPorLeaf} × ${r.accesoVel} GbE</b></li>
          <li><span>Uplinks por leaf</span><b>${r.uplinksPorLeaf} × ${r.velocUplink} GbE</b></li>
        </ul>
      </div>
      <div class="rolCard">
        <h3>Spine</h3>
        <p class="modelo">${BOM.esc(r.spine.id)}</p>
        <p class="cant"><b>${r.numSpines}</b> unidad(es)</p>
        <ul>
          <li><span>Puertos hacia leafs, por spine</span><b>${r.numLeafs} × ${r.velocUplink} GbE</b></li>
          <li><span>Puertos disponibles en el modelo</span><b>${r.puertosPorSpine} × ${r.velocUplink} GbE</b></li>
        </ul>
      </div>`;

    const avisos = [];
    if (r.uplinkInsuficiente) {
      avisos.push(`<li class="warn">El ${r.leaf.id} no tiene uplinks suficientes para la sobresuscripción pedida: la lograda es ${r.oversubReal.toFixed(1)}:1, más ajustada que el ${r.oversub}:1 solicitado.</li>`);
    }
    if (r.spineInsuficiente) {
      avisos.push(`<li class="bad">El ${r.spine.id} no tiene puertos suficientes para los ${r.numLeafs} leafs de este diseño (tiene ${r.puertosPorSpine}) — este diseño excede lo que un solo tier de spine 7220 IXR resuelve en malla completa; hace falta repartir el fabric en más de un grupo, decisión que esta calculadora no toma sola.</li>`);
    }
    sizing.innerHTML = `<table><tbody>
        <tr><td>Servidores a conectar</td><td class="n r">${r.totalAcceso / (r.dual ? 2 : 1)}</td></tr>
        <tr><td>Puertos de acceso totales</td><td class="n r">${r.totalAcceso}</td></tr>
        <tr><td>Capacidad total de acceso</td><td class="n r">${((r.totalAcceso * r.accesoVel) / 1000).toFixed(1)} Tbps</td></tr>
        <tr><td>Capacidad total de fabric</td><td class="n r">${((r.numLeafs * r.uplinksPorLeaf * r.velocUplink) / 1000).toFixed(1)} Tbps</td></tr>
      </tbody></table>`
      + (avisos.length ? `<ul style="margin-top:12px;padding-left:18px;font-size:12.5px">${avisos.join('')}</ul>` : '');

    window.__nokiaResultado = r;
    renderBom(r);
  }

  // ── BOM ──────────────────────────────────────────────────────────────────────
  function renderBom(r) {
    const filas = [
      { cat: 'Equipo', desc: `Nokia ${r.leaf.id} — leaf`, sku: null, qty: r.numLeafs, unit: r.leaf.elpN || null, nota: r.leaf.ifaces },
      { cat: 'Equipo', desc: `Nokia ${r.spine.id} — spine`, sku: null, qty: r.numSpines, unit: r.spine.elpN || null, nota: r.spine.ifaces },
    ];
    $('bomTabla').innerHTML = BOM.renderTabla(filas, {
      aviso: 'Cableado (DAC/AOC/transceptores) y montaje en rack no están incluidos: dependen del alcance físico exacto del sitio.',
    });

    $('xlsBtn').onclick = () => BOM.exportarExcel(filas, {
      titulo: 'Fabric Nokia 7220 IXR', subtitulo: `${r.numLeafs} leaf ${r.leaf.id} + ${r.numSpines} spine ${r.spine.id}`,
      archivo: 'nokia-7220ixr-fabric',
    });
    $('copyBtn').onclick = () => {
      const out = $('bomOut');
      out.value = BOM.comoTexto(filas, { titulo: 'FABRIC NOKIA 7220 IXR' });
      out.classList.remove('hidden');
      out.select();
      document.execCommand('copy');
    };
    $('cotizarBtn').onclick = () => {
      BOM.enviarACotizador({ modelo: `Nokia ${r.leaf.id}`, qty: r.numLeafs, de: 'Dimensionador Nokia 7220 IXR' });
      BOM.enviarACotizador({ modelo: `Nokia ${r.spine.id}`, qty: r.numSpines, de: 'Dimensionador Nokia 7220 IXR' });
      location.href = '/cotizador.html';
    };
  }

  // ── Pestañas ─────────────────────────────────────────────────────────────────
  function montarTabs() {
    const tabs = document.querySelectorAll('.tabs button');
    tabs.forEach((b) => b.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.id !== `pane-${b.dataset.tab}`; });
    }));
  }

  // ── Arranque ─────────────────────────────────────────────────────────────────
  async function iniciar() {
    montarTabs();
    const res = await fetch('/api/dimensionador/nokia');
    CATALOGO = await res.json();

    ['servers', 'accesoVel', 'oversub'].forEach((id) => $(id).addEventListener('input', render));
    $('chkDual').addEventListener('change', render);

    const st = ESTADO.vincular({ campos: ['servers', 'accesoVel', 'oversub', 'chkDual'] });
    const anclaje = document.querySelector('.tabs') || document.querySelector('.masthead');
    if (anclaje && anclaje.parentNode) {
      const caja = document.createElement('div');
      caja.className = 'estado-barra';
      caja.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px';
      anclaje.parentNode.insertBefore(caja, anclaje.nextSibling);
      ESTADO.botonEnlace(caja);
      ESTADO.avisoOrigen(caja, st.origen);
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
