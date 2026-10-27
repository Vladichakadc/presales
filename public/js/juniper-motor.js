'use strict';
/* global module, require */
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

   LO QUE SÍ ENTRA:

   1. Demanda del Session Smart Router como sucursal o como concentrador (hub). En una sucursal
      el breakout local NO descarga el equipo —todo el tráfico del sitio pasa por él—; donde sí
      descarga es en el hub, que solo recibe la parte que viaja por el overlay. Es la cuenta que
      la herramienta externa no hacía.
   2. EL SSR SE DIMENSIONA POR CAPA DE CIFRADO, COMO EL SRX POR CAPA DE INSPECCIÓN (corregido el
      mismo 2026-10-19, al leer las fichas de las líneas SSR100 y SSR1000). La primera versión
      dividía la demanda por un factor IMIX «homologado con EdgeConnect» y sumaba ~62 B de túnel
      IPsec, porque el `cap` del catálogo no declaraba su base. Las fichas la declaran: `cap` es
      «Unencrypted (IMIX)», y publican además «Encrypted only» y «Encrypted + HMAC», en IMIX y
      con paquetes de 1.500 B. Dividir otra vez por IMIX contaba la mezcla dos veces, y el túnel
      no aplica: el overlay del SSR es SVR, y su coste es justo la capa de cifrado. Ahora la
      demanda se compara con la cifra IMIX de la capa elegida y la de 1.500 B se enseña como
      portada, igual que el `fw` del SRX. Un SSR1200 pasa de 10 Gbps sin cifrar a 2,5 con HMAC.
   3. Duplicación de paquetes (resiliencia de sesión del SSR) sobre la fracción de tráfico que
      el usuario declara protegida.
   4. Seguridad desacoplada: las fichas del SSR no publican cifra de IDP ni de filtrado URL, así
      que si el diseño necesita inspección va en un SRX dimensionado por CAPA, con el mismo
      filtro que la plataforma SRX (`candidatosSrx`), o en el servicio cloud.
   5. Pool de IPv4 públicas para NAT por bloques de puertos (PBA): aritmética pura sobre los
      64.512 puertos útiles de una dirección.

   LAS CIFRAS SON DEL FABRICANTE; LOS COEFICIENTES (breakout, simultaneidad, duplicación) LOS
   DECLARA QUIEN DIMENSIONA, y la pantalla los enseña en el desglose. Si alguien «afina» uno, rompe
   `test/juniper-motor.test.js` y no la propuesta de un cliente. */
(function (root, factory) {
  let PQC = root && root.PQC;
  if (!PQC && typeof require === 'function') PQC = require('./pqc.js');
  const api = factory(PQC);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.JuniperMotor = api;
})(typeof window !== 'undefined' ? window : globalThis, function (PQC) {

  // Capas de cifrado del SVR, con el campo del catálogo que trae cada una (IMIX, la que
  // dimensiona) y su pareja con paquetes de 1.500 B (portada, que se muestra y no dimensiona).
  const CIFRADOS = {
    plano: { n: 'Sin cifrar', k: 'cap', k1500: 'cap1500' },
    cif: { n: 'Solo cifrado', k: 'capCif', k1500: 'capCif1500' },
    hmac: { n: 'Cifrado + HMAC', k: 'capHmac', k1500: 'capHmac1500' },
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

  // Demanda de diseño del Session Smart Router, que se compara con la cifra IMIX de la capa
  // de cifrado (`capa.k`). Sin factor IMIX: la cifra ya está medida en IMIX.
  //   need = ⌈ base × (1 + duplicación) × (1 + margen) ⌉
  function demandaSsr(p) {
    const capa = CIFRADOS[p.cifrado] || CIFRADOS.hmac;
    const base = cargaBase(p);
    const dup = pct(p.dupPct);
    const head = pct(p.headroomPct);
    const need = base > 0 ? techo(base * (1 + dup) * (1 + head)) : 0;
    return {
      base, need, capa, duplicacion: dup, headroom: head,
      pasos: [
        { n: p.rol === 'hub' ? 'Overlay recibido de las sucursales' : 'Caudal del sitio', v: base },
        { n: `Duplicación de paquetes (+${Math.round(dup * 100)} %)`, v: base * (1 + dup) },
        { n: `Margen de crecimiento (+${Math.round(head * 100)} %)`, v: need },
      ],
    };
  }

  // El filtro del SSR: la cifra de la capa de cifrado; un modelo sin ella se aparta y se cuenta.
  // `pqc` (2026-10-27): el nivel de criptografía post-cuántica exigido; lo que no lo documenta se
  // aparta con su motivo (la regla única de pqc.js), solo si cumple todo lo demás.
  function candidatosSsr(models, k, need, pqc) {
    let sinCifra = 0;
    const outByPqc = [];
    const candidatos = (models || []).filter((m) => {
      if (m[k] == null) { sinCifra++; return false; }
      if (m[k] < need) return false;
      const mot = PQC.motivo(m, pqc);
      if (mot) { outByPqc.push({ id: m.id, motivo: mot }); return false; }
      return true;
    });
    return { candidatos, sinCifra, outByPqc };
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
  function candidatosSrx(models, k, need, sessNeed, pqc) {
    let sinCifra = 0, outBySess = 0;
    const outByPqc = [];
    const candidatos = (models || []).filter((m) => {
      if (m[k] == null) { sinCifra++; return false; }
      if (m[k] < need) return false;
      if (sessNeed && m.sess != null && m.sess < sessNeed) { outBySess++; return false; }
      const mot = PQC.motivo(m, pqc);
      if (mot) { outByPqc.push({ id: m.id, motivo: mot }); return false; }
      return true;
    });
    return { candidatos, sinCifra, outBySess, outByPqc };
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
    CIFRADOS, PUERTOS_UTILES,
    cargaBase, demandaSsr, candidatosSsr, inspeccionSrx, candidatosSrx, poolCgnat,
  };
});
