#!/usr/bin/env node
'use strict';
// Completa el catalogo Huawei desde Info-Finder o el capitulo "Specifications".
//
// POR QUE EXISTE (pendiente 14)
// Huawei es el fabricante con mas huecos del catalogo y el unico de los cuatro bloqueados
// que no tenia importador: `npm run cps` cubre Fortinet, `npm run juniper` cubre la matriz
// SRX, y para Huawei el dato habia que llevarlo a mano. Lo que falta, por orden de impacto:
//
//   · CICLO DE VIDA — 0 de 40 modelos marcados, mientras Cisco tiene 8. Es el hueco mas caro
//     de todos: una propuesta con un equipo descatalogado se cae en la mesa del cliente.
//   · `typ` e `ipsec` en las NetEngine, `mpps` en los AR.
//
// EL PORTAFOLIO COMERCIAL NO SIRVE PARA DIMENSIONAR, y por eso este script separa `fwd` de
// `typ`. e.huawei.com publica la cifra de paquetes grandes: en el AR5710-S son 1300 Mbps
// frente a los 620 tipicos, un factor 2,1. Es el mismo modo de fallo que en el SRX380 vale
// un factor 10 y que en el FortiGate 60F valio 14,3x.
//
//     npm run huawei -- --check                 que falta, casilla por casilla
//     npm run huawei -- specs.xlsx --dry        que haria, sin escribir
//     npm run huawei -- specs.xlsx              aplica
//     npm run huawei -- eox.csv --eol           carga fin de venta en vez de cifras
//
// QUE FORMATO ACEPTA
// CSV/TSV/TXT o XLSX, con cabecera. Las columnas se reconocen POR SU CABECERA y no por su
// posicion, asi que no hace falta reordenarlas. No lee el PDF directamente a proposito:
// extraer una tabla de un PDF es justo donde se cuelan las filas desplazadas.
//
// EL DOBLE ANCLAJE, IGUAL QUE EN JUNIPER
// Una fila solo se acepta si al menos ANCLAS_MINIMAS de sus columnas casan con lo que el
// catalogo ya trae verificado y NINGUNA lo contradice. Una cifra suelta siempre parece
// plausible; el resto de su fila, no. `--sin-contraste` lo salta, y entonces conviene
// revisar a ojo lo que entra.

const fs = require('fs');
const path = require('path');

const ARCHIVO_CATALOGO = path.join(__dirname, '..', 'server', 'seed', 'legacyData', 'huawei.js');
const { MODELS } = require('../server/seed/legacyData/huawei');

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const DRY = args.includes('--dry');
const FORCE = args.includes('--force');
const EOL = args.includes('--eol');
const SIN_CONTRASTE = args.includes('--sin-contraste');
const entrada = args.find((a) => !a.startsWith('--'));

const ANCLAS_MINIMAS = 2;
const TOLERANCIA = 0.02;

// Campos importables. `fwd` y `typ` van separados a proposito: son dos mediciones distintas
// y confundirlas es el error de preventa que este catalogo evita.
const CAMPOS = [
  { campo: 'typ', tipo: 'tput', et: 'Throughput tipico (IMIX)', re: (c) => /typical|tipico|típico|imix/.test(c) },
  { campo: 'ipsec', tipo: 'tput', et: 'IPsec VPN', re: (c) => /ipsec|vpn/.test(c) },
  { campo: 'mpps', tipo: 'conteo', et: 'Mpps', re: (c) => /mpps|packet.*rate|paquetes/.test(c) },
  { campo: 'fwd', tipo: 'tput', et: 'Forwarding (paquetes grandes)', re: (c) => /forwarding|throughput|rendimiento|capacidad/.test(c) },
];

// "Huawei AR 5710-S" / "AR5710-S8T2S" / "NetEngine A821 E" -> clave comparable.
function claveModelo(txt) {
  const s = String(txt == null ? '' : txt).trim().toLowerCase()
    .replace(/^huawei\s+/, '')
    .replace(/netengine\s*/, 'ne')
    .replace(/[\s_-]+/g, '');
  return s ? s.toUpperCase() : null;
}

const porClave = new Map();
for (const m of MODELS) {
  const k = claveModelo(m.id);
  if (k) porClave.set(k, m);
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
  return fs.readFileSync(archivo, 'utf8').split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => l.split(/\t|;|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim()));
}

function leerCabecera(cab) {
  const norm = cab.map((c) => String(c || '').toLowerCase().trim());
  let colModelo = -1;
  const columnas = [];
  const ignoradas = [];
  const usados = new Set();
  norm.forEach((c, i) => {
    if (!c) return;
    if (colModelo < 0 && /model|modelo|producto|product|equipo/.test(c)) { colModelo = i; return; }
    const regla = CAMPOS.find((f) => !usados.has(f.campo) && f.re(c));
    if (!regla) { ignoradas.push(cab[i]); return; }
    usados.add(regla.campo);
    const unidadDeclarada = /gbps|gb\/s/.test(c) ? 1000 : (/mbps|mb\/s/.test(c) ? 1 : null);
    columnas.push({ i, campo: regla.campo, tipo: regla.tipo, et: regla.et, unidadDeclarada });
  });
  return { colModelo, columnas, ignoradas };
}

// Mismo parser de numeros que el importador Juniper: el punto con tres digitos es ambiguo y
// lo resuelve el tipo de columna; la coma con tres digitos es siempre separador de miles.
function aNumero(txt, entero) {
  let s = String(txt == null ? '' : txt).trim().toLowerCase();
  if (!s || /^(n\/?a|-+|—|–|\?|sin dato)$/.test(s)) return null;
  s = s.replace(/\b(gbps|mbps|kbps|gb\/s|mb\/s|mpps|pps)\b/g, '').replace(/[\s ]/g, '');
  if (!s) return null;
  if (/^\d{1,3}(,\d{3})+$/.test(s)) return parseFloat(s.replace(/,/g, ''));
  if (/^\d{1,3}(\.\d{3}){2,}$/.test(s)) return parseFloat(s.replace(/\./g, ''));
  if (entero && /^\d{1,3}[.,]\d{3}$/.test(s)) return parseFloat(s.replace(/[.,]/g, ''));
  const dec = s.match(/^(\d+)[.,](\d+)$/);
  if (dec) return parseFloat(`${dec[1]}.${dec[2]}`);
  if (/^\d+$/.test(s)) return parseFloat(s);
  return NaN;
}

const casa = (a, b) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * TOLERANCIA);
const fmt = (n) => Number(n).toLocaleString('es-ES');

// La unidad la manda la cabecera; si calla, se deduce contrastando con lo ya verificado, en
// vez de multiplicar por mil a ojo.
function resolverUnidad(col, filas, colModelo) {
  if (col.tipo !== 'tput') return { factor: 1, como: 'conteo' };
  if (col.unidadDeclarada) return { factor: col.unidadDeclarada, como: 'declarada en la cabecera' };
  const votos = { 1: 0, 1000: 0 };
  for (const fila of filas) {
    const m = porClave.get(claveModelo(fila[colModelo]));
    if (!m) continue;
    const ref = m[col.campo];
    if (ref == null) continue;
    const v = aNumero(fila[col.i], false);
    if (v == null || Number.isNaN(v)) continue;
    if (casa(v, ref)) votos[1]++;
    else if (casa(v * 1000, ref)) votos[1000]++;
  }
  if (votos[1000] > votos[1]) return { factor: 1000, como: 'deducida por contraste (venia en Gbps)' };
  if (votos[1] > 0) return { factor: 1, como: 'deducida por contraste (ya venia en Mbps)' };
  return { factor: 1, como: 'sin contraste posible; se asume Mbps' };
}

function informeCobertura() {
  console.log('\n== COBERTURA DEL CATALOGO HUAWEI ==\n');
  const campos = ['fwd', 'typ', 'ipsec', 'mpps'];
  const ar = MODELS.filter((m) => m.cls === 'AR');
  const ne = MODELS.filter((m) => m.cls !== 'AR');
  for (const [etiqueta, grupo] of [['AR', ar], ['NetEngine / otros', ne]]) {
    console.log(`${etiqueta} — ${grupo.length} modelos`);
    for (const c of campos) {
      const con = grupo.filter((m) => m[c] != null).length;
      console.log(`   ${c.padEnd(6)} ${String(con).padStart(3)}/${String(grupo.length).padEnd(3)}`);
    }
  }
  const eol = MODELS.filter((m) => m.eol || m.eolAnnounced).length;
  console.log(`\nCiclo de vida: ${eol}/${MODELS.length} modelos marcados.`);
  if (!eol) {
    console.log('   Ninguno. Es el hueco mas caro: una propuesta con un equipo');
    console.log('   descatalogado se cae en la mesa del cliente.');
    console.log('   Se carga con:  npm run huawei -- eox.csv --eol');
  }
  console.log('\nFuentes (bloqueadas por egreso desde este entorno):');
  console.log('   Info-Finder            https://info.support.huawei.com/  (requiere Huawei ID)');
  console.log('   Boletines de fin de vida  https://support.huawei.com/enterprise/en/bulletins-lifecycle\n');
}

// ── Fin de venta ────────────────────────────────────────────────────────────
// Formato esperado: modelo, fecha de ultimo pedido y, si lo hay, sucesor y URL del boletin.
// Se guarda como eolAnnounced con su fecha real, NO como una marca fija: la regla de
// ficha.js compara esa fecha contra la de hoy, asi que un equipo deja de proponerse solo el
// dia que vence su ultimo pedido, sin que nadie tenga que volver a editar el catalogo.
function aplicarEol(filas) {
  const cab = filas[0].map((c) => String(c || '').toLowerCase());
  const col = (re) => cab.findIndex((c) => re.test(c));
  const cModelo = col(/model|modelo|producto|equipo/);
  const cFecha = col(/last order|ultimo pedido|último pedido|eos|end of sale/);
  const cSucesor = col(/sucesor|successor|replacement|reemplazo/);
  const cUrl = col(/url|bolet|bulletin|enlace|link/);
  if (cModelo < 0 || cFecha < 0) {
    console.error('Faltan columnas. Se necesitan al menos "modelo" y "last order / ultimo pedido".');
    process.exit(1);
  }

  const aceptadas = [];
  const apartadas = [];
  for (const fila of filas.slice(1)) {
    const m = porClave.get(claveModelo(fila[cModelo]));
    if (!m) { apartadas.push({ id: fila[cModelo], motivo: 'no esta en el catalogo' }); continue; }
    const fecha = String(fila[cFecha] || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      apartadas.push({ id: m.id, motivo: `fecha "${fecha}" no es ISO (AAAA-MM-DD)` });
      continue;
    }
    aceptadas.push({
      id: m.id, lastOrder: fecha,
      sucesor: cSucesor >= 0 ? (fila[cSucesor] || '').trim() || null : null,
      url: cUrl >= 0 ? (fila[cUrl] || '').trim() || null : null,
    });
  }

  console.log(`\n== FIN DE VENTA ==\n${aceptadas.length} aceptada(s), ${apartadas.length} apartada(s).\n`);
  for (const a of aceptadas) console.log(`  ${a.id}  ultimo pedido ${a.lastOrder}${a.sucesor ? `  ->  ${a.sucesor}` : ''}`);
  for (const a of apartadas) console.log(`  [fuera] ${a.id} — ${a.motivo}`);

  if (DRY || !aceptadas.length) {
    console.log(`\n${DRY ? 'Simulacro' : 'Nada que escribir'}. Repite sin --dry para aplicar.\n`);
    return;
  }
  let texto = fs.readFileSync(ARCHIVO_CATALOGO, 'utf8');
  let escritos = 0;
  for (const a of aceptadas) {
    const inicio = texto.indexOf(`{id:'${a.id}',`);
    if (inicio < 0) continue;
    if (texto.slice(inicio, inicio + 400).includes('eolAnnounced')) continue;
    const campos = [`pid:'${a.id}'`, `lastOrder:'${a.lastOrder}'`,
      `sucesor:${a.sucesor ? `'${a.sucesor.replace(/'/g, "\\'")}'` : 'null'}`,
      `url:${a.url ? `'${a.url.replace(/'/g, "\\'")}'` : 'null'}`];
    const insercion = `{id:'${a.id}', eolAnnounced:{${campos.join(', ')}},`;
    texto = texto.slice(0, inicio) + insercion + texto.slice(inicio + `{id:'${a.id}',`.length);
    escritos++;
  }
  fs.writeFileSync(ARCHIVO_CATALOGO, texto);
  console.log(`\nEscritos ${escritos} avisos de fin de venta. Revisa el diff y pasa \`npm run verificar\`.\n`);
}

// ── Cifras ──────────────────────────────────────────────────────────────────
function aplicarCifras(filas) {
  const { colModelo, columnas, ignoradas } = leerCabecera(filas[0]);
  if (colModelo < 0) { console.error('No se encontro la columna de modelo en la cabecera.'); process.exit(1); }
  if (!columnas.length) { console.error('Ninguna columna reconocida. Cabeceras vistas: ' + filas[0].join(' | ')); process.exit(1); }
  if (ignoradas.length) console.log(`Columnas ignoradas: ${ignoradas.join(', ')}`);

  const cuerpo = filas.slice(1);
  const unidades = new Map(columnas.map((c) => [c.campo, resolverUnidad(c, cuerpo, colModelo)]));
  for (const c of columnas) console.log(`  ${c.et}: unidad ${unidades.get(c.campo).como}`);

  const aceptadas = [];
  const apartadas = [];
  for (const fila of cuerpo) {
    const m = porClave.get(claveModelo(fila[colModelo]));
    if (!m) { apartadas.push({ id: fila[colModelo], motivo: 'no esta en el catalogo' }); continue; }

    let anclas = 0;
    let contradice = null;
    const nuevos = [];
    for (const c of columnas) {
      const crudo = aNumero(fila[c.i], c.tipo === 'conteo');
      if (crudo === null) continue;
      if (Number.isNaN(crudo)) { contradice = `${c.et}: celda ilegible "${fila[c.i]}"`; break; }
      const valor = c.tipo === 'tput' ? crudo * unidades.get(c.campo).factor : crudo;
      const ref = m[c.campo];
      if (ref != null) {
        if (casa(valor, ref)) anclas++;
        else { contradice = `${c.et}: la fila dice ${fmt(valor)} y el catalogo ${fmt(ref)}`; break; }
      } else {
        nuevos.push({ campo: c.campo, et: c.et, valor });
      }
    }

    if (contradice) { apartadas.push({ id: m.id, motivo: contradice }); continue; }
    if (!nuevos.length) { apartadas.push({ id: m.id, motivo: 'no aporta nada nuevo' }); continue; }
    if (anclas < ANCLAS_MINIMAS && !SIN_CONTRASTE && !FORCE) {
      apartadas.push({ id: m.id, motivo: `solo ${anclas} ancla(s); hacen falta ${ANCLAS_MINIMAS}` });
      continue;
    }
    aceptadas.push({ id: m.id, anclas, nuevos });
  }

  console.log(`\n== CIFRAS ==\n${aceptadas.length} fila(s) aceptada(s), ${apartadas.length} apartada(s).\n`);
  for (const a of aceptadas) {
    console.log(`  ${a.id}  (${a.anclas} ancla(s))`);
    for (const n of a.nuevos) console.log(`     ${n.et}: ${fmt(n.valor)}`);
  }
  for (const a of apartadas) console.log(`  [fuera] ${a.id} — ${a.motivo}`);

  if (DRY || !aceptadas.length) {
    console.log(`\n${DRY ? 'Simulacro' : 'Nada que escribir'}. Repite sin --dry para aplicar.\n`);
    return;
  }

  let texto = fs.readFileSync(ARCHIVO_CATALOGO, 'utf8');
  let escritos = 0;
  for (const a of aceptadas) {
    for (const n of a.nuevos) {
      const inicio = texto.indexOf(`{id:'${a.id}',`);
      if (inicio < 0) continue;
      const siguiente = texto.indexOf("{id:'", inicio + 1);
      const cierre = texto.indexOf('\n];', inicio);
      const fin = Math.min(...[siguiente, cierre].filter((x) => x > 0));
      const bloque = texto.slice(inicio, fin);
      const re = new RegExp(`((?<![A-Za-z])${n.campo}:)(null|[\\d.]+)`);
      if (!re.test(bloque)) continue;
      texto = texto.slice(0, inicio) + bloque.replace(re, `$1${n.valor}`) + texto.slice(fin);
      escritos++;
    }
  }
  fs.writeFileSync(ARCHIVO_CATALOGO, texto);
  console.log(`\nEscritos ${escritos} campo(s) en huawei.js. Revisa el diff y pasa \`npm run verificar\`.\n`);
}

if (require.main === module) {
  if (CHECK || !entrada) {
    informeCobertura();
    if (!entrada && !CHECK) process.exit(1);
    process.exit(0);
  }
  const filas = leerFilas(entrada);
  if (filas.length < 2) { console.error('El archivo no trae cabecera y al menos una fila.'); process.exit(1); }
  if (EOL) aplicarEol(filas);
  else aplicarCifras(filas);
}

module.exports = { claveModelo, aNumero, leerCabecera, resolverUnidad };
