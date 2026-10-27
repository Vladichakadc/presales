#!/usr/bin/env node
'use strict';
// Contrasta las fichas oficiales de Cisco y Meraki contra el catalogo, celda a celda.
//
// POR QUE EXISTE
// El catalogo de Cisco (`server/seed/legacyData/cisco.js`) se releyo entero el 2026-10-20 contra
// diecinueve fichas traidas por Actions, y esa lectura se hizo a ojo: tabla por tabla, cifra por
// cifra. Cisco y Meraki revisan sus fichas sin aviso (las de Meraki no fechan la revision, y tres
// boletines de la serie 8500 se «enmendaron» el 19-oct-2026), y el vigia dice QUE una pagina
// cambio, no QUE cifra. Este comando hace esa lectura por programa:
//
//     npm run cisco -- <carpeta de la rama fuente/*>          informe legible
//     npm run cisco -- cisco-sr8200-ds.html meraki-mx75-ds.html --json
//
// SOLO COMPARA. NUNCA ESCRIBE en legacyData/. Lo que difiere se corrige a mano, con su comentario
// y la ficha de la que sale (y su entrada en `fuentes.js`); una celda mal asignada sale como
// diferencia y la mira una persona, que es justo lo que no pasa si se vuelca una tabla sola.
//
// COMO LEE UNA FICHA
// Las fichas son HTML con tablas de verdad (las paginas de Cisco y de documentation.meraki.com):
//   - la familia la dice el <title> (Secure Router G2, Catalyst 8000, ISR 1000 o Meraki), y un
//     archivo que no es una ficha (una guia de instalacion, una guia de pedido) se ignora y se dice;
//   - en cada tabla, la fila de cabecera es la primera que nombra un equipo del catalogo de esa
//     familia por su referencia («C8211-G2», «C8300-2N2S-6T (2RU w/ 1G WAN)», «MX67 | MX68»); una
//     celda que agrupa varios («C8235-E-G2, C8235-G2, C8225-G2») vale para todos, y `colspan`
//     se expande (la cabecera del C8355-G2-MX ocupa las dos columnas);
//   - cada fila se reconoce por su ETIQUETA y su BASE DE MEDIDA, con las reglas de su familia
//     (`REGLAS`): «Forwarding (512B)» es el `fwd` de la G2, «IPv4 Forwarding Throughput
//     (1400Bytes)» el de un Catalyst. Donde la ficha publica la misma capa en dos bases (IPsec a
//     1.400 B y en IMIX en el 8200/8300), manda la que el modelo declara en `bases`: se compara
//     la cifra que el catalogo dice tener, no otra.
// Una celda «-» es «la ficha no lo publica» y casa con `null`; una que no se puede leer sale
// «sin leer». Un campo que el modelo no declara (undefined) no se compara: no es una cifra que
// el catalogo afirme.
//
// FALLA CERRADO. Una ficha reconocida de la que no sale ninguna celda comparada es una ficha cuya
// estructura cambio (otra maquetacion, otras etiquetas): codigo 2, nunca «todo casa». Y un modelo
// del catalogo cuya `datasheet` es esa ficha y que no aparece en ninguna cabecera sale «sin
// columna»: la ficha lo quito o lo renombro.
//
// DESDE EL VIGIA (2026-10-21, la mejora propuesta al cerrar la entrega anterior). Las fichas de
// Cisco y Meraki son paginas dinamicas (`estable: false`): su HTML cambia en cada peticion, asi
// que el vigia no las deja nunca pendientes y su hash no avisaria de una cifra cambiada. Por eso
// el job `contrastar_cisco` de vigia-fuentes.yml no espera a un «pendiente»: cada lunes trae las
// fichas que el catalogo cita y las contrasta. Este comando es el detector de cambios a nivel de
// dato, que es lo que el hash no puede ser en una pagina dinamica:
//
//     node scripts/contrastar-cisco.js --traer [--json]
//
// Solo trae las URL que algun modelo cita como `datasheet` Y que fuentes.js declara, y solo de
// www.cisco.com y documentation.meraki.com: nunca un documento que el artefacto diga. Una ficha
// que no se puede traer, que ya no se reconoce como ficha o que no da ninguna celda sale con su
// motivo y codigo 2; el issue lo dice.
//
// MODELOS DE LA FICHA QUE EL CATALOGO NO TRAE (2026-10-27, la mejora propuesta al cerrar la
// entrega anterior). Seis variantes de la 8100 estuvieron en su ficha sin que nada lo recordara.
// Las cabeceras de cada tabla nombran los equipos de la ficha; una referencia que ningun modelo
// del catalogo cubre sale en `fueraDeCatalogo` y el issue del vigia la cita. Es un aviso: no
// cambia el codigo de salida, no escribe nada, y lo que una persona ya miro va a `REVISADAS` con
// su motivo para no avisar cada lunes.
//
// CODIGO DE SALIDA: 0 si todo casa; 1 si algo difiere, no se pudo leer o falta un modelo; 2 si no
// hay ninguna ficha reconocida, una reconocida no dio ninguna celda o una ficha no se pudo traer.
const fs = require('fs');
const path = require('path');

const { MODELS } = require('../server/seed/legacyData/cisco.js');
const { FUENTES } = require('../server/seed/legacyData/fuentes.js');
const TIEMPO_LIMITE = 60000;
const HOSTS = new Set(['www.cisco.com', 'documentation.meraki.com']);

const ENTIDADES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function texto(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (_, e) => ENTIDADES[e.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Las tablas de la pagina, con cada celda expandida por su colspan.
function tablas(html) {
  const out = [];
  for (const t of html.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const filas = [];
    for (const tr of t[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
      const fila = [];
      for (const c of tr[0].matchAll(/<t([dh])([^>]*)>([\s\S]*?)<\/t\1>/gi)) {
        const span = Math.min(20, Number((/colspan\s*=\s*"?(\d+)/i.exec(c[2]) || [])[1]) || 1);
        const txt = texto(c[3]);
        for (let i = 0; i < span; i++) fila.push(txt);
      }
      if (fila.length) filas.push(fila);
    }
    out.push(filas);
  }
  return out;
}

const titulo = (html) => texto((/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '');
const canonica = (html) => (/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i.exec(html) || [])[1] || null;
const nombreDeUrl = (u) => (u ? decodeURIComponent(u.split(/[?#]/)[0].split('/').pop() || '').toLowerCase() : null);

// La familia la dice el titulo; solo las fichas tecnicas, no las guias.
const FAMILIAS = [
  { id: 'meraki', n: 'Meraki MX', ser: 'Meraki MX', titulo: /Data ?sheet - Cisco Meraki Documentation$/i },
  { id: 'g2', n: 'Secure Router (G2)', ser: 'Secure Router (G2)', titulo: /Secure Routers? Data Sheet/i },
  { id: 'catalyst', n: 'Catalyst 8000', ser: 'Catalyst 8000', titulo: /Catalyst 8[235]00 Series Edge Platforms Data Sheet/i },
  { id: 'isr', n: 'ISR 1000', ser: 'ISR 1000', titulo: /1000 Series Integrated Services Routers Data Sheet/i },
];

// Reglas por familia: etiqueta de la fila (entera, sin llamadas de nota), campo y tipo. `si`
// limita la regla a los modelos cuya base declarada la pide.
const base = (campo, re) => (m) => re.test((m.bases && m.bases[campo]) || '');
const REGLAS = {
  g2: [
    { campo: 'fwd', tipo: 'mbps', etiqueta: /^Forwarding \(512B\)$/i },
    { campo: 'ipsec', tipo: 'mbps', etiqueta: /^IPsec \(512B\)$/i },
    { campo: 'sdwan', tipo: 'mbps', etiqueta: /^SD-WAN \(512B\)$/i },
    { campo: 'amenazas', tipo: 'mbps', etiqueta: /^(Threat Protection|Security) \(EMIX\)$/i },
    { campo: 'tuneles', tipo: 'n', etiqueta: /^(SD-WAN )?IPsec tunnels$/i },
    { campo: 'rutas', tipo: 'n', etiqueta: /^IPv4\/IPv6 routes$/i },
    { campo: 'nat', tipo: 'n', etiqueta: /^(Network Address Translation \(NAT\) sessions|NAT Sessions)$/i },
  ],
  catalyst: [
    { campo: 'fwd', tipo: 'mbps', etiqueta: /^IPv4 Forwarding Throughput \(1400 ?Bytes\)$/i },
    { campo: 'ipsec', tipo: 'mbps', etiqueta: /^IPsec Throughput \(IMIX\)$/i, si: base('ipsec', /IMIX/) },
    { campo: 'ipsec', tipo: 'mbps', etiqueta: /^IPsec Throughput \(1400 ?bytes( ?, clear text)?\)$/i, si: base('ipsec', /1\.400/) },
    { campo: 'sdwan', tipo: 'mbps', etiqueta: /^SD-WAN IPsec Throughput with IQDF \(IMIX\)$/i, si: base('sdwan', /IQDF/) },
    { campo: 'sdwan', tipo: 'mbps', etiqueta: /^SD-WAN IPsec Throughput \(IMIX, clear text\)$/i, si: base('sdwan', /sin IQDF/) },
    { campo: 'amenazas', tipo: 'mbps', etiqueta: /^DIA w\. NAT \+ NGFW \+ IPS \+ URLF \+ AMP$/i },
    { campo: 'tuneles', tipo: 'n', etiqueta: /^SD-WAN Overlay Tunnels scale$/i },
  ],
  isr: [
    { campo: 'fwd', tipo: 'mbps', etiqueta: /^IPv4 Forwarding Throughput \(512B\)$/i },
    { campo: 'ipsec', tipo: 'mbps', etiqueta: /^IPsec Throughput \(512B\)$/i },
    { campo: 'sdwan', tipo: 'mbps', etiqueta: /^SD-WAN Profile: IPsec \+ QoS \+ Deep Packet Inspection \+ Flexible Netflow \(512B\)$/i },
    { campo: 'tuneles', tipo: 'n', etiqueta: /^SD-WAN Overlay Tunnels scale$/i },
  ],
  meraki: [
    { campo: 'fwd', tipo: 'mbps', etiqueta: /^(Max(imum)? )?(Stateful Firewall Throughput( in NAT mode)?|NAT Firewall Throughput|NGFW Throughput)$/i },
    { campo: 'ipsec', tipo: 'mbps', etiqueta: /^(Max(imum)? )?(Site-to-Site )?VPN Throughput$/i },
    { campo: 'sdwan', tipo: 'mbps', etiqueta: /^(Max(imum)? )?(Site-to-Site )?VPN Throughput$/i },
    { campo: 'amenazas', tipo: 'mbps', etiqueta: /^(Max(imum)? )?Next Generation Firewall \(Detection\) Throughput$/i, si: base('amenazas', /detección/) },
    { campo: 'amenazas', tipo: 'mbps', etiqueta: /^Maximum Next Generation Firewall Throughput$/i, si: base('amenazas', /prevención/) },
    { campo: 'amenazas', tipo: 'mbps', etiqueta: /^Advanced Security Throughput$/i, si: base('amenazas', /Advanced Security/) },
    { campo: 'amenazasDet', tipo: 'mbps', etiqueta: /^(Max(imum)? )?Next Generation Firewall \(Detection\) Throughput$/i },
    { campo: 'clientes', tipo: 'n', etiqueta: /^Recommended Device Count$/i },
    { campo: 'clientes', tipo: 'n', etiqueta: /^Recommended Use Case$/i, soloConNumero: /devices/i },
    { campo: 'tuneles', tipo: 'n', etiqueta: /^(Max Concurrent Site-to-Site VPN Tunnels|Maximum Recommended Tunnels)$/i },
  ],
};

// Las referencias con las que una ficha nombra a cada modelo. Las fichas del ISR 1000 y de los MX
// de sobremesa agrupan variantes en una columna («C111x- 8P», «MX67»): se declaran aqui.
const ALIAS = {
  'ISR 1111-8P': ['C111x-8P'], 'ISR 1111X-8P': ['C111x-8P'], 'ISR 1116-4P': ['C111x-4P'],
  'ISR 1121X-8P': ['C112x(X)-8P'], 'ISR 1161X-8P': ['C1161'],
  'Catalyst 8200': ['C8200-1N-4T'], 'Catalyst 8200L': ['C8200L-1N-4T'],
  'Meraki MX67C': ['MX67'], 'Meraki MX68CW': ['MX68'], 'Meraki MX105': ['MX105'],
};
function codigos(m) {
  const c = new Set(ALIAS[m.id] || []);
  const g2 = /^Cisco Secure Router (.+)$/.exec(m.id);
  if (g2) {
    c.add(g2[1]);
    // La ficha de la 8600 lo llama «Cisco 8650-G2 Secure Router», sin la C.
    c.add(g2[1].replace(/^C(?=\d)/, ''));
    if (/-MX$/.test(g2[1])) c.add(g2[1].replace(/-MX$/, ''));
  }
  const cat = /^Catalyst (8\d00[L]?-.+)$/.exec(m.id);
  if (cat) c.add(`C${cat[1]}`);
  const mx = /^Meraki (MX\d+\w*)$/.exec(m.id);
  if (mx) c.add(mx[1]);
  if (m.hwSku) c.add(m.hwSku.replace(/-HW$/, ''));
  return [...c];
}
// Lo que una cabecera llama «un equipo» en cada familia: su referencia de pedido. Una que no casa
// con ningún modelo del catálogo (de ninguna familia) sale en `fueraDeCatalogo`: un aviso, no una
// diferencia, porque la ficha puede traer variantes que el catálogo deja fuera a propósito.
const REFERENCIAS = {
  g2: /(?<![A-Za-z0-9-])C?8\d{3}[A-Z]?(?:-[A-Z0-9]+)*?-G2(?:-MX)?(?![A-Za-z0-9-])/g,
  catalyst: /(?<![A-Za-z0-9-])C8[235]\d\dL?-[A-Z0-9]+(?:-[A-Z0-9]+)*(?![A-Za-z0-9-])/g,
  isr: /(?<![A-Za-z0-9-])C11\d[\dxX](?:\(X\))?X?(?:-[A-Z0-9]+)*(?![A-Za-z0-9-])/g,
  meraki: /(?<![A-Za-z0-9-])(?:MX\d+[A-Z]*|C8\d{3}-G2(?:-MX)?)(?![A-Za-z0-9-])/g,
};
// Las referencias que una persona ya miró y dejó fuera, con su motivo: no vuelven a avisar cada
// lunes. Una que entre al catálogo se quita de aquí (la prueba lo frena).
const REVISADAS = Object.fromEntries([
  [['C8200-1N-4S', 'C8200L-1N-4S'],
    'errata de la ficha de la serie 8200: solo las nombra su tabla de consumo; el resto de la ficha, ' +
    'su guía de hardware, la guía de pedido y el boletín de fin de venta dicen C8200-1N-4T y C8200L-1N-4T (revisado el 2026-10-27)'],
  [['C1101-4P', 'C1101-4PLTEP', 'C1101-4PLTEPW', 'C1109-2PLTE', 'C1109-4PLTE2P', 'C1109-4PLTE2PW', 'C111x-4PLTE',
    'C111x-4PLTEW', 'C111x-4PW', 'C111x-8PLTE', 'C111x-8PLTEW', 'C111x-8PW', 'C1121-4P', 'C1121-4PLTEP', 'C1121-8PLTEPW',
    'C1121X-8PLTEPW', 'C112x-4P', 'C112x-8P', 'C112x-8PLTEP', 'C112xX-8P', 'C112xX-8PLTEP', 'C1131-8P', 'C1131-8PLTEPW',
    'C1131-8PW', 'C1131X-8P', 'C1131X-8PLTEPW', 'C1131X-8PW', 'C1161-8P', 'C1161-8PLTEP', 'C1161X-8PLTEP'],
    'variantes de la ficha del ISR 1000 (cuatro puertos, LTE, Wi-Fi, C1101, C1109, C1131 y las sin X) que el catálogo ' +
    'no trae; si entran es una decisión de alcance (PENDIENTES.md, «Modelos de una ficha que el catálogo no trae», 2026-10-27)'],
  [['MX67W', 'MX68W'],
    'variantes con Wi-Fi de la ficha del MX67/MX68 que el catálogo no trae; si entran es una decisión de alcance ' +
    '(PENDIENTES.md, «Modelos de una ficha que el catálogo no trae», 2026-10-27)'],
].flatMap(([refs, motivo]) => refs.map((r) => [r, motivo])));
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nombra = (celda, cod) => new RegExp(`(^|[^A-Za-z0-9-])${escapar(cod)}(?![A-Za-z0-9-])`).test(celda);
const normalCabecera = (t) => t.replace(/-\s+/g, '-').replace(/\/\s+/g, '/');
const normalEtiqueta = (t) => t.replace(/\*+/g, '').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').replace(/\s+([),:])/g, '$1').replace(/\(\s+/g, '(').trim();

// Una celda de la ficha: { n } con la cifra (Mbps o unidades), { noPublica } o null (sin leer).
function valor(txt, tipo) {
  const t = String(txt || '').replace(/\*+/g, '').trim();
  if (/^(-|—|–|N\/A)$/i.test(t)) return { noPublica: true };
  if (tipo === 'mbps') {
    const m = /(\d[\d,]*(?:\.\d+)?)\s*(Gbps|Mbps|Kbps)/i.exec(t);
    if (!m) return null;
    const x = Number(m[1].replace(/,/g, ''));
    const f = { gbps: 1000, mbps: 1, kbps: 0.001 }[m[2].toLowerCase()];
    return { n: Math.round(x * f * 1000) / 1000 };
  }
  const m = /(\d[\d,]*(?:\.\d+)?)\s*([KM])?(?![A-Za-z])/.exec(t);
  if (!m) return null;
  const x = Number(m[1].replace(/,/g, ''));
  return { n: Math.round(x * ({ K: 1e3, M: 1e6 }[m[2]] || 1)) };
}

function contrastar(html, archivo = '(html)', modelos = MODELS) {
  const tit = titulo(html);
  const fam = FAMILIAS.find((f) => f.titulo.test(tit));
  if (!fam) return { archivo, documento: tit || null, reconocida: false };
  const candidatos = modelos.filter((m) => m.ser === fam.ser);
  const celdas = [];
  const vistos = new Set();
  const cabeceras = [];
  tablas(html).forEach((filas, nt) => {
    let cols = null;
    for (const fila of filas) {
      if (!cols) {
        const mapa = new Map();
        fila.forEach((celda, i) => {
          if (i === 0 && fila.length > 1 && fila.slice(1).some((x) => x !== celda)) return;
          const cab = normalCabecera(celda);
          const ms = candidatos.filter((m) => codigos(m).some((c) => nombra(cab, c)));
          if (ms.length) mapa.set(i, ms);
        });
        if (mapa.size) {
          // La primera columna es la etiqueta: si la cabecera ocupa toda la fila, la cifra va en la 1.
          if (mapa.has(0) && fila.length > 1) mapa.delete(0);
          cols = mapa;
          cabeceras.push(fila);
        }
        continue;
      }
      const etiqueta = normalEtiqueta(fila[0] || '');
      for (const regla of REGLAS[fam.id]) {
        if (!regla.etiqueta.test(etiqueta)) continue;
        for (const [i, ms] of cols) {
          const txt = fila[i];
          if (txt === undefined || txt === fila[0]) continue;
          if (regla.soloConNumero && !regla.soloConNumero.test(txt)) continue;
          for (const m of ms) {
            if (regla.si && !regla.si(m)) continue;
            if (m[regla.campo] === undefined) continue;
            vistos.add(m.id);
            const v = valor(txt, regla.tipo);
            const cat = m[regla.campo];
            let estado;
            if (!v) estado = 'sin leer';
            else if (v.noPublica) estado = cat == null ? 'casa' : 'difiere';
            else if (cat == null) estado = 'difiere';
            else estado = Math.abs(v.n - cat) <= Math.max(0.5, Math.abs(cat) * 1e-6) ? 'casa' : 'difiere';
            celdas.push({ modelo: m.id, campo: regla.campo, catalogo: cat, ficha: v ? (v.noPublica ? null : v.n) : null,
              texto: txt, etiqueta, tabla: nt, estado });
          }
        }
      }
    }
    // Una tabla cuya cabecera no nombra ningún modelo del catálogo se mira por su primera fila:
    // es justo la que trae solo equipos nuevos.
    if (!cols && filas.length) cabeceras.push(filas[0]);
  });
  const nombre = nombreDeUrl(canonica(html));
  const esperados = nombre ? candidatos.filter((m) => nombreDeUrl(m.datasheet) === nombre) : [];
  const sinColumna = esperados.filter((m) => !vistos.has(m.id)).map((m) => m.id);
  const fuera = fueraDeCatalogo(cabeceras, fam.id, modelos);
  return { archivo, documento: tit, familia: fam.n, reconocida: true, celdas, sinColumna,
    fueraDeCatalogo: fuera.filter((r) => !REVISADAS[r]), revisadas: fuera.filter((r) => REVISADAS[r]) };
}

/* Las referencias de equipo que nombran las cabeceras de la ficha y que ningún modelo del catálogo
   lleva. Solo las cabeceras: una tabla de pedido (accesorios, fuentes, licencias) no cuenta. */
function fueraDeCatalogo(cabeceras, familia, modelos = MODELS) {
  const conocidas = new Set(modelos.flatMap(referenciasDe).map((c) => c.toUpperCase()));
  const fuera = new Set();
  for (const fila of cabeceras) {
    for (const celda of fila) {
      for (const [ref] of normalCabecera(celda).matchAll(REFERENCIAS[familia])) {
        if (conocidas.has(ref.toUpperCase())) continue;
        // «C1161(X)-8P» son dos referencias; «C112x» a secas es la familia del ISR, no un equipo.
        const refs = /\(X\)/.test(ref) ? [ref.replace('(X)', ''), ref.replace('(X)', 'X')] : [ref];
        for (const r of refs) {
          if (familia === 'isr' && !r.includes('-')) continue;
          if (!conocidas.has(r.toUpperCase())) fuera.add(r);
        }
      }
    }
  }
  return [...fuera].sort();
}
// Las referencias que un modelo ya cubre: sus códigos de columna y su referencia de pedido («ISR
// 1111X-8P» es la C1111X-8P), que no se usan para buscar columnas porque la ficha las agrupa.
function referenciasDe(m) {
  const r = codigos(m);
  const isr = /^ISR (1\d{3}X?-\w+)$/.exec(m.id);
  if (isr) r.push(`C${isr[1]}`);
  return r;
}

function archivos(rutas) {
  const out = [];
  for (const r of rutas) {
    const st = fs.statSync(r);
    if (st.isDirectory()) {
      for (const f of fs.readdirSync(r).sort()) if (/\.html?$/i.test(f)) out.push(path.join(r, f));
    } else out.push(r);
  }
  return out;
}

const fmt = (n) => (n == null ? 'sin dato' : Number(n).toLocaleString('es-ES'));

function informe(res) {
  const lineas = ['Contraste de las fichas de Cisco y Meraki contra legacyData/cisco.js (solo compara; nada se escribe)', ''];
  for (const r of res) {
    if (!r.reconocida) continue;
    const c = (e) => r.celdas.filter((x) => x.estado === e).length;
    lineas.push(`${path.basename(r.archivo)} — ${r.documento} (${r.familia})`);
    lineas.push(`  casan ${c('casa')} · difieren ${c('difiere')} · sin leer ${c('sin leer')} · modelos sin columna ${r.sinColumna.length}`);
    if (!r.celdas.length) lineas.push('  NINGUNA CELDA: la estructura de la ficha cambió (otra maquetación u otras etiquetas).');
    for (const x of r.celdas.filter((y) => y.estado !== 'casa')) {
      lineas.push(`  ${x.estado.toUpperCase().padEnd(8)} ${x.modelo} · ${x.campo}: catálogo ${fmt(x.catalogo)}, ficha «${x.texto}» (${x.ficha == null ? 'no publica' : fmt(x.ficha)}) — fila «${x.etiqueta}», tabla ${x.tabla}`);
    }
    for (const id of r.sinColumna) lineas.push(`  SIN COLUMNA ${id}: su ficha es esta y ninguna cabecera lo nombra.`);
    if (r.fueraDeCatalogo.length) {
      lineas.push(`  EN LA FICHA, NO EN EL CATÁLOGO (aviso; no cuenta como diferencia): ${r.fueraDeCatalogo.join(', ')}`);
    }
    if (r.revisadas.length) lineas.push(`  ya revisadas y fuera a propósito: ${r.revisadas.length} (REVISADAS)`);
    lineas.push('');
  }
  const ign = res.filter((r) => !r.reconocida);
  if (ign.length) lineas.push(`Ignorados (no son una ficha técnica reconocida): ${ign.map((r) => path.basename(r.archivo)).join(', ')}`);
  return lineas.join('\n');
}

function codigoSalida(res) {
  const fichas = res.filter((r) => r.reconocida);
  if (!fichas.length || fichas.some((r) => !r.celdas.length) || res.some((r) => r.error)) return 2;
  const mal = fichas.some((r) => r.sinColumna.length || r.celdas.some((x) => x.estado !== 'casa'));
  return mal ? 1 : 0;
}

// Las fichas que el catalogo cita y fuentes.js declara: la lista que el vigia contrasta.
function fichasDeCatalogo(modelos = MODELS, fuentes = FUENTES) {
  const declaradas = new Set((fuentes.cisco || []).map((f) => f.url).filter(Boolean));
  const urls = [...new Set(modelos.map((m) => m.datasheet).filter(Boolean))];
  return urls.filter((u) => declaradas.has(u) && HOSTS.has(new URL(u).hostname));
}

/* Trae una ficha y la contrasta. `traer` se inyecta en las pruebas. Un fallo no lanza: vuelve
   con `error`, que cuenta como «no se pudo leer». */
async function traerYContrastar(url, traer = fetch) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE);
  try {
    const res = await traer(url, { redirect: 'follow', signal: control.signal,
      headers: { 'User-Agent': 'presales-contrastar-cisco/1.0 (+catalogo interno)' } });
    if (!res.ok) return { archivo: url, reconocida: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    const r = contrastar(html, url);
    if (!r.reconocida) return { ...r, error: 'la pagina ya no se reconoce como ficha (otro titulo o una pantalla intermedia)' };
    return r;
  } catch (e) {
    return { archivo: url, reconocida: false, error: e.name === 'AbortError' ? 'tiempo agotado' : String(e.message || e) };
  } finally {
    clearTimeout(reloj);
  }
}

// Lo que el job deja para `publicar`: corto, sin el HTML, y solo con lo que el issue necesita.
function resumenJson(res) {
  return { fichas: res.map((r) => ({
    url: r.archivo, documento: r.documento || null, error: r.error || null,
    casan: (r.celdas || []).filter((x) => x.estado === 'casa').length,
    difieren: (r.celdas || []).filter((x) => x.estado === 'difiere')
      .map((x) => ({ modelo: x.modelo, campo: x.campo, catalogo: x.catalogo, ficha: x.ficha, etiqueta: x.etiqueta })),
    sinLeer: (r.celdas || []).filter((x) => x.estado === 'sin leer')
      .map((x) => ({ modelo: x.modelo, campo: x.campo, texto: x.texto })),
    sinColumna: r.sinColumna || [],
    fueraDeCatalogo: r.fueraDeCatalogo || [],
  })) };
}

async function principal(args, traer = fetch) {
  const json = args.includes('--json');
  let res;
  if (args.includes('--traer')) {
    res = [];
    for (const u of fichasDeCatalogo()) res.push(await traerYContrastar(u, traer));
  } else {
    const rutas = args.filter((a) => !a.startsWith('--'));
    if (!rutas.length) {
      console.error('Uso: npm run cisco -- <carpeta|ficha.html>... [--json]   ·   npm run cisco -- --traer [--json]');
      return 2;
    }
    res = archivos(rutas).map((f) => contrastar(fs.readFileSync(f, 'utf8'), f));
  }
  if (json) console.log(JSON.stringify(args.includes('--traer') ? resumenJson(res) : res, null, 2));
  else {
    console.log(informe(res));
    for (const r of res.filter((x) => x.error)) console.log(`NO SE PUDO LEER ${r.archivo}: ${r.error}`);
  }
  return codigoSalida(res);
}

if (require.main === module) principal(process.argv.slice(2)).then((c) => process.exit(c));

module.exports = { contrastar, tablas, valor, codigos, referenciasDe, REVISADAS, codigoSalida, informe, fichasDeCatalogo,
  traerYContrastar, resumenJson, principal };
