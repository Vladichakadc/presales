'use strict';
// PQC DE GESTIÓN Y CONTROL (2026-10-30, mejora aprobada por el dueño). La ficha AR6710-L R26C00 de
// Huawei da «PQC is supported for SSL, SSH, and SD-WAN DTLS protocols»: es la gestión y el canal de
// control del SD-WAN, no el IPsec que lleva el tráfico. Lo que fija esta prueba:
//   1. solo la llevan los equipos que su documento nombra (la serie AR6700-L), con la fuente de
//      fuentes.js que la declara con el campo `pqcGestion`, citada por su URL;
//   2. nunca es `pqc`: «Exigir PQC» la ignora y el equipo se sigue apartando con «no consta»;
//   3. la ficha la dice en su fila y el Comparador la da como dato, sin llamarla PQC del túnel.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');
const { FICHA } = cargar('public/js/ficha.js');
const { PQC } = cargar('public/js/pqc.js');
const { FUENTES, resolverModelos } = require('../server/seed/legacyData/fuentes');
const HUAWEI = require('../server/seed/legacyData/huawei').MODELS;

const valor = (sec, clave) => (sec.filas.find((f) => f[0] === clave) || [])[1];

test('solo la serie AR6700-L lleva `pqcGestion`, con su fuente declarada y citada por URL', () => {
  const con = HUAWEI.filter((m) => m.pqcGestion).map((m) => m.id).sort();
  assert.deepStrictEqual(con, ['AR6710-L14T2X4', 'AR6710-L26T2X4', 'AR6710-L50T2X4', 'AR6710-L8T3TS1X2']);
  const porUrl = new Map(FUENTES.huawei.map((f) => [f.url, f]));
  for (const m of HUAWEI.filter((x) => x.pqcGestion)) {
    assert.ok(!m.pqc, `${m.id}: la PQC de gestión no es \`pqc\``);
    assert.match(m.pqcGestion.literal, /PQC is supported for SSL, SSH, and SD-WAN DTLS protocols/);
    for (const url of m.pqcGestion.urls) {
      const f = porUrl.get(url);
      assert.ok(f, `${m.id}: ${url} no es una entrada de fuentes.js`);
      assert.ok((f.campos || []).includes('pqcGestion'), `${m.id}: la fuente no respalda pqcGestion`);
      assert.ok((resolverModelos('huawei', f).ids || []).includes(m.id), `${m.id}: la fuente no lo declara`);
    }
  }
});

test('«Exigir PQC» no la lee: el equipo se aparta con «no consta»', () => {
  const m = HUAWEI.find((x) => x.id === 'AR6710-L26T2X4');
  for (const nivel of ['clave', 'mlkem']) assert.match(PQC.motivo(m, nivel), /no consta en ningún documento oficial/);
  assert.strictEqual(PQC.motivo(m, ''), null);
});

test('la ficha la dice en su fila y el Comparador la da como dato, sin llamarla PQC del túnel', () => {
  const m = HUAWEI.find((x) => x.id === 'AR6710-L26T2X4');
  const sec = FICHA.seccionPqc(m);
  assert.match(valor(sec, 'Soporte'), /no consta/);
  assert.match(valor(sec, 'Gestión y control'), /SSL, SSH y DTLS del SD-WAN.*no es el túnel de datos y no cuenta para «Exigir PQC»/);
  assert.match(valor(sec, 'Documento oficial (gestión)'), /^<a href="https:\/\/e-file\.huawei\.com\//);
  assert.match(sec.nota, /solo la da en gestión y control/);
  // Sin fuente no se dice nada, y un equipo sin el campo sigue igual que siempre.
  assert.strictEqual(valor(FICHA.seccionPqc({ id: 'x', pqcGestion: { donde: 'SSH' } }), 'Gestión y control'), undefined);
  assert.doesNotMatch(FICHA.seccionPqc({ id: 'y' }).nota, /gestión/);
  const { COMPARADOR } = cargar('public/js/comparador.js');
  const fila = COMPARADOR.SECCIONES.flatMap((s) => s.filas).find((f) => f.k === 'pqc');
  const celda = COMPARADOR.celda(fila, { grupo: 'x', raw: m });
  assert.strictEqual(celda.estado, 'dato');
  assert.match(celda.txt, /^Solo en SSL, SSH y DTLS del SD-WAN \(gestión y canal de control\); no en el túnel de datos$/);
});
