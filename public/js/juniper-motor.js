'use strict';
/* global module */
// `module` existe solo en Node (tests); en el navegador el typeof lo degrada.
/* ══ MOTOR DEL DIMENSIONADOR JUNIPER (2026-10-19) ══

   Módulo puro, sin DOM ni estado, con el mismo patrón UMD que `motor-ingenieria.js`: en el
   navegador cuelga `JuniperMotor` de `window`, en Node se carga con require() desde las pruebas.

   DE DÓNDE SALE. El dueño trajo una herramienta externa («Dimensionador Carrier-Grade Juniper
   Networks», 30 equipos, HTML suelto) y pidió integrarla «como un arquitecto senior». Se
   contrastó cifra a cifra con `legacyData/juniper.js` y lo que entra aquí es su MÉTODO, no sus
   datos. La auditoría completa está en PENDIENTES.md («Herramienta externa Juniper»); en
   resumen, lo que NO entra y por qué:

   - Sus cifras de seguridad del SRX son las del método TPS o de revisiones viejas: daba al
     SRX1600 21 Gbps de IPS (4,7x los 4,5 verificados por CPS) y al SRX4300 45 Gbps de NGFW
     (4x los 11 de ATP). Dimensionar con ellas propone equipos cortos: el mismo error de
     factor 10 que este dimensionador existe para evitar.
   - Inventaba capas que el catálogo no tiene: IDP y NGFW para los Session Smart Router, SKU
     de ventiladores y fuentes (`JNP-FAN-*`), precios de lista (Juniper no tiene lista aquí) y
     las familias ACX, MX y PTX sin una sola fuente oficial.
   - Su fórmula sumaba la inspección como recargo porcentual sobre el caudal. En un SRX la
     inspección CAMBIA LA CIFRA QUE APLICA (capa efectiva), no la encarece un tanto por ciento.
   - Contaba el «Local Breakout 70/30» en la etiqueta y nunca en la cuenta, y modelaba la
     duplicación de paquetes como +35 %: duplicar un flujo lo duplica entero.

   LO QUE SÍ ENTRA, CON SUS SUPUESTOS A LA VISTA:

   1. Demanda del Session Smart Router como sucursal o como concentrador (hub). En una sucursal
      el breakout local NO descarga el equipo —todo el tráfico del sitio pasa por él—; donde sí
      descarga es en el hub, que solo recibe la parte que viaja por el overlay. Es la cuenta que
      la herramienta externa no hacía.
   2. Factor IMIX homologado con el motor de EdgeConnect (`motor-ingenieria.js`, regla del dueño
      del 2026-09-13): 0,70 mezcla empresarial, 0,55 voz intensiva, 1,00 réplica masiva. La
      cifra `cap` del SSR no declara su base de medida; si ya fuera IMIX, el factor es
      conservador, que es el lado bueno de equivocarse.
   3. Sobrecoste del transporte calculado en bytes y no con un porcentaje fijo: un túnel ESP con
      AES-GCM y NAT-T añade ~62 B por paquete, y eso pesa un 11 % en paquetes de 570 B y un 25 %
      en los de 250 B de la voz. SVR solo lleva metadatos en el primer paquete de la sesión.
   4. Duplicación de paquetes (resiliencia de sesión del SSR) sobre la fracción de tráfico que
      el usuario declara protegida.
   5. Seguridad desacoplada: el SSR no publica cifra de inspección en este catálogo, así que si
      el diseño la necesita va en un SRX dimensionado por CAPA, con el mismo filtro que la
      plataforma SRX (`candidatosSrx`), o en el servicio cloud (sin cifra que dimensionar).
   6. Pool de IPv4 públicas para NAT por bloques de puertos (PBA): aritmética pura sobre los
      64.512 puertos útiles de una dirección.

   NINGÚN COEFICIENTE DE AQUÍ TIENE FUENTE DEL FABRICANTE: son reglas de trabajo declaradas, con
   su porqué, y la pantalla las enseña en el desglose. Si alguien «afina» uno, rompe
   `test/juniper-motor.test.js` y no la propuesta de un cliente. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.JuniperMotor = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {

  // Perfiles de tráfico. `factor` homologado con motor-ingenieria.js (mismas claves y valores);
  // `bytes` es el tamaño medio de paquete que se usa SOLO para el sobrecoste del túnel.
  const PERFILES = {
    ENTERPRISE_MIX: { n: 'Mezcla empresarial', factor: 0.70, bytes: 570 },
    VOIP_INTENSIVE: { n: 'Voz intensiva (paquete pequeño)', factor: 0.55, bytes: 250 },
    BULK_BACKUP: { n: 'Réplica o backup masivo (paquete grande)', factor: 1.00, bytes: 1400 },
  };

  // ESP en modo túnel con AES-GCM y NAT-T: IP externo 20 + ESP 8 + IV 8 + ICV 16 +
  // relleno y trailer 2 + UDP 8. Supuesto declarado; sin NAT-T serían 54.
  const IPSEC_BYTES = 62;

  const TRANSPORTES = {
    svr: { n: 'SVR (Secure Vector Routing, sin túnel)' },
    ipsec: { n: 'Túnel IPsec (ESP AES-GCM + NAT-T)' },
  };

  // Puertos útiles de una IPv4 para NAT de origen: 1.024-65.535.
  const PUERTOS_UTILES = 64512;

  const num = (v, min = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, n) : min;
  };
  const pct = (v) => Math.min(100, num(v)) / 100;
  // Techo a prueba de coma flotante: 10 × 100 × 0,3 da 300,00000000000006 y un ⌈ ⌉ directo
  // lo subiría a 301 (la misma trampa que motor-ingenieria cuenta con 539,9999…).
  const techo = (x) => Math.ceil(Math.round(x * 1e6) / 1e6);

  // Caudal que atraviesa el SSR antes de factores: el del sitio en una sucursal; en un hub, lo
  // que las sucursales mandan por el overlay (lo que no sale en local) por la simultaneidad.
  function cargaBase(p) {
    const bw = num(p.bwMbps);
    if (p.rol !== 'hub') return bw;
    const spokes = Math.floor(num(p.spokes));
    return spokes * bw * (1 - pct(p.breakoutPct)) * pct(p.simultPct == null ? 100 : p.simultPct);
  }

  function overheadTransporte(transporte, perfil) {
    if (transporte !== 'ipsec') return 0;
    return IPSEC_BYTES / perfil.bytes;
  }

  // Demanda de diseño del Session Smart Router.
  //   need = ⌈ base / IMIX × (1 + túnel) × (1 + duplicación) × (1 + margen) ⌉
  function demandaSsr(p) {
    const perfil = PERFILES[p.perfil] || PERFILES.ENTERPRISE_MIX;
    const base = cargaBase(p);
    const ovT = overheadTransporte(p.transporte, perfil);
    const dup = pct(p.dupPct);
    const head = pct(p.headroomPct);
    const bruto = (base / perfil.factor) * (1 + ovT) * (1 + dup) * (1 + head);
    const need = base > 0 ? techo(bruto) : 0;
    return {
      base, need, perfil, factorImix: perfil.factor,
      overheadTransporte: ovT, duplicacion: dup, headroom: head,
      pasos: [
        { n: p.rol === 'hub' ? 'Overlay recibido de las sucursales' : 'Caudal del sitio', v: base },
        { n: `Perfil ${perfil.n} (÷ ${perfil.factor.toFixed(2)})`, v: base / perfil.factor },
        { n: p.transporte === 'ipsec' ? `Túnel IPsec (+${(ovT * 100).toFixed(1)} %: ${IPSEC_BYTES} B sobre ${perfil.bytes} B)` : 'SVR sin túnel (+0 %)', v: (base / perfil.factor) * (1 + ovT) },
        { n: `Duplicación de paquetes (+${Math.round(dup * 100)} %)`, v: (base / perfil.factor) * (1 + ovT) * (1 + dup) },
        { n: `Margen de crecimiento (+${Math.round(head * 100)} %)`, v: need },
      ],
    };
  }

  // Caudal que un SRX desacoplado tiene que inspeccionar. En una sucursal puede ser todo el
  // tráfico o solo el que sale en local (DIA); en un hub, todo lo que llega del overlay. No se
  // divide por IMIX: las cifras del SRX ya son por capa (fwImix es IMIX; ips y atp, CPS).
  function inspeccionSrx(p) {
    const base = cargaBase(p);
    const dia = p.rol !== 'hub' && p.alcance === 'dia';
    const mbps = dia ? num(p.bwMbps) * pct(p.breakoutPct) : base;
    return { mbps, need: mbps > 0 ? techo(mbps * (1 + pct(p.headroomPct))) : 0, soloDia: dia };
  }

  // El filtro de la plataforma SRX, compartido con el SRX desacoplado. Un modelo sin cifra en
  // la capa NO se cuela con la de otra capa: se aparta y se cuenta.
  function candidatosSrx(models, k, need, sessNeed) {
    let sinCifra = 0, outBySess = 0;
    const candidatos = (models || []).filter((m) => {
      if (m[k] == null) { sinCifra++; return false; }
      if (m[k] < need) return false;
      if (sessNeed && m.sess != null && m.sess < sessNeed) { outBySess++; return false; }
      return true;
    });
    return { candidatos, sinCifra, outBySess };
  }

  // NAT de origen con asignación por bloques de puertos (PBA). Prefijo: el menor que contiene
  // las direcciones necesarias.
  function poolCgnat(p) {
    const usuarios = Math.floor(num(p.usuarios));
    const bloque = Math.floor(num(p.bloque, 1)) || 1;
    if (!usuarios || bloque > PUERTOS_UTILES) return null;
    const porIp = Math.floor(PUERTOS_UTILES / bloque);
    const ips = Math.ceil(usuarios / porIp);
    const prefijo = 32 - Math.ceil(Math.log2(ips));
    return { usuarios, bloque, porIp, ips, prefijo, enPrefijo: 2 ** (32 - prefijo) };
  }

  return {
    PERFILES, TRANSPORTES, IPSEC_BYTES, PUERTOS_UTILES,
    cargaBase, demandaSsr, inspeccionSrx, candidatosSrx, poolCgnat,
  };
});
