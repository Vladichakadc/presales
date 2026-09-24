'use strict';
/* ══ RUNNER E2E (pendiente #40, 2026-09-15 — mejora propuesta ejecutada) ══
   Levanta el servidor real en un puerto de prueba, espera a que /login responda 200,
   ejecuta los test/e2e/e2e-*.js EN SERIE (comparten el servidor y el orden evita que se
   pisen el puerto) y apaga el servidor pase lo que pase. El código de salida es 1 si
   cualquier script falla — es lo que CI espera para marcar la corrida en rojo.

   Uso:  npm run e2e
   Vars: E2E_PORT (por defecto 4131), E2E_USER / E2E_PASSWORD (credenciales de la corrida,
         nunca las de producción), E2E_SOLO=filtro para correr un solo script,
         E2E_LENTITUD=N para ralentizar N veces la CPU de cada página (ver ayuda.js).

   NO forma parte de `npm run verificar`: necesita Playwright y un navegador, que no caben
   en la verificación rápida de cada push. Desde el 2026-09-24 corre en CI dentro del job de
   `pantallas.yml`, que ya trae Playwright y Chromium (ver test/e2e/LEEME.md). */

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const PUERTO = process.env.E2E_PORT || '4131';
const BASE = `http://localhost:${PUERTO}`;

function esperarServidor(intentos = 60) {
  return new Promise((resolve, reject) => {
    // Declaraciones de función (no const flecha): se alzan y probar/reintentar pueden
    // llamarse entre sí sin «used before defined».
    function probar(n) {
      const req = http.get(BASE + '/login', (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        reintentar(n);
      });
      req.on('error', () => reintentar(n));
      req.setTimeout(2000, () => { req.destroy(); reintentar(n); });
    }
    function reintentar(n) {
      if (n <= 0) return reject(new Error('el servidor no respondió 200 en /login a tiempo'));
      setTimeout(() => probar(n - 1), 500);
    }
    probar(intentos);
  });
}

(async () => {
  // Playwright tiene que estar ANTES de levantar nada: sin él no hay corrida y el
  // servidor quedaría colgado. La carga vive en ayuda.js (mensaje de instalación claro).
  require('./ayuda').cargarPlaywright();

  const scripts = fs.readdirSync(__dirname)
    .filter((f) => /^e2e-.*\.js$/.test(f))
    .filter((f) => !process.env.E2E_SOLO || f.includes(process.env.E2E_SOLO))
    .sort();
  if (!scripts.length) {
    console.error('No hay scripts e2e-*.js que ejecutar' + (process.env.E2E_SOLO ? ` con el filtro «${process.env.E2E_SOLO}»` : ''));
    process.exit(2);
  }

  console.log(`[e2e] levantando el servidor en ${BASE} (AUTH de corrida, base efímera)…`);
  // Base y auth en un directorio PROPIO DE ESTA CORRIDA, que se borra al terminar: la corrida
  // nunca toca el datos.sqlite de desarrollo. Hasta el 2026-09-24 eran rutas fijas en /tmp y
  // el usuarios.json del 22-sep seguía allí: una corrida con otra E2E_PASSWORD no podía entrar
  // (el almacén de usuarios solo se siembra desde AUTH_PASSWORD si el archivo NO existe) y dos
  // corridas a la vez compartían base. Una corrida tiene que empezar de cero para no depender
  // de la anterior.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-presales-'));
  const servidor = spawn(process.execPath, ['server/server.js'], {
    cwd: RAIZ,
    detached: true, // grupo de proceso propio: al matar, muere el árbol entero
    env: {
      ...process.env,
      PORT: PUERTO,
      AUTH_USER: process.env.E2E_USER || 'presales',
      AUTH_PASSWORD: process.env.E2E_PASSWORD || 'e2e-local',
      SESSION_SECRET: 'secreto-solo-de-la-corrida-e2e',
      DATABASE_PATH: path.join(tmp, 'catalogo.sqlite'),
      AUTH_STATE_DIR: path.join(tmp, 'auth'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logServidor = '';
  servidor.stdout.on('data', (d) => { logServidor += d; });
  servidor.stderr.on('data', (d) => { logServidor += d; });

  const apagar = () => { try { process.kill(-servidor.pid, 'SIGTERM'); } catch { /* ya muerto */ } };
  process.on('SIGINT', () => { apagar(); process.exit(130); });

  let rc = 0;
  try {
    await esperarServidor();
    console.log('[e2e] servidor arriba; ejecutando ' + scripts.length + ' script(s): ' + scripts.join(', '));
    for (const s of scripts) {
      console.log(`\n══ ${s} ══`);
      const t0 = Date.now();
      const r = spawn(process.execPath, [path.join(__dirname, s)], {
        cwd: RAIZ,
        env: { ...process.env, E2E_BASE: BASE },
        stdio: 'inherit',
      });
      const code = await new Promise((res) => r.on('close', res));
      console.log(`── ${s}: ${code === 0 ? 'verde' : 'FALLO (' + code + ')'} en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      if (code !== 0) rc = 1;
    }
  } catch (e) {
    console.error('[e2e] ' + e.message);
    console.error(logServidor.slice(-2000));
    rc = 2;
  } finally {
    apagar();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* nada que limpiar */ }
  }
  console.log(rc === 0 ? '\n[e2e] TODA LA BATERÍA EN VERDE' : `\n[e2e] corrida con fallos (rc=${rc})`);
  process.exit(rc);
})();
