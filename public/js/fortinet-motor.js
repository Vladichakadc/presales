'use strict';
/* global module, require */
/* ══ MOTOR DEL DIMENSIONADOR FORTIGATE — UNA SOLA FUENTE DE VERDAD (etapa 7, 2026-09-23) ══
   Sale del «Informe de auditoria y propuesta de rediseno dinamico del modulo Fortinet
   Presales» (23-sep-2026). Su dictamen: el motor multieje acertaba, pero la recomendacion,
   el selector manual, el BOM y los botones de salida vivian en ESTADOS DISTINTOS de la misma
   pagina, y por las costuras se colaba una cotizacion invalida:
     F01  se elegia un 40F a mano, el panel seguia diciendo 90G y el BOM cotizaba el 40F con
          Excel, copiar y cotizador habilitados;
     F02  SSL-VPN se aceptaba sin preguntar la version de FortiOS;
     F03  con HA marcado la cantidad se podia bajar a 1;
     F04  «Enviar al cotizador» no obedecia a la puerta — la puerta deshabilitaba un id que el
          boton no tenia.
   Los cuatro son el MISMO defecto: varias verdades. La correccion no es parchear cuatro
   sitios sino que haya uno solo.

   QUE ES ESTE MODULO. Una funcion pura, `evaluar(escenario, catalogo)`, que devuelve TODO lo
   que la pagina pinta y todo lo que cualquier salida comercial necesita: requisitos por eje
   con su escenario gobernante, candidatos elegibles y descartados con su motivo, la
   recomendacion y su shortlist, el modelo VALIDADO (que es el unico del que se construye el
   BOM), las lineas del BOM, la puerta de cotizacion y la huella del escenario. El grafico, la
   ficha, la lista de materiales, Excel, copiar, perfiles, consolidado y cotizador leen ese
   resultado; ninguno recalcula nada por su cuenta.

   Y ES EL MISMO CODIGO EN LOS DOS LADOS. Patron UMD como `fortinet-reglas.js`: en el navegador
   da la respuesta instantanea mientras se escribe; en el servidor (`POST
   /api/v1/fortinet/evaluations`) es la autoridad que decide si una salida comercial puede
   salir. Dos implementaciones de la misma regla terminan divergiendo —es como `llevarABom`
   acabo en seis copias— y aqui divergir significa que el navegador aprueba lo que el
   servidor no. Con un solo archivo, la unica forma de que discrepen es que el escenario o el
   catalogo sean distintos, y eso lo detecta la huella.

   LO QUE NO HACE, A PROPOSITO. No aplica factores de penalizacion que no esten publicados
   (proxy, SIP, logging, HA activo-activo...): donde la cifra no existe, lo declara y baja la
   confianza. No completa un dato que el catalogo no trae: `null` aparta o se declara, nunca
   se lee como cero ni como ilimitado. */
(function (root, factory) {
  let R = root && root.FortinetReglas;
  if (!R && typeof require === 'function') R = require('./fortinet-reglas.js');
  const api = factory(R);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FortinetMotor = api;
}(typeof window !== 'undefined' ? window : globalThis, function (R) {

  const VERSION_MOTOR = '7.0.0';
  const ESQUEMA = 1;
  // Encapsulacion ESP sobre la fraccion que viaja por el overlay. Supuesto de la herramienta,
  // no una cifra de Fortinet, y por eso se declara en `supuestos` en cada evaluacion.
  const OVERHEAD_ESP = 0.06;
  // Coincidencia por subcadena: los `seg` del catalogo son una veintena de cadenas distintas.
  const SEG_MATCH = { branch: /SOHO|Sucursal|Teletrabajo/i, campus: /Campus/i, dc: /DC|Carrier|Hyperscale/i };
  const TIPOS_WAN = ['MPLS L3', 'MPLS L2', 'DIA', 'Banda Ancha', '4G/5G'];
  const TIPOS_PUERTO = [
    { k: 'rj45_1g', n: 'RJ45 1 GE', medio: 'RJ45', vel: 1 },
    { k: 'rj45_10g', n: 'RJ45 10 GE', medio: 'RJ45', vel: 10 },
    { k: 'sfp_1g', n: 'SFP 1 GE', medio: 'SFP', vel: 1 },
    { k: 'sfpp_10g', n: 'SFP+ 10 GE', medio: 'SFP+', vel: 10 },
    { k: 'sfp28_25g', n: 'SFP28 25 GE', medio: 'SFP28', vel: 25 },
    { k: 'qsfp28_100g', n: 'QSFP28 100 GE', medio: 'QSFP28', vel: 100 },
  ];

  /* ── 1 · HUELLA: SHA-256 SOBRE UN JSON CANONICO ────────────────────────────────────────
     Sincrona y en JavaScript puro a proposito. `crypto.subtle` es asincrono y solo existe en
     contexto seguro; la huella se calcula en cada tecla y tiene que ser IDENTICA en el
     navegador y en Node, porque es lo que el servidor compara para confirmar que evaluo el
     mismo escenario que el usuario ve. La prueba la contrasta contra `crypto` de Node. */
  const K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  function utf8(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        const d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  function sha256(str) {
    const b = utf8(String(str));
    const bits = b.length * 8;
    b.push(0x80);
    while (b.length % 64 !== 56) b.push(0);
    const hi = Math.floor(bits / 0x100000000);
    const lo = bits >>> 0;
    b.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
      (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const W = new Array(64);
    for (let o = 0; o < b.length; o += 64) {
      for (let t = 0; t < 16; t++) {
        W[t] = (b[o + 4 * t] << 24) | (b[o + 4 * t + 1] << 16) | (b[o + 4 * t + 2] << 8) | b[o + 4 * t + 3];
      }
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      let [a, bb, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K256[t] + W[t]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & bb) ^ (a & c) ^ (bb & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  // JSON canonico: claves ordenadas, sin `undefined`. Dos escenarios que solo difieren en el
  // orden en que se escribieron sus campos tienen que dar la misma huella.
  function canon(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'number') return Number.isFinite(v) ? JSON.stringify(v) : 'null';
    if (typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
    return `{${Object.keys(v).filter((k) => v[k] !== undefined).sort()
      .map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  }
  const huella = (obj) => `sha256:${sha256(canon(obj))}`;

  /* ── 2 · ESQUEMA DEL ESCENARIO ────────────────────────────────────────────────────────
     El escenario es un objeto tipado y versionado. Se valida IGUAL en el navegador y en el
     servidor: tipos, rangos y enumeraciones, y un campo desconocido es un ERROR, no se
     ignora — un campo que el motor no lee pero el usuario cree que envio es la forma mas
     silenciosa de dimensionar otra cosa. Ningun resultado calculado entra aqui. */
  const E = (vals) => ({ t: 'enum', vals });
  const N = (min, max) => ({ t: 'num', min, max });
  const I = (min, max) => ({ t: 'int', min, max });
  const B = { t: 'bool' };
  const TX = (max) => ({ t: 'texto', max });
  const L = (vals) => ({ t: 'lista', vals });
  const FUNCIONES_ID = ['chkAv', 'chkWeb', 'chkIotDlp', 'chkSsl', 'chkSandbox'];
  const ESQ = {
    esquema: I(1, 1),
    sitio: { segmento: E(['branch', 'campus', 'dc']) },
    software: { fortiOS: E(['7.4', '7.6.0-7.6.2', '7.6.3+']), inspeccion: E(['flow', 'proxy']) },
    topologia: { rol: E(['none', 'spoke', 'hub']), enlaces: { t: 'enlaces' }, hubs: I(1, 100000),
      spokes: I(1, 100000), simultaneidadPct: N(0, 100) },
    trafico: { interVlanMbps: N(0, 1e8), picosNoConcurrentes: B },
    seguridad: { capa: E(['fw', 'vpn', 'ips', 'ngfw', 'tp']), funciones: L(FUNCIONES_ID),
      tlsCifradoPct: N(0, 100), tlsExentoPct: N(0, 90) },
    remoto: { activo: B, metodo: E(['ipsec', 'sslvpn']), usuarios: I(0, 1e7), mbps: N(0, 1e8), mfa: B },
    escala: { usuarios: I(0, 1e8), sesionesPorUsuario: I(0, 1e5), sesionesMedidas: I(0, 1e11),
      vidaSesionS: I(1, 86400), cpsMedido: I(0, 1e10), vdoms: I(0, 100000),
      fortiAps: I(0, 1e6), fortiSwitches: I(0, 1e6) },
    fisico: {
      puertos: Object.fromEntries(TIPOS_PUERTO.map((p) => [p.k, I(0, 10000)])),
      poeW: N(0, 1e6), psuRedundante: B,
      registro: E(['ninguno', 'local', 'nube', 'faz', 'syslog']), registroGbDia: N(0, 1e7), registroDias: I(0, 3650),
    },
    disponibilidad: { modo: E(['standalone', 'ha-ap', 'ha-aa']) },
    politica: { crecimientoPct: N(0, 1000), techoPct: N(10, 100) },
    comercial: {
      motivo: E(['nueva', 'renovacion', 'ampliacion', 'coterm']), anios: E([1, 3, 5]),
      bundle: E(['ent', 'utp', 'atp', 'none']), soporte: E(['fc247', 'fcpre', 'fcelite', 'none']),
      converter: B, sdwan: L(['sdwanMon', 'sdwanOrq', 'sdwanSase']),
      emsActivo: B, emsEndpoints: I(0, 1e7),
      sandbox: E(['ninguno', 'incluido', 'ai', 'dedicado']), sandboxModalidad: E(['', 'appliance', 'vm', 'cloud']),
      saseUsuarios: I(0, 1e7), serieInstalada: TX(120), justificacionEol: TX(500),
    },
    seleccion: { manual: { t: 'idModelo' } },
  };
  const POR_DEFECTO = {
    esquema: ESQUEMA,
    sitio: { segmento: 'branch' },
    software: { fortiOS: '7.6.3+', inspeccion: 'flow' },
    topologia: { rol: 'none', enlaces: [], hubs: 1, spokes: 1, simultaneidadPct: 35 },
    trafico: { interVlanMbps: 0, picosNoConcurrentes: false },
    seguridad: { capa: 'tp', funciones: [], tlsCifradoPct: 100, tlsExentoPct: 0 },
    remoto: { activo: false, metodo: 'ipsec', usuarios: 0, mbps: 0, mfa: false },
    escala: { usuarios: 0, sesionesPorUsuario: 0, sesionesMedidas: 0, vidaSesionS: 30, cpsMedido: 0,
      vdoms: 0, fortiAps: 0, fortiSwitches: 0 },
    fisico: { puertos: Object.fromEntries(TIPOS_PUERTO.map((p) => [p.k, 0])), poeW: 0, psuRedundante: false,
      registro: 'ninguno', registroGbDia: 0, registroDias: 0 },
    disponibilidad: { modo: 'standalone' },
    politica: { crecimientoPct: 30, techoPct: 100 },
    comercial: { motivo: 'nueva', anios: 3, bundle: 'ent', soporte: 'fcpre', converter: false, sdwan: [],
      emsActivo: false, emsEndpoints: 0, sandbox: 'ninguno', sandboxModalidad: '', saseUsuarios: 0,
      serieInstalada: '', justificacionEol: '' },
    seleccion: { manual: null },
  };
  const clonar = (o) => JSON.parse(JSON.stringify(o));

  function validarHoja(def, v, ruta, errores) {
    const err = (codigo, detalle) => { errores.push({ codigo, campo: ruta, mensaje: detalle }); return undefined; };
    switch (def.t) {
      case 'enum':
        if (!def.vals.includes(v)) {
          // Numeros que llegan como texto desde un <select>: '3' es 3.
          const n = Number(v);
          if (typeof v === 'string' && v !== '' && def.vals.includes(n)) return n;
          return err('fuera-de-rango', `valor no admitido: ${JSON.stringify(v)}`);
        }
        return v;
      case 'num':
      case 'int': {
        const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
        if (typeof n !== 'number' || !Number.isFinite(n)) return err('tipo-invalido', `se esperaba un número y llegó ${JSON.stringify(v)}`);
        if (def.t === 'int' && !Number.isInteger(n)) return err('tipo-invalido', `se esperaba un entero y llegó ${n}`);
        if (n < def.min || n > def.max) return err('fuera-de-rango', `${n} fuera de [${def.min}, ${def.max}]`);
        return n;
      }
      case 'bool':
        if (typeof v !== 'boolean') return err('tipo-invalido', `se esperaba verdadero/falso y llego ${JSON.stringify(v)}`);
        return v;
      case 'texto':
        if (typeof v !== 'string') return err('tipo-invalido', 'se esperaba texto');
        if (v.length > def.max) return err('fuera-de-rango', `texto de más de ${def.max} caracteres`);
        return v.trim();
      case 'lista':
        if (!Array.isArray(v)) return err('tipo-invalido', 'se esperaba una lista');
        for (const x of v) if (!def.vals.includes(x)) return err('fuera-de-rango', `valor no admitido en la lista: ${JSON.stringify(x)}`);
        return [...new Set(v)].sort();
      case 'idModelo':
        if (v === null || v === '') return null;
        if (typeof v !== 'string' || v.length > 60) return err('tipo-invalido', 'identificador de modelo invalido');
        return v;
      case 'enlaces': {
        if (!Array.isArray(v)) return err('tipo-invalido', 'se esperaba la lista de enlaces');
        if (v.length > 32) return err('fuera-de-rango', 'más de 32 enlaces');
        const out = [];
        v.forEach((l, i) => {
          const r = `${ruta}[${i}]`;
          if (!l || typeof l !== 'object') { errores.push({ codigo: 'tipo-invalido', campo: r, mensaje: 'enlace invalido' }); return; }
          for (const k of Object.keys(l)) {
            if (!['id', 'tipo', 'down', 'overlay', 'rol'].includes(k)) errores.push({ codigo: 'campo-desconocido', campo: `${r}.${k}`, mensaje: 'campo no reconocido' });
          }
          const tipo = validarHoja(E(TIPOS_WAN), l.tipo, `${r}.tipo`, errores);
          const down = validarHoja(N(0, 1e8), l.down == null ? 0 : l.down, `${r}.down`, errores);
          const overlay = validarHoja(B, !!l.overlay, `${r}.overlay`, errores);
          const rol = validarHoja(E(['activo', 'respaldo']), l.rol == null ? 'activo' : l.rol, `${r}.rol`, errores);
          const id = validarHoja(I(0, 1e9), l.id == null ? i + 1 : l.id, `${r}.id`, errores);
          out.push({ id, tipo, down, overlay, rol });
        });
        return out;
      }
      default:
        return err('tipo-invalido', 'definición desconocida');
    }
  }
  function validarRama(def, entrada, base, ruta, errores) {
    const out = {};
    const e = entrada && typeof entrada === 'object' && !Array.isArray(entrada) ? entrada : {};
    if (entrada != null && (typeof entrada !== 'object' || Array.isArray(entrada))) {
      errores.push({ codigo: 'tipo-invalido', campo: ruta || '(raiz)', mensaje: 'se esperaba un objeto' });
    }
    for (const k of Object.keys(e)) {
      if (!(k in def)) errores.push({ codigo: 'campo-desconocido', campo: ruta ? `${ruta}.${k}` : k, mensaje: 'campo no reconocido: el motor no lo lee' });
    }
    for (const [k, d] of Object.entries(def)) {
      const r = ruta ? `${ruta}.${k}` : k;
      if (d && d.t) {
        if (e[k] === undefined) { out[k] = clonar(base[k]); continue; }
        const v = validarHoja(d, e[k], r, errores);
        out[k] = v === undefined ? clonar(base[k]) : v;
      } else {
        out[k] = validarRama(d, e[k], base[k], r, errores);
      }
    }
    return out;
  }

  /* ── 3 · REGLAS DE DEPENDENCIA DEL FORMULARIO, COMO DATOS ─────────────────────────────
     Cada regla dice cuando un campo APLICA (`visible`), cuando es obligatorio (`requerido`) y
     que ejes o lineas toca (`afecta`). Las lee la pagina para mostrar u ocultar, y las aplica
     este motor para excluir del calculo y de la huella lo que no aplica: un valor oculto se
     CONSERVA en el formulario para que el usuario lo recupere si reactiva la opcion, pero no
     cuenta. Que las dos cosas salgan de la misma tabla es lo que impide que la pantalla
     esconda un campo que el motor sigue sumando -que es exactamente F09-. */
  const tlsActivo = (s) => s.seguridad.funciones.includes('chkSsl');
  const conSdwan = (s) => s.topologia.rol !== 'none';
  const REGLAS = [
    { campo: 'topologia.hubs', visible: (s) => s.topologia.rol === 'spoke', afecta: ['tunGw'] },
    { campo: 'topologia.spokes', visible: (s) => s.topologia.rol === 'hub', afecta: ['caudal', 'tunGw'] },
    { campo: 'topologia.simultaneidadPct', visible: (s) => s.topologia.rol === 'hub', afecta: ['caudal'] },
    { campo: 'comercial.sdwan', visible: conSdwan, afecta: ['bom'] },
    { campo: 'comercial.saseUsuarios', visible: (s) => conSdwan(s) && s.comercial.sdwan.includes('sdwanSase'),
      requerido: (s) => conSdwan(s) && s.comercial.sdwan.includes('sdwanSase'), afecta: ['bom'] },
    { campo: 'remoto.metodo', visible: (s) => s.remoto.activo, afecta: ['vpn', 'tunCli', 'sslVpnUsers', 'sslVpn'] },
    { campo: 'remoto.usuarios', visible: (s) => s.remoto.activo, requerido: (s) => s.remoto.activo,
      afecta: ['tunCli', 'sslVpnUsers', 'sess', 'tokens'] },
    { campo: 'remoto.mbps', visible: (s) => s.remoto.activo, afecta: ['caudal', 'vpn', 'sslVpn'] },
    { campo: 'remoto.mfa', visible: (s) => s.remoto.activo, afecta: ['tokens'] },
    { campo: 'seguridad.tlsCifradoPct', visible: tlsActivo, afecta: ['ssl'] },
    { campo: 'seguridad.tlsExentoPct', visible: tlsActivo, afecta: ['ssl'] },
    { campo: 'fisico.registroGbDia', visible: (s) => ['local', 'faz'].includes(s.fisico.registro),
      requerido: (s) => s.fisico.registro === 'local', afecta: ['almacenamiento', 'bom'] },
    { campo: 'fisico.registroDias', visible: (s) => s.fisico.registro === 'local',
      requerido: (s) => s.fisico.registro === 'local', afecta: ['almacenamiento'] },
    { campo: 'comercial.emsEndpoints', visible: (s) => s.comercial.emsActivo, requerido: (s) => s.comercial.emsActivo, afecta: ['bom'] },
    { campo: 'comercial.sandbox', visible: (s) => s.seguridad.funciones.includes('chkSandbox'), afecta: ['bom'] },
    { campo: 'comercial.sandboxModalidad', visible: (s) => s.seguridad.funciones.includes('chkSandbox') && s.comercial.sandbox === 'dedicado',
      requerido: (s) => s.seguridad.funciones.includes('chkSandbox') && s.comercial.sandbox === 'dedicado', afecta: ['bom'] },
    { campo: 'comercial.serieInstalada', visible: (s) => ['renovacion', 'coterm'].includes(s.comercial.motivo),
      requerido: (s) => ['renovacion', 'coterm'].includes(s.comercial.motivo), afecta: ['bom'] },
    { campo: 'comercial.justificacionEol', visible: (s, ctx) => s.comercial.motivo !== 'nueva' && !!(ctx && ctx.manualEsEol),
      requerido: (s, ctx) => s.comercial.motivo !== 'nueva' && !!(ctx && ctx.manualEsEol), afecta: ['puerta'] },
  ];
  const leerRuta = (o, ruta) => ruta.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const ponerRuta = (o, ruta, v) => {
    const ks = ruta.split('.');
    const ult = ks.pop();
    ks.reduce((a, k) => a[k], o)[ult] = v;
  };
  const vacio = (v) => v == null || v === '' || v === 0 || (Array.isArray(v) && !v.length);

  /* Normaliza y valida. Devuelve el escenario con los campos que no aplican llevados a su
     valor neutro (y listados en `inactivos`), los obligatorios que faltan y los errores. */
  function normalizar(entrada, catalogo) {
    const errores = [];
    const s = validarRama(ESQ, entrada, POR_DEFECTO, '', errores);
    // FortiSandbox como FUNCION y el sandbox como LINEA son el mismo pedido: sin la funcion
    // marcada no hay linea, y con ella marcada sin modo elegido se asume la cobertura del
    // bundle, que es lo que la pagina hacia hasta ahora (no anadia linea).
    if (!s.seguridad.funciones.includes('chkSandbox')) s.comercial.sandbox = 'ninguno';
    else if (s.comercial.sandbox === 'ninguno') s.comercial.sandbox = 'incluido';
    const modelos = (catalogo && catalogo.models) || [];
    const manual = s.seleccion.manual ? modelos.find((m) => m.id === s.seleccion.manual) : null;
    if (s.seleccion.manual && modelos.length && !manual) {
      errores.push({ codigo: 'modelo-desconocido', campo: 'seleccion.manual',
        mensaje: `«${s.seleccion.manual}» no es un modelo del catálogo vigente` });
    }
    const ctx = { manualEsEol: !!(manual && (manual.eol || !manual.hwSku)) };
    const inactivos = [];
    const faltan = [];
    // `campos` es la misma tabla vista desde la pagina: que se ve, que es obligatorio y que
    // falta. La pagina NO vuelve a evaluar las reglas por su cuenta —pinta esto—, asi que no
    // puede esconder un campo que el motor sigue sumando ni pedir uno que el motor ignora.
    const campos = {};
    for (const r of REGLAS) {
      const visible = !!r.visible(s, ctx);
      if (!visible) {
        const neutro = leerRuta(POR_DEFECTO, r.campo);
        if (JSON.stringify(leerRuta(s, r.campo)) !== JSON.stringify(neutro)) inactivos.push(r.campo);
        ponerRuta(s, r.campo, clonar(neutro));
      }
      const requerido = visible && !!(r.requerido && r.requerido(s, ctx));
      const falta = requerido && vacio(leerRuta(s, r.campo));
      if (falta) faltan.push(r.campo);
      campos[r.campo] = { visible, requerido, falta, afecta: (r.afecta || []).slice() };
    }
    if (!conSdwan(s)) s.topologia.enlaces = s.topologia.enlaces.map((l) => ({ ...l, overlay: false }));
    return { snapshot: s, errores, inactivos, faltan, campos, ctx };
  }

  /* ── 4 · ESCENARIOS DE TRAFICO (F05) ──────────────────────────────────────────────────
     Sumar las bajadas de todos los enlaces solo es correcto si todos estan activos y sus
     picos coinciden. Un enlace de RESPALDO no suma en operacion normal: entra cuando cae
     uno activo, y entonces la carga que migra puede cambiar de camino -de breakout local a
     overlay cifrado- aunque el caudal total baje. Por eso la demanda de cada eje es el
     MAXIMO entre escenarios, no la de uno solo:
       · normal    los enlaces activos a su pico;
       · falla:X   cae el enlace activo X y su carga migra a los de respaldo, hasta su
                   capacidad; lo que no cabe se pierde (degradacion), NO se reparte sobre
                   los otros activos, que ya se declararon a su pico;
       · failover  en HA un nodo procesa la carga completa. En activo-pasivo coincide con
                   la normal -el cluster no suma capacidad- y se lista para decirlo. */
  function escenariosTrafico(s) {
    const enl = s.topologia.enlaces.filter((l) => l.down > 0);
    const act = enl.filter((l) => l.rol !== 'respaldo');
    const resp = enl.filter((l) => l.rol === 'respaldo');
    const suma = (arr) => arr.reduce((a, l) => a + l.down, 0);
    const out = [{ id: 'normal', n: 'Operación normal', caudal: suma(act), overlay: suma(act.filter((l) => l.overlay)), perdida: 0 }];
    if (resp.length) {
      act.forEach((L) => {
        let pendiente = L.down;
        let caudal = out[0].caudal - L.down;
        let overlay = out[0].overlay - (L.overlay ? L.down : 0);
        for (const Bk of resp) {
          const mover = Math.min(pendiente, Bk.down);
          caudal += mover;
          if (Bk.overlay) overlay += mover;
          pendiente -= mover;
        }
        const i = s.topologia.enlaces.indexOf(L) + 1;
        out.push({ id: `falla:${L.id}`, n: `Falla del enlace ${i} (${L.tipo})`, caudal, overlay, perdida: pendiente });
      });
    }
    if (s.disponibilidad.modo !== 'standalone') {
      out.push({ id: 'failover-ha', n: 'Failover HA: un nodo con toda la carga',
        caudal: out[0].caudal, overlay: out[0].overlay, perdida: 0, igualANormal: true });
    }
    return out;
  }

  /* Demanda por eje de UN escenario de trafico. Es la traduccion que la pagina hacia en
     `demandasDe`, movida aqui sin cambiar su aritmetica: la escalera de contrastes
     (scripts/contrastes/fortinet*.js) se midio con ella y tiene que seguir dando lo mismo. */
  function demandaDeEscenario(s, esc, capa) {
    const g = s.politica.crecimientoPct / 100;
    const hub = s.topologia.rol === 'hub';
    const caudalSitio = hub ? esc.caudal * s.topologia.spokes * (s.topologia.simultaneidadPct / 100) : esc.caudal;
    // La fraccion cifrada se redondea al porcentaje entero, como la calculaba el builder: es
    // parte de la aritmetica medida por la linea base de los contrastes.
    const frac = !conSdwan(s) || !esc.caudal ? 0 : Math.round((esc.overlay / esc.caudal) * 100) / 100;
    const trafico = R.demandaTrafico({ internet: caudalSitio, interVlan: s.trafico.interVlanMbps,
      crecimiento: g, picosNoConcurrentes: s.trafico.picosNoConcurrentes });
    const remoto = s.remoto.activo ? s.remoto.mbps * (1 + g) : 0;
    const baseNeed = trafico.previsto + remoto;
    const effectiveNeed = baseNeed * (1 + frac * OVERHEAD_ESP);
    const d = {};
    d[capa.k] = effectiveNeed;
    const ipsec = (frac > 0 ? (effectiveNeed - remoto) * frac : 0) + (s.remoto.metodo === 'ipsec' ? remoto : 0);
    if (ipsec > 0) d.vpn = Math.max(d.vpn || 0, ipsec);
    // TLS realmente inspeccionado = trafico elegible x fraccion cifrada x fraccion NO exenta.
    if (tlsActivo(s)) d.ssl = effectiveNeed * (s.seguridad.tlsCifradoPct / 100) * (1 - s.seguridad.tlsExentoPct / 100);
    return { d, trafico, caudalSitio, frac, remoto, baseNeed, effectiveNeed };
  }

  // Ejes que no dependen del camino del trafico: sesiones, CPS, tuneles, VDOM y el Fabric.
  function demandaDeEscala(s) {
    const g = s.politica.crecimientoPct / 100;
    const d = {};
    const usuariosRemotos = s.remoto.activo ? s.remoto.usuarios : 0;
    // Las sesiones medidas mandan sobre las estimadas, y el crecimiento se aplica UNA vez a
    // las dos (hasta el 2026-09-23 la cifra forzada entraba sin crecimiento).
    const sess = s.escala.sesionesMedidas
      ? Math.round(s.escala.sesionesMedidas * (1 + g))
      : Math.round((s.escala.usuarios + usuariosRemotos) * s.escala.sesionesPorUsuario * (1 + g));
    const cps = s.escala.cpsMedido ? Math.round(s.escala.cpsMedido * (1 + g))
      : (sess ? Math.round(sess / s.escala.vidaSesionS) : 0);
    if (sess) d.sess = sess;
    if (cps) d.cps = cps;
    const tunGw = s.topologia.rol === 'hub' ? s.topologia.spokes : s.topologia.rol === 'spoke' ? s.topologia.hubs : 0;
    if (tunGw > 0) d.tunGw = tunGw;
    if (usuariosRemotos > 0) {
      if (s.remoto.metodo === 'ipsec') d.tunCli = usuariosRemotos;
      else {
        d.sslVpnUsers = usuariosRemotos;
        if (s.remoto.mbps > 0) d.sslVpn = s.remoto.mbps * (1 + g);
      }
      if (s.remoto.mfa) d.tokens = usuariosRemotos;
    }
    if (s.escala.vdoms > 0) d.vdom = s.escala.vdoms;
    if (s.escala.fortiAps > 0) d.aps = s.escala.fortiAps;
    if (s.escala.fortiSwitches > 0) d.switches = s.escala.fortiSwitches;
    return { d, sess, cps, tunGw };
  }

  /* ── 5 · COMPATIBILIDAD FortiOS × FUNCION × MODELO (F02) ─────────────────────────────── */
  const ID_CORTO = (m) => String(m.id).replace('FortiGate ', '');
  function compatibilidad(m, funcion, s, fortios) {
    const reglas = ((fortios && fortios.reglas) || []).filter((r) => r.funcion === funcion
      && r.versiones.includes(s.software.fortiOS));
    let estado = 'soportada';
    let regla = null;
    for (const r of reglas) {
      if (r.modelos === '*' || (Array.isArray(r.modelos) && r.modelos.includes(ID_CORTO(m)))) {
        return { estado: r.estado, regla: r };
      }
      if (r.modelos === 'ram-2gb') { estado = 'desconocida'; regla = r; }
    }
    return { estado, regla };
  }

  /* ── 6 · RESTRICCIONES QUE NO SON EJES DE RENDIMIENTO (F06, F14) ──────────────────────
     Cada una devuelve bloqueos con codigo estable, valor requerido y disponible, y la
     correccion que lo resolveria. Un bloqueo DESCARTA el modelo: ninguna holgura en otro eje
     lo compensa. */
  function asignarPuertos(disponibles, req) {
    // Primero lo que solo sirve para un medio; los compartidos (uno U otro) cubren el resto.
    const pool = disponibles.map((p) => ({ ...p, libres: p.n }));
    const falta = [];
    for (const tp of TIPOS_PUERTO) {
      let pide = req[tp.k] || 0;
      if (!pide) continue;
      // Un puerto sirve si es de ese medio y de esa velocidad o mas (un RJ45 multigigabit de 10 GE
      // negocia 1 GE). NO se da por hecho que una jaula SFP+ acepte un modulo SFP de 1 GE: suele
      // poder, pero no siempre, y suponerlo aprobaria un equipo por una compatibilidad no publicada.
      const sirve = (p) => p.medios.includes(tp.medio) && p.vel >= tp.vel;
      for (const p of pool.filter((x) => x.medios.length === 1 && sirve(x))) {
        const u = Math.min(pide, p.libres); p.libres -= u; pide -= u;
      }
      for (const p of pool.filter((x) => x.medios.length > 1 && sirve(x))) {
        const u = Math.min(pide, p.libres); p.libres -= u; pide -= u;
      }
      if (pide > 0) falta.push({ tipo: tp.n, falta: pide, pide: req[tp.k] });
    }
    return falta;
  }

  function restricciones(m, s, req, cat) {
    const b = [];
    const av = [];
    // Ciclo de vida: un equipo sin SKU de hardware vigente no se ofrece en compra nueva.
    if (s.comercial.motivo === 'nueva' && (m.eol || !m.hwSku)) {
      b.push({ codigo: 'CICLO_VIDA', mensaje: `${m.id} está fuera de venta: no se ofrece en compra nueva (solo como referencia de un parque instalado).`,
        correccion: 'Elegir un modelo vigente, o declarar la operación como ampliación, renovación o co-term con su justificación.' });
    }
    // FortiOS: SSL-VPN en modo tunel.
    if (s.remoto.activo && s.remoto.metodo === 'sslvpn') {
      const c = compatibilidad(m, 'sslvpn', s, cat.fortios);
      if (c.estado === 'retirada' || c.estado === 'no-soportada') {
        b.push({ codigo: 'FORTIOS_INCOMPATIBLE', eje: 'sslVpnUsers',
          mensaje: `SSL-VPN en modo túnel ${c.estado === 'retirada' ? 'está retirado' : 'no está soportado'} en ${m.id} con ${s.software.fortiOS}.`,
          fuente: c.regla.fuente, fuenteLeida: c.regla.leida !== false,
          correccion: 'Usar acceso remoto IPsec (FortiClient), que es el sustituto que declara el fabricante.' });
      } else if (c.estado === 'desconocida') {
        av.push({ codigo: 'FORTIOS_DESCONOCIDA', mensaje: `Con ${s.software.fortiOS}, SSL-VPN no está soportado en modelos de 2 GB de RAM, y la RAM de ${m.id} no está en el catálogo.`,
          fuente: c.regla.fuente, confianza: 'baja' });
      }
    }
    if (s.software.inspeccion === 'proxy') {
      const c = compatibilidad(m, 'proxy', s, cat.fortios);
      if (c.estado === 'limitada') {
        b.push({ codigo: 'PROXY_LIMITADO', mensaje: `${m.id}: el fabricante declara soporte limitado de las funciones proxy.`,
          fuente: c.regla.fuente, correccion: 'Inspección en modo flow, o un modelo sin esa limitación.' });
      }
    }
    // Puertos: cantidad, velocidad y medio. Sin puertos estructurados, el eje se declara.
    const pidePuertos = TIPOS_PUERTO.some((t) => s.fisico.puertos[t.k] > 0);
    if (pidePuertos) {
      if (!m.puertos) {
        av.push({ codigo: 'PUERTOS_SIN_ESTRUCTURAR', confianza: 'media',
          mensaje: `El catálogo no trae los puertos de ${m.id} estructurados («${m.ifaces}»): el requerimiento de puertos no se comprobó.` });
      } else {
        const falta = asignarPuertos(m.puertos, s.fisico.puertos);
        if (falta.length) {
          b.push({ codigo: 'PUERTOS_INSUFICIENTES', mensaje: `${m.id} no tiene los puertos pedidos: `
            + falta.map((f) => `faltan ${f.falta} de ${f.pide} ${f.tipo}`).join(', ') + '.',
          requerido: falta, fuente: m.puertosFuente, correccion: 'Un modelo con esa densidad, o un FortiSwitch por FortiLink.' });
        }
      }
    }
    // Almacenamiento para registro local.
    if (s.fisico.registro === 'local' && req.almacenamientoGB > 0) {
      if (m.almacenamientoGB == null) {
        b.push({ codigo: 'ALMACENAMIENTO_SIN_DATO', mensaje: `El catálogo no trae el disco de ${m.id}: no se puede afirmar que aguante la retención local.` });
      } else if (m.almacenamientoGB < req.almacenamientoGB) {
        b.push({ codigo: 'ALMACENAMIENTO_INSUFICIENTE',
          mensaje: m.almacenamientoGB === 0
            ? `${m.id} no tiene disco local: el registro local de ${Math.ceil(req.almacenamientoGB)} GB no cabe.`
            : `${m.id} publica ${m.almacenamientoGB} GB de disco y la retención pide ${Math.ceil(req.almacenamientoGB)} GB.`,
          requerido: req.almacenamientoGB, disponible: m.almacenamientoGB,
          correccion: 'La variante con disco (los modelos terminados en 1), o registro externo (nube o FortiAnalyzer).' });
      }
    }
    // PoE.
    if (s.fisico.poeW > 0) {
      if (m.poe == null) b.push({ codigo: 'POE_SIN_DATO', mensaje: `El catálogo no dice si ${m.id} tiene PoE.` });
      else if (!m.poe) {
        b.push({ codigo: 'POE_NO_DISPONIBLE',
          mensaje: m.poeVariante
            ? `${m.id} (SKU base) no tiene PoE: PoE existe solo como variante -POE de la serie, que no está en este catálogo.`
            : `${m.id} no tiene puertos PoE.`,
          correccion: 'Cubrir PoE con un FortiSwitch PoE gestionado por FortiLink, o cotizar la variante -POE desde su ficha.' });
      }
    }
    // Alimentacion redundante.
    if (s.fisico.psuRedundante) {
      if (m.redund == null) b.push({ codigo: 'PSU_SIN_DATO', mensaje: `El catálogo no dice si ${m.id} admite fuente redundante.` });
      else if (m.redund === false || m.redund === 'no-aplica') {
        b.push({ codigo: 'PSU_SIN_REDUNDANCIA', mensaje: `${m.id} tiene una sola fuente y no admite una segunda.`,
          correccion: 'Un modelo con fuente doble o con segunda fuente opcional.' });
      }
    }
    return { bloqueos: b, avisos: av };
  }

  /* ── 7 · EVALUACION COMPLETA ──────────────────────────────────────────────────────────
     `catalogo` = {models, bundles, care, funciones, serviciosSdwan, terminos, fortios,
     datasetVersion, fuentes}. `opciones.hoy` fija la fecha para la vigencia de precios (el
     servidor la pasa; asi dos evaluaciones del mismo escenario el mismo dia dan lo mismo). */
  function evaluar(entrada, catalogo, opciones) {
    const cat = catalogo || {};
    const o = opciones || {};
    const modelos = cat.models || [];
    const norm = normalizar(entrada, cat);
    const s = norm.snapshot;
    const res = {
      motor: VERSION_MOTOR, esquema: ESQUEMA, datasetVersion: cat.datasetVersion || null,
      scenarioHash: huella(s), snapshot: s,
      errores: norm.errores, inactivos: norm.inactivos, faltan: norm.faltan.slice(), campos: norm.campos,
      escenarios: [], requisitos: [], multiplicador: null, detalle: null,
      candidatos: [], elegibles: [], descartados: [], recomendacion: null, alternativas: [],
      seleccion: null, override: null, bom: null,
      bloqueos: [], avisos: [], supuestos: [], confianza: 'alta', quoteGate: 'BLOCKED', acciones: [],
    };

    // Politica: crecimiento y techo son reservas DISTINTAS, y juntas multiplican. Se dice.
    const g = s.politica.crecimientoPct / 100;
    const techo = s.politica.techoPct / 100;
    res.multiplicador = { crecimiento: 1 + g, techo, total: (1 + g) / techo,
      texto: `${(1 + g).toFixed(2)} (crecimiento) ÷ ${techo.toFixed(2)} (techo) = ${((1 + g) / techo).toFixed(3)} × el pico actual` };

    const escenarios = escenariosTrafico(s);
    res.escenarios = escenarios;
    if (!(escenarios[0].caudal > 0)) res.faltan.push('topologia.enlaces');
    // UN DATO COMERCIAL QUE FALTA BLOQUEA LA COTIZACION, NO EL DIMENSIONAMIENTO. La serie
    // instalada, la justificacion de un fuera de venta, los endpoints de EMS o los usuarios de
    // SASE no cambian ningun eje: sin ellos el diseno se sigue evaluando —y se ve— y lo que se
    // cierra es la salida comercial. Un dato tecnico que falta (el caudal, los usuarios
    // remotos, la retencion del registro) si impide evaluar, porque el resultado mentiria.
    const faltanTecnicos = res.faltan.filter((f) => !f.startsWith('comercial.'));
    if (res.errores.length || faltanTecnicos.length) return cerrar(res, s, cat, o);

    const capa = R.capaEfectiva(s.seguridad.capa, s.seguridad.funciones, cat.funciones || []);
    const esc = demandaDeEscala(s);
    // Demanda por eje: el maximo entre escenarios, con el escenario que la gobierna.
    const porEsc = escenarios.map((e) => ({ e, r: demandaDeEscenario(s, e, capa) }));
    const demandas = {};
    const gobierna = {};
    for (const { e, r } of porEsc) {
      for (const [k, v] of Object.entries(r.d)) {
        if (!(k in demandas) || v > demandas[k] + 1e-9) { demandas[k] = v; gobierna[k] = e.id; }
      }
    }
    for (const [k, v] of Object.entries(esc.d)) { demandas[k] = v; gobierna[k] = 'normal'; }
    const principal = porEsc.reduce((a, x) => (x.r.effectiveNeed > a.r.effectiveNeed ? x : a), porEsc[0]);
    const detalle = { ...principal.r, capa, sess: esc.sess, cps: esc.cps, tunGw: esc.tunGw, escenario: principal.e.id };
    res.detalle = detalle;
    const almacenamientoGB = s.fisico.registro === 'local' ? s.fisico.registroGbDia * s.fisico.registroDias * (1 + g) : 0;
    res.requisitos = Object.entries(demandas).map(([k, v]) => {
      const def = R.EJE_POR_K[k];
      return { eje: k, n: def ? def.n : k, requerido: v, unidad: (def && def.unidad) || 'Mbps',
        escenario: gobierna[k], escenarioN: (escenarios.find((x) => x.id === gobierna[k]) || {}).n || 'Escala' };
    });
    if (almacenamientoGB > 0) {
      res.requisitos.push({ eje: 'almacenamiento', n: 'Disco para registro local', requerido: almacenamientoGB,
        unidad: 'GB', escenario: 'normal', escenarioN: 'Retención declarada' });
    }

    const politica = { techo };
    const soporta = (m) => {
      const eff = detalle.effectiveNeed;
      if (!eff) return m.fw;
      let tope = Infinity;
      for (const def of R.EJES) {
        if (!def.escalaMbps) continue;
        const rq = demandas[def.k];
        if (!rq) continue;
        const cap = m[def.campo];
        if (cap == null) continue;
        tope = Math.min(tope, cap / (rq / eff));
      }
      return tope === Infinity ? m.fw : tope;
    };

    const req = { almacenamientoGB };
    for (const m of modelos) {
      const ev = R.evaluarModelo(m, demandas, politica);
      const rs = restricciones(m, s, req, cat);
      const elegible = ev.estado === 'ok' && !rs.bloqueos.length;
      res.candidatos.push({ id: m.id, modelo: m, eval: ev, bloqueos: rs.bloqueos, avisos: rs.avisos,
        elegible, soporta: soporta(m), eol: !!(m.eol || !m.hwSku) });
    }
    // Orden: vigente antes que fuera de venta, y dentro de cada grupo el mas pequeno que
    // cumple -la misma regla de FICHA.ordenar, reproducida aqui porque el servidor no tiene
    // FICHA y el orden decide la recomendacion-.
    const rango = (c) => (c.eol ? 2 : 0);
    const orden = (a, b) => rango(a) - rango(b) || a.soporta - b.soporta;
    res.elegibles = res.candidatos.filter((c) => c.elegible).sort(orden);
    res.descartados = res.candidatos.filter((c) => !c.elegible);
    const rx = SEG_MATCH[s.sitio.segmento];
    const vivos = res.elegibles.filter((c) => rango(c) < 2);
    const rec = (rx && vivos.find((c) => rx.test(c.modelo.seg))) || vivos[0] || null;
    res.recomendacion = rec;

    // SHORTLIST: el recomendado y las dos siguientes opciones con mas holgura, primero del
    // mismo segmento. Treinta referencias mezcladas de sucursal y carrier no son una
    // comparacion (F16): el catalogo completo sigue en su pestana.
    if (rec) {
      const siguientes = vivos.filter((c) => c !== rec && c.soporta >= rec.soporta);
      const mismos = siguientes.filter((c) => rx && rx.test(c.modelo.seg));
      res.alternativas = mismos.concat(siguientes.filter((c) => !mismos.includes(c))).slice(0, 2)
        .map((c) => ({ ...c, porQue: porQueAlternativa(c, rec) }));
    }

    /* OVERRIDE (F01). Elegir otro modelo a mano es PEDIR una revalidacion, no aprobarlo. Si
       cumple todo, pasa a ser el modelo validado; si no, la recomendacion se conserva, el
       deficit se muestra y la salida comercial se cierra mientras el intento siga en pie. */
    let validado = rec;
    const manualId = s.seleccion.manual;
    if (manualId && (!rec || manualId !== rec.id)) {
      const c = res.candidatos.find((x) => x.id === manualId);
      if (c && c.elegible) {
        validado = c;
        res.override = { modelo: manualId, elegible: true };
      } else if (c) {
        res.override = { modelo: manualId, elegible: false,
          deficit: c.eval.ejes.filter((x) => x.estado === 'excede' || (x.estado === 'sinDato' && x.dureza === 'dura'))
            .map((x) => ({ eje: x.k, n: x.n, requerido: x.req, disponible: x.cap, unidad: x.unidad,
              utilizacion: x.u, deficitPct: x.cap ? Math.round((x.req / x.cap - 1) * 100) : null,
              estado: x.estado })),
          bloqueos: c.bloqueos };
      }
    }
    res.seleccion = validado;
    if (validado) res.bom = construirBom(validado.modelo, s, cat, validado);
    return cerrar(res, s, cat, o);
  }

  // Por que mirar esta alternativa, en una linea. Una variante del mismo silicio (91G frente
  // a 90G) soporta EXACTAMENTE lo mismo: decir «0 % mas capacidad» la hace parecer un error,
  // cuando lo que la distingue es el disco. Se dice eso.
  function porQueAlternativa(c, rec) {
    const u = c.eval.uMax;
    const partes = [];
    if (u != null) partes.push(`cuello al ${R.pct(u)}`);
    const dif = Math.round(c.soporta / Math.max(rec.soporta, 1) * 100 - 100);
    partes.push(dif > 0 ? `${dif} % más capacidad que ${rec.id}` : `misma capacidad que ${rec.id}`);
    if (c.modelo.almacenamientoGB > 0 && !(rec.modelo.almacenamientoGB > 0)) partes.push(`con disco local de ${c.modelo.almacenamientoGB} GB`);
    return partes.join(' · ');
  }

  /* ── 8 · BOM DESDE EL MODELO VALIDADO, Y SOLO DESDE EL ────────────────────────────────── */
  function construirBom(m, s, cat, cand) {
    const nodos = s.disponibilidad.modo === 'standalone' ? 1 : 2;
    const c = s.comercial;
    const careKey = { fc247: 'essential', fcpre: 'premium', fcelite: 'elite' }[c.soporte];
    const vdomsExtra = m.vdomDef != null && m.vdomMax != null && s.escala.vdoms > m.vdomDef
      ? Math.min(s.escala.vdoms, m.vdomMax) - m.vdomDef : 0;
    const construccion = c.motivo === 'nueva' ? 'bdl' : 'separado';
    const com = R.lineasComerciales({
      modelo: m, bundles: cat.bundles || {}, care: cat.care || {},
      bundle: c.bundle, care_elegido: c.soporte, careKey,
      qty: nodos, anios: c.anios, terminos: cat.terminos,
      converter: c.converter,
      serviciosSdwan: conSdwan(s) ? (cat.serviciosSdwan || []).filter((sv) => c.sdwan.includes(sv.id)) : [],
      endpointsEms: c.emsActivo ? c.emsEndpoints : 0,
      construccion, sinEquipo: ['renovacion', 'coterm'].includes(c.motivo),
      sandbox: c.sandbox === 'ninguno' ? null : c.sandbox, sandboxModalidad: c.sandboxModalidad,
      registro: s.fisico.registro, registroGbDia: s.fisico.registroGbDia,
      vdomsExtra,
      segundaFuente: s.fisico.psuRedundante && m.redund === 'opcional',
      saseUsuarios: c.saseUsuarios,
    });
    // El bundle minimo NO se valida aqui: depende del escenario (funciones pedidas contra
    // bundle elegido) y no del modelo, asi que vive en `cerrar` y se declara tambien cuando
    // no hay ningun candidato — que es cuando mas falta hace decir que el bundle no alcanza.
    const bloqueos = com.bloqueos.slice();
    const avisos = com.avisos.slice();
    // F07. Un chasis no se cotiza como una linea: sin FIM, FPM, fuentes, ventiladores y opticas
    // la cotizacion es de una caja vacia. Este catalogo no trae ese configurador.
    if (m.modular) {
      bloqueos.unshift({ codigo: 'chasis-sin-configurador', nivel: 'bloqueo',
        mensaje: `${m.id} es un chasis modular: la cotización necesita módulos FIM/FPM, fuentes, ventiladores y ópticas, `
          + 'y este catálogo no trae ese configurador. Derivar a diseño especializado; el BOM automático no se emite.' });
    }
    // La justificacion de un fuera de venta la exige la regla `comercial.justificacionEol`
    // (dato requerido, bloquea la puerta). Un segundo bloqueo aqui repetia el mismo motivo con
    // otras palabras en la misma lista.
    return { modelo: m.id, nodos, construccion: com.bdl ? 'bdl' : 'separado', filas: com.filas, avisos, bloqueos,
      soporteIncluido: com.soporteIncluido };
  }

  /* ── 9 · PUERTA DE COTIZACION Y CONFIANZA ─────────────────────────────────────────────
     UN SOLO estado de salida para todo lo que sale de la pagina (F04):
       READY    modelo elegible, SKU exactos, fuentes vigentes, sin incompatibilidades.
       WARNING  un supuesto documentado no critico: se exporta con la advertencia estampada.
       DRAFT    el diseno es coherente pero falta un SKU o un precio pedible, o la confianza es
                baja: solo borrador tecnico, nunca al cotizador.
       BLOCKED  deficit tecnico, FortiOS incompatible, bundle insuficiente, dato critico
                ausente o un override que no cumple: ninguna salida comercial.
     No hay un boton con su propia logica de habilitacion: todos preguntan aqui. */
  const ACCIONES = {
    READY: ['excel', 'copiar', 'cotizador', 'perfil', 'consolidar'],
    WARNING: ['excel', 'copiar', 'cotizador', 'perfil', 'consolidar'],
    DRAFT: ['excel-borrador', 'copiar-borrador'],
    BLOCKED: [],
  };
  const CAMPO_N = {
    'topologia.enlaces': 'caudal de al menos un enlace WAN',
    'remoto.usuarios': 'usuarios de acceso remoto', 'fisico.registroGbDia': 'GB/día de registro',
    'fisico.registroDias': 'días de retención', 'comercial.emsEndpoints': 'endpoints gestionados de FortiClient EMS',
    'comercial.saseUsuarios': 'usuarios de FortiSASE', 'comercial.sandboxModalidad': 'modalidad del FortiSandbox dedicado',
    'comercial.serieInstalada': 'modelo y número de serie instalado', 'comercial.justificacionEol': 'justificación del equipo fuera de venta',
  };

  function cerrar(res, s, cat, o) {
    const bl = [];
    const av = [];
    const sup = [];
    for (const e of res.errores) bl.push({ codigo: 'entrada-invalida', nivel: 'bloqueo', mensaje: `${e.campo}: ${e.mensaje}`, campo: e.campo });
    for (const f of res.faltan) bl.push({ codigo: 'dato-requerido', nivel: 'bloqueo', mensaje: `Falta ${CAMPO_N[f] || f}.`, campo: f });
    let confianza = 'alta';
    const bajar = (a) => { if (a === 'baja' || (a === 'media' && confianza === 'alta')) confianza = a; };

    /* BUNDLE MINIMO (AT-03, T08). Es una propiedad del ESCENARIO —funciones pedidas contra
       bundle elegido—, no de un modelo, y por eso se valida aunque falte un dato o no haya
       candidato. Trae su CORRECCION: el bundle minimo que cubre lo pedido, para que la
       pantalla la ofrezca con un clic en vez de obligar a buscarla. */
    if (!res.errores.length) {
      const errBundle = R.validarBundle(s.comercial.bundle, s.seguridad.funciones, cat.funciones || [], cat.bundles || {});
      if (errBundle && errBundle.bloquea !== false) {
        bl.push({ ...errBundle, nivel: 'bloqueo',
          correccion: errBundle.minimo ? { accion: 'cambiar', campo: 'comercial.bundle', valor: errBundle.minimo } : null });
      } else if (errBundle) {
        av.push({ ...errBundle, nivel: 'warning' });
      }
    }

    if (res.detalle) {
      // Incompatibilidad FortiOS a nivel de escenario: si NINGUN modelo admite la funcion con
      // esa version, la correccion es del escenario y se ofrece como tal. Va PRIMERO: es la
      // causa, y «ningun modelo cumple» es solo su consecuencia.
      if (s.remoto.activo && s.remoto.metodo === 'sslvpn' && s.software.fortiOS === '7.6.3+') {
        const r = ((cat.fortios && cat.fortios.reglas) || []).find((x) => x.funcion === 'sslvpn' && x.modelos === '*');
        bl.push({ codigo: 'fortios-funcion-retirada', nivel: 'bloqueo',
          mensaje: 'SSL-VPN en modo túnel está retirado en FortiOS 7.6.3 o superior: el acceso remoto se diseña con IPsec.',
          // `leida:false` en el catalogo: la regla sale de una referencia del informe de
          // auditoria y el documento del fabricante no se leyo desde este entorno. Se dice.
          fuente: r ? r.fuente : null, fuenteLeida: r ? r.leida !== false : null,
          correccion: { accion: 'cambiar', campo: 'remoto.metodo', valor: 'ipsec' } });
      }
      if (!res.recomendacion && !res.seleccion) {
        bl.push({ codigo: 'sin-candidato', nivel: 'bloqueo', mensaje: 'Ningún modelo vigente cumple todas las restricciones del escenario.' });
      }
      if (res.override && !res.override.elegible) {
        const d = res.override.deficit.map((x) => `${x.n} ${x.estado === 'sinDato' ? 'sin dato' : `al ${R.pct(x.utilizacion)}`}`)
          .concat(res.override.bloqueos.map((x) => x.mensaje));
        bl.push({ codigo: 'override-no-elegible', nivel: 'bloqueo',
          mensaje: `${res.override.modelo} no cumple este escenario (${d.join('; ')}): el BOM solo se construye desde el modelo validado.`,
          correccion: { accion: 'volver-recomendado' } });
      }
      const sel = res.seleccion;
      if (sel) {
        for (const a of sel.avisos) { av.push({ ...a, nivel: a.confianza === 'baja' ? 'borrador' : 'warning' }); bajar(a.confianza || 'media'); }
        for (const n of sel.eval.sinComprobar) {
          av.push({ codigo: 'eje-sin-comprobar', nivel: 'warning', mensaje: `${n}: el catálogo no trae la cifra de ${sel.id}; ese eje no se comprobó.` });
          bajar('media');
        }
        if (s.software.inspeccion === 'proxy') {
          av.push({ codigo: 'cifras-flow', nivel: 'warning',
            mensaje: 'Las cifras publicadas se miden en modo flow. En modo proxy el rendimiento cae y Fortinet no publica cuánto: validar con PoC.' });
          bajar('media');
        }
        if (s.topologia.rol === 'hub') {
          av.push({ codigo: 'plano-control-sin-tope', nivel: 'warning',
            mensaje: `Concentrador con ${s.topologia.spokes} spoke(s): vecinos BGP, rutas y SLA probes crecen con ellos, y sus topes por modelo (Maximum Values Table) no están en este catálogo.` });
          bajar('media');
        }
        if (s.fisico.registro === 'local') {
          sup.push('Registro local: se compara contra la capacidad BRUTA publicada; FortiOS reserva parte del disco.');
        }
        if (sel.modelo.modular) bajar('baja');
        if (sel.eol) bajar('media');
      }
      if (res.bom) {
        for (const b of res.bom.bloqueos) (b.nivel === 'bloqueo' ? bl : av).push(b.nivel === 'bloqueo' ? b : { ...b, nivel: 'borrador' });
        for (const a of res.bom.avisos) if (a.nivel !== 'info') av.push(a);
      }
      // Vigencia de la lista de precios: vencida no bloquea el diseno, bloquea la cotizacion
      // en firme (queda en borrador).
      const fuentePrecios = cat.fuentes && cat.fuentes.find ? cat.fuentes.find((f) => f.dominio === 'precio') : null;
      if (fuentePrecios) {
        const salud = R.saludPrecios(fuentePrecios, o.hoy);
        if (salud.bloquea) av.push({ codigo: 'precios-vencidos', nivel: 'borrador', mensaje: salud.mensaje });
      }
    }
    sup.push(`Encapsulación ESP del ${Math.round(OVERHEAD_ESP * 100)} % sobre la fracción que viaja por el overlay (supuesto de la herramienta, no una cifra de Fortinet).`);
    if (s.escala.sesionesPorUsuario && !s.escala.cpsMedido) sup.push(`Sesiones nuevas por segundo derivadas de una vida media de sesión de ${s.escala.vidaSesionS} s.`);
    if (s.topologia.rol === 'hub') sup.push(`Simultaneidad de los spokes del ${s.topologia.simultaneidadPct} %.`);
    if (s.disponibilidad.modo === 'ha-aa') sup.push('HA activo-activo: se dimensiona para que un nodo aguante toda la carga en failover; el cluster no suma capacidad.');

    res.bloqueos = bl;
    res.avisos = av;
    res.supuestos = sup;
    const borrador = av.some((a) => a.nivel === 'borrador');
    res.confianza = confianza;
    res.quoteGate = bl.length ? 'BLOCKED'
      : (borrador || confianza === 'baja') ? 'DRAFT'
        : (av.some((a) => a.nivel === 'warning') || confianza === 'media') ? 'WARNING' : 'READY';
    res.acciones = ACCIONES[res.quoteGate].slice();
    return res;
  }

  // ¿Esta accion puede salir con esta evaluacion? La unica pregunta que hacen los botones.
  function permite(res, accion) {
    return !!(res && Array.isArray(res.acciones) && res.acciones.includes(accion));
  }

  return {
    VERSION_MOTOR, ESQUEMA, OVERHEAD_ESP, TIPOS_PUERTO, TIPOS_WAN, POR_DEFECTO, REGLAS, ACCIONES,
    sha256, canon, huella, normalizar, escenariosTrafico, compatibilidad, asignarPuertos,
    evaluar, permite,
  };
}));
