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
//     npm run vigia                          compara y reporta
//     npm run vigia -- --escribir            compara y actualiza fuentes.lock.json
//     npm run vigia -- --json                la misma salida como JSON, para el workflow
//     npm run vigia -- --revisado <v> <url>  declara que una persona ya contrasto el cambio
//
// EL TERCER ESTADO, Y POR QUE HIZO FALTA (2026-09-14)
// Hasta hoy `--escribir` guardaba el hash nuevo de TODO documento legible, incluidos los que
// acababa de marcar CAMBIO. Y este lock es la unica memoria del vigia, asi que la semana
// siguiente comparaba contra el hash que se acababa de tragar, decia "sin cambios" y se
// ponia en verde solo. La obligacion humana -abrir el PDF y volver a contrastar- vivia siete
// dias en un comentario de GitHub y desaparecia.
//
// Medido, no supuesto: el boletin EOL de Cisco cambio en tres mediciones consecutivas
// (48829947 el 02-sep, 4734ea1e el 07-sep, f57ff23f el 14-sep) sin que nadie lo leyera, y
// cada semana se reportaba como hallazgo nuevo porque cada semana se borraba el anterior.
//
// El vicio es el conocido de este repositorio: DOS ESTADOS DONDE HACEN FALTA TRES. "igual" /
// "distinto" necesita un tercero, "distinto y todavia no revisado por una persona" -- el
// mismo que protege `redund` al no leer `undefined` como `false`. Asi que el lock separa:
//
//     hashVerificado   el ultimo que UNA PERSONA contrasto. Es contra este que se compara,
//                      siempre, y no se mueve solo.
//     visto            lo ultimo que el vigia vio, cuando difiere. Se actualiza cada semana.
//     pendienteDesde   cuando aparecio la divergencia. NO se reinicia si el documento vuelve
//                      a cambiar: mide cuanto lleva sin revisar, no cuando se vio.
//
// Se limpia con `--revisado`, que es un acto humano y deja diff en git -- el mismo principio
// por el que la pestana de fuentes no ofrece boton de borrado para lo que vive en el codigo.
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
const MS_SEMANA = 7 * 24 * 60 * 60 * 1000;

function leerLock(ruta) {
  try {
    return JSON.parse(fs.readFileSync(ruta || LOCK, 'utf8'));
  } catch {
    return { documentos: {} };
  }
}

function guardarLock(lock, ruta) {
  fs.writeFileSync(ruta || LOCK, `${JSON.stringify(lock, null, 2)}\n`);
}

// MIGRACION DEL LOCK v1. Una entrada vieja traia `hash` haciendo de las dos cosas a la vez
// -lo ultimo visto y lo ultimo bueno-, que es justo el defecto que se corrige. Al migrarla se
// lee como VERIFICADA: es contra ese hash que el vigia venia comparando, asi que tratarla de
// otro modo inventaria una divergencia que nadie declaro. Sin perdida y sin tocar el archivo
// hasta la primera escritura, igual que `migrarPerfiles()` en bom.js.
function normalizarEntrada(e) {
  if (!e) return null;
  if (e.hashVerificado) return e;
  return { documento: e.documento, hashVerificado: e.hash, bytes: e.bytes, medido: e.medido };
}

// La clave identifica al documento, no a su posicion en la lista: reordenar FUENTES no debe
// perder el historial de hashes.
const claveDe = (vendor, f) => `${vendor}::${f.url}`;

const semanasDesde = (iso) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / MS_SEMANA);
};

// Lo que espera una revision humana, leido del lock y SIN salir a la red. Es lo que consulta
// `npm run catalogo`: un documento sigue pendiente aunque esta semana no se haya podido leer
// -un 403 no cancela una obligacion pendiente, igual que no cuenta como "sin cambios".
function pendientes(lock) {
  const l = lock || leerLock();
  const out = [];
  for (const [clave, crudo] of Object.entries(l.documentos || {})) {
    const e = normalizarEntrada(crudo);
    if (!e || !e.visto) continue;
    const [vendor, url] = [clave.slice(0, clave.indexOf('::')), clave.slice(clave.indexOf('::') + 2)];
    out.push({
      clave,
      vendor,
      url,
      documento: e.documento,
      hashVerificado: e.hashVerificado,
      hashVisto: e.visto.hash,
      bytesVerificado: e.bytes,
      bytesVisto: e.visto.bytes,
      pendienteDesde: e.pendienteDesde || e.visto.medido,
      semanas: semanasDesde(e.pendienteDesde || e.visto.medido),
    });
  }
  return out.sort((a, b) => (b.semanas || 0) - (a.semanas || 0));
}

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

// Decide en que estado queda una medicion frente a lo ya verificado. Extraida de `correr()`
// por lo mismo que `aplicarAlLock`: es pura, asi que la prueba puede encadenar varias semanas
// sin red y sin copiar la regla -- dos copias de la misma regla se desincronizan, que es el
// fallo que `llevarABom` tuvo en seis archivos.
function clasificar(r, previo, ahora) {
  if (r.estado !== 'leido') return r;
  if (!previo) {
    r.cambio = 'primera medición';
    return r;
  }
  if (previo.hashVerificado === r.hash) {
    r.cambio = 'sin cambios';
    return r;
  }
  // Una pagina de producto cambia de hash en cada peticion por marcas de tiempo y banners
  // rotatorios, sin que el dato haya cambiado. Se mide igual y se reporta, pero no dispara
  // alarma: un vigia que avisa en falso cada semana se ignora, y entonces no avisa de nada.
  r.cambio = r.estable ? 'CAMBIÓ' : 'varió (página dinámica)';
  r.hashPrevio = previo.hashVerificado;
  r.medidoAntes = previo.medido;
  if (r.estable) {
    // Si ya venia pendiente se conserva la fecha ORIGINAL de la divergencia: lo que interesa
    // es cuanto lleva sin que nadie lo mire, no cuando cambio por ultima vez.
    r.pendienteDesde = previo.pendienteDesde || ahora;
    r.semanas = semanasDesde(r.pendienteDesde);
    r.yaPendiente = Boolean(previo.visto);
  }
  return r;
}

// DONDE VIVIA EL DEFECTO, y por eso esta aqui fuera y no dentro de `correr()`: aquella
// version escribia el hash nuevo de todo documento legible, incluidos los que acababa de
// marcar CAMBIO. Siendo pura sobre (lock, resultados) se puede probar sin red, que es lo que
// permite sabotearla y comprobar que la prueba lo caza -- como se hizo con el ancla de
// `verdict-sel`. Devuelve el mismo objeto `lock`, ya mutado.
function aplicarAlLock(lock, resultados, ahora) {
  for (const r of resultados) {
    if (r.estado !== 'leido') continue;
    const previo = normalizarEntrada(lock.documentos[r.clave]);

    if (r.cambio === 'CAMBIÓ') {
      // EL TERCER ESTADO. Conserva `hashVerificado` y aparta lo visto.
      lock.documentos[r.clave] = {
        documento: r.documento,
        hashVerificado: previo.hashVerificado,
        bytes: previo.bytes,
        medido: previo.medido,
        visto: { hash: r.hash, bytes: r.bytes, medido: ahora },
        pendienteDesde: r.pendienteDesde,
      };
      continue;
    }

    // Sin cambio, primera medicion, o pagina dinamica (`estable: false`, que nunca alarma
    // porque su hash varia en cada peticion y retenerla la dejaria pendiente para siempre,
    // que es el aviso en falso que `estable` existe para evitar): el lock avanza. Al
    // reescribir la entrada entera se limpian `visto` y `pendienteDesde` si los hubiera,
    // que es lo correcto cuando el documento vuelve al hash ya verificado.
    lock.documentos[r.clave] = {
      documento: r.documento, hashVerificado: r.hash, bytes: r.bytes, medido: ahora,
    };
  }
  lock.revisado = ahora;
  return lock;
}

async function correr() {
  const lock = leerLock();
  const pendientesRed = [];
  for (const [vendor, lista] of Object.entries(FUENTES)) {
    // Una fuente sin URL no se puede vigilar: se declara y no cuenta como revisada.
    for (const f of lista) {
      if (f.url) pendientesRed.push({ vendor, f });
      else pendientesRed.push({ vendor, f, sinUrl: true });
    }
  }

  const resultados = [];
  for (const p of pendientesRed) {
    if (p.sinUrl) {
      resultados.push({ vendor: p.vendor, documento: p.f.documento, url: null, estado: 'sin url' });
      continue;
    }
    const r = await revisar(p.vendor, p.f);
    const clave = claveDe(p.vendor, p.f);
    r.clave = clave;
    const previo = normalizarEntrada(lock.documentos[clave]);
    r.estable = p.f.estable !== false;
    clasificar(r, previo, new Date().toISOString());
    resultados.push(r);
  }

  const cambiados = resultados.filter((r) => r.cambio === 'CAMBIÓ');
  const nuevos = resultados.filter((r) => r.cambio === 'primera medición');
  const inalcanzables = resultados.filter((r) => r.estado === 'inalcanzable');

  if (ESCRIBIR) {
    guardarLock(aplicarAlLock(lock, resultados, new Date().toISOString()));
  }

  return { resultados, cambiados, nuevos, inalcanzables, pendientes: pendientes(lock) };
}

// `--revisado <vendor> <url>`: una persona ya abrio el documento y contrasto el dato, asi que
// lo visto pasa a ser lo verificado. Es el unico camino que mueve `hashVerificado`, y por eso
// es un comando aparte y no un efecto secundario de la corrida semanal.
function marcarRevisado(vendor, urlOTrozo, ruta) {
  const lock = leerLock(ruta);
  const claves = Object.keys(lock.documentos || {}).filter((k) => k.startsWith(`${vendor}::`));
  if (!claves.length) {
    return { ok: false, error: `no hay ninguna fuente registrada para "${vendor}"` };
  }
  const exacta = claves.find((k) => k === `${vendor}::${urlOTrozo}`);
  // Se acepta un trozo de la URL por comodidad -son largas- pero solo si identifica a UNA.
  // Ante dos candidatas no se elige: fallar aqui cuesta un segundo, marcar el documento
  // equivocado como verificado apaga una alarma que seguia siendo cierta.
  const candidatas = exacta ? [exacta] : claves.filter((k) => k.includes(urlOTrozo));
  if (!candidatas.length) {
    return { ok: false, error: `ninguna fuente de "${vendor}" casa con "${urlOTrozo}"`, claves };
  }
  if (candidatas.length > 1) {
    return { ok: false, error: `"${urlOTrozo}" casa con ${candidatas.length} fuentes de "${vendor}"`, claves: candidatas };
  }

  const clave = candidatas[0];
  const e = normalizarEntrada(lock.documentos[clave]);
  if (!e.visto) {
    // Decir "hecho" sin haber cambiado nada seria la misma pequena mentira que este vigia
    // existe para no contar.
    return { ok: false, error: `"${e.documento}" no tiene ningún cambio pendiente de revisar` };
  }

  lock.documentos[clave] = {
    documento: e.documento,
    hashVerificado: e.visto.hash,
    bytes: e.visto.bytes,
    medido: e.visto.medido,
  };
  guardarLock(lock, ruta);
  return { ok: true, clave, documento: e.documento, hash: e.visto.hash };
}

function imprimir(d) {
  console.log('\n== VIGIA DE FUENTES ==\n');
  for (const r of d.resultados) {
    const marca = r.estado !== 'leido' ? '[ ---- ]'
      : (r.cambio === 'CAMBIÓ' ? '[CAMBIO]' : (r.cambio === 'varió (página dinámica)' ? '[ nota ]' : '[  ok  ]'));
    let cola;
    if (r.estado !== 'leido') {
      cola = r.estado === 'sin url' ? 'sin URL que vigilar' : `inalcanzable: ${r.detalle}`;
    } else if (r.cambio === 'CAMBIÓ') {
      // Distinguir lo nuevo de la cola que envejece es lo que impide que una alarma repetida
      // cada semana se lea como ruido.
      const edad = r.semanas > 0 ? `SIGUE PENDIENTE desde hace ${r.semanas} semana(s)` : 'CAMBIÓ esta semana';
      cola = `${edad} · ${r.bytes} bytes`;
    } else {
      cola = `${r.cambio}${r.bytes ? ` · ${r.bytes} bytes` : ''}`;
    }
    console.log(`${marca} ${r.vendor.padEnd(9)} ${r.documento}`);
    console.log(`          ${cola}`);
  }

  console.log(`\n${d.cambiados.length} cambio(s), ${d.nuevos.length} primera(s) medición(es), ${d.inalcanzables.length} inalcanzable(s).`);
  if (d.pendientes.length) {
    console.log(`\n${d.pendientes.length} documento(s) esperando revisión humana:`);
    for (const p of d.pendientes) {
      console.log(`  - ${p.vendor} · ${p.documento} (${p.semanas} semana(s))`);
      console.log(`    npm run vigia -- --revisado ${p.vendor} ${p.url}`);
    }
  }
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
  const i = args.indexOf('--revisado');
  if (i >= 0) {
    const [vendor, url] = [args[i + 1], args[i + 2]];
    if (!vendor || !url) {
      console.error('Uso: npm run vigia -- --revisado <fabricante> <url o trozo de url>');
      process.exit(1);
    }
    const r = marcarRevisado(vendor, url);
    if (!r.ok) {
      console.error(`[vigia] ${r.error}`);
      if (r.claves) for (const k of r.claves) console.error(`        ${k}`);
      process.exit(1);
    }
    console.log(`[vigia] "${r.documento}" queda verificado contra ${r.hash.slice(0, 16)}.`);
    console.log('        El cambio del lock deja diff en git: commitealo con el dato que entró.');
    process.exit(0);
  }

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

module.exports = {
  correr, revisar, claveDe, pendientes, normalizarEntrada, marcarRevisado, aplicarAlLock,
  clasificar,
  leerLock, LOCK,
};
