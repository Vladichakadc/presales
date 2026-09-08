'use strict';
// Contraste de un documento cargado (Excel/CSV) contra el catálogo vigente, EN EL NAVEGADOR y
// SIN IA. Enseña qué trae de nuevo el documento y qué se actualizaría; el pintado y el parseo
// del archivo viven en js/index.js. Aquí está la regla de qué cuenta como cambio.
//
// POR QUE SOLO HOJAS, NO PDF. Casar una tabla ya estructurada (filas y columnas con cabecera)
// contra el catálogo es determinista. Extraer esa tabla de un PDF sin equivocar de fila es
// justo lo que este repositorio no automatiza —«ahí se cuelan las filas desplazadas»—, así
// que un PDF necesita la IA o la lectura humana. Este módulo solo contrasta lo ya tabular.
//
// POR QUE ES UN PREVIEW, NO EL IMPORTADOR. `npm run cps/juniper/huawei` son la vía autoritativa
// con su reconocimiento de columnas y su doble anclaje. Esto es una vista rápida: reconoce una
// columna solo si su cabecera coincide con un campo real del catálogo (o un alias explícito), y
// lo que no reconoce lo LISTA como ignorado en vez de adivinar. Nunca inventa un mapeo.
(function () {
  // Nombre de modelo comparable: minúsculas, sin separadores, sin prefijo de fabricante. Mismo
  // criterio que el traspaso dimensionador→cotizador, para que «SRX380», «Juniper SRX380» y
  // «srx-380» sean el mismo equipo.
  function normalizarModelo(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/^(huawei|cisco|fortinet|mikrotik|aruba|juniper|nokia|hpe|hp)\s+/, '')
      .replace(/[\s_\-.]+/g, '')
      .trim();
  }

  // Igualdad por VALOR, no por formato: «10», «10 Gbps» y 10 son el mismo dato. Rechazar por la
  // forma marcaría cambios que no lo son. Mismo criterio que scripts/importar-propuesta.js.
  function mismoValor(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) return false;
    const norm = (v) => String(v).toLowerCase().replace(/[\s,]/g, '').replace(/gbps|mbps|tbps|\$|~/g, '');
    if (norm(a) === norm(b)) return true;
    const na = Number(norm(a));
    const nb = Number(norm(b));
    return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
  }

  const vacio = (v) => v === null || v === undefined || String(v).trim() === ''
    || /^(n\/a|-|—|null)$/i.test(String(v).trim());

  // Cabeceras humanas frecuentes que apuntan sin ambigüedad a un campo del catálogo. Se aplican
  // SOLO si el campo destino existe en los modelos de ese fabricante; si no, la columna se
  // ignora. No se mapea a varios campos a la vez: eso sería adivinar.
  const ALIAS = {
    throughput: 'fwd', forwarding: 'fwd', firewall: 'fw', 'firewallthroughput': 'fw',
    ipsecvpn: 'vpn', vpnipsec: 'vpn', ipsec: 'ipsec', vpn: 'vpn',
    ngfwthroughput: 'ngfw', ngfw: 'ngfw', ips: 'ips', 'ipsthroughput': 'ips',
    threatprotection: 'tp', 'newsessionssec': 'cps', 'newsessionspersecond': 'cps',
    concurrentsessions: 'sess', sesiones: 'sess', mpps: 'mpps', precio: 'price', price: 'price',
  };
  const normCab = (s) => String(s == null ? '' : s).toLowerCase().replace(/[\s_\-./()]+/g, '');

  // Qué campos existen de verdad en los modelos de este fabricante (unión de sus claves). Es lo
  // que decide si una columna es reconocible: contrastar contra un campo que el catálogo no
  // tiene no significaría nada.
  function camposDelCatalogo(modelos) {
    const set = new Set();
    for (const m of modelos) for (const k of Object.keys(m)) set.add(k);
    return set;
  }

  // Resuelve una cabecera del documento a un campo del catálogo, o null si no se reconoce.
  function campoDe(cabecera, campos) {
    const n = normCab(cabecera);
    if (campos.has(n)) return n; // la cabecera ES el nombre del campo (fwd, ipsec, ngfw…)
    if (ALIAS[n] && campos.has(ALIAS[n])) return ALIAS[n];
    return null;
  }

  const idDe = (m) => m.model || m.id;

  // El contraste. Devuelve cuatro montones, porque son cuatro cosas distintas:
  //   cambios          — el modelo existe y una columna reconocida trae un valor distinto
  //   altas            — el documento trae un modelo que no está en el catálogo (se reporta)
  //   sinCambio        — coincidencias que ya están al día (solo se cuentan)
  //   columnasIgnoradas — cabeceras que no casan con ningún campo (transparencia, no adivinar)
  function contrastar({ modelos, filas }) {
    if (!Array.isArray(modelos) || !Array.isArray(filas) || !filas.length) {
      return { error: 'No hay filas que contrastar.' };
    }
    const campos = camposDelCatalogo(modelos);
    const porModelo = new Map();
    for (const m of modelos) porModelo.set(normalizarModelo(idDe(m)), m);

    const cabeceras = Object.keys(filas[0]);
    const colModelo = cabeceras.find((c) => /^(model|modelo|producto|equipo|nombre)$/i.test(normCab(c)));
    if (!colModelo) return { error: 'No se encontró una columna de modelo en el documento.' };

    // Columnas de datos reconocidas (cabecera -> campo del catálogo) y las que se ignoran.
    const usadas = [];
    const columnasIgnoradas = [];
    for (const c of cabeceras) {
      if (c === colModelo) continue;
      const campo = campoDe(c, campos);
      if (campo) usadas.push({ cabecera: c, campo });
      else columnasIgnoradas.push(c);
    }

    const cambios = [];
    const altas = [];
    let sinCambio = 0;
    for (const fila of filas) {
      const nombre = fila[colModelo];
      if (vacio(nombre)) continue;
      const modelo = porModelo.get(normalizarModelo(nombre));
      if (!modelo) {
        // Alta: se reporta, nunca se aplica sola (misma regla que el importador).
        const traidos = {};
        for (const { cabecera, campo } of usadas) if (!vacio(fila[cabecera])) traidos[campo] = fila[cabecera];
        altas.push({ id: String(nombre).trim(), campos: traidos });
        continue;
      }
      for (const { cabecera, campo } of usadas) {
        const nuevo = fila[cabecera];
        if (vacio(nuevo)) continue; // el documento no trae ese dato: no se propone borrar nada
        const actual = modelo[campo];
        if (!vacio(actual) && mismoValor(actual, nuevo)) { sinCambio += 1; continue; }
        cambios.push({
          id: idDe(modelo),
          field: campo,
          oldValue: vacio(actual) ? null : actual,
          newValue: typeof nuevo === 'string' ? nuevo.trim() : nuevo,
        });
      }
    }
    return {
      cambios, altas, sinCambio, columnasIgnoradas, columnasUsadas: usadas.map((u) => u.cabecera),
    };
  }

  // Arma la propuesta que consume `npm run propuesta` y el workflow aplicar-propuesta, a partir
  // de los cambios elegidos. `sourceUrl` la pone quien contrasta (el importador exige URL de
  // fuente oficial para aceptar nada). Las altas NO entran: se aplican a mano, nunca solas.
  function comoPropuesta(vendor, cambios, sourceUrl) {
    return {
      vendor,
      generado: new Date().toISOString(),
      cambios: cambios.map((c) => ({
        target: 'product',
        type: 'UPDATE',
        id: c.id,
        field: c.field,
        oldValue: c.oldValue === null || c.oldValue === undefined ? 'N/A' : String(c.oldValue),
        newValue: String(c.newValue),
        reason: 'Contraste de documento cargado contra el catálogo vigente.',
        sourceUrl: sourceUrl || '',
      })),
    };
  }

  window.CONTRASTE = { normalizarModelo, mismoValor, contrastar, comoPropuesta, campoDe, camposDelCatalogo };
}());
