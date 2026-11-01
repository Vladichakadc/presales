'use strict';
// El informe de relevo (decisión del dueño, 2026-10-27): «de aquí en adelante, un informe de
// pendientes y mejoras para que la cuenta servicioiptv2025@gmail.com continúe». Sus secciones vivas
// se reescriben cuando cambian; cada entrega va en su archivo de docs/entregas/ (desde 2026-10-31).
// Esta prueba frena un relevo al que le falta una sección y una entrega mal formada o repetida.
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

// LAS ENTREGAS, UNA POR ARCHIVO (2026-10-31, mejora aprobada por el dueño al cerrar el PR #92). Antes
// cada entrega reescribía la cabecera y la primera entrada de PENDIENTES.md y de RELEVO.md, y dos
// fusiones en paralelo chocaban siempre ahí. Ahora cada una es `docs/entregas/AAAA-MM-DD-pr-N.md`
// (scripts/entregas.js). Se sigue nombrando por fecha y número de PR, nunca por ordinal: dos sesiones
// en paralelo tomaban el mismo ordinal, y el número de PR no se repite.
const { leerEntregas } = require('../scripts/entregas');
const ORDINAL = /\b(primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena|d[eé]cima|vig[eé]sim|trig[eé]sim|cuadrag[eé]sim|quincuag[eé]sim|sexag[eé]sim|septuag[eé]sim|octog[eé]sim|nonag[eé]sim|cent[eé]sim)\w* entrega/i;

test('cada entrega de docs/entregas/ está bien formada: nombre, cabecera, encargo, Cerrado y Estado', () => {
  const entregas = leerEntregas();
  assert.ok(entregas.length > 0, 'docs/entregas/ no tiene ninguna entrega');
  for (const e of entregas) assert.deepStrictEqual(e.problemas, [], `${e.archivo}: ${e.problemas.join('; ')}`);
});

test('un PR, una entrega; y ninguna se nombra por ordinal', () => {
  const vistos = new Map();
  for (const e of leerEntregas()) {
    assert.ok(!vistos.has(e.pr), `el PR #${e.pr} tiene dos entregas: ${vistos.get(e.pr)} y ${e.archivo}`);
    vistos.set(e.pr, e.archivo);
    assert.doesNotMatch(e.titulo || '', ORDINAL, `${e.archivo}: la entrega se nombra por fecha y PR, no por ordinal`);
  }
});

test('PENDIENTES.md y RELEVO.md ya no llevan la cabecera de la entrega: va en su archivo', () => {
  // Si una rama de antes del cambio vuelve a escribir «Última revisión» o «Última actualización», las
  // fusiones en paralelo vuelven a chocar en esa línea. La entrega va a docs/entregas/ (PLANTILLA.md).
  assert.doesNotMatch(leer('PENDIENTES.md'), /^Última revisión:/m,
    'PENDIENTES.md: la entrega va en docs/entregas/AAAA-MM-DD-pr-N.md, no en «Última revisión»; la línea vieja pasa a «Revisión anterior»');
  assert.doesNotMatch(leer('RELEVO.md'), /^Última actualización:/m,
    'RELEVO.md: la entrega va en docs/entregas/AAAA-MM-DD-pr-N.md, no en «Última actualización»');
  for (const f of ['PENDIENTES.md', 'RELEVO.md']) assert.match(leer(f), /docs\/entregas\//, `${f} no dice dónde están las entregas`);
});
