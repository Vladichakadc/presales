'use strict';
// El informe de relevo (decisión del dueño, 2026-10-27): «de aquí en adelante, un informe de
// pendientes y mejoras para que la cuenta servicioiptv2025@gmail.com continúe». Se reescribe al
// cerrar cada entrega, junto con PENDIENTES.md. Esta prueba frena un relevo que se quedó atrás
// (más viejo que la última revisión de PENDIENTES.md) o al que le falta una de sus secciones.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const leer = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('RELEVO.md existe, tiene sus secciones y dice para quién es', () => {
  const r = leer('RELEVO.md');
  for (const s of ['## Cómo retomar', '## Estado al cerrar esta entrega', '## En curso', '## Pendientes, por prioridad',
    '## Mejoras propuestas sin decidir', '## Decisiones del dueño abiertas']) {
    assert.ok(r.includes(s), `falta la sección «${s}»`);
  }
  assert.match(r, /servicioiptv2025@gmail\.com/);
  assert.match(leer('CLAUDE.md'), /RELEVO\.md/, 'CLAUDE.md no dice que hay que actualizar el relevo');
});

test('el relevo no es más viejo que la última revisión de PENDIENTES.md', () => {
  const fecha = (texto, re) => { const m = texto.match(re); return m ? m[1] : null; };
  const relevo = fecha(leer('RELEVO.md'), /^Última actualización: (\d{4}-\d{2}-\d{2})/m);
  const pendientes = fecha(leer('PENDIENTES.md'), /^Última revisión: (\d{4}-\d{2}-\d{2})/m);
  assert.ok(relevo, 'RELEVO.md sin «Última actualización: AAAA-MM-DD»');
  assert.ok(pendientes, 'PENDIENTES.md sin «Última revisión: AAAA-MM-DD»');
  assert.ok(relevo >= pendientes, `el relevo (${relevo}) se quedó atrás de PENDIENTES.md (${pendientes})`);
});
