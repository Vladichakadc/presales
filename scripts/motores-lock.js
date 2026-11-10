'use strict';
// CONTRATO COMÚN DE MOTOR (2026-11-10, auditoría de los dimensionadores, fase 2).
//
// La auditoría pedía que la recomendación no pudiera cambiar sin dejar rastro de qué la produjo. El
// catálogo ya lo deja (`datasetVersion`, PR #153); el motor solo lo dejaba en Fortinet. Ahora cada
// motor declara `VERSION_MOTOR`, su página la pasa a `BOM.fijarCatalogo` y la hoja «Supuestos» la
// enseña. Para que esa versión diga la verdad, este lock guarda la huella de los archivos de cada
// motor: un cambio de esos archivos sin subir la versión pone en rojo test/motores-version.test.js.
//
//   node scripts/motores-lock.js               # comprueba (sale con 1 si algo no casa)
//   node scripts/motores-lock.js --actualizar  # renueva el lock; se niega si un motor cambió sin subir versión
//
// Fuera del lock, a propósito: los módulos que comparten todos (`pqc.js`, `ficha.js`, `bom.js`), que
// obligarían a subir seis versiones por un cambio común, y las páginas de Nokia y Starlink, que no
// separan su motor de la página (Nokia) o lo verifican byte a byte contra su línea base (Starlink).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const LOCK = path.join(__dirname, 'motores.lock.json');

// `declara`: el archivo con `VERSION_MOTOR`; `archivos`: todo lo que decide su recomendación.
const MOTORES = [
  { id: 'cisco', declara: 'public/js/cisco-motor.js', archivos: ['public/js/cisco-motor.js'], global: 'CiscoMotor', pagina: 'public/js/dimensionador-cisco-catalyst8k.js' },
  { id: 'huawei', declara: 'public/js/huawei-motor.js', archivos: ['public/js/huawei-motor.js'], global: 'HuaweiMotor', pagina: 'public/js/dimensionador-huawei-netengine.js' },
  { id: 'juniper', declara: 'public/js/juniper-motor.js', archivos: ['public/js/juniper-motor.js'], global: 'JuniperMotor', pagina: 'public/js/dimensionador-juniper-srx.js' },
  { id: 'mikrotik', declara: 'public/js/mikrotik-motor.js', archivos: ['public/js/mikrotik-motor.js'], global: 'MikrotikMotor', pagina: 'public/js/dimensionador-mikrotik-routeros.js' },
  { id: 'aruba', declara: 'public/js/aruba-reglas.js', archivos: ['public/js/aruba-reglas.js', 'public/js/motor-ingenieria.js'], global: 'ArubaReglas', pagina: 'public/js/dimensionador-aruba-edgeconnect.js' },
  { id: 'fortinet', declara: 'public/js/fortinet-motor.js', archivos: ['public/js/fortinet-motor.js', 'public/js/fortinet-reglas.js'], global: 'FortinetMotor', pagina: 'public/js/dimensionador-fortinet-fortigate.js' },
];

const VERSION = /\bVERSION_MOTOR = '(\d+\.\d+\.\d+)'/;

// La huella de un motor: sus archivos en orden, con su ruta, y los fines de línea normalizados (un
// checkout de Windows no cambia la huella).
function huella(archivos, leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8')) {
  const h = crypto.createHash('sha256');
  for (const r of archivos) h.update(`${r}\0${leer(r).replace(/\r\n/g, '\n')}\0`);
  return `sha256:${h.digest('hex')}`;
}

function versionDe(texto) {
  const m = VERSION.exec(texto);
  return m ? m[1] : null;
}

const comparar = (a, b) => {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

// Puro: lo que hay hoy (`actual`: id → {version, huella}) frente al lock. Devuelve los problemas, en texto.
function problemas(actual, lock) {
  const out = [];
  for (const [id, a] of Object.entries(actual)) {
    const l = lock && lock[id];
    if (!a.version) { out.push(`${id}: su archivo no declara VERSION_MOTOR = 'x.y.z'`); continue; }
    if (!l) { out.push(`${id}: no está en scripts/motores.lock.json (node scripts/motores-lock.js --actualizar)`); continue; }
    if (a.huella !== l.huella && a.version === l.version) {
      out.push(`${id}: el motor cambió y sigue en la versión ${a.version}: súbela (cambia lo que recomienda o puede cambiarlo) y renueva el lock (node scripts/motores-lock.js --actualizar)`);
    } else if (a.version !== l.version && comparar(a.version, l.version) < 0) {
      out.push(`${id}: la versión baja de ${l.version} a ${a.version}: una versión ya publicada no se reutiliza`);
    } else if (a.version !== l.version || a.huella !== l.huella) {
      out.push(`${id}: el lock dice ${l.version} y el motor ${a.version}: renueva el lock (node scripts/motores-lock.js --actualizar)`);
    }
  }
  for (const id of Object.keys(lock || {})) if (!(id in actual)) out.push(`${id}: está en el lock y ya no es un motor de MOTORES`);
  return out;
}

function estadoActual(leer) {
  const lectura = leer || ((r) => fs.readFileSync(path.join(RAIZ, r), 'utf8'));
  const out = {};
  for (const m of MOTORES) out[m.id] = { version: versionDe(lectura(m.declara)), huella: huella(m.archivos, lectura), archivos: m.archivos };
  return out;
}

function leerLock() {
  try { return JSON.parse(fs.readFileSync(LOCK, 'utf8')).motores || {}; } catch { return {}; }
}

function main(argv) {
  const actual = estadoActual();
  const lock = leerLock();
  const lista = problemas(actual, lock);
  if (argv.includes('--actualizar')) {
    const sinSubir = lista.filter((p) => /sigue en la versión|la versión baja|no declara/.test(p));
    if (sinSubir.length) {
      console.error(`No se renueva el lock:\n  ${sinSubir.join('\n  ')}`);
      return 1;
    }
    const motores = {};
    for (const [id, a] of Object.entries(actual)) motores[id] = { version: a.version, archivos: a.archivos, huella: a.huella };
    fs.writeFileSync(LOCK, `${JSON.stringify({ motores }, null, 2)}\n`);
    console.log(`Lock renovado: ${Object.entries(motores).map(([id, m]) => `${id} ${m.version}`).join(', ')}.`);
    return 0;
  }
  if (lista.length) {
    console.log(lista.join('\n'));
    return 1;
  }
  console.log(`Los ${MOTORES.length} motores casan con su lock.`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { MOTORES, huella, versionDe, problemas, estadoActual, leerLock, LOCK };
