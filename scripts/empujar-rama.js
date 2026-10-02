#!/usr/bin/env node
'use strict';
/* EMPUJAR UNA RAMA DE BOT SIN PISAR A NADIE (2026-10-02).

   Lo usan los tres workflows que dejan un cambio en una rama para que una persona lo revise:
   la vigía de fuentes (el lock), los datasheets de Aruba (los PDF) y la propuesta de la
   sincronización con IA (`legacyData/`). Vivía copiado en cada uno, y en la vigía la copia
   estaba rota: `git push --force-with-lease` sin valor esperado no tiene contra qué comparar en
   un checkout que solo trae `main`, así que en cuanto la rama existía el push se rechazaba
   («stale info») y la vigía pasó tres semanas sin avisar.

     node scripts/empujar-rama.js --rama <rama> --mensaje <mensaje> -- <ruta> [<ruta>...]

   1. Añade las rutas y, si no cambió nada en ellas, termina: `sin-cambios`.
   2. Hace el commit en `<rama>` reconstruida sobre lo que hay (main), como el bot.
   3. Trae la cabeza remota de `<rama>`. Si su COMMITTER no es el bot, una persona empujó
      encima y no se pisa: `retenida`. Se mira el committer y no el autor porque
      `peter-evans/create-pull-request` firmaba como autor a quien lanzaba el workflow. Y el
      bot tiene dos correos: el de este script y el que usaba peter-evans
      (`41898282+github-actions[bot]@…`), que es el de la rama `datasheets/aruba` que dejó la
      corrida del 2026-09-02. Con uno solo, esa rama se habría leído como de una persona y no
      se habría reconstruido nunca.
   4. Empuja con la lease que espera esa cabeza (o que la rama no exista): `empujada`. Si el
      remoto cambió entre medias, el push se rechaza: `fallida`, y sale con 1.

   El estado va a `$GITHUB_OUTPUT` (`estado=…`) para que el workflow lo cuente. Todo `git` se
   llama con argumentos y sin shell: la rama puede llevar el fabricante de una propuesta que
   generó una IA, y por eso además se valida su forma antes de nada. Solo usa módulos de Node:
   el job que lo ejecuta no instala dependencias. */
const fs = require('fs');
const { execFileSync } = require('child_process');

const BOT = { nombre: 'github-actions[bot]', correo: 'github-actions[bot]@users.noreply.github.com' };
const CORREOS_BOT = new Set([BOT.correo, '41898282+github-actions[bot]@users.noreply.github.com']);
const RAMA_VALIDA = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*$/;

function ramaValida(rama) {
  return typeof rama === 'string' && rama.length <= 100 && RAMA_VALIDA.test(rama) && !rama.includes('..') && !rama.endsWith('.lock');
}

function empujar({ rama, mensaje, rutas, cwd = process.cwd(), remoto = 'origin' }) {
  if (!ramaValida(rama)) throw new Error(`nombre de rama no válido: ${JSON.stringify(rama)}`);
  if (!mensaje || typeof mensaje !== 'string') throw new Error('falta el mensaje del commit');
  if (!Array.isArray(rutas) || !rutas.length) throw new Error('faltan las rutas que se guardan');
  const git = (args, opciones = {}) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opciones });

  git(['add', '--', ...rutas]);
  try {
    git(['diff', '--cached', '--quiet', '--', ...rutas]);
    return { estado: 'sin-cambios' };
  } catch { /* hay cambios */ }

  const ident = ['-c', `user.name=${BOT.nombre}`, '-c', `user.email=${BOT.correo}`];
  git(['checkout', '-q', '-B', rama]);
  git([...ident, 'commit', '-q', '-m', mensaje]);

  const seguimiento = `refs/remotes/${remoto}/${rama}`;
  let esperado = '';
  let hayRemota = true;
  try {
    git(['fetch', '-q', '--depth=1', remoto, `+refs/heads/${rama}:${seguimiento}`]);
  } catch { hayRemota = false; }
  if (hayRemota) {
    const committer = git(['log', '-1', '--format=%ce', seguimiento]).trim();
    if (!CORREOS_BOT.has(committer)) return { estado: 'retenida', committer };
    esperado = git(['rev-parse', seguimiento]).trim();
  }
  try {
    git(['push', '-q', `--force-with-lease=${rama}:${esperado}`, remoto, rama]);
  } catch (e) {
    return { estado: 'fallida', motivo: String(e.stderr || e.message).trim().split('\n').pop() };
  }
  return { estado: 'empujada' };
}

function leerArgs(argv) {
  const out = { rutas: [] };
  const corte = argv.indexOf('--');
  const opciones = corte >= 0 ? argv.slice(0, corte) : argv;
  out.rutas = corte >= 0 ? argv.slice(corte + 1) : [];
  for (let i = 0; i < opciones.length; i += 2) {
    if (opciones[i] === '--rama') out.rama = opciones[i + 1];
    else if (opciones[i] === '--mensaje') out.mensaje = opciones[i + 1];
    else throw new Error(`opción desconocida: ${opciones[i]}`);
  }
  return out;
}

if (require.main === module) {
  let r;
  try {
    r = empujar(leerArgs(process.argv.slice(2)));
  } catch (e) {
    console.error(`[empujar-rama] ${e.message}`);
    process.exit(2);
  }
  const texto = {
    'sin-cambios': 'No cambió nada en las rutas: no hay nada que guardar.',
    empujada: 'Empujada.',
    retenida: `La rama tiene encima un commit que no es del bot (${r.committer}): no se pisa.`,
    fallida: `No se pudo empujar: ${r.motivo}`,
  }[r.estado];
  console.log(`[empujar-rama] ${r.estado} · ${texto}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `estado=${r.estado}\n`);
  if (r.estado === 'fallida') process.exit(1);
}

module.exports = { BOT, CORREOS_BOT, ramaValida, empujar, leerArgs };
