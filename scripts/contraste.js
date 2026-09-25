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
const { execSync } = require('child_process');
const { abrirSesion, correr } = require('./contraste-motor');
const cobertura = require('./ayuda/cobertura');

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

// Los modulos que EXISTEN, para poder distinguir «sin conducir» de «no existe». Se leen del
// directorio y no de una lista: una lista a mano se queda sin el modulo que alguien anada.
const PUBLIC_JS = path.join(__dirname, '..', 'public', 'js');
const modulosExistentes = () => fs.readdirSync(PUBLIC_JS).filter((f) => f.endsWith('.js')).sort();

const LOCK = path.join(DIR, 'cobertura.lock.json');

function escribirCobertura(crudo) {
  let commit = null;
  try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { commit = null; }
  const filas = cobertura.agregar(crudo, modulosExistentes());
  const informe = cobertura.informe(filas, { commit, fecha: new Date().toISOString().slice(0, 10) });
  fs.writeFileSync(LOCK, JSON.stringify(informe, null, 1) + '\n');

  const sinConducir = filas.filter((f) => f.estado === 'sin conducir');
  const rozados = filas.filter((f) => f.estado === 'rozado');
  console.log('\nCOBERTURA DE public/js/ — que ejercita de verdad esta corrida');
  console.log(`  (medida, no declarada · umbral de «rozado»: ${informe.umbralRozado} % de las funciones del modulo)`);
  for (const f of filas) {
    const cifra = f.pct == null ? '   —' : String(f.pct).padStart(3) + '%';
    const det = f.pct == null ? 'ninguna pantalla del contraste lo carga' : `${f.usadas}/${f.total} funciones`;
    console.log(`  ${f.estado === 'ejercitado' ? ' ' : '!'} ${f.modulo.padEnd(36)}${cifra}  ${det}`);
  }
  console.log(`\n  ${sinConducir.length} sin conducir · ${rozados.length} rozado(s) · escrito en ${path.relative(process.cwd(), LOCK)}`);
}

(async () => {
  const lista = todos ? casos : [pedido];
  // Un solo navegador y una sola sesion para todos los casos: en un ejecutor, arrancar
  // Chromium y volver a entrar por el muro N veces cuesta minutos y no aisla nada.
  const sesion = await abrirSesion(opciones);
  const rotos = [];
  let fallos = 0;
  let crudo = null;
  try {
    for (const nombre of lista) {
      if (lista.length > 1) console.log('\n' + '─'.repeat(72));
      const n = await correr(require(path.join(DIR, nombre)), sesion);
      fallos += n;
      if (n) rotos.push(nombre);
    }
  } finally {
    // `cerrar()` devuelve la cobertura acumulada de la sesion entera. Va en el `finally`
    // porque el navegador hay que soltarlo pase lo que pase; la cobertura es el subproducto.
    try { crudo = await sesion.cerrar(); } catch { crudo = null; }
  }

  // La cobertura solo se escribe con `--todos`: medirla con un caso suelto daria un informe
  // que dice que los demas modulos estan sin conducir, y eso seria falso — no se corrieron.
  if (todos && crudo) escribirCobertura(crudo);
  if (lista.length > 1) {
    console.log('\n' + '═'.repeat(72));
    console.log(rotos.length
      ? `${rotos.length} de ${lista.length} caso(s) con discrepancias: ${rotos.join(', ')}`
      : `${lista.length} caso(s) de contraste sin discrepancias.`);
  }
  process.exit(fallos ? 1 : 0);
})();
