'use strict';
/* global window */
/* Lo que comparten las baterías que comparan el resultado en línea con el del botón «Actualizar»
   (`e2e-campos-en-linea.js`, `e2e-arranque.js`): las nueve páginas, el escenario de partida y cómo
   se lee el texto de la columna de resultados. Un solo sitio: si una página cambia de rejilla, las
   dos baterías leen lo mismo. No empieza por `e2e-`, así que el runner no lo lanza solo. */

const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7220ixr', 'nokia-7750sr', 'starlink-leo'];

// El escenario de partida: sin caudal, casi todas las páginas dicen «sin candidato» y casi ningún
// campo tiene nada que mover (la primera medición en CI, 2026-10-29: 29 de 38 campos de Cisco «sin
// efecto»). Con un caudal típico de sucursal, cada campo tiene un resultado que cambiar.
const PREPARAR = {
  'aruba-edgeconnect': [['#users', '300'], ['.wan-fila input[data-campo=down]', '500']],
  'cisco-catalyst8k': [['#bw', '500']],
  'huawei-netengine': [['#bw', '500']],
  'juniper-srx': [['#bw', '500']],
  'mikrotik-routeros': [['#bw', '500']],
  'nokia-7750sr': [['#bw', '100']],
};

// El texto de los resultados: la segunda columna (y siguientes) de cada rejilla visible y el panel de
// resultados de Starlink, sin el panel de funciones activadas (dice cuántos puntos cambiaron con el
// último evento, que no es parte del cálculo) ni la barra del botón.
const leerResultados = (page) => page.evaluate(() => {
  const d = window.document;
  const partes = [];
  const tomar = (el) => {
    if (!el.checkVisibility()) return;
    const c = el.cloneNode(true);
    c.querySelectorAll('.funciones-activas, .barra-actualizar, script, style').forEach((x) => x.remove());
    partes.push(c.textContent.replace(/\s+/g, ' ').trim());
  };
  d.querySelectorAll('.cols, .dim').forEach((g) => [...g.children].slice(1).forEach(tomar));
  d.querySelectorAll('.results-panel').forEach(tomar);
  return partes.join(' ‖ ');
});

// Salir del campo (el `change` del navegador). Por el foco y no por el elemento: una página que
// rehace su fila al escribir (el builder de enlaces) ya lo cambió por otro.
const salir = (page) => page.evaluate(() => { const a = window.document.activeElement; if (a && a !== window.document.body) a.blur(); });

// La primera diferencia entre dos textos, con contexto, para que el aviso diga qué se quedó atrás.
function diferencia(b, c) {
  let i = 0;
  while (i < b.length && b[i] === c[i]) i += 1;
  return `«…${b.slice(Math.max(0, i - 30), i + 50)}…» / con el botón «…${c.slice(Math.max(0, i - 30), i + 50)}…»`;
}

module.exports = { PAGINAS, PREPARAR, leerResultados, salir, diferencia };
