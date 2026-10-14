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


  /* ══ ENLACES WAN (2026-10-13, encargo del dueño: «qué pasa si se necesita un segundo enlace, de
     Internet o MPLS, principal y backup; cómo se comporta el equipo; los módulos SFP recomendados
     de acuerdo al ancho de banda»).
     Lo que decide cada enlace:
       - su ROL: un principal está activo y suma; un respaldo OCUPA PUERTO pero NO SUMA: solo lleva
         tráfico cuando cae un principal (mismo criterio que el Multi-Underlay Builder de Aruba).
         Dos principales son balanceo (PCC/ECMP) y suman.
       - el caudal se dimensiona con el MÁXIMO ENTRE ESCENARIOS: normal (Σ principales) y, por cada
         principal que cae, el resto más el respaldo más rápido. Un respaldo más rápido que el
         principal gobierna el dimensionamiento, porque en la falla el router reenvía su velocidad.
       - su VELOCIDAD y su ENTREGA (cobre, fibra monomodo o multimodo) eligen el PUERTO del equipo y
         el MÓDULO. El módulo sale de la matriz oficial «MikroTik wired interface compatibility»
         (`COMPATIBILIDAD` en legacyData/mikrotik.js): lo que la matriz no marca «+» para ese
         equipo no se recomienda, y un equipo que la matriz no lista va con el módulo «a consultar».
       - un equipo al que no le caben los enlaces (y un puerto para la LAN) se APARTA con su motivo. */
  const TIPOS_ENLACE = { internet: 'Internet', mpls: 'MPLS' };
  const ROLES = { principal: 'Principal (activo)', respaldo: 'Respaldo (failover)' };
  const MEDIOS = {
    indiferente: 'Sin definir (según el operador)',
    cobre: 'Cobre RJ45',
    'fibra-sm': 'Fibra monomodo',
    'fibra-mm': 'Fibra multimodo',
  };
  // Lo mismo, en minúscula para el medio de una frase (sin estropear «RJ45»).
  const MEDIOS_TXT = { indiferente: 'entrega sin definir', cobre: 'cobre RJ45', 'fibra-sm': 'fibra monomodo', 'fibra-mm': 'fibra multimodo' };
  const MAX_ENLACES = 4;
  // Módulo por entrega, velocidad y ALCANCE, y en qué jaulas va. Dentro de cada velocidad van de
  // menor a mayor alcance (el «Distance» de la ficha de cada módulo): se elige el primero que llega
  // a la distancia del tramo y que la matriz marca para el equipo. 1G en fibra: el módulo de 1G
  // también va en una jaula SFP+/SFP28, como dice la tabla «1G SFP» de la matriz. El cobre llega a
  // 100 m (y el S+RJ10 a 30 m a 10 Gbps, según su tabla de la matriz).
  const MODULOS = [
    { medio: 'cobre', hasta: 1000, km: 0.1, sku: 'S-RJ01', jaulas: ['sfp', 'sfp10', 'sfp25'] },
    { medio: 'cobre', hasta: 5000, km: 0.1, sku: 'S+RJ10', jaulas: ['sfp2g5', 'sfp10', 'sfp25'] },
    { medio: 'cobre', hasta: 10000, km: 0.03, sku: 'S+RJ10', jaulas: ['sfp10', 'sfp25'] },
    { medio: 'fibra-sm', hasta: 1000, km: 20, sku: 'S-31DLC20D', jaulas: ['sfp', 'sfp10', 'sfp25'] },
    { medio: 'fibra-sm', hasta: 1000, km: 80, sku: 'S-55DLC80D', jaulas: ['sfp', 'sfp10', 'sfp25'] },
    { medio: 'fibra-sm', hasta: 2500, km: 10, sku: 'S+31DLC10D', jaulas: ['sfp2g5'] },
    { medio: 'fibra-sm', hasta: 2500, km: 15, sku: 'XS+2733LC15D', jaulas: ['sfp2g5'], kit: true },
    { medio: 'fibra-sm', hasta: 10000, km: 10, sku: 'S+31DLC10D', jaulas: ['sfp10', 'sfp25'] },
    { medio: 'fibra-sm', hasta: 10000, km: 15, sku: 'XS+2733LC15D', jaulas: ['sfp10', 'sfp25'], kit: true },
    { medio: 'fibra-sm', hasta: 25000, km: 10, sku: 'XS+31LC10D', jaulas: ['sfp25'] },
    { medio: 'fibra-sm', hasta: 25000, km: 15, sku: 'XS+2733LC15D', jaulas: ['sfp25'], kit: true },
    { medio: 'fibra-sm', hasta: 100000, km: 2, sku: 'XQ+31LC02D', jaulas: ['qsfp100'] },
    { medio: 'fibra-sm', hasta: 100000, km: 10, sku: 'XQ+31LC10D', jaulas: ['qsfp100'] },
    { medio: 'fibra-mm', hasta: 1000, km: 0.3, sku: 'S+85DLC03D', jaulas: ['sfp', 'sfp10', 'sfp25'] },
    { medio: 'fibra-mm', hasta: 2500, km: 0.3, sku: 'S+85DLC03D', jaulas: ['sfp2g5'] },
    { medio: 'fibra-mm', hasta: 10000, km: 0.3, sku: 'S+85DLC03D', jaulas: ['sfp10', 'sfp25'] },
    { medio: 'fibra-mm', hasta: 25000, km: 0.1, sku: 'XS+85LC01D', jaulas: ['sfp25'] },
    { medio: 'fibra-mm', hasta: 100000, km: 0.1, sku: 'XQ+85MP01D', jaulas: ['qsfp100'] },
  ];
  const ALCANCE_COBRE_KM = 0.1;
  // El BiDi va por una sola fibra con dos longitudes de onda: el extremo del operador tiene que
  // llevar la complementaria. Es física del enlace, no una cifra de MikroTik.
  const NOTA_BIDI = 'BiDi por una sola fibra (1270/1330 nm): el extremo del operador lleva la longitud de onda complementaria; confirmarlo con él';

  /* Lista de enlaces saneada. `lista` puede llegar como texto JSON (el campo oculto de la página).
     Un enlace sin velocidad toma la DEMANDA DEL SITIO, sin el margen de crecimiento (`porDefecto`):
     es lo que se contrata, y el margen se aplica después, sobre lo que procesa el equipo. Sin
     ningún principal, el primero lo es. Sin lista, un único enlace principal de Internet con la
     velocidad del sitio y el medio sin definir. */
  function normalizarEnlaces(lista, defMbps) {
    let l = lista;
    if (typeof l === 'string') { try { l = JSON.parse(l || '[]'); } catch { l = []; } }
    if (!Array.isArray(l) || !l.length) l = [{}];
    const avisos = [];
    const out = l.slice(0, MAX_ENLACES).map((e, i) => {
      const v = e && e.mbps !== '' && e.mbps != null ? Number(e.mbps) : NaN;
      const vale = Number.isFinite(v) && v > 0;
      const mbps = vale ? v : defMbps;
      // Subida: vacía es un enlace simétrico. El puerto se mide por el sentido mayor.
      const su = e && e.subida !== '' && e.subida != null ? Number(e.subida) : NaN;
      const subida = Number.isFinite(su) && su > 0 ? su : mbps;
      const k = e && e.km !== '' && e.km != null ? Number(e.km) : NaN;
      return {
        n: i + 1,
        tipo: TIPOS_ENLACE[e && e.tipo] ? e.tipo : 'internet',
        rol: ROLES[e && e.rol] ? e.rol : (i === 0 ? 'principal' : 'respaldo'),
        medio: MEDIOS[e && e.medio] ? e.medio : 'indiferente',
        mbps,
        subida,
        asimetrico: subida !== mbps,
        vel: Math.max(mbps, subida),
        km: Number.isFinite(k) && k > 0 ? k : null,
        porDefecto: !vale,
      };
    });
    if (!out.some((e) => e.rol === 'principal')) {
      out[0].rol = 'principal';
      avisos.push('Ningún enlace estaba marcado como principal: el primero se toma como principal.');
    }
    if (Array.isArray(l) && l.length > MAX_ENLACES) avisos.push(`Se consideran ${MAX_ENLACES} enlaces como máximo; el resto no entra en el cálculo.`);
    return { enlaces: out, avisos };
  }

  /* Escenarios de caudal WAN: normal y uno por cada principal que cae. */
  function escenariosWan(enlaces) {
    const pr = enlaces.filter((e) => e.rol === 'principal');
    const re = enlaces.filter((e) => e.rol === 'respaldo');
    // Cada escenario suma bajada y subida por separado: el puerto ve el sentido mayor y la prueba
    // «all port» la suma de los dos.
    const suma = (l) => ({ baja: l.reduce((a, e) => a + e.mbps, 0), sube: l.reduce((a, e) => a + e.subida, 0) });
    const esc = (l) => { const x = suma(l); return { ...x, mbps: Math.max(x.baja, x.sube), agregado: x.baja + x.sube }; };
    const n = esc(pr);
    const mejor = re.length ? re.reduce((a, e) => (e.vel > a.vel ? e : a)) : null;
    const fallas = mejor ? pr.map((e) => ({ cae: e, entra: mejor, ...esc([...pr.filter((x) => x !== e), mejor]) })) : [];
    const peor = fallas.reduce((a, f) => (f.mbps > a.mbps ? f : a), { mbps: n.mbps, cae: null });
    // Bajada y subida del MISMO escenario: el que más suma (a igualdad, el normal). Es lo que la
    // página y la memoria muestran junto a la suma, y tienen que cuadrar con ella.
    const peorAg = fallas.reduce((a, f) => (f.agregado > a.agregado ? f : a), n);
    return { normal: n.mbps, normalBaja: n.baja, normalSube: n.sube, agregadoNormal: n.agregado, fallas,
      caudal: Math.max(n.mbps, peor.mbps), agregado: peorAg.agregado, baja: peorAg.baja, sube: peorAg.sube,
      gobierna: peor.mbps > n.mbps ? peor : null };
  }

  const fmtKm = (k) => (k < 1 ? `${Math.round(k * 1000)} m` : `${String(k).replace('.', ',')} km`);
  const etiquetaEnlace = (e) => `Enlace ${e.n} · ${TIPOS_ENLACE[e.tipo]} ${e.rol === 'principal' ? 'principal' : 'de respaldo'} · ${MEDIOS_TXT[e.medio]} · ${e.asimetrico ? `${fmt(e.mbps)} / ${fmt(e.subida)}` : fmt(e.mbps)}${e.km ? ` · ${fmtKm(e.km)}` : ''}`;

  /* Puertos del equipo como ranuras: cobre por velocidad y jaulas por clase. */
  function ranuras(p) {
    const r = [];
    const add = (n, base) => { for (let i = 0; i < (n || 0); i++) r.push({ ...base, id: `${base.clase}-${i}` }); };
    add(p.fe, { tipo: 'rj', clase: 'fe', vel: 100, n: 'puerto Ethernet 10/100' });
    add(p.ge, { tipo: 'rj', clase: 'ge', vel: 1000, n: 'puerto Ethernet 1G' });
    add(p.ge25, { tipo: 'rj', clase: 'ge25', vel: 2500, n: 'puerto Ethernet 2,5G' });
    add(p.sfp, p.sfp2g5 ? { tipo: 'jaula', clase: 'sfp', g25: true, vel: 2500, n: 'jaula SFP (admite 2,5G)' } : { tipo: 'jaula', clase: 'sfp', vel: 1000, n: 'jaula SFP' });
    add(p.sfp10, { tipo: 'jaula', clase: 'sfp10', vel: 10000, n: 'jaula SFP+' });
    add(p.sfp25, { tipo: 'jaula', clase: 'sfp25', vel: 25000, n: 'jaula SFP28' });
    add(p.qsfp100, { tipo: 'jaula', clase: 'qsfp100', vel: 100000, n: 'jaula QSFP28' });
    return r;
  }

  /* Que modulo lleva un enlace en una jaula, segun la matriz de ESTE equipo. */
  function moduloEn(e, jaula, fila) {
    const clase = jaula.g25 && e.vel > 1000 ? 'sfp2g5' : jaula.clase;
    const porVel = MODULOS.filter((x) => x.medio === e.medio && e.vel <= x.hasta && x.jaulas.includes(clase));
    if (!porVel.length) return null;
    // La velocidad más baja que sirve fija la familia; dentro de ella, el primero que llega.
    const tope = Math.min(...porVel.map((x) => x.hasta));
    const familia = porVel.filter((x) => x.hasta === tope);
    const llegan = e.km ? familia.filter((x) => x.km >= e.km) : familia;
    if (!llegan.length) return { sku: null, sinAlcance: Math.max(...familia.map((x) => x.km)) };
    if (!fila) return { sku: null, consultar: true, km: llegan[0].km };
    const ok = llegan.find((x) => fila[x.sku] === true || typeof fila[x.sku] === 'string');
    if (ok) return { sku: ok.sku, nota: typeof fila[ok.sku] === 'string' ? fila[ok.sku] : null, km: ok.km, kit: !!ok.kit };
    return { sku: null, prohibido: llegan[0].sku };
  }

  /* Asigna cada enlace a un puerto del equipo y le pone modulo. Devuelve la asignacion, lo que
     falla (motivos para apartar el modelo) y los avisos de la matriz. */
  function asignarPuertos(m, enlaces, o) {
    const opc = o || {};
    const compat = opc.compat || {};
    const precios = opc.modulos || {};
    const notas = opc.notas || {};
    if (!m.puertos) return null;
    const fila = m.compat ? compat[m.compat] || null : null;
    const libres = ranuras(m.puertos);
    const total = libres.length;
    const asig = []; const miss = []; const avisos = [];
    let rj10 = 0;
    // Acepta enlaces sin sanear (llamada directa): sin `vel`, la velocidad es la del sentido mayor.
    const lista = enlaces.map((e) => (e.vel != null ? e : { ...e, subida: e.subida || e.mbps, vel: Math.max(e.mbps, e.subida || 0), km: e.km || null }));
    const orden = [...lista].sort((a, b) => b.vel - a.vel || a.n - b.n);
    for (const e of orden) {
      const cands = [];
      for (const r of libres) {
        if (r.vel < e.vel) continue;
        if (r.tipo === 'rj') {
          const llega = !e.km || e.km <= ALCANCE_COBRE_KM || e.medio === 'indiferente';
          if ((e.medio === 'cobre' || e.medio === 'indiferente') && llega) cands.push({ r, mod: null, costo: 0 });
          continue;
        }
        if (e.medio === 'indiferente') { cands.push({ r, mod: null, costo: 0 }); continue; }
        const mod = moduloEn(e, r, fila);
        if (!mod || mod.prohibido || mod.sinAlcance) continue;
        if (mod.sku === 'S+RJ10' && fila && fila['S+RJ10'] === '11' && rj10 >= 6) continue;
        cands.push({ r, mod, costo: mod.sku ? (precios[mod.sku] ? precios[mod.sku].price : 0) : 0 });
      }
      cands.sort((a, b) => (a.r.tipo === 'rj' ? 0 : 1) - (b.r.tipo === 'rj' ? 0 : 1) || a.r.vel - b.r.vel || a.costo - b.costo);
      const c = cands[0];
      if (!c) { miss.push(motivoSinPuerto(e, ranuras(m.puertos), fila)); continue; }
      libres.splice(libres.indexOf(c.r), 1);
      const fila0 = { enlace: e, puerto: c.r.n, velPuerto: c.r.vel, sku: c.mod ? c.mod.sku : null, consultar: !!(c.mod && c.mod.consultar),
        alcance: c.mod ? c.mod.km || null : (c.r.tipo === 'rj' ? ALCANCE_COBRE_KM : null), kit: !!(c.mod && c.mod.kit) };
      if (c.mod && c.mod.sku) {
        const pm = precios[c.mod.sku];
        fila0.precio = pm ? pm.price : null;
        fila0.d = pm ? pm.d : null;
        if (c.mod.sku === 'S+RJ10') {
          rj10++;
          if (!/fan/i.test(m.refrigeracion || '')) avisos.push(`S+RJ10 en un equipo de refrigeración pasiva (${m.id}): «${notas.pasiva || 'MikroTik no lo recomienda sin ventilación adicional'}»`);
        }
        if (c.mod.nota === '14') avisos.push(`${c.mod.sku} en la jaula SFP de ${m.id}: «${notas['14'] || ''}» (enlace ${e.n}).`);
        if (c.mod.kit) avisos.push(`Enlace ${e.n}, tramo de ${fmtKm(e.km)}: ningún módulo dúplex de esa velocidad llega y va con el ${c.mod.sku} (hasta ${fmtKm(c.mod.km)}). ${NOTA_BIDI}.`);
        if (c.mod.sku === 'S-RJ01' && m.compat === 'hEX S') avisos.push(`S-RJ01 en el hEX S: ${notas.rj01 || 'solo enlaza a 1 Gbps'}`);
      }
      if (c.mod && c.mod.consultar) avisos.push(`${m.id} no figura en la matriz oficial de compatibilidad: el módulo del enlace ${e.n} va «a consultar», no se elige por parecido con otro equipo.`);
      asig.push(fila0);
    }
    if (!miss.length && asig.length >= total) miss.push(`sus ${total} puertos quedan ocupados por los enlaces WAN y no queda ninguno para la LAN`);
    asig.sort((a, b) => a.enlace.n - b.enlace.n);
    return { asig, miss, avisos, libres: libres.length };
  }

  function motivoSinPuerto(e, todas, fila) {
    const rapida = todas.reduce((a, r) => Math.max(a, r.vel), 0);
    const d = `enlace ${e.n} (${MEDIOS_TXT[e.medio]}, ${fmt(e.vel)}${e.km ? `, ${fmtKm(e.km)}` : ''})`;
    // El enlace por defecto es el caso de un solo enlace de antes: se conserva su frase.
    if (rapida < e.vel) return e.porDefecto && e.medio === 'indiferente' ? `su puerto más rápido es de ${fmt(rapida)} por sentido` : `${d}: su puerto más rápido es de ${fmt(rapida)}`;
    if (e.km && e.medio !== 'indiferente') {
      const mods = todas.filter((r) => r.tipo === 'jaula' && r.vel >= e.vel).map((r) => moduloEn(e, r, fila)).filter(Boolean);
      const cortos = mods.filter((x) => x.sinAlcance != null);
      if (e.medio === 'cobre' && (mods.length ? mods.every((x) => x.sinAlcance != null) : e.km > ALCANCE_COBRE_KM)) return `${d}: el cobre llega a ${fmtKm(cortos.length ? Math.max(...cortos.map((x) => x.sinAlcance)) : ALCANCE_COBRE_KM)}${e.vel > 5000 ? ' a esa velocidad' : ''}; a esa distancia hace falta fibra`;
      if (mods.length && mods.every((x) => x.sinAlcance != null)) return `${d}: ningún módulo de la matriz llega a esa distancia a esa velocidad (el de más alcance, ${fmtKm(Math.max(...cortos.map((x) => x.sinAlcance)))})`;
    }
    const jaulas = todas.filter((r) => r.tipo === 'jaula');
    if (e.medio !== 'cobre' && e.medio !== 'indiferente' && !jaulas.length) return `${d}: no tiene jaulas SFP`;
    if (e.medio === 'cobre') {
      const rj = todas.filter((r) => r.tipo === 'rj' && r.vel >= e.vel);
      if (!rj.length) {
        const conMod = jaulas.map((r) => moduloEn(e, r, fila)).filter(Boolean);
        if (conMod.some((x) => x.prohibido)) return `${d}: no tiene puerto de cobre de ${fmt(e.mbps)} y la matriz oficial no admite el ${conMod.find((x) => x.prohibido).prohibido} en este equipo`;
        if (!conMod.length) return `${d}: no tiene puerto de cobre de esa velocidad ni jaula para un módulo RJ45`;
      }
    } else if (e.medio !== 'indiferente') {
      const conMod = jaulas.filter((r) => r.vel >= e.vel).map((r) => moduloEn(e, r, fila)).filter(Boolean);
      if (conMod.length && conMod.every((x) => x.prohibido)) return `${d}: la matriz oficial no admite el ${conMod[0].prohibido} en este equipo`;
      if (!conMod.length) return `${d}: no tiene jaula de esa velocidad para fibra`;
    }
    return `${d}: los puertos que le sirven ya llevan otros enlaces`;
  }

  /* Comportamiento del equipo con varios enlaces: lo que se configura en RouterOS. Son reglas de
     diseño, no cifras. */
  function comportamiento(enlaces) {
    const pr = enlaces.filter((e) => e.rol === 'principal');
    const re = enlaces.filter((e) => e.rol === 'respaldo');
    const L = [];
    if (pr.length > 1) L.push(`Balanceo: ${pr.length} enlaces principales activos a la vez (PCC o rutas ECMP en RouterOS). El caudal es la suma; si uno cae, el resto sigue y lleva lo que quepa en su velocidad.`);
    if (re.length) L.push(`Failover: el respaldo entra solo si cae un principal (rutas por defecto con distinta «distance» y comprobación del gateway por ping o rutas recursivas). Ocupa un puerto todo el tiempo, pero no suma caudal.`);
    if (pr.some((e) => e.tipo === 'mpls') && enlaces.some((e) => e.tipo === 'internet')) {
      L.push('MPLS e Internet: el tráfico corporativo va por la MPLS y la salida a Internet por el enlace de Internet. Si la MPLS cae y el respaldo es Internet, el tráfico corporativo cruza Internet cifrado (túnel IPsec hacia la sede central).');
    }
    return L;
  }

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

    /* CAUDAL, ENLACES Y SENTIDOS: UNA SOLA CADENA (2026-10-14, encargo del dueño: «todo debe estar
       sincronizado y unificado»). Antes eran tres fuentes que no se hablaban: el caudal del sitio
       con su margen, la velocidad de cada enlace sin margen y un ×2 que pisaba la subida declarada
       (un 1000/100 con el sitio a 1000 pedía 2 Gbps, no 1,1). Ahora:
         1. la demanda del sitio (por sentido, sin margen) es la velocidad de cada enlace que no
            declare la suya;
         2. los enlaces dan, por sentido, el peor escenario (normal o con un principal caído);
         3. «Sentidos simultáneos» decide qué se compara con la prueba «all port»: bajada + subida
            de ese escenario, o el sentido mayor;
         4. el margen de crecimiento multiplica lo que PROCESA el equipo (la celda de ruteo, la celda
            IPsec del respaldo y el tope de CHR), nunca el puerto: el puerto lleva el enlace tal
            como se contrata. */
    const demanda = modo === 'hub' ? raw * sedes * conc / 100 : raw;
    const base = demanda;
    const margen = 1 + head / 100;
    const { enlaces, avisos: avisosEnlaces } = normalizarEnlaces(esc.enlaces, demanda);
    const wan = escenariosWan(enlaces);
    const porSentido = wan.caudal * margen;
    const need = (dirMult === 2 ? wan.agregado : wan.caudal) * margen;
    // Sin caudal en el sitio ni en los enlaces no hay recomendación: es el dato mínimo.
    const hayCaudal = need > 0;
    // Respaldo cifrado: MPLS principal con respaldo de Internet. En la falla el tráfico corporativo
    // cruza Internet por IPsec, y esa celda también tiene que alcanzar, con los mismos sentidos y
    // el mismo margen que el resto.
    const respInternet = enlaces.filter((e) => e.rol === 'respaldo' && e.tipo === 'internet');
    const respaldoCifrado = enlaces.some((e) => e.rol === 'principal' && e.tipo === 'mpls') && respInternet.length > 0
      && esc.respaldoIpsec !== false && esc.respaldoIpsec !== 'false';
    const needIpsecRespaldo = respaldoCifrado ? Math.max(...respInternet.map((e) => (dirMult === 2 ? e.mbps + e.subida : e.vel))) * margen : 0;
    // El enlace más rápido es el que manda en el puerto (sin margen: es la velocidad contratada).
    const velEnlace = Math.max(0, ...enlaces.map((e) => e.vel));
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

    const avisos = [...avisosEnlaces];
    if (!(demanda > 0)) enlaces.filter((e) => e.porDefecto).forEach((e) => { if (enlaces.some((x) => !x.porDefecto)) avisos.push(`El enlace ${e.n} no declara velocidad y el sitio no tiene caudal: cuenta como 0 Mbps hasta que se escriba uno de los dos.`); });
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
      // Los enlaces, cada uno a su puerto con su módulo. Sin puertos transcritos (CHR), el tope
      // por sentido de antes contra el puerto más rápido.
      const puertos = m.ser !== 'CHR' ? asignarPuertos(m, enlaces, o) : null;
      if (puertos) miss.push(...puertos.miss);
      else if (m.ser !== 'CHR' && m.wanMax != null && velEnlace > m.wanMax) miss.push(`su puerto más rápido es de ${fmt(m.wanMax)} por sentido`);
      if (respaldoCifrado && perfil === 'ruteo') {
        const t = tuneles;
        const filaIp = m.pruebas && m.pruebas.ipsec && m.pruebas.ipsec[t] && m.pruebas.ipsec[t][cifrado];
        const capIp = filaIp ? celda(filaIp, bytesIpsec) : null;
        if (capIp == null) miss.push(`respaldo cifrado por Internet: la ficha no publica IPsec ${t === 'uno' ? 'con un túnel' : 'con 256 túneles'} y ${CIFRADOS[cifrado]}`);
        else if (capIp < needIpsecRespaldo) miss.push(`respaldo cifrado por Internet: IPsec ${fmt(capIp)} por debajo de ${fmt(needIpsecRespaldo)}`);
      }
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
      return { m, cap: r.cap, fila: r.fila || null, miss, feeds, puertos,
        ocupacion: r.cap ? (r.porSentido ? porSentido : need) / r.cap : null };
    }).filter(Boolean);

    // Right-sizing por COSTE, no por capacidad (decision anterior conservada): entre los que
    // cumplen gana el mas barato, y a igual precio el de MAS capacidad (RB5009 frente a RB4011,
    // los dos a $219). El medio solo reordena entre los que ya cumplen.
    const media = esc.media === 'fiber' || esc.media === 'copper' ? esc.media : 'any';
    const porMedio = (a, b) => media === 'fiber' ? fibra(b.m) - fibra(a.m) : media === 'copper' ? fibra(a.m) - fibra(b.m) : 0;
    const fit = rows.filter((r) => !r.miss.length).sort((a, b) => rango(a.m) - rango(b.m) || porMedio(a, b)
      || (a.m.elpN ?? Infinity) - (b.m.elpN ?? Infinity) || b.cap - a.cap || a.m.id.localeCompare(b.m.id, 'en', { numeric: true }));
    const pick = hayCaudal ? (fit.find((r) => recomendable(r.m)) || null) : null;

    // ── Avisos del escenario ──
    if (hayCaudal) {
      if (dirMult === 2 && perfil !== 'ipsec') avisos.push(`MikroTik publica la prueba «all port», que suma lo que reenvían todos los puertos: ${fmt(wan.baja)} de bajada y ${fmt(wan.sube)} de subida a la vez${head ? `, con el ${head} % de margen,` : ''} ocupan ${fmt(need)} de esa cifra. «Un solo sentido» compara solo el mayor.`);
      // Lo que el sitio pide frente a lo que entregan los enlaces: si no llegan, el cuello de
      // botella es el enlace y el equipo se dimensiona con lo que entregan, no con la demanda.
      if (demanda > 0 && enlaces.some((e) => !e.porDefecto)) {
        if (wan.normalBaja < demanda) avisos.push(`Los enlaces principales entregan ${fmt(wan.normalBaja)} de bajada y el sitio pide ${fmt(demanda)}: el enlace es el cuello de botella. El equipo se dimensiona con lo que entregan los enlaces (más el margen), no con la demanda.`);
        wan.fallas.filter((f) => f.baja < demanda && wan.normalBaja >= demanda).forEach((f) => avisos.push(`Si cae el enlace ${f.cae.n}, el sitio queda con ${fmt(f.baja)} de bajada, el ${Math.round(f.baja / demanda * 100)} % de lo que pide: servicio degradado mientras dure la falla.`));
      }
      if (dirMult === 2 && perfil === 'ipsec') avisos.push(`La ficha no dice si su cifra IPsec es por sentido o la suma de los dos: el ×2 (${fmt(need)}) es la lectura conservadora de esta página, y «Un solo sentido» la quita.`);
      if (perfil === 'ipsec' && tuneles === 'multi' && sedes > TUNELES_MEDIDOS) avisos.push(`Hub con ${sedes} sedes: MikroTik mide IPsec con ${TUNELES_MEDIDOS} túneles; por encima de esa cifra el rendimiento no está medido.`);
      if (perfil === 'ipsec' && tuneles === 'multi') avisos.push(`Hub IPsec: se dimensiona con la fila de 256 túneles, que en los CCR2116/CCR2216 duplica la de un túnel. Un solo túnel no se reparte entre núcleos: si el diseño concentra el tráfico en un túnel, vale la cifra de un túnel.`);
      if (perfil === 'wg') avisos.push('WireGuard: MikroTik no publica su rendimiento en ninguna ficha, así que no se recomienda equipo. Antes se estimaba en el 45 % del IPsec, un supuesto sin fuente que este dimensionador ya no aplica: validar con una prueba de concepto o dimensionar por IPsec.');
      if (virtual && perfil === 'ruteo') avisos.push('CHR: la licencia solo limita la subida por interfaz. El caudal real lo deciden los vCPU y la RAM que dé el hipervisor, y MikroTik no publica cifras de CHR: se compara el caudal por sentido con el tope de la licencia.');
      if (req.feeds) avisos.push(`BGP full table: la RAM por feed (${bgpRam.firstFeedMb} MB el primero y ${bgpRam.extraFeedMb} MB cada uno adicional, más ${bgpRam.baseMb} MB de sistema) es un SUPUESTO DE DISEÑO, no una cifra de MikroTik: ninguna ficha publica cuánta memoria ocupa una tabla completa.`);
      if (req.poeW) avisos.push(`PoE para ${req.aps} AP: ${req.poeW} W con el consumo máximo sin accesorios de la ficha del AP. Solo el RB5009UPr publica vatios de PoE-out (130 W); el resto publica corriente, que depende de la tensión de entrada.`);
      if (esc.ha) avisos.push('Alta disponibilidad VRRP: se cotizan 2 equipos y cada uno se dimensiona al caudal completo, porque el par suma disponibilidad y no capacidad. Cada unidad lleva su propia licencia RouterOS embebida.');
      if (enlaces.length > 1 || wan.gobierna) {
        const esc0 = `Caudal WAN: ${fmt(wan.normal)} con todos los principales${wan.fallas.length ? '; ' + wan.fallas.map((f) => `si cae el enlace ${f.cae.n}, ${fmt(f.mbps)} con el respaldo`).join('; ') : ''}.`;
        avisos.push(esc0 + (wan.gobierna ? ` Gobierna la falla del enlace ${wan.gobierna.cae.n}: el respaldo es más rápido que lo que sustituye y en ese escenario el equipo reenvía ${fmt(wan.gobierna.mbps)}.` : ''));
        avisos.push(...comportamiento(enlaces));
      }
      if (respaldoCifrado && perfil === 'ruteo') avisos.push(`Respaldo cifrado: con la MPLS caída el tráfico corporativo cruza Internet por IPsec. Cada equipo se comprueba además con su celda IPsec (${tuneles === 'uno' ? 'un túnel' : '256 túneles'}, ${CIFRADOS[cifrado]}, ${bytesIpsec} B) contra ${fmt(needIpsecRespaldo)}. Si el respaldo no se cifra, desmárquelo.`);
      if (enlaces.some((e) => e.medio === 'indiferente') && enlaces.length > 1) avisos.push('Hay enlaces sin entrega definida (cobre o fibra): se les busca un puerto de su velocidad, pero no se recomienda módulo hasta saber qué entrega el operador.');
      if (trama === 64) avisos.push('Paquetes de 64 B: es el peor caso que publica MikroTik (VoIP pura, juegos, DDoS). Un tráfico real mezcla tamaños: si el perfil no es ese, la columna de 512 B es la más cercana a un tráfico mixto.');
    }

    return { raw, base, porSentido, need, head, dirMult, trama, bytesIpsec, perfil, cifrado, tuneles, modo, sedes, conc,
      virtual, configs: c.cfg, firewall: c.firewall, l3hw: c.l3hw, req, rows, fit, pick,
      enlaces, wan, respaldoCifrado, needIpsecRespaldo, demanda, margen, velEnlace, hayCaudal,
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
    L.push(`| Demanda del sitio | ${ev.modo === 'hub' ? `${ev.sedes} sedes × ${fmt(ev.raw)} × ${ev.conc} % de simultaneidad` : 'caudal del sitio, por sentido'} | ${ev.demanda > 0 ? fmt(ev.demanda) : 'sin dato: mandan los enlaces'} |`);
    L.push(`| Enlaces WAN | peor escenario (normal o con un principal caído); un enlace sin velocidad toma la demanda | ${fmt(ev.wan.baja)} de bajada / ${fmt(ev.wan.sube)} de subida |`);
    L.push(`| Sentidos | ${ev.dirMult === 2 ? 'los dos a la vez: bajada + subida (la prueba «all port» suma todos los puertos)' : 'uno solo: el sentido mayor'} | ${fmt(ev.dirMult === 2 ? ev.wan.agregado : ev.wan.caudal)} |`);
    L.push(`| Margen de crecimiento | +${ev.head} % sobre lo que procesa el equipo (no sobre el puerto) | **${fmt(ev.need)}** (${fmt(ev.porSentido)} por sentido) |`);
    if (ev.perfil === 'ruteo') L.push(`| Fila de la tabla | ${ev.configs.map((k) => CONFIGS[k]).join(' y ')} | ${TRAMAS[ev.trama].n} |`);
    if (ev.perfil === 'ipsec') L.push(`| Fila de la tabla | IPsec ${ev.tuneles === 'uno' ? 'un túnel' : '256 túneles'}, ${CIFRADOS[ev.cifrado]} | ${ev.bytesIpsec} B |`);
    const r = ev.req;
    if (r.feeds) L.push(`| BGP full table | ${r.feeds} feed(s), supuesto de RAM declarado | ${(ramParaFeeds(r.feeds, c.bgpRam || { baseMb: 384, firstFeedMb: 1200, extraFeedMb: 900 }) / 1024).toFixed(1)} GB |`);
    if (r.ppp) L.push(`| Túneles PPPoE/PPTP/L2TP | tope por nivel de licencia | ${r.ppp} |`);
    if (r.ovpn) L.push(`| Túneles OpenVPN | tope por nivel de licencia | ${r.ovpn} |`);
    if (r.hotspot) L.push(`| Usuarios HotSpot | tope por nivel de licencia | ${r.hotspot} |`);
    if (r.poeW) L.push(`| PoE para ${r.aps} AP | consumo máximo sin accesorios × AP | ${r.poeW} W |`);
    L.push('');
    if (ev.enlaces && ev.enlaces.length) {
      L.push('### Enlaces WAN');
      L.push('');
      L.push('| Enlace | Tipo | Rol | Entrega | Bajada / subida | Tramo | Puerto del equipo | Módulo (alcance) |');
      L.push('|---|---|---|---|---|---|---|---|');
      const asig = fila && fila.puertos ? fila.puertos.asig : [];
      ev.enlaces.forEach((e) => {
        const a = asig.find((x) => x.enlace.n === e.n);
        const mod = !a ? '—' : a.sku ? `${a.sku}${a.alcance ? ` (hasta ${fmtKm(a.alcance)})` : ''}${a.kit ? ', BiDi' : ''}` : a.consultar ? 'a consultar (equipo fuera de la matriz)' : (e.medio === 'indiferente' && a.puerto.startsWith('jaula') ? 'según la entrega del operador' : 'no lleva');
        L.push(`| ${e.n} | ${TIPOS_ENLACE[e.tipo]} | ${ROLES[e.rol]} | ${MEDIOS[e.medio]} | ${fmt(e.mbps)}${e.porDefecto ? ' (la del sitio)' : ''} / ${e.asimetrico ? fmt(e.subida) : 'igual'} | ${e.km ? fmtKm(e.km) : 'sin dato'} | ${a ? a.puerto : '—'} | ${mod} |`);
      });
      L.push('');
      if (ev.wan && ev.wan.fallas.length) {
        L.push(`Escenarios: normal ${fmt(ev.wan.normal)}; ${ev.wan.fallas.map((f) => `cae el enlace ${f.cae.n}: ${fmt(f.mbps)}`).join('; ')}. Se dimensiona con ${fmt(ev.wan.caudal)}.`);
        L.push('');
      }
      if (fila && fila.puertos && fila.puertos.avisos.length) { fila.puertos.avisos.forEach((x) => L.push(`- ${x}`)); L.push(''); }
      L.push('_Módulos de la matriz oficial «MikroTik wired interface compatibility» (manual.mikrotik.com, RouterOS 7.25): solo se recomienda lo que la matriz marca como soportado en el equipo._');
      L.push('');
    }
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
    L.push('_Cifras de las fichas oficiales de mikrotik.com (pruebas RFC 2544 con equipo Xena, «all port test»). Precios: «Suggested price» de la ficha (USD), sin impuestos ni descuento de canal. La RAM por feed BGP, la suma de los dos sentidos y el margen de crecimiento son supuestos de diseño declarados, no cifras de MikroTik._');
    return L.join('\n');
  }

  function fmt(v) {
    if (v == null) return '—';
    if (v >= 999999) return 'Sin tope';
    if (v >= 1000) return (v / 1000).toFixed(v % 1000 ? 1 : 0) + ' Gbps';
    return Math.round(v) + ' Mbps';
  }

  return { TRAMAS, TRAMA_DEFECTO, CONFIGS, FIREWALL, CIFRADOS, PERFILES, TUNELES_MEDIDOS,
    TIPOS_ENLACE, ROLES, MEDIOS, MAX_ENLACES, MODULOS, NOTA_BIDI, ALCANCE_COBRE_KM,
    configuraciones, evaluar, memoria, maxFeeds, ramParaFeeds, fmt,
    normalizarEnlaces, escenariosWan, asignarPuertos, comportamiento, etiquetaEnlace };
});
