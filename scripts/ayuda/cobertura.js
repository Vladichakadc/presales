'use strict';
/* QUE MODULOS DE public/js/ EJERCITA DE VERDAD EL CONTRASTE — medido, no declarado.
 *
 * DE DONDE SALE. La propuesta original era que cada caso DECLARARA que modulo cubre
 * (`cubre: ['ficha.js']`). Se descarto al escribirla, por su propio riesgo: un caso que
 * declare cubrir `bom.js` sin conducir una linea del BOM da una cobertura FALSA, que es peor
 * que no tener el dato — invita a no escribir el caso que falta. Es la forma exacta del
 * `noAplica` deducido y del `estable` puesto a ojo.
 *
 * Asi que no se declara: se MIDE. Chromium reporta que funciones de cada script se ejecutaron
 * durante la corrida (`page.coverage`), y eso no se puede rellenar a mano.
 *
 * LA METRICA ES «FUNCIONES EJECUTADAS / FUNCIONES DEL MODULO», y no bytes, a proposito: los
 * rangos de bytes de V8 ANIDAN (el rango de una funcion contiene los de sus bloques) y
 * sumarlos cuenta dos veces lo mismo. Una funcion se cuenta como ejecutada si algun rango
 * suyo tiene `count > 0`. Es mas gruesa, pero no admite interpretacion.
 *
 * SE UNE ENTRE CARGAS DE PAGINA, no se toma el maximo. Un modulo compartido se carga en
 * varias pantallas y en cada una se ejecutan funciones distintas: quedarse con la mejor
 * pagina diria menos de lo que la corrida hizo. Las funciones se identifican por su
 * desplazamiento de inicio, que es estable porque el fichero servido es el mismo.
 *
 * TRES ESTADOS, Y EL TERCERO IMPORTA:
 *   · `ejercitado` — por encima del umbral;
 *   · `rozado`     — el modulo se carga pero casi nada suyo corre (el contraste pasa por su
 *                    pantalla sin tocar lo que hace);
 *   · `sin conducir` — NINGUNA pantalla de ningun caso lo carga. No es «0 %»: es que el
 *                    contraste ni se acerca. Confundirlo con un 0 % diria que se midio algo
 *                    que no se midio.
 */

// El umbral es la parte discutible y va declarada, como `SEMANAS_TOLERADAS` del vigia. Por
// debajo de esto, lo que corre del modulo es su IIFE y poco mas: el caso pasa por la pantalla
// pero no ejercita lo que el modulo hace.
const UMBRAL_ROZADO = 25;

// `entradas` es lo que devuelve `page.coverage.stopJSCoverage()`.
// `modulos` es la lista de ficheros que existen en public/js/, para poder distinguir
// «sin conducir» de «no existe».
function agregar(entradas, modulos) {
  const porModulo = new Map();
  for (const e of entradas || []) {
    const m = /\/js\/([^/?#]+\.js)(?:[?#].*)?$/.exec(e.url || '');
    if (!m) continue;
    const nombre = m[1];
    if (!porModulo.has(nombre)) porModulo.set(nombre, new Map());
    const fns = porModulo.get(nombre);
    for (const f of e.functions || []) {
      const rangos = f.ranges || [];
      // La clave es el desplazamiento de inicio de la funcion: estable entre cargas porque el
      // fichero servido es byte a byte el mismo. El nombre no sirve — hay muchas anonimas.
      const clave = rangos.length ? rangos[0].startOffset : `n:${f.functionName}`;
      const corrio = rangos.some((r) => r.count > 0);
      fns.set(clave, (fns.get(clave) || false) || corrio);
    }
  }

  const salida = [];
  for (const nombre of modulos) {
    const fns = porModulo.get(nombre);
    if (!fns || !fns.size) {
      salida.push({ modulo: nombre, estado: 'sin conducir', total: null, usadas: null, pct: null });
      continue;
    }
    const total = fns.size;
    const usadas = [...fns.values()].filter(Boolean).length;
    const pct = Math.round((usadas / total) * 100);
    salida.push({ modulo: nombre, estado: pct < UMBRAL_ROZADO ? 'rozado' : 'ejercitado', total, usadas, pct });
  }
  // Lo peor arriba: «sin conducir» primero, luego de menos a mas ejercitado. Un informe que
  // pide desplazarse para ver el hueco es un informe que no avisa.
  const orden = { 'sin conducir': 0, rozado: 1, ejercitado: 2 };
  salida.sort((a, b) => orden[a.estado] - orden[b.estado] || (a.pct || 0) - (b.pct || 0) || a.modulo.localeCompare(b.modulo));
  return salida;
}

// Formato del artefacto: lleva su procedencia dentro, por lo mismo que cada caso declara
// `medidoEn`. Una cobertura de hace meses sigue leyendose como un hecho y ya no lo es.
function informe(filas, medidoEn) {
  return {
    medidoEn,
    umbralRozado: UMBRAL_ROZADO,
    modulos: filas,
  };
}

module.exports = { agregar, informe, UMBRAL_ROZADO };
