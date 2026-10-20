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
// CODIGO DE SALIDA: 0 si todo casa; 1 si algo difiere, no se pudo leer o falta un modelo; 2 si no
// hay ninguna ficha reconocida o una reconocida no dio ninguna celda.
const fs = require('fs');
const path = require('path');

const { MODELS } = require('../server/seed/legacyData/cisco.js');

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

function contrastar(html, archivo = '(html)') {
  const tit = titulo(html);
  const fam = FAMILIAS.find((f) => f.titulo.test(tit));
  if (!fam) return { archivo, documento: tit || null, reconocida: false };
  const candidatos = MODELS.filter((m) => m.ser === fam.ser);
  const celdas = [];
  const vistos = new Set();
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
  });
  const nombre = nombreDeUrl(canonica(html));
  const esperados = nombre ? candidatos.filter((m) => nombreDeUrl(m.datasheet) === nombre) : [];
  const sinColumna = esperados.filter((m) => !vistos.has(m.id)).map((m) => m.id);
  return { archivo, documento: tit, familia: fam.n, reconocida: true, celdas, sinColumna };
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
    lineas.push('');
  }
  const ign = res.filter((r) => !r.reconocida);
  if (ign.length) lineas.push(`Ignorados (no son una ficha técnica reconocida): ${ign.map((r) => path.basename(r.archivo)).join(', ')}`);
  return lineas.join('\n');
}

function codigoSalida(res) {
  const fichas = res.filter((r) => r.reconocida);
  if (!fichas.length || fichas.some((r) => !r.celdas.length)) return 2;
  const mal = fichas.some((r) => r.sinColumna.length || r.celdas.some((x) => x.estado !== 'casa'));
  return mal ? 1 : 0;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const rutas = args.filter((a) => !a.startsWith('--'));
  if (!rutas.length) {
    console.error('Uso: npm run cisco -- <carpeta|ficha.html>... [--json]');
    process.exit(2);
  }
  const res = archivos(rutas).map((f) => contrastar(fs.readFileSync(f, 'utf8'), f));
  console.log(json ? JSON.stringify(res, null, 2) : informe(res));
  process.exit(codigoSalida(res));
}

if (require.main === module) main();

module.exports = { contrastar, tablas, valor, codigos, codigoSalida, informe };
