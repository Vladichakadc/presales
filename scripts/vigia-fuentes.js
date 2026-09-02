#!/usr/bin/env node
'use strict';
// Vigila los documentos oficiales de los que sale el catalogo y avisa cuando cambian.
//
// EL PROBLEMA QUE RESUELVE
// Este catalogo se verifica contra documentos que los fabricantes actualizan sin avisar: el
// Product Matrix de Fortinet, la matriz SRX de Juniper, los boletines de fin de venta de
// Cisco. Hasta ahora la unica forma de enterarse era que alguien volviera a mirar. Con la
// Fase 2 cada fuente quedo registrada en legacyData/fuentes.js con su fecha; lo que faltaba
// era saber cuando el documento de la otra punta deja de ser el mismo.
//
// NO EXTRAE NADA, SOLO VIGILA. Compara el hash del documento y, si cambio, lo dice. La
// lectura sigue siendo humana y el dato sigue entrando por `npm run cps`, `npm run juniper`
// o `npm run huawei`, con su doble anclaje. Automatizar la extraccion de una tabla de PDF es
// justo donde se cuelan las filas desplazadas, y eso este repositorio no lo hace.
//
//     npm run vigia               compara y reporta
//     npm run vigia -- --escribir compara y actualiza fuentes.lock.json
//     npm run vigia -- --json     la misma salida como JSON, para el workflow
//
// DONDE CORRE
// **No desde el entorno donde se edita este repositorio**: el proxy de egreso de la
// organizacion responde 403 a fortinet.com, juniper.net y los dominios de HPE y Huawei. Se
// corre desde una maquina con salida, o desde los ejecutores de GitHub Actions, que no pasan
// por ese proxy. Si tampoco desde alli se alcanzan, el informe lo dice con el codigo exacto
// en vez de dar el documento por bueno: un 403 de politica se reporta, no se rodea.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { FUENTES } = require('../server/seed/legacyData/fuentes');

const LOCK = path.join(__dirname, '..', 'server', 'seed', 'legacyData', 'fuentes.lock.json');
const args = process.argv.slice(2);
const ESCRIBIR = args.includes('--escribir');
const JSON_OUT = args.includes('--json');
const TIEMPO_LIMITE = 45000;

function leerLock() {
  try {
    return JSON.parse(fs.readFileSync(LOCK, 'utf8'));
  } catch {
    return { documentos: {} };
  }
}

// La clave identifica al documento, no a su posicion en la lista: reordenar FUENTES no debe
// perder el historial de hashes.
const claveDe = (vendor, f) => `${vendor}::${f.url}`;

async function revisar(vendor, f) {
  const base = { vendor, documento: f.documento, url: f.url };
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE);
  try {
    const res = await fetch(f.url, {
      redirect: 'follow',
      signal: control.signal,
      headers: { 'User-Agent': 'presales-vigia-fuentes/1.0 (+catalogo interno)' },
    });
    if (!res.ok) {
      return { ...base, estado: 'inalcanzable', detalle: `HTTP ${res.status}` };
    }
    const cuerpo = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash('sha256').update(cuerpo).digest('hex');
    return {
      ...base,
      estado: 'leido',
      hash,
      bytes: cuerpo.length,
      tipo: res.headers.get('content-type') || null,
    };
  } catch (err) {
    const detalle = err.name === 'AbortError' ? `sin respuesta en ${TIEMPO_LIMITE / 1000} s` : err.message;
    return { ...base, estado: 'inalcanzable', detalle };
  } finally {
    clearTimeout(reloj);
  }
}

async function correr() {
  const lock = leerLock();
  const pendientes = [];
  for (const [vendor, lista] of Object.entries(FUENTES)) {
    // Una fuente sin URL no se puede vigilar: se declara y no cuenta como revisada.
    for (const f of lista) {
      if (f.url) pendientes.push({ vendor, f });
      else pendientes.push({ vendor, f, sinUrl: true });
    }
  }

  const resultados = [];
  for (const p of pendientes) {
    if (p.sinUrl) {
      resultados.push({ vendor: p.vendor, documento: p.f.documento, url: null, estado: 'sin url' });
      continue;
    }
    const r = await revisar(p.vendor, p.f);
    const clave = claveDe(p.vendor, p.f);
    const previo = lock.documentos[clave];
    r.estable = p.f.estable !== false;
    if (r.estado === 'leido') {
      if (!previo) r.cambio = 'primera medición';
      else if (previo.hash === r.hash) r.cambio = 'sin cambios';
      else {
        // Una pagina de producto cambia de hash en cada peticion por marcas de tiempo y
        // banners rotatorios, sin que el dato haya cambiado. Se mide igual y se reporta,
        // pero no dispara alarma: un vigia que avisa en falso cada semana se ignora, y
        // entonces no avisa de nada.
        r.cambio = r.estable ? 'CAMBIÓ' : 'varió (página dinámica)';
        r.hashPrevio = previo.hash;
        r.medidoAntes = previo.medido;
      }
    }
    resultados.push(r);
  }

  const cambiados = resultados.filter((r) => r.cambio === 'CAMBIÓ');
  const nuevos = resultados.filter((r) => r.cambio === 'primera medición');
  const inalcanzables = resultados.filter((r) => r.estado === 'inalcanzable');

  if (ESCRIBIR) {
    const ahora = new Date().toISOString();
    for (const r of resultados) {
      if (r.estado !== 'leido') continue;
      const entrada = pendientes.find((p) => !p.sinUrl && p.f.url === r.url && p.vendor === r.vendor);
      lock.documentos[claveDe(r.vendor, entrada.f)] = {
        documento: r.documento, hash: r.hash, bytes: r.bytes, medido: ahora,
      };
    }
    lock.revisado = ahora;
    fs.writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
  }

  return { resultados, cambiados, nuevos, inalcanzables };
}

function imprimir(d) {
  console.log('\n== VIGIA DE FUENTES ==\n');
  for (const r of d.resultados) {
    const marca = r.estado !== 'leido' ? '[ ---- ]'
      : (r.cambio === 'CAMBIÓ' ? '[CAMBIO]' : (r.cambio === 'varió (página dinámica)' ? '[ nota ]' : '[  ok  ]'));
    const cola = r.estado === 'leido'
      ? `${r.cambio}${r.bytes ? ` · ${r.bytes} bytes` : ''}`
      : (r.estado === 'sin url' ? 'sin URL que vigilar' : `inalcanzable: ${r.detalle}`);
    console.log(`${marca} ${r.vendor.padEnd(9)} ${r.documento}`);
    console.log(`          ${cola}`);
  }

  console.log(`\n${d.cambiados.length} cambio(s), ${d.nuevos.length} primera(s) medición(es), ${d.inalcanzables.length} inalcanzable(s).`);
  if (d.inalcanzables.length) {
    console.log('\nLos inalcanzables NO son "sin cambios": son documentos que no se pudieron leer.');
    console.log('Si es un 403, es la política de egreso y se reporta, no se rodea.');
  }
  if (d.cambiados.length) {
    console.log('\nUn documento que cambió NO se transcribe solo. Se abre, se lee y el dato entra');
    console.log('por npm run cps / juniper / huawei, que contrastan antes de escribir.\n');
  } else {
    console.log('');
  }
}

if (require.main === module) {
  correr().then((d) => {
    if (JSON_OUT) console.log(JSON.stringify(d, null, 2));
    else imprimir(d);
    // Codigo 0 siempre: que una fuente cambie es informacion, no un fallo del repositorio.
    // El workflow decide que hacer leyendo el JSON.
    process.exit(0);
  }).catch((err) => {
    console.error('[vigia] error inesperado:', err);
    process.exit(1);
  });
}

module.exports = { correr, revisar, claveDe };
