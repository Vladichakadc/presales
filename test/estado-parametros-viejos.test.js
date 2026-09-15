'use strict';
// UN ENLACE VIEJO NO PUEDE ATERRIZAR EN SILENCIO.
//
// Cuando una pantalla renombra o retira un control, los enlaces ya pegados en chats y correos
// siguen llegando con el parametro antiguo. Hasta el 2026-09-13 se ignoraba sin decir nada: el
// emisor veia su escenario y el receptor veia otro, sin una sola señal de que algo se habia
// perdido. Y paso de verdad — el dimensionador Aruba cambio su campo `#bw` por el
// Multi-Underlay Builder, y solo se salvo porque alguien escribio a mano una migracion para
// ESA pagina; la regla general no existia. Es el mismo modo de fallo que `RENOMBRADAS` en
// `server.js` evita para el NOMBRE del archivo, y que nadie cubria para los PARAMETROS.
//
// Lo que se prueba aqui es la DECISION —que se denuncia y que no—, no el pintado: para eso
// esta `npm run pantallas`, que conduce la pagina de verdad en un navegador.

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

// Monta estado.js con una URL dada y devuelve lo que decidio `vincular()`.
function conUrl(search, cfg) {
  const g = cargar('public/js/estado.js');
  g.location.search = search;
  return { g, st: g.ESTADO.vincular(cfg) };
}

// El modulo corre dentro de un realm de `vm`, asi que los arrays que devuelve NO heredan del
// mismo `Array` que los de esta prueba y `deepStrictEqual` los rechaza por identidad de
// prototipo aunque su contenido sea identico. Se rehacen aqui antes de comparar: la
// alternativa —relajar a `deepEqual`— tambien dejaria pasar un `'2500'` donde se espera 2500.
const lista = (xs) => [...xs];

const CAMPOS = ['bw', 'unit', 'head', 'verdict-sel'];

test('un parametro que la pantalla ya no usa se denuncia, y por su nombre', () => {
  const { st } = conUrl('?bw=2500&mplsType=l3', { campos: CAMPOS });
  assert.deepStrictEqual(lista(st.ignorados), ['mplsType']);
  assert.strictEqual(st.origen, 'enlace');
});

test('los campos que la pantalla SI conoce nunca se denuncian', () => {
  const { st } = conUrl('?bw=2500&unit=1&head=30&verdict-sel=FG-90G', { campos: CAMPOS });
  assert.deepStrictEqual(lista(st.ignorados), []);
});

test('lo que la pagina sabe migrar no se denuncia — el caso real de Aruba', () => {
  // `migrarEstadoV1()` convierte estos seis en filas del Multi-Underlay Builder, asi que el
  // escenario SI llega entero. Avisar aqui seria un falso positivo, y un aviso que salta
  // cuando no toca enseña a ignorarlo.
  const PARAMS_V1 = ['bw', 'unit', 'mplsType', 'bwMpls', 'inetType', 'bwInet'];
  const { st } = conUrl('?mplsType=l3&bwMpls=200&inetType=bb&bwInet=500', {
    campos: ['wanLinksData', 'users', 'aps'],
    migrados: PARAMS_V1,
  });
  assert.deepStrictEqual(lista(st.ignorados), []);
});

test('sin declarar los migrados, ese mismo enlace si se denuncia', () => {
  // El contraste del caso anterior: lo que salva a Aruba es la declaracion, no la suerte.
  const { st } = conUrl('?mplsType=l3&bwMpls=200', { campos: ['wanLinksData'] });
  assert.deepStrictEqual(lista(st.ignorados), ['mplsType', 'bwMpls']);
});

test('las marcas de campaña y seguimiento no son escenario y no disparan el aviso', () => {
  const { st } = conUrl('?bw=2500&utm_source=correo&utm_campaign=q3&gclid=abc&ref=chat', { campos: CAMPOS });
  assert.deepStrictEqual(lista(st.ignorados), []);
});

test('el caso peor: un enlace SOLO con parametros viejos tambien avisa', () => {
  // Aqui no hay ningun campo reconocible, asi que `origen` es null y la pantalla sale entera
  // en blanco. Es justo cuando mas falta hace el aviso: sin el no habria absolutamente nada
  // que explicara por que el escenario no llego.
  const { st } = conUrl('?mplsType=l3&bwMpls=200', { campos: CAMPOS });
  assert.strictEqual(st.origen, null);
  assert.deepStrictEqual(lista(st.ignorados), ['mplsType', 'bwMpls']);
});

/* ── El aviso en pantalla ─────────────────────────────────────────────────────
   Se captura lo que `avisoOrigen` inserta, con un doble de createElement que retiene el
   innerHTML. No se comprueba el estilo: se comprueba que DICE cuales, que escapa y que se
   acota. */
function pintar(g, st) {
  const creados = [];
  g.document.createElement = () => {
    const el = { style: {}, className: '', innerHTML: '', appendChild() {} };
    creados.push(el);
    return el;
  };
  const host = { hijos: [], appendChild(el) { this.hijos.push(el); } };
  g.ESTADO.avisoOrigen(host, st);
  return host.hijos;
}

test('el aviso nombra los parametros perdidos, no solo dice que habia alguno', () => {
  const { g, st } = conUrl('?bw=2500&mplsType=l3', { campos: CAMPOS });
  const hijos = pintar(g, st);
  const aviso = hijos.find((h) => h.className.includes('estado-ignorados'));
  assert.ok(aviso, 'no se pinto el aviso');
  assert.match(aviso.innerHTML, /mplsType/);
  assert.match(aviso.innerHTML, /no se ha aplicado/);
  // Y sigue apareciendo el aviso de origen, que responde a otra pregunta.
  assert.ok(hijos.some((h) => h.className.includes('estado-origen')));
});

test('sin parametros sobrantes no se pinta ningun aviso de perdida', () => {
  const { g, st } = conUrl('?bw=2500', { campos: CAMPOS });
  const hijos = pintar(g, st);
  assert.strictEqual(hijos.filter((h) => h.className.includes('estado-ignorados')).length, 0);
});

test('el nombre del parametro se escapa: la URL la escribe quien manda el enlace', () => {
  // La CSP de este sitio ya bloquearia un `onerror=` inyectado, pero apoyarse en ella seria
  // confiar la correccion de una pantalla a una cabecera de otra capa.
  const { g, st } = conUrl('?%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E=1', { campos: CAMPOS });
  const hijos = pintar(g, st);
  const aviso = hijos.find((h) => h.className.includes('estado-ignorados'));
  assert.ok(aviso);
  assert.ok(!aviso.innerHTML.includes('<img'), 'se colo marcado sin escapar');
  assert.match(aviso.innerHTML, /&lt;img/);
});

test('una lista larga se acota: un parrafo que nadie lee no avisa', () => {
  const qs = Array.from({ length: 10 }, (_, i) => `viejo${i}=1`).join('&');
  const { g, st } = conUrl(`?${qs}`, { campos: CAMPOS });
  assert.strictEqual(st.ignorados.length, 10);
  const aviso = pintar(g, st).find((h) => h.className.includes('estado-ignorados'));
  assert.match(aviso.innerHTML, /y 4 más/);
  assert.ok(!aviso.innerHTML.includes('viejo9'), 'no se acoto la lista');
});
