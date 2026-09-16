'use strict';
/* Corre los casos de contraste antes/despues. Ver scripts/contraste-motor.js para el porque.
 *
 *   node scripts/contraste.js fortinet --base=http://127.0.0.1:4000 --password=...
 *   node scripts/contraste.js --todos --base=http://127.0.0.1:4000     # lo que corre en CI
 *   node scripts/contraste.js                                          # lista los casos
 *
 * `--todos` DERIVA LA LISTA DEL DIRECTORIO y no de un array escrito a mano, aqui ni en el
 * workflow. Una lista a mano se queda atras en cuanto alguien anade `contrastes/cisco.js`, y
 * un caso que nunca corre se porta igual que uno que pasa — es la forma de CISCO_EOL_MODELS.
 */
const fs = require('fs');
const path = require('path');
const { abrirSesion, correr } = require('./contraste-motor');

const DIR = path.join(__dirname, 'contrastes');
const casos = fs.readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, '')).sort();

const arg = (n, d) => {
  const p = process.argv.find((a) => a.startsWith('--' + n + '='));
  return p ? p.slice(n.length + 3) : d;
};
const opciones = { base: arg('base'), usuario: arg('usuario'), password: arg('password') };
const todos = process.argv.includes('--todos');
const pedido = process.argv.slice(2).find((a) => !a.startsWith('--'));

if (!todos && (!pedido || !casos.includes(pedido))) {
  console.error(pedido ? `No existe el caso "${pedido}".` : 'Falta el caso (o pasa --todos).');
  console.error('Casos declarados: ' + casos.join(', '));
  process.exit(2);
}

(async () => {
  const lista = todos ? casos : [pedido];
  // Un solo navegador y una sola sesion para todos los casos: en un ejecutor, arrancar
  // Chromium y volver a entrar por el muro N veces cuesta minutos y no aisla nada.
  const sesion = await abrirSesion(opciones);
  const rotos = [];
  let fallos = 0;
  try {
    for (const nombre of lista) {
      if (lista.length > 1) console.log('\n' + '─'.repeat(72));
      const n = await correr(require(path.join(DIR, nombre)), sesion);
      fallos += n;
      if (n) rotos.push(nombre);
    }
  } finally {
    await sesion.cerrar();
  }
  if (lista.length > 1) {
    console.log('\n' + '═'.repeat(72));
    console.log(rotos.length
      ? `${rotos.length} de ${lista.length} caso(s) con discrepancias: ${rotos.join(', ')}`
      : `${lista.length} caso(s) de contraste sin discrepancias.`);
  }
  process.exit(fallos ? 1 : 0);
})();
