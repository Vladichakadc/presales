'use strict';
/* ══ FORTIWIFI, FORTIGATE CON MODEM 4G/5G Y FORTIEXTENDER (2026-11-04) ══════════════════════
   Encargo del dueño: «En el dimensionador de Fortinet revisa ya que no estás trayendo los
   fortigates que tienen funcionalidades de WIFI y fortiextender para soluciones de 4G/5G e
   incluye en el dimensionador opciones para calcular el equipo cuando se necesite esta
   funcionalidad». Hasta hoy el catalogo solo traia el SKU base de cada FortiGate: el Product
   Matrix lista «WiFi», «3G4G» y «5G» como VARIANTES de la serie (MATRIX_PLATAFORMA) y ninguna
   era un modelo, asi que pedir Wi-Fi o un enlace celular no tenia con que responderse.

   QUE ES UNA VARIANTE AQUI. Un SKU de hardware propio que la ficha por serie publica en la MISMA
   tabla de rendimiento que su FortiGate base: en las cuatro fichas leidas (30G, 40F, 50G, 70G) las
   cifras de IPS, NGFW, Threat Protection, firewall, sesiones, IPsec, inspeccion SSL, tuneles,
   VDOM, FortiAP, FortiSwitch y FortiToken van en una sola celda que abarca todas las columnas
   (FG y FWF, o FG y FG-3G4G). Por eso la variante hereda esas cifras de su base en fortinet.js
   —es lo que el documento imprime, no una deduccion por silicio— y aqui solo se escribe lo que
   la ficha publica DISTINTO por columna: el SKU, las interfaces, la alimentacion, la radio Wi-Fi
   y el modem. Lo que la ficha no da queda en null y la pantalla lo dice.

   LO QUE NO SE HEREDA, A PROPOSITO:
     · el precio y las licencias: salen por SKU EXACTO de la lista firmada (fortinetSkus.js). La
       lista extraida trae el equipo y las licencias de las variantes celulares (familias
       FC-10-F40FG, FC-10-F50G5 y FC-10-F51G5, y sus BDL) porque `npm run skus` extrae el bloque
       de cada FortiGate; NO trae los FortiWiFi (FWF-...), cuyas filas no nombran un FortiGate.
       Esos van sin precio y sin SKU de suscripcion, diciendo que la lista NO SE EXTRAJO para
       ellos (`listaSinExtraer`), que no es lo mismo que «la lista no los trae» (`fueraDeLista`).
     · la PQC y los vecinos BGP: la Maximum Values Table de FortiOS 7.6.7, que los respalda, lista
       modelos (30G, 50G…) y no nombra a ninguna variante. Sin documento, «no consta».
     · el fin de venta: ningun boletin leido nombra estas referencias.

   [RC] ES EL CODIGO REGIONAL que la ficha imprime en el SKU de los FortiWiFi («[RC] = regional
   code: A, B, D, E, F, I, J, N, P, S, V, and Y»). Depende del dominio regulatorio del pais donde
   se instala la radio, y la ficha no dice cual corresponde a cada pais: se conserva tal cual y la
   linea del BOM pide elegirlo. No se elige uno a ojo.

   LO QUE NO ENTRA, Y POR QUE (2026-11-04). Los FortiWiFi 40F, 60F y 80F-2R y el FG-80F-3G4G, que el
   Product Matrix nombra como variantes. Las fichas vigentes que Fortinet publica en la URL de esas
   series («fortigate-fortiwifi-40f/60f/80f-series.pdf», ediciones FG-40F-DAT-R49, FG-60F-DAT-R51 y
   FG-80F-DAT-R48, todas del 2026-10-01; rama fuente/fortinet-wifi-celular-4-2026-11-04) ya no traen
   columnas FortiWiFi ni el 80F-3G4G en su tabla ni en su «Ordering Information»: el documento vigente
   no los publica, y sin el no hay de donde sacar su SKU, su consumo ni su radio. El 40F-3G4G si sigue
   en la R49, con la misma columna que la R48. */

// ── FICHAS POR SERIE DE DONDE SALE CADA COLUMNA ─────────────────────────────────────────────
// Las cuatro se trajeron el 2026-09-03 a la rama fuente/fortinet-serie (archivos
// fortigate-fortiwifi-<serie>-series.pdf). El identificador es el que la ficha imprime al pie.
const FICHAS = {
  '30G': 'FGFWF-30G-DAT-R07-20260414',
  // La R49 (2026-10-01, rama fuente/fortinet-wifi-celular-4-2026-11-04) imprime la misma columna
  // del 40F-3G4G que la R48 de fuente/fortinet-serie.
  '40F': 'FG-40F-DAT-R49-20261001',
  '50G': 'FGFWF-50G-DAT-R17-20260901',
  '70G': 'FGFWF-70G-DAT-R09-20260527',
};

const P = (n, vel, ...medios) => ({ n, vel, medios });
// La radio Wi-Fi integrada, como la imprime la ficha: «Wireless Interface: Dual Radio (2.4 GHz /
// 5 GHz), 802.11 a/b/g/n/ac/ax» y, en Hardware Features, «a built-in dual-band, dual-stream access
// point […] WiFi-6 (802.11ax)». La 50G publica ademas su tabla «Radio Specifications»; la 30G y la
// 70G no, y esos campos quedan en null.
const RADIO = (extra) => ({ estandar: '802.11 a/b/g/n/ac/ax (Wi-Fi 6)', radios: 'doble radio, 2,4 GHz y 5 GHz',
  mimo: null, velocidades: null, ...extra });
const RADIO_50G = RADIO({ mimo: '2x2 (MU-MIMO)', velocidades: '1201 Mbps a 5 GHz, 574 Mbps a 2,4 GHz' });

/* Cada variante: `de` es el modelo base cuya tabla comparte; `sku` el de su «Ordering
   Information»; `lic` el codigo de modelo de sus licencias en la lista firmada y `bdl` el prefijo
   de su SKU combinado (solo donde la lista extraida los trae); `psu` la fila «Power Consumption
   (Average / Maximum)» y «Maximum Current» de su columna. */
const VARIANTES = [
  // ── FortiWiFi ───────────────────────────────────────────────────────────────────────────
  { id: 'FortiWiFi 30G', de: 'FortiGate 30G', ficha: '30G', sku: 'FWF-30G-[RC]', rc: true,
    ifaces: '4 GE RJ45 (1 WAN, 2 internos, 1 FortiLink) + Wi-Fi 6 doble radio',
    puertos: [P(4, 1, 'RJ45')], almacenamientoGB: 0, wifi: RADIO(),
    psu: { watts: 11.3, maxW: 13.6, amps: '0,17 A @110 V · 0,085 A @240 V' } },
  { id: 'FortiWiFi 31G', de: 'FortiGate 31G', ficha: '30G', sku: 'FWF-31G-[RC]', rc: true,
    ifaces: '4 GE RJ45 (1 WAN, 2 internos, 1 FortiLink) + Wi-Fi 6 doble radio + 30 GB SSD',
    puertos: [P(4, 1, 'RJ45')], almacenamientoGB: 30, wifi: RADIO(),
    psu: { watts: 12.85, maxW: 14.2, amps: '0,17 A @110 V · 0,085 A @240 V' } },
  { id: 'FortiWiFi 50G', de: 'FortiGate 50G', ficha: '50G', sku: 'FWF-50G-[RC]', rc: true,
    ifaces: '5 GE RJ45 (1 WAN, 3 internos, 1 FortiLink) + Wi-Fi 6 doble radio, 3 SMA',
    puertos: [P(5, 1, 'RJ45')], almacenamientoGB: 0, wifi: RADIO_50G,
    psu: { watts: 12.74, maxW: 14, amps: '0,4 A @100 V · 0,2 A @240 V' } },
  { id: 'FortiWiFi 51G', de: 'FortiGate 51G', ficha: '50G', sku: 'FWF-51G-[RC]', rc: true,
    ifaces: '5 GE RJ45 (1 WAN, 3 internos, 1 FortiLink) + Wi-Fi 6 doble radio, 3 SMA + 64 GB SSD',
    puertos: [P(5, 1, 'RJ45')], almacenamientoGB: 64, wifi: RADIO_50G,
    psu: { watts: 12.74, maxW: 14, amps: '0,4 A @100 V · 0,2 A @240 V' } },
  { id: 'FortiWiFi 70G', de: 'FortiGate 70G', ficha: '70G', sku: 'FWF-70G-[RC]', rc: true,
    ifaces: '10 GE RJ45 (2 WAN, 6 internos, 2 FortiLink) + Wi-Fi 6 doble radio, 3 SMA',
    puertos: [P(10, 1, 'RJ45')], almacenamientoGB: 0, wifi: RADIO(),
    psu: { watts: 16.9, maxW: 17.6, amps: '0,4 A @100 V · 0,2 A @240 V' } },
  { id: 'FortiWiFi 71G', de: 'FortiGate 71G', ficha: '70G', sku: 'FWF-71G-[RC]', rc: true,
    ifaces: '10 GE RJ45 (2 WAN, 6 internos, 2 FortiLink) + Wi-Fi 6 doble radio, 3 SMA + 64 GB SSD',
    puertos: [P(10, 1, 'RJ45')], almacenamientoGB: 64, wifi: RADIO(),
    psu: { watts: 16.9, maxW: 17.6, amps: '0,4 A @100 V · 0,2 A @240 V' } },
  // La ficha imprime este SKU sin [RC].
  { id: 'FortiWiFi 70G-POE', de: 'FortiGate 70G', ficha: '70G', sku: 'FWF-70G-POE', rc: false,
    ifaces: '10 GE RJ45 (2 WAN, 2 internos, 2 FortiLink, 4 PoE/PoE+) + Wi-Fi 6 doble radio, 3 SMA',
    puertos: [P(10, 1, 'RJ45')], almacenamientoGB: 0, wifi: RADIO(),
    poe: { puertos: 4, presupuestoW: 60, nota: '30 W como maximo por puerto (802.3at)' },
    psu: { watts: 74.9, maxW: 77.7, amps: '0,4 A @100 V · 0,2 A @240 V' } },
  // ── FortiGate con modem celular integrado ───────────────────────────────────────────────
  // «Embedded 3G/4G/LTE wireless wan module, 3 external SMA WWAN antennas».
  { id: 'FortiGate 40F-3G4G', de: 'FortiGate 40F', ficha: '40F', sku: 'FG-40F-3G4G', rc: false,
    lic: 'F40FG', bdl: 'FG-40F-3G4G-BDL', skuHa: 'FG-40F-3G4G-HA',
    ifaces: '5 GE RJ45 (1 WAN, 3 internos, 1 FortiLink) + modem 3G/4G LTE CAT-12, 2 nano SIM, 3 SMA',
    puertos: [P(5, 1, 'RJ45')], almacenamientoGB: 0,
    celular: { gen: '4G', modem: 'Sierra Wireless EM7565', categoria: 'LTE CAT-12', sims: '2 nano SIM (activo/pasivo)',
      antenas: '3 SMA externas', regiones: 'todas las regiones', caudal: null },
    psu: { watts: 15.8, maxW: 18.6, amps: '0,3 A @100 V · 0,2 A @240 V' } },
  // «Embedded 3G/4G/LTE/5G wireless wan module, 5 external SMA WWAN antennas». La ficha imprime
  // para la columna FG-50G-5G/51G-5G el mismo consumo que la FG-50G (8,3 W / 8,9 W): se transcribe
  // asi, aunque lleve el modem, porque es lo que el documento dice.
  { id: 'FortiGate 50G-5G', de: 'FortiGate 50G', ficha: '50G', sku: 'FG-50G-5G', rc: false,
    lic: 'F50G5', bdl: 'FG-50G-5G-BDL',
    ifaces: '5 GE RJ45 (1 WAN, 3 internos, 1 FortiLink) + modem 5G/LTE, 2 nano SIM, 5 SMA',
    puertos: [P(5, 1, 'RJ45')], almacenamientoGB: 0,
    celular: { gen: '5G', modem: 'Telit Cinterion FN990A28-HP', categoria: '5G NR (sub-6) y LTE', sims: '2 nano SIM (activo/pasivo)',
      antenas: '5 SMA externas', regiones: 'todas las regiones', caudal: null },
    psu: { watts: 8.3, maxW: 8.9, amps: '0,4 A @100 V · 0,2 A @240 V' } },
  { id: 'FortiGate 51G-5G', de: 'FortiGate 51G', ficha: '50G', sku: 'FG-51G-5G', rc: false,
    lic: 'F51G5', bdl: 'FG-51G-5G-BDL',
    ifaces: '5 GE RJ45 (1 WAN, 3 internos, 1 FortiLink) + modem 5G/LTE, 2 nano SIM, 5 SMA + 64 GB SSD',
    puertos: [P(5, 1, 'RJ45')], almacenamientoGB: 64,
    celular: { gen: '5G', modem: 'Telit Cinterion FN990A28-HP', categoria: '5G NR (sub-6) y LTE', sims: '2 nano SIM (activo/pasivo)',
      antenas: '5 SMA externas', regiones: 'todas las regiones', caudal: null },
    psu: { watts: 8.3, maxW: 8.9, amps: '0,4 A @100 V · 0,2 A @240 V' } },
  // Wi-Fi y 5G a la vez: «Embedded 3G/4G/LTE/5G HP wireless wan module». La tabla imprime 3
  // puertos SMA en esta columna y la «Ordering Information» «8 external SMA WWAN antennas»: no
  // casan, y por eso las antenas quedan en null.
  { id: 'FortiWiFi 50G-5G-II', de: 'FortiGate 50G', ficha: '50G', sku: 'FWF-50G-5G-II', rc: false,
    ifaces: '5 GE RJ45 (1 WAN, 3 internos, 1 FortiLink) + Wi-Fi 6 doble radio + modem 5G/LTE, 2 nano SIM',
    puertos: [P(5, 1, 'RJ45')], almacenamientoGB: 0, wifi: RADIO_50G,
    celular: { gen: '5G', modem: 'Telit Cinterion FN990A28-HP', categoria: '5G NR (sub-6) y LTE', sims: '2 nano SIM (activo/pasivo)',
      antenas: null, regiones: 'todas las regiones', caudal: null },
    psu: { watts: 20.43, maxW: 23.59, amps: '0,4 A @100 V · 0,2 A @240 V' } },
];

/* ── FORTIEXTENDER: EL ENLACE 4G/5G FUERA DEL FORTIGATE ────────────────────────────────────
   «FortiExtender 5G/LTE Gateways Series Data Sheet» FEXT-DAT-R57-20260831, traida por
   traer-cisco-huawei.yml el 2026-11-04 (corrida 41845481466, rama
   fuente/fortinet-wifi-celular-2026-11-04) desde la URL que enlaza la pagina de producto:
   https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/FortiExtender.pdf

   `bajada`/`subida` (Mbps) son las del modem, de su «Ordering Information» («DL/UL=300M/50Mbps»;
   en la FEW-50G «DL-7Gbps/UL-2.5Gbps max in 5G/Sub6 SA mode»). La FEX-511G no la publica: null,
   y el motor no comprueba su modem, lo dice. `nat` es la fila «LAN-WAN NAT'ed Layer-3 packets» de
   la tabla «Bandwidth Information» (lo que el equipo reenvia de la LAN a la WAN), y `ipsec` la fila
   «IPsec VPN (LTE/5G)». Un caudal declarado se compara con las dos que existan: el modem y el
   reenvio. Las cifras de modem son el maximo de la categoria, no un caudal garantizado en campo:
   depende de la cobertura del operador, y la pantalla lo dice.
   `region` = «Applied Region» de su tabla de modem; los regionales no se recomiendan solos.
   `care` = el SKU de FortiCare Premium de su «Ordering Information»; lleva el marcador -DD y el
   precio no esta en la lista extraida, asi que va «consultar». */
const FORTIEXTENDER = {
  fuente: 'FortiExtender 5G/LTE Gateways Series Data Sheet (FEXT-DAT-R57-20260831)',
  url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/FortiExtender.pdf',
  // «FortiGate WAN Extension: 2 per FGT», en todas las columnas de su guía de pedido (traída el
  // 2026-11-04 en la rama fuente/fortinet-wifi-celular-2-2026-11-04, enlazada desde la misma página).
  maxPorFortiGate: { n: 2, fuente: 'FortiExtender Ordering Guide (FEX-OG-R18-20250626), «FortiGate WAN Extension: 2 per FGT»',
    url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/og-fortiextender.pdf' },
  modelos: [
    { id: 'FortiExtender 101G', skus: ['FEX-101G'], gen: '4G', categoria: 'LTE CAT-6', modem: 'Telit LN920A6-WW',
      modems: 1, bajada: 300, subida: 50, nat: 900, ipsec: 160, region: null, regionN: 'operadores globales',
      puertos: '1 GE WAN + 4 GE LAN', poePd: '802.3at (25,5 W) en el puerto 4', maxW: 10.45,
      care: 'FC-10-X101G-247-02-DD' },
    { id: 'FortiExtender 211G', skus: ['FEX-211G'], gen: '4G', categoria: 'LTE CAT-12', modem: 'Telit LN920A12-WW',
      modems: 1, bajada: 600, subida: 150, nat: 900, ipsec: 170, region: null, regionN: 'operadores globales',
      puertos: '1 GE WAN + 4 GE LAN', poePd: '802.3at (25,5 W) en el puerto 4', maxW: 10.64,
      care: 'FC-10-X211G-247-02-DD' },
    { id: 'FortiExtender 201F', skus: ['FEX-201F-EA'], gen: '4G', categoria: 'LTE CAT-7', modem: 'Sierra Wireless EM7421',
      modems: 1, bajada: 300, subida: 150, nat: 930, ipsec: 100, region: 'EA', regionN: 'operadores de EMEA y APAC',
      puertos: '5 GE RJ45 (WAN o LAN)', poePd: '802.3af (15,4 W)', maxW: 8.5,
      care: 'FC-10-FE21F-247-02-DD' },
    { id: 'FortiExtender 202F', skus: ['FEX-202F-AM'], gen: '4G', categoria: 'LTE CAT-7 (dos modems)', modem: 'Sierra Wireless EM7411 (2 modems)',
      modems: 2, bajada: 300, subida: 150, nat: 930, ipsec: 100, region: 'AM', regionN: 'operadores de Norteamérica',
      puertos: '5 GE RJ45 (WAN o LAN)', poePd: '802.3af (15,4 W)', maxW: 9.4,
      care: 'FC-10-FA22F-247-02-DD' },
    { id: 'FortiExtender 511G', skus: ['FEX-511G'], gen: '5G', categoria: '5G sub-6 GHz y LTE', modem: 'Sierra Wireless EM9291',
      modems: 1, bajada: null, subida: null, nat: 900, ipsec: 400, region: null, regionN: 'operadores globales',
      puertos: '1 WAN 2,5 GE + 1 combo SFP/RJ45 1 GE + 3 GE LAN', poePd: '802.3at (25,5 W) en el puerto 4', maxW: 18,
      care: 'FC-10-FX51G-247-02-DD' },
    // Dos SKU por region, el mismo equipo: la linea del BOM pide elegir.
    { id: 'FortiExtender WAN 50G', skus: ['FEW-50G-AM', 'FEW-50G-EA'], gen: '5G', categoria: '5G sub-6 GHz y LTE', modem: 'MediaTek T830',
      modems: 1, bajada: 7000, subida: 2500, nat: 2810, ipsec: 430, region: 'AM/EA',
      regionN: 'FEW-50G-AM para Norteamérica, FEW-50G-EA para EMEA, APAC y LATAM',
      puertos: '2 RJ45 5/2,5/1 GE (LAN o WAN)', poePd: '802.3at (25,5 W) en LAN2', maxW: 19,
      care: 'FC-10-FA50G-247-02-DD (AM) o FC-10-FE50G-247-02-DD (EA)' },
  ],
};

module.exports = { FICHAS, VARIANTES, FORTIEXTENDER };
