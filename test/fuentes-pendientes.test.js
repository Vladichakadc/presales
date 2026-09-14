'use strict';
// UNA FUENTE QUE CAMBIO Y NADIE HA CONTRASTADO NO PUEDE ESPERAR PARA SIEMPRE.
//
// El vigia corre los lunes y comenta en un issue. Un comentario semanal no obliga a nadie, y
// desde el 2026-09-14 el lock ya no se traga el cambio -- asi que la cola de revision crece en
// silencio si nadie la mira. Esta prueba es lo que hace que se mire: `npm run catalogo` se
// corre cuando alguien se acuerda, `npm run verificar` corre en cada push y Railway lo espera.
//
// EL UMBRAL ES LA PARTE DISCUTIBLE Y VA DECLARADA. Sin el, que Fortinet publique un PDF un
// martes bloquearia trabajo que no tiene nada que ver con el catalogo. Con el, hay un mes de
// margen para atenderlo y aun asi no se puede ignorar sin limite. Se sube, se baja o se quita
// cambiando una constante, no reescribiendo la regla.
//
// Lo que esta prueba NO hace es exigir que las fuentes se alcancen: desde este entorno los seis
// dominios dan 403 por politica de egreso, y eso se reporta con su codigo, no se rodea. Aqui
// solo se lee el lock.

const test = require('node:test');
const assert = require('node:assert');
const { fuentesPendientes, SEMANAS_TOLERADAS } = require('../scripts/catalogo-check');
const { leerLock } = require('../scripts/vigia-fuentes');

test('ninguna fuente lleva más del umbral esperando que una persona la contraste', () => {
  const vencidas = fuentesPendientes().filter((f) => f.vencida);
  const detalle = vencidas.map((f) => `\n  ${f.vendor} · ${f.documento} — ${f.semanas} semana(s)`
    + `\n    verificado ${f.hashVerificado.slice(0, 12)} (${f.bytesVerificado} B)`
    + ` -> visto ${f.hashVisto.slice(0, 12)} (${f.bytesVisto} B)`
    + `\n    ábrelo, aplica el dato con su importador y luego:`
    + `\n    npm run vigia -- --revisado ${f.vendor} ${f.url}`).join('');
  assert.strictEqual(vencidas.length, 0,
    `${vencidas.length} fuente(s) llevan ${SEMANAS_TOLERADAS}+ semanas sin contrastar:${detalle}\n`);
});

test('el umbral no es decorativo: un pendiente viejo sí se marca vencido', () => {
  // Sin esto, invertir la comparacion o poner la constante en un numero enorme dejaria la
  // prueba anterior en verde para siempre sin que nadie lo notara -- el conjunto inerte de
  // CISCO_EOL_MODELS otra vez. Se construye el lock en vez de esperar a que el repositorio
  // tenga hoy una fuente vieja: eso codificaria el estado del dia, no la regla.
  const haceSemanas = (n) => new Date(Date.now() - n * 7 * 24 * 3600 * 1000).toISOString();
  const lockCon = (semanas) => ({
    documentos: {
      'fortinet::https://ejemplo/matrix.pdf': {
        documento: 'Documento de prueba',
        hashVerificado: 'aaa', bytes: 100, medido: haceSemanas(semanas + 1),
        visto: { hash: 'bbb', bytes: 200, medido: haceSemanas(semanas) },
        pendienteDesde: haceSemanas(semanas),
      },
    },
  });

  const recien = fuentesPendientes(lockCon(0));
  assert.strictEqual(recien.length, 1);
  assert.strictEqual(recien[0].vencida, false, 'un cambio de esta semana no puede romper el build');

  const vieja = fuentesPendientes(lockCon(SEMANAS_TOLERADAS + 1));
  assert.strictEqual(vieja[0].vencida, true, 'pasado el umbral no se marca: la regla no frena nada');
  assert.strictEqual(fuentesPendientes(lockCon(SEMANAS_TOLERADAS))[0].vencida, true,
    'el umbral tiene que incluir su propio valor');
});

test('el lock se lee de verdad, no devuelve vacío por un error de lectura', () => {
  // Un comprobador que no comprueba se porta igual que uno que pasa. Si el lock se corrompiera
  // o cambiara de forma, `fuentesPendientes()` devolveria [] y la primera prueba pasaria sin
  // haber mirado nada.
  const lock = leerLock();
  const n = Object.keys(lock.documentos || {}).length;
  assert.ok(n >= 9, `el lock declara ${n} documentos y las FUENTES con URL son 9`);
  for (const [clave, e] of Object.entries(lock.documentos)) {
    assert.ok(e.hashVerificado || e.hash, `${clave} no tiene ningún hash`);
  }
});
