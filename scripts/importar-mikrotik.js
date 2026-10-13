#!/usr/bin/env node
'use strict';
// Transcribe la matriz oficial de pruebas de MikroTik desde las fichas de producto.
//
// POR QUE EXISTE ESTE SCRIPT
// Cada ficha de mikrotik.com/product/<modelo> publica dos tablas RFC 2544 medidas con Xena:
// «Ethernet test results» (puente y ruteo, sin configuracion —fast path—, con 25 colas simples
// y con 25 reglas de filtro, a 1518/512/64 bytes, en kpps y Mbps) e «IPsec test results» (un
// tunel y 256 tuneles, por cifrado, a 1400/512/64 bytes). Son unas 50 cifras por equipo y 20
// equipos: transcribirlas a mano es justo donde se cuela una fila desplazada. Hasta el
// 2026-10-13 el catalogo traia UNA cifra de reenvio y UNA de IPsec por modelo, sin fuente
// leida, y no casaban con estas tablas (IPsec del RB5009: 2.400 Mbps en el catalogo, 1.354 en
// la ficha; CCR2216: 15.000 frente a 4.108).
//
//     npm run mikrotik -- <carpeta|ficha.html>...      aplica lo que anclan
//     npm run mikrotik -- <carpeta> --dry              muestra que haria, sin escribir
//     npm run mikrotik -- --check                      que modelos del catalogo no tienen ficha
//     npm run mikrotik -- <carpeta> --force            escribe tambien las que contradicen
//
// LAS FICHAS SE TRAEN, NO SE PIDEN DESDE AQUI: el entorno de edicion no llega a mikrotik.com.
// `traer-cisco-huawei.yml` las baja a una rama `fuente/*` (entradas MIKROTIK), y se leen de ahi.
//
// DOBLE ANCLAJE. Una pagina se acepta solo si su «Product code» es el `codigo` de un modelo
// del catalogo y al menos dos de sus columnas (nucleos, RAM, nivel de licencia) casan con las
// que el catalogo trae, sin que ninguna lo contradiga. Y cada fila de prueba se comprueba
// consigo misma: Mbps = kpps x bytes x 8 / 1000 con un 1,5 % de tolerancia. Asi se resuelve la
// coma (el RB4011 publica «806,4» kpps y «9,792.9» Mbps en la misma fila): de las lecturas
// posibles de un numero solo vale la que cuadra con la otra columna, y si ninguna cuadra la
// fila se rechaza en vez de adivinar.
//
// FUERA DE ALCANCE, A PROPOSITO. El puerto, la fuente, el PoE y el segmento siguen escritos a
// mano en `legacyData/mikrotik.js`: son prosa de la ficha, no una tabla. El precio sugerido
// si se toma (es una cifra de la ficha y cambia sin aviso); el resto, no.

const fs = require('fs');
const path = require('path');

const DESTINO = path.join(__dirname, '..', 'server', 'seed', 'legacyData', 'mikrotikPruebas.js');

const decodificar = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function lineas(html) {
  const t = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(td|th)>/gi, ' | ').replace(/<\/tr>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li|span|dt|dd)>/gi, '\n').replace(/<[^>]+>/g, '');
  // Dos pasadas: la ficha codifica dos veces el texto de algunas celdas (&#110;&#111;...).
  return decodificar(decodificar(t)).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// Lecturas posibles de una cifra publicada: «9,792.9» (coma de miles), «806,4» (coma decimal),
// «2332». Se devuelven todas; decide la coherencia kpps/Mbps de la fila.
function lecturas(txt) {
  const s = String(txt).trim();
  if (!/^[\d.,]+$/.test(s)) return [];
  const out = new Set();
  if (s.includes(',') && s.includes('.')) out.add(Number(s.replace(/,/g, '')));
  else if (s.includes(',')) { out.add(Number(s.replace(',', '.'))); out.add(Number(s.replace(/,/g, ''))); }
  else out.add(Number(s));
  return [...out].filter((n) => Number.isFinite(n));
}

// [kpps, Mbps] de una celda doble, o null si ninguna lectura cuadra con el tamano de trama.
// En la columna de 64 B MikroTik usa dos convenciones segun la ficha: unas calculan los Mbps
// con 64 bytes por trama (hEX lite: 217,8 kpps -> 111,5 Mbps) y otras con 68 (RB5009: 4.969,4
// kpps -> 2.703,3 Mbps = 4.969,4 x 68 x 8). Se admiten las dos SOLO ahi; se guarda la cifra
// publicada tal cual, que es la que dimensiona.
const BYTES_ADMITIDOS = { 64: [64, 68] };
function par(kppsTxt, mbpsTxt, bytes) {
  for (const k of lecturas(kppsTxt)) {
    for (const m of lecturas(mbpsTxt)) {
      for (const b of BYTES_ADMITIDOS[bytes] || [bytes]) {
        const esperado = k * b * 8 / 1000;
        if (esperado > 0 && Math.abs(m - esperado) / esperado <= 0.015) return [k, m];
      }
    }
  }
  return null;
}

const CONFIG_RUTEO = [
  [/^none \(fast path\)$/i, 'fastpath'],
  [/^25 simple queues$/i, 'colas'],
  [/^25 (ip )?filter rules$/i, 'filtro'],
  [/^none \(L3HW\)$/i, 'l3hw'],
  [/^25 ip filter rules \(Fasttrack L3HW\)$/i, 'l3hwFiltro'],
];
const CONFIG_PUENTE = [
  [/^none \(fast path\)$/i, 'fastpath'],
  [/^25 bridge filter( rules)?$/i, 'filtro'],
];
const CIFRADO = {
  'AES-128-CBC + SHA1': 'aes128-sha1', 'AES-128-CBC + SHA256': 'aes128-sha256',
  'AES-256-CBC + SHA1': 'aes256-sha1', 'AES-256-CBC + SHA256': 'aes256-sha256',
};

function leerFicha(html) {
  const L = lineas(html);
  const errores = [];
  const ficha = { spec: {} };
  const og = html.match(/og:url" content="([^"]+)"/);
  ficha.url = og ? og[1] : null;
  const i0 = L.indexOf('Product code');
  if (i0 < 0) return { errores: ['no trae «Product code»: no es una ficha de producto'] };
  for (let i = i0; i < L.length - 1 && !/test results$/i.test(L[i]); i++) {
    if (ficha.spec[L[i]] === undefined && !L[i].includes('|')) ficha.spec[L[i]] = L[i + 1];
  }
  ficha.codigo = ficha.spec['Product code'];
  const precio = (ficha.spec['Suggested price'] || '').match(/^\$([\d,]+(?:\.\d+)?)$/);
  ficha.precio = precio ? Number(precio[1].replace(/,/g, '')) : null;
  ficha.cpu = ficha.spec.CPU || null;
  ficha.arq = ficha.spec.Architecture || null;
  ficha.nucleos = ficha.spec['CPU core count'] ? Number(ficha.spec['CPU core count']) : null;
  ficha.mhz = ficha.spec['CPU nominal frequency'] || null;
  const ram = (ficha.spec['Size of RAM'] || '').match(/^([\d.]+)\s*(MB|GB)$/i);
  ficha.ram = ram ? Number(ram[1]) * (/GB/i.test(ram[2]) ? 1024 : 1) : null;
  ficha.lvl = ficha.spec['RouterOS license'] ? Number(ficha.spec['RouterOS license']) : null;

  let tabla = null; let tamanos = null;
  ficha.ruteo = {}; ficha.puente = {}; ficha.ipsec = { uno: {}, multi: {} };
  for (const l of L) {
    if (/^Ethernet test results$/i.test(l)) { tabla = 'eth'; tamanos = null; continue; }
    if (/^IPsec test results$/i.test(l)) { tabla = 'ipsec'; tamanos = null; continue; }
    if (/^Documents$/i.test(l)) tabla = null;
    if (!tabla) continue;
    const c = l.split('|').map((x) => x.trim()).filter(Boolean);
    if (c[0] === 'Mode') { tamanos = c.slice(2).map((x) => Number((x.match(/\d+/) || [])[0])); continue; }
    if (c.length < 8 || !tamanos || tamanos.length !== 3) continue;
    const celdas = {};
    let fallo = false;
    tamanos.forEach((b, k) => {
      const p = par(c[2 + 2 * k], c[3 + 2 * k], b);
      if (!p) { fallo = true; errores.push(`${c[0]} / ${c[1]} a ${b} B: kpps y Mbps no cuadran («${c[2 + 2 * k]}», «${c[3 + 2 * k]}»)`); }
      celdas[b] = p;
    });
    if (fallo) continue;
    if (tabla === 'eth') {
      const mapa = c[0] === 'Routing' ? CONFIG_RUTEO : c[0] === 'Bridging' ? CONFIG_PUENTE : null;
      const hit = mapa && mapa.find(([re]) => re.test(c[1]));
      if (!hit) { errores.push(`fila de Ethernet no reconocida: ${c[0]} / ${c[1]}`); continue; }
      (c[0] === 'Routing' ? ficha.ruteo : ficha.puente)[hit[1]] = celdas;
    } else {
      const modo = c[0] === 'Single tunnel' ? 'uno' : c[0] === '256 tunnels' ? 'multi' : null;
      const cif = CIFRADO[c[1]];
      if (!modo || !cif) { errores.push(`fila de IPsec no reconocida: ${c[0]} / ${c[1]}`); continue; }
      ficha.ipsec[modo][cif] = celdas;
    }
  }
  if (!Object.keys(ficha.ipsec.uno).length && !Object.keys(ficha.ipsec.multi).length) ficha.ipsec = null;
  if (!ficha.ruteo.fastpath) errores.push('no trae la fila de ruteo en fast path');
  return { ficha, errores };
}

// Doble anclaje contra lo que el catalogo ya trae del modelo.
function anclar(ficha, modelo) {
  const casan = []; const chocan = [];
  for (const [campo, deFicha, deCatalogo] of [['nucleos', ficha.nucleos, modelo.cores], ['ram', ficha.ram, modelo.ram], ['lvl', ficha.lvl, modelo.lvl]]) {
    if (deFicha == null || deCatalogo == null) continue;
    (deFicha === deCatalogo ? casan : chocan).push(`${campo} ${deCatalogo}${deFicha === deCatalogo ? '' : ` -> ${deFicha}`}`);
  }
  return { casan, chocan, ok: casan.length >= 2 && chocan.length === 0 };
}

function archivos(rutas) {
  const out = [];
  for (const r of rutas) {
    if (!fs.existsSync(r)) { console.error(`No existe: ${r}`); continue; }
    if (fs.statSync(r).isDirectory()) {
      for (const f of fs.readdirSync(r).sort()) if (f.endsWith('.html')) out.push(path.join(r, f));
    } else out.push(r);
  }
  return out;
}

function serializar(fichas, leido) {
  const orden = (o) => JSON.stringify(o);
  const cuerpo = Object.entries(fichas).map(([codigo, f]) => {
    const ipsec = f.ipsec == null ? 'null' : `{\n      uno: ${orden(f.ipsec.uno)},\n      multi: ${orden(f.ipsec.multi)},\n    }`;
    return `  ${JSON.stringify(codigo)}: {\n    url: ${JSON.stringify(f.url)}, precio: ${f.precio},\n`
      + `    cpu: ${JSON.stringify(f.cpu)}, arq: ${JSON.stringify(f.arq)}, nucleos: ${f.nucleos}, mhz: ${JSON.stringify(f.mhz)}, ram: ${f.ram}, lvl: ${f.lvl},\n`
      + `    ruteo: {\n${Object.entries(f.ruteo).map(([k, v]) => `      ${k}: ${orden(v)},`).join('\n')}\n    },\n`
      + `    puente: {\n${Object.entries(f.puente).map(([k, v]) => `      ${k}: ${orden(v)},`).join('\n')}\n    },\n`
      + `    ipsec: ${ipsec},\n  },`;
  }).join('\n');
  return `'use strict';
// GENERADO por \`npm run mikrotik\` (scripts/importar-mikrotik.js). NO EDITAR A MANO: se
// regenera desde las fichas oficiales de mikrotik.com, y una edicion a mano se perderia en la
// siguiente lectura sin que nadie la contraste.
//
// Matriz de pruebas RFC 2544 (equipo Xena) de cada ficha, por «Product code». Cada celda es
// [kpps, Mbps] y su tamano de trama en bytes. Mbps es el caudal AGREGADO de la prueba «all
// port» (la suma de lo que reenvian todos los puertos), no el de un puerto WAN.
//   ruteo   fastpath (sin configuracion), colas (25 colas simples), filtro (25 reglas de
//           filtro), y en los CCR con offload de hardware l3hw y l3hwFiltro.
//   puente  fastpath y filtro (25 reglas de filtro de puente).
//   ipsec   uno (un tunel) y multi (256 tuneles), por cifrado, a 1400/512/64 bytes. null: la
//           ficha no publica IPsec (equipos sin motor criptografico medido).

const LEIDO = ${JSON.stringify(leido)};

const FICHAS = {
${cuerpo}
};

module.exports = { LEIDO, FICHAS };
`;
}

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const force = args.includes('--force');
  const check = args.includes('--check');
  const rutas = args.filter((a) => !a.startsWith('--'));
  const { MODELS } = require('../server/seed/legacyData/mikrotik');
  let previas = {};
  try { previas = require(DESTINO).FICHAS; } catch { previas = {}; }

  if (check) {
    for (const m of MODELS) {
      const estado = !m.codigo ? 'sin codigo de producto (no tiene ficha propia)' : previas[m.codigo] ? 'con ficha' : 'SIN FICHA LEIDA';
      console.log(`${m.id.padEnd(28)} ${estado}`);
    }
    return;
  }
  if (!rutas.length) { console.error('Uso: npm run mikrotik -- <carpeta|ficha.html>... [--dry] [--force] | --check'); process.exit(2); }

  const porCodigo = new Map(MODELS.filter((m) => m.codigo).map((m) => [m.codigo, m]));
  const nuevas = { ...previas };
  let aplicadas = 0; let rechazadas = 0;
  for (const f of archivos(rutas)) {
    const { ficha, errores } = leerFicha(fs.readFileSync(f, 'utf8'));
    const nombre = path.basename(f);
    if (!ficha) { console.log(`APARTADA   ${nombre}: ${errores.join('; ')}`); continue; }
    const modelo = porCodigo.get(ficha.codigo);
    if (!modelo) { console.log(`SIN MODELO ${nombre}: «${ficha.codigo}» no es el codigo de ningun modelo del catalogo`); continue; }
    const a = anclar(ficha, modelo);
    if (errores.length) {
      console.log(`RECHAZADA  ${nombre} (${modelo.id}): ${errores.join('; ')}`); rechazadas++; continue;
    }
    if (!a.ok && !(force && a.casan.length + a.chocan.length >= 2)) {
      console.log(`RECHAZADA  ${nombre} (${modelo.id}): casan [${a.casan.join(', ')}] · chocan [${a.chocan.join(', ')}]`
        + (a.chocan.length ? ' — si la ficha es la vigente, corregir el catalogo o --force' : ' — contraste insuficiente'));
      rechazadas++; continue;
    }
    const { spec, ...limpia } = ficha;
    nuevas[ficha.codigo] = limpia;
    aplicadas++;
    console.log(`${a.ok ? 'OK        ' : 'FORZADA   '} ${nombre} -> ${modelo.id} (casan ${a.casan.join(', ')}${a.chocan.length ? `; chocan ${a.chocan.join(', ')}` : ''})`);
  }
  // Orden del catalogo: el diff de una relectura es el de las cifras, no el de un reordenamiento.
  const ordenadas = {};
  for (const m of MODELS) if (m.codigo && nuevas[m.codigo]) ordenadas[m.codigo] = nuevas[m.codigo];
  const leido = new Date().toISOString().slice(0, 10);
  console.log(`\n${aplicadas} aplicadas, ${rechazadas} rechazadas.`);
  if (dry) { console.log('(--dry: no se escribe nada)'); return; }
  if (!aplicadas) return;
  fs.writeFileSync(DESTINO, serializar(ordenadas, leido));
  console.log(`Escrito ${path.relative(process.cwd(), DESTINO)}`);
}

if (require.main === module) main();

module.exports = { leerFicha, lecturas, par, anclar };
