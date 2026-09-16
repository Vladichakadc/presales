'use strict';
/* CASO: la auditoria de puertos de Nokia sube al modulo compartido sin cambiar lo que dice
 * (pendiente 35, 2026-09-16).
 *
 * `seccionPuertos()` vivia dentro de dimensionador-nokia-7750sr.js, y ahi tenia el defecto
 * que el pendiente describe: es la mejor de las ocho y no la ve nadie mas. Al subirla a
 * `ficha.js` hay que probar que la pagina que ya la tenia sigue diciendo EXACTAMENTE lo
 * mismo — un refactor que cambia un texto en silencio es indistinguible de uno que rompe.
 *
 * Los escenarios cubren los tres casos que la regla distingue, que es lo que la hace valiosa:
 *   · un equipo con VARIAS configuraciones alternativas (el «o» y el «no acumulables»);
 *   · uno con UNA sola (sin la nota de alternativas, que ahi seria ruido);
 *   · un chasis modular SIN densidad publicada (la nota literal del catalogo).
 *
 * LINEA BASE LEIDA DE LA PAGINA ANTES DE MOVER NADA. Se compara el texto normalizado de la
 * seccion, no su HTML: lo que no puede cambiar es lo que una persona lee delante de un
 * cliente, no si un <b> se movio de sitio.
 */
const BASE_LINEA = [
  {
    n: '7750 SR-1s · dos configuraciones alternativas',
    plat: 'sr', modelo: '7750 SR-1s',
    puertos: 'Configuración de puertosOpción 1 de 2 · «36x100GE»36 × 100GEOpción 2 de 2 · «12x400GE»12 × 400GESon alternativas, no acumulables: el equipo se pide en una de ellas —«36x100GE» o «12x400GE»— y nunca en varias a la vez.',
  },
  {
    n: '7250 IXR-10e · una sola configuracion',
    plat: 'ixr', modelo: '7250 IXR-10e',
    puertos: 'Configuración de puertos«36x400GE»36 × 400GE',
  },
  {
    n: '7750 SR-7s · chasis modular sin densidad publicada',
    plat: 'sr', modelo: '7750 SR-7s',
    puertos: 'Configuración de puertosSlots7 × IOM, interfaces de hasta 400GEChasis modular de 7 slots IOM con interfaces de hasta 400GE. La densidad depende de que IOM se pida.',
  },
];

module.exports = {
  // Medida leyendo la pantalla ANTES de mover la regla a ficha.js, en la misma sesion.
  medidoEn: { commit: '368b370~1', fecha: '2026-09-16' },
  nombre: 'Nokia SR/IXR — la auditoria de puertos al subir al modulo compartido',
  pagina: 'dimensionador-nokia-7750sr.html',
  claves: ['puertos'],
  baseLinea: BASE_LINEA,

  // El escenario aqui no es un caudal: es «mira la ficha de ESTE modelo». Se elige en el
  // desplegable de candidatos, que es la via por la que un usuario llega a esa ficha.
  async preparar(p, e, { pausa }) {
    // La plataforma es un grupo `.seg` de botones (Cisco y Nokia acotan la plataforma ANTES
    // que el caudal), no un <select>: se pulsa el boton de su `data-v`.
    await p.click(`#platSeg button[data-v="${e.plat}"]`);
    await pausa(p, 400);
    // Un caudal bajo deja dentro a todos los candidatos de la plataforma.
    const bw = await p.$('#bw');
    if (bw) { await p.fill('#bw', '100'); await p.dispatchEvent('#bw', 'input'); await pausa(p, 500); }
    await p.selectOption('#verdict-sel', e.modelo);
    await pausa(p, 500);
  },

  async leer(p) {
    // Se lee la SECCION por su titulo, no por su posicion: anclar en «la tercera tabla» se
    // rompe en cuanto alguien añade una seccion, y se rompe en silencio.
    const t = await p.$$eval('#verdict .ficha-sec, #verdict-detalle .ficha-sec, .ficha-sec',
      (nodos) => nodos.map((n) => n.textContent.replace(/\s+/g, ' ').trim())
        .find((x) => /^Configuraci[oó]n de puertos/.test(x)) || null);
    return { puertos: t };
  },
};
