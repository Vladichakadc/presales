'use strict';
// Qué dependencias pueden ejecutar código al instalarse (2026-10-02). Llegó con Node 24, que trae
// npm 11: npm lee el campo `allowScripts` de package.json, y su documentación anuncia que los
// scripts de instalación que no figuren ahí se bloquearán. Medido con npm 11.19 ese día:
//   - sin el campo, o con otra versión aprobada: el script corre y npm avisa;
//   - aprobado con su versión exacta: corre sin aviso;
//   - denegado (`false`): se salta en silencio y `npm ci` sale con 0 sin el binario nativo, así
//     que el servidor se cae al arrancar y no al instalar.
// `sqlite3` es la única dependencia no opcional con script de instalación, y el suyo baja un
// binario de las releases de GitHub que luego corre dentro del servidor. Se aprueba fijado a la
// versión revisada: cuando Dependabot suba la versión, esta prueba se pone en rojo hasta que una
// persona revise esa versión y la apruebe. Una aprobación que se queda en la versión vieja es una
// lista que ya no protege nada, y además volvería el aviso que se acaba de quitar.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const paquete = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package-lock.json'), 'utf8'));
const permitidos = paquete.allowScripts || {};

// Las dependencias con script de instalación que se instalan en Linux, que es donde se despliega:
// las opcionales (fsevents, solo macOS) quedan fuera.
const conScript = Object.entries(lock.packages)
  .filter(([ruta, p]) => ruta && p.hasInstallScript && !p.optional)
  .map(([ruta, p]) => ({ nombre: ruta.slice(ruta.lastIndexOf('node_modules/') + 'node_modules/'.length), version: p.version }));

const COMO = 'revisa esa versión y apruébala con `npm install-scripts approve <paquete>` (npm 11, Node 24), o cambia la versión a mano en allowScripts';

test('cada dependencia con script de instalación está aprobada en su versión exacta', () => {
  assert.ok(conScript.some((d) => d.nombre === 'sqlite3'), 'sqlite3 tiene script de instalación: si ya no lo tiene, esta prueba hay que revisarla');
  for (const { nombre, version } of conScript) {
    assert.strictEqual(permitidos[`${nombre}@${version}`], true, `${nombre}@${version} ejecuta código al instalarse y no está aprobado: ${COMO}`);
  }
});

test('ninguna aprobación queda sin fijar, vieja o denegando algo que hace falta', () => {
  const instaladas = new Set(conScript.map((d) => `${d.nombre}@${d.version}`));
  const nombres = new Set(conScript.map((d) => d.nombre));
  for (const [entrada, valor] of Object.entries(permitidos)) {
    if (valor === false) {
      assert.ok(!nombres.has(entrada.replace(/@[^@]*$/, '')) && !nombres.has(entrada),
        `${entrada} está denegado: npm se salta su script en silencio y el servidor se cae al arrancar`);
      continue;
    }
    assert.match(entrada, /^(@[^/]+\/)?[^@]+@\d+\.\d+\.\d+$/, `${entrada}: una aprobación sin versión deja pasar cualquier versión futura sin revisarla`);
    assert.ok(instaladas.has(entrada), `${entrada} ya no es lo que está instalado: ${COMO}`);
  }
});
