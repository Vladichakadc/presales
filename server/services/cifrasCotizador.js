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
  // Los Session Smart Router (lista SDWAN) se citan sin etiqueta («1.5 Gbps · SD-WAN sin
  // túneles»): esa cifra es su `cap`, el caudal SD-WAN con el que se dimensionan. Hasta el
  // 2026-10-02 la lista no estaba aquí y sus cinco líneas salían «sin pareja».
  juniper: { mod: 'juniper', listas: ['MODELS', 'SDWAN'], campos: { FW: 'fw', IPsec: 'vpn', BASE: 'cap' } },
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

/* ── EL PORTAL Y LA GUIA, FRENTE AL DIMENSIONADOR (2026-10-02) ───────────────────────────────
   POR QUE. El cotizador no es la unica pantalla que cita cifras: el portal (la calculadora y el
   comparador leen `/api/catalog`) y la guia de diseno (`/api/guia/roles`) tambien. Y aqui no
   basta con leer los archivos: lo que recibe cada pantalla sale de la SIEMBRA, que funde la fila
   del portal con la del dimensionador del mismo equipo. Medido el 2026-10-02 sobre la API:
     - la fusion dejaba la capacidad de Nokia en Gbps —como la guarda `legacyData/nokia.js`—
       donde todo el portal lee Mbps, y la calculadora trataba un 7250 IXR-e de 300 Gbps como
       uno de 300 Mbps;
     - «SRX 345» no casaba con «SRX345», asi que el portal no tenia su IPsec ni su IPS y la
       calculadora lo apartaba diciendo que el catalogo no publica esas cifras.
   Ninguna de las dos se ve en `indexPR.js`, que dice «300 Gbps» y tiene razon. Por eso
   `contrastePortal` y `contrasteGuia` reciben LO QUE SIRVE EL SERVIDOR, no los archivos.

   EN EL PORTAL, SEIS ESTADOS: los cinco del cotizador mas `calla` —el dimensionador trae una
   cifra que el portal no da—, que en la calculadora es un equipo apartado por un dato que si
   existe. EN LA GUIA, la ficha se lee como el texto del cotizador, y la alternativa
   («NE8000 M14 (7.2 Tbps)») cita la cifra de OTRO equipo, que tambien se casa y se contrasta.
   Una alternativa fuera de venta tiene estado propio: la guia promete equipos activos.

   Y DESDE EL 2026-10-02 LA ALTERNATIVA NO COPIA ESA CIFRA: si nombra un equipo del dimensionador,
   escribe un hueco —`{cifra}` para la de portada, `{cifra FW}` para la de esa etiqueta— y la
   proyeccion lo rellena con la del dimensionador (`rellenarHueco`). Era la ultima copia de una
   cifra del dimensionador en `guiaRoles.js`: treinta alternativas que habia que corregir a mano
   con cada ficha, como la del NE8000 M14 ese mismo dia. Una alternativa SIN pareja (el MX, el QFX,
   CloudEngine) conserva su cifra escrita, porque no hay otra. */

// Unidades. Todo el portal lee un numero como Mbps (calculadora y comparador); el
// dimensionador de Nokia guarda la capacidad en Gbps. `escala` es el unico sitio que lo sabe.
function aMbps(vendor, campo, valor) {
  const cfg = CONTRASTE_COTIZADOR[vendor];
  const f = (cfg && cfg.escala && cfg.escala[campo]) || 1;
  return typeof valor === 'number' ? valor * f : valor;
}

// Que campo del dimensionador respalda cada cifra que el portal entrega, grupo por grupo. Una
// lista es «el primero que el modelo traiga»: la cifra de portada de Aruba es el techo WAN en
// un EdgeConnect y el firewall en un gateway; la de Juniper, el firewall de un SRX y el caudal
// de un Session Smart Router.
const CONTRASTE_PORTAL = {
  hw_ar: { vendor: 'huawei', campos: { fwd: 'fwd', ipsec: 'ipsec', sdwan: 'typ' } },
  hw_wan: { vendor: 'huawei', campos: { cap: 'cap', mpps: 'mpps' } },
  cisco: { vendor: 'cisco', campos: { fwd: 'fwd', ipsec: 'ipsec', sdwan: 'sdwan', cap: 'fwd' } },
  nokia: { vendor: 'nokia', campos: { cap: 'cap' } },
  fortinet: { vendor: 'fortinet', campos: { fw: 'fw', ips: 'ips', ngfw: 'ngfw', tp: 'tp', ssl: 'ssl', vpn: 'vpn' } },
  juniper: { vendor: 'juniper', campos: { cap: ['fw', 'cap'], fw: 'fw', vpn: 'vpn', ips: 'ips', atp: 'atp' } },
  mikrotik: { vendor: 'mikrotik', campos: { fwd: 'fwd', ipsec: 'ipsec' } },
  aruba: { vendor: 'aruba', campos: { fwd: ['wanMax', 'fw'], fw: 'fw', wanMax: 'wanMax' } },
};

// Una cifra del portal tal como la leen la calculadora y el comparador: un numero son Mbps
// (Mpps en `mpps`) y un texto se lee por su unidad («5 Gbps FW»). Cero, vacio y los textos sin
// un digito («—», «Sí», «N/A») son la forma en que el portal dice que no la da.
function sinCifra(v) {
  return v === null || v === undefined || v === 0 || (typeof v === 'string' && !/\d/.test(v));
}
function cifraPortal(v) {
  if (typeof v === 'number') {
    const dec = (String(v).split('.')[1] || '').length;
    return { valor: v, tolerancia: 0.5 * Math.pow(10, -dec) };
  }
  const m = String(v).trim().match(/^([\d.,]+)\s*(Mbps|Gbps|Tbps)\b/);
  return m ? cifraCotizador(m[1], m[2]) : null;
}

// `portal` es la respuesta de `/api/catalog` (o `toIndexPR()`).
function contrastePortal(portal, opciones) {
  const o = opciones || {};
  const indice = o.indice || indiceDimensionador({ cargar: o.cargar });
  const mapa = o.mapa || CONTRASTE_PORTAL;
  const out = [];
  for (const [grupo, cfg] of Object.entries(mapa)) {
    const r = { grupo, vendor: cfg.vendor, comparadas: 0, coincide: 0, difiere: [], sinDato: [], ilegible: [], calla: [], sinPareja: [] };
    const porNombre = indice[cfg.vendor];
    if (!porNombre) { r.error = 'no se pudo cargar el catalogo del dimensionador'; out.push(r); continue; }
    for (const fila of (portal && portal[grupo]) || []) {
      const m = porNombre.get(normalizarModelo(fila.model));
      if (!m) { r.sinPareja.push(fila.model); continue; }
      // Se agrupa por campo del DIMENSIONADOR: un dato que el portal da en algun campo no esta
      // callado aunque otro campo que podria llevarlo venga vacio (el Gateway 9106 de Aruba
      // trae `fwd: 0` y `fw: 10000`, y la calculadora lee `fw`).
      const porDestino = new Map();
      for (const [campo, d] of Object.entries(cfg.campos)) {
        const destino = Array.isArray(d) ? (d.find((c) => typeof m[c] === 'number') || d[0]) : d;
        if (!porDestino.has(destino)) porDestino.set(destino, []);
        porDestino.get(destino).push(campo);
      }
      for (const [destino, campos] of porDestino) {
        const dim = typeof m[destino] === 'number' ? aMbps(cfg.vendor, destino, m[destino]) : null;
        let cita = false;
        for (const campo of campos) {
          const v = fila[campo];
          if (sinCifra(v)) continue;
          cita = true;
          const c = cifraPortal(v);
          if (!c) { r.ilegible.push({ modelo: fila.model, campo, texto: String(v) }); continue; }
          if (dim === null) { r.sinDato.push({ modelo: fila.model, campo, destino, portal: v }); continue; }
          r.comparadas++;
          if (Math.abs(dim - c.valor) <= c.tolerancia) r.coincide++;
          else r.difiere.push({ modelo: fila.model, campo, destino, portal: v, dimensionador: dim });
        }
        if (!cita && dim !== null) r.calla.push({ modelo: fila.model, destino, dimensionador: dim });
      }
    }
    out.push(r);
  }
  return out;
}

// La cifra sin etiqueta de una alternativa es la de portada de cada fabricante. Se toma el
// primer campo que traiga el modelo, asi un AR y un NE8000 de Huawei se leen cada uno con el suyo.
const PORTADA = {
  huawei: ['cap', 'fwd'], cisco: ['fwd'], fortinet: ['fw'], juniper: ['fw', 'cap'],
  mikrotik: ['fwd'], aruba: ['wanMax', 'fw'], nokia: ['cap'],
};
// Una etiqueta tras la cifra («80 Gbps FW», «29 Gbps NGFW») dice que campo es, con el mapa del
// cotizador de cada fabricante. «WAN» es la cifra de portada de EdgeConnect, y una palabra en
// minusculas («2.4 Tbps modular») es prosa, no etiqueta. Una etiqueta que no se reconoce no se
// adivina: la alternativa queda «ilegible».
const CAMPO_ETIQUETA = { FW: 'fw', FWD: 'fwd' };
const ETIQUETA_PORTADA = new Set(['WAN']);
const ROTULO_CAMPO = { cap: 'capacidad', fwd: 'FWD', fw: 'FW', wanMax: 'WAN', ngfw: 'NGFW', vpn: 'IPsec', ipsec: 'IPsec', typ: 'SD-WAN', sdwan: 'SD-WAN' };

// El hueco de una alternativa: `{cifra}` o `{cifra ETIQUETA}`, con las etiquetas de las cifras
// escritas («FW», «FWD», «NGFW», «WAN»).
const HUECO = /\{cifra(?:\s+([A-Za-z][\w-]*))?\}/;

// «<modelo> (<cifra>[ <etiqueta>][ resto])[ resto]». El modelo es el prefijo MAS LARGO del texto
// anterior al parentesis que casa con un equipo del fabricante: el catalogo es un conjunto
// cerrado, asi que no hace falta adivinar donde acaba el nombre. Solo se lee la primera
// alternativa —en «RB4011iGS+ (5.6 Gbps) o RB5009UPr+ con PoE-out» se contrasta el RB4011—, y la
// cifra cuenta solo si va pegada al modelo. Lo mismo vale para el hueco: `pegado` dice si abre el
// parentesis del modelo, que es lo unico que permite saber de que equipo es la cifra.
function leerAlternativa(alt, porNombre) {
  const texto = String(alt || '');
  const abre = texto.indexOf('(');
  const cabeza = (abre >= 0 ? texto.slice(0, abre) : texto).trim();
  const palabras = cabeza.split(/\s+/).filter(Boolean);
  let modelo = null;
  let pareja = null;
  for (let n = palabras.length; n > 0 && !pareja; n--) {
    const candidato = palabras.slice(0, n).join(' ');
    const m = porNombre ? porNombre.get(normalizarModelo(candidato)) : null;
    if (m) { modelo = candidato; pareja = m; }
  }
  let hueco = null;
  const h = texto.match(HUECO);
  if (h) {
    hueco = {
      etiqueta: h[1] || null, inicio: h.index, fin: h.index + h[0].length,
      pegado: abre >= 0 && h.index > abre && !texto.slice(abre + 1, h.index).trim() && (!modelo || modelo === cabeza),
    };
  }
  let cifra = null;
  if (abre >= 0 && (!modelo || modelo === cabeza)) {
    const resto = texto.slice(abre + 1);
    const c = resto.match(/^\s*([\d.,]+)\s*(Mbps|Gbps|Tbps)/);
    if (c) {
      const blanco = c[0].length - c[0].trimStart().length;
      const tras = resto.slice(c[0].length).match(/^\s+([A-Za-z][\w-]*)/);
      cifra = {
        texto: c[0].trim(), unidad: c[2],
        etiqueta: tras ? tras[1] : null,
        inicio: abre + 1 + blanco,
        finCifra: abre + 1 + c[0].length,
        finEtiqueta: abre + 1 + c[0].length + (tras ? tras[0].length : 0),
        ...cifraCotizador(c[1], c[2]),
      };
    }
  }
  return { modelo, pareja, cifra, hueco, cabeza };
}

// Los campos del dimensionador que nombra una etiqueta: la del mapa del cotizador de ese
// fabricante, la de portada si no hay etiqueta (o es «WAN»), y `null` si no se reconoce.
function candidatosDeEtiqueta(etiqueta, vendor) {
  const mapa = (CONTRASTE_COTIZADOR[vendor] || {}).campos || {};
  if (etiqueta && (mapa[etiqueta] || CAMPO_ETIQUETA[etiqueta])) return [mapa[etiqueta] || CAMPO_ETIQUETA[etiqueta]];
  if (!etiqueta || ETIQUETA_PORTADA.has(etiqueta)) return PORTADA[vendor] || [];
  return null;
}

// Que campo nombra la cifra de una alternativa, y hasta donde llega el texto que la cita.
function campoDeCifra(cifra, vendor) {
  const e = cifra.etiqueta;
  const prosa = Boolean(e) && /^[a-z]/.test(e);
  const candidatos = candidatosDeEtiqueta(prosa ? null : e, vendor);
  if (!candidatos) return null;
  const conEtiqueta = Boolean(e) && !prosa;
  return {
    candidatos,
    texto: conEtiqueta ? `${cifra.texto} ${e}` : cifra.texto,
    fin: conEtiqueta ? cifra.finEtiqueta : cifra.finCifra,
  };
}

// La cifra de un equipo del dimensionador como la escribe la guia: «39 Gbps», «7.2 Tbps».
function textoCifra(vendor, campo, valor) {
  return campo === 'mpps' ? `${valor} Mpps` : mbpsLegible(aMbps(vendor, campo, valor));
}

// El hueco relleno con la cifra del dimensionador. Si no se puede —el modelo no tiene pareja, la
// etiqueta no se reconoce, el hueco no va pegado al modelo o el equipo no trae ese campo— dice
// «sin dato» en su lugar: un hueco nunca llega a la pantalla, y lo que no hay no se inventa.
// `estado` cuenta cual de los casos fue (`catalogo` es el relleno), para el informe y las pruebas.
function rellenarHueco(a, vendor) {
  const { etiqueta, pegado } = a.hueco;
  const candidatos = pegado ? candidatosDeEtiqueta(etiqueta, vendor) : null;
  let estado = 'catalogo';
  let campo = null;
  if (!a.pareja) estado = 'sinPareja';
  else if (!candidatos) estado = 'ilegible';
  else {
    campo = candidatos.find((c) => typeof a.pareja[c] === 'number') || null;
    if (!campo) estado = 'sinDato';
  }
  const cifra = estado === 'catalogo'
    ? `${textoCifra(vendor, campo, a.pareja[campo])}${etiqueta && campo !== 'mpps' ? ` ${etiqueta}` : ''}`
    : `${etiqueta || 'cifra'} sin dato`;
  const texto = String(a.texto);
  return {
    alt: `${texto.slice(0, a.hueco.inicio)}${cifra}${texto.slice(a.hueco.fin)}`,
    // Sin pareja no se sabe que campo seria: la portada de un AR y la de un NE8000 son distintas.
    altCifra: { modelo: a.modelo || a.cabeza, campo: campo || (a.pareja && candidatos ? candidatos[0] : null), estado },
  };
}

// El estado de la alternativa de una entrada de la guia. `fuera(m)` dice si el modelo del
// dimensionador esta fuera de venta: es la regla de `ficha.js`, que la proyeccion aplica, y va
// antes que el hueco porque una alternativa fuera de venta no se pinta con ninguna cifra.
function contrastarAlternativa(alt, vendor, porNombre, fuera) {
  const a = { ...leerAlternativa(alt, porNombre), texto: String(alt || '') };
  if (a.pareja && fuera && fuera(a.pareja)) return { ...a, estado: 'fueraDeVenta' };
  if (a.hueco) return { ...a, estado: 'hueco' };
  if (!a.pareja) return { ...a, estado: a.cifra ? 'sinPareja' : 'sinCifra' };
  if (!a.cifra) return { ...a, estado: 'sinCifra' };
  const lectura = campoDeCifra(a.cifra, vendor);
  if (!lectura) return { ...a, estado: 'ilegible' };
  const cifra = { ...a.cifra, texto: lectura.texto, fin: lectura.fin };
  const campo = lectura.candidatos.find((c) => typeof a.pareja[c] === 'number');
  if (!campo) return { ...a, cifra, campo: lectura.candidatos[0], estado: 'sinDato' };
  const dim = aMbps(vendor, campo, a.pareja[campo]);
  return { ...a, cifra, campo, dimensionador: dim, estado: Math.abs(dim - cifra.valor) <= cifra.tolerancia ? 'coincide' : 'difiere' };
}

// Lo que pinta la guia, con la regla del cotizador: una cifra en disputa no se cita —ni la de
// la ficha ni la de la alternativa— y una alternativa fuera de venta no se recomienda. Lo que
// se retira queda dicho en `enRevision` y `altRetirada`, para la pantalla y para el informe; y
// una alternativa con hueco sale con la cifra del dimensionador, dicho en `altCifra`.
function proyectarGuia(entrada, ctx) {
  const { vendor, pareja, porNombre, fuera } = ctx || {};
  const ficha = proyectarFila(entrada.spec, pareja, CONTRASTE_COTIZADOR[vendor]);
  const enRevision = ficha.enRevision.map((r) => ({ donde: 'ficha', campo: r.campo, citado: r.cotizador, dimensionador: r.dimensionador }));
  let alt = entrada.alt || '';
  let altRetirada = null;
  let altCifra = null;
  const a = contrastarAlternativa(alt, vendor, porNombre, fuera);
  if (a.estado === 'fueraDeVenta') {
    altRetirada = { modelo: a.modelo, motivo: 'fuera de venta' };
    alt = '';
  } else if (a.estado === 'hueco') {
    ({ alt, altCifra } = rellenarHueco(a, vendor));
  } else if (a.estado === 'difiere') {
    enRevision.push({ donde: 'alternativa', modelo: a.modelo, campo: a.campo, citado: a.cifra.texto, dimensionador: mbpsLegible(a.dimensionador) });
    alt = `${alt.slice(0, a.cifra.inicio)}${ROTULO_CAMPO[a.campo] || a.campo} en revisión${alt.slice(a.cifra.fin)}`;
  }
  return { spec: ficha.spec, alt, enRevision, altRetirada, altCifra };
}

// `guia` es la respuesta de `/api/guia/roles` (o `toGuiaRoles()`), donde la proyeccion ya
// aplico la regla: lo que difiere llega como «en revision» con su explicacion, y una
// alternativa fuera de venta llega retirada. Se cuenta lo que se contrasto y lo que no se pudo.
function contrasteGuia(guia, opciones) {
  const o = opciones || {};
  const indice = o.indice || indiceDimensionador({ cargar: o.cargar });
  const r = {
    entradas: 0, comparadas: 0, coincide: 0, enRevision: [], sinDato: [], ilegible: [],
    fichaSinPareja: [], altSinPareja: [], altRetiradas: [], sinFicha: [],
    altDelCatalogo: 0, altSinCifra: [],
  };
  for (const [rol, lista] of Object.entries(guia || {})) {
    for (const e of lista) {
      r.entradas++;
      const vendor = String(e.v || '').toLowerCase();
      const porNombre = indice[vendor] || null;
      const pareja = porNombre ? porNombre.get(normalizarModelo(e.model)) : null;
      if (!String(e.spec || '').trim()) r.sinFicha.push({ rol, modelo: e.model });
      for (const x of e.enRevision || []) {
        r.enRevision.push({ rol, modelo: e.model, donde: x.donde, alternativa: x.modelo || null, campo: x.campo, citado: x.citado, dimensionador: x.dimensionador });
      }
      if (e.altRetirada) r.altRetiradas.push({ rol, modelo: e.model, alternativa: e.altRetirada.modelo, motivo: e.altRetirada.motivo });
      if (pareja) {
        for (const c of contrastarFila(e.spec, pareja, CONTRASTE_COTIZADOR[vendor])) {
          if (c.estado === 'ilegible') r.ilegible.push({ rol, modelo: e.model, texto: c.texto });
          else if (c.estado === 'sinDato') r.sinDato.push({ rol, modelo: e.model, campo: c.campo, citado: c.texto });
          else { r.comparadas++; if (c.estado === 'coincide') r.coincide++; }
        }
      } else {
        const { cifras } = leerSpec(e.spec);
        if (cifras.length) r.fichaSinPareja.push({ rol, modelo: e.model, cifras: cifras.map((c) => c.texto) });
      }
      // `o.fuera(vendor, m)` es la misma regla de fin de venta; con ella, una alternativa fuera de
      // venta que la proyeccion dejara pasar tambien se cuenta.
      const fuera = o.fuera ? (m) => o.fuera(vendor, m) : null;
      const a = contrastarAlternativa(e.alt, vendor, porNombre, fuera);
      const delCatalogo = e.altCifra && e.altCifra.estado === 'catalogo';
      if (a.estado === 'fueraDeVenta') r.altRetiradas.push({ rol, modelo: e.model, alternativa: a.modelo, motivo: 'fuera de venta', sinRetirar: true });
      // Un hueco que llega a la pantalla, o uno que la proyeccion no pudo rellenar, es una
      // alternativa sin cifra que el archivo prometia: se lista aparte.
      else if (a.estado === 'hueco') r.altSinCifra.push({ rol, modelo: e.model, alternativa: e.alt, estado: 'sin rellenar' });
      else if (e.altCifra && !delCatalogo) r.altSinCifra.push({ rol, modelo: e.model, alternativa: e.alt, estado: e.altCifra.estado });
      // La cifra que puso el catalogo es la del dimensionador: no es una segunda copia, asi que no
      // se cuenta como contrastada. Solo un «difiere» delataria que la proyeccion la escribio mal.
      else if (delCatalogo && a.estado === 'coincide') r.altDelCatalogo++;
      else if (a.estado === 'sinPareja') r.altSinPareja.push({ rol, modelo: e.model, alternativa: e.alt });
      else if (a.estado === 'ilegible') r.ilegible.push({ rol, modelo: e.model, texto: e.alt });
      else if (a.estado === 'sinDato') r.sinDato.push({ rol, modelo: a.modelo, campo: a.campo, citado: a.cifra.texto });
      else if (a.estado === 'coincide' || a.estado === 'difiere') {
        r.comparadas++;
        if (a.estado === 'coincide') r.coincide++;
        // Un «difiere» aqui es que la proyeccion no aplico la regla: lo que se sirve ya no
        // deberia citar ninguna cifra en disputa.
        else r.enRevision.push({ rol, modelo: e.model, donde: 'alternativa', alternativa: a.modelo, campo: a.campo, citado: a.cifra.texto, dimensionador: mbpsLegible(a.dimensionador), sinRetirar: true });
      }
    }
  }
  return r;
}

module.exports = {
  CONTRASTE_COTIZADOR, leerSpec, normalizarModelo, indiceDimensionador,
  contrastarFila, proyectarFila, contrasteCotizador, mbpsLegible,
  aMbps, CONTRASTE_PORTAL, contrastePortal, sinCifra,
  leerAlternativa, contrastarAlternativa, proyectarGuia, contrasteGuia, textoCifra,
};
