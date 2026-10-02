'use strict';
// La imagen del ejecutor va fijada donde se instalan paquetes del sistema (2026-10-02). GitHub
// avisó en las anotaciones de cada corrida de que `ubuntu-latest` pasa a Ubuntu 26 desde el 19 de
// octubre de 2026. Los jobs que corren `npx playwright install --with-deps` instalan con apt
// paquetes cuyos nombres cambian de una versión de Ubuntu a otra, y Playwright va fijado en una
// versión: una pieza fija sobre otra que flota, y el día del cambio el job se rompe sin que el
// repositorio haya cambiado. Tres reglas:
//   1. Un job que instala paquetes del sistema fija su imagen (`ubuntu-NN.04`), nunca
//      `ubuntu-latest`. Si la elige una expresión, su valor por defecto es una imagen fija.
//   2. Todos esos jobs usan la misma imagen y la misma versión de Playwright: se validan juntas y
//      se mueven juntas, en un commit.
//   3. `pantallas.yml` deja elegir la imagen al lanzarlo a mano, para medir la siguiente antes de
//      moverse, y por defecto ofrece la fijada.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '.github', 'workflows');
const sinComentarios = (texto) => texto.replace(/^\s*#.*\n/gm, '');
const workflows = fs.readdirSync(DIR).filter((f) => f.endsWith('.yml'))
  .map((f) => ({ yml: f, texto: sinComentarios(fs.readFileSync(path.join(DIR, f), 'utf8')) }));

// Cada job de un workflow, por su texto.
function jobs(texto) {
  const out = {};
  const partes = texto.slice(texto.indexOf('\njobs:')).split(/\n {2}(?=[a-z][\w-]*:\n)/);
  for (const p of partes.slice(1)) out[p.slice(0, p.indexOf(':'))] = p;
  return out;
}
const INSTALA_SISTEMA = /--with-deps|apt-get install|apt install/;

// La imagen que usa un job: literal, o el valor por defecto de la expresión que la elige.
function imagenDe(job) {
  const m = job.match(/\n {4}runs-on: (.+)/);
  if (!m) return null;
  const valor = m[1].trim();
  const porDefecto = valor.match(/^\$\{\{.*'([^']+)'\s*\}\}$/);
  return porDefecto ? porDefecto[1] : valor;
}

const conSistema = [];
for (const { yml, texto } of workflows) {
  for (const [nombre, job] of Object.entries(jobs(texto))) {
    if (INSTALA_SISTEMA.test(job)) conSistema.push({ donde: `${yml} · ${nombre}`, imagen: imagenDe(job) });
  }
}

test('un job que instala paquetes del sistema fija su imagen', () => {
  assert.ok(conSistema.length >= 2, `se esperaban al menos los jobs de pantallas y limites: ${conSistema.map((j) => j.donde)}`);
  for (const { donde, imagen } of conSistema) {
    assert.match(String(imagen), /^ubuntu-\d{2}\.04$/, `${donde} corre en «${imagen}»: con una etiqueta flotante, el job cambia de sistema sin cambiar el repositorio`);
  }
});

test('esos jobs comparten imagen y versión de Playwright', () => {
  const imagenes = new Set(conSistema.map((j) => j.imagen));
  assert.strictEqual(imagenes.size, 1, `imágenes distintas: ${[...imagenes].join(', ')}`);
  const versiones = new Set();
  for (const { texto } of workflows) for (const [, v] of texto.matchAll(/playwright@(\d+\.\d+\.\d+)/g)) versiones.add(v);
  assert.strictEqual(versiones.size, 1, `versiones de Playwright distintas: ${[...versiones].join(', ')}`);
});

test('pantallas.yml deja medir otra imagen a mano, y por defecto ofrece la fijada', () => {
  const texto = workflows.find((w) => w.yml === 'pantallas.yml').texto;
  const [fijada] = new Set(conSistema.map((j) => j.imagen));
  const entrada = texto.match(/\n {6}imagen:\n([\s\S]*?)\n {2}[a-z]/);
  assert.ok(entrada, 'pantallas.yml no tiene la entrada «imagen» en workflow_dispatch');
  assert.match(entrada[1], new RegExp(`default: ${fijada.replace('.', '\\.')}\\n`), 'la imagen por defecto al lanzarlo a mano no es la fijada');
  assert.match(entrada[1], new RegExp(`- ${fijada.replace('.', '\\.')}\\n`), 'la imagen fijada no está entre las opciones');
  assert.match(texto, /runs-on: \$\{\{ inputs\.imagen \|\| '[^']+' \}\}/, 'el job no toma la imagen elegida');
});
