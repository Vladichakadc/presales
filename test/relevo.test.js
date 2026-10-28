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

// Las entregas se nombran por fecha y número de PR (mejora aprobada el 2026-10-27). Con ordinales
// («sexagesimonovena», «septuagésima»), dos sesiones en paralelo tomaban el mismo número tres
// veces el mismo día y la que fusionaba segunda tenía que renumerar cada mención al rebasar. El
// número de PR lo da GitHub y no se repite. Las revisiones anteriores con ordinal son historia y
// no se reescriben: la regla mira solo la cabecera vigente de los dos archivos.
const CABECERA_PENDIENTES = /^Última revisión: (\d{4}-\d{2}-\d{2}) · PR #(\d+)\b/m;
const CABECERA_RELEVO = /^Última actualización: (\d{4}-\d{2}-\d{2}) · PR #(\d+)\s*$/m;

test('la entrega vigente se nombra por fecha y PR, igual en PENDIENTES.md y en RELEVO.md', () => {
  const p = leer('PENDIENTES.md').match(CABECERA_PENDIENTES);
  const r = leer('RELEVO.md').match(CABECERA_RELEVO);
  assert.ok(p, 'PENDIENTES.md: la cabecera va como «Última revisión: AAAA-MM-DD · PR #N (**título** …)», sin ordinal');
  assert.ok(r, 'RELEVO.md: la cabecera va como «Última actualización: AAAA-MM-DD · PR #N», sin ordinal');
  assert.strictEqual(r[2], p[2], `RELEVO.md cita el PR #${r[2]} y PENDIENTES.md el #${p[2]}: se reescriben en el mismo commit`);
});

test('la cabecera vigente no vuelve al ordinal', () => {
  const ordinal = /\b(primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena|d[eé]cima|vig[eé]sim|trig[eé]sim|cuadrag[eé]sim|quincuag[eé]sim|sexag[eé]sim|septuag[eé]sim|octog[eé]sim|nonag[eé]sim|cent[eé]sim)\w* entrega/i;
  const lineaVigente = (texto, re) => (texto.split('\n').find((l) => re.test(l)) || '');
  assert.doesNotMatch(lineaVigente(leer('PENDIENTES.md'), /^Última revisión:/), ordinal);
  assert.doesNotMatch(lineaVigente(leer('RELEVO.md'), /^Última actualización:/), ordinal);
});
