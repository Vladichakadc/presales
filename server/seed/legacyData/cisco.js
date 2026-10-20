// Catálogo Cisco del dimensionador: Secure Router (G2), Catalyst 8000 Edge, ISR 1000, ASR 1000 y
// Meraki MX. Revisado entero el 2026-10-20 contra los documentos oficiales que trajo
// `traer-cisco-huawei.yml` a las ramas de transporte fuente/cisco-secure-2026-10-20 (corrida
// 39360888778), fuente/cisco-secure-2-2026-10-20 (39410454052) y fuente/cisco-huawei (las cinco
// fichas del 2026-10-01). La procedencia de cada documento está en `fuentes.js`.
//
// POR QUÉ ESTA REVISIÓN. El dueño adjuntó un dimensionador externo («Dimensionador Oficial CISCO»,
// 35 equipos, HTML suelto) para actualizar este. Se contrastó cifra a cifra y entra su MÉTODO
// (`public/js/cisco-motor.js`), no sus datos: el contraste completo está en
// `docs/herramienta-externa-cisco-2026-10-20.md`. De ahí salen tres cosas que cambian este archivo:
//   1. La línea Secure Router (G2) entera (8100, 8200, 8300, 8400, 8500 y 8600) y los Meraki
//      gestionados C8111-G2-MX y C8121-G2-MX, desde sus fichas y su guía de pedido. El adjunto
//      acertaba las cifras de rendimiento de la G2 (copiadas de estas mismas fichas) e inventaba
//      precios, fuentes de alimentación y referencias de soporte.
//   2. Los Meraki MX estaban desactualizados: las fichas vigentes publican más del doble de VPN
//      (MX450 6,5 Gbps frente a 2) y otra cifra de firewall. Se cambian por las de la ficha.
//   3. Los cuatro Catalyst 8000 Edge que el catálogo no tenía (8300-1N1S-4T2X, 8300-2N2S-4T2X,
//      8500L-8S4X, 8500-12X) y el 8500-20X6C, con las fechas y el sucesor de sus boletines.
//
// LA BASE DE CADA CIFRA VA DECLARADA (`bases`). Cisco no mide igual en todas sus fichas: la línea
// G2 publica reenvío, IPsec y SD-WAN con paquetes de 512 B; los Catalyst 8000 Edge publican IPsec
// y SD-WAN en IMIX y el reenvío solo a 1.400 B; la protección de amenazas va en EMIX («Firewall
// EMIX traffic profile»), y Meraki no publica el tamaño de paquete. Antes el campo se rotulaba
// «IMIX» para todos y por eso el 2026-10-01 se dejaron cifras de reenvío POR DEBAJO de lo
// publicado, sin documento que las respaldara (el Catalyst 8200 con 1 Gbps; la ficha da 3,8 a
// 1.400 B). Ahora cada cifra es la del documento y su base sale al lado en la pantalla; el motor
// avisa cuando la cifra que dimensiona está medida con paquetes grandes.
//
// «SD-WAN» ES SIEMPRE LA CIFRA CON SERVICIOS: IPsec + QoS + DPI + Flexible NetFlow (lo que Cisco
// llama IQDF). En los Catalyst 8200/8300 la ficha publica las dos, con y sin IQDF; aquí va la de
// IQDF, que es la del perfil que se dimensiona y la menor (8300-1N1S-6T: 1,7 Gbps con IQDF, 1,8
// sin). Los Catalyst 8500 no publican IQDF: su cifra SD-WAN es la de IPsec SD-WAN en IMIX y la
// base lo dice. En Meraki el overlay (AutoVPN) es la VPN: `sdwan` y `ipsec` son la misma cifra.
//
// «AMENAZAS» es la cifra de inspección integrada: en Cisco, «Threat Protection» (100 % DIA-NAT +
// NGFW + IPS + URLF + AMP, EMIX); en Meraki, la de NGFW / Advanced Security, en modo detección salvo
// donde la ficha publica también la de prevención (MX250 y MX450). Donde la ficha no la publica
// (8500 y 8600 G2, Catalyst 8500 de 1RU y 3RU, ISR) va en null: esa plataforma no se propone para
// inspeccionar en caja, y el motor lo dice en vez de usar otra capa.
//
// SIN DATO NO ES CERO. `tuneles`, `rutas` y `nat` son la escala publicada; null es «no consta» y el
// motor avisa sin apartar. `aps` (APs gestionados por un WLC integrado) pasa a null en todos: las
// cifras que había no salían de ningún documento y la página no las usaba para nada.
//
// Fin de venta anunciado (boletines oficiales de Cisco del 27/29-jul-2026). Siguen vigentes para
// cotizar hasta su `lastOrder`; después caen solos (la regla vive en ficha.js). `sucesor` es el
// «Migration Product» que cada boletín nombra para cada PID, no una inferencia. Los tres ASR 1000
// tienen el último pedido vencido: referencia de parque instalado.
const BOLETIN_8300_8200 = 'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html';
const BOLETIN_8500L_8300 = 'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8500l-8s4x-4t2x-c8300-1n1s-6t-eol.html';
const BOLETIN_8500 = 'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8500-12x-c8500-12x4qc-eol.html';
const EOL_ANNOUNCED = {
  'Catalyst 8200L':          {pid:'C8200L-1N-4T',    lastOrder:'2027-07-31', sucesor:'Cisco Secure Router C8231-E-G2', url:BOLETIN_8300_8200},
  'Catalyst 8200':           {pid:'C8200-1N-4T',     lastOrder:'2027-07-31', sucesor:'Cisco Secure Router C8235-E-G2', url:BOLETIN_8300_8200},
  'Catalyst 8300-2N2S-6T':   {pid:'C8300-2N2S-6T',   lastOrder:'2027-07-31', sucesor:null, url:BOLETIN_8300_8200},
  'Catalyst 8300-2N2S-4T2X': {pid:'C8300-2N2S-4T2X', lastOrder:'2027-07-31', sucesor:null, url:BOLETIN_8300_8200},
  'Catalyst 8300-1N1S-6T':   {pid:'C8300-1N1S-6T',   lastOrder:'2027-01-31', sucesor:'Cisco Secure Router C8375-E-G2', url:BOLETIN_8500L_8300},
  'Catalyst 8300-1N1S-4T2X': {pid:'C8300-1N1S-4T2X', lastOrder:'2027-01-31', sucesor:'Cisco Secure Router C8375-E-G2', url:BOLETIN_8500L_8300},
  'Catalyst 8500L-8S4X':     {pid:'C8500L-8S4X',     lastOrder:'2027-01-31', sucesor:'Cisco Secure Router C8475-G2', url:BOLETIN_8500L_8300},
  'Catalyst 8500-12X':       {pid:'C8500-12X',       lastOrder:'2027-01-31', sucesor:'Cisco Secure Router C8550-G2', url:BOLETIN_8500},
  'Catalyst 8500-12X4QC':    {pid:'C8500-12X4QC',    lastOrder:'2027-01-31', sucesor:'Cisco Secure Router C8570-G2', url:BOLETIN_8500},
  'ASR 1001-X':              {pid:'ASR1001-X',       lastOrder:'2022-08-01', sucesor:null,
                              url:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1001-x-1002-x-eol.html'},
  'ASR 1002-HX':             {pid:'ASR1002-HX',      lastOrder:'2025-03-31', sucesor:null,
                              url:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1002-hx-asso-part-eol.html'},
  'ASR 1006-X':              {pid:'ASR1006-X',       lastOrder:'2026-07-31', sucesor:null,
                              url:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1006-x-chassis-eol.html'},
};

// Bases de medida, una por familia de documento.
const B_G2 = {fwd:'512 B', ipsec:'512 B', sdwan:'512 B, IPsec + QoS + DPI + FNF', amenazas:'EMIX, DIA-NAT + NGFW + IPS + URLF + AMP'};
const B_C8K = {fwd:'1.400 B', ipsec:'IMIX', sdwan:'IMIX, con IQDF', amenazas:'EMIX, DIA-NAT + NGFW + IPS + URLF + AMP'};
const B_C85 = {fwd:'1.400 B', ipsec:'1.400 B', sdwan:'IMIX, IPsec SD-WAN sin IQDF publicado', amenazas:'EMIX, DIA-NAT + NGFW + IPS + URLF + AMP'};
const B_ISR = {fwd:'512 B', ipsec:'512 B', sdwan:'512 B, IPsec + QoS + DPI + FNF', amenazas:null};
const B_MX = {fwd:'firewall de estado; Meraki no publica tamaño de paquete', ipsec:'VPN sitio a sitio (AutoVPN)', sdwan:'VPN sitio a sitio (AutoVPN)', amenazas:'NGFW en modo detección (IDS)'};
const B_MXP = {...B_MX, amenazas:'NGFW (prevención)'};
// Lo heredado de la revisión del 2026-10-01 que esta no relee: ISR 1000 y ASR 1000.
const B_ANT = {fwd:'contrastada el 2026-10-01 (ver la cabecera)', ipsec:'contrastada el 2026-10-01', sdwan:'contrastada el 2026-10-01', amenazas:null};

const DS = {
  sr8100:'https://www.cisco.com/c/en/us/products/collateral/routers/secure-routers/8100-series-secure-routers-ds.html',
  sr8200:'https://www.cisco.com/c/en/us/products/collateral/routers/secure-routers/8200-series-secure-routers-ds.html',
  sr8300:'https://www.cisco.com/c/en/us/products/collateral/routers/secure-routers/8300-series-secure-routers-ds.html',
  sr8400:'https://www.cisco.com/c/en/us/products/collateral/routers/secure-routers/8400-series-secure-routers-ds.html',
  sr8500:'https://www.cisco.com/c/en/us/products/collateral/routers/secure-routers/8500-series-secure-routers-ds.html',
  sr8600:'https://www.cisco.com/site/us/en/products/collateral/networking/sdwan-routers/8000-secure-routers/8600-series-secure-routers-ds.html',
  c8200:'https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-8200-series-edge-platforms/nb-06-cat8200-series-edge-plat-ds-cte-en.html',
  c8300:'https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-8300-series-edge-platforms/datasheet-c78-744088.html',
  c8500:'https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-8500-series-edge-platforms/datasheet-c78-744089.html',
  isr:'https://www.cisco.com/c/en/us/products/collateral/routers/1000-series-integrated-services-routers-isr/datasheet-c78-739512.html',
  mx6768:'https://documentation.meraki.com/MX/MX_Overviews_and_Specifications/MX67_and_MX68_Overview_and_Specifications',
  mx75:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/MX75_Datasheet',
  mx85:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/MX85_Datasheet',
  mx95:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/MX95%2F%2F105_Datasheet',
  mx250:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/MX250_Datasheet',
  mx450:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/MX450_Datasheet',
  c81mx:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/C8111-G2-MX_and_C8121-G2-MX_Data_Sheet',
};

// Módulos de celular (PIM) de la guía de pedido de la G2 (tabla 8), los mismos en 8100, 8200 y 8300.
const PIM = ['P-5GS6-R16SA-GL', 'P-LTEA7-NA', 'P-LTEA7-EAL', 'P-LTEA7-JP'];
const MX_LIC = ['LIC-MX-ENT', 'LIC-MX-SEC', 'LIC-MX-SDW'];

const MODELS = [
  // ── ISR 1000 ── Los tres primeros son los de la revisión del 2026-10-01 (cifras bajadas contra la
  // ficha; ver PENDIENTES.md). El 1121X-8P y el 1161X-8P entran el 2026-10-20 con las tablas 17-19 y
  // 4-6 de la misma ficha (c78-739512): reenvío e IPsec en modo autónomo, SD-WAN con IQDF, 512 B.
  {id:'ISR 1111-8P',      ser:'ISR 1000', fam:'Sucursal muy pequeña / SOHO',           fwd:300,  ipsec:200, sdwan:null, aps:null, redund:false, lte:false, bases:B_ANT,
   ports:'1 GE WAN combo + 8 GE LAN · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC','NIM-4G-LTE'], lic:'dna'},
  {id:'ISR 1111X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña con HSEC',              fwd:800,  ipsec:600, sdwan:null, aps:null, redund:false, lte:false, bases:B_ANT,
   ports:'2 GE WAN combo + 8 GE LAN · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC','NIM-4G-LTE'], lic:'dna'},
  {id:'ISR 1116-4P',      ser:'ISR 1000', fam:'Sucursal + LTE integrado',               fwd:300,  ipsec:200, sdwan:null, aps:null, redund:false, lte:true, bases:B_ANT,
   ports:'4 GE WAN + LTE integrado · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna'},
  {id:'ISR 1121X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña, 8 GB de memoria',      fwd:1600, ipsec:600, sdwan:250, amenazas:null, aps:null, redund:false, lte:false, bases:B_ISR,
   tuneles:200, tunelesNota:'túneles del overlay SD-WAN; 100 SVTI en modo autónomo', rutas:280000, nat:100000,
   ports:'2 GE WAN + 8 GE LAN', nim:0, sm:0, pim:false, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna', datasheet:DS.isr},
  {id:'ISR 1161X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña de alto reenvío, 8 GB', fwd:1900, ipsec:700, sdwan:350, amenazas:null, aps:null, redund:false, lte:false, bases:B_ISR,
   tuneles:200, tunelesNota:'túneles del overlay SD-WAN; 100 SVTI en modo autónomo', rutas:800000, nat:100000,
   ports:'2 GE WAN + 8 GE LAN', nim:0, sm:0, pim:false, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna', datasheet:DS.isr},

  // ── Catalyst 8000 Edge ── Fin de venta anunciado en todos salvo el 8500-20X6C (ver EOL_ANNOUNCED).
  // Precios de lista del export de CCW del 17-ago-2026 en los tres que los traían.
  {id:'Catalyst 8200L',   ser:'Catalyst 8000', fam:'Sucursal SD-WAN compacta',          fwd:3800, ipsec:400, sdwan:300, amenazas:null, aps:null, redund:false, lte:false, bases:B_C8K,
   tuneles:1500, pim:true, clase:null,
   psu:{tipo:'fuente interna fija de AC', texto:'Ficha: «Both models use an internal, fixed AC power supply»; el PoE de una NIM pide una fuente externa adicional.'},
   ports:'2 GE RJ45 + 2 GE SFP WAN · 1 NIM · 1 PIM', nim:1, sm:0, optics:['sfp1g'], parts:['DNA-ADVANTAGE'], lic:'dna', datasheet:DS.c8200},
  {id:'Catalyst 8200',    ser:'Catalyst 8000', fam:'Sucursal SD-WAN estándar',          fwd:3800, ipsec:900, sdwan:850, amenazas:980, aps:null, redund:false, lte:false, bases:B_C8K,
   tuneles:2500, pim:true,
   psu:{tipo:'fuente interna fija de AC', texto:'Ficha: «Both models use an internal, fixed AC power supply»; el PoE de una NIM pide una fuente externa adicional.'},
   ports:'2 GE RJ45 + 2 GE SFP WAN · 1 NIM · 1 PIM', nim:1, sm:0, optics:['sfp1g'], parts:['DNA-ADVANTAGE'], elp:'$6,967.76', elpN:6967.76, lic:'dna', datasheet:DS.c8200},
  {id:'Catalyst 8300-1N1S-6T',   ser:'Catalyst 8000', fam:'Hub regional SD-WAN, WAN 1G',  fwd:19700, ipsec:1900, sdwan:1700, amenazas:2100, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'6 GE (2 SFP) · 1 NIM · 1 SM · 1 PIM · 1RU', nim:1, sm:1, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], elp:'$21,286.41', elpN:21286.41, lic:'dna', datasheet:DS.c8300},
  {id:'Catalyst 8300-1N1S-4T2X', ser:'Catalyst 8000', fam:'Hub regional SD-WAN, WAN 10G', fwd:19700, ipsec:6600, sdwan:5500, amenazas:2900, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'2x 10G SFP+ + 4 GE · 1 NIM · 1 SM · 1 PIM · 1RU', nim:1, sm:1, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', datasheet:DS.c8300},
  {id:'Catalyst 8300-2N2S-6T',   ser:'Catalyst 8000', fam:'Hub regional SD-WAN doble NIM, WAN 1G', fwd:19700, ipsec:1900, sdwan:1700, amenazas:2300, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'6 GE (2 SFP) · 2 NIM · 2 SM · 1 PIM · 2RU', nim:2, sm:2, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], elp:'$29,026.93', elpN:29026.93, lic:'dna', datasheet:DS.c8300},
  {id:'Catalyst 8300-2N2S-4T2X', ser:'Catalyst 8000', fam:'Hub regional SD-WAN doble NIM, WAN 10G', fwd:19700, ipsec:9300, sdwan:5600, amenazas:4900, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'2x 10G SFP+ + 4 GE · 2 NIM · 2 SM · 1 PIM · 2RU', nim:2, sm:2, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', datasheet:DS.c8300},
  {id:'Catalyst 8500L-8S4X',     ser:'Catalyst 8000', fam:'Agregación / hub DC compacto',  fwd:39000, ipsec:19000, sdwan:10000, amenazas:4000, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:6000,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «High-efficiency dual power supplies by default for power supply redundancy».'},
   ports:'4x 1/10G SFP+ + 8x 1G SFP · 1RU', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', datasheet:DS.c8500},
  {id:'Catalyst 8500-12X',       ser:'Catalyst 8000', fam:'Hub DC / agregación 10G',       fwd:118000, ipsec:84000, sdwan:22600, amenazas:null, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:8000,
   psu:{tipo:'dos fuentes de serie (PWR-CH1-750WACR o PWR-CH1-950WDCR)', texto:'Ficha: «High-efficiency dual power supplies by default for power supply redundancy».'},
   ports:'12x 1/10G SFP+ · 1RU', nim:0, sm:0, optics:['sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', datasheet:DS.c8500},
  {id:'Catalyst 8500-12X4QC',    ser:'Catalyst 8000', fam:'Hub DC / Edge de alto rendimiento', fwd:197000, ipsec:135000, sdwan:31900, amenazas:null, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:8000,
   psu:{tipo:'dos fuentes de serie (PWR-CH1-750WACR o PWR-CH1-950WDCR)', texto:'Ficha: «High-efficiency dual power supplies by default for power supply redundancy».'},
   ports:'12x 10G SFP+ + 4x 40G QSFP · 1RU', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['DNA-ADVANTAGE'], lic:'dna', datasheet:DS.c8500},
  {id:'Catalyst 8500-20X6C',     ser:'Catalyst 8000', fam:'Núcleo SD-WAN / DC de alta densidad', fwd:500000, ipsec:400000, sdwan:100000, amenazas:null, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:8000,
   psu:{tipo:'fuentes N+1 de serie (opción N+2): PWR-CH1-1100WAC o PWR-CH1-950WDC', texto:'Ficha: «N+1 redundancy (Option N+2 redundancy)».'},
   ports:'20x 1/10G SFP+ + 6x 40/100G QSFP28 · 3RU', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['DNA-ADVANTAGE'], lic:'dna', datasheet:DS.c8500},

  // ── Cisco Secure Router (G2) ── Fichas de las series 8100 a 8600 y «Cisco 8000 Series Secure Routers
  // Ordering Guide» (oct-2026). `clase` es la «Platform class» de su tabla 1 (S, M, L, XL, 2XL), que es
  // la que fija la referencia de cada licencia (LIC-CSWAN-<clase>-E/A, LIC-SEC-<clase>-T...). Los
  // túneles son los de IOS XE 26.2.1 en adelante; la cifra anterior va en `tunelesNota`. Precio de
  // lista solo en el C8355-G2, el único que traía el export de CCW del 17-ago-2026.
  {id:'Cisco Secure Router C8130-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña, 6 GE', clase:'S', fwd:1900, ipsec:1500, sdwan:900, amenazas:null, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:250, rutas:280000, nat:100000, pim:false, sdwanDesde:'IOS XE 26.2.1',
   psu:{watts:16, tipo:'adaptador externo (PWR-CC1-30WAC por defecto)'},
   ports:'1 GE + 1 GE RJ45/SFP WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8131-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con Threat Protection', clase:'S', fwd:1900, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:false,
   psu:{watts:16, tipo:'adaptador externo (PWR-CC1-30WAC por defecto)'},
   ports:'1 GE + 1 GE RJ45/SFP WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8140-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña, 10 GE', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:null, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:250, rutas:280000, nat:100000, pim:false, sdwanDesde:'IOS XE 26.2.1',
   psu:{watts:20, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'2 GE RJ45/SFP WAN · 2 GE flex · 6 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8151-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con PIM 5G/LTE', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:true,
   psu:{watts:23, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'2 GE RJ45/SFP WAN · 2 GE flex · 6 GE LAN · 1 PIM', nim:0, sm:0, optics:['sfp1g'], parts:PIM, lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8161-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con PoE y PIM 5G/LTE', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:true, poe:80, poeNota:'6 GE LAN, 4 PoE y 2 PoE+ (ficha)',
   psu:{watts:25, tipo:'adaptador externo (PWR-CC1-150WAC por defecto)'},
   ports:'2 GE RJ45/SFP WAN · 2 GE flex · 6 GE LAN PoE · 1 PIM', nim:0, sm:0, optics:['sfp1g'], parts:PIM, lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8211-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana de entrada, 6 GE', clase:'M', fwd:5600, ipsec:3000, sdwan:2000, amenazas:1000, aps:null, redund:'opcional', lte:false, bases:B_G2,
   tuneles:1500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:false,
   psu:{watts:15.4, tipo:'adaptador externo de 30 W AC; segunda fuente opcional (solo como repuesto)'},
   ports:'2 GE RJ45/SFP WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8200},
  {id:'Cisco Secure Router C8221-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana, WAN 10G SFP+', clase:'M', fwd:19000, ipsec:5000, sdwan:4000, amenazas:1000, aps:null, redund:'opcional', lte:false, bases:B_G2,
   tuneles:1500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:false,
   psu:{watts:21, tipo:'adaptador externo de 66 W AC; segunda fuente opcional (solo como repuesto)'},
   ports:'2x 10G SFP+ + 2 GE WAN · 2 GE flex · 4 GE LAN', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8200},
  {id:'Cisco Secure Router C8221L-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana, WAN 10GBASE-T', clase:'M', fwd:19000, ipsec:5000, sdwan:4000, amenazas:1000, aps:null, redund:'opcional', lte:false, bases:B_G2,
   tuneles:1500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:false,
   psu:{watts:21, tipo:'adaptador externo de 66 W AC; segunda fuente opcional (solo como repuesto)'},
   ports:'2x 10G RJ45 + 2 GE WAN · 2 GE flex · 4 GE LAN', nim:0, sm:0, optics:[], parts:[], lic:'cswan', datasheet:DS.sr8200},
  {id:'Cisco Secure Router C8225-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana, WAN 10G y 16 GB', clase:'M', fwd:19000, ipsec:5000, sdwan:4000, amenazas:2400, aps:null, redund:'opcional', lte:false, bases:B_G2,
   tuneles:2500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:false,
   psu:{watts:21, tipo:'adaptador externo de 66 W AC; segunda fuente opcional (solo como repuesto)'},
   ports:'2x 10G SFP+ + 2 GE WAN · 2 GE flex · 4 GE LAN', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8200},
  {id:'Cisco Secure Router C8231-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana, mGig 2,5G', clase:'M', fwd:19000, ipsec:5000, sdwan:4000, amenazas:1000, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:1500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:false, poe:30, poeNota:'con la fuente PWR-CC1-115WAC; 1 puerto PoE+',
   psu:{watts:26.7, tipo:'adaptador externo de 66 W AC (115 W AC con PoE)'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 2x 2,5G flex · 4 GE LAN', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8200},
  {id:'Cisco Secure Router C8231-E-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana modular (NIM + PIM), 8 GB', clase:'M', fwd:19000, ipsec:5000, sdwan:4000, amenazas:1000, aps:null, redund:'opcional', lte:false, bases:B_G2,
   tuneles:1500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:true, poe:120, poeNota:'con la fuente PWR-CC1-150WAC; 2 puertos UPOE+', macsec:'nim',
   psu:{watts:34.2, tipo:'fuente interna de 140 W AC; segunda fuente opcional (adaptador externo PWR-ADPT-150WAC o -150WDC)'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 1 NIM · 1 PIM · 1RU', nim:1, sm:0, optics:['sfp1g','sfp10g'], parts:PIM, lic:'cswan', datasheet:DS.sr8200},
  {id:'Cisco Secure Router C8235-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana, 8x mGig y PIM', clase:'M', fwd:19000, ipsec:5000, sdwan:4000, amenazas:2400, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:2500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:true, poe:120, poeNota:'con la fuente PWR-CC1-230WAC; 2 UPOE+ y 2 PoE+',
   psu:{watts:27.11, tipo:'adaptador externo de 66 W AC (230 W AC con PoE)'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 2x 2,5G flex · 4x 2,5G LAN · 1 PIM', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:PIM, lic:'cswan', datasheet:DS.sr8200},
  {id:'Cisco Secure Router C8235-E-G2', ser:'Secure Router (G2)', fam:'Sucursal mediana modular (NIM + PIM), 16 GB', clase:'M', fwd:19000, ipsec:5000, sdwan:4000, amenazas:2400, aps:null, redund:'opcional', lte:false, bases:B_G2,
   tuneles:2500, tunelesNota:'700 antes de IOS XE 26.2.1', rutas:1500000, nat:1500000, pim:true, poe:120, poeNota:'con la fuente PWR-CC1-150WAC; 2 puertos UPOE+', macsec:'nim',
   psu:{watts:34.2, tipo:'fuente interna de 140 W AC; segunda fuente opcional (adaptador externo PWR-ADPT-150WAC o -150WDC)'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 1 NIM · 1 PIM · 1RU', nim:1, sm:0, optics:['sfp1g','sfp10g'], parts:PIM, lic:'cswan', datasheet:DS.sr8200},
  // C8355-G2: ver la revisión del 2026-09-03 en PENDIENTES.md (su SD-WAN de 8,7 Gbps y la doble fuente).
  {id:'Cisco Secure Router C8355-G2', ser:'Secure Router (G2)', fam:'Hub regional SD-WAN, 4x 10G y 4x mGig 5G', clase:'L', fwd:38000, ipsec:20000, sdwan:8700, amenazas:3900, aps:null, redund:true, lte:false, bases:B_G2,
   tuneles:4000, tunelesNota:'3.500 antes de IOS XE 26.2.1', rutas:2000000, nat:1500000, pim:true, poe:120, poeNota:'con la fuente PWR-CC1-230WAC',
   psu:{watts:45, tipo:'entrada de alimentación doble; de serie dos adaptadores externos de 110 W AC', texto:'Consumo típico 45 W con la fuente por defecto y sin módulos. La ficha técnica rotula la fila como «Power Supply (Default - Dual PSU)» y el panel del equipo trae entrada doble. Como mejora se ofrecen fuentes de 230 W AC con PoE (presupuesto PoE 120 W).'},
   ports:'4x 10G SFP+ + 4x 5G mGig + 2 GE · 1 PIM · 16 GB', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:PIM, elp:'$15,552.28', elpN:15552.28, lic:'cswan', datasheet:DS.sr8300},
  {id:'Cisco Secure Router C8375-E-G2', ser:'Secure Router (G2)', fam:'Hub regional modular (NIM + SM + PIM)', clase:'L', fwd:38000, ipsec:20000, sdwan:12000, amenazas:7000, aps:null, redund:true, lte:false, bases:B_G2,
   tuneles:4000, tunelesNota:'3.500 antes de IOS XE 26.2.1', rutas:2000000, nat:1500000, pim:true, poe:360, poeNota:'con la fuente PWR-CC1-760WAC', macsec:'nim',
   psu:{watts:55, tipo:'dos fuentes internas (FRU) de 400 W AC por defecto; 760 W AC con PoE o 500 W DC', texto:'Ficha: «Power Supply (Default - Dual PSU)»; consumo típico 55 W con la fuente por defecto y sin módulos.'},
   ports:'2x 10G SFP+ + 4x 2,5G mGig · 1 NIM · 1 SM · 1 PIM · 1RU', nim:1, sm:1, optics:['sfp1g','sfp10g'], parts:PIM, lic:'cswan', datasheet:DS.sr8300},
  {id:'Cisco Secure Router C8455-G2', ser:'Secure Router (G2)', fam:'Internet edge / campus, familia 8400', clase:'XL', fwd:67000, ipsec:31000, sdwan:15500, amenazas:9500, aps:null, redund:null, lte:false, bases:B_G2,
   tuneles:6000, tunelesNota:'3.500 antes de IOS XE 26.2.1', rutas:5800000, nat:null, pim:false,
   psu:{tipo:'250 W AC (PWR-CH1-250WAC) por defecto; 400 W DC u HVDC', texto:'La ficha da el peso «with 2x AC power supplies and fan tray» y la guía de pedido una sola referencia de fuente por defecto: cuántas vienen de serie no consta. Confirmar en CCW antes de prometer redundancia.'},
   ports:'8x 1G SFP + 2x 10G SFP+ + 2x 10/25G SFP28 · 1RU · 32 GB', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8400},
  {id:'Cisco Secure Router C8475-G2', ser:'Secure Router (G2)', fam:'Internet edge / campus de alta densidad, familia 8400', clase:'XL', fwd:91000, ipsec:45000, sdwan:21700, amenazas:10900, aps:null, redund:null, lte:false, bases:B_G2,
   tuneles:6000, tunelesNota:'3.500 antes de IOS XE 26.2.1', rutas:5800000, nat:null, pim:false,
   psu:{tipo:'400 W AC (PWR-CH1-400WAC) por defecto; 400 W DC u HVDC', texto:'La ficha da el peso «with 2x AC power supplies and fan tray» y la guía de pedido una sola referencia de fuente por defecto: cuántas vienen de serie no consta. Confirmar en CCW antes de prometer redundancia.'},
   ports:'8x 1G SFP + 8x 10G SFP+ + 4x 10/25G SFP28 · 1RU · 32 GB', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8400},
  {id:'Cisco Secure Router C8550-G2', ser:'Secure Router (G2)', fam:'Agregación / headend DC, 12x 10G', clase:'XL', fwd:115000, ipsec:48000, sdwan:19000, amenazas:null, aps:null, redund:null, lte:false, bases:B_G2,
   tuneles:10000, rutas:8000000, nat:16000000, pim:false, macsec:'integrado',
   psu:{tipo:'750 W AC (PWR-CH1-750WACR) o 950 W DC', texto:'La guía de instalación muestra dos bahías de fuente (PEM 0 y PEM 1); la guía de pedido no dice cuántas vienen por defecto.'},
   ports:'12x 1/10G SFP+ · MACsec en todos · 1RU', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8500},
  {id:'Cisco Secure Router C8570-G2', ser:'Secure Router (G2)', fam:'Agregación / headend DC con 40/100G', clase:'XL', fwd:190000, ipsec:63000, sdwan:21000, amenazas:null, aps:null, redund:null, lte:false, bases:B_G2,
   tuneles:10000, rutas:8000000, nat:16000000, pim:false, macsec:'integrado',
   psu:{tipo:'750 W AC (PWR-CH1-750WACR) o 950 W DC', texto:'La guía de instalación muestra dos bahías de fuente (PEM 0 y PEM 1); la guía de pedido no dice cuántas vienen por defecto.'},
   ports:'12x 10G SFP+ + 2x 40G QSFP+ + 2x 40/100G QSFP28 (240G simultáneos) · 1RU', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:[], lic:'cswan', datasheet:DS.sr8500},
  {id:'Cisco Secure Router C8650-G2', ser:'Secure Router (G2)', fam:'Núcleo SD-WAN / headend de proveedor', clase:'2XL', fwd:540000, ipsec:225000, sdwan:80000, amenazas:null, aps:null, redund:true, lte:false, bases:B_G2,
   tuneles:12000, rutas:16000000, nat:32000000, pim:false, macsec:'integrado',
   psu:{tipo:'tres fuentes de 1.100 W AC por defecto (3x PWR-CH1-1100WAC-D) o 950 W DC', texto:'Ficha: «AC or DC power supplies (N+2 redundancy)»; guía de pedido: tres fuentes por defecto y una cuarta opcional.'},
   ports:'20x 1/10G SFP+ + 6x 40/100G QSFP28 · 3RU · 64 GB', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:[], lic:'cswan', datasheet:DS.sr8600},

  // ── ASR 1000 ── Fin de venta vencido: parque instalado.
  {id:'ASR 1001-X',       ser:'ASR 1000', fam:'WAN Edge compacto (2.5–20 Gbps)',        fwd:20000, ipsec:8000, sdwan:5000, aps:null, redund:true, lte:false, bases:B_ANT,
   ports:'6 GE integrados + 2 SFP+ · ESP escal.', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['ASR1001X-10G-HA-BUN'], lic:'dna'},
  {id:'ASR 1002-HX',      ser:'ASR 1000', fam:'WAN Edge / DC gateway (35 Gbps)',        fwd:35000, ipsec:18000,sdwan:10000,aps:null, redund:true, lte:false, bases:B_ANT,
   ports:'8 GE + 4x10GE SFP+ + 2x100GE QSFP28', nim:0, sm:0, optics:['sfp1g','sfp10g','qsfp100g'], parts:['ASR1002HX-HA-BUN'], lic:'dna'},
  {id:'ASR 1006-X',       ser:'ASR 1000', fam:'Core WAN modular (200 Gbps)',            fwd:200000,ipsec:78000,sdwan:20000,aps:null, redund:true, lte:false, bases:B_ANT,
   ports:'6 slots SPA · hasta 200GE · modular', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['ASR1006X-HA-BUN'], lic:'dna'},

  // ── Meraki MX ── Fichas vigentes de documentation.meraki.com (2026-10-20). `clientes` es el
  // «Recommended Device Count» de la ficha; las cifras del 2026-08 se quedaron cortas frente a ellas.
  // El C8111-G2-MX y el C8121-G2-MX son el hardware G2 con MX OS: se gestionan desde el dashboard y se
  // licencian como un MX, así que van en esta plataforma aunque su nombre sea de Secure Router.
  {id:'Meraki MX67',  ser:'Meraki MX', fam:'Sucursal pequeña (hasta 50 dispositivos)', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:false, bases:B_MX,
   psu:{tipo:'adaptador externo (MA-PWR-30WAC)', texto:'Carga de 5 W en reposo y 14 W como máximo (ficha).'},
   ports:'1 GE WAN + 1 GE LAN/WAN convertible + 3 GE LAN', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', hwSku:'MX67-HW', datasheet:DS.mx6768},
  {id:'Meraki MX67C', ser:'Meraki MX', fam:'Sucursal pequeña con LTE CAT 6 integrado', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:true, bases:B_MX,
   psu:{tipo:'adaptador externo (MA-PWR-30WAC)', texto:'Carga de 15 W en reposo y 23 W como máximo (ficha).'},
   ports:'1 GE WAN + 1 GE LAN/WAN convertible + 3 GE LAN + celular integrado', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', hwSku:null, datasheet:DS.mx6768},
  {id:'Meraki MX68',  ser:'Meraki MX', fam:'Sucursal pequeña con PoE+ (hasta 50 dispositivos)', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:false, bases:B_MX,
   poeNota:'2 puertos LAN PoE+',
   psu:{tipo:'adaptador externo (MA-PWR-100WAC)', texto:'Carga de 11 W en reposo y 79 W como máximo (ficha).'},
   ports:'2 GE WAN + 10 GE LAN (2 PoE+)', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', hwSku:'MX68-HW', datasheet:DS.mx6768},
  {id:'Meraki MX68CW', ser:'Meraki MX', fam:'Sucursal pequeña con PoE+, LTE y Wi-Fi integrados', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:true, bases:B_MX,
   poeNota:'2 puertos LAN PoE+',
   psu:{tipo:'adaptador externo (MA-PWR-100WAC)', texto:'Carga de 19 W en reposo y 89 W como máximo (ficha).'},
   ports:'2 GE WAN + 10 GE LAN (2 PoE+) + celular y 802.11ac integrados', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', hwSku:null, datasheet:DS.mx6768},
  {id:'Meraki MX75',  ser:'Meraki MX', fam:'Sucursal pequeña / mediana (hasta 200 dispositivos)', fwd:1000, ipsec:1000, sdwan:1000, amenazas:1000, aps:null, clientes:200, redund:false, lte:false, bases:B_MX,
   tuneles:75, poeNota:'2 puertos LAN PoE+',
   psu:{tipo:'adaptador externo de 100 W DC (incluido)', texto:'Carga de 12 W en reposo y 96 W como máximo (ficha).'},
   ports:'1 GE SFP + 2 GE WAN · 10 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:MX_LIC, lic:'meraki', hwSku:'MX75-HW', datasheet:DS.mx75},
  {id:'Meraki MX85',  ser:'Meraki MX', fam:'Sucursal mediana (hasta 250 dispositivos)', fwd:1000, ipsec:1000, sdwan:1000, amenazas:1000, aps:null, clientes:250, redund:false, lte:false, bases:B_MX,
   tuneles:200,
   psu:{tipo:'fuente interna', texto:'Carga de 12 W en reposo y 55 W como máximo (ficha).'},
   ports:'2 GE SFP + 2 GE WAN · 8 GE + 2 GE SFP LAN · rack', nim:0, sm:0, optics:['sfp1g'], parts:MX_LIC, lic:'meraki', hwSku:'MX85-HW', datasheet:DS.mx85},
  {id:'Meraki MX95',  ser:'Meraki MX', fam:'Campus / hub regional', fwd:3000, ipsec:2500, sdwan:2500, amenazas:2000, aps:null, clientes:null, redund:false, lte:false, bases:B_MX,
   psu:{tipo:'fuente interna', texto:'Carga de 42 W en reposo y 109 W como máximo (ficha). Un puerto WAN de 2,5G con PoE+.'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 4 GE + 2x 10G SFP+ LAN · rack', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:MX_LIC, lic:'meraki', hwSku:'MX95-HW', datasheet:DS.mx95},
  {id:'Meraki MX105', ser:'Meraki MX', fam:'Campus / hub grande con fuentes modulares', fwd:5000, ipsec:3500, sdwan:3500, amenazas:2500, aps:null, clientes:null, redund:true, lte:false, bases:B_MX,
   psu:{tipo:'modulares, 2 x 150 W AC (MA-PWR-150WAC)', texto:'Carga de 53 W en reposo y 123 W como máximo (ficha); el peso se da «con 2 ventiladores y 2 fuentes».'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 4 GE + 2x 10G SFP+ LAN · rack', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:MX_LIC, lic:'meraki', hwSku:'MX105-HW', datasheet:DS.mx95},
  {id:'Meraki MX250', ser:'Meraki MX', fam:'Concentrador VPN / campus grande (2.000 dispositivos)', fwd:7500, ipsec:4000, sdwan:4000, amenazas:2000, amenazasDet:3000, aps:null, clientes:2000, redund:true, lte:false, bases:B_MXP,
   psu:{tipo:'modulares, 2 x 250 W AC (MA-PWR-250WAC)', texto:'Carga de 105 W en reposo y 190 W como máximo (ficha).'},
   ports:'2x 10G SFP+ WAN · 8x 10G SFP+ + 8x 1G SFP + 8 GE LAN · 1RU', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:MX_LIC, lic:'meraki', hwSku:'MX250-HW', datasheet:DS.mx250},
  {id:'Meraki MX450', ser:'Meraki MX', fam:'Concentrador VPN / campus grande (10.000 dispositivos)', fwd:10000, ipsec:6500, sdwan:6500, amenazas:5000, amenazasDet:7000, aps:null, clientes:10000, redund:true, lte:false, bases:B_MXP,
   psu:{tipo:'modulares, 2 x 250 W AC (MA-PWR-250WAC)', texto:'Carga de 105 W en reposo y 190 W como máximo (ficha).'},
   ports:'2x 10G SFP+ WAN · 8x 10G SFP+ + 8x 1G SFP + 8 GE LAN · 1RU', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:MX_LIC, lic:'meraki', hwSku:'MX450-HW', datasheet:DS.mx450},
  {id:'Cisco Secure Router C8111-G2-MX', ser:'Meraki MX', fam:'Sucursal G2 gestionada en la nube (hasta 200 dispositivos)', fwd:2000, ipsec:1200, sdwan:1200, amenazas:1200, aps:null, clientes:200, redund:false, lte:false, bases:{...B_MX, amenazas:'Advanced Security'},
   poe:75, poeNota:'30 W en un WAN mGig (802.3at) y 45 W en un LAN (802.3bt)',
   psu:{tipo:'adaptador externo de 150 W DC (MA-PWR-150WAC-ADP)', texto:'Sistema: 16 W en reposo y 22 W como máximo; con PoE, hasta 97 W (ficha).'},
   ports:'2 WAN mGig RJ45 · LAN GE (1 PoE)', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', hwSku:'C8111-G2-MX', datasheet:DS.c81mx},
  {id:'Cisco Secure Router C8121-G2-MX', ser:'Meraki MX', fam:'Sucursal G2 gestionada en la nube, más PoE (hasta 200 dispositivos)', fwd:2000, ipsec:1200, sdwan:1200, amenazas:1200, aps:null, clientes:200, redund:false, lte:false, bases:{...B_MX, amenazas:'Advanced Security'},
   poe:165, poeNota:'30 W en un WAN mGig (802.3at) y 135 W en tres LAN (802.3bt)',
   psu:{tipo:'adaptador externo de 250 W DC (MA-PWR-250WAC-ADP)', texto:'Sistema: 18 W en reposo y 26 W como máximo; con PoE, hasta 176 W (ficha).'},
   ports:'2 WAN mGig RJ45 · hasta 10 GE LAN (3 PoE)', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', hwSku:'C8121-G2-MX', datasheet:DS.c81mx},
];

for (const m of MODELS) {
  m.eolAnnounced = EOL_ANNOUNCED[m.id] || null;
}

// Licencias de la línea G2 (guía de pedido, tablas 9 y 10). La referencia completa sale de la clase
// de la plataforma; el término y el precio, de CCW. LIC-SEC no existe en 2XL: el 8600 no publica
// Threat Protection.
const LICENCIAS_G2 = {
  cswanE: {sku:'LIC-CSWAN-{c}-E', n:'Cisco WAN Essentials', d:'Bajo Cisco Networking subscription. SD-WAN gestionado desde Catalyst SD-WAN Manager.'},
  cswanA: {sku:'LIC-CSWAN-{c}-A', n:'Cisco WAN Advantage', d:'Bajo Cisco Networking subscription. Todo Essentials más las funciones avanzadas de la matriz de licencias.'},
  rosA:   {sku:'LIC-ROS-{c}-A',   n:'Cisco Routing Advantage', d:'Suscripción de enrutamiento sin SD-WAN gestionado (modo autónomo). R-OS-{c}-A es su equivalente perpetuo.'},
  osE:    {sku:'R-OS-{c}-E',      n:'Cisco OS Essentials', d:'Sistema embebido precargado en cada Secure Router: va con el equipo.'},
  secT:   {sku:'LIC-SEC-{c}-T',   n:'Seguridad — Threat', d:'Complemento de amenazas (IPS). Requiere WAN Essentials/Advantage, Routing Advantage u OS Advantage.'},
  secC:   {sku:'LIC-SEC-{c}-C',   n:'Seguridad — URL Filtering', d:'Requiere además el complemento Threat. Se gestiona desde SD-WAN Manager.'},
  secM:   {sku:'LIC-SEC-{c}-M',   n:'Seguridad — Malware Defense', d:'Requiere además el complemento Threat. Se gestiona desde SD-WAN Manager.'},
};
// Módulos de la guía de pedido de la G2 (tabla 7, «Supported NIM and SM modules on the C8300 and
// C8200 Series») y de celular (tabla 8). `en` dice qué tipo de ranura ocupa.
const MODULOS_G2 = [
  {sku:'C-NIM-WAN-2X', en:'nim', d:'2 puertos 1/10 Gbps SFP/SFP+ WAN, con WAN MACsec'},
  {sku:'C-NIM-WAN-4S', en:'nim', d:'4 puertos 1 Gbps SFP WAN, con WAN MACsec'},
  {sku:'C-NIM-4X',     en:'nim', d:'Switch de 4 puertos 1/10 Gbps SFP/SFP+, MACsec LAN/WAN y L3 opcional'},
  {sku:'C-NIM-8T',     en:'nim', d:'Switch de 8 puertos 100 Mbps/1 Gbps, MACsec LAN/WAN y L3 opcional'},
  {sku:'C-NIM-8M',     en:'nim', d:'Switch de 8 puertos 100M/1/2,5 Gbps, UPoE+, MACsec LAN/WAN y L3 opcional'},
  {sku:'C-SM-16P4M2X', en:'sm',  d:'Módulo switch Catalyst L2 de 22 puertos con ASIC UADP'},
  {sku:'C-SM-NIM-ADPT',en:'sm',  d:'Portador de 2 NIM en formato SM-X'},
  {sku:'P-5GS6-R16SA-GL', en:'pim', d:'5G Sub-6 GHz Pluggable — 5G SA Global'},
  {sku:'P-LTEA7-NA',   en:'pim', d:'CAT7 LTE Advanced Pluggable — Norteamérica'},
  {sku:'P-LTEA7-EAL',  en:'pim', d:'CAT7 LTE Advanced Pluggable — EMEA, APAC y LATAM'},
  {sku:'P-LTEA7-JP',   en:'pim', d:'CAT7 LTE Advanced Pluggable — Japón'},
];

const OPTICS = {
  sfp1g: [
    {sku:'GLC-SX-MMD',  bom:'SFP-1GE-SX',   d:'1000BASE-SX · multimodo · LC · 550 m'},
    {sku:'GLC-LH-SMD',  bom:'SFP-1GE-LH',   d:'1000BASE-LX/LH · monomodo · LC · 10 km'},
    {sku:'GLC-ZX-SMD',  bom:'SFP-1GE-ZX',   d:'1000BASE-ZX · monomodo · LC · 70 km'},
    {sku:'GLC-T',       bom:'SFP-1GE-T',     d:'1000BASE-T · cobre · RJ45 · 100 m'},
    {sku:'GLC-TE',      bom:'SFP-GE-T',      d:'1000BASE-T enhanced · cobre · RJ45 · para ISR/Catalyst'},
  ],
  sfp10g: [
    {sku:'SFP-10G-SR',   bom:'SFP-10G-SR-S', d:'10GBASE-SR · multimodo · LC · 300 m'},
    {sku:'SFP-10G-LR',   bom:'SFP-10G-LR-S', d:'10GBASE-LR · monomodo · LC · 10 km'},
    {sku:'SFP-10G-ER',   bom:'SFP-10G-ER-I', d:'10GBASE-ER · monomodo · LC · 40 km'},
    {sku:'SFP-10G-ZR',   bom:'SFP-10G-ZR',   d:'10GBASE-ZR · monomodo · LC · 80 km'},
  ],
  qsfp40g: [
    {sku:'QSFP-40G-SR4', bom:'QSFP-40G-SR4-S',d:'40GBASE-SR4 · multimodo · MPO · 150 m'},
    {sku:'QSFP-40G-LR4', bom:'QSFP-40G-LR4-S',d:'40GBASE-LR4 · monomodo · LC · 10 km'},
  ],
  qsfp100g: [
    {sku:'QSFP-100G-SR4-S', bom:'QSFP-100G-SR4-S',d:'100GBASE-SR4 · multimodo · MPO · 100 m'},
    {sku:'QSFP-100G-LR4-S', bom:'QSFP-100G-LR4-S',d:'100GBASE-LR4 · monomodo · LC · 10 km'},
    {sku:'QSFP-100G-ER4-S', bom:'QSFP-100G-ER4-S',d:'100GBASE-ER4 · monomodo · LC · 40 km'},
  ]
};

const OPTIC_LABEL = {sfp1g:'1GE — SFP / GLC', sfp10g:'10GE — SFP+', qsfp40g:'40GE — QSFP+', qsfp100g:'100GE — QSFP28'};

const PARTS_DESC = {
  'LIC-HSEC':'Licencia HSEC (High Security) — activa criptografía fuerte (AES-256, SHA-2) en exportaciones restringidas',
  'NIM-4G-LTE':'NIM-4G-LTE-LA — módulo 4G LTE banda ancha para Latinoamérica · ocupa 1 slot NIM',
  'NIM-2GE-CU-SFP':'NIM-2GE-CU-SFP — tarjeta de 2 puertos GE combo (cobre + SFP)',
  'SM-X-1T3/E3':'SM-X-1T3/E3 — módulo de servicio T3/E3 · ocupa 1 slot SM',
  // Módulos de celular (PIM) de la guía de pedido de la G2, tabla 8: van en la ranura PIM de los 8100,
  // 8200 y 8300 que la tienen. Uno u otro según la región y la red del operador: «elegir uno».
  'P-5GS6-R16SA-GL':'P-5GS6-R16SA-GL — 5G Sub-6 GHz Pluggable, 5G SA Global · ranura PIM',
  'P-LTEA7-NA':'P-LTEA7-NA — CAT7 LTE Advanced Pluggable, Norteamérica · ranura PIM',
  'P-LTEA7-EAL':'P-LTEA7-EAL — CAT7 LTE Advanced Pluggable, EMEA, APAC y LATAM · ranura PIM',
  'P-LTEA7-JP':'P-LTEA7-JP — CAT7 LTE Advanced Pluggable, Japón · ranura PIM',
  'DNA-ADVANTAGE':'Licencia Cisco DNA Advantage — SD-WAN, seguridad, analítica avanzada, ThousandEyes integrado. SKU real con formato DNA-C-T<n>-A-<term>Y (n=tier de ancho de banda T0–T3+, confirmar en CCW/ordering guide según el modelo y throughput exacto).',
  'ASR1001X-10G-HA-BUN':'Bundle HA para ASR 1001-X: ESP10G, RP2, 10G AIM, licencia SEC',
  'ASR1002HX-HA-BUN':'Bundle HA para ASR 1002-HX: 2x ESP200, 2x RP3, licencia AES',
  'ASR1006X-HA-BUN':'Bundle HA para ASR 1006-X: chasis, 2x ESP200, 2x RP3, licencia AES',
  'LIC-MX-ENT':'Licencia Meraki MX Enterprise — SD-WAN esencial: Auto VPN, firewall, cloud management, zero-touch provisioning',
  'LIC-MX-SEC':'Licencia Meraki MX Advanced Security — todo Enterprise + IDS/IPS, content filtering, AMP (malware), reglas de firewall geográficas. Precio real confirmado (CCW, 17-ago-2026): LIC-MX67-SEC-3YR = $1,544.39 (MX67, término 3 años) — referencia de orden de magnitud, escala con el modelo.',
  'LIC-MX-SDW':'Licencia Meraki Secure SD-WAN Plus — todo Advanced Security + Meraki Insight (analítica ML), integración ThousandEyes, Smart SaaS QoE. SKU real: LIC-MX-SDW-[XS|S|M|L|XL]-[1|3|5]Y (tamaño según modelo MX, no intercambiable entre modelos)',
};

const SMARTNET = {
  low: {n:'SMARTnet 8x5xNBD',   sla:'8x5xNBD', d:'Soporte técnico 8x5, reemplazo de hardware al siguiente día hábil. Para equipos sin horario crítico.'},
  med: {n:'SMARTnet 8x5x4',     sla:'8x5x4H',  d:'Soporte 8x5 con respuesta 4 horas. Para sucursales productivas con ventana de mantenimiento nocturna.'},
  high:{n:'SMARTnet 24x7x4',    sla:'24x7x4H', d:'Soporte 24x7 con respuesta 4 horas. Para hubs, DC edge y sitios críticos sin tolerancia a caída.'},
};

// Cisco DNA subscription: SKU real con formato DNA-C-T<n>-<letra>-<term>Y — T<n> = tier de ancho de banda
// (T0/T1/T2/T3+, depende del modelo y throughput contratado, se confirma en CCW/ordering guide), letra =
// nivel de features (E=Essentials, A=Advantage, P=Premier solo bajo Network Premier), term = 1/3/5/7 años.
// Reglas de disponibilidad verificadas (ordering guide oficial, ago-2026):
//  · DNA Essentials NO soporta tier de ancho de banda T3 o superior (requiere Advantage o Premier).
//  · Catalyst 8500 series solo soporta DNA Advantage — Essentials no está disponible en esa plataforma.
const DNA_DESC = {
  ess:  'DNA Essentials — licenciamiento básico: SD-WAN, QoS, administración centralizada. No disponible en Catalyst 8500 ni en tiers de ancho de banda T3+.',
  adv:  'DNA Advantage — SD-WAN avanzado: AppFlow, Catalyst SD-WAN Analytics, ThousandEyes, Zero Trust Network Access. Único tier soportado en Catalyst 8500.',
  pre:  'DNA Premier — todo Advantage + Umbrella SIG, Secure Endpoint, Duo MFA integrado. Requiere programa Cisco Network Premier.',
};

// Cisco Networking Cloud — dos frentes de unificación confirmados:
// 1) Switching: desde IOS XE 17.15+, switches Catalyst 9200/9300/9500 elegibles migran a gestión cloud vía
//    Meraki Dashboard reutilizando la licencia DNA existente, sin licencia Meraki adicional, hasta el
//    1-feb-2029 ("Cloud Entitlement for DNA"). Fuente: documentation.meraki.com/Switching/Cloud_Management_with_IOS_XE.
// 2) Routing (hallazgo del export de CCW, 17-ago-2026): el MISMO chasis "Secure Router (G2)" que reemplaza al
//    Catalyst 8300/8200 se vende en dos SKUs paralelos — sin sufijo "-MX" corre IOS XE/Catalyst tradicional
//    (gestión CCW + DNA), y con sufijo "-MX" (ej. C8355-G2-MX, C8111-G2-MX, C8121-G2-MX) corre Meraki OS y se
//    gestiona 100% desde el Meraki Dashboard. Es la misma unificación pero aplicada a hardware de routing/SD-WAN,
//    no solo a switching — la decisión "IOS XE vs Meraki" ahora es de SKU, no de plataforma física distinta.
const CLOUD_UNIFICATION_NOTE = 'Cisco unificó Meraki y Catalyst bajo "Cisco Networking Cloud" en dos frentes: switches Catalyst 9200/9300/9500 elegibles migran a gestión desde el Meraki Dashboard reutilizando la licencia DNA existente (sin costo Meraki adicional hasta el 1-feb-2029); y en routing/SD-WAN, el nuevo chasis "Secure Router (G2)" que reemplaza al Catalyst 8300/8200 se vende en dos SKUs paralelos sobre el mismo hardware — sin sufijo "-MX" corre IOS XE clásico (CCW + DNA), con sufijo "-MX" (C8355-G2-MX, C8111-G2-MX, C8121-G2-MX) corre Meraki OS gestionado 100% desde el dashboard. La elección IOS XE vs. Meraki ya es una decisión de SKU sobre el mismo fierro, no de plataformas distintas.';

// Comparativa SD-WAN Cisco Catalyst SD-WAN vs. otros fabricantes (Fortinet, Palo Alto) — hallazgos de research
// de mercado (PeerSpot, Info-Tech SoftwareReviews, análisis independientes, ago-2026). Ver nota completa en
// la página del dimensionador.
const SDWAN_COMPARISON_NOTE = 'Catalyst SD-WAN es un router con funciones de seguridad añadidas; Fortinet y Palo Alto son firewalls con routing añadido — por eso la visibilidad nativa de tráfico/aplicaciones y el enrutamiento consciente de aplicaciones de Cisco suelen calificar por debajo de Fortinet en reportes de usuarios, y la licencia/configuración es más compleja y costosa. A favor de Cisco: soporte nativo de Segment Routing sobre IPv6 (SRv6) para ingeniería de tráfico determinística en WANs multi-MPLS complejas, algo que Fortinet, Palo Alto y Aruba no igualan — ventaja real en entornos grandes con múltiples proveedores de transporte.';

module.exports = { MODELS, OPTICS, OPTIC_LABEL, PARTS_DESC, SMARTNET, DNA_DESC, LICENCIAS_G2, MODULOS_G2, CLOUD_UNIFICATION_NOTE, SDWAN_COMPARISON_NOTE };
