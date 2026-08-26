#!/usr/bin/env node
'use strict';
// Completa el campo `cps` (New Sessions/Sec) del catalogo FortiGate desde el Product Matrix.
//
// POR QUE EXISTE ESTE SCRIPT
// El dimensionador de Fortinet ya usa `cps` como tercer eje de dimensionamiento, pero el
// catalogo solo lo trae en 21 de los 58 modelos. Los otros 37 estan en null porque el
// entorno donde se edita este repositorio tiene bloqueado el egreso hacia fortinet.com y
// hacia los espejos del PDF (denegacion 403 de la politica de la organizacion), asi que la
// cifra no se pudo traer alli sin inventarla. Este script deja la operacion en un solo
// comando desde cualquier maquina que si tenga acceso al documento:
//
//     npm run cps -- --check              cuantos hay, cuantos faltan y cuales
//     npm run cps -- matrix.csv           aplica lo que traiga el archivo
//     npm run cps -- matrix.xlsx --dry    muestra que haria, sin escribir nada
//     npm run cps -- matrix.csv --force   tambien pisa los valores que ya existen
//
// QUE FORMATO ACEPTA
// Dos columnas: modelo y cifra. Vale .csv, .tsv, .txt (separador coma, punto y coma o
// tabulador) y .xlsx (se lee la primera hoja con la dependencia `xlsx` que el repo ya tiene
// para el sync). No lee el PDF directamente a proposito: extraer una tabla de un PDF es
// justo donde se cuelan los valores desplazados de fila, y una fila desplazada aqui es un
// numero plausible pero de otro equipo — el modo de fallo que este catalogo ya sufrio antes.
// Copiar la columna a una hoja de calculo es un minuto de trabajo y se ve lo que se copia.
//
// EL NOMBRE DEL MODELO SE NORMALIZA
// "FG-90G", "FortiGate 90G", "FortiGate-90G", "90G" y "fg90g" apuntan todos al mismo modelo.
//
// LAS VARIANTES CON SSD SE PROPAGAN SOLAS
// 31G, 51G, 71G, 91G, 121G, 201G, 401G... son el mismo silicio que su modelo base y solo
// agregan almacenamiento local; el Product Matrix solo publica el modelo base. Si el archivo
// trae el 90G, el script escribe tambien el 91G y lo dice en el informe, en vez de dejar a
// medias un catalogo donde media docena de hermanas quedarian en null sin motivo.
//
// COMPROBACIONES ANTES DE ESCRIBIR
// - La cifra tiene que ser un entero positivo y razonable (100 .. 100.000.000).
// - Si el archivo trae ademas una columna de Concurrent Sessions, se contrasta con el `sess`
//   ya verificado del catalogo y se RECHAZA la fila si no coincide. Ese contraste es lo que
//   detecta una fila desplazada: la cifra sola siempre parece plausible.
// - Nada se escribe si alguna fila falla, salvo que se pase --force-partial.

const fs = require('fs');
const path = require('path');

const ARCHIVO_CATALOGO = path.join(__dirname, '..', 'server', 'seed', 'legacyData', 'fortinet.js');
const { MODELS } = require('../server/seed/legacyData/fortinet');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const DRY = args.includes('--dry');
const FORCE = args.includes('--force');
const PARCIAL = args.includes('--force-partial');
const entrada = args.find((a) => !a.startsWith('--'));

const CPS_MIN = 100;
const CPS_MAX = 100000000;

// "FortiGate 90G" / "FG-90G" / "fg90g" / "90G"  ->  "90G"
function claveModelo(txt) {
  const s = String(txt == null ? '' : txt).trim().toLowerCase();
  const m = s.replace(/[\s_-]+/g, '').match(/(?:fortigate|fg)?(\d{2,4}[a-z]{1,2})$/);
  return m ? m[1].toUpperCase() : null;
}

const porClave = new Map();
for (const m of MODELS) {
  const k = claveModelo(m.id);
  if (k) porClave.set(k, m);
}

// Variantes con SSD onboard: mismo ASIC y mismo throughput que su modelo base, que es el
// unico que el Product Matrix publica. La relacion se deduce del propio catalogo en vez de
// mantener una segunda lista aqui: dos modelos son hermanos si comparten fw, tp, vpn y sess.
function hermanasDe(base) {
  return MODELS.filter((m) => m !== base
    && m.fw === base.fw && m.tp === base.tp && m.vpn === base.vpn && m.sess === base.sess);
}

function leerFilas(archivo) {
  const ext = path.extname(archivo).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls' || ext === '.xlsm') {
    const XLSX = require('xlsx');
    const libro = XLSX.readFile(archivo);
    const hoja = libro.Sheets[libro.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false })
      .map((f) => f.map((c) => (c == null ? '' : String(c))));
  }
  const texto = fs.readFileSync(archivo, 'utf8');
  return texto.split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => l.split(/\t|;|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim()));
}

// Un numero puede venir como 124000, "124,000", "124 000" o "124.000".
function aNumero(txt) {
  const s = String(txt == null ? '' : txt).replace(/[\s.,]/g, '');
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
}

function informeCobertura() {
  const con = MODELS.filter((m) => m.cps != null);
  const sin = MODELS.filter((m) => m.cps == null);
  console.log(`Catalogo FortiGate: ${MODELS.length} modelos`);
  console.log(`  con cps : ${con.length}`);
  console.log(`  en null : ${sin.length}`);
  if (sin.length) {
    console.log('\nFaltan (null significa "el catalogo no trae el dato", no "sin limite"):');
    for (const m of sin) console.log(`  ${m.id.padEnd(22)} ${m.seg}`);
  }
}

function aplicar(archivo) {
  let filas;
  try {
    filas = leerFilas(archivo);
  } catch (e) {
    console.error(`No se pudo leer ${archivo}: ${e.message}`);
    process.exit(1);
  }

  // Cabecera opcional: si alguna celda menciona sesiones concurrentes, se usa esa columna
  // como control cruzado contra el `sess` ya verificado del catalogo.
  let colModelo = 0, colCps = 1, colSess = -1;
  const cab = filas[0] ? filas[0].map((c) => c.toLowerCase()) : [];
  const buscar = (re) => cab.findIndex((c) => re.test(c));
  if (cab.some((c) => /model|modelo/.test(c))) {
    const i = buscar(/model|modelo/); if (i >= 0) colModelo = i;
    const j = buscar(/new session|sesiones nuevas|cps|per sec/); if (j >= 0) colCps = j;
    const k = buscar(/concurrent|concurrentes/); if (k >= 0) colSess = k;
    filas = filas.slice(1);
  }

  const cambios = [];
  const rechazos = [];
  const ignoradas = [];

  for (const f of filas) {
    const bruto = f[colModelo];
    const k = claveModelo(bruto);
    if (!k || !porClave.has(k)) { ignoradas.push(bruto); continue; }
    const base = porClave.get(k);

    const v = aNumero(f[colCps]);
    if (v == null) { ignoradas.push(`${base.id} (cifra ilegible: "${f[colCps]}")`); continue; }
    if (v < CPS_MIN || v > CPS_MAX) {
      rechazos.push(`${base.id}: ${v} fuera del rango razonable (${CPS_MIN}..${CPS_MAX})`);
      continue;
    }

    // Control cruzado. Una cifra sola siempre parece plausible; lo que delata una fila
    // desplazada es que su columna de sesiones concurrentes no case con la del catalogo.
    if (colSess >= 0) {
      const s = aNumero(f[colSess]);
      if (s != null && s !== base.sess) {
        rechazos.push(`${base.id}: la fila trae ${s.toLocaleString('en-US')} sesiones concurrentes `
          + `y el catalogo tiene ${base.sess.toLocaleString('en-US')} — parece una fila desplazada`);
        continue;
      }
    }

    if (base.cps != null && !FORCE) {
      if (base.cps !== v) {
        rechazos.push(`${base.id}: el catalogo ya tiene ${base.cps.toLocaleString('en-US')} y el `
          + `archivo trae ${v.toLocaleString('en-US')} — usar --force para pisarlo`);
      }
      continue;
    }

    cambios.push({ modelo: base.id, valor: v, heredado: false });
    for (const h of hermanasDe(base)) {
      if (h.cps != null && !FORCE) continue;
      cambios.push({ modelo: h.id, valor: v, heredado: true, de: base.id });
    }
  }

  if (rechazos.length) {
    console.log(`\nRECHAZADAS (${rechazos.length}):`);
    for (const r of rechazos) console.log(`  ${r}`);
  }
  if (ignoradas.length) {
    console.log(`\nSin correspondencia en el catalogo (${ignoradas.length}): `
      + `${ignoradas.slice(0, 8).join(' | ')}${ignoradas.length > 8 ? ' ...' : ''}`);
  }
  if (!cambios.length) {
    console.log('\nNada que aplicar.');
    return;
  }

  console.log(`\nA APLICAR (${cambios.length}):`);
  for (const c of cambios) {
    console.log(`  ${c.modelo.padEnd(22)} cps = ${c.valor.toLocaleString('en-US')}`
      + (c.heredado ? `   (heredado de ${c.de}: mismo silicio, solo cambia el SSD)` : ''));
  }

  if (rechazos.length && !PARCIAL) {
    console.log('\nNo se escribe nada porque hubo filas rechazadas. Revisa el archivo, o repite '
      + 'con --force-partial si quieres aplicar solo las que pasaron.');
    process.exit(1);
  }
  if (DRY) {
    console.log('\n--dry: no se escribio nada.');
    return;
  }

  let texto = fs.readFileSync(ARCHIVO_CATALOGO, 'utf8');
  let escritos = 0;
  for (const c of cambios) {
    const re = new RegExp(`(\\{id:'${c.modelo.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}',[^\\n]*?cps:)(null|\\d+)`);
    if (!re.test(texto)) {
      console.error(`  aviso: no se encontro la linea de ${c.modelo} en el catalogo, se omite`);
      continue;
    }
    texto = texto.replace(re, `$1${c.valor}`);
    escritos++;
  }
  fs.writeFileSync(ARCHIVO_CATALOGO, texto);

  const quedan = MODELS.filter((m) => m.cps == null).length - escritos;
  console.log(`\nEscritos ${escritos} valores en ${path.relative(process.cwd(), ARCHIVO_CATALOGO)}.`);
  console.log(quedan > 0
    ? `Siguen en null ${quedan} modelo(s). Vuelve a correr con --check para verlos.`
    : 'Ya no queda ningun modelo en null.');
  console.log('\nSiguiente paso: borra database.sqlite para forzar el reseed, levanta el servidor '
    + 'y comprueba la pagina antes de desplegar.');
}

if (CHECK || !entrada) {
  informeCobertura();
  if (!entrada && !CHECK) {
    console.log('\nUso: npm run cps -- <archivo.csv|.xlsx> [--dry] [--force] [--force-partial]');
    console.log('     npm run cps -- --check');
  }
} else {
  aplicar(entrada);
}
