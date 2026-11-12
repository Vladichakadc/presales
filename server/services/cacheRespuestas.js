'use strict';
// LAS RESPUESTAS DEL CATÁLOGO, SERIALIZADAS UNA VEZ AL DÍA (2026-11-12, mejora propuesta al
// cerrar el PR #183). El catálogo vive en memoria (ADR-3) y no cambia sin un despliegue, pero cada
// petición volvía a proyectarlo y a serializarlo (Fortinet, 215 KB, más la huella SHA-256 de
// `datasetVersion`). Aquí se guarda el CUERPO ya serializado de cada ruta: una cadena no la puede tocar
// un manejador posterior, y el PR #175 garantiza que las proyecciones no escriben en legacyData/.
//
// Cada entrada lleva el DÍA UTC: `fueraDeVenta()` compara el `lastOrder` de cada fin de venta anunciado con la hora
// actual, y todos los `lastOrder` son fechas AAAA-MM-DD, que vencen a las 00:00 UTC. Con el día en la
// clave, el primer pedido del día siguiente vuelve a proyectar y el equipo cae solo, como antes.
// `test/cache-respuestas.test.js` exige ese formato: con una hora dentro, la caché se quedaría atrás.
// Y `usarModelos()` (catalogProjection.js), que cambia los modelos del proceso como hacen las pruebas,
// la vacía con `invalidar()`.
//
// Fuera de la caché, a propósito: `/api/fuentes`, porque `toFuentes` lee las fuentes subidas al volumen,
// que cambian sin desplegar. Y `/api/v1/fortinet/*`, que tiene su propia caché.
// `datasheetsLocales()` lee `public/datasheets/` en cada proyección de Aruba: en producción esa carpeta
// solo cambia con un despliegue, que reinicia el proceso.
const entradas = new Map(); // clave -> { dia, promesa }
let reloj = () => Date.now();

function diaUtc() {
  return new Date(reloj()).toISOString().slice(0, 10);
}

// `producir` devuelve el objeto a enviar. Se guarda la PROMESA de su JSON: dos primeras peticiones a la
// vez comparten un solo cálculo. Si falla, la entrada se borra y la siguiente petición lo reintenta.
function cuerpo(clave, producir) {
  const dia = diaUtc();
  const e = entradas.get(clave);
  if (e && e.dia === dia) return e.promesa;
  const nueva = { dia, promesa: null };
  nueva.promesa = Promise.resolve()
    .then(producir)
    .then((obj) => JSON.stringify(obj))
    .catch((err) => {
      if (entradas.get(clave) === nueva) entradas.delete(clave);
      throw err;
    });
  entradas.set(clave, nueva);
  return nueva.promesa;
}

// Manejador de Express: la misma respuesta que `res.json(await producir())`, servida desde la caché.
function servir(clave, producir) {
  return async (req, res, next) => {
    try {
      res.type('json').send(await cuerpo(typeof clave === 'function' ? clave(req) : clave, producir));
    } catch (err) {
      next(err);
    }
  };
}

function invalidar() {
  entradas.clear();
}

// Solo para las pruebas: un reloj falso.
function usarReloj(fn) {
  reloj = fn || (() => Date.now());
}

module.exports = { cuerpo, servir, invalidar, usarReloj, diaUtc };
