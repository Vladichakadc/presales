'use strict';
/* LAS FUENTES DE LOS SIETE, DESDE EL PORTAL (2026-11-01, la mejora propuesta al cerrar el PR #71).
   La página «Fuentes oficiales» del portal llama a `/api/fuentes/<fabricante>/salud` para los siete
   fabricantes. Cada llamada hace que el servidor vuelva a leer los documentos en el sitio del
   fabricante, así que la propuesta pedía, y esta prueba fija, que vayan DE UNA EN UNA: siete a la vez
   pegarían a los fabricantes con veintiocho descargas simultáneas. Lo que se ve lo conduce
   `test/e2e/e2e-fuentes-portal.js`, con la ruta simulada. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { cargar } = require('./ayuda/navegador');

const RAIZ = path.join(__dirname, '..');

// El módulo con los siete de verdad: navegacion.js se ejecuta en el mismo realm, como en el portal
// (en `/` su montar() no pinta nada y solo deja NAVFAB).
function modulo() {
  const g = cargar('public/js/fuentes-portal.js');
  g.location.pathname = '/';
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'public/js/navegacion.js'), 'utf8'), g, { filename: 'navegacion.js' });
  return g;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Lo que sale del realm de `vm` trae otro Array.prototype: se compara por su forma.
const n = (a) => JSON.parse(JSON.stringify(a));

test('los siete fabricantes, los de la barra de navegación, cada uno con su pestaña de fuentes', () => {
  const g = modulo();
  const fabs = g.FUENTES_PORTAL.fabricantes();
  assert.deepStrictEqual(n(fabs.map((f) => f.id)), ['huawei', 'cisco', 'fortinet', 'juniper', 'mikrotik', 'aruba', 'nokia']);
  const { FUENTES } = require('../server/seed/legacyData/fuentes');
  for (const f of fabs) {
    assert.ok(Object.prototype.hasOwnProperty.call(FUENTES, f.id), `${f.id}: la ruta de salud no lo conoce`);
    const html = fs.readFileSync(path.join(RAIZ, 'public', f.dim), 'utf8');
    assert.match(html, /data-tab="src"/, `${f.dim}: el enlace ?tab=src no abriría ninguna pestaña`);
    assert.match(g.FUENTES_PORTAL.fila(f, null), new RegExp(`href="/${f.dim.replace(/\./g, '\\.')}\\?tab=src"`));
  }
});

test('de uno en uno: el siguiente fabricante se pide cuando el anterior respondió', async () => {
  const g = modulo();
  const fabs = g.FUENTES_PORTAL.fabricantes();
  let enVuelo = 0;
  let maximo = 0;
  const orden = [];
  const pedir = async (id) => {
    enVuelo += 1; maximo = Math.max(maximo, enVuelo); orden.push(id);
    await espera(5);
    enVuelo -= 1;
    return { resumen: { sinCambios: 1 }, fuentes: [{}], revisadoEn: '2026-11-01T22:00:00Z' };
  };
  const pasos = [];
  const r = await g.FUENTES_PORTAL.comprobarEnSerie(fabs, pedir, (p) => pasos.push(`${p.fab.id}:${p.estado}`));
  assert.strictEqual(maximo, 1, 'dos fabricantes a la vez');
  assert.deepStrictEqual(orden, n(fabs.map((f) => f.id)));
  assert.strictEqual(r.length, 7);
  assert.deepStrictEqual(pasos.slice(0, 4), ['huawei:en-curso', 'huawei:ok', 'cisco:en-curso', 'cisco:ok']);
});

test('un fabricante que falla no para a los demás, y lo que dice el servidor se escapa', async () => {
  const g = modulo();
  const fabs = g.FUENTES_PORTAL.fabricantes();
  const pedir = async (id) => {
    if (id === 'cisco') throw new Error('<img src=x onerror=alert(1)>');
    return { resumen: { sinCambios: 2, cambiaron: id === 'huawei' ? 1 : 0, inalcanzables: id === 'aruba' ? 3 : 0 }, fuentes: [{}, {}], revisadoEn: '2026-11-01T22:00:00Z' };
  };
  const r = await g.FUENTES_PORTAL.comprobarEnSerie(fabs, pedir);
  assert.deepStrictEqual(n(r.map((x) => x.estado)), ['ok', 'error', 'ok', 'ok', 'ok', 'ok', 'ok']);
  const filaCisco = g.FUENTES_PORTAL.fila(fabs[1], r[1]);
  assert.doesNotMatch(filaCisco, /<img/, 'el texto del error entró como marcado');
  assert.match(filaCisco, /No se pudo comprobar: &lt;img/);
  assert.strictEqual(g.FUENTES_PORTAL.conclusion(r),
    'cambiaron documentos sin contrastar en Huawei; hay documentos inalcanzables en Aruba; no se pudo comprobar Cisco.');
});

test('el resumen de cada fila dice lo mismo que la pestaña de cada fabricante', () => {
  const g = modulo();
  const texto = (resumen) => g.FUENTES_PORTAL.partesDe({ resumen }).map((p) => `${p.n} ${p.texto}`).join(' · ');
  assert.strictEqual(texto({ sinCambios: 9 }), '9 sin cambios');
  assert.strictEqual(texto({ sinCambios: 5, cambiaron: 1, varian: 2, primera: 1, inalcanzables: 1 }),
    '5 sin cambios · 1 cambió sin contrastar · 2 páginas dinámicas que varían · 1 sin medición previa · 1 inalcanzable');
  // Las palabras salen de procedencia.js: si una cambia allí, cambia aquí.
  const proc = fs.readFileSync(path.join(RAIZ, 'public/js/procedencia.js'), 'utf8');
  for (const p of ['sin cambios', 'cambiaron sin contrastar', 'páginas dinámicas que varían', 'sin medición previa', 'inalcanzables']) {
    assert.ok(proc.includes(p), `procedencia.js ya no dice «${p}»`);
  }
  assert.strictEqual(g.FUENTES_PORTAL.conclusion([]), 'ningún documento cambió y todos se alcanzaron.');
});

test('la ruta se pide con el identificador del fabricante, nunca con otra cosa', async () => {
  const g = modulo();
  const urls = [];
  g.fetch = async (u) => { urls.push(u); return { ok: true, json: async () => ({ resumen: {}, fuentes: [] }) }; };
  await g.FUENTES_PORTAL.comprobarEnSerie(g.FUENTES_PORTAL.fabricantes(), g.FUENTES_PORTAL.pedirSalud);
  assert.deepStrictEqual(urls, ['huawei', 'cisco', 'fortinet', 'juniper', 'mikrotik', 'aruba', 'nokia'].map((v) => `/api/fuentes/${v}/salud`));
  g.fetch = async () => ({ ok: false, status: 500, json: async () => ({ error: 'No se pudieron comprobar las fuentes' }) });
  await assert.rejects(g.FUENTES_PORTAL.pedirSalud('huawei'), /No se pudieron comprobar las fuentes/);
});

test('el portal tiene la página, su botón en la barra lateral y carga el módulo después de navegacion.js', () => {
  const html = fs.readFileSync(path.join(RAIZ, 'public/index.html'), 'utf8');
  assert.match(html, /<div class="page" id="page-fuentes">/);
  assert.match(html, /<button class="nav-btn" data-page="fuentes" data-ir="fuentes">/);
  assert.match(html, /id="fpComprobar"/);
  assert.match(html, /<tbody id="fpCuerpo"><\/tbody>/);
  assert.match(html, /id="fpEstado" role="status"/);
  const nav = html.indexOf('<script src="/js/navegacion.js">');
  const mod = html.indexOf('<script src="/js/fuentes-portal.js">');
  assert.ok(nav > 0 && mod > nav, 'fuentes-portal.js lee NAVFAB: va detrás de navegacion.js');
});
