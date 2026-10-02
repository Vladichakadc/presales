#!/usr/bin/env node
'use strict';
// Inventario del catalogo: que falta, en que fabricante y en cuantos modelos.
//
// POR QUE EXISTE
// `npm run cps -- --check` y `npm run juniper -- --check` ya hacian esto, cada uno para su
// fabricante. Pero eran los dos unicos: para los otros cinco no habia forma de saber cuantos
// huecos hay sin abrir el archivo y contar a ojo. Este script generaliza esa idea a los seis
// catalogos y anade lo que ninguno miraba — la procedencia y su antiguedad, y los avisos de
// fin de venta cuya fecha ya paso.
//
//     npm run catalogo                cobertura de campos, ciclo de vida y procedencia
//     npm run catalogo -- --fuentes   solo la procedencia
//     npm run catalogo -- --json      la misma informacion como JSON, para CI
//
// NO SALE A INTERNET. Solo lee los archivos de server/seed/legacyData/, asi que corre igual
// dentro de este entorno (donde los dominios de los fabricantes estan bloqueados por egreso)
// que fuera. Sirve para saber que ir a buscar ANTES de abrir un documento de cien paginas.
//
// COMO LEER LA SALIDA. Un campo en `null` significa "el catalogo no trae el dato", nunca
// "el equipo no lo tiene": el motor no filtra por un eje sin dato y la ficha lo declara. Que
// un porcentaje sea bajo no es un fallo del codigo, es un hueco del catalogo — y saber
// exactamente cual es el punto de este comando.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { fuentesDe, ANTIGUEDAD_AVISO_MESES } = require('../server/seed/legacyData/fuentes');
const { pendientes: pendientesDeRevision } = require('./vigia-fuentes');
const vendors = require('../server/seed/legacyData/vendors');

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const SOLO_FUENTES = args.includes('--fuentes');

// Campos que se inventarian por fabricante. Solo los que el motor usa para dimensionar o
// cotizar: contar la cobertura de un campo decorativo no ayuda a nadie.
const CAMPOS = {
  huawei: { mod: 'huawei', lista: 'MODELS', campos: ['fwd', 'ipsec', 'typ', 'mpps', 'redund'] },
  cisco: { mod: 'cisco', lista: 'MODELS', campos: ['ipsec', 'sdwan', 'redund'] },
  // `ssl` entra en la cuenta el 2026-09-22: esta en 9 de 58 y es el hueco mas caro que
  // queda, porque el motor APARTA un modelo sin esa cifra en cuanto alguien pide inspeccion
  // SSL profunda. Un hueco que no se cuenta se comporta como uno que no existe.
  // Los cuatro limites de configuracion entran el 2026-09-23 con la tabla del Product Matrix:
  // son lo que convierte «tantos tuneles hacen falta» en una comprobacion, y su cobertura es
  // justo lo que hay que mirar antes de creer que un escenario se valido entero.
  fortinet: { mod: 'fortinet', lista: 'MODELS', campos: ['fw', 'tp', 'ssl', 'vpn', 'sess', 'cps', 'redund', 'tunGw', 'tunCli', 'sslVpnUsers', 'vdomMax'] },
  mikrotik: { mod: 'mikrotik', lista: 'MODELS', campos: ['fwd', 'ipsec', 'ram', 'cores', 'redund'] },
  aruba: { mod: 'aruba', lista: 'MODELS', campos: ['redund'] },
  juniper: { mod: 'juniper', lista: 'MODELS', campos: ['fw', 'fwImix', 'vpn', 'ips', 'atp', 'sess', 'redund'] },
  // Nokia faltaba entero hasta el 2026-09-03: este informe contaba SEIS fabricantes de siete,
  // asi que sus 18 modelos no aparecian ni como hueco. Un informe que omite un fabricante es
  // peor que no tenerlo, que es la misma razon por la que los precios se cuentan sobre
  // cotizadorCatalog y no sobre los MODELS de cada uno.
  //
  // Va en dos filas porque son dos catalogos con dos motores: `MODELS` es el fabric 7220 IXR
  // y `MODELS_ROUTER` la agregacion y el core. Se cuentan `cap` y `redund` y NADA MAS: en la
  // lista de routers, `configs` en null NO es un hueco -son los chasis modulares, que no
  // publican densidad y lo declaran-, asi que contarlo diria "9 de 14" e inventaria cinco
  // ausencias que no existen. Justo el informe que miente del que avisa la cabecera.
  'nokia (fabric)': { mod: 'nokia', lista: 'MODELS', campos: ['cap', 'redund'] },
  'nokia (agregacion/core)': { mod: 'nokia', lista: 'MODELS_ROUTER', campos: ['cap', 'redund'] },
};

function cargar(nombre) {
  try {
    return require(`../server/seed/legacyData/${nombre}`);
  } catch {
    return null;
  }
}

// Un campo cuenta como presente si no es null ni undefined. `false` SI cuenta: en `redund`
// es un hecho verificado ("fuente unica"), no una ausencia — es justo la distincion de tres
// estados que ficha.js protege.
const tieneDato = (v) => v !== null && v !== undefined;

function cobertura() {
  const filas = [];
  for (const [vendor, cfg] of Object.entries(CAMPOS)) {
    const mod = cargar(cfg.mod);
    const modelos = mod && Array.isArray(mod[cfg.lista]) ? mod[cfg.lista] : null;
    if (!modelos) { filas.push({ vendor, error: `no se pudo leer ${cfg.mod}.${cfg.lista}` }); continue; }
    const campos = {};
    for (const campo of cfg.campos) {
      const con = modelos.filter((m) => tieneDato(m[campo])).length;
      campos[campo] = { con, de: modelos.length, pct: Math.round((con / modelos.length) * 100) };
    }
    filas.push({ vendor, modelos: modelos.length, campos });
  }
  return filas;
}

// Fin de venta: cuantos modelos estan marcados y cuantos avisos ya vencieron. Un boletin con
// la fecha de ultimo pedido pasada no es un error — ficha.js lo degrada solo — pero conviene
// verlo, porque significa que ese equipo ya no se propone.
function cicloDeVida() {
  const hoy = new Date().toISOString().slice(0, 10);
  const filas = [];
  for (const [vendor, cfg] of Object.entries(CAMPOS)) {
    const mod = cargar(cfg.mod);
    const modelos = mod && Array.isArray(mod[cfg.lista]) ? mod[cfg.lista] : [];
    if (!modelos.length) continue;
    const eol = modelos.filter((m) => m.eol === true).length;
    const anunciados = modelos.filter((m) => m.eolAnnounced);
    const vencidos = anunciados.filter((m) => m.eolAnnounced.lastOrder && m.eolAnnounced.lastOrder < hoy);
    filas.push({ vendor, modelos: modelos.length, eol, anunciados: anunciados.length, vencidos: vencidos.length });
  }
  return filas;
}

// Precios: cuantos equipos cotizables van sin cifra.
//
// Se cuenta sobre cotizadorCatalog.js y NO sobre los MODELS de cada fabricante, porque ese
// archivo es la fuente autoritativa de "que se puede cotizar" — los MODELS de los
// dimensionadores incluyen equipos de referencia que nunca llevaron precio. Contarlo alli
// daba "Fortinet 0/58 sin cotizar" justo del unico fabricante con lista de precios firmada:
// un informe que miente es peor que no tenerlo.
//
// Aruba va entera sin cotizar a proposito (no hay price list) y el BOM lo declara, en vez de
// inventar importes.
function precios() {
  const filas = require('../server/seed/legacyData/cotizadorCatalog');
  const porVendor = new Map();
  for (const row of filas) {
    const v = String(row.vendor || '').toLowerCase();
    if (!porVendor.has(v)) porVendor.set(v, { vendor: v, con: 0, de: 0 });
    const acc = porVendor.get(v);
    acc.de++;
    if (tieneDato(row.elpN) && row.elpN > 0) acc.con++;
  }
  return [...porVendor.values()]
    .map((a) => ({ ...a, sinCotizar: a.de - a.con }))
    .sort((a, b) => a.vendor.localeCompare(b.vendor));
}

/* ── PANTALLAS: un campo declarado que ya no existe ───────────────────────────
   QUE COMPRUEBA. Cada dimensionador le pasa a `ESTADO.vincular({campos})` la lista de ids
   cuyo valor viaja en el enlace compartido. Si alguien renombra o retira un control y no
   toca esa lista, el campo deja de reponerse: quien abre el enlace ve otro escenario. Aqui
   se cruza la lista declarada contra el `id=` del HTML de esa misma pagina.

   POR QUE HACIA FALTA. Los dos fallos del 2026-09-13 fueron de esta clase y el inventario
   no miraba nada de la capa de presentacion: el refactor de Aruba retiro `#bw` y dejo
   `pantallas.yml` en rojo cuatro dias, y la lista de parametros v1 solo la declaraba una
   pagina. Este informe mira el catalogo; esto mira que la pantalla y su estado sigan
   hablando del mismo control.

   POR QUE SE PARSEA Y NO SE EJECUTA. En `dimensionador-nokia-7220ixr.js` la llamada vive
   detras de un `await fetch(...)`, asi que cargar el modulo exigiria doblar la red y el DOM
   para leer un array literal. Se extrae el texto, y cuando `campos:` es un identificador —el
   `CAMPOS_ESCENARIO` de Aruba— se resuelve su declaracion en el mismo archivo.

   Y SI NO SE PUEDE LEER, SE DICE. Una pagina que no se sabe parsear se reporta como error,
   nunca se salta en silencio: un comprobador que no comprueba se porta igual que uno que
   pasa, que es como `CISCO_EOL_MODELS` vivio meses sin marcar nada. */

// Ids que NO estan en el HTML a proposito porque los crea un modulo compartido en tiempo de
// ejecucion. Cada excepcion trae el modulo y el ancla que debe seguir existiendo en el: si
// `ficha.js` dejara de construir ese `<select>`, la excepcion caducaria y este informe lo
// dice, en vez de seguir tapando un campo que ya no existe en ninguna parte.
//
// EL ANCLA VA COMPLETA, Y ESO SE APRENDIO SABOTEANDO. La primera version anclaba en
// `${cid}-sel`; al renombrar el control a `${cid}-selector` para comprobar que saltaba, NO
// salto — el ancla corta seguia siendo subcadena de la larga, asi que la excepcion se daba por
// viva sobre un control que ya no existia. Una excepcion que no sabe caducar tapa exactamente
// lo que este comprobador existe para encontrar, que es el conjunto inerte de siempre.
const TARDIOS = {
  // El simulador de precio neto lo construye `bom.js` (2026-09-13): sus tramos no dependen de
  // ningun fabricante, asi que copiar doce lineas de marcado en siete HTML era el patron que
  // este repositorio ya pago con `llevarABom`. Las anclas son el marcado completo del control.
  selDescuento: {
    modulo: 'public/js/bom.js',
    ancla: '<select id="selDescuento"',
    porque: 'lo construye BOM.simuladorDescuento en la caja que la pagina declara',
  },
  dtoCustom: {
    modulo: 'public/js/bom.js',
    ancla: 'id="dtoCustom"',
    porque: 'lo construye BOM.simuladorDescuento junto al selector de tramo',
  },
  'verdict-sel': {
    modulo: 'public/js/ficha.js',
    // El ancla lleva `${cid}` a proposito: es el TEXTO FUENTE de la plantilla de ficha.js,
    // no una interpolacion que se olvido de escribir con backticks.
    // eslint-disable-next-line no-template-curly-in-string
    ancla: '<select id="${cid}-sel">',
    porque: 'lo pinta ficha.js despues del primer render (el desplegable de equipo)',
  },
};

// Paginas que a proposito no comparten estado por URL/localStorage via `ESTADO.vincular`.
// Starlink es la unica: su motor (starlink-leo-dimensionador/app.js, integrado sin cambios por
// mandato del prompt maestro del 2026-09-24) trae su propio ciclo de estado -ejemplos
// precargados, restablecer, exportar JSON- y el contrato de integracion no pedia sumarlo al
// mecanismo de enlace compartido de los demas dimensionadores. No es un hueco sin detectar:
// esta declarado aqui para que la comprobacion no lo lea como un olvido.
const SIN_ESTADO_COMPARTIDO = new Set(['dimensionador-starlink-leo.js']);

function camposDeclarados(src) {
  const m = src.match(/ESTADO\.vincular\(\s*\{[\s\S]{0,160}?campos:\s*(\[[\s\S]*?\]|[A-Za-z_$][\w$]*)/);
  if (!m) return { error: 'no se encontro la llamada a ESTADO.vincular({campos:...})' };
  let bruto = m[1];
  if (!bruto.startsWith('[')) {
    const decl = src.match(new RegExp(`(?:const|let|var)\\s+${bruto}\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;`));
    if (!decl) return { error: `campos apunta a "${bruto}" y no se encontro su declaracion en el mismo archivo` };
    bruto = decl[1];
  }
  const ids = [...bruto.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
  if (!ids.length) return { error: 'la lista de campos se leyo vacia' };
  return { ids };
}

function pantallas() {
  const dirPublic = path.join(__dirname, '..', 'public');
  const archivos = fs.readdirSync(path.join(dirPublic, 'js'))
    .filter((f) => f.startsWith('dimensionador-') && f.endsWith('.js'))
    .sort();
  const filas = [];
  for (const archivo of archivos) {
    const pagina = archivo.replace(/\.js$/, '.html');
    const rutaHtml = path.join(dirPublic, pagina);
    if (!fs.existsSync(rutaHtml)) { filas.push({ pagina, error: 'no existe su HTML' }); continue; }
    if (SIN_ESTADO_COMPARTIDO.has(archivo)) { filas.push({ pagina, campos: null, faltan: [], tardios: [] }); continue; }
    const { ids, error } = camposDeclarados(fs.readFileSync(path.join(dirPublic, 'js', archivo), 'utf8'));
    if (error) { filas.push({ pagina, error }); continue; }
    const html = fs.readFileSync(rutaHtml, 'utf8');
    const enHtml = (id) => new RegExp(`id=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html);
    const faltan = [];
    const tardios = [];
    for (const id of ids) {
      if (enHtml(id)) continue;
      const t = TARDIOS[id];
      if (!t) { faltan.push({ id, motivo: 'no existe ningun control con ese id' }); continue; }
      // La excepcion solo vale mientras su modulo siga creando el control.
      const mod = path.join(__dirname, '..', t.modulo);
      const vivo = fs.existsSync(mod) && fs.readFileSync(mod, 'utf8').includes(t.ancla);
      if (vivo) tardios.push(id);
      else faltan.push({ id, motivo: `se exceptuaba porque ${t.porque}, pero ${t.modulo} ya no lo crea` });
    }
    filas.push({ pagina, campos: ids.length, faltan, tardios });
  }
  return filas;
}

function procedencia() {
  const ahora = new Date();
  return vendors.map((v) => ({ vendor: v.code, fuentes: fuentesDe(v.code, ahora) }));
}

// EL RADIO DE IMPACTO DE UNA FUENTE.
//
// `cubre` es prosa y se lee bien en pantalla, pero no dice si un cambio toca tres campos o
// cincuenta y ocho modelos -- y sin esa magnitud la cola de revision se atiende por orden de
// llegada en vez de por lo que arriesga. `campos` lo declara, y aqui se cruza con el catalogo
// de verdad.
//
// TODAS las listas de cada fabricante, no solo las que CAMPOS mira: ese mapa esta acotado a
// los campos de dimensionamiento a proposito, y una fuente puede respaldar `eolAnnounced`,
// `psu` o `skus`, que no estan ahi. Nokia va con sus dos listas porque son dos catalogos.
const CATALOGOS = {
  huawei: ['MODELS'], cisco: ['MODELS'], fortinet: ['MODELS'], mikrotik: ['MODELS'],
  aruba: ['MODELS'], juniper: ['MODELS'], nokia: ['MODELS', 'MODELS_ROUTER'],
};

function clavesDe(vendor) {
  const mod = cargar(vendor);
  const claves = new Set();
  if (!mod) return claves;
  for (const lista of (CATALOGOS[vendor] || [])) {
    for (const m of (mod[lista] || [])) for (const k of Object.keys(m)) claves.add(k);
  }
  return claves;
}

// Cuantos modelos traen de verdad cada campo declarado. Sale del catalogo y no de un numero
// escrito a mano, que se quedaria con los modelos de ayer.
function impactoDeFuente(vendor, f) {
  if (!Array.isArray(f.campos)) {
    return {
      declarado: false,
      dominio: f.dominio || null,
      porQue: f.porQue || null,
      campos: [], desconocidos: [], modelos: 0,
    };
  }
  const claves = clavesDe(vendor);
  const mod = cargar(vendor);
  const filas = (CATALOGOS[vendor] || []).flatMap((l) => (mod && mod[l]) || []);
  const desconocidos = f.campos.filter((c) => !claves.has(c));
  // Un modelo cuenta si trae ALGUNO de los campos que esta fuente respalda: es el numero de
  // equipos que se quedan sin respaldo si el documento cambia.
  const modelos = filas.filter((m) => f.campos.some((c) => tieneDato(m[c]))).length;
  return {
    declarado: true, dominio: f.dominio || null, porQue: null,
    campos: f.campos, desconocidos, modelos,
  };
}

// Toda fuente declarada, con su impacto. Lo usa la prueba: un campo inventado es un fallo.
function impactoDeFuentes() {
  const out = [];
  for (const v of vendors) {
    for (const f of fuentesDe(v.code)) {
      out.push({ vendor: v.code, documento: f.documento, url: f.url || null, ...impactoDeFuente(v.code, f) });
    }
  }
  return out;
}

// A partir de cuantas semanas un documento que cambio y nadie ha revisado deja de ser un aviso
// y pasa a romper `npm run verificar`. El umbral existe para que publicar un PDF un martes no
// bloquee trabajo que no tiene nada que ver, y para que aun asi no se pueda ignorar sin
// limite. Cuatro semanas es un mes de margen: el mismo criterio que los seis meses de
// ANTIGUEDAD_AVISO_MESES, lo bastante largo para no ser ruido y lo bastante corto para que no
// se pase una gama entera.
const SEMANAS_TOLERADAS = 4;

// Lo que el vigia vio cambiar y todavia espera a que una persona lo contraste. Se lee del lock
// y NO sale a la red: el informe tiene que poder correrse desde este entorno, donde los seis
// dominios dan 403.
function fuentesPendientes(lock) {
  const declaradas = impactoDeFuentes();
  return pendientesDeRevision(lock).map((f) => {
    const d = declaradas.find((x) => x.vendor === f.vendor && x.url === f.url);
    return {
      ...f,
      vencida: (f.semanas || 0) >= SEMANAS_TOLERADAS,
      impacto: d || null,
    };
  // Primero lo vencido, y dentro de eso lo que mas catalogo deja sin respaldo. Una cola
  // ordenada solo por antiguedad atiende antes un cambio de tres campos que uno de sesenta.
  }).sort((a, b) => (Number(b.vencida) - Number(a.vencida))
    || ((b.impacto ? b.impacto.modelos : 0) - (a.impacto ? a.impacto.modelos : 0))
    || ((b.semanas || 0) - (a.semanas || 0)));
}

/* COBERTURA DEL CONTRASTE — que modulos de public/js/ ejercita de verdad `npm run contraste`.
 *
 * El dato lo MIDE Chromium durante la corrida (`scripts/ayuda/cobertura.js`) y queda en
 * `scripts/contrastes/cobertura.lock.json`. Aqui solo se lee, porque este inventario no abre
 * un navegador.
 *
 * Y POR ESO LLEVA TRES ESTADOS DE VIGENCIA, no dos. Una cobertura medida sobre otro commit
 * sigue leyendose como un hecho de HOY y ya no lo es — el mismo vicio que el lock del vigia
 * curandose solo, y el mismo que obliga a cada caso a declarar su `medidoEn`. Se dice de que
 * commit es y si ese commit es el actual; nunca se calla. */
function coberturaContraste() {
  const ruta = path.join(__dirname, 'contrastes', 'cobertura.lock.json');
  if (!fs.existsSync(ruta)) return { estado: 'nunca medida' };
  let d;
  try { d = JSON.parse(fs.readFileSync(ruta, 'utf8')); }
  catch (e) { return { estado: 'ilegible', detalle: e.message }; }
  let head = null;
  try { head = execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { head = null; }
  const medido = (d.medidoEn || {}).commit || null;
  // `null` en head (sin git) NO es «coincide»: es que no se pudo comprobar. Tercer estado.
  const vigencia = !medido ? 'sin commit declarado'
    : !head ? 'no comprobable aqui'
      : medido === head ? 'del commit actual' : 'de otro commit';
  return { estado: 'medida', vigencia, head, ...d };
}


/* ── COTIZADOR FRENTE A DIMENSIONADOR ──────────────────────────────────────────────────────
   QUE COMPRUEBA. El cotizador describe cada equipo con un texto comercial
   («2.4 Tbps · 405 Mpps · 4 tarjetas 400G») y el dimensionador del mismo fabricante lleva las
   cifras como campos. Son dos sitios con el mismo dato, y nada comprobaba que dijeran lo mismo:
   la revision Huawei del 2026-09-29 encontro el NE8000 M8 con 4,8 Tbps en uno y 2,4 en el
   otro (y una ficha de 2021 con 1,2), y el F8 con 12,8 frente a 6,4. Es la cifra que se pone
   delante de un cliente.

   COMO COMPARA. Se lee cada segmento del texto con una cifra de rendimiento y se casa con el
   campo que cada fabricante declara en `CONTRASTE_COTIZADOR`. «Coincide» es dentro del
   REDONDEO con que el cotizador la escribe: «0.6 Gbps» cubre de 550 a 650 Mbps, asi que los
   570 del dimensionador coinciden; «300 Mbps» solo coincide con 300.

   CINCO ESTADOS, Y NINGUNO SE DEDUCE. `coincide`, `difiere`, `sinDato` (el dimensionador no
   trae ese campo: dice algo del catalogo, no del equipo), `ilegible` (el texto trae una cifra
   que este informe no sabe a que campo corresponde) y `sinPareja` (el modelo del cotizador no
   esta en el dimensionador). Lo que no se sabe leer NUNCA sale como «coincide»: un comprobador
   que no comprueba se porta igual que uno que pasa.

   ES UN INFORME, NO UN FRENO. No dice cual de las dos cifras es la buena —eso lo dice el
   documento del fabricante— y un rojo en cada cambio de catalogo ensenaria a ignorarlo. */
// El casado, la lectura del texto y la comparacion viven en `server/services/cifrasCotizador.js`,
// que es tambien lo que decide que muestra el cotizador: el informe y la pantalla no pueden
// discrepar sobre que es pareja de que.
const {
  CONTRASTE_COTIZADOR, leerSpec, normalizarModelo, contrasteCotizador, mbpsLegible,
  contrastePortal, contrasteGuia,
} = require('../server/services/cifrasCotizador');

/* ── PORTAL Y GUIA FRENTE AL DIMENSIONADOR (2026-10-02) ─────────────────────────────────────
   LO MISMO QUE LA SECCION DEL COTIZADOR, PERO SOBRE LO QUE SIRVE EL SERVIDOR. El portal y la
   guia reciben filas que la siembra FUNDE con las del dimensionador, y es en esa fusion donde se
   perdian cosas que ningun archivo muestra: la capacidad de Nokia llegaba en Gbps a un portal
   que lee Mbps, y «SRX 345» se quedaba sin el IPsec de «SRX345». Por eso aqui no se leen los
   archivos: `scripts/ayuda/pantallas-servidas.js` siembra una base EN MEMORIA con la misma
   `seedCatalog()` del arranque y devuelve lo que sirven `/api/catalog` y `/api/guia/roles`.
   Cuesta unos dos segundos, y si no se puede medir se dice: nunca sale como «coincide».

   En el portal cuenta un sexto estado, `calla`: el dimensionador trae una cifra que el portal no
   da, que en la calculadora es un equipo apartado por un dato que si existe. En la guia, lo que
   difiere ya llega «en revision» —la proyeccion aplica la regla del cotizador— y aqui se cuenta;
   y una alternativa fuera de venta llega retirada. Lo que no tiene pareja en el dimensionador
   (el MX, el QFX, CloudEngine) se lista: son cifras que ninguna pantalla puede contrastar. La
   alternativa que nombra un equipo del dimensionador lleva la cifra de ese equipo, puesta por la
   proyeccion: se cuenta aparte y no como contrastada, porque es la misma copia. */
const { execFileSync } = require('child_process');

function pantallasServidas() {
  try {
    const salida = execFileSync(process.execPath, [path.join(__dirname, 'ayuda', 'pantallas-servidas.js')], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(salida);
  } catch (e) {
    const detalle = String((e && e.stderr) || (e && e.message) || e).trim().split('\n').slice(-3).join(' | ');
    return { error: `no se pudo sembrar la base en memoria: ${detalle}` };
  }
}

function contrastePantallas(servidas) {
  const d = servidas || pantallasServidas();
  if (d.error) return { error: d.error };
  const fuera = new Set((d.fueraDeVenta || []).map((x) => `${x.vendor}::${x.clave}`));
  return {
    portal: contrastePortal(d.portal),
    guia: contrasteGuia(d.guia, { fuera: (vendor, m) => fuera.has(`${vendor}::${normalizarModelo(m.id)}`) }),
  };
}

function informe() {
  return {
    cobertura: cobertura(), cicloDeVida: cicloDeVida(), precios: precios(), contrasteCotizador: contrasteCotizador(),
    coberturaContraste: coberturaContraste(),
    pantallas: pantallas(), procedencia: procedencia(), fuentesPendientes: fuentesPendientes(),
  };
}

function imprimirPantallas(cp) {
  const cifra = (campo, v) => (campo === 'mpps' ? `${v} Mpps` : mbpsLegible(v));
  console.log('\n== PORTAL Y GUIA FRENTE AL DIMENSIONADOR: lo que reciben las pantallas ==');
  console.log('   Medido sobre lo que sirve el servidor (una siembra en memoria), no sobre los archivos:');
  console.log('   la fusion de la siembra es donde el portal perdia las unidades de Nokia y el IPsec del SRX 345.\n');
  if (cp.error) { console.log(`   NO SE PUDO MEDIR: ${cp.error}`); return; }
  for (const f of cp.portal) {
    if (f.error) { console.log(`   ${f.grupo.padEnd(9)} ${f.error}`); continue; }
    console.log(`   portal ${f.grupo.padEnd(9)} ${f.coincide}/${f.comparadas} coinciden · ${f.difiere.length} difieren · ${f.calla.length} callan · ${f.sinDato.length} sin dato · ${f.ilegible.length} no se pudieron leer · ${f.sinPareja.length} sin pareja`);
    for (const x of f.difiere) console.log(`      DIFIERE  ${x.modelo}: portal ${x.campo} «${x.portal}» · dimensionador ${x.destino} = ${cifra(x.destino, x.dimensionador)}`);
    for (const x of f.calla) console.log(`      CALLA    ${x.modelo}: el dimensionador trae ${x.destino} = ${cifra(x.destino, x.dimensionador)} y el portal no lo da`);
    for (const x of f.ilegible) console.log(`      NO SE PUDO LEER  ${x.modelo}: ${x.campo} «${x.texto}»`);
  }
  const g = cp.guia;
  console.log(`\n   guia ${g.entradas} entradas · ${g.coincide}/${g.comparadas} cifras coinciden · ${g.altDelCatalogo} alternativas con la cifra del dimensionador · ${g.enRevision.length} en revision · ${g.altRetiradas.length} alternativas fuera de venta · ${g.altSinCifra.length} huecos sin cifra · ${g.sinDato.length} sin dato · ${g.ilegible.length} no se pudieron leer · ${g.sinFicha.length} sin ficha`);
  for (const x of g.enRevision) console.log(`      EN REVISION  ${x.rol} · ${x.modelo} (${x.donde}${x.alternativa ? ` ${x.alternativa}` : ''}): la guia decia ${x.citado} y el dimensionador ${x.dimensionador}${x.sinRetirar ? ' — Y LA PANTALLA LA SIGUE CITANDO' : ''}`);
  for (const x of g.altRetiradas) console.log(`      FUERA DE VENTA  ${x.rol} · ${x.modelo}: la alternativa ${x.alternativa}${x.sinRetirar ? ' — Y LA PANTALLA LA SIGUE RECOMENDANDO' : ' no se pinta'}`);
  // Un hueco que el dimensionador no puede rellenar (sin pareja, sin ese campo, etiqueta que no
  // se reconoce) sale «sin dato» en pantalla: la alternativa perdio la cifra que daba su motivo.
  for (const x of g.altSinCifra) console.log(`      HUECO SIN CIFRA  ${x.rol} · ${x.modelo}: «${x.alternativa}» (${x.estado})`);
  for (const x of g.ilegible) console.log(`      NO SE PUDO LEER  ${x.rol} · ${x.modelo}: «${x.texto}»`);
  for (const x of g.sinFicha) console.log(`      SIN FICHA  ${x.rol} · ${x.modelo}: la guia lo recomienda sin texto`);
  if (g.fichaSinPareja.length || g.altSinPareja.length) {
    console.log(`   Sin pareja en el dimensionador, asi que no se pueden contrastar (${g.fichaSinPareja.length} fichas, ${g.altSinPareja.length} alternativas):`);
    for (const x of g.fichaSinPareja) console.log(`      ${x.rol} · ${x.modelo}: ${x.cifras.join(', ')}`);
    for (const x of g.altSinPareja) console.log(`      ${x.rol} · alternativa «${x.alternativa}»`);
  }
}

function barra(pct) {
  const llenos = Math.round(pct / 10);
  return `${'#'.repeat(llenos)}${'.'.repeat(10 - llenos)}`;
}

function imprimir(d) {
  if (!SOLO_FUENTES) {
    console.log('\n== COBERTURA DE CAMPOS ==');
    console.log('   Un campo en null significa "el catalogo no trae el dato", no "el equipo no lo tiene".\n');
    for (const f of d.cobertura) {
      if (f.error) { console.log(`${f.vendor.padEnd(10)} ${f.error}`); continue; }
      console.log(`${f.vendor.padEnd(10)} ${String(f.modelos).padStart(3)} modelos`);
      for (const [campo, c] of Object.entries(f.campos)) {
        console.log(`   ${campo.padEnd(8)} ${barra(c.pct)} ${String(c.pct).padStart(3)}%  ${c.con}/${c.de}`);
      }
    }

    console.log('\n== CICLO DE VIDA ==');
    for (const f of d.cicloDeVida) {
      const vencidos = f.vencidos ? `  (${f.vencidos} con la fecha de ultimo pedido ya pasada)` : '';
      console.log(`${f.vendor.padEnd(10)} ${f.eol} fuera de venta, ${f.anunciados} con fin de venta anunciado${vencidos}`);
    }

    console.log('\n== PRECIOS (sobre el catalogo del cotizador) ==');
    for (const f of d.precios) {
      console.log(`${f.vendor.padEnd(10)} ${f.con}/${f.de} con precio, ${f.sinCotizar} sin cotizar`);
    }
    console.log('\n== COTIZADOR FRENTE A DIMENSIONADOR: la misma cifra en dos sitios ==');
    console.log('   Informe, no freno: dice DONDE difieren, no cual es la buena. Coincidir es dentro del redondeo del cotizador.\n');
    for (const f of d.contrasteCotizador) {
      if (f.error) { console.log(`${f.vendor.padEnd(10)} ${f.error}`); continue; }
      console.log(`${f.vendor.padEnd(10)} ${f.coincide}/${f.comparadas} coinciden · ${f.difiere.length} difieren · ${f.sinDato.length} sin dato en el dimensionador · ${f.ilegible.length} no se pudieron leer · ${f.sinPareja.length} sin pareja`);
      for (const x of f.difiere) console.log(`   DIFIERE  ${x.modelo}: cotizador «${x.cotizador}» · dimensionador ${x.campo} = ${x.campo === 'mpps' ? `${x.dimensionador} Mpps` : mbpsLegible(x.dimensionador)}`);
      for (const x of f.ilegible) console.log(`   NO SE PUDO LEER  ${x.modelo}: «${x.texto}»`);
    }
    if (d.contrastePantallas) imprimirPantallas(d.contrastePantallas);
    console.log('\n== PANTALLAS: campos declarados que no existen ==');
    console.log('   Cada dimensionador declara en ESTADO.vincular({campos}) los ids que viajan en el');
    console.log('   enlace compartido. Uno que ya no exista deja de reponerse, y el enlace llega mudo.\n');
    let rotos = 0;
    for (const f of d.pantallas) {
      if (f.error) { rotos++; console.log(`[ERROR] ${f.pagina}  ${f.error}`); continue; }
      const tardios = f.tardios.length ? `  (${f.tardios.length} lo pinta un modulo)` : '';
      if (!f.faltan.length) { console.log(`[ok   ] ${f.pagina.padEnd(38)} ${String(f.campos).padStart(2)} campos${tardios}`); continue; }
      rotos++;
      console.log(`[ROTO ] ${f.pagina.padEnd(38)} ${String(f.campos).padStart(2)} campos${tardios}`);
      for (const x of f.faltan) console.log(`         ${x.id}: ${x.motivo}`);
    }
    console.log(rotos ? `\n${rotos} pantalla(s) con un campo declarado que no existe.` : '\nNinguna pantalla declara un campo que no exista.');

    const cc = d.coberturaContraste;
    console.log('\n== COBERTURA DEL CONTRASTE: que modulos de public/js/ se ejercitan ==');
    console.log('   `npm run contraste` prueba que un refactor no cambia lo que una pantalla');
    console.log('   recomienda. Esto dice sobre QUE modulos vale esa prueba — medido por el');
    console.log('   navegador durante la corrida, no declarado por cada caso.\n');
    if (cc.estado === 'nunca medida') {
      console.log('   Nunca medida. Corre `npm run contraste -- --todos` y vuelve a mirar.');
    } else if (cc.estado === 'ilegible') {
      console.log(`   El informe existe pero no se pudo leer: ${cc.detalle}`);
    } else {
      const m = cc.medidoEn || {};
      console.log(`   Medida el ${m.fecha || '(sin fecha)'} sobre ${m.commit || '(sin commit)'} — ${cc.vigencia}.`);
      if (cc.vigencia === 'de otro commit') {
        console.log(`   HEAD es ${cc.head}: estas cifras pueden estar desfasadas.`);
      }
      const sin = cc.modulos.filter((x) => x.estado === 'sin conducir');
      const roz = cc.modulos.filter((x) => x.estado === 'rozado');
      console.log('');
      for (const x of sin) console.log(`   [sin conducir] ${x.modulo}`);
      for (const x of roz) console.log(`   [rozado  ${String(x.pct).padStart(3)}%] ${x.modulo}  (${x.usadas}/${x.total} funciones)`);
      const ok = cc.modulos.length - sin.length - roz.length;
      console.log(`\n   ${sin.length} sin conducir · ${roz.length} rozado(s) bajo el ${cc.umbralRozado}% · ${ok} ejercitado(s).`);
      console.log('   «Sin conducir» NO es 0%: es que ninguna pantalla de ningun caso lo carga.');
    }
  }

  console.log('\n== PROCEDENCIA ==');
  console.log(`   Se avisa a partir de ${ANTIGUEDAD_AVISO_MESES} meses. "sin fecha" no es "reciente".\n`);
  let piden = 0;
  for (const v of d.procedencia) {
    console.log(`${v.vendor}`);
    for (const f of v.fuentes) {
      if (f.estado !== 'vigente') piden++;
      const edad = f.meses === null ? 'sin fecha' : `${f.meses} mes(es)`;
      console.log(`   [${f.estado.padEnd(9)}] ${f.documento}  ·  ${edad}`);
    }
  }
  console.log(`\n${piden} fuente(s) piden revision.\n`);

  console.log('== FUENTES QUE CAMBIARON Y NADIE HA CONTRASTADO ==');
  console.log('   El vigia las vio cambiar; el catalogo sigue verificado contra la version anterior.');
  console.log(`   A las ${SEMANAS_TOLERADAS} semanas dejan de ser un aviso y rompen npm run verificar.\n`);
  if (!d.fuentesPendientes.length) {
    console.log('   Ninguna. (No es lo mismo que "todas leidas": las inalcanzables salen arriba.)\n');
  } else {
    for (const f of d.fuentesPendientes) {
      console.log(`[${f.vencida ? 'VENCIDA' : ' aviso '}] ${f.vendor.padEnd(9)} ${f.documento}  ·  ${f.semanas} semana(s)`);
      console.log(`          verificado ${f.hashVerificado.slice(0, 12)} (${f.bytesVerificado} B) -> visto ${f.hashVisto.slice(0, 12)} (${f.bytesVisto} B)`);
      const im = f.impacto;
      if (im && im.declarado) {
        console.log(`          respalda ${im.campos.join(', ')} · ${im.modelos} modelo(s) con alguno de esos campos`);
      } else if (im && im.dominio === 'precio') {
        console.log('          precios: viven en cotizadorCatalog.js, no en el catálogo de modelos');
      } else {
        console.log(`          radio de impacto sin declarar${im && im.porQue ? `: ${im.porQue}` : ''}`);
      }
      console.log(`          npm run vigia -- --revisado ${f.vendor} ${f.url}`);
    }
    console.log('');
  }
}

if (require.main === module) {
  const d = informe();
  if (!SOLO_FUENTES) d.contrastePantallas = contrastePantallas();
  if (JSON_OUT) console.log(JSON.stringify(d, null, 2));
  else imprimir(d);
}

module.exports = {
  informe, cobertura, cicloDeVida, precios, pantallas, procedencia,
  contrasteCotizador, leerSpec, normalizarModelo, CONTRASTE_COTIZADOR,
  pantallasServidas, contrastePantallas,
  fuentesPendientes, SEMANAS_TOLERADAS, impactoDeFuentes, clavesDe,
};
