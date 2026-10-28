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
//     vendor: 'fortinet',           // fabricante, para pedir sus referencias de pedido
//     alCambiar: (id, origen) => {}, // se avisa a la pagina para sincronizar el BOM;
//                                   //   origen: 'selector' | 'volver' | 'candidato'
//     listaCandidatos: true,        // (opt-in) lista clicable de TODOS los que cumplen
//     etiquetaCand: (m,i) => '',    // (opt-in) detalle de cada fila de esa lista
//     vistas: {ID:{front,rear?}},   // (opt-in) foto oficial del equipo arriba, con
//                                   //   conmutador frontal/trasera si hay ambas caras;
//                                   //   `foto` + `fotoFuente` (opt-in, Juniper 2026-10-20)
//                                   //   suman una tercera pestaña «Foto»: la de producto a
//                                   //   color, con su propio pie de procedencia
//     panelFijo: true,              // (opt-in) tarjeta compacta: lista sin scroll
//     detalleExpandible: true,      //   interno; porQue+secciones se despliegan
//                                   //   DENTRO de la tarjeta con un conmutador
//     escalon: {                    // (opt-in) referencia al escalon superior (N+1)
//       metrica: m => numero,       //   cifra rectora que ya calculo la pagina
//       fmt: v => 'texto',          //   como se escribe esa cifra
//       nombre: 'SD-WAN típico',    //   como se llama
//       precio: m => numero|null,   //   precio de lista confirmado, o null
//       comparable: (a, b) => bool, // opcional: solo equipos de la misma familia o base de medida
//     },
//   })
//
// La pagina conserva el motor de dimensionamiento; este modulo solo presenta. Ninguna
// cifra se calcula aqui.

(function (global) {
  'use strict';

  // Despliegue de las características por tarjeta (opt-in detalleExpandible): vive
  // FUERA del cfg porque la página repinta la tarjeta con cada cambio de entrada y
  // el despliegue debe sobrevivir — si viajara en el DOM, cualquier retoque del
  // escenario plegaría el detalle que el usuario acababa de abrir.
  const estadoDet = {};

  // El estilo viaja con el modulo, como en bom.js, y usa las variables de color que cada
  // pagina ya declara en :root — asi cada fabricante conserva su acento sin configurar nada.
  const CSS = `
.ficha-sel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 12px}
.ficha-sel label{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);font-weight:600}
.ficha-sel select{flex:1;min-width:220px;padding:7px 9px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'Barlow',sans-serif;font-size:13.5px}
.ficha-sel select:focus{outline:2px solid var(--red);outline-offset:1px}
.ficha-cuenta{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--steel)}
.ficha-volver{flex:none;padding:7px 11px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.ficha-volver:hover{border-color:var(--red);color:var(--red-txt,var(--red))}
.ficha-volver:focus-visible{outline:2px solid var(--red);outline-offset:1px}
.ficha-desvio{font-size:12px;color:var(--steel);margin:0 0 10px;line-height:1.45}
.ficha-sec{margin-top:14px}
.ficha-sec h3{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);font-weight:600;margin:0 0 6px;padding-top:10px;border-top:1px solid var(--rule)}
.ficha-tabla{width:100%;border-collapse:collapse;font-size:13px}
.ficha-tabla td{padding:4px 0;vertical-align:top;border-bottom:1px solid var(--paper)}
.ficha-tabla td:first-child{color:var(--steel);width:44%;padding-right:10px}
.ficha-tabla td:last-child{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px}
.ficha-tabla td.libre{text-align:left;font-family:'Barlow',sans-serif;font-size:12.5px}
.ficha-nota{font-size:11.5px;color:var(--steel);margin:6px 0 0;line-height:1.45}
.ficha-vacio{font-size:13.5px;color:var(--steel);margin:0}
.ficha-rec{background:var(--red-txt,var(--red));color:#fff;border-radius:2px;padding:1px 6px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;margin-left:7px;vertical-align:2px}
.ficha-ref{border:1px solid var(--rule);color:var(--steel);border-radius:2px;padding:1px 6px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;margin-left:7px;vertical-align:2px}
.ficha-ref.fuera{background:var(--steel);color:var(--paper);border-color:var(--steel)}
.ficha-aviso{font-size:12.5px;color:var(--steel);border-left:2px solid var(--steel);padding:5px 0 5px 9px;margin:9px 0 0;line-height:1.45}
.ficha-refs{margin-top:18px}
.ficha-refs h3{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--steel);font-weight:600;margin:0 0 8px}
.ficha-refs-barra{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.ficha-refs-barra input{flex:1;min-width:170px;padding:6px 9px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'Barlow',sans-serif;font-size:12.5px}
.ficha-refs-barra input:focus{outline:2px solid var(--red);outline-offset:1px}
.ficha-refs-chip{padding:4px 10px;border:1px solid var(--rule);border-radius:11px;background:var(--card);color:var(--steel);font-family:'IBM Plex Mono',monospace;font-size:10.5px;cursor:pointer}
.ficha-refs-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ficha-refs-caja{max-height:420px;overflow:auto;border:1px solid var(--rule);border-radius:4px}
.ficha-refs table{width:100%;border-collapse:collapse;font-size:12.5px}
.ficha-refs thead th{position:sticky;top:0;background:var(--bg);text-align:left;padding:6px 9px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--steel);border-bottom:1px solid var(--rule);z-index:1}
.ficha-refs tbody td{padding:5px 9px;border-bottom:1px solid var(--rule);vertical-align:top}
.ficha-refs tbody tr:last-child td{border-bottom:0}
.ficha-refs .sku{font-family:'IBM Plex Mono',monospace;font-size:11.5px;white-space:nowrap;color:var(--ink)}
.ficha-refs .pre{text-align:right;white-space:nowrap;font-family:'IBM Plex Mono',monospace;font-size:11.5px}
.ficha-refs-add{border:1px solid var(--rule);background:var(--card);color:var(--ink);border-radius:3px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:2px 7px;white-space:nowrap}
.ficha-refs-add:hover{border-color:var(--red);color:var(--red-txt,var(--red))}
.ficha-refs .vacio{padding:10px;color:var(--steel);font-size:12.5px}
.ficha-ref-aviso{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--amber);border:1px solid var(--amber);border-radius:2px;padding:0 4px;margin-left:4px;cursor:help;white-space:nowrap}
.ficha-cands{margin:0 0 12px;border:1px solid var(--rule);border-radius:4px;overflow:hidden}
.ficha-cands.larga{max-height:232px;overflow-y:auto;scrollbar-width:thin}
.ficha-cand{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border:0;border-top:1px solid var(--paper);background:var(--card);color:var(--ink);font-family:'Barlow',sans-serif;font-size:12.5px;text-align:left;cursor:pointer}
.ficha-cand:first-child{border-top:0}
.ficha-cand:hover{background:var(--paper)}
.ficha-cand:focus-visible{outline:2px solid var(--red);outline-offset:-2px}
.ficha-cand.on{background:var(--paper);box-shadow:inset 3px 0 0 var(--red)}
.ficha-cand b{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;flex:none}
.ficha-cand .cand-det{color:var(--steel);font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.ficha-cand .cand-badge{flex:none;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;border-radius:2px;padding:1px 6px}
.ficha-cand .cand-badge.rec{background:var(--red-txt,var(--red));color:#fff}
.ficha-cand .cand-badge.fin{border:1px solid var(--rule);color:var(--steel)}
.ficha-vista{margin:0 0 12px;border:1px solid var(--rule);border-radius:4px;overflow:hidden;background:var(--card)}
.ficha-vista-img{display:flex;align-items:center;justify-content:center;padding:10px 12px 6px;min-height:96px;position:relative}
.ficha-vista-img img{max-width:100%;max-height:150px;object-fit:contain;display:block;cursor:zoom-in}
/* Un chasis vertical (el NetEngine 8000 F8, la serie X) a 150 px de alto es una franja de
   120 px de ancho en una tarjeta de 700: el tope de 150 px está pensado para paneles de 1U.
   Las figuras más altas que anchas lo suben a 260 (2026-10-06); nunca pasan de su tamaño. */
.ficha-vista-img img.ficha-vista-alta{max-height:260px}
/* Lupa de la tarjeta gráfica (plan 19, 2026-09-18, petición del dueño): la tarjeta
   sirve la foto a 150 px de alto; la lupa la trae al frente a su RESOLUCIÓN NATURAL
   (los webp del repo son los originales extraídos de los documentos oficiales). El
   botón habla el lenguaje de la página: borde --rule, acento --red al pasar. Aruba la
   estrenó (regla del piloto); Fortinet (2026-09-22) y Huawei (2026-10-06) la heredaron
   declarando «vistas», sin tocar nada aquí. */
.ficha-vista-zoom{position:absolute;top:6px;right:6px;width:26px;height:26px;padding:0;border:1px solid var(--rule);border-radius:2px;background:var(--card);color:var(--steel);cursor:pointer;display:flex;align-items:center;justify-content:center}
.ficha-vista-zoom:hover{border-color:var(--red);color:var(--red-txt,var(--red))}
.ficha-vista-zoom:focus-visible{outline:2px solid var(--red);outline-offset:1px}
.ficha-vista-zoom svg{width:14px;height:14px}
.ficha-lupa{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:20px}
.ficha-lupa[hidden]{display:none}
.ficha-lupa-fondo{position:absolute;inset:0;background:rgba(14,26,43,.84)}
.ficha-lupa-caja{position:relative;display:flex;flex-direction:column;max-width:min(1200px,94vw);max-height:92vh;background:var(--card);border:1px solid var(--rule);border-radius:4px;overflow:hidden;box-shadow:0 18px 60px rgba(14,26,43,.45)}
.ficha-lupa-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--rule)}
.ficha-lupa-modelo{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);font-weight:600}
.ficha-lupa-cerrar{margin-left:auto;width:28px;height:28px;padding:0;border:1px solid var(--rule);border-radius:2px;background:var(--card);color:var(--steel);font-size:15px;line-height:1;cursor:pointer}
.ficha-lupa-cerrar:hover{border-color:var(--red);color:var(--red-txt,var(--red))}
.ficha-lupa-cerrar:focus-visible{outline:2px solid var(--red);outline-offset:1px}
.ficha-lupa-caja img{max-width:100%;max-height:calc(92vh - 110px);object-fit:contain;display:block;padding:14px 18px}
.ficha-lupa figcaption{padding:8px 12px;border-top:1px solid var(--rule);font-size:11px;line-height:1.45;color:var(--steel)}
/* Leyenda de los números de la figura (opt-in frontLeyenda/rearLeyenda, Cisco 2026-10-27,
   petición del dueño: «al ampliar la imagen deberá mostrar la tabla donde se indica a qué hace
   referencia cada puerto con su número»). La figura oficial lleva los números y su tabla está en
   el documento; sin ella, el número no dice nada. Con leyenda, la lupa reserva sitio para la tabla
   y la caja se desplaza si no cabe. */
.ficha-lupa-caja.con-leyenda{overflow-y:auto}
.ficha-lupa-caja.con-leyenda img{max-height:min(calc(92vh - 110px),52vh)}
.ficha-lupa-leyenda{padding:4px 18px 12px}
.ficha-lupa-leyenda[hidden]{display:none}
.ficha-leyenda-tit{margin:6px 0 4px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--steel)}
.ficha-leyenda-cols{display:grid;grid-template-columns:1fr;gap:0 24px}
@media (min-width:900px){.ficha-leyenda-cols.dos{grid-template-columns:1fr 1fr}}
.ficha-leyenda{width:100%;border-collapse:collapse;font-size:12px;line-height:1.4;align-self:start}
.ficha-leyenda th{text-align:left;font-weight:600;color:var(--steel);font-size:10.5px;padding:4px 8px;border-bottom:1px solid var(--rule)}
.ficha-leyenda td{padding:4px 8px;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink)}
.ficha-leyenda td.ficha-leyenda-n{width:1%;white-space:nowrap}
.ficha-leyenda-n span{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:22px;height:22px;padding:0 3px;border:1.5px solid var(--ink);border-radius:50%;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600}
.ficha-leyenda td.ficha-leyenda-lit{color:var(--steel);font-size:11px;font-family:'IBM Plex Mono',monospace}
.ficha-vista-leyenda{padding:0 12px 10px;font-size:12px}
.ficha-vista-leyenda summary{cursor:pointer;color:var(--ink);font-weight:600;font-size:11.5px}
.ficha-vista-leyenda summary:focus-visible{outline:2px solid var(--red);outline-offset:1px}
.ficha-vista-leyenda[hidden]{display:none}
@media (max-width:640px){.ficha-leyenda td.ficha-leyenda-lit,.ficha-leyenda th.ficha-leyenda-lit{display:none}}
.ficha-vista-bar{display:flex;align-items:center;gap:10px;padding:0 12px 10px;flex-wrap:wrap}
.ficha-vista-tabs{display:flex;gap:4px;flex:none}
.ficha-vista-tab{padding:3px 10px;border:1px solid var(--rule);border-radius:2px;background:var(--card);color:var(--steel);font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
.ficha-vista-tab.on{background:var(--ink);border-color:var(--ink);color:var(--card)}
.ficha-vista figcaption{flex:1;min-width:180px;font-size:11px;line-height:1.45;color:var(--steel)}
.ficha-vista-sinrear{margin:0;padding:18px 14px;max-width:560px;text-align:center;font-size:12px;line-height:1.5;color:var(--steel);border:1px dashed var(--rule);border-radius:4px}
.ficha-vista-zoom[hidden],.ficha-vista-img img[hidden]{display:none}
.ficha-vista-vacia{margin:0 0 12px;border:1px dashed var(--rule);border-radius:4px;padding:14px 12px;color:var(--steel);font-size:12px;line-height:1.5}
.ficha-cands-mas{margin:-6px 0 12px;padding:0 2px;font-size:11px;color:var(--steel)}
/* Semaforo de ciclo de vida (pendiente 34). Cinco estados; el gris usa --steel, que es el
   color con el que el resto de este catalogo ya dice «sin dato». El verde NO es el estado por
   defecto: se gana con un boletin fechado. */
.ficha-ciclo{display:inline-flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:600}
.ficha-ciclo i{display:inline-block;width:8px;height:8px;border-radius:50%;flex:none}
.ficha-ciclo.ciclo-verde{color:var(--green)}.ficha-ciclo.ciclo-verde i{background:var(--green)}
.ficha-ciclo.ciclo-ambar{color:var(--amber)}.ficha-ciclo.ciclo-ambar i{background:var(--amber)}
.ficha-ciclo.ciclo-rojo{color:#a4544e}.ficha-ciclo.ciclo-rojo i{background:#a4544e}
/* El gris va con el punto HUECO a proposito: «no consta» no es un estado del equipo sino del
   catalogo, y un punto relleno lo leeria como un cuarto veredicto mas. */
.ficha-ciclo.ciclo-gris{color:var(--steel)}.ficha-ciclo.ciclo-gris i{background:transparent;border:1.5px dashed var(--steel)}
.ficha-ciclo-det{display:block;font-size:11.5px;line-height:1.45;color:var(--steel);margin-top:3px}
.ficha-ciclo-caja{margin:9px 0 0}
.ficha-salto{margin:10px 0 0;text-align:center}
/* Escalon superior (N+1), opt-in escalon (2026-10-19): informativo, no elige nada. */
.ficha-escalon{font-size:12px;color:var(--steel);border:1px dashed var(--rule);border-radius:3px;padding:6px 9px;margin:9px 0 0;line-height:1.45}
.ficha-escalon b{color:var(--ink);font-family:'IBM Plex Mono',monospace;font-size:11.5px}
.ficha-det{margin-top:14px;padding-top:4px;border-top:1px solid var(--rule)}
.ficha-salto a{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--steel);text-decoration:none;border-bottom:1px dashed var(--rule);padding-bottom:1px}
.ficha-salto a:hover{color:var(--red-txt,var(--red));border-bottom-color:var(--red)}
`;
  if (!document.getElementById('ficha-estilos')) {
    const st = document.createElement('style');
    st.id = 'ficha-estilos';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── LUPA DE LA TARJETA GRÁFICA (plan 19, 2026-09-18, petición del dueño) ──────
     La tarjeta sirve la foto del equipo a 150 px de alto; la lupa la trae al frente
     a su RESOLUCIÓN NATURAL (los webp de /img/equipos son los originales extraídos
     de los documentos oficiales — no hay versión «grande» aparte: la máxima calidad
     ES el archivo). Un único lightbox por documento, creado al primer uso; guarda
     los DATOS (frente/reverso/modelo/pie), nunca referencias al DOM de la tarjeta
     (pintar() la reconstruye en cada render y la referencia quedaría huérfana).
     Cierra con ×, Esc o clic en el fondo; ←/→ conmutan frontal/trasera cuando el
     documento de origen publica ambas caras; el foco vuelve al botón que la abrió. */
  const SVG_LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>';
  // Leyenda de una cara: `{tabla, filas: [[n, rótulo literal, traducción]]}`, tal como la trae el
  // mapa de vistas. Lo que no tenga esa forma no se pinta: una tabla a medias diría que el número
  // que falta no es nada.
  const leyendaValida = (ley) => !!(ley && Array.isArray(ley.filas) && ley.filas.length
    && ley.filas.every((f) => Array.isArray(f) && Number.isInteger(f[0]) && f[1] && f[2]));
  function leyendaDe(dataset, cara) {
    const crudo = dataset && dataset['leyenda' + cara.charAt(0).toUpperCase() + cara.slice(1)];
    if (!crudo) return null;
    try { const ley = JSON.parse(crudo); return leyendaValida(ley) ? ley : null; } catch { return null; }
  }
  // Más de 8 números (el 8300-2N2S lleva 19): dos columnas en pantalla ancha, para que la
  // tabla quepa junto a la figura sin desplazarse; en estrecha, una.
  function tablaLeyenda(ley, cara) {
    // El rótulo literal va en el idioma del documento: inglés salvo que la leyenda diga otro
    // (`lang`; la ficha del SSR130 de Juniper es japonesa). Lo leen los lectores de pantalla.
    const idioma = /^[a-z]{2}(-[A-Z]{2})?$/.test(ley.lang || '') ? ley.lang : 'en';
    const nombreCara = cara === 'rear' ? 'trasera' : 'frontal';
    const titulo = `Qué es cada número de la vista ${nombreCara}${ley.tabla ? ` · ${esc(ley.tabla)}` : ''}`;
    const tabla = (filas) => `<table class="ficha-leyenda" aria-label="${titulo}">`
      + '<thead><tr><th scope="col">N.º</th><th scope="col">Qué es</th><th scope="col" class="ficha-leyenda-lit">Rótulo del documento</th></tr></thead><tbody>'
      + filas.map(([n, lit, es]) => `<tr><td class="ficha-leyenda-n"><span>${n}</span></td><td>${esc(es)}</td><td class="ficha-leyenda-lit" lang="${esc(idioma)}">${esc(lit)}</td></tr>`).join('')
      + '</tbody></table>';
    const mitad = Math.ceil(ley.filas.length / 2);
    const cuerpo = ley.filas.length > 8
      ? `<div class="ficha-leyenda-cols dos">${tabla(ley.filas.slice(0, mitad))}${tabla(ley.filas.slice(mitad))}</div>`
      : `<div class="ficha-leyenda-cols">${tabla(ley.filas)}</div>`;
    return `<p class="ficha-leyenda-tit">${titulo}</p>${cuerpo}`;
  }
  let lupaN = null, lupaOrigen = null, lupaDatos = null;
  function nodoLupa() {
    if (lupaN) return lupaN;
    const n = document.createElement('div');
    n.className = 'ficha-lupa'; n.id = 'fichaLupa'; n.hidden = true;
    n.setAttribute('role', 'dialog');
    n.setAttribute('aria-modal', 'true');
    n.setAttribute('aria-label', 'Foto del equipo ampliada');
    n.innerHTML = '<div class="ficha-lupa-fondo"></div><figure class="ficha-lupa-caja">'
      + '<div class="ficha-lupa-bar"><span class="ficha-lupa-modelo"></span>'
      + '<span class="ficha-vista-tabs" role="tablist" aria-label="Vistas del equipo"></span>'
      + '<button type="button" class="ficha-lupa-cerrar" aria-label="Cerrar la vista ampliada">&times;</button></div>'
      + '<img alt=""><div class="ficha-lupa-leyenda" hidden></div><figcaption></figcaption></figure>';
    n.querySelector('.ficha-lupa-fondo').addEventListener('click', cerrarLupa);
    n.querySelector('.ficha-lupa-cerrar').addEventListener('click', cerrarLupa);
    document.body.appendChild(n);
    lupaN = n;
    return n;
  }
  // Las caras que puede tener una figura, en el orden en que se ofrecen. `foto` es la foto de
  // producto a color (opt-in): los dibujos de la guía de hardware son las caras, la foto es lo
  // que el cliente reconoce, y cada una lleva su propio pie de procedencia.
  const CARAS = { front: 'Frontal', rear: 'Trasera', foto: 'Foto' };
  const ALT_CARA = { front: 'Vista frontal del ', rear: 'Vista trasera del ', foto: 'Foto de producto del ' };
  const carasDe = (d) => Object.keys(CARAS).filter((c) => d[c]);
  function pintarLupa() {
    const n = nodoLupa(), d = lupaDatos, img = n.querySelector('img');
    const src = d[d.cual];
    if (!src) return;
    img.src = src;
    img.alt = (ALT_CARA[d.cual] || ALT_CARA.front) + d.modelo + ' — ampliada a tamaño completo';
    n.querySelector('.ficha-lupa-modelo').textContent = d.modelo;
    n.querySelector('figcaption').textContent = d.cual === 'foto' && d.pieFoto ? d.pieFoto : d.pie;
    // La tabla de los números va pegada a la imagen ampliada, que es donde se leen.
    const ley = d.leyendas && d.leyendas[d.cual];
    const cajaLey = n.querySelector('.ficha-lupa-leyenda');
    cajaLey.innerHTML = ley ? tablaLeyenda(ley, d.cual) : '';
    cajaLey.hidden = !ley;
    n.querySelector('.ficha-lupa-caja').classList.toggle('con-leyenda', !!ley);
    const tabs = n.querySelector('.ficha-vista-tabs');
    const caras = carasDe(d);
    if (caras.length > 1) {
      tabs.style.display = '';
      tabs.innerHTML = caras.map((c) =>
        `<button type="button" class="ficha-vista-tab${c === d.cual ? ' on' : ''}" data-vista="${c}" role="tab" aria-selected="${c === d.cual}">${CARAS[c]}</button>`).join('');
      tabs.querySelectorAll('.ficha-vista-tab').forEach((tb) =>
        tb.addEventListener('click', () => { lupaDatos.cual = tb.dataset.vista; pintarLupa(); }));
    } else { tabs.innerHTML = ''; tabs.style.display = 'none'; }
  }
  function abrirLupa(fig) {
    const tabOn = fig.querySelector('.ficha-vista-tab.on');
    lupaDatos = { front: fig.dataset.front || null, rear: fig.dataset.rear || null, foto: fig.dataset.foto || null,
      modelo: fig.dataset.modelo || '', pie: fig.dataset.pie || '', pieFoto: fig.dataset.pieFoto || '',
      leyendas: { front: leyendaDe(fig.dataset, 'front'), rear: leyendaDe(fig.dataset, 'rear') },
      // Sin pestañas (una sola cara) la lupa abre la que HAY, no `front` a ciegas.
      cual: tabOn ? tabOn.dataset.vista : (fig.dataset.front ? 'front' : fig.dataset.rear ? 'rear' : 'foto') };
    lupaOrigen = fig.querySelector('.ficha-vista-zoom');
    pintarLupa();
    const n = nodoLupa();
    n.hidden = false;
    document.body.style.overflow = 'hidden';
    n.querySelector('.ficha-lupa-cerrar').focus();
  }
  function cerrarLupa() {
    if (!lupaN || lupaN.hidden) return;
    lupaN.hidden = true;
    document.body.style.overflow = '';
    if (lupaOrigen) lupaOrigen.focus();
  }
  document.addEventListener('keydown', (e) => {
    if (!lupaN || lupaN.hidden || !lupaDatos) return;
    if (e.key === 'Escape') cerrarLupa();
    const caras = carasDe(lupaDatos);
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && caras.length > 1) {
      const i = caras.indexOf(lupaDatos.cual);
      lupaDatos.cual = caras[(i + (e.key === 'ArrowRight' ? 1 : caras.length - 1)) % caras.length];
      pintarLupa();
    }
  });

  // ── REGLA TRANSVERSAL: FUERA DE VENTA SE MUESTRA, PERO NO SE RECOMIENDA ─────
  //
  // Estaba repartida y era contradictoria. Fortinet y MikroTik BORRABAN de la lista de
  // candidatos los equipos descontinuados: no se recomendaban, cierto, pero tampoco se
  // podian consultar, que es justo lo que hace falta cuando se cotiza una ampliacion de un
  // parque ya instalado. Cisco, en cambio, los dejaba competir de igual a igual y podia
  // recomendar como respuesta a un diseno nuevo un equipo que ya no se vende. Tres paginas,
  // tres criterios distintos para la misma pregunta. Aqui queda uno solo:
  //
  //   rango 0 · vigente         se recomienda con normalidad
  //   rango 1 · linea anterior  aparece, y solo se propone si nada vigente cumple
  //   rango 2 · fuera de venta  aparece marcado, y NUNCA se propone
  //
  // Un fin de venta ANUNCIADO no es lo mismo que estar fuera de venta: hasta la fecha de
  // ultimo pedido el equipo se pide con normalidad, asi que sigue siendo recomendable y
  // solo se marca con su fecha. Pasada esa fecha cae solo a rango 2, sin que nadie tenga
  // que acordarse de editar el catalogo — que es como estos avisos se quedan obsoletos.
  function eosVencido(m) {
    const f = m && m.eolAnnounced && m.eolAnnounced.lastOrder;
    if (!f) return false;
    const t = Date.parse(f);
    return Number.isFinite(t) && t < Date.now();
  }
  function rango(m) {
    if (!m) return 0;
    if (m.eol || eosVencido(m)) return 2;
    if (m.legacy) return 1;
    return 0;
  }
  const recomendable = (m) => rango(m) < 2;
  function marca(m) {
    if (!m) return null;
    if (m.eol) return { t: 'fuera de venta', fuera: true };
    if (eosVencido(m)) return { t: 'fin de venta vencido', fuera: true };
    if (m.legacy) return { t: 'línea anterior', fuera: false };
    if (m.eolAnnounced) return { t: 'fin de venta anunciado', fuera: false };
    return null;
  }
  // El ciclo de vida en el desplegable de equipos (petición del dueño, 2026-10-27: «resalta en
  // rojo en el combo cuando los equipos están o van a estar fuera de venta»). Una sola regla para
  // el desplegable de la ficha y para los selectores propios de cada página: fuera de venta (rango
  // 2: `eol` o `lastOrder` vencido) y fin de venta anunciado (`eolAnnounced` aún vigente) salen en
  // rojo. El color no va solo: la opción lleva además el texto («fuera de venta», «fin de venta el
  // <fecha>»), que es lo único que ve quien no distingue el rojo o usa un desplegable nativo que no
  // pinta colores (macOS, móvil). La línea anterior (`legacy`) no es fin de venta: no va en rojo.
  // `fuera` (opcional) deja a la página sumar su propia regla de no proponible (Fortinet: sin SKU
  // de hardware en la lista firmada).
  function cicloOpcion(m, extra) {
    if (!m) return null;
    const fuera = rango(m) === 2 || !!(extra && extra.fuera);
    if (fuera) return { ciclo: 'fuera', t: (marca(m) && marca(m).fuera) ? marca(m).t : 'fuera de venta' };
    if (m.eolAnnounced) {
      const f = m.eolAnnounced.lastOrder;
      return { ciclo: 'anunciado', t: f ? `fin de venta el ${f}` : 'fin de venta anunciado' };
    }
    return null;
  }
  // Atributos y sufijo listos para una `<option>`: la clase la colorea (hoja controles.css) y el
  // `data-ciclo` deja al `<select>` teñirse cuando la elegida es una de ellas (`:has`).
  function opcionCiclo(m, extra) {
    const c = cicloOpcion(m, extra);
    if (!c) return { attr: '', sufijo: '', ciclo: null };
    return { attr: ` class="opt-ciclo opt-ciclo-${c.ciclo}" data-ciclo="${c.ciclo}"`, sufijo: `  ·  ${c.t}`, ciclo: c.ciclo };
  }
  function avisoDe(m) {
    const mk = marca(m);
    if (!mk) return '';
    if (m.eol) return 'Equipo <b>fuera de venta</b>. Se muestra como referencia para ampliar o reemplazar un parque ya instalado; no se propone para un diseño nuevo y por eso nunca sale recomendado.';
    if (eosVencido(m)) return `Su <b>fecha de último pedido (${esc(m.eolAnnounced.lastOrder)}) ya pasó</b>: a efectos de un diseño nuevo está fuera de venta. Queda como referencia para el parque instalado.`
      // endOfSupport es opt-in (2026-09-13, Aruba EC-XL): si el catálogo declara hasta
      // cuándo hay soporte, la ficha lo dice — es el dato que salva la renovación del
      // parque ya instalado. Los modelos sin el campo no cambian.
      + (m.eolAnnounced.endOfSupport ? ` El parque instalado conserva soporte del fabricante hasta el <b>${esc(m.eolAnnounced.endOfSupport)}</b>.` : '');
    if (m.legacy) return 'Pertenece a la <b>línea anterior</b>. Sigue en canal y es la respuesta natural para ampliar un parque instalado, pero solo se recomienda si ningún equipo de la generación actual cumple.';
    return `<b>Fin de venta anunciado</b> — último día de pedido: <b>${esc(m.eolAnnounced.lastOrder)}</b>. Hasta esa fecha se pide con normalidad; después dejará de proponerse solo.`;
  }

  // Estado por contenedor: permite varias fichas en una pagina sin que se pisen.
  const estado = {};

  // El respaldo lo informa la pagina UNA VEZ tras su fetch (FICHA.fijarCicloVida), no en cada
  // FICHA.render: hay veinte puntos de llamada entre los siete dimensionadores contando los
  // estados vacios, y pasarlo en todos es exactamente como `llevarABom` acabo en seis copias
  // que no hacian lo mismo. `null` mientras no se informe, que es el tercer estado.
  let cicloVidaVendor = null;


  function medidorHtml(m) {
    const pct = m.tope > 0 ? Math.min((m.val / m.tope) * 100, 100) : 0;
    const cls = pct > 90 ? 'tight' : pct < 70 ? 'good' : '';
    return `<div class="meter"><b>${esc(m.etq)} <em>${esc(m.txt || '')}</em></b>`
      + `<div class="bar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
  }

  function seccionHtml(sec) {
    const filas = (sec.filas || []).filter((f) => f && f.length);
    if (!filas.length && !sec.nota && !sec.html) return '';
    // `sec.html` (opt-in, 2026-09-13): bloque libre de la pagina — p.ej. la escalera de
    // capacidad publicada de Aruba, que no cabe en una tabla clave/valor. Lo emite la
    // pagina ya saneado; este modulo no lo toca. Va entre la tabla y la nota.
    return `<div class="ficha-sec"><h3>${esc(sec.titulo)}</h3>`
      + (filas.length ? `<table class="ficha-tabla"><tbody>${filas.map(([k, v, libre]) =>
        `<tr><td>${esc(k)}</td><td class="${libre ? 'libre' : ''}">${v == null ? '—' : v}</td></tr>`).join('')}</tbody></table>` : '')
      + (sec.html || '')
      + (sec.nota ? `<p class="ficha-nota">${sec.nota}</p>` : '')
      + '</div>';
  }

  // ── REFERENCIAS DE PEDIDO ──────────────────────────────────────────────────────────────
  // Que hay que PEDIR, no solo que equipo elegir. La ficha mostraba el rendimiento y ni un
  // solo numero de parte, asi que quien armaba una propuesta tenia el modelo y luego tenia
  // que ir a buscar el SKU a otro sitio.
  //
  // SE PIDE POR MODELO Y BAJO DEMANDA. Las referencias de Fortinet son 6.849 (774 KB): meterlas
  // en el payload del dimensionador cargaria todo eso en cada visita para mostrar, como mucho,
  // las de un equipo. Por modelo son unos 12 KB.
  //
  // SE CACHEA POR equipo porque cambiar de modelo y volver es el gesto normal de comparar dos
  // candidatos, y repetir la peticion cada vez haria parpadear la tabla sin motivo.
  const cacheRefs = new Map();

  // DONDE SE PINTAN LAS REFERENCIAS. Por defecto, dentro de la propia ficha. Con `refsEn`
  // la pagina las manda a un contenedor suyo -Fortinet las lleva al final de la pestana de
  // lista de materiales, en el sitio y con el nombre que Aruba ya usaba-, y entonces la
  // ficha NO emite su div interno: dos elementos con el mismo id harian que
  // getElementById devolviera el primero del documento y la tabla se pintara en el sitio
  // equivocado segun el orden del marcado, que es un fallo que no se ve hasta que alguien
  // reordena una seccion.
  function cajaRefs(cid) {
    const cfg = estado[cid];
    return document.getElementById((cfg && cfg.refsEn) || (cid + '-refs'));
  }
  function tituloRefs(cid) {
    const cfg = estado[cid];
    const t = cfg && 'refsTitulo' in cfg ? cfg.refsTitulo : 'Referencias de pedido';
    return t ? `<h3>${esc(t)}</h3>` : '';
  }

  const fmtPrecio = (p) => (p == null ? '—' : '$' + Number(p).toLocaleString('en-US'));

  function refsHtml(cid, datos, filtro, tipo) {
    // Solo donde hay un BOM que reciba la linea. En una pagina sin bom.js el boton prometeria
    // algo que no existe.
    const puedeAnadir = !!(global.BOM && global.BOM.agregarRef);
    const q = (filtro || '').trim().toLowerCase();
    const lista = datos.refs.filter((r) => {
      if (tipo && r.t !== tipo) return false;
      if (!q) return true;
      return (r.sku || '').toLowerCase().includes(q) || (r.d || '').toLowerCase().includes(q);
    });

    if (estado[cid]) estado[cid]._refVisibles = lista;

    // Los tipos salen de los datos, no de una lista escrita a mano: si el documento trae una
    // categoria nueva aparece sola, en vez de quedarse invisible por no estar prevista.
    const tipos = [...new Set(datos.refs.map((r) => r.t).filter(Boolean))];
    const chips = tipos.length > 1
      ? tipos.map((t) => `<button type="button" class="ficha-refs-chip${tipo === t ? ' on' : ''}" data-ficha-tipo="${esc(t)}">${esc(t)}</button>`).join('')
        + `<button type="button" class="ficha-refs-chip${tipo ? '' : ' on'}" data-ficha-tipo="">Todas</button>`
      : '';

    const cuerpo = lista.length
      ? `<div class="ficha-refs-caja"><table><thead><tr>`
        + `<th>SKU</th><th>Descripción</th><th style="text-align:right">Precio de lista</th>`
        + `${puedeAnadir ? '<th></th>' : ''}`
        + `</tr></thead><tbody>${lista.map((r, i) => `<tr>`
          + `<td class="sku">${r.sku ? esc(r.sku) : '<span style="color:var(--steel)">sin número de parte</span>'}</td>`
          // Una descripcion corregida al termino de su codigo (F18) se DICE: el texto original
          // de la lista va en el aviso, no desaparece.
          + `<td>${esc(r.d || '')}${r.aviso ? ` <span class="ficha-ref-aviso" title="${esc(r.aviso)}">texto corregido</span>` : ''}</td>`
          + `<td class="pre">${fmtPrecio(r.p)}</td>`
          // Ver la referencia no basta: lo que hace falta es poder meterla en la cotizacion.
          // El indice viaja en el boton porque el SKU puede ser null (las variantes de Aruba).
          + `${puedeAnadir ? `<td class="pre"><button type="button" class="ficha-refs-add" data-ficha-add="${i}">Añadir</button></td>` : ''}`
          + `</tr>`).join('')}</tbody></table></div>`
      : `<p class="vacio">Ninguna referencia coincide con la búsqueda.</p>`;

    // `refsTitulo: null` suprime el encabezado: lo pone el contenedor externo (la seccion
    // «Anadir a la lista de materiales»), y repetirlo daria dos titulos al mismo cuadro.
    const tit = estado[cid] && 'refsTitulo' in estado[cid] ? estado[cid].refsTitulo : 'Referencias de pedido';
    return (tit ? `<h3>${esc(tit)}<span class="ficha-cuenta"> · ${lista.length}`
      + `${lista.length !== datos.refs.length ? ` de ${datos.refs.length}` : ''}</span></h3>`
      : `<p class="ficha-refs-cuenta">${lista.length}`
      + `${lista.length !== datos.refs.length ? ` de ${datos.refs.length}` : ''} referencias</p>`)
      + `<div class="ficha-refs-barra">`
      + `<input type="search" id="${cid}-refq" placeholder="Buscar SKU o descripción…" value="${esc(filtro || '')}">`
      + chips + '</div>'
      + cuerpo
      + (datos.nota ? `<p class="ficha-nota">${esc(datos.nota)}` + (datos.fuente ? ` Fuente: ${esc(datos.fuente)}.` : '') + '</p>' : '');
  }

  function pintarRefs(cid) {
    const cfg = estado[cid];
    const caja = cajaRefs(cid);
    if (!cfg || !caja) return;
    const datos = cfg._refs;
    if (!datos) return;
    if (!datos.refs.length) {
      // Un fabricante sin referencias lo DICE, en vez de dejar un hueco que se lee como si la
      // pantalla estuviera rota. Es el mismo criterio que «el catalogo no lo especifica».
      caja.innerHTML = tituloRefs(cid)
        + `<p class="ficha-nota">${esc(datos.nota || 'El catálogo no trae referencias de pedido para este equipo.')}</p>`;
      return;
    }
    caja.innerHTML = refsHtml(cid, datos, cfg._refFiltro, cfg._refTipo);
    // El boton indexa sobre la lista VISIBLE (ya filtrada), asi que se guarda esa misma: usar
    // la completa haria que con el buscador puesto se anadiera una referencia distinta de la
    // que se pulso.
    const visibles = cfg._refVisibles || [];
    caja.querySelectorAll('[data-ficha-add]').forEach((b) => {
      b.addEventListener('click', () => {
        const r = visibles[Number(b.dataset.fichaAdd)];
        if (!r || !global.BOM || !global.BOM.agregarRef) return;
        global.BOM.agregarRef({ sku: r.sku, d: r.d, p: r.p, de: cfg.seleccionado, v: cfg.vendor });
        b.textContent = 'Añadida';
        setTimeout(() => { b.textContent = 'Añadir'; }, 1400);
      });
    });
    const inp = document.getElementById(cid + '-refq');
    if (inp) {
      inp.addEventListener('input', () => {
        cfg._refFiltro = inp.value;
        pintarRefs(cid);
        // Reponer el foco y el cursor: repintar la tabla no debe echar a quien esta escribiendo.
        const n = document.getElementById(cid + '-refq');
        if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
      });
    }
    caja.querySelectorAll('[data-ficha-tipo]').forEach((b) => {
      b.addEventListener('click', () => { cfg._refTipo = b.dataset.fichaTipo || null; pintarRefs(cid); });
    });
  }

  function cargarRefs(cid, vendor, modelo) {
    const cfg = estado[cid];
    if (!cfg || !vendor || !modelo) return;
    // El BOM guarda las referencias de los siete fabricantes en una sola lista, y necesita
    // saber cual es el de esta pagina para pintar solo las suyas. Se lo decimos aqui porque es
    // el unico sitio que ya conoce el fabricante sin que las siete paginas tengan que cablearlo.
    if (global.BOM && global.BOM.fijarVendor) global.BOM.fijarVendor(vendor);
    const clave = vendor + '|' + modelo;
    // Cambiar de equipo limpia el buscador y el filtro de tipo: heredarlos haria que la
    // tabla del equipo nuevo apareciera recortada por una busqueda que era del anterior.
    if (cfg._refClave !== clave) { cfg._refFiltro = ''; cfg._refTipo = null; cfg._refClave = clave; }
    if (cacheRefs.has(clave)) { cfg._refs = cacheRefs.get(clave); pintarRefs(cid); return; }
    const caja = cajaRefs(cid);
    if (caja) caja.innerHTML = tituloRefs(cid) + '<p class="ficha-nota">Cargando…</p>';
    fetch(`/api/referencias/${encodeURIComponent(vendor)}/${encodeURIComponent(modelo)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) throw new Error('respuesta no válida');
        cacheRefs.set(clave, d);
        // Puede haber cambiado de equipo mientras llegaba: solo se pinta si sigue siendo el suyo.
        if (estado[cid] && estado[cid].seleccionado === modelo) { estado[cid]._refs = d; pintarRefs(cid); }
      })
      .catch(() => {
        const c = cajaRefs(cid);
        if (c) c.innerHTML = tituloRefs(cid) + '<p class="ficha-nota">No se pudieron cargar las referencias de este equipo.</p>';
      });
  }

  // Una pagina con selector de equipo EXTERNO (Aruba, 2026-09-13) puede pedir que la
  // ficha muestre un equipo que NO esta entre los candidatos: elegirlo a mano para
  // cotizarlo es legitimo, y la alternativa —que la ficha salte al recomendado mientras
  // el selector dice otra cosa— es justo el desajuste que este modulo existe para evitar.
  // `incluir` lo mete en la lista como eleccion deliberada, con su aviso de desvio.
  const conIncluir = (cfg) => (
    cfg.incluir && !(cfg.candidatos || []).some((m) => m.id === cfg.incluir.id)
      ? [cfg.incluir, ...(cfg.candidatos || [])]
      : (cfg.candidatos || [])
  );

  /* ESCALON SUPERIOR (N+1), opt-in `escalon` (2026-10-19, peticion del dueño). En preventa se
     compara el que cumple justo con el siguiente: este indicador dice cual es y cuanto mas da y
     cuesta, SIN tocar la seleccion (ni heredada ni elegida a mano). Ninguna cifra se calcula
     aqui: la metrica y el precio los pone la pagina, y el diferencial es una resta de los dos.
     El N+1 es el candidato recomendable con la menor metrica ESTRICTAMENTE mayor que la del
     equipo de referencia: ocho variantes con la misma cifra no son un escalon. Sin metrica en
     alguno de los dos no hay escalon; sin precio confirmado en los dos, no hay diferencial de
     precio y se dice. */
  function escalonSuperior(candidatos, ref, cfgEsc) {
    if (!cfgEsc || !ref || typeof cfgEsc.metrica !== 'function') return null;
    const v0 = cfgEsc.metrica(ref);
    if (typeof v0 !== 'number' || !Number.isFinite(v0)) return null;
    let mejor = null;
    let vMejor = null;
    for (const m of candidatos || []) {
      if (!m || m.id === ref.id || !recomendable(m)) continue;
      if (cfgEsc.comparable && !cfgEsc.comparable(ref, m)) continue;
      const v = cfgEsc.metrica(m);
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= v0) continue;
      if (vMejor == null || v < vMejor) { mejor = m; vMejor = v; }
    }
    if (!mejor) return null;
    const precio = typeof cfgEsc.precio === 'function' ? cfgEsc.precio : () => null;
    const p0 = precio(ref);
    const p1 = precio(mejor);
    const conPrecio = typeof p0 === 'number' && typeof p1 === 'number' && p0 > 0 && p1 > 0;
    return { modelo: mejor, desde: v0, hasta: vMejor, delta: vMejor - v0, deltaPrecio: conPrecio ? p1 - p0 : null };
  }

  function escalonHtml(e, cfgEsc, ref) {
    if (!e) return '';
    const f = typeof cfgEsc.fmt === 'function' ? cfgEsc.fmt : (v) => String(v);
    const nombre = typeof cfgEsc.nombre === 'function' ? cfgEsc.nombre(ref) : (cfgEsc.nombre || 'capacidad');
    const precio = e.deltaPrecio == null
      ? 'diferencia de precio: sin precio de lista confirmado en los dos'
      : e.deltaPrecio === 0 ? 'mismo precio de lista'
        : `cuesta ${fmtPrecio(Math.abs(e.deltaPrecio))} ${e.deltaPrecio > 0 ? 'más' : 'menos'} de lista`;
    return `<p class="ficha-escalon" role="note">Escalón superior (N+1): <b>${esc(e.modelo.id)}</b> · `
      + `${esc(nombre)} +${esc(f(e.delta))} (${esc(f(e.desde))} → ${esc(f(e.hasta))}) · ${esc(precio)}. `
      + 'Solo informativo: la selección no cambia.</p>';
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

    const lista = conIncluir(cfg);
    const sel = lista.find((m) => m.id === cfg.seleccionado) || lista[0];
    cfg.seleccionado = sel.id;

    const opciones = lista.map((m, i) => {
      const txt = cfg.etiqueta ? cfg.etiqueta(m, i) : m.id;
      const mk = marca(m);
      const oc = opcionCiclo(m);
      // En rojo lo que está o va a estar fuera de venta; la línea anterior conserva su marca en texto.
      const txtMarca = oc.ciclo ? oc.sufijo : (mk ? '  ·  ' + mk.t : '');
      return `<option value="${esc(m.id)}"${oc.attr}${m.id === sel.id ? ' selected' : ''}>`
        + `${esc(txt)}${esc(txtMarca)}${m.id === recomendado ? '  ·  recomendado' : ''}</option>`;
    }).join('');
    const mkSel = marca(sel);

    const medidores = (cfg.medidores ? cfg.medidores(sel) : []).map(medidorHtml).join('');
    const secciones = (cfg.secciones ? cfg.secciones(sel) : []).map(seccionHtml).join('');

    // Apartarse del recomendado es legitimo y por eso existe el desplegable, pero tiene que
    // VERSE: la queja que destapo el trinquete era justamente que la pagina mostraba
    // siempre el mismo equipo sin decir que ya no era el que salia del dimensionamiento.
    const desviado = cfg.deliberada && recomendado && sel.id !== recomendado;

    // `selector:false` (opt-in): la pagina tiene su propio selector de equipo fuera de la
    // ficha — pintar otro aqui seria la duplicacion que la unificacion de Aruba vino a
    // cerrar. El boton de volver al recomendado se mantiene, dentro del aviso de desvio.
    const btnVolver = `<button type="button" class="ficha-volver" id="${cid}-volver">Volver al recomendado</button>`;
    // Lista clicable de candidatos (opt-in `listaCandidatos`, peticion directa del dueno
    // en Aruba, 2026-09-15): el contador «Equipos que cumplen · N» decia CUANTOS eran pero
    // no CUALES, y sin verlos no habia forma de compararlos ni de elegir otro — habia que
    // adivinarlos en un combo de catalogo entero mezclados con los que no cumplen. Cada
    // fila declara modelo, detalle (segmento/capacidad, via `etiquetaCand` o `etiqueta`)
    // y sus marcas (recomendado / fin de venta); el clic elige por el mismo cauce que el
    // desplegable (alCambiar con origen 'candidato'). Con mas de 6, la caja crece con
    // scroll para no comerse la ficha. Sin el flag, esta pagina se pinta igual que antes.
    // Con `panelFijo` la lista NUNCA lleva scroll interno (`.larga`) ni crece sin tope:
    // la petición del dueño (Aruba, 2026-09-16) es que la tarjeta quede clavada y ENTERA
    // a la vista — el único scroll es el de la página, que gobierna la columna de
    // configuración. Cuando cumplen más de 6 (umbral heredado de `.larga`), se muestran
    // los 6 primeros —la comparación de preventa se hace entre los primeros escalones—
    // y un pie honesto declara cuántos más cumplen y dónde verlos (el selector de
    // equipo de la página los lista todos). Sin tope, la tarjeta superaría el viewport
    // y volvería el mismo problema sin scroll que la trajo aquí.
    const TOPE_PANEL_FIJO = 6;
    const visibles = cfg.panelFijo ? lista.slice(0, TOPE_PANEL_FIJO) : lista;
    const listaCands = cfg.listaCandidatos === true
      ? `<div class="ficha-cands${lista.length > 6 && !cfg.panelFijo ? ' larga' : ''}" id="${cid}-cands" role="listbox" aria-label="Equipos que cumplen">`
        + visibles.map((m, i) => {
          const mk = marca(m);
          const det = cfg.etiquetaCand ? cfg.etiquetaCand(m, i) : (cfg.etiqueta ? cfg.etiqueta(m, i) : '');
          return `<button type="button" class="ficha-cand${m.id === sel.id ? ' on' : ''}" data-id="${esc(m.id)}" role="option" aria-selected="${m.id === sel.id}">`
            + `<b>${esc(m.id)}</b><span class="cand-det">${esc(det)}</span>`
            + (m.id === recomendado ? '<span class="cand-badge rec">recomendado</span>' : '')
            + (mk ? `<span class="cand-badge fin">${esc(mk.t)}</span>` : '')
            + '</button>';
        }).join('') + '</div>'
        + (cfg.panelFijo && lista.length > visibles.length
          ? `<p class="ficha-cands-mas">+ ${lista.length - visibles.length} más que también cumplen — el selector de equipo del panel 1 los lista todos.</p>`
          : '')
      : '';
    // Tarjeta gráfica del equipo (opt-in `vistas`, petición directa del dueño en Aruba,
    // 2026-09-16): la foto oficial del modelo seleccionado corona la ficha, con
    // conmutador frontal/trasera cuando el documento de origen publica ambas caras, y
    // pie con tamaño y procedencia. Cambia con cada selección porque pintar() la
    // reconstruye con el `sel` vigente. Si el modelo no tiene foto oficial en el
    // repositorio se DECLARA el hueco — la regla del catálogo prohíbe un «parecido».
    const mapaVistas = cfg.vistas && typeof cfg.vistas === 'object' ? cfg.vistas : null;
    let vistaHtml = '';
    if (mapaVistas) {
      const v = mapaVistas[sel.id];
      // Basta UNA cara: el documento manda. El datasheet de la serie 80F publica una
      // sola figura del 80F/81F y es la de conectores, así que ese modelo entra con
      // `rear` y sin `front`; exigir `front` lo habría dejado sin figura teniendo una
      // oficial, o habría invitado a servirle la del 80F-DSL, que es otro producto.
      if (v && (v.front || v.rear || v.foto)) {
        // La cara que se abre (opt-in `inicial`, Cisco 2026-10-28): en los Meraki de sobremesa el
        // documento llama «Front» a la cara de los LED y los puertos están en la «Back», así que la
        // tarjeta se abre por la de puertos. Sin `inicial` (o si nombra una cara que no hay), la frontal.
        const cara0 = v.inicial && v[v.inicial] ? v.inicial : (v.front ? 'front' : v.rear ? 'rear' : 'foto');
        // Frontal y trasera siempre que la página lo pida (`rearNota`, Huawei 2026-10-14,
        // petición del dueño): sin foto trasera oficial la pestaña existe y dice por qué,
        // en vez de desaparecer y dejar creer que el equipo no tiene trasera. Lo mismo con la
        // frontal (`frontNota`, Cisco 2026-10-28: del ISR 1116-4P la guía dibuja solo la cara del logotipo).
        const sinRear = !!(v.front && !v.rear && v.rearNota);
        const sinFront = !!(!v.front && v.rear && v.frontNota);
        const notas = { front: sinFront ? v.frontNota : null, rear: sinRear ? v.rearNota : null };
        const carasTab = [(v.front || sinFront) && 'front', (v.rear || sinRear) && 'rear', v.foto && 'foto'].filter(Boolean);
        const tabs = carasTab.length > 1
          ? `<div class="ficha-vista-tabs" role="tablist" aria-label="Vistas del equipo">`
            + carasTab.map((c) => `<button type="button" class="ficha-vista-tab${c === cara0 ? ' on' : ''}" data-vista="${c}" role="tab" aria-selected="${c === cara0}">${CARAS[c]}</button>`).join('')
            + '</div>'
          : '';
        const pie = [v.tamano, v.fuente].filter(Boolean).map(esc).join(' · ');
        // La lupa lee lo que necesita del dataset de la figura (frente, reverso, modelo
        // y pie con procedencia): el lightbox es un singleton del documento y NO guarda
        // referencias al DOM de la tarjeta — pintar() la reconstruye con cada render y
        // una referencia guardada quedaría huérfana.
        // Vista previa (opt-in `frontPrev`/`rearPrev`, MikroTik 2026-10-13): la tarjeta pinta
        // una copia ligera con pérdida y la lupa abre el original sin pérdida, que es el que
        // conserva los píxeles del documento. Sin previa, la tarjeta pinta el original.
        const prev = (cara) => v[cara + 'Prev'] || v[cara];
        const pieFoto = v.foto ? [v.tamano, v.fotoFuente].filter(Boolean).join(' · ') : '';
        // La leyenda viaja en el dataset, como el resto de lo que lee la lupa (opt-in
        // `frontLeyenda`/`rearLeyenda`; sin ella, ni tabla ni desplegable).
        const leyAttr = (cara) => (v[cara] && leyendaValida(v[cara + 'Leyenda'])
          ? ` data-leyenda-${cara}="${esc(JSON.stringify(v[cara + 'Leyenda']))}"` : '');
        const ley0 = v[cara0] && leyendaValida(v[cara0 + 'Leyenda']) ? v[cara0 + 'Leyenda'] : null;
        // En la tarjeta clavada (`panelFijo`: Aruba y Juniper) la compacta tiene que caber entera,
        // así que el desplegable no va ahí: la tabla la pinta la lupa, que es donde se pidió.
        const hayLeyenda = !cfg.panelFijo && ['front', 'rear'].some((c) => v[c] && leyendaValida(v[c + 'Leyenda']));
        vistaHtml = `<figure class="ficha-vista" id="${cid}-vista"${v.front ? ` data-front="${esc(v.front)}" data-front-prev="${esc(prev('front'))}"` : ''}${v.rear ? ` data-rear="${esc(v.rear)}" data-rear-prev="${esc(prev('rear'))}"` : ''}${v.foto ? ` data-foto="${esc(v.foto)}" data-foto-prev="${esc(prev('foto'))}" data-pie-foto="${esc(pieFoto)}"` : ''}${leyAttr('front')}${leyAttr('rear')} data-modelo="${esc(sel.id)}" data-pie="${esc(pie)}">`
          + `<div class="ficha-vista-img"><img src="${esc(prev(cara0))}" alt="${ALT_CARA[cara0]}${esc(sel.id)} — pulsa la lupa para ampliar" loading="lazy">`
          + ['front', 'rear'].filter((c) => notas[c]).map((c) => `<p class="ficha-vista-sinrear" data-nota="${c}" hidden>${esc(notas[c])}</p>`).join('')
          + `<button type="button" class="ficha-vista-zoom" aria-label="Ampliar la foto del ${esc(sel.id)} a tamaño completo" title="Ampliar a tamaño completo">${SVG_LUPA}</button></div>`
          + `<div class="ficha-vista-bar">${tabs}<figcaption>${cara0 === 'foto' && pieFoto ? esc(pieFoto) : pie}</figcaption></div>`
          + (hayLeyenda
            ? `<details class="ficha-vista-leyenda"${ley0 ? '' : ' hidden'}><summary>Qué es cada número (${ley0 ? ley0.filas.length : 0})</summary>${ley0 ? tablaLeyenda(ley0, cara0) : ''}</details>`
            : '')
          + `</figure>`;
      } else {
        vistaHtml = `<div class="ficha-vista-vacia">Sin foto oficial de este equipo en el repositorio — manda la ficha técnica de abajo.</div>`;
      }
    }

    // Detalle expandible (opt-in `panelFijo` + `detalleExpandible`, Aruba 2026-09-16):
    // la tarjeta clavada va compacta para caber en el viewport SIN scroll interno, y
    // el porqué, las secciones largas y las referencias se DESPLIEGAN DENTRO de la
    // propia tarjeta con el conmutador «Ver características del equipo ↓» — petición
    // directa del dueño: las características en el mismo cuadro que recomienda el
    // equipo, como estaban antes, sin llevarlo a otra página. Sin el opt-in, el
    // detalle va en línea como siempre (el resto de dimensionadores no cambia).
    const detExp = !!(cfg.panelFijo && cfg.detalleExpandible);
    const detAbierto = detExp && !!estadoDet[cid];
    const escalonVisible = cfg.escalon && sel.id === recomendado
      ? escalonHtml(escalonSuperior(candidatos, sel, cfg.escalon), cfg.escalon, sel) : '';
    const detalleHtml = (detExp
        ? `<h2 class="ficha-det-tit">Características del equipo seleccionado — <b>${esc(sel.id)}</b></h2>` + escalonVisible : '')
      + (cfg.porQue ? `<div class="why">${cfg.porQue(sel)}</div>` : '')
      + secciones
      + (cfg.refsEn ? '' : `<div class="ficha-refs" id="${cid}-refs"></div>`);

    cont.innerHTML = vistaHtml
      + `<p class="tag">Equipos que cumplen`
      + `<span class="ficha-cuenta"> · ${candidatos.length}</span></p>`
      + listaCands
      + (cfg.selector === false ? '' :
        `<div class="ficha-sel"><label for="${cid}-sel">Equipo</label>`
        + `<select id="${cid}-sel">${opciones}</select>`
        + (desviado ? btnVolver : '')
        + '</div>')
      + (desviado ? `<p class="ficha-desvio">Estás viendo un equipo <b>elegido a mano</b>. `
        + `El dimensionamiento propone el <b>${esc(recomendado)}</b>; toda la ficha, el `
        + `resumen y el BOM siguen al que tienes elegido. `
        + (cfg.selector === false ? btnVolver : '') + '</p>' : '')
      + `<p class="model">${esc(cfg.titulo ? cfg.titulo(sel) : sel.id)}`
      + `${sel.id === recomendado ? '<span class="ficha-rec">recomendado</span>' : ''}`
      + `${mkSel ? `<span class="ficha-ref${mkSel.fuera ? ' fuera' : ''}">${esc(mkSel.t)}</span>` : ''}</p>`
      + `<p class="family">${esc(cfg.subtitulo ? cfg.subtitulo(sel) : '')}</p>`
      // Ciclo de vida (pendiente 34): va ANTES del aviso porque responde a otra pregunta —
      // el aviso dice que hacer con el equipo, esto dice en que estado esta. Se pinta siempre
      // que la pagina informe `cicloVida`, incluido el tercer estado: un hueco se lee como
      // «vigente» y eso es justo lo que este pendiente existe para evitar.
      + (cicloVidaVendor || cfg.cicloVida ? `<p class="ficha-ciclo-caja">${cicloHtml(sel, cfg.cicloVida)}</p>` : '')
      + (mkSel ? `<p class="ficha-aviso">${avisoDe(sel)}</p>` : '')
      + medidores
      // N+1 solo junto al recomendado: con otro elegido a mano, la comparacion ya la hizo quien eligio.
      // En la tarjeta clavada (`panelFijo` + detalle) va dentro del detalle: la compacta tiene que
      // caber entera en el viewport, y un parrafo mas la soltaba al llegar al fondo (e2e-sticky).
      + (detExp ? '' : escalonVisible)
      // Conmutador del detalle (2026-09-16): la compacta se paga en no encontrar la
      // información si el detalle no está donde se mira. El enlace declara QUÉ hay y
      // lo despliega en el mismo cuadro; el estado vive en estadoDet para sobrevivir
      // a los repintados, y la página escucha el clic para soltar el sticky y para
      // llevar el estado a la URL (?ficha=abierta).
      + (detExp
        ? `<p class="ficha-salto"><a href="#${cid}-det" id="${cid}-salto" role="button"`
          + ` aria-expanded="${detAbierto}" aria-controls="${cid}-det">`
          + `${detAbierto ? 'Ocultar características ↑' : 'Ver características del equipo ↓'}</a></p>`
          + `<div class="ficha-det" id="${cid}-det"${detAbierto ? '' : ' hidden'}>${detalleHtml}</div>`
        : detalleHtml);
    const salto = document.getElementById(cid + '-salto');
    if (salto && detExp) {
      salto.addEventListener('click', (ev) => {
        ev.preventDefault();
        const abierto = !estadoDet[cid];
        estadoDet[cid] = abierto;
        const det = document.getElementById(cid + '-det');
        if (det) det.hidden = !abierto;
        salto.setAttribute('aria-expanded', String(abierto));
        salto.textContent = abierto ? 'Ocultar características ↑' : 'Ver características del equipo ↓';
      });
    }

    // Sin onchange= en linea: la CSP del sitio prohibe todo codigo inline.
    const nodo = document.getElementById(cid + '-sel');
    if (nodo) {
      nodo.addEventListener('change', () => {
        cfg.seleccionado = nodo.value;
        // Tocar el desplegable es lo unico que convierte una seleccion en deliberada. Ver
        // el comentario de render(): sin esta marca la seleccion heredada se reciclaba y el
        // recomendado no volvia nunca.
        cfg.deliberada = true;
        pintar(cid);
        if (cfg.alCambiar) cfg.alCambiar(nodo.value, 'selector');
      });
    }
    // Clic en la lista de candidatos: el mismo cauce que el desplegable (eleccion
    // deliberada + alCambiar), con origen 'candidato' para que la pagina sepa que viene
    // de la lista y sincronice su selector externo si lo tiene.
    const cajaCands = document.getElementById(cid + '-cands');
    if (cajaCands) {
      cajaCands.querySelectorAll('.ficha-cand').forEach((b) => {
        b.addEventListener('click', () => {
          const id = b.dataset.id;
          if (!id || id === cfg.seleccionado) return;
          cfg.seleccionado = id;
          cfg.deliberada = true;
          pintar(cid);
          if (cfg.alCambiar) cfg.alCambiar(id, 'candidato');
        });
      });
    }
    // Conmutador frontal/trasera de la tarjeta gráfica: solo cambia la foto, no toca la
    // selección ni avisa a la página (vista, no estado). La próxima pintar() —por cambio
    // de equipo o de datos— vuelve a la cara frontal, que es la que el documento oficial
    // presenta primero.
    const vistaNodo = document.getElementById(cid + '-vista');
    if (vistaNodo) {
      const imgNodo = vistaNodo.querySelector('img');
      // Cada cara se mide al cargar: la trasera puede ser apaisada y la frontal no.
      const medir = () => {
        if (imgNodo && imgNodo.naturalWidth) imgNodo.classList.toggle('ficha-vista-alta', imgNodo.naturalHeight > imgNodo.naturalWidth);
      };
      if (imgNodo) { imgNodo.addEventListener('load', medir); if (imgNodo.complete) medir(); }
      vistaNodo.querySelectorAll('.ficha-vista-tab').forEach((tb) => {
        tb.addEventListener('click', () => {
          const cual = tb.dataset.vista;
          const src = vistaNodo.dataset[cual + 'Prev'];
          const zoom = vistaNodo.querySelector('.ficha-vista-zoom');
          if (!imgNodo) return;
          // Sin esa cara oficial: la pestaña enseña el motivo en el sitio de la foto.
          vistaNodo.querySelectorAll('.ficha-vista-sinrear').forEach((nota) => { nota.hidden = !!src || nota.dataset.nota !== cual; });
          imgNodo.hidden = !src;
          if (zoom) zoom.hidden = !src;
          if (src) imgNodo.src = src;
          imgNodo.alt = (ALT_CARA[cual] || ALT_CARA.front) + sel.id;
          // La foto de producto sale de otro documento que los dibujos: su pie lo dice.
          const cap = vistaNodo.querySelector('figcaption');
          if (cap) cap.textContent = cual === 'foto' && vistaNodo.dataset.pieFoto ? vistaNodo.dataset.pieFoto : vistaNodo.dataset.pie;
          // La leyenda es de la cara que se ve: al cambiar de pestaña cambia con ella (y se
          // esconde en la cara sin números), conservando si estaba abierta.
          const det = vistaNodo.querySelector('.ficha-vista-leyenda');
          if (det) {
            const ley = src && (cual === 'front' || cual === 'rear') ? leyendaDe(vistaNodo.dataset, cual) : null;
            det.hidden = !ley;
            if (ley) {
              det.querySelector('summary').textContent = `Qué es cada número (${ley.filas.length})`;
              det.querySelectorAll('.ficha-leyenda-tit, .ficha-leyenda-cols').forEach((x) => x.remove());
              det.insertAdjacentHTML('beforeend', tablaLeyenda(ley, cual));
            }
          }
          vistaNodo.querySelectorAll('.ficha-vista-tab').forEach((x) => {
            const on = x === tb;
            x.classList.toggle('on', on);
            x.setAttribute('aria-selected', on ? 'true' : 'false');
          });
        });
      });
      // Lupa (plan 19): el botón de la esquina y la propia foto abren la vista
      // ampliada a resolución natural. El botón frena la propagación para no
      // disparar dos veces el mismo diálogo.
      const btnZoom = vistaNodo.querySelector('.ficha-vista-zoom');
      if (btnZoom) btnZoom.addEventListener('click', (e) => { e.stopPropagation(); abrirLupa(vistaNodo); });
      if (imgNodo) imgNodo.addEventListener('click', () => abrirLupa(vistaNodo));
    }
    // Salida del modo manual. Sin esto, apartarse del recomendado era una puerta de un solo
    // sentido: habia que acordarse de cual era y volver a buscarlo en una lista de 58.
    const btn = document.getElementById(cid + '-volver');
    if (btn) {
      btn.addEventListener('click', () => {
        cfg.seleccionado = recomendado;
        cfg.deliberada = false;
        pintar(cid);
        if (cfg.alCambiar) cfg.alCambiar(recomendado, 'volver');
      });
    }

    // Las referencias del equipo elegido. Solo si la pagina declara su fabricante: sin el no
    // hay a quien preguntar, y es preferible no pintar la seccion a pintarla vacia.
    // Una pagina puede tener sus referencias integradas en otro componente (Aruba las lleva
    // en la lista de materiales, 2026-09-13): con `refs:false` no se piden, y `refsNota`
    // deja el cartel que dice donde estan, para que la seccion no desaparezca sin explicacion.
    if (cfg.vendor && cfg.refs !== false) cargarRefs(cid, cfg.vendor, sel.id);
    else if (cfg.refsNota) {
      const caja = cajaRefs(cid);
      if (caja) caja.innerHTML = tituloRefs(cid) + '<p class="ficha-nota">' + esc(cfg.refsNota) + '</p>';
    }
  }

  // ── ALIMENTACION ELECTRICA: SI ES DE DOBLE FUENTE Y SUS CARACTERISTICAS ────────────────
  //
  // `m.redund` es el mismo campo que Cisco ya traia (true/false, 100% de su catalogo
  // verificado): se extiende aqui a los otros cinco fabricantes, pero solo donde el propio
  // catalogo lo dice explicitamente — nunca se deduce del tamano o la gama del equipo. Es
  // tres estados, no dos: true (doble fuente confirmada), false (fuente unica confirmada,
  // como en el ISR 1000 o el Catalyst 8200), y ausente/null (el catalogo no lo dice, que es
  // la mayoria de los 190 y tantos modelos de este catalogo). Tratar "no lo dice" como "no
  // tiene" seria inventar un dato negativo, que es tan falso como inventar uno positivo.
  //
  // `m.psu` es opcional y solo aparece donde el catalogo trae ademas la cifra: consumo en
  // vatios, tipo de fuente (AC/DC) o el rango de entrada. Ahora mismo eso es sobre todo
  // Huawei (los "fuentes 1+1 · N W tipicos" de la serie NE8000 y AR8700, transcritos tal
  // cual del propio catalogo) y puntualmente Aruba. El resto queda `null`: no hay una hoja
  // de consumo electrico publicada en el Product Matrix de Fortinet, el datasheet abreviado
  // de MikroTik ni el material de Juniper que ya usa este catalogo — completar esto pediria
  // el datasheet mecanico de cada modelo, no una tabla como las que resuelven npm run cps o
  // npm run juniper.
  function seccionAlimentacion(m) {
    if (!m) return { titulo: 'Alimentación eléctrica', filas: [] };
    const redund = m.redund;
    const psu = m.psu || {};
    // Cuatro estados, no dos. A los tres que ya habia -si, no, y «no lo dice»- se suma
    // 'opcional' (2026-09-03), que aparecio leyendo los datasheets de FortiGate: el 80F y el
    // 90G dicen «Powered by up to 2 External DC Power Adapters (1 adapter included)», o sea
    // que salen de fabrica con una sola fuente pero admiten la segunda. Ninguna de las dos
    // etiquetas anteriores era cierta ahi: «Sí — de serie» promete algo que no viene en la
    // caja, y «No — fuente única» niega una redundancia que el equipo si soporta. Es el mismo
    // motivo por el que existe el tercer estado, aplicado a un caso nuevo.
    // Y 'no-aplica' para lo que no es un equipo: las licencias CHR de MikroTik son software
    // sobre un hipervisor, asi que no tienen fuente ninguna. Dejarlas en «el catalogo no lo
    // especifica» diria que falta un dato que no existe, y es tan enganoso como leer
    // `undefined` como «No»: quien mira la ficha se queda esperando una respuesta.
    const filas = [
      ['Fuente redundante (doble fuente)', redund == null
        ? '<span class="warn">el catálogo no lo especifica</span>'
        : (redund === 'no-aplica'
          ? 'No aplica — es software, la alimentación es la del servidor anfitrión'
          : (redund === 'opcional'
            ? 'Opcional — admite una segunda fuente, no viene de serie'
            : (redund ? 'Sí — de serie' : 'No — fuente única')))],
    ];
    if (psu.watts != null) filas.push(['Consumo típico', `${psu.watts} W`]);
    // La potencia de SALIDA de cada fuente no es lo que consume el equipo: el AR8140 pintaba
    // como consumo los 350 W de cada una de sus fuentes, y su consumo típico es 168. Va en su
    // propia fila y con otro rótulo (2026-10-06). Es la cifra con la que se comprueba que la
    // fuente que pide el BOM es la del equipo.
    if (Array.isArray(psu.salida) && psu.salida.length) {
      filas.push(['Potencia de salida de cada fuente',
        psu.salida.map((s) => `${esc(String(s.w))} W${s.tipo ? ' ' + esc(s.tipo) : ''}`).join(' · ')]);
    }
    if (psu.tipo) filas.push(['Tipo de fuente', esc(psu.tipo)]);
    if (psu.volts) filas.push(['Rango de entrada', esc(psu.volts)]);
    if (psu.amps) filas.push(['Corriente', esc(psu.amps)]);
    const nota = psu.texto
      ? esc(psu.texto)
      : (redund == null ? 'Confirmar en el datasheet del fabricante antes de comprometerlo en la propuesta.' : undefined);
    return { titulo: 'Alimentación eléctrica', filas, nota };
  }


  /* == CRIPTOGRAFIA POST-CUANTICA (2026-10-27, encargo del dueño) ============
     Los fabricantes llaman «quantum-safe» a tres cosas distintas, y la ficha no las mezcla:
       · `mlkem`: un algoritmo post-cuántico estandarizado (ML-KEM, FIPS 203) en el intercambio
         de claves (Cisco Secure Router G2 con IOS XE 26.1, FortiGate con FortiOS 7.6.1);
       · `ppk`: claves precompartidas post-cuánticas mezcladas en IKEv2 (RFC 8784): resisten a un
         ordenador cuántico, pero no son un algoritmo PQC (Juniper SRX de gama alta);
       · `macsec`: MACsec/ANYsec con clave precompartida «quantum-safe», cifrado simétrico (Nokia
         7750 SR).
     Sin `pqc`, «no consta»: ningún documento del catálogo lo dice, que no es lo mismo que «no
     tiene» (la misma regla que la alimentación). */
  const PQC_TIPO = {
    mlkem: 'Sí — algoritmo post-cuántico ML-KEM (FIPS 203)',
    ppk: 'Resistencia cuántica por clave precompartida (PPK, RFC 8784): no es un algoritmo post-cuántico',
    macsec: 'MACsec/ANYsec «quantum-safe» (cifrado simétrico con clave precompartida): no es un algoritmo post-cuántico',
  };
  // El documento de la PQC, por la URL de su entrada en fuentes.js (`urls`, 2026-10-28): la prueba
  // exige que cada una sea una fuente que el vigía mira. Solo https; lo demás no se enlaza.
  function filaDocumentos(urls) {
    const L = (Array.isArray(urls) ? urls : []).filter((u) => /^https:\/\/[^\s"<>]+$/.test(String(u)));
    if (!L.length) return null;
    const a = (u, txt) => `<a href="${esc(u)}" target="_blank" rel="noopener">${txt}</a>`;
    return L.length === 1 ? ['Documento oficial', a(L[0], 'abrir el documento')]
      : ['Documentos oficiales', L.map((u, i) => a(u, `documento ${i + 1} de ${L.length}`)).join(' · ')];
  }
  function seccionPqc(m) {
    const titulo = 'Criptografía post-cuántica (PQC)';
    const p = m && m.pqc;
    // Un «no» con su documento (`pqcNo`, 2026-10-28) no es un «no consta»: se dice con su fuente.
    const no = m && !p && m.pqcNo;
    if (no && no.motivo && no.fuente) {
      const filas = [['Soporte', '<span class="warn">no la trae</span>'], ['Motivo', esc(no.motivo)]];
      const doc = filaDocumentos(no.urls);
      if (doc) filas.push(doc);
      return { titulo, filas, nota: 'Un documento oficial dice que este equipo no la trae. Fuente: ' + esc(no.fuente) + '.' };
    }
    if (!p || !PQC_TIPO[p.tipo]) {
      return { titulo, filas: [['Soporte', '<span class="warn">no consta</span>']],
        nota: 'Ningún documento oficial del catálogo dice que este equipo la traiga; eso no prueba que no la tenga. Confirmarlo con el fabricante antes de comprometerlo en la propuesta.' };
    }
    const filas = [
      ['Soporte', esc(PQC_TIPO[p.tipo])],
      ['Mecanismo', esc(p.mecanismo)],
      ['Dónde', esc(p.donde)],
      ['Software', p.desde ? esc(p.desde) + ' o superior' : '<span class="warn">la fuente no da la versión</span>'],
    ];
    if (p.alcance) filas.push(['Alcance', esc(p.alcance)]);
    const doc = filaDocumentos(p.urls);
    if (doc) filas.push(doc);
    return { titulo, filas, nota: 'Fuente: ' + esc(p.fuente) + '.' };
  }

  /* == SEMAFORO DE CICLO DE VIDA (pendiente 34) ==============================
     Vivia SOLO en la pagina de Aruba, y su rama por defecto era VERDE: cualquier modelo que
     no estuviera marcado `eol` ni `legacy` salia como «Generacion actual». Portarlo tal cual a
     los siete habria afirmado «se puede pedir» sobre 131 modelos que nadie ha comprobado — el
     mismo error que el «IPS: no aplica» del Catalyst 8300, y mas caro, porque lo que se afirma
     delante de un cliente es que el equipo esta a la venta.

     LA AUSENCIA DE UN BOLETIN NO ES PRUEBA DE VIGENCIA. Solo lo es si alguien mira los
     boletines de ese fabricante, y eso lo declara el servidor en `cicloVida.respaldado` a
     partir de las `campos` de `legacyData/fuentes.js` (hoy: Cisco y Juniper). Sin respaldo, el
     estado es el TERCER ESTADO — el mismo que protege `redund`— y nunca verde.

     CINCO ESTADOS, y dos de ellos la version de Aruba fundia en uno:
       rojo   · fuera de venta: `eol`, o `lastOrder` YA VENCIDO
       rojo   · fuera de venta sin fecha publicada en el catalogo (`eol` binario)
       ambar  · fin de venta ANUNCIADO y todavia pedible (hasta `lastOrder`)
       ambar  · linea anterior (`legacy`)
       verde  · vigente SEGUN un boletin fechado — se nombra cual y de cuando
       gris   · el catalogo no trae el ciclo de vida de este fabricante
     La copia de Aruba pintaba de rojo «Fin de venta — ultimo pedido X» tanto si la fecha habia
     pasado como si no, y hasta esa fecha el equipo SE PIDE CON NORMALIDAD. `rango()` ya hacia
     esa distincion; el semaforo no. Ahora los dos leen la misma regla.

     `cicloVida` es opcional: una pagina que no lo pase obtiene el tercer estado, que es lo
     correcto cuando no consta — nunca verde por omision. */
  const CICLO = {
    fuera:     { cls: 'rojo',  n: 'Fuera de venta' },
    anunciado: { cls: 'ambar', n: 'Fin de venta anunciado' },
    anterior:  { cls: 'ambar', n: 'Linea anterior' },
    vigente:   { cls: 'verde', n: 'Vigente' },
    sinDato:   { cls: 'gris',  n: 'Sin dato de ciclo de vida' },
  };
  function cicloDeVida(m, cicloVida) {
    if (cicloVida === undefined) cicloVida = cicloVidaVendor;
    if (!m) return { estado: 'sinDato', ...CICLO.sinDato, detalle: 'sin equipo seleccionado' };
    const eos = m.eolAnnounced;
    if (eos && eos.lastOrder && eosVencido(m)) {
      return { estado: 'fuera', ...CICLO.fuera,
        // 2026-09-16 (peticion del dueño: «resalta si hay equipos con esta condicion»):
        // el fin de soporte del boletin se suma aqui — es el dato que salva la renovacion
        // del parque instalado. Opt-in como en avisoDe(): solo lo dicen los modelos que
        // lo traen; los demas no cambian.
        detalle: 'su fecha de ultimo pedido (' + eos.lastOrder + ') ya paso'
          + (eos.endOfSupport ? ' · soporte del fabricante hasta el ' + eos.endOfSupport : '')
          // B1 (2026-09-24): un equipo fuera de venta sin reemplazo a la vista deja a quien
          // amplia el parque sin salida. El del boletin manda; si el boletin no lo nombra, la
          // inferencia por capacidad se muestra ROTULADA como tal, nunca como oficial.
          + (eos.sucesor ? ' · sucesor: ' + eos.sucesor
            : m.sucesor ? ' · sucesor natural: ' + m.sucesor + ' (inferencia por capacidad, sin doc oficial)' : '') };
    }
    if (m.eol) {
      // El sucesor inferido viaja tambien aqui (B1): los AOS 8 de Aruba que HPE retiro sin
      // fecha (2026-10-06) lo mostraban mientras eran linea anterior, y no pueden perderlo
      // justo al dejar de venderse.
      return { estado: 'fuera', ...CICLO.fuera,
        detalle: 'el catalogo no trae la fecha de ultimo pedido'
          + (m.sucesor ? ' · sucesor natural: ' + m.sucesor + ' (inferencia por capacidad, sin doc oficial)' : '') };
    }
    if (eos && eos.lastOrder) {
      return { estado: 'anunciado', ...CICLO.anunciado,
        detalle: 'se pide con normalidad hasta el ' + eos.lastOrder
          + (eos.sucesor ? ' · sucesor: ' + eos.sucesor : '') };
    }
    if (m.legacy) {
      return { estado: 'anterior', ...CICLO.anterior,
        detalle: 'sigue en canal para ampliar parque instalado'
          + (m.sucesor ? ' · sucesor natural: ' + m.sucesor + ' (inferencia por capacidad, sin doc oficial)' : '') };
    }
    // AQUI ESTA EL PENDIENTE 34. Antes esta rama devolvia verde siempre.
    if (cicloVida && cicloVida.respaldado) {
      return { estado: 'vigente', ...CICLO.vigente,
        detalle: 'sin boletin de fin de venta en ' + (cicloVida.fuente || 'la fuente declarada')
          + (cicloVida.fecha ? ' (' + cicloVida.fecha + ')' : '') };
    }
    return { estado: 'sinDato', ...CICLO.sinDato,
      detalle: (cicloVida && cicloVida.motivo) || 'ninguna fuente declarada respalda el fin de venta de este fabricante' };
  }
  // Una linea lista para pintar. `esc` se aplica aqui y no en quien llama, para que no haya
  // una copia que se olvide de escapar — el detalle lleva dentro nombres del catalogo.
  function cicloHtml(m, cicloVida) {
    const c = cicloDeVida(m, cicloVida);
    return '<span class="ficha-ciclo ciclo-' + c.cls + '"><i></i>' + esc(c.n) + '</span>'
      + '<span class="ficha-ciclo-det">' + esc(c.detalle) + '</span>';
  }

  /* == CONFIGURACION DE PUERTOS (pendiente 35) ===============================
     LA REGLA LA APORTA NOKIA, NO ARUBA. `legacyData/nokia.js` es el unico catalogo de los
     ocho que modela los puertos como DATO y no como texto, y lo hace con dos reglas que
     salieron de estructurar material comercial y que ningun otro fabricante tenia resueltas:

       1. LAS CONFIGURACIONES SON ALTERNATIVAS, NO ACUMULABLES. «36x100GE o 12x400GE» nunca
          son 48 interfaces: el equipo se pide en UNA de ellas. Sumarlas prometeria una
          densidad que no existe.
       2. UN CHASIS MODULAR NO PUBLICA DENSIDAD. «7 slots IOM» dice cuantas tarjetas caben,
          no cuantos puertos salen — eso depende de las tarjetas que se pidan, y este
          catalogo no tiene el catalogo de tarjetas. Se aparta CON SU MOTIVO en vez de
          colarse con una densidad inventada.

     Por que sube aqui: el flujo de `docs/portabilidad-aruba.md` no es «Aruba enseña a los
     siete», es que la capa comun es algo A LO QUE CADA FABRICANTE APORTA LO QUE YA RESOLVIO.
     Vivia dentro de dimensionador-nokia-7750sr.js y por tanto no la veia nadie mas.

     QUE VEN LOS OTROS SEIS, Y POR QUE NO ES UN PANEL VACIO. Sus catalogos traen los puertos
     como texto libre (`ports` en Cisco/Huawei/MikroTik, `ifaces` en Fortinet/Juniper/Aruba):
     se muestran, y la ficha DECLARA que no estan estructurados y que por eso no se puede
     comprobar densidad contra un requerimiento. Eso no es un hueco: es la diferencia entre
     «este equipo no tiene puertos» y «el catalogo no sabe contarlos», que es justo la
     distincion que este repositorio protege en `redund` y en el comparador.

     NO AUDITA NADA CONTRA UN ESCENARIO. La auditoria de Aruba (cuantos enlaces declarados
     caben en el chasis) responde OTRA pregunta y se queda en su pagina: esto describe lo que
     el equipo tiene. Mezclarlas habria metido un motor de calculo en un modulo de
     presentacion, que es lo que el pendiente pedia no hacer. */
  // El titulo va CON TILDE: es texto visible, y en este repositorio los comentarios van en
  // ASCII pero lo que lee una persona va en español correcto. Lo cazo el contraste de Nokia
  // al mover la regla, que es justo para lo que existe.
  const PUERTOS_TIT = 'Configuración de puertos';
  // Un grupo de puertos en cualquiera de las dos formas del catalogo, o null si no trae una
  // cantidad y una velocidad que sean numeros: el null es lo que impide pintar «undefined».
  function grupoPuertos(p) {
    if (!p || typeof p !== 'object') return null;
    const cantidad = p.cantidad != null ? p.cantidad : p.n;
    const veloc = p.veloc != null ? p.veloc : p.vel;
    if (!(Number.isFinite(cantidad) && cantidad > 0 && Number.isFinite(veloc) && veloc > 0)) return null;
    return { cantidad, veloc, uso: p.uso || null, medios: Array.isArray(p.medios) && p.medios.length ? p.medios : null,
      rotulo: typeof p.rotulo === 'string' && p.rotulo ? p.rotulo : null };
  }
  function seccionPuertos(m) {
    if (!m) return { titulo: PUERTOS_TIT, filas: [] };
    // 1 · Configuraciones alternativas (Nokia 7250 IXR / 7750 SR).
    if (Array.isArray(m.configs) && m.configs.length) {
      const varias = m.configs.length > 1;
      return {
        titulo: PUERTOS_TIT,
        filas: m.configs.map((c, i) => [
          varias ? 'Opción ' + (i + 1) + ' de ' + m.configs.length + ' · «' + c.n + '»' : '«' + c.n + '»',
          (c.puertos || []).map((p) => p.cantidad + ' × ' + p.veloc + 'GE').join(' + '),
        ]),
        nota: varias
          ? 'Son <b>alternativas, no acumulables</b>: el equipo se pide en una de ellas —'
            + m.configs.map((c) => '«' + esc(c.n) + '»').join(' <b>o</b> ') + '— y nunca en varias a la vez.'
          : null,
      };
    }
    // 2 · Puertos estructurados de un equipo fijo. El catalogo tiene DOS formas y las dos son
    // dato: la del Nokia 7220 IXR ({cantidad, veloc, uso}) y la de Fortinet ({n, vel, medios},
    // etapa 7), que anade el medio y el «Shared Port Pair». Leer la de Fortinet con las claves
    // de Nokia pinto «Puertos undefined × undefinedGE» en 17 FortiGate durante nueve dias; lo
    // encontro el recorrido de valores limite el 2026-10-02. Por eso un grupo que no se deja
    // leer no se pinta a medias: la seccion cae al texto libre de abajo.
    if (Array.isArray(m.puertos) && m.puertos.length) {
      const grupos = m.puertos.map(grupoPuertos);
      if (grupos.every(Boolean)) {
        const compartidos = grupos.some((g) => g.medios && g.medios.length > 1);
        return {
          titulo: PUERTOS_TIT,
          filas: grupos.map((g) => [
            g.uso ? 'Puertos de ' + esc(g.uso) : g.medios && g.medios.length > 1 ? 'Puertos de medio compartido' : 'Puertos',
            g.cantidad + ' × ' + g.veloc + 'GE' + (g.medios ? ' ' + g.medios.map(esc).join(' o ') : '')
              + (g.rotulo ? ' (' + esc(g.rotulo) + ')' : ''),
          ]),
          // Un par compartido es UN puerto con dos medios: se usa con uno o con el otro, nunca
          // con los dos. Es la misma regla que las configuraciones alternativas de arriba.
          nota: compartidos
            ? 'Un puerto de <b>medio compartido</b> («Shared Port Pair») se usa con uno solo de sus medios'
              + ' a la vez, así que cuenta una sola vez.'
            : null,
        };
      }
    }
    // 3 · Chasis modular: se publica lo que cabe, NO lo que sale.
    if (m.slots) {
      return {
        titulo: PUERTOS_TIT,
        filas: [['Slots', m.slots.cantidad + ' × ' + esc(m.slots.tipo)
          + (m.slots.hasta ? ', interfaces de hasta ' + m.slots.hasta + 'GE' : '')]],
        nota: '<span class="warn">' + esc(m.notaPuertos
          || 'chasis modular: los slots dicen cuántas tarjetas caben, no cuántos puertos salen.')
          + '</span>',
      };
    }
    // 4 · UNA NOTA EXPLICITA DEL CATALOGO GANA AL TEXTO LIBRE. El 7250 IXR-e publica
    // velocidades pero no densidad y lo dice en `notaPuertos`; su `ifaces` es texto comercial.
    // Pintar ese texto como una fila «Interfaces» al lado de la nota lo haria leer como una
    // densidad, que es justo lo que la nota niega. Quien declara, manda.
    if (m.notaPuertos) {
      return { titulo: PUERTOS_TIT, filas: [], nota: '<span class="warn">' + esc(m.notaPuertos) + '</span>' };
    }
    // 5 · El resto de los catalogos: texto libre. Se muestra Y SE DECLARA como tal.
    const texto = m.ifaces || m.ports;
    if (texto) {
      return {
        titulo: PUERTOS_TIT,
        filas: [['Interfaces', esc(texto)]],
        // «De este equipo» y no «de este fabricante»: desde la etapa 7 hay FortiGate con los
        // puertos estructurados y otros sin ellos, asi que ya no es una propiedad de la marca.
        nota: 'El catálogo trae los puertos de este equipo <b>como texto</b>, no como dato'
          + ' estructurado, así que no se puede contrastar la densidad contra un requerimiento.',
      };
    }
    // 6 · Tercer estado. Ni afirma que no tenga puertos ni inventa una densidad.
    return {
      titulo: PUERTOS_TIT,
      filas: [],
      nota: '<span class="warn">el catálogo no trae la densidad de este equipo</span>',
    };
  }
  const API = {
    // La regla se expone para que las cinco paginas ordenen y elijan con el mismo criterio
    // en vez de reimplementarlo cada una a su manera, que es como se llego a tres.
    rango,
    recomendable,
    marca,
    cicloOpcion,
    opcionCiclo,
    cicloDeVida,
    cicloHtml,
    seccionPuertos,
    // La pagina lo llama una vez, con el `cicloVida` que le devuelve /api/dimensionador/<v>.
    // Quien no lo llame no pinta nada: es lo correcto: un hueco no afirma vigencia, y una
    // linea en gris sin que nadie haya decidido mostrarla seria ruido.
    fijarCicloVida(datos) { cicloVidaVendor = datos || null; },
    seccionAlimentacion,
    seccionPqc,
    escalonSuperior,
    // Ordena dejando primero lo vigente y al final lo que esta fuera de venta, conservando
    // el criterio propio de cada pagina (capacidad, precio, medio) como desempate.
    ordenar(lista, desempate) {
      return [...lista].sort((a, b) => rango(a) - rango(b) || (desempate ? desempate(a, b) : 0));
    },
    // El recomendado es el primero que se pueda proponer; `preferir` es el criterio de la
    // pagina (segmento, medio...). Nunca devuelve un equipo fuera de venta.
    recomendar(lista, preferir) {
      const vivos = lista.filter(recomendable);
      return (preferir && vivos.find(preferir)) || vivos[0] || null;
    },
    render(cfg) {
      const cid = cfg.contenedor;
      const previo = estado[cid];
      // ── ELEGIDO A MANO NO ES LO MISMO QUE HEREDADO ────────────────────────
      //
      // Aqui vivia un trinquete. La regla era "conservar la seleccion mientras ese equipo
      // siga cumpliendo", y como cumplir es capacidad >= requerimiento, un equipo grande
      // cumple para TODO requerimiento menor. Resultado medido en el navegador: eliges un
      // 7121F a 20 Gbps, bajas a 50 Mbps y sigue proponiendo el 7121F mientras el
      // recomendado es un 30G. La seleccion solo podia subir, nunca bajar.
      //
      // Y lo peor no era la eleccion manual: era que NO SE DISTINGUIA de la heredada. La
      // seleccion que el propio modulo habia dejado en el render anterior se reciclaba con
      // el mismo criterio, asi que el recomendado solo aparecia en el primerisimo render de
      // la pagina. En un barrido limpio de caudal el equipo ya salia desalineado en la
      // primera lectura. Es exactamente el sintoma de "siempre muestra el mismo equipo".
      //
      // La distincion es la correccion: solo persiste lo que alguien eligio de verdad —el
      // desplegable, o una reposicion desde la URL o el almacenamiento, que tambien es una
      // eleccion de alguien—. Lo heredado sigue siempre al recomendado. La funcion que
      // justificaba conservar la eleccion (comparar el que cumple justo con el siguiente
      // escalon) se mantiene intacta, y ahora tiene salida: `ficha-volver`.
      let sel;
      let deliberada;
      if (cfg.seleccionado) {
        sel = cfg.seleccionado;
        deliberada = true;
      } else if (previo && previo.deliberada) {
        sel = previo.seleccionado;
        deliberada = true;
      } else {
        sel = cfg.recomendado;
        deliberada = false;
      }
      // Si deja de cumplir al mover un parametro se vuelve al recomendado, en vez de dejar
      // en pantalla la ficha de un equipo que ya no sirve. La lista de la pagina puede
      // incluir un elegido a mano fuera de los candidatos (`incluir`): ese si se conserva.
      if (!conIncluir(cfg).some((m) => m.id === sel)) {
        sel = cfg.recomendado;
        deliberada = false;
      }
      estado[cid] = Object.assign({}, cfg, { seleccionado: sel, deliberada });
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
