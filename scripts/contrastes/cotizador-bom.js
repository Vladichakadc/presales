'use strict';
/* CASO: la cotizacion que sale de un dimensionador es SU BOM, entero y una sola vez (A6,
 * 2026-09-18).
 *
 * POR QUE ES UN CONTRASTE Y NO UNA PRUEBA DE `npm run verificar`. Las pruebas de
 * `test/bom-traspaso.test.js` fijan que `bom.js` construye bien la cola de entrada, y eso se
 * comprueba en segundos sin navegador. Lo que NO pueden ver es la otra mitad del viaje: que
 * el cotizador ingiera esa cola sin duplicar ni fundir lineas. Ahi vivian los dos fallos que
 * este caso existe para que no vuelvan, los dos medidos en Chromium ese dia:
 *   · toda cotizacion empezada desde un dimensionador salia al DOBLE, porque la fusion con
 *     el BOM restaurado se ejecutaba tambien cuando no habia nada que restaurar y cada linea
 *     se encontraba a si misma (un FortiGate 200G llegaba con cantidad 2, $22.954);
 *   · cotizar un segundo equipo fundia su licencia dentro de la del primero, porque la
 *     identidad de una linea se tomaba de `model`, y «Enterprise Protection» es el mismo
 *     texto en un 30G que en un 200G.
 * Los dos son fallos de DINERO en el documento que se pone delante de un cliente, y los dos
 * son invisibles desde `curl` y desde una funcion pura.
 *
 * LA LINEA BASE NO LLEVA NI UNA CIFRA DEL CATALOGO, A PROPOSITO. Escribir aqui «$38.088,20»
 * haria que este caso se pusiera rojo en cada cambio de precio, que es como se enseña a la
 * gente a ignorar un rojo (la misma razon por la que `pantallas.yml` no compara «3,1 Gbps»).
 * Lo que se declara es la RELACION, que no depende del catalogo: el total de la cotizacion
 * tiene que ser el del BOM, y el hardware tiene que aparecer una sola vez. Las cifras se leen
 * de la pantalla en cada corrida y solo salen impresas cuando no cuadran.
 */

// Lee el total y el numero de lineas del BOM de un dimensionador. Se ancla en el texto
// «TOTAL» de la tabla que pinta `bom.js`, que es lo que una persona lee.
async function totalBom(p) {
  // `$eval` y no `evaluate`: estos scripts corren bajo el lint de Node, donde `document` no
  // existe (misma razon por la que se reescribio asi el contraste de Fortinet). El nodo llega
  // como argumento y de el cuelga todo lo que hace falta.
  return p.$eval('#bomTabla', (t) => {
    const fila = t.querySelector('tr.bom-total');
    const celdas = fila ? [...fila.querySelectorAll('td')] : [];
    const m = celdas.length
      ? (celdas[celdas.length - 1].textContent.match(/\$\s?([\d.,]+)/) || [])[1] : null;
    const filas = [...t.querySelectorAll('tbody tr')]
      .filter((tr) => !tr.classList.contains('bom-grupo') && !tr.classList.contains('bom-total'));
    return { total: m || null, lineas: filas.length };
  }).catch(() => null);
}

// El total de la cotizacion y con que cantidad figura el equipo. La cantidad se lee del campo
// numerico de su fila: el fallo del doble NO cambiaba el numero de lineas, cambiaba la
// cantidad, asi que contar filas no lo habria visto.
async function totalCotizacion(p, modelo) {
  return p.$eval('body', (body, mod) => {
    const norm = (s2) => String(s2 || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      .replace(/^(juniper|aruba|netengine|cisco|fortinet|mikrotik|nokia|huawei)/, '') || String(s2 || '');
    const m = body.innerText.replace(/\s+/g, ' ').match(/TOTAL REF\. USD ~?\s?\$\s?([\d.,]+)/i);
    let cantidadEquipo = null;
    for (const tr of body.querySelectorAll('table tbody tr')) {
      const celdas = [...tr.querySelectorAll('td')];
      if (celdas.length < 5) continue;
      if (norm(celdas[1].textContent.trim()) !== norm(mod)) continue;
      const campo = tr.querySelector('.qty-val');
      cantidadEquipo = campo ? Number(campo.textContent.trim()) : null;
    }
    return { total: m ? m[1] : null, cantidadEquipo };
  }, modelo);
}

const num = (s) => (s == null ? null : Number(String(s).replace(/,/g, '')));

module.exports = {
  // Medida conduciendo las dos pantallas en Chromium sobre este commit. A diferencia de los
  // otros casos, lo que se fija no es una cifra de ANTES sino una RELACION que tiene que
  // valer siempre, asi que no envejece con el catalogo — pero la fecha dice cuando se
  // comprobo por ultima vez que el arnes sabe leer estas dos pantallas.
  medidoEn: { commit: '024b723', fecha: '2026-09-18' },
  nombre: 'Dimensionador -> cotizador — la cotizacion es el BOM entero, y una sola vez',
  pagina: 'dimensionador-fortinet-fortigate.html',
  claves: ['cotizacionIgualAlBom', 'equipoUnaVez'],
  baseLinea: [
    { n: 'FortiGate de campus (2.500 Mbps) — envio limpio',
      mbps: 2500, doble: false, cotizacionIgualAlBom: 'sí', equipoUnaVez: 'sí' },
    { n: 'Dos equipos distintos en la misma cotizacion — sus licencias no se funden',
      mbps: 2500, doble: 200, cotizacionIgualAlBom: 'sí', equipoUnaVez: 'sí' },
  ],

  async preparar(p, e, { pausa }) {
    // Se empieza con el navegador vacio: lo que este caso mide es un viaje completo, y una
    // cotizacion guardada de antes lo convertiria en otra cosa sin avisar.
    await p.evaluate(() => { try { globalThis.localStorage.clear(); } catch { /* almacenamiento off */ } });
    await p.reload({ waitUntil: 'domcontentloaded' });
    await pausa(p, 1300);
    // El escenario «dos equipos» hace primero un viaje entero con OTRO caudal, para que la
    // cotizacion ya tenga dentro un equipo distinto cuando llegue el segundo.
    // Lo que ya estaba en la cotizacion antes de este envio. Se MIDE, no se escribe: es la
    // unica forma de que el escenario de dos equipos compruebe una suma y no una cifra.
    this._previo = 0;
    if (e.doble) {
      await this.dimensionar(p, e.doble, pausa);
      const antes = await totalBom(p);
      this._previo = num(antes && antes.total) || 0;
      await p.click('.btn-cotizador');
      await p.waitForURL(/cotizador/, { timeout: 12000 });
      await pausa(p, 1200);
      await p.goto(new URL(this.pagina, p.url()).href, { waitUntil: 'domcontentloaded' });
      await pausa(p, 1300);
    }
    await this.dimensionar(p, e.mbps, pausa);
  },

  // El caudal de esta pagina se declara en el Multi-Underlay Builder, no en un campo suelto:
  // `#bw` existe pero es un espejo oculto que el builder calcula (ver CLAUDE.md).
  async dimensionar(p, mbps, pausa) {
    await p.click('#btnAddWan');
    await pausa(p, 350);
    const campos = await p.$$('#wanBuilderFilas input[type=number]');
    await campos[0].fill(String(mbps));
    await campos[0].dispatchEvent('change');
    await pausa(p, 900);
    for (const b of await p.$$('.tabs button')) {
      if (((await b.textContent()) || '').toLowerCase().includes('bom')) { await b.click(); break; }
    }
    await pausa(p, 700);
  },

  async leer(p) {
    const modelo = await p.$eval('#verdict-sel', (e) => e.value);
    const bom = await totalBom(p);
    await p.click('.btn-cotizador');
    await p.waitForURL(/cotizador/, { timeout: 12000 });
    await p.waitForTimeout(1400);
    const cot = await totalCotizacion(p, modelo);
    // La cotizacion tiene que valer lo que ya llevaba mas el BOM que acaba de entrar. Es una
    // SUMA y no una igualdad porque el segundo escenario cotiza dos equipos: comparar solo
    // contra el ultimo BOM daria rojo por el motivo equivocado.
    const esperado = this._previo + (num(bom && bom.total) || 0);
    const iguales = bom && cot && num(bom.total) != null
      && Math.abs(esperado - (num(cot.total) || 0)) < 0.01;
    return {
      cotizacionIgualAlBom: iguales ? 'sí'
        : `no — se esperaban $${esperado.toFixed(2)} (${this._previo.toFixed(2)} previos`
          + ` + ${bom && bom.total} de este BOM) y la cotización dice $${cot && cot.total}`,
      equipoUnaVez: cot && cot.cantidadEquipo === 1 ? 'sí'
        : `no — ${modelo} aparece con cantidad ${cot && cot.cantidadEquipo}`,
    };
  },
};
