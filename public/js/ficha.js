'use strict';
// Selector de equipo candidato + ficha completa, compartido por los cinco dimensionadores.
//
// POR QUE UN MODULO Y NO CINCO COPIAS
// El bloque "Modelo recomendado" era en cada pagina un unico equipo fijo: el que ganaba el
// sizing. Pero en preventa casi nunca se cotiza el primero de la lista a ciegas — se
// compara el que cumple justo con el siguiente escalon, o se descarta uno por plazo de
// entrega. Convertirlo en un desplegable de TODOS los que cumplen, con la ficha completa
// del que se elija, es la diferencia entre una herramienta que decide por ti y una que te
// deja decidir con los datos delante. Va aqui, junto a bom.js, para que las cinco paginas
// lo compartan en vez de divergir.
//
// COMO SE USA
//   FICHA.render({
//     contenedor: 'verdict',        // id del nodo donde se pinta
//     candidatos: [...],            // modelos que cumplen, en orden de recomendacion
//     recomendado: 'ID',            // cual marca el motor como recomendado
//     seleccionado: 'ID',           // cual esta elegido ahora (por defecto, el recomendado)
//     titulo: m => 'nombre',        // titular de la ficha
//     subtitulo: m => 'familia',    // linea secundaria
//     etiqueta: (m,i) => 'texto',   // texto de cada opcion del desplegable
//     medidores: m => [{etq, val, tope, txt}],   // barras de holgura del modelo elegido
//     secciones: m => [{titulo, filas:[[clave, valorHTML]], nota}],
//     alCambiar: id => {},          // se avisa a la pagina para sincronizar el BOM
//   })
//
// La pagina conserva el motor de dimensionamiento; este modulo solo presenta. Ninguna
// cifra se calcula aqui.

(function (global) {
  'use strict';

  // El estilo viaja con el modulo, como en bom.js, y usa las variables de color que cada
  // pagina ya declara en :root — asi cada fabricante conserva su acento sin configurar nada.
  const CSS = `
.ficha-sel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 12px}
.ficha-sel label{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);font-weight:600}
.ficha-sel select{flex:1;min-width:220px;padding:7px 9px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'Barlow',sans-serif;font-size:13.5px}
.ficha-sel select:focus{outline:2px solid var(--red);outline-offset:1px}
.ficha-cuenta{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--steel)}
.ficha-sec{margin-top:14px}
.ficha-sec h3{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);font-weight:600;margin:0 0 6px;padding-top:10px;border-top:1px solid var(--rule)}
.ficha-tabla{width:100%;border-collapse:collapse;font-size:13px}
.ficha-tabla td{padding:4px 0;vertical-align:top;border-bottom:1px solid var(--paper)}
.ficha-tabla td:first-child{color:var(--steel);width:44%;padding-right:10px}
.ficha-tabla td:last-child{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px}
.ficha-tabla td.libre{text-align:left;font-family:'Barlow',sans-serif;font-size:12.5px}
.ficha-nota{font-size:11.5px;color:var(--steel);margin:6px 0 0;line-height:1.45}
.ficha-vacio{font-size:13.5px;color:var(--steel);margin:0}
.ficha-rec{background:var(--red);color:#fff;border-radius:2px;padding:1px 6px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;margin-left:7px;vertical-align:2px}
`;
  if (!document.getElementById('ficha-estilos')) {
    const st = document.createElement('style');
    st.id = 'ficha-estilos';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Estado por contenedor: permite varias fichas en una pagina sin que se pisen.
  const estado = {};

  function medidorHtml(m) {
    const pct = m.tope > 0 ? Math.min((m.val / m.tope) * 100, 100) : 0;
    const cls = pct > 90 ? 'tight' : pct < 70 ? 'good' : '';
    return `<div class="meter"><b>${esc(m.etq)} <em>${esc(m.txt || '')}</em></b>`
      + `<div class="bar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
  }

  function seccionHtml(sec) {
    const filas = (sec.filas || []).filter((f) => f && f.length);
    if (!filas.length && !sec.nota) return '';
    return `<div class="ficha-sec"><h3>${esc(sec.titulo)}</h3>`
      + (filas.length ? `<table class="ficha-tabla"><tbody>${filas.map(([k, v, libre]) =>
        `<tr><td>${esc(k)}</td><td class="${libre ? 'libre' : ''}">${v == null ? '—' : v}</td></tr>`).join('')}</tbody></table>` : '')
      + (sec.nota ? `<p class="ficha-nota">${sec.nota}</p>` : '')
      + '</div>';
  }

  function pintar(cid) {
    const cfg = estado[cid];
    const cont = document.getElementById(cid);
    if (!cont || !cfg) return;
    const { candidatos, recomendado } = cfg;

    if (!candidatos.length) {
      cont.innerHTML = `<p class="tag">Modelo recomendado</p>`
        + `<p class="model">Sin candidato</p>`
        + `<p class="family">${esc(cfg.vacioTitulo || 'Ningún equipo cumple todas las restricciones')}</p>`
        + `<div class="why">${cfg.vacioDetalle || ''}</div>`;
      return;
    }

    const sel = candidatos.find((m) => m.id === cfg.seleccionado) || candidatos[0];
    cfg.seleccionado = sel.id;

    const opciones = candidatos.map((m, i) => {
      const txt = cfg.etiqueta ? cfg.etiqueta(m, i) : m.id;
      return `<option value="${esc(m.id)}"${m.id === sel.id ? ' selected' : ''}>`
        + `${esc(txt)}${m.id === recomendado ? '  ·  recomendado' : ''}</option>`;
    }).join('');

    const medidores = (cfg.medidores ? cfg.medidores(sel) : []).map(medidorHtml).join('');
    const secciones = (cfg.secciones ? cfg.secciones(sel) : []).map(seccionHtml).join('');

    cont.innerHTML = `<p class="tag">Equipos que cumplen`
      + `<span class="ficha-cuenta"> · ${candidatos.length}</span></p>`
      + `<div class="ficha-sel"><label for="${cid}-sel">Equipo</label>`
      + `<select id="${cid}-sel">${opciones}</select></div>`
      + `<p class="model">${esc(cfg.titulo ? cfg.titulo(sel) : sel.id)}`
      + `${sel.id === recomendado ? '<span class="ficha-rec">recomendado</span>' : ''}</p>`
      + `<p class="family">${esc(cfg.subtitulo ? cfg.subtitulo(sel) : '')}</p>`
      + medidores
      + (cfg.porQue ? `<div class="why">${cfg.porQue(sel)}</div>` : '')
      + secciones;

    // Sin onchange= en linea: la CSP del sitio prohibe todo codigo inline.
    const nodo = document.getElementById(cid + '-sel');
    if (nodo) {
      nodo.addEventListener('change', () => {
        cfg.seleccionado = nodo.value;
        pintar(cid);
        if (cfg.alCambiar) cfg.alCambiar(nodo.value);
      });
    }
  }

  const API = {
    render(cfg) {
      const cid = cfg.contenedor;
      const previo = estado[cid];
      // Se conserva la eleccion manual mientras ese equipo siga cumpliendo. Si deja de
      // cumplir al mover un parametro, se vuelve al recomendado en vez de mostrar la ficha
      // de un equipo que ya no sirve.
      let sel = cfg.seleccionado || (previo && previo.seleccionado) || cfg.recomendado;
      if (!cfg.candidatos.some((m) => m.id === sel)) sel = cfg.recomendado;
      estado[cid] = Object.assign({}, cfg, { seleccionado: sel });
      pintar(cid);
      return sel;
    },
    // Cual esta elegido ahora — lo usa la pagina para sincronizar la pestana de BOM.
    elegido(cid) {
      return estado[cid] ? estado[cid].seleccionado : null;
    },
  };

  global.FICHA = API;
}(window));
