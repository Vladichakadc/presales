'use strict';
/* global module */
/* ══ MOTOR PURO DEL DIMENSIONADOR MIKROTIK ═══════════════════════════════════
   Mismo patron que `huawei-motor.js`: `evaluar(escenario, modelos)` devuelve todo lo que la
   pagina pinta y lo que el BOM necesita. Sin DOM ni estado; global `MikrotikMotor` en el
   navegador, require() en Node (`test/mikrotik-motor.test.js`).

   SE DIMENSIONA CON LA MATRIZ OFICIAL, NO CON UN FACTOR (revision del 2026-10-13). Cada ficha de
   mikrotik.com publica el ruteo medido en tres configuraciones (fast path, 25 colas simples, 25
   reglas de filtro; y L3HW en los CCR con offload) y a tres tamanos de trama (1518, 512 y 64 B),
   e IPsec con un tunel y con 256, por cifrado. Hasta hoy el dimensionador multiplicaba UNA cifra
   de reenvio por un «factor FastTrack» de 0,45/0,35 y estimaba WireGuard en el 45 % del IPsec:
   las dos eran supuestos sin fuente. Ahora el escenario ELIGE LA CELDA de la tabla:
     - la configuracion la fijan las funciones activas (firewall, colas, L3HW): una funcion fija
       la fila, nunca se dimensiona con una mas favorable;
     - el tamano de trama lo fija el perfil de trafico, que es una columna publicada y no un
       factor inventado;
     - un modelo sin la celda pedida se APARTA CON SU MOTIVO, nunca toma la de otra capa.

   LA PRUEBA «ALL PORT» SUMA TODOS LOS PUERTOS. Por eso la necesidad se compara en agregado (los
   dos sentidos de un enlace, ×2 por defecto) y, aparte, el caudal POR SENTIDO contra el puerto
   mas rapido del equipo (`wanMax`): un hEX lite publica 493 Mbps agregados, pero su WAN es
   Fast Ethernet y no pasa de 100 Mbps por sentido. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MikrotikMotor = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {

  /* Tamano de trama: las tres columnas que publica MikroTik. IPsec se mide a 1400 B en lugar de
     1518 (cabeceras del tunel), asi que el perfil «grande» lee la columna de 1400. */
  const TRAMAS = {
    1518: { n: 'Paquetes grandes (1518 B)', d: 'descargas, video, respaldos', ipsec: 1400 },
    512: { n: 'Tráfico mixto (512 B)', d: 'empresa e Internet típico', ipsec: 512 },
    64: { n: 'Paquetes pequeños (64 B)', d: 'VoIP, juegos, peor caso / DDoS', ipsec: 64 },
  };
  const TRAMA_DEFECTO = 512;

  const CONFIGS = {
    fastpath: 'Ruteo fast path (sin firewall ni colas)',
    colas: 'Ruteo con 25 colas simples',
    filtro: 'Ruteo con 25 reglas de filtro (firewall sin FastTrack)',
    l3hw: 'Ruteo con offload L3 por hardware (L3HW)',
    l3hwFiltro: 'Ruteo con 25 reglas de filtro y FastTrack L3HW',
  };
  const FIREWALL = {
    ninguno: 'Sin firewall (tránsito / core)',
    fasttrack: 'Firewall con FastTrack',
    completo: 'Firewall completo (sin FastTrack)',
  };
  const CIFRADOS = {
    'aes128-sha1': 'AES-128-CBC + SHA1',
    'aes128-sha256': 'AES-128-CBC + SHA256',
    'aes256-sha1': 'AES-256-CBC + SHA1',
    'aes256-sha256': 'AES-256-CBC + SHA256',
  };
  const PERFILES = { ruteo: 'Ruteo / NAT', ipsec: 'IPsec', wg: 'WireGuard' };
  // La prueba IPsec «multi» es de 256 tuneles: mas alla, la cifra no esta medida.
  const TUNELES_MEDIDOS = 256;

  /* Que filas de la tabla de ruteo pide el escenario. Devuelve las configuraciones (se dimensiona
     contra la MENOR de ellas) y los avisos de por que. */
  function configuraciones(esc) {
    // Por defecto, FastTrack: es la configuracion de fabrica de RouterOS y lo que el dimensionador
    // asumia antes de esta revision.
    const fw = FIREWALL[esc.firewall] ? esc.firewall : 'fasttrack';
    const avisos = [];
    let l3hw = !!esc.l3hw;
    if (l3hw && esc.qos) {
      l3hw = false;
      avisos.push('Colas activas: el tráfico encolado no se descarga al hardware, así que el offload L3HW no aplica y se dimensiona por software.');
    }
    if (l3hw && fw === 'completo') {
      l3hw = false;
      avisos.push('Firewall completo sin FastTrack: el offload L3HW necesita FastTrack para descargar las conexiones, así que se dimensiona por software (25 reglas de filtro).');
    }
    const cfg = [];
    if (l3hw) cfg.push(fw === 'fasttrack' ? 'l3hwFiltro' : 'l3hw');
    else if (fw === 'completo') cfg.push('filtro');
    else cfg.push('fastpath');
    if (esc.qos) cfg.push('colas');
    if (!l3hw && fw === 'fasttrack') {
      avisos.push(`Firewall con FastTrack: se dimensiona con la fila de fast path, que MikroTik mide sin firewall. Es un TECHO: las conexiones nuevas y todo lo que FastTrack no acelera (colas, IPsec por política, mangle) pasan por el firewall completo.`);
    }
    if (esc.qos && cfg.length > 1) {
      avisos.push('Colas y firewall a la vez: MikroTik no publica la combinación. Se toma la menor de las dos filas, que sigue siendo un techo: con las dos activas el rendimiento real es menor.');
    }
    return { cfg, firewall: fw, l3hw, avisos };
  }

  function celda(tabla, bytes) {
    return tabla && tabla[bytes] ? tabla[bytes][1] : null;
  }

  function maxFeeds(m, bgpRam) {
    if (m.ram == null) return Infinity;
    const free = m.ram - bgpRam.baseMb;
    if (free < bgpRam.firstFeedMb) return 0;
    return 1 + Math.floor((free - bgpRam.firstFeedMb) / bgpRam.extraFeedMb);
  }
  function ramParaFeeds(n, bgpRam) {
    return bgpRam.baseMb + bgpRam.firstFeedMb + Math.max(0, n - 1) * bgpRam.extraFeedMb;
  }
  const fibra = (m) => Object.values(m.cages || {}).reduce((a, b) => a + b, 0);

  function evaluar(esc, modelos, opciones) {
    const o = opciones || {};
    const rango = o.rango || (() => 0);
    const recomendable = o.recomendable || ((m) => rango(m) < 2);
    const bgpRam = o.bgpRam || { baseMb: 384, firstFeedMb: 1200, extraFeedMb: 900 };
    const niveles = o.licencias || {};
    // Un campo vacio es «sin dato», no cero: `estado.js` vacia los numeros al abrir la pagina sin
    // parametros, y Number('') es 0 (con eso un hub salia al 0 % de simultaneidad).
    const num = (v, def) => { if (v === '' || v == null) return def; const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : def; };

    const raw = Math.max(0, num(esc.bw, 0) * (num(esc.unit, 1) || 1));
    const modo = esc.modo === 'hub' ? 'hub' : 'sitio';
    const sedes = modo === 'hub' ? Math.max(1, parseInt(esc.sedes, 10) || 1) : 1;
    const conc = modo === 'hub' ? Math.min(100, num(esc.conc, 100)) : 100;
    const head = num(esc.head, 0);
    const dirMult = Number(esc.dirMult) === 1 ? 1 : 2;
    const trama = TRAMAS[esc.trama] ? Number(esc.trama) : TRAMA_DEFECTO;
    const perfil = PERFILES[esc.perfil] ? esc.perfil : 'ruteo';
    const cifrado = CIFRADOS[esc.cifrado] ? esc.cifrado : 'aes128-sha1';
    const virtual = !!esc.virtual;

    const base = modo === 'hub' ? raw * sedes * conc / 100 : raw;
    const porSentido = base * (1 + head / 100);          // contra el puerto WAN
    const need = base * dirMult * (1 + head / 100);       // contra la prueba «all port»
    const tuneles = modo === 'hub' && sedes > 1 ? 'multi' : 'uno';
    const bytesIpsec = TRAMAS[trama].ipsec;

    const req = {
      feeds: Math.max(0, parseInt(esc.bgpFeeds, 10) || 0),
      ppp: Math.max(0, parseInt(esc.ppp, 10) || 0),
      ovpn: Math.max(0, parseInt(esc.ovpn, 10) || 0),
      hotspot: Math.max(0, parseInt(esc.hotspot, 10) || 0),
      aps: Math.max(0, parseInt(esc.aps, 10) || 0),
    };
    const apDraw = num(esc.apDraw, 0);
    req.poeW = esc.apPoe && req.aps ? req.aps * apDraw : 0;

    const avisos = [];
    const c = perfil === 'ruteo' ? configuraciones(esc) : { cfg: [], firewall: null, l3hw: false, avisos: [] };
    avisos.push(...c.avisos);

    const capDe = (m) => {
      if (m.ser === 'CHR') {
        // La licencia CHR limita la SUBIDA por interfaz; lo demas lo pone el hipervisor.
        if (perfil !== 'ruteo') return { cap: null, motivo: perfil === 'ipsec' ? 'MikroTik no publica caudal IPsec de un CHR: depende del hipervisor' : 'MikroTik no publica el rendimiento de WireGuard' };
        return { cap: m.fwd, porSentido: true };
      }
      const p = m.pruebas;
      if (!p) return { cap: null, motivo: 'sin ficha leída: no hay cifras oficiales de este modelo' };
      if (perfil === 'wg') return { cap: null, motivo: 'MikroTik no publica el rendimiento de WireGuard en sus fichas' };
      if (perfil === 'ipsec') {
        if (!p.ipsec) return { cap: null, motivo: 'la ficha no publica rendimiento IPsec' };
        const fila = p.ipsec[tuneles] && p.ipsec[tuneles][cifrado];
        if (!fila) {
          return { cap: null, motivo: tuneles === 'uno'
            ? `la ficha solo publica un túnel con AES-128-CBC + SHA1, no con ${CIFRADOS[cifrado]}`
            : `la ficha no publica 256 túneles con ${CIFRADOS[cifrado]}` };
        }
        return { cap: celda(fila, bytesIpsec), fila: `${tuneles === 'uno' ? '1 túnel' : '256 túneles'} · ${CIFRADOS[cifrado]} · ${bytesIpsec} B` };
      }
      let cap = Infinity; let fila = null;
      for (const k of c.cfg) {
        const v = celda(p.ruteo[k], trama);
        if (v == null) return { cap: null, motivo: `la ficha no publica «${CONFIGS[k]}»` };
        if (v < cap) { cap = v; fila = `${CONFIGS[k]} · ${trama} B`; }
      }
      return { cap, fila };
    };

    const rows = modelos.map((m) => {
      const miss = [];
      if (virtual !== (m.ser === 'CHR')) return null;
      const r = capDe(m);
      if (r.cap == null) miss.push(r.motivo);
      else if (r.porSentido ? r.cap < porSentido : r.cap < need) miss.push('capacidad insuficiente');
      if (m.ser !== 'CHR' && m.wanMax != null && porSentido > m.wanMax) miss.push(`su puerto más rápido es de ${fmt(m.wanMax)} por sentido`);
      const feeds = maxFeeds(m, bgpRam);
      if (req.feeds && feeds < req.feeds) miss.push(`RAM para ${feeds} feed${feeds === 1 ? '' : 's'} BGP completo${feeds === 1 ? '' : 's'} (supuesto de diseño)`);
      const lic = niveles[m.lvl] || {};
      if (req.ppp && lic.ppp != null && req.ppp > lic.ppp) miss.push(`licencia nivel ${m.lvl}: ${lic.ppp} túneles PPPoE/PPTP/L2TP`);
      if (req.ovpn && lic.ovpn != null && req.ovpn > lic.ovpn) miss.push(`licencia nivel ${m.lvl}: ${lic.ovpn} túneles OpenVPN`);
      if (req.hotspot && lic.hotspot != null && req.hotspot > lic.hotspot) miss.push(`licencia nivel ${m.lvl}: ${lic.hotspot} usuarios HotSpot`);
      if (req.poeW) {
        if (m.poe != null) { if (m.poe < req.poeW) miss.push(`${m.poe} W de PoE-out`); }
        else if (m.poeA != null) miss.push(`la ficha da ${String(m.poeA).replace('.', ',')} A de PoE-out y no vatios: no se puede comprobar`);
        else miss.push('sin PoE-out');
      }
      return { m, cap: r.cap, fila: r.fila || null, miss, feeds,
        ocupacion: r.cap ? (r.porSentido ? porSentido : need) / r.cap : null };
    }).filter(Boolean);

    // Right-sizing por COSTE, no por capacidad (decision anterior conservada): entre los que
    // cumplen gana el mas barato, y a igual precio el de MAS capacidad (RB5009 frente a RB4011,
    // los dos a $219). El medio solo reordena entre los que ya cumplen.
    const media = esc.media === 'fiber' || esc.media === 'copper' ? esc.media : 'any';
    const porMedio = (a, b) => media === 'fiber' ? fibra(b.m) - fibra(a.m) : media === 'copper' ? fibra(a.m) - fibra(b.m) : 0;
    const fit = rows.filter((r) => !r.miss.length).sort((a, b) => rango(a.m) - rango(b.m) || porMedio(a, b)
      || (a.m.elpN ?? Infinity) - (b.m.elpN ?? Infinity) || b.cap - a.cap || a.m.id.localeCompare(b.m.id, 'en', { numeric: true }));
    const pick = raw > 0 ? (fit.find((r) => recomendable(r.m)) || null) : null;

    // ── Avisos del escenario ──
    if (raw > 0) {
      if (dirMult === 2 && perfil !== 'ipsec') avisos.push(`MikroTik publica la prueba «all port», que suma lo que reenvían todos los puertos: un enlace de ${fmt(porSentido)} lleno en los dos sentidos ocupa ${fmt(need)} de esa cifra. «Un solo sentido» quita el ×2.`);
      if (dirMult === 2 && perfil === 'ipsec') avisos.push(`La ficha no dice si su cifra IPsec es por sentido o la suma de los dos: el ×2 (${fmt(need)}) es la lectura conservadora de esta página, y «Un solo sentido» la quita.`);
      if (perfil === 'ipsec' && tuneles === 'multi' && sedes > TUNELES_MEDIDOS) avisos.push(`Hub con ${sedes} sedes: MikroTik mide IPsec con ${TUNELES_MEDIDOS} túneles; por encima de esa cifra el rendimiento no está medido.`);
      if (perfil === 'ipsec' && tuneles === 'multi') avisos.push(`Hub IPsec: se dimensiona con la fila de 256 túneles, que en los CCR2116/CCR2216 duplica la de un túnel. Un solo túnel no se reparte entre núcleos: si el diseño concentra el tráfico en un túnel, vale la cifra de un túnel.`);
      if (perfil === 'wg') avisos.push('WireGuard: MikroTik no publica su rendimiento en ninguna ficha, así que no se recomienda equipo. Antes se estimaba en el 45 % del IPsec, un supuesto sin fuente que este dimensionador ya no aplica: validar con una prueba de concepto o dimensionar por IPsec.');
      if (virtual && perfil === 'ruteo') avisos.push('CHR: la licencia solo limita la subida por interfaz. El caudal real lo deciden los vCPU y la RAM que dé el hipervisor, y MikroTik no publica cifras de CHR: se compara el caudal por sentido con el tope de la licencia.');
      if (req.feeds) avisos.push(`BGP full table: la RAM por feed (${bgpRam.firstFeedMb} MB el primero y ${bgpRam.extraFeedMb} MB cada uno adicional, más ${bgpRam.baseMb} MB de sistema) es un SUPUESTO DE DISEÑO, no una cifra de MikroTik: ninguna ficha publica cuánta memoria ocupa una tabla completa.`);
      if (req.poeW) avisos.push(`PoE para ${req.aps} AP: ${req.poeW} W con el consumo máximo sin accesorios de la ficha del AP. Solo el RB5009UPr publica vatios de PoE-out (130 W); el resto publica corriente, que depende de la tensión de entrada.`);
      if (esc.ha) avisos.push('Alta disponibilidad VRRP: se cotizan 2 equipos y cada uno se dimensiona al caudal completo, porque el par suma disponibilidad y no capacidad. Cada unidad lleva su propia licencia RouterOS embebida.');
      if (trama === 64) avisos.push('Paquetes de 64 B: es el peor caso que publica MikroTik (VoIP pura, juegos, DDoS). Un tráfico real mezcla tamaños: si el perfil no es ese, la columna de 512 B es la más cercana a un tráfico mixto.');
    }

    return { raw, base, porSentido, need, head, dirMult, trama, bytesIpsec, perfil, cifrado, tuneles, modo, sedes, conc,
      virtual, configs: c.cfg, firewall: c.firewall, l3hw: c.l3hw, req, rows, fit, pick,
      unidades: esc.ha ? 2 : 1, avisos };
  }

  /* MEMORIA TECNICA (Markdown). Igual que la de Huawei: resumen, memoria de calculo con la celda
     de la tabla que dimensiona y su fuente, lista de materiales y supuestos declarados. */
  function memoria(ev, ctx) {
    const c = ctx || {};
    const m = c.m || (ev.pick && ev.pick.m) || null;
    const fila = m ? ev.rows.find((r) => r.m.id === m.id) : null;
    const L = [];
    L.push('# Memoria técnica — Dimensionamiento MikroTik RouterOS');
    L.push('');
    L.push(`Fecha: ${c.fecha || '—'} · Perfil: ${PERFILES[ev.perfil]} · Despliegue: ${ev.virtual ? 'virtual (CHR)' : 'hardware'}`);
    L.push('');
    L.push('## 1. Resumen');
    L.push('');
    if (m) {
      L.push(`- Equipo: **${m.id}** (${m.seg}), RouterOS v7, licencia ${m.lvl === 'chr' ? 'CHR' : `nivel ${m.lvl}`}.`);
      L.push(`- Necesidad de diseño: **${fmt(ev.need)}** agregados (${fmt(ev.porSentido)} por sentido).`);
      if (fila && fila.cap != null) L.push(`- Capacidad oficial en la celda que dimensiona (${fila.fila || 'tope de licencia por interfaz'}): **${fmt(fila.cap)}**, ${Math.round((fila.ocupacion || 0) * 100)} % de ocupación.`);
      if (ev.unidades > 1) L.push(`- Alta disponibilidad VRRP: ${ev.unidades} equipos.`);
      if (m.url) L.push(`- Ficha oficial: ${m.url}`);
    } else {
      L.push('- Ningún modelo del catálogo cumple el escenario; ver los motivos y avisos.');
    }
    L.push('');
    L.push('## 2. Memoria de cálculo');
    L.push('');
    L.push('| Paso | Operación | Resultado |');
    L.push('|---|---|---|');
    L.push(`| Caudal base | ${ev.modo === 'hub' ? `${ev.sedes} sedes × ${fmt(ev.raw)} × ${ev.conc} % de simultaneidad` : 'caudal del enlace'} | ${fmt(ev.base)} |`);
    L.push(`| Margen | +${ev.head} % | ${fmt(ev.porSentido)} por sentido |`);
    L.push(`| Sentidos | ×${ev.dirMult} (la prueba «all port» suma todos los puertos) | **${fmt(ev.need)}** |`);
    if (ev.perfil === 'ruteo') L.push(`| Fila de la tabla | ${ev.configs.map((k) => CONFIGS[k]).join(' y ')} | ${TRAMAS[ev.trama].n} |`);
    if (ev.perfil === 'ipsec') L.push(`| Fila de la tabla | IPsec ${ev.tuneles === 'uno' ? 'un túnel' : '256 túneles'}, ${CIFRADOS[ev.cifrado]} | ${ev.bytesIpsec} B |`);
    const r = ev.req;
    if (r.feeds) L.push(`| BGP full table | ${r.feeds} feed(s), supuesto de RAM declarado | ${(ramParaFeeds(r.feeds, c.bgpRam || { baseMb: 384, firstFeedMb: 1200, extraFeedMb: 900 }) / 1024).toFixed(1)} GB |`);
    if (r.ppp) L.push(`| Túneles PPPoE/PPTP/L2TP | tope por nivel de licencia | ${r.ppp} |`);
    if (r.ovpn) L.push(`| Túneles OpenVPN | tope por nivel de licencia | ${r.ovpn} |`);
    if (r.hotspot) L.push(`| Usuarios HotSpot | tope por nivel de licencia | ${r.hotspot} |`);
    if (r.poeW) L.push(`| PoE para ${r.aps} AP | consumo máximo sin accesorios × AP | ${r.poeW} W |`);
    L.push('');
    if (ev.avisos.length) { L.push('### Avisos del motor'); L.push(''); ev.avisos.forEach((a) => L.push(`- ${a}`)); L.push(''); }
    L.push('## 3. Lista de materiales');
    L.push('');
    const filas = c.filas || [];
    if (filas.length) {
      L.push('| Categoría | Descripción | Código | Cant. | Precio unitario |');
      L.push('|---|---|---|---|---|');
      filas.forEach((x) => L.push(`| ${x.cat || ''} | ${String(x.desc || '').replace(/\|/g, '/')} | ${x.sku || '—'} | ${x.qty == null ? '—' : x.qty} | ${x.unit != null ? `$${x.unit.toLocaleString('en-US')}` : 'incluido / consultar'} |`));
    } else {
      L.push('Sin equipo elegido: no hay lista de materiales.');
    }
    L.push('');
    L.push('_Cifras de las fichas oficiales de mikrotik.com (pruebas RFC 2544 con equipo Xena, «all port test»). Precios: «Suggested price» de la ficha (USD), sin impuestos ni descuento de canal. La RAM por feed BGP y el ×2 de los dos sentidos son supuestos de diseño declarados, no cifras de MikroTik._');
    return L.join('\n');
  }

  function fmt(v) {
    if (v == null) return '—';
    if (v >= 999999) return 'Sin tope';
    if (v >= 1000) return (v / 1000).toFixed(v % 1000 ? 1 : 0) + ' Gbps';
    return Math.round(v) + ' Mbps';
  }

  return { TRAMAS, TRAMA_DEFECTO, CONFIGS, FIREWALL, CIFRADOS, PERFILES, TUNELES_MEDIDOS,
    configuraciones, evaluar, memoria, maxFeeds, ramParaFeeds, fmt };
});
