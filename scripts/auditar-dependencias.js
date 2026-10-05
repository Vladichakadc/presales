#!/usr/bin/env node
'use strict';
/* EL FRENO DE LAS DEPENDENCIAS (2026-10-02).

     npm run auditar

   Hasta ese día `verificar.yml` corría `npm audit --audit-level=high` con `continue-on-error`:
   un aviso alto nunca ponía nada en rojo, y así convivieron dos altos y dos moderados, todos con
   arreglo publicado, sin que nada lo dijera. Era un control de seguridad que fallaba abierto.
   Este script falla cerrado:

   - Corre `npm audit --json`. Un aviso alto o crítico frena (sale con 1); moderados y bajos se
     listan sin frenar.
   - Un aviso alto que todavía no tiene arreglo no tiene por qué parar todos los push: se declara
     en EXCEPCIONES con su identificador (GHSA), el paquete, el motivo y la fecha en que caduca,
     como mucho a 90 días. Al caducar vuelve a frenar. Una excepción que ya no casa con ningún
     aviso también frena: si no, se quedaría ahí y taparía el aviso de mañana.
   - Si `npm audit` no responde o devuelve algo que no se puede leer (registro caído, sin red),
     frena con 2: no poder comprobar no es estar limpio.

   Solo usa módulos de Node: corre después de `npm ci`, pero no depende de él. */
const fs = require('fs');
const { spawnSync } = require('child_process');

// Avisos altos o críticos que se aceptan por un tiempo, con su motivo. Vacío del 2026-10-02 al
// 2026-10-05: los cuatro avisos del 2 de octubre tenían arreglo y se cerraron con `npm audit fix`.
//   { id: 'GHSA-xxxx-xxxx-xxxx', paquete: 'nombre', motivo: 'por qué no se puede arreglar aún
//     o por qué no aplica aquí', caduca: 'AAAA-MM-DD' }
const EXCEPCIONES = [
  { id: 'GHSA-vfj7-8cjw-p6xm', paquete: 'braces',
    motivo: 'Sin versión arreglada: la 3.0.3 es la última publicada y está en el rango (<=3.0.3), y lo único que '
      + 'propone npm es bajar nodemon de la 3.1.14 a la 1.14.10. Llega solo por nodemon -> chokidar, una '
      + 'dependencia de desarrollo que vigila archivos en `npm run dev`: el servidor no la carga y los '
      + 'patrones que expande los escribe quien desarrolla, no un usuario. La salida definitiva es cambiar '
      + 'nodemon por `node --watch`, que quita la cadena entera.',
    caduca: '2027-01-03' },
];

const FRENAN = new Set(['high', 'critical']);
const NOMBRE = { critical: 'CRÍTICO', high: 'ALTO', moderate: 'moderado', low: 'bajo', info: 'info' };
const MAX_DIAS = 90;
const GHSA = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

const masDias = (hoy, dias) => new Date(Date.parse(`${hoy}T00:00:00Z`) + dias * 86400000).toISOString().slice(0, 10);

// Qué dice npm del arreglo, sin prometer más de lo que hace `npm audit fix` (2026-10-05). Un
// objeto en `fixAvailable` es un cambio de versión de una dependencia directa; si es de versión
// mayor, `npm audit fix` no lo aplica. Con el aviso de `braces` de ese día, el «arreglo» era bajar
// nodemon de la 3.1.14 a la 1.14.10, y la línea decía «arreglo: npm audit fix».
function arregloDe(fix) {
  if (fix === true) return 'arreglo: npm audit fix';
  if (fix && typeof fix === 'object') {
    return fix.isSemVerMajor
      ? `sin arreglo directo: npm solo propone ${fix.name} ${fix.version}, un cambio de versión mayor`
      : `arreglo: npm audit fix, que deja ${fix.name} en ${fix.version}`;
  }
  return 'sin arreglo publicado';
}

// Los avisos del informe de `npm audit --json`, uno por identificador y paquete. En `via`, un
// objeto es un aviso; una cadena es otro paquete vulnerable por el que se llega a este, y ese ya
// trae su aviso en su propia entrada.
function avisosDe(informe) {
  if (!informe || typeof informe !== 'object' || informe.error || !informe.vulnerabilities || !informe.metadata) {
    throw new Error('el informe de npm audit no se puede leer');
  }
  const vistos = new Map();
  for (const v of Object.values(informe.vulnerabilities)) {
    for (const a of v.via || []) {
      if (!a || typeof a !== 'object') continue;
      const id = String(a.url || '').split('/').pop() || String(a.source);
      const clave = `${id}|${a.name}`;
      if (vistos.has(clave)) continue;
      vistos.set(clave, {
        id, paquete: a.name, gravedad: a.severity, titulo: a.title || '', url: a.url || '',
        rango: a.range || '', arreglo: arregloDe(v.fixAvailable),
      });
    }
  }
  return [...vistos.values()];
}

// Lo que frena, lo que solo se lista y qué está mal en las excepciones.
function evaluar(informe, excepciones = EXCEPCIONES, hoy = new Date().toISOString().slice(0, 10)) {
  const avisos = avisosDe(informe);
  const problemas = [];
  const vigentes = [];
  for (const e of excepciones) {
    const quien = `${(e && e.id) || '(sin id)'} en ${(e && e.paquete) || '(sin paquete)'}`;
    if (!e || !GHSA.test(String(e.id))) { problemas.push(`excepción ${quien}: el id tiene que ser un GHSA`); continue; }
    if (!e.paquete) { problemas.push(`excepción ${quien}: falta el paquete`); continue; }
    if (!e.motivo || String(e.motivo).trim().length < 15) { problemas.push(`excepción ${quien}: falta el motivo`); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.caduca)) || Number.isNaN(Date.parse(e.caduca))) { problemas.push(`excepción ${quien}: la caducidad no es una fecha AAAA-MM-DD`); continue; }
    if (e.caduca < hoy) { problemas.push(`excepción ${quien}: caducó el ${e.caduca}; revisa si ya hay arreglo`); continue; }
    if (e.caduca > masDias(hoy, MAX_DIAS)) { problemas.push(`excepción ${quien}: caduca el ${e.caduca}, a más de ${MAX_DIAS} días; una excepción sin fin es un freno quitado`); continue; }
    if (!avisos.some((a) => a.id === e.id && a.paquete === e.paquete)) { problemas.push(`excepción ${quien}: ya no casa con ningún aviso; quítala para que no tape el de mañana`); continue; }
    vigentes.push(e);
  }
  const cubierto = (a) => vigentes.some((e) => e.id === a.id && e.paquete === a.paquete);
  return {
    frenan: avisos.filter((a) => FRENAN.has(a.gravedad) && !cubierto(a)),
    exceptuados: avisos.filter((a) => FRENAN.has(a.gravedad) && cubierto(a)),
    informativos: avisos.filter((a) => !FRENAN.has(a.gravedad)),
    problemas,
  };
}

const linea = (a) => `  ${NOMBRE[a.gravedad] || a.gravedad}  ${a.paquete}  ${a.id}  ${a.titulo}  (${a.arreglo})`;

function informar(r) {
  const out = [];
  out.push(`[auditar] ${r.frenan.length} aviso(s) que frenan · ${r.exceptuados.length} exceptuado(s) · ${r.informativos.length} informativo(s) · ${r.problemas.length} problema(s) en las excepciones`);
  if (r.frenan.length) out.push('Frenan:', ...r.frenan.map(linea));
  if (r.exceptuados.length) out.push('Exceptuados (declarados en EXCEPCIONES, con caducidad):', ...r.exceptuados.map(linea));
  if (r.informativos.length) out.push('Informativos (no frenan):', ...r.informativos.map(linea));
  if (r.problemas.length) out.push('Excepciones:', ...r.problemas.map((p) => `  ${p}`));
  return out.join('\n');
}

if (require.main === module) {
  const npm = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let r;
  try {
    r = evaluar(JSON.parse(npm.stdout || ''));
  } catch (e) {
    console.error(`[auditar] no se pudo comprobar, y eso frena: ${e.message}. ${String(npm.stderr || '').trim().split('\n').pop() || ''}`);
    process.exit(2);
  }
  const texto = informar(r);
  console.log(texto);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Auditoría de dependencias\n\n\`\`\`\n${texto.replace(/`/g, "'")}\n\`\`\`\n`);
  }
  if (r.frenan.length || r.problemas.length) process.exit(1);
}

module.exports = { EXCEPCIONES, MAX_DIAS, avisosDe, evaluar, informar };
