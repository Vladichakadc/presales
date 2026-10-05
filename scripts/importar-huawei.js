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
//   · `typ` e `ipsec` en las NetEngine. (`mpps` en los AR no: sus fichas no lo publican, y
//     el `typ` de los 23 AR quedo completo el 2026-10-05 con las fichas de serie.)
//
// EL REENVIO NO SIRVE PARA DIMENSIONAR SD-WAN, y por eso este script separa `fwd` de `typ`.
// En el AR5710-S son 1.300 Mbps de reenvio (NAT + ACL + QoS) frente a 620 de SD-WAN tipico
// (IPsec + QoS + SA + AppFlow), un factor 2,1. Las dos cifras son IMIX segun su ficha R25C10:
// lo que cambia es lo que el equipo hace con cada paquete, no el tamano del paquete. (Hasta el
// 2026-10-05 este comentario decia que los 1.300 eran «la cifra de paquetes grandes»; la ficha
// lo desmiente.) Es el mismo modo de fallo que en el SRX380 vale un factor 10 y que en el
// FortiGate 60F valio 14,3x.
//
//     npm run huawei -- --check                 que falta, casilla por casilla
//     npm run huawei -- specs.xlsx --dry        que haria, sin escribir
//     npm run huawei -- specs.xlsx              aplica
//     npm run huawei -- specs.xlsx --force      corrige una cifra que difiere, con dos anclas
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
const PLANTILLA = args.includes('--plantilla');
const entrada = args.find((a) => !a.startsWith('--'));

const ANCLAS_MINIMAS = 2;
const TOLERANCIA = 0.02;

// Campos importables. `fwd` y `typ` van separados a proposito: son dos mediciones distintas
// y confundirlas es el error de preventa que este catalogo evita.
//
// LA CABECERA LITERAL DE HUAWEI TIENE QUE CAER EN SU CAMPO (2026-10-05). La regla de `typ`
// aceptaba «imix» a secas, y la ficha de Huawei escribe «Forwarding performance (NAT + ACL +
// QoS, IMIX)»: como `typ` se mira primero, el reenvio se cargaba como SD-WAN tipico. Y la
// tabla trae tres filas mas que no son ninguno de estos campos: «SD-WAN IPsec performance»
// (solo IPsec, la que el AR8700-8 llevaba como `typ`), «SD-WAN performance» (IPsec + QoS) y
// las de paquete fijo (512 o 1400 bytes), que miden otra base. Ahora `typ` exige «typical» o
// «tipico», IPsec no acepta una cabecera de SD-WAN y una cabecera de paquete fijo se ignora.
const CAMPOS = [
  { campo: 'typ', tipo: 'tput', et: 'Throughput tipico (IMIX)', re: (c) => /typical|tipico|típico/.test(c) },
  { campo: 'ipsec', tipo: 'tput', et: 'IPsec VPN', re: (c) => /ipsec|vpn/.test(c) && !/sd-?wan/.test(c) },
  { campo: 'mpps', tipo: 'conteo', et: 'Mpps', re: (c) => /mpps|packet.*rate|paquetes/.test(c) },
  { campo: 'fwd', tipo: 'tput', et: 'Forwarding (NAT+ACL+QoS, IMIX)', re: (c) => /forwarding|throughput|rendimiento|capacidad/.test(c) },
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
    if (/\d+\s*-?\s*bytes?\b/.test(c) && !/imix/.test(c)) { ignoradas.push(cab[i]); return; }
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

// La unidad escrita en la celda manda sobre la de la columna (2026-10-05). `aNumero` la quita
// para leer el numero, y la columna la deduce contrastando con lo verificado; pero cuando la
// cifra que se corrige es justo la que difiere, ese contraste no tiene donde apoyarse y «15.5
// Gbps» entraba como 15,5 Mbps.
function unidadDeCelda(txt) {
  const s = String(txt == null ? '' : txt).toLowerCase();
  if (/\b(gbps|gb\/s)\b/.test(s)) return 1000;
  if (/\b(mbps|mb\/s)\b/.test(s)) return 1;
  return null;
}

const casa = (a, b) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * TOLERANCIA);
const fmt = (n) => Number(n).toLocaleString('es-ES');

// La unidad la manda la cabecera; si calla, se deduce contrastando con lo ya verificado, en
// vez de multiplicar por mil a ojo.
function resolverUnidad(col, filas, colModelo, indice = porClave) {
  if (col.tipo !== 'tput') return { factor: 1, como: 'conteo' };
  if (col.unidadDeclarada) return { factor: col.unidadDeclarada, como: 'declarada en la cabecera' };
  const votos = { 1: 0, 1000: 0 };
  const conUnidad = filas.filter((f) => unidadDeCelda(f[col.i])).length;
  for (const fila of filas) {
    const m = indice.get(claveModelo(fila[colModelo]));
    if (!m) continue;
    const ref = m[col.campo];
    if (ref == null) continue;
    const v = aNumero(fila[col.i], false);
    if (v == null || Number.isNaN(v) || unidadDeCelda(fila[col.i])) continue;
    if (casa(v, ref)) votos[1]++;
    else if (casa(v * 1000, ref)) votos[1000]++;
  }
  if (votos[1000] > votos[1]) return { factor: 1000, como: 'deducida por contraste (venia en Gbps)' };
  if (votos[1] > 0) return { factor: 1, como: 'deducida por contraste (ya venia en Mbps)' };
  if (conUnidad && conUnidad === filas.filter((f) => aNumero(f[col.i], false) != null).length) {
    return { factor: 1, como: 'la escribe cada celda' };
  }
  return { factor: 1, como: 'sin contraste posible; se asume Mbps' };
}

// Un hueco que el fabricante no publica no es un hueco que se pueda llenar, y el inventario lo
// dice en vez de pedirlo. Medido el 2026-10-05 en las cinco fichas de serie (AR610, AR650,
// AR5710-S, AR6710-H y AR8000): ninguna publica Mpps.
const NO_PUBLICA_AR = { mpps: '(las fichas AR no publican Mpps: leidas las cinco series el 2026-10-05)' };

function informeCobertura() {
  console.log('\n== COBERTURA DEL CATALOGO HUAWEI ==\n');
  const campos = ['fwd', 'typ', 'ipsec', 'mpps'];
  const ar = MODELS.filter((m) => m.cls === 'AR');
  const ne = MODELS.filter((m) => m.cls !== 'AR');
  for (const [etiqueta, grupo] of [['AR', ar], ['NetEngine / otros', ne]]) {
    console.log(`${etiqueta} — ${grupo.length} modelos`);
    for (const c of campos) {
      const con = grupo.filter((m) => m[c] != null).length;
      const nota = (etiqueta === 'AR' && NO_PUBLICA_AR[c]) ? `  ${NO_PUBLICA_AR[c]}` : '';
      console.log(`   ${c.padEnd(6)} ${String(con).padStart(3)}/${String(grupo.length).padEnd(3)}${nota}`);
    }
  }
  const eol = MODELS.filter((m) => m.eol || m.eolAnnounced).length;
  console.log(`\nCiclo de vida: ${eol}/${MODELS.length} modelos marcados.`);
  if (!eol) {
    console.log('   Ninguno. Es el hueco mas caro: una propuesta con un equipo');
    console.log('   descatalogado se cae en la mesa del cliente.');
    console.log('   Se carga con:  npm run huawei -- eox.csv --eol');
  }
  console.log('\nPara llenarlo:  npm run huawei -- --plantilla');
  console.log('   escribe huawei-specs.csv y huawei-eox.csv ya con los modelos, listos para pegar cifras.');
  console.log('\nFuentes (bloqueadas por egreso desde este entorno):');
  console.log('   Info-Finder            https://info.support.huawei.com/  (requiere Huawei ID)');
  console.log('   Boletines de fin de vida  https://support.huawei.com/enterprise/en/bulletins-lifecycle\n');
}

// ── Fin de venta ────────────────────────────────────────────────────────────
// Formato esperado: modelo, fecha de ultimo pedido y, si lo hay, sucesor y URL del boletin.
// Se guarda como eolAnnounced con su fecha real, NO como una marca fija: la regla de
// ficha.js compara esa fecha contra la de hoy, asi que un equipo deja de proponerse solo el
// dia que vence su ultimo pedido, sin que nadie tenga que volver a editar el catalogo.
//
// EN HUAWEI «EOS» NO ES FIN DE VENTA (corregido el 2026-10-01). Su ciclo de vida tiene tres
// fechas: EOM (End of Marketing, el ultimo pedido), EOFS (fin del soporte completo) y EOS (End
// of Service, el fin del soporte). La primera version buscaba la columna de fecha con
// `/last order|...|eos|end of sale/` y no reconocia «EOM» en absoluto, asi que una exportacion
// de Info-Finder con sus tres columnas habria cargado la fecha de EOS como ultimo pedido: años
// de retraso, con el equipo ofrecido como pedible mucho despues de dejar de venderse. Ahora
// el ultimo pedido es EOM (o «last order»/«end of sale»), y un archivo que solo trae EOS o EOFS
// se rechaza diciendo por que, en vez de adivinar. La de EOS se guarda aparte, como
// `endOfSupport` (el campo que `ficha.js` ya pinta), que es lo que importa a quien amplia un parque instalado.
//
// UN BOLETIN DE VERSION DE SOFTWARE NO ES EL FIN DE VENTA DEL EQUIPO. Huawei publica en la
// misma lista el EOM del hardware y el de cada version (V800R023C00, V300R021C10...): medido el
// 2026-10-01, los avisos de 2026 de la serie NE8000 son de la version V800R023C00, no de los
// chasis. Cargar uno de esos marcaria fuera de venta un equipo que se sigue vendiendo con la
// version siguiente. Una fila que nombra una version se aparta con su motivo — la misma regla
// que ya aplica la tabla de fin de vida de Juniper, que mezcla paquetes de software y chasis.
const RE_VERSION = /\bV\d{3}R\d{3}(C\d{2,3})?/i;
const RE_ULTIMO_PEDIDO = /\beom\b|end of marketing|last order|[uú]ltimo pedido|end of sale|fin de venta/;
const RE_FIN_SERVICIO = /\beos\b|end of service|fin de servicio/;

function leerEol(filas) {
  const cab = filas[0].map((c) => String(c || '').toLowerCase());
  const col = (re) => cab.findIndex((c) => re.test(c));
  const cModelo = col(/model|modelo|producto|equipo/);
  const cFecha = col(RE_ULTIMO_PEDIDO);
  const cServicio = cab.findIndex((c, i) => i !== cFecha && RE_FIN_SERVICIO.test(c));
  const cSucesor = col(/sucesor|successor|replacement|reemplazo/);
  const cUrl = col(/url|bolet|bulletin|enlace|link/);
  const cVersion = col(/versi[oó]n|release|software/);
  if (cModelo < 0) return { error: 'Falta la columna de modelo.' };
  if (cFecha < 0) {
    const soloSoporte = cab.some((c) => RE_FIN_SERVICIO.test(c) || /\beofs\b/.test(c));
    return {
      error: soloSoporte
        ? 'El archivo trae fechas de EOS/EOFS pero no la de ultimo pedido. En Huawei EOS es el fin del SOPORTE, no de la venta: la fecha de ultimo pedido es la columna EOM (End of Marketing).'
        : 'Falta la columna de ultimo pedido (EOM / End of Marketing / last order / ultimo pedido).',
    };
  }

  const aceptadas = [];
  const apartadas = [];
  for (const fila of filas.slice(1)) {
    const nombre = fila[cModelo];
    const version = fila.find((c) => RE_VERSION.test(String(c || '')))
      || (cVersion >= 0 && String(fila[cVersion] || '').trim());
    if (version) {
      apartadas.push({ id: nombre, motivo: `es el ciclo de vida de una version de software (${String(version).match(RE_VERSION) ? String(version).match(RE_VERSION)[0] : version}), no del equipo` });
      continue;
    }
    const m = porClave.get(claveModelo(nombre));
    if (!m) { apartadas.push({ id: nombre, motivo: 'no esta en el catalogo' }); continue; }
    const fecha = String(fila[cFecha] || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      apartadas.push({ id: m.id, motivo: `fecha "${fecha}" no es ISO (AAAA-MM-DD)` });
      continue;
    }
    const servicio = cServicio >= 0 ? String(fila[cServicio] || '').trim() : '';
    if (servicio && !/^\d{4}-\d{2}-\d{2}$/.test(servicio)) {
      apartadas.push({ id: m.id, motivo: `fecha de fin de servicio "${servicio}" no es ISO (AAAA-MM-DD)` });
      continue;
    }
    if (servicio && servicio < fecha) {
      apartadas.push({ id: m.id, motivo: `el fin de servicio (${servicio}) es anterior al ultimo pedido (${fecha}): columnas cambiadas` });
      continue;
    }
    aceptadas.push({
      id: m.id, lastOrder: fecha, endOfSupport: servicio || null,
      sucesor: cSucesor >= 0 ? (fila[cSucesor] || '').trim() || null : null,
      url: cUrl >= 0 ? (fila[cUrl] || '').trim() || null : null,
    });
  }
  return { aceptadas, apartadas };
}

function aplicarEol(filas) {
  const { error, aceptadas, apartadas } = leerEol(filas);
  if (error) {
    console.error(error);
    process.exit(1);
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
      ...(a.endOfSupport ? [`endOfSupport:'${a.endOfSupport}'`] : []),
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
// --force CORRIGE, COMO EN JUNIPER (2026-10-05). Hasta ese dia solo saltaba el minimo de
// anclas, y una fila con una cifra distinta se apartaba siempre: no habia forma de corregir un
// dato verificado que la ficha vigente contradice (el `typ` del AR8700-8, 24 Gbps en el
// catalogo y 15,5 en su ficha R25C10). Ahora pisa la cifra que difiere, pero sigue exigiendo
// dos anclas en las OTRAS columnas: para corregir un dato hay que demostrar primero que la fila
// es la del equipo correcto. Saltarse el anclaje es otra cosa, y es `--sin-contraste`.
function evaluarCifras(filas, { force = false, sinContraste = false } = {}, modelos = null) {
  const indice = modelos ? new Map(modelos.map((m) => [claveModelo(m.id), m])) : porClave;
  const { colModelo, columnas, ignoradas } = leerCabecera(filas[0]);
  if (colModelo < 0) return { error: 'No se encontro la columna de modelo en la cabecera.' };
  if (!columnas.length) return { error: 'Ninguna columna reconocida. Cabeceras vistas: ' + filas[0].join(' | ') };

  const cuerpo = filas.slice(1);
  const unidades = new Map(columnas.map((c) => [c.campo, resolverUnidad(c, cuerpo, colModelo, indice)]));

  const aceptadas = [];
  const apartadas = [];
  for (const fila of cuerpo) {
    const m = indice.get(claveModelo(fila[colModelo]));
    if (!m) { apartadas.push({ id: fila[colModelo], motivo: 'no esta en el catalogo' }); continue; }

    let anclas = 0;
    let ilegible = null;
    const choques = [];
    const nuevos = [];
    for (const c of columnas) {
      const crudo = aNumero(fila[c.i], c.tipo === 'conteo');
      if (crudo === null) continue;
      if (Number.isNaN(crudo)) { ilegible = `${c.et}: celda ilegible "${fila[c.i]}"`; break; }
      const factor = unidadDeCelda(fila[c.i]) || unidades.get(c.campo).factor;
      const valor = c.tipo === 'tput' ? Math.round(crudo * factor * 1000) / 1000 : crudo;
      const ref = m[c.campo];
      if (ref == null) nuevos.push({ campo: c.campo, et: c.et, valor });
      else if (casa(valor, ref)) anclas++;
      else choques.push({ campo: c.campo, et: c.et, valor, pisa: ref });
    }

    if (ilegible) { apartadas.push({ id: m.id, motivo: ilegible }); continue; }
    if (choques.length && !force) {
      apartadas.push({ id: m.id, motivo: choques.map((c) => `${c.et}: la fila dice ${fmt(c.valor)} y el catalogo ${fmt(c.pisa)}`).join(' | ')
        + ' — parece una fila desplazada; si de verdad el catalogo esta mal, --force lo corrige' });
      continue;
    }
    const cambios = [...nuevos, ...choques];
    if (!cambios.length) {
      apartadas.push({ id: m.id, motivo: anclas ? `confirma el catalogo (${anclas} columna(s) casan): nada que escribir` : 'no aporta nada nuevo' });
      continue;
    }
    if (anclas < ANCLAS_MINIMAS && !sinContraste) {
      apartadas.push({ id: m.id, motivo: `solo ${anclas} ancla(s); hacen falta ${ANCLAS_MINIMAS}` });
      continue;
    }
    aceptadas.push({ id: m.id, anclas, nuevos: cambios });
  }
  return { columnas, ignoradas, unidades, aceptadas, apartadas };
}

function aplicarCifras(filas) {
  const r = evaluarCifras(filas, { force: FORCE, sinContraste: SIN_CONTRASTE });
  if (r.error) { console.error(r.error); process.exit(1); }
  const { columnas, ignoradas, unidades, aceptadas, apartadas } = r;
  if (ignoradas.length) console.log(`Columnas ignoradas: ${ignoradas.join(', ')}`);
  for (const c of columnas) console.log(`  ${c.et}: unidad ${unidades.get(c.campo).como}`);

  console.log(`\n== CIFRAS ==\n${aceptadas.length} fila(s) aceptada(s), ${apartadas.length} apartada(s).\n`);
  for (const a of aceptadas) {
    console.log(`  ${a.id}  (${a.anclas} ancla(s))`);
    for (const n of a.nuevos) console.log(`     ${n.et}: ${n.pisa != null ? `${fmt(n.pisa)} -> ` : ''}${fmt(n.valor)}`);
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

// ── Plantilla ───────────────────────────────────────────────────────────────
// Escribe dos CSV con los modelos que HOY tienen huecos, una fila por modelo y las columnas
// vacias, para que quien tenga acceso a Info-Finder solo pegue cifras en vez de construir la
// hoja. Se GENERA en vez de vivir commiteada a proposito: una plantilla guardada se queda
// con los modelos de ayer, y en un catalogo que cambia eso significa pedir datos de equipos
// que ya no estan y no pedir los de los que entraron. Las cabeceras son las que el propio
// importador reconoce, asi que el archivo vuelve tal cual y no hay que renombrar nada.
function escribirPlantillas() {
  const salida = process.cwd();
  const filas = [];
  for (const m of MODELS) {
    const faltan = ['fwd', 'typ', 'ipsec', 'mpps'].filter((c) => m[c] == null);
    if (faltan.length) filas.push({ m, faltan });
  }
  // Una sola hoja para los dos grupos: el importador case por nombre de modelo, no por orden,
  // y partirla en dos invita a pegar la columna en la mitad equivocada.
  const csv = [['Modelo', 'Forwarding (Mbps)', 'Typical IMIX (Mbps)', 'IPsec VPN (Mbps)', 'Mpps', 'Falta hoy']];
  for (const { m, faltan } of filas) {
    csv.push([m.id, m.fwd == null ? '' : m.fwd, m.typ == null ? '' : m.typ,
      m.ipsec == null ? '' : m.ipsec, m.mpps == null ? '' : m.mpps, faltan.join(' ')]);
  }
  const eox = [['Modelo', 'EOM - ultimo pedido (AAAA-MM-DD)', 'EOS - fin de servicio (AAAA-MM-DD)', 'Sucesor', 'URL del boletin']];
  for (const m of MODELS) eox.push([m.id, '', '', '', '']);

  const escribir = (nombre, tabla) => {
    const texto = tabla.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    fs.writeFileSync(path.join(salida, nombre), texto);
    return path.join(salida, nombre);
  };
  const a = escribir('huawei-specs.csv', csv);
  const b = escribir('huawei-eox.csv', eox);

  console.log(`\nPlantillas escritas:\n   ${a}   ${filas.length} modelos con algun hueco`);
  console.log(`   ${b}   los ${MODELS.length} modelos, para el ciclo de vida\n`);
  console.log('Las celdas que YA traen cifra son las verificadas: no se tocan, y son las que');
  console.log('el doble anclaje usa para detectar una fila desplazada. Deja en blanco lo que no');
  console.log('encuentres — un hueco declarado es correcto; una cifra inventada, no.\n');
  console.log('Cuando esten llenas:\n   npm run huawei -- huawei-specs.csv --dry   (ensayo, no escribe)');
  console.log('   npm run huawei -- huawei-specs.csv\n   npm run huawei -- huawei-eox.csv --eol\n');
}

if (require.main === module) {
  if (PLANTILLA) { escribirPlantillas(); process.exit(0); }
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

module.exports = { claveModelo, aNumero, leerCabecera, resolverUnidad, leerEol, evaluarCifras };
