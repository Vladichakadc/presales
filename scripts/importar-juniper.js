#!/usr/bin/env node
'use strict';
// Completa las cifras de rendimiento del catalogo Juniper SRX desde la matriz oficial.
//
// POR QUE EXISTE ESTE SCRIPT
// server/seed/legacyData/juniper.js tiene 12 modelos SRX y 8 campos numericos por modelo
// (fw, fwImix, vpn, vpnImix, ips, atp, sess, cps). Casi la mitad de esas casillas estan en
// null porque el documento que las trae todas juntas —la "SRX Series and vSRX Performance
// and Features Matrix"— no es accesible desde el entorno donde se edita este repositorio:
// el proxy de egreso responde 403 a juniper.net, igual que a fortinet.com. Completar el
// catalogo a mano desde otra maquina es transcribir 96 numeros, y transcribir a mano es
// justo donde se cuelan las filas desplazadas: un numero autentico, pero de otro equipo.
//
// Este es el equivalente Juniper de `npm run cps`:
//
//     npm run juniper -- --check              cobertura actual, campo por campo
//     npm run juniper -- matriz.csv           aplica lo que traiga el archivo
//     npm run juniper -- matriz.xlsx --dry    muestra que haria, sin escribir nada
//     npm run juniper -- matriz.csv --force   permite corregir cifras que ya existen
//
// EL CONTRASTE ES LA RAZON DE SER DEL SCRIPT, NO UN ADORNO
// Una cifra suelta siempre parece plausible: nadie mira "2.000 Mbps de IPS" y sospecha.
// Lo que delata una fila desplazada es que el RESTO de la fila deja de casar. Por eso aqui
// una fila solo se acepta si **al menos dos** de sus columnas coinciden con valores que el
// catalogo ya trae verificados, y **ninguna** los contradice. Con ese doble anclaje, las
// casillas en null de esa misma fila se pueden dar por buenas; sin el, no.
//
//   - Fila con >=2 coincidencias y 0 choques  -> se aplica.
//   - Fila con algun choque                   -> se rechaza entera, diciendo cual choca.
//   - Fila con <2 columnas contrastables      -> se aparta como "contraste insuficiente".
//     (Los modelos que hoy solo traen `fw` —SRX4300, SRX4700, SRX4100, SRX4200— caen aqui
//      por construccion. --sin-contraste los aplica bajo la responsabilidad de quien mira
//      el documento, y el informe lo deja escrito.)
//   - --force ademas permite PISAR una cifra existente que difiera, pero sigue exigiendo
//     las dos coincidencias en otras columnas: para corregir un dato hay que demostrar
//     primero que la fila es la del equipo correcto.
//
// QUE FORMATO ACEPTA
// Una fila por modelo y una columna por cifra. Vale .csv, .tsv, .txt (separador coma, punto
// y coma o tabulador) y .xlsx (primera hoja, con la dependencia `xlsx` que el repo ya usa
// para el sync). No lee el PDF directamente a proposito, por el mismo motivo que el
// importador de Fortinet: extraer una tabla de un PDF es donde nacen las filas desplazadas.
// Copiar la tabla a una hoja de calculo es un minuto y se ve lo que se copia.
//
// LAS COLUMNAS SE RECONOCEN POR SU CABECERA
// "Firewall (IMIX)" -> fwImix, "IPsec VPN Max" -> vpn, "IPS Throughput" -> ips, "Threat
// Prevention" -> atp, "Max Concurrent Sessions" -> sess, "Connections per Second" -> cps.
// Lo que no se reconoce se ignora y se dice cual. Sin cabecera reconocible no se hace nada:
// adivinar el orden de las columnas es la otra forma de desplazar una fila.
//
// LAS UNIDADES SE RESUELVEN, NO SE SUPONEN
// El catalogo guarda Mbps; la matriz publica Gbps. Si la cabecera dice la unidad, manda. Si
// no la dice, se deduce contrastando la columna con los valores ya verificados (20 frente a
// 20000 no deja lugar a dudas). Si no hay ni cabecera ni evidencia, la columna se descarta
// pidiendo que se etiquete: multiplicar por mil a ojo es un error de tres ordenes.
//
// FUERA DE ALCANCE, A PROPOSITO
// Los SSR (SD-WAN) no estan en esta matriz y no se tocan. Los precios y los niveles de
// Juniper Care tampoco: no salen de un documento de rendimiento, y rellenarlos aqui seria
// exactamente el "inventar un dato plausible" que este catalogo tiene prohibido.

const fs = require('fs');
const path = require('path');

const ARCHIVO_CATALOGO = path.join(__dirname, '..', 'server', 'seed', 'legacyData', 'juniper.js');
const { MODELS } = require('../server/seed/legacyData/juniper');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const DRY = args.includes('--dry');
const FORCE = args.includes('--force');
const PARCIAL = args.includes('--force-partial');
const SIN_CONTRASTE = args.includes('--sin-contraste');
const entrada = args.find((a) => !a.startsWith('--'));

// Cuantas columnas de la fila tienen que casar con lo ya verificado para creerse el resto.
const ANCLAS_MINIMAS = 2;
// Margen al comparar: la matriz redondea (6,5 Gbps que el catalogo guarda como 6500). Una
// fila desplazada nunca cae dentro de este margen; se va por factores, no por un 2 %.
const TOLERANCIA = 0.02;

// Cada campo, con la regla que reconoce su cabecera. El orden IMPORTA: se evalua de arriba
// abajo y gana la primera, asi que lo especifico va antes que lo generico ("IPsec IMIX"
// tiene que resolverse antes que "IMIX" y que "IPsec").
const CAMPOS = [
  {campo:'vpnImix', tipo:'tput',  et:'IPsec VPN (IMIX)',        re:(c) => /imix/.test(c) && /ipsec|vpn/.test(c)},
  {campo:'fwImix',  tipo:'tput',  et:'Firewall (IMIX)',         re:(c) => /imix/.test(c) && /firewall|fw\b/.test(c)},
  {campo:'cps',     tipo:'conteo',et:'Conexiones por segundo',  re:(c) => /per second|por segundo|\bcps\b|new session|sesiones nuevas/.test(c)},
  {campo:'sess',    tipo:'conteo',et:'Sesiones concurrentes',   re:(c) => /concurrent|concurrentes|max.*session|sesiones/.test(c)},
  {campo:'atp',     tipo:'tput',  et:'Threat Prevention / ATP', re:(c) => /threat prevention|\batp\b|amenaza/.test(c)},
  {campo:'ips',     tipo:'tput',  et:'IPS',                     re:(c) => /\bips\b|intrusion|intrusiones/.test(c)},
  {campo:'vpn',     tipo:'tput',  et:'IPsec VPN',               re:(c) => /ipsec|vpn/.test(c)},
  {campo:'fw',      tipo:'tput',  et:'Firewall',                re:(c) => /firewall|throughput|rendimiento/.test(c)},
];
const CAMPOS_POR_NOMBRE = new Map(CAMPOS.map((c) => [c.campo, c]));

// "Juniper SRX 380" / "SRX-380" / "srx380" -> "SRX380". vSRX y las virtuales no estan en
// este catalogo: devuelven null y la fila se ignora diciendolo.
function claveModelo(txt) {
  const s = String(txt == null ? '' : txt).trim().toLowerCase().replace(/[\s_-]+/g, '');
  const m = s.match(/(?:^|juniper)(?:v)?(srx\d{3,4})(?:hd|ae)?$/);
  return m ? m[1].toUpperCase() : null;
}

const porClave = new Map();
for (const m of MODELS) {
  const k = claveModelo(m.id);
  if (k) porClave.set(k, m);
}

// Un numero puede venir como 6.5 / 6,5 / 6500 / "6,500" / "1.400.000" / "20 Gbps" / "-".
// Devuelve null cuando la celda no trae dato (vacia, guion, N/A), que no es lo mismo que
// traer algo ilegible: eso ultimo devuelve NaN y se reporta.
//
// EL PUNTO CON TRES DIGITOS ES AMBIGUO Y SE RESUELVE POR EL TIPO DE COLUMNA. "1.400" son
// 1,4 Gbps en una columna de caudal y 1.400 sesiones en una de conteo; no hay forma de
// saberlo mirando la celda. La coma con tres digitos ("512,000") es siempre separador de
// miles, que es la convencion del documento de Juniper. Y si aun asi una columna de conteo
// llegara en formato europeo mal interpretado, el contraste con el catalogo lo caza: el
// fallo es ruidoso, no silencioso.
function aNumero(txt, entero) {
  let s = String(txt == null ? '' : txt).trim().toLowerCase();
  if (!s || /^(n\/?a|-+|\u2014|\u2013|\?|sin dato)$/.test(s)) return null;
  s = s.replace(/\b(gbps|mbps|kbps|gb\/s|mb\/s|tps|cps|sesiones|sessions)\b/g, '')
    .replace(/[\s\u00a0]/g, '');
  if (!s) return null;
  if (/^\d{1,3}(,\d{3})+$/.test(s)) return parseFloat(s.replace(/,/g, ''));      // 1,400,000
  if (/^\d{1,3}(\.\d{3}){2,}$/.test(s)) return parseFloat(s.replace(/\./g, '')); // 1.400.000
  if (entero && /^\d{1,3}[.,]\d{3}$/.test(s)) return parseFloat(s.replace(/[.,]/g, ''));
  const dec = s.match(/^(\d+)[.,](\d+)$/);
  if (dec) return parseFloat(`${dec[1]}.${dec[2]}`);
  if (/^\d+$/.test(s)) return parseFloat(s);
  return NaN;
}

const casa = (a, b) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * TOLERANCIA);
const fmt = (n) => Number(n).toLocaleString('es-ES');

function leerFilas(archivo) {
  const ext = path.extname(archivo).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls' || ext === '.xlsm') {
    const XLSX = require('xlsx');
    const libro = XLSX.readFile(archivo);
    const hoja = libro.Sheets[libro.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false })
      .map((f) => f.map((c) => (c == null ? '' : String(c))));
  }
  return fs.readFileSync(archivo, 'utf8').split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => l.split(/\t|;|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim()));
}

// ── Cabecera ────────────────────────────────────────────────────────────────
// Devuelve {colModelo, columnas:[{i, campo, tipo, et, unidadDeclarada}], ignoradas}.
function leerCabecera(cab) {
  const norm = cab.map((c) => String(c || '').toLowerCase().trim());
  let colModelo = -1;
  const columnas = [];
  const ignoradas = [];
  const usados = new Set();

  norm.forEach((c, i) => {
    if (!c) return;
    if (colModelo < 0 && /model|modelo|plataforma|platform|appliance|equipo/.test(c)) { colModelo = i; return; }
    const regla = CAMPOS.find((f) => !usados.has(f.campo) && f.re(c));
    if (!regla) { ignoradas.push(cab[i]); return; }
    usados.add(regla.campo);
    const unidadDeclarada = /gbps|gb\/s/.test(c) ? 1000 : (/mbps|mb\/s/.test(c) ? 1 : null);
    columnas.push({ i, campo: regla.campo, tipo: regla.tipo, et: regla.et, unidadDeclarada });
  });

  // Sin columna de modelo declarada, la primera celda de la fila es el modelo solo si de
  // hecho lo parece en la mayoria de las filas; eso lo decide quien llama.
  return { colModelo, columnas, ignoradas };
}

// ── Unidades ────────────────────────────────────────────────────────────────
// Para cada columna de throughput: 1 (ya viene en Mbps) o 1000 (venia en Gbps). La cabecera
// manda; si calla, se deduce contrastando con lo ya verificado.
function resolverUnidad(col, filas, colModelo) {
  if (col.tipo !== 'tput') return { factor: 1, como: 'conteo' };
  if (col.unidadDeclarada) return { factor: col.unidadDeclarada, como: 'declarada en la cabecera' };

  const votos = { 1: 0, 1000: 0 };
  for (const f of filas) {
    const base = porClave.get(claveModelo(f[colModelo]));
    if (!base || base[col.campo] == null) continue;
    const v = aNumero(f[col.i], col.tipo === 'conteo');
    if (v == null || Number.isNaN(v)) continue;
    for (const factor of [1, 1000]) if (casa(v * factor, base[col.campo])) votos[factor] += 1;
  }
  if (votos[1] !== votos[1000]) {
    const factor = votos[1] > votos[1000] ? 1 : 1000;
    return { factor, como: `deducida de ${votos[factor]} coincidencia(s) con el catalogo` };
  }
  return { factor: null, como: null };
}

// ── Informe de cobertura ────────────────────────────────────────────────────
function informeCobertura() {
  console.log(`Catalogo Juniper SRX: ${MODELS.length} modelos\n`);
  const anchoId = Math.max(...MODELS.map((m) => m.id.length));
  // Orden de lectura, no el de prioridad de cabeceras: de la cifra de portada a la mas
  // profunda, que es como se leen las bases de medicion en la ficha.
  const orden = ['fw', 'fwImix', 'vpn', 'vpnImix', 'ips', 'atp', 'sess', 'cps'];
  console.log(`${'modelo'.padEnd(anchoId)}  ${orden.map((c) => c.padEnd(8)).join('')}`);
  for (const m of MODELS) {
    console.log(`${m.id.padEnd(anchoId)}  ${orden.map((c) => (m[c] == null ? '·' : String(m[c])).padEnd(8)).join('')}`);
  }
  let huecos = 0;
  const porCampo = orden.map((c) => {
    const n = MODELS.filter((m) => m[c] == null).length;
    huecos += n;
    return `${c}: ${MODELS.length - n}/${MODELS.length}`;
  });
  console.log(`\n${porCampo.join('   ')}`);
  console.log(`\nQuedan ${huecos} casillas en null de ${MODELS.length * orden.length}.`);
  console.log('null significa "el catalogo no trae el dato", no "sin limite": el motor no');
  console.log('filtra por un eje sin dato y lo declara sin comprobar en la ficha.');
  const flojos = MODELS.filter((m) => orden.filter((c) => m[c] != null).length < ANCLAS_MINIMAS);
  if (flojos.length) {
    console.log(`\nSin contraste suficiente hoy (menos de ${ANCLAS_MINIMAS} cifras verificadas, asi que una`);
    console.log(`fila para ellos necesitaria --sin-contraste): ${flojos.map((m) => m.id).join(', ')}`);
  }
}

// ── Aplicar ─────────────────────────────────────────────────────────────────
function aplicar(archivo) {
  let filas;
  try {
    filas = leerFilas(archivo);
  } catch (e) {
    console.error(`No se pudo leer ${archivo}: ${e.message}`);
    process.exit(1);
  }
  if (!filas.length) { console.error('El archivo esta vacio.'); process.exit(1); }

  const { colModelo, columnas, ignoradas } = leerCabecera(filas[0]);
  if (colModelo < 0 || !columnas.length) {
    console.error('No se reconocio la cabecera. Hace falta una columna de modelo ("Model") y al');
    console.error('menos una de cifras ("Firewall", "IPsec VPN", "IPS", "Threat Prevention",');
    console.error('"Max Concurrent Sessions", "Connections per Second"), con "(IMIX)" donde toque.');
    console.error('Adivinar el orden de las columnas es la otra forma de desplazar una fila.');
    process.exit(1);
  }
  filas = filas.slice(1);

  // Unidades. Primero las columnas que se resuelven solas (cabecera o contraste); las que
  // no, heredan el factor del resto de la tabla si TODAS las demas coinciden en el suyo.
  // Es lo que salva el caso normal: la columna de ATP casi no tiene con que contrastarse
  // —hoy el catalogo solo trae un valor— pero viene en la misma unidad que sus vecinas del
  // mismo documento. Si las vecinas no se ponen de acuerdo, se descarta y se dice por que.
  for (const col of columnas) {
    const r = resolverUnidad(col, filas, colModelo);
    col.factor = r.factor;
    col.comoUnidad = r.como;
  }
  const factores = new Set(columnas.filter((c) => c.tipo === 'tput' && c.factor).map((c) => c.factor));
  if (factores.size === 1) {
    const heredado = [...factores][0];
    for (const col of columnas) {
      if (col.tipo !== 'tput' || col.factor) continue;
      col.factor = heredado;
      col.comoUnidad = 'heredada del resto de la tabla';
    }
  }

  console.log('COLUMNAS RECONOCIDAS');
  const activas = [];
  for (const col of columnas) {
    if (!col.factor) {
      console.log(`  ${col.et.padEnd(26)} DESCARTADA: no se pudo determinar si viene en Mbps o`);
      console.log(`  ${''.padEnd(26)} en Gbps. Anade la unidad a esa cabecera y vuelve a correr.`);
      continue;
    }
    activas.push(col);
    console.log(`  ${col.et.padEnd(26)} -> ${col.campo}`
      + (col.tipo === 'tput' ? `   (x${col.factor}, unidad ${col.comoUnidad})` : ''));
  }
  if (ignoradas.length) console.log(`  sin reconocer, se ignoran: ${ignoradas.join(' | ')}`);
  if (!activas.length) { console.error('\nNinguna columna utilizable.'); process.exit(1); }

  const cambios = [];
  const rechazos = [];
  const flojas = [];
  const sinModelo = [];

  for (const f of filas) {
    const bruto = f[colModelo];
    const k = claveModelo(bruto);
    if (!k || !porClave.has(k)) { if (String(bruto || '').trim()) sinModelo.push(bruto); continue; }
    const base = porClave.get(k);

    const leidos = [];
    let ilegible = null;
    for (const col of activas) {
      const crudo = aNumero(f[col.i], col.tipo === 'conteo');
      if (crudo == null) continue;
      if (Number.isNaN(crudo)) { ilegible = `${col.et}: "${f[col.i]}"`; break; }
      const v = Math.round(crudo * col.factor);
      if (v <= 0) { ilegible = `${col.et}: ${f[col.i]} no es una cifra positiva`; break; }
      leidos.push({ campo: col.campo, et: col.et, valor: v });
    }
    if (ilegible) { rechazos.push(`${base.id}: cifra ilegible en ${ilegible}`); continue; }
    if (!leidos.length) continue;

    // El contraste: cuantas columnas de esta fila casan con lo ya verificado y cuantas lo
    // contradicen. Dos coincidencias autorizan a creerse los huecos de la misma fila.
    const anclas = [];
    const choques = [];
    for (const l of leidos) {
      if (base[l.campo] == null) continue;
      if (casa(l.valor, base[l.campo])) anclas.push(`${l.campo}=${fmt(base[l.campo])}`);
      else choques.push(`${l.campo}: el archivo trae ${fmt(l.valor)} y el catalogo ${fmt(base[l.campo])}`);
    }

    if (choques.length && !FORCE) {
      rechazos.push(`${base.id}: ${choques.join(' | ')} — parece una fila desplazada; `
        + 'si de verdad el catalogo esta mal, --force lo permite corregir');
      continue;
    }
    if (anclas.length < ANCLAS_MINIMAS) {
      const nuevos = leidos.filter((l) => base[l.campo] == null);
      if (!nuevos.length) continue;
      flojas.push({ base, nuevos, anclas });
      if (!SIN_CONTRASTE) continue;
    }

    for (const l of leidos) {
      if (base[l.campo] == null) cambios.push({ modelo: base.id, campo: l.campo, valor: l.valor, anclas });
      else if (!casa(l.valor, base[l.campo]) && FORCE) {
        cambios.push({ modelo: base.id, campo: l.campo, valor: l.valor, anclas, pisa: base[l.campo] });
      }
    }
  }

  if (sinModelo.length) {
    console.log(`\nSin correspondencia en el catalogo (${sinModelo.length}): `
      + `${sinModelo.slice(0, 8).join(' | ')}${sinModelo.length > 8 ? ' ...' : ''}`);
  }
  if (rechazos.length) {
    console.log(`\nFILAS RECHAZADAS (${rechazos.length}):`);
    for (const r of rechazos) console.log(`  ${r}`);
  }
  if (flojas.length) {
    console.log(`\nCONTRASTE INSUFICIENTE (${flojas.length}) — menos de ${ANCLAS_MINIMAS} columnas contrastables:`);
    for (const x of flojas) {
      console.log(`  ${x.base.id}: casa ${x.anclas.length ? x.anclas.join(', ') : 'nada'}; `
        + `aportaria ${x.nuevos.map((n) => n.campo).join(', ')}`);
    }
    if (!SIN_CONTRASTE) {
      console.log('  No se aplican. Si estas mirando el documento y respondes por la fila, '
        + 'repite con --sin-contraste.');
    } else {
      console.log('  --sin-contraste: se aplican bajo tu responsabilidad, sin doble anclaje.');
    }
  }

  if (!cambios.length) { console.log('\nNada que aplicar.'); return; }

  console.log(`\nA APLICAR (${cambios.length}):`);
  for (const c of cambios) {
    console.log(`  ${c.modelo.padEnd(10)} ${c.campo.padEnd(8)} = ${fmt(c.valor)}`
      + (c.pisa != null ? `   (pisa ${fmt(c.pisa)})` : '')
      + (c.anclas.length ? `   [ancla: ${c.anclas.join(', ')}]` : '   [sin ancla]'));
  }

  if (rechazos.length && !PARCIAL) {
    console.log('\nNo se escribe nada porque hubo filas rechazadas. Revisa el archivo, o repite '
      + 'con --force-partial para aplicar solo las que pasaron.');
    process.exit(1);
  }
  if (DRY) { console.log('\n--dry: no se escribio nada.'); return; }

  let texto = fs.readFileSync(ARCHIVO_CATALOGO, 'utf8');
  let escritos = 0;
  for (const c of cambios) {
    const nuevo = escribirCampo(texto, c.modelo, c.campo, c.valor);
    if (!nuevo) { console.error(`  aviso: no se encontro ${c.modelo}.${c.campo} en el catalogo, se omite`); continue; }
    texto = nuevo;
    escritos += 1;
  }
  fs.writeFileSync(ARCHIVO_CATALOGO, texto);

  console.log(`\nEscritos ${escritos} valores en ${path.relative(process.cwd(), ARCHIVO_CATALOGO)}.`);
  console.log('Vuelve a correr con --check para ver la cobertura que queda.');
  console.log('\nSiguiente paso: borra database.sqlite para forzar el reseed, levanta el servidor');
  console.log('y comprueba la pagina antes de desplegar.');
  console.log('Y si la matriz trae cifras que este catalogo declara "sin confirmar" en su');
  console.log('cabecera (las sesiones de la linea SRX300, el IPS de la generacion 2024),');
  console.log('actualiza tambien ese comentario: la procedencia se queda obsoleta en silencio.');
}

// Reescribe un campo dentro del bloque de un modelo. Se acota al bloque —de `{id:'SRX380',`
// hasta el siguiente `{id:` o el cierre de la lista— porque los mismos nombres de campo se
// repiten doce veces en el archivo. El guardia `(?<![A-Za-z])` evita que `vpn:` pique en
// `vpnImix:` y `fw:` en `fwImix:`.
function escribirCampo(texto, id, campo, valor) {
  const inicio = texto.indexOf(`{id:'${id}',`);
  if (inicio < 0) return null;
  const siguiente = texto.indexOf("{id:'", inicio + 1);
  const cierre = texto.indexOf('\n];', inicio);
  const fin = Math.min(...[siguiente, cierre].filter((n) => n > 0));
  const bloque = texto.slice(inicio, fin);
  const re = new RegExp(`((?<![A-Za-z])${campo}:)(null|[\\d.]+)`);
  if (!re.test(bloque)) return null;
  return texto.slice(0, inicio) + bloque.replace(re, `$1${valor}`) + texto.slice(fin);
}

// Solo como CLI: al requerirse desde las pruebas no debe correr nada.
if (require.main === module) {
  if (CHECK || !entrada) {
    informeCobertura();
    if (!entrada && !CHECK) {
      console.log('\nUso: npm run juniper -- <archivo.csv|.xlsx> [--dry] [--force] [--force-partial] [--sin-contraste]');
      console.log('     npm run juniper -- --check');
    }
  } else {
    aplicar(entrada);
  }
}

module.exports = { claveModelo, aNumero, leerCabecera, escribirCampo };
