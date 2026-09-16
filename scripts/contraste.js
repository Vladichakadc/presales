'use strict';
/* Corre un caso de contraste antes/despues. Ver scripts/contraste-motor.js para el porque.
 *
 *   node scripts/contraste.js fortinet --base=http://127.0.0.1:4000 --password=...
 *   node scripts/contraste.js            # lista los casos declarados
 */
const fs = require('fs');
const path = require('path');
const { correr } = require('./contraste-motor');

const DIR = path.join(__dirname, 'contrastes');
const casos = fs.readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, ''));

const arg = (n, d) => {
  const p = process.argv.find((a) => a.startsWith('--' + n + '='));
  return p ? p.slice(n.length + 3) : d;
};
const nombre = process.argv.slice(2).find((a) => !a.startsWith('--'));

if (!nombre || !casos.includes(nombre)) {
  console.error(nombre ? `No existe el caso "${nombre}".` : 'Falta el caso.');
  console.error('Casos declarados: ' + casos.join(', '));
  process.exit(2);
}

correr(require(path.join(DIR, nombre)), {
  base: arg('base'), usuario: arg('usuario'), password: arg('password'),
}).then((fallos) => process.exit(fallos ? 1 : 0));
