'use strict';
/* Las cifras de rendimiento del cotizador frente a las del dimensionador.

   POR QUE EXISTE. El cotizador lleva un texto comercial por equipo («5 Gbps FWD · IPsec 2.5
   Gbps · 6 GE + 1 NIM + 1 SM») y el dimensionador del mismo fabricante lleva la cifra con la
   que DIMENSIONA ese equipo. Son el mismo dato en dos sitios, y el 2026-09-30 `npm run
   catalogo` midio 20 diferencias: 14 en Cisco, 3 en Huawei y 3 en Juniper. La que llega al
   cliente es la del cotizador; la que eligio el equipo es la del dimensionador. Una cotizacion
   no puede citar una capacidad distinta de la que se uso para elegir lo que cotiza.

   UN SOLO MODULO PARA EL INFORME Y PARA LA PANTALLA. `npm run catalogo` lo usa para contar
   las diferencias y `catalogProjection.toCotizadorCatalog()` para decidir que se muestra.
   Si cada uno casara los modelos o leyera las cifras a su manera, el informe podria decir
   «coincide» de un equipo que la pantalla trata como distinto — es como `llevarABom` acabo
   en seis copias que no hacian lo mismo.

   LA REGLA DE LA PANTALLA (`proyectarFila`), segmento a segmento del texto:
     - coincide (dentro del redondeo con que el cotizador la escribe): se muestra tal cual. Es
       la cifra del dimensionador, redondeada, comprobada en cada peticion.
     - difiere: NO se muestra ninguna de las dos. El segmento pasa a «FWD en revision» y la
       fila lleva `enRevision` con las dos cifras. Tomar la del dimensionador sin mas era la
       propuesta, y tiene un riesgo medido: el NE8000 M8 del dimensionador trae exactamente las
       cifras del F1A (2,4 Tbps y 453 Mpps), que huele a fila copiada, y propagarla a la
       cotizacion la pondria delante de un cliente. Quedarse con la del cotizador tiene el
       riesgo contrario. La que manda la dice el documento del fabricante, y hasta que alguien
       lo lea no se cita ninguna.
     - sin dato en el dimensionador, o un segmento que no se sabe leer: tal cual. No hay con
       que contrastarlo, y eso lo cuenta el informe, no la pantalla.
   Se resuelve en un commit con diff: se corrige la cifra que el documento desmiente y se
   alinea la otra. Asi se cerraron las 14 de Cisco el 2026-10-01, con sus fichas oficiales.

   CINCO ESTADOS, Y NINGUNO SE DEDUCE: `coincide`, `difiere`, `sinDato` (el dimensionador no
   trae ese campo), `ilegible` (cifra que este modulo no sabe a que campo corresponde) y
   `sinPareja` (el modelo del cotizador no esta en el dimensionador). Lo que no se sabe leer
   NUNCA cuenta como «coincide». */

const CONTRASTE_COTIZADOR = {
  huawei: { mod: 'huawei', listas: ['MODELS'], campos: { FWD: 'fwd', IPsec: 'ipsec', 'SD-WAN': 'typ', BASE: 'cap', Mpps: 'mpps' } },
  cisco: { mod: 'cisco', listas: ['MODELS'], campos: { FWD: 'fwd', IPsec: 'ipsec', 'SD-WAN': 'sdwan' } },
  fortinet: { mod: 'fortinet', listas: ['MODELS'], campos: { FW: 'fw', NGFW: 'ngfw', IPsec: 'vpn' } },
  mikrotik: { mod: 'mikrotik', listas: ['MODELS'], campos: { FWD: 'fwd', IPsec: 'ipsec' } },
  juniper: { mod: 'juniper', listas: ['MODELS'], campos: { FW: 'fw', IPsec: 'vpn' } },
  aruba: { mod: 'aruba', listas: ['MODELS'], campos: { WAN_MIN: 'wanMin', WAN_MAX: 'wanMax', FW: 'fw' } },
  // Nokia guarda la capacidad en Gbps (ver `legacyData/nokia.js`), no en Mbps.
  nokia: { mod: 'nokia', listas: ['MODELS', 'MODELS_ROUTER'], campos: { BASE: 'cap' }, escala: { cap: 1000 } },
};
const UNIDAD_MBPS = { Mbps: 1, Gbps: 1000, Tbps: 1e6 };

// Como se rotula en pantalla un segmento retirado. `BASE` es la cifra sin etiqueta («2.4 Tbps»),
// que en Huawei y Nokia es la capacidad del chasis.
const ROTULO = { FWD: 'FWD', BASE: 'Capacidad', Mpps: 'Mpps', FW: 'FW', NGFW: 'NGFW', IPsec: 'IPsec', 'SD-WAN': 'SD-WAN', WAN_MIN: 'WAN', WAN_MAX: 'WAN' };

function cargarDefecto(nombre) {
  try {
    return require(`../seed/legacyData/${nombre}`);
  } catch {
    return null;
  }
}

// La coma es separador de miles y el punto decimal, como en todo el catalogo.
function cifraCotizador(txt, unidad) {
  const limpio = String(txt).replace(/,/g, '');
  const dec = (limpio.split('.')[1] || '').length;
  const f = unidad ? UNIDAD_MBPS[unidad] : 1;
  return { valor: Number(limpio) * f, tolerancia: 0.5 * Math.pow(10, -dec) * f };
}

// `segmento` es la posicion del trozo en el texto partido por «·»: es lo que permite a la
// pantalla retirar exactamente ese trozo y dejar intactos los puertos y las funciones.
function leerSpec(spec) {
  const cifras = [];
  const ilegibles = [];
  const N = '([\\d.,]+)\\s*(Mbps|Gbps|Tbps)';
  String(spec || '').split('·').forEach((crudo, segmento) => {
    const seg = crudo.trim();
    let m = seg.match(/^([\d.,]+)\s*Mpps$/);
    if (m) { cifras.push({ etiqueta: 'Mpps', texto: seg, segmento, ...cifraCotizador(m[1], null) }); return; }
    if (!/\b(Mbps|Gbps|Tbps)\b/.test(seg)) return; // puertos, funciones, SKU: no es una cifra de rendimiento
    if ((m = seg.match(new RegExp(`^WAN\\s+${N}\\s*-\\s*${N}$`)))) {
      cifras.push({ etiqueta: 'WAN_MIN', texto: seg, segmento, ...cifraCotizador(m[1], m[2]) });
      cifras.push({ etiqueta: 'WAN_MAX', texto: seg, segmento, ...cifraCotizador(m[3], m[4]) });
    } else if ((m = seg.match(new RegExp(`^WAN hasta\\s+${N}$`)))) {
      cifras.push({ etiqueta: 'WAN_MAX', texto: seg, segmento, ...cifraCotizador(m[1], m[2]) });
    } else if ((m = seg.match(new RegExp(`^(FW|NGFW|IPsec|SD-WAN)\\s+${N}$`)))) {
      cifras.push({ etiqueta: m[1], texto: seg, segmento, ...cifraCotizador(m[2], m[3]) });
    } else if ((m = seg.match(new RegExp(`^${N}(?:\\s+(FWD))?$`)))) {
      cifras.push({ etiqueta: m[3] ? 'FWD' : 'BASE', texto: seg, segmento, ...cifraCotizador(m[1], m[2]) });
    } else {
      ilegibles.push(seg);
    }
  });
  return { cifras, ilegibles };
}

const PREFIJO_FABRICANTE = /^(juniper|aruba|netengine|cisco|fortinet|mikrotik|nokia|huawei)/;
// La misma normalizacion que `BOM.normalizar` usa para el traspaso al cotizador: sin
// separadores y sin prefijo de fabricante, asi «Juniper SRX 1500» y «SRX1500» son el mismo.
function normalizarModelo(nombre) {
  const s = String(nombre || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return s.replace(PREFIJO_FABRICANTE, '') || s;
}

// Un indice por fabricante: nombre normalizado -> modelo del dimensionador.
function indiceDimensionador(opciones) {
  const o = opciones || {};
  const cargar = o.cargar || cargarDefecto;
  const mapa = o.mapa || CONTRASTE_COTIZADOR;
  const out = {};
  for (const [vendor, cfg] of Object.entries(mapa)) {
    const mod = cargar(cfg.mod);
    if (!mod) { out[vendor] = null; continue; }
    const porNombre = new Map();
    for (const l of cfg.listas) for (const m of mod[l] || []) porNombre.set(normalizarModelo(m.id), m);
    out[vendor] = porNombre;
  }
  return out;
}

// Cada cifra del texto con su estado frente al modelo del dimensionador.
function contrastarFila(spec, m, cfg) {
  const { cifras, ilegibles } = leerSpec(spec);
  const out = ilegibles.map((texto) => ({ estado: 'ilegible', texto }));
  for (const c of cifras) {
    const campo = cfg.campos[c.etiqueta];
    if (!campo) { out.push({ ...c, estado: 'ilegible' }); continue; }
    const bruto = m[campo];
    if (bruto === null || bruto === undefined || typeof bruto !== 'number') {
      out.push({ ...c, campo, estado: 'sinDato' });
      continue;
    }
    const dim = bruto * ((cfg.escala && cfg.escala[campo]) || 1);
    out.push({ ...c, campo, dimensionador: dim, estado: Math.abs(dim - c.valor) <= c.tolerancia ? 'coincide' : 'difiere' });
  }
  return out;
}

function mbpsLegible(v) {
  if (v >= 1e6) return `${+(v / 1e6).toFixed(2)} Tbps`;
  if (v >= 1000) return `${+(v / 1000).toFixed(2)} Gbps`;
  return `${v} Mbps`;
}

// El texto que ve el cliente. Devuelve el mismo texto si no hay nada en disputa.
function proyectarFila(spec, m, cfg) {
  if (!m || !cfg || !spec) return { spec, enRevision: [] };
  const estados = contrastarFila(spec, m, cfg).filter((e) => e.estado === 'difiere');
  if (!estados.length) return { spec, enRevision: [] };
  const segmentos = String(spec).split('·');
  const enRevision = [];
  const retirados = new Set();
  for (const e of estados) {
    enRevision.push({
      campo: e.campo, cotizador: e.texto,
      dimensionador: e.etiqueta === 'Mpps' ? `${e.dimensionador} Mpps` : mbpsLegible(e.dimensionador),
    });
    if (retirados.has(e.segmento)) continue;
    retirados.add(e.segmento);
    const crudo = segmentos[e.segmento];
    const lead = crudo.match(/^\s*/)[0];
    const trail = crudo.match(/\s*$/)[0];
    segmentos[e.segmento] = `${lead}${ROTULO[e.etiqueta] || e.etiqueta} en revisión${trail}`;
  }
  return { spec: segmentos.join('·'), enRevision };
}

// El informe de `npm run catalogo`: lo mismo, contado por fabricante.
function contrasteCotizador(opciones) {
  const o = opciones || {};
  const filas = o.cotizador || require('../seed/legacyData/cotizadorCatalog');
  const mapa = o.mapa || CONTRASTE_COTIZADOR;
  const indice = indiceDimensionador({ cargar: o.cargar, mapa });
  const out = [];
  for (const [vendor, cfg] of Object.entries(mapa)) {
    const r = { vendor, comparadas: 0, coincide: 0, difiere: [], sinDato: [], ilegible: [], sinPareja: [] };
    const porNombre = indice[vendor];
    if (!porNombre) { r.error = 'no se pudo cargar el catalogo del dimensionador'; out.push(r); continue; }
    for (const row of filas.filter((x) => String(x.vendor || '').toLowerCase() === vendor)) {
      const m = porNombre.get(normalizarModelo(row.model));
      if (!m) { r.sinPareja.push(row.model); continue; }
      for (const e of contrastarFila(row.spec, m, cfg)) {
        if (e.estado === 'ilegible') r.ilegible.push({ modelo: row.model, texto: e.texto });
        else if (e.estado === 'sinDato') r.sinDato.push({ modelo: row.model, campo: e.campo, cotizador: e.texto });
        else {
          r.comparadas++;
          if (e.estado === 'coincide') r.coincide++;
          else r.difiere.push({ modelo: row.model, campo: e.campo, cotizador: e.texto, dimensionador: e.dimensionador });
        }
      }
    }
    out.push(r);
  }
  return out;
}

module.exports = {
  CONTRASTE_COTIZADOR, leerSpec, normalizarModelo, indiceDimensionador,
  contrastarFila, proyectarFila, contrasteCotizador, mbpsLegible,
};
