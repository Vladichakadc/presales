#!/usr/bin/env node
'use strict';
// Comprueba que el muro de autenticacion esta cerrado en una instancia YA en marcha (dev o
// produccion), sin sesion ni credenciales.
//
// POR QUE EXISTE
// `test/servidor-produccion.test.js` prueba esto mismo pero contra un servidor desechable que
// el propio test arranca con una base temporal — nunca contra la instancia real que alguien
// puede visitar. Y `.github/workflows/sonda-produccion.yml` sonda produccion desde fuera de
// este entorno, pero solo mira /salud y /login (las dos rutas PUBLICAS): nunca confirma que
// las protegidas de verdad exijan sesion. Este script cierra ese hueco: pide rutas protegidas
// sin cookie y confirma que responden 401/302, no 200.
//
//     npm run puerta                        contra http://localhost:4000
//     BASE_URL=https://... npm run puerta   contra cualquier otra instancia
//
// Sale con codigo 1 si alguna comprobacion falla, para poder usarse como gate en CI.

const BASE = process.env.BASE_URL || 'http://localhost:4000';

async function comprobar(nombre, fn) {
  try {
    await fn();
    console.log(`[ok] ${nombre}`);
    return true;
  } catch (e) {
    console.error(`[FALLA] ${nombre}: ${e.message}`);
    return false;
  }
}

async function main() {
  const resultados = await Promise.all([
    comprobar('/salud responde sin sesion (es publica)', async () => {
      const r = await fetch(`${BASE}/salud`);
      if (r.status !== 200 && r.status !== 503) throw new Error(`status ${r.status}`);
    }),
    comprobar('/login responde sin sesion (es publica)', async () => {
      const r = await fetch(`${BASE}/login`);
      if (r.status !== 200) throw new Error(`status ${r.status}`);
    }),
    comprobar('/api/catalog sin sesion responde 401 JSON', async () => {
      const r = await fetch(`${BASE}/api/catalog`);
      if (r.status !== 401) throw new Error(`status ${r.status} (esperaba 401)`);
    }),
    comprobar('/cotizador.html sin sesion redirige a /login', async () => {
      const r = await fetch(`${BASE}/cotizador.html`, { redirect: 'manual' });
      if (r.status !== 302) throw new Error(`status ${r.status} (esperaba 302)`);
      const destino = r.headers.get('location') || '';
      if (!destino.startsWith('/login')) throw new Error(`redirige a "${destino}", no a /login`);
    }),
  ]);

  if (resultados.some((ok) => !ok)) {
    console.error(`\nLa puerta esta abierta en ${BASE}.`);
    process.exit(1);
  }
  console.log(`\nLa puerta esta cerrada en ${BASE}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
