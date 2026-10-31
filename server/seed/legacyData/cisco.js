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
const BOLETIN_8500_20X6C = 'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8500-20x6c-eol.html';
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
  'Catalyst 8500-20X6C':     {pid:'C8500-20X6C',     lastOrder:'2027-07-31', sucesor:'Cisco Secure Router C8650-G2', url:BOLETIN_8500_20X6C},
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
const B_ISR = {fwd:'512 B', ipsec:'512 B, con licencia HSEC (sin ella, 250 Mbps en los -8P y 150 en los -4P con FL-VPERF)', sdwan:'512 B, IPsec + QoS + DPI + FNF', amenazas:null};
const B_MX = {fwd:'firewall de estado; Meraki no publica tamaño de paquete', ipsec:'VPN sitio a sitio (AutoVPN)', sdwan:'VPN sitio a sitio (AutoVPN)', amenazas:'NGFW en modo detección (IDS)'};
const B_MXP = {...B_MX, amenazas:'NGFW (prevención)'};
const B_MXG2 = {...B_MX, fwd:'«Maximum NGFW Throughput»; Meraki no publica tamaño de paquete', amenazas:'Advanced Security'};
// Lo heredado de la revisión del 2026-10-01 que esta no relee: los ASR 1000 (fuera de venta).
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
  c8355mx:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/C8355-G2-MX_Datasheet',
  c8455mx:'https://documentation.meraki.com/SASE_and_SD-WAN/MX/Product_Information/Overviews_and_Datasheets/C8455-G2-MX_Datasheet',
};

// Módulos de celular (PIM) de la guía de pedido de la G2 (tabla 8), los mismos en 8100, 8200 y 8300.
const PIM = ['P-5GS6-R16SA-GL', 'P-LTEA7-NA', 'P-LTEA7-EAL', 'P-LTEA7-JP'];
const MX_LIC = ['LIC-MX-ENT', 'LIC-MX-SEC', 'LIC-MX-SDW'];

const MODELS = [
  // ── ISR 1000 ── Ficha c78-739512, releída entera el 2026-10-20: reenvío e IPsec en modo autónomo
  // y SD-WAN con IQDF, todo a 512 B (tablas 4-6 del 116x, 17-19 del 112x y 25-27 del 111x). Los
  // 1111/1116 traían cifras de antes sin base (300 Mbps de reenvío frente a los 1.800 publicados),
  // una ranura NIM que la serie 1100 no tiene (la ficha lista cada variante con sus puertos fijos)
  // y el C1116-4P con LTE: es 1 GE WAN + DSL; el LTE va en las variantes -LTEEA (tabla 22).
  {id:'ISR 1111-8P',      ser:'ISR 1000', fam:'Sucursal pequeña, 8 GE',                 fwd:1800, ipsec:600, sdwan:250, amenazas:null, aps:null, redund:false, lte:false, bases:B_ISR,
   tuneles:200, tunelesNota:'túneles del overlay SD-WAN; 100 SVTI en modo autónomo', rutas:280000,
   ports:'2 GE WAN + 8 GE LAN', nim:0, sm:0, pim:false, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna', datasheet:DS.isr},
  {id:'ISR 1111X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña, 8 GB de memoria',      fwd:1800, ipsec:600, sdwan:250, amenazas:null, aps:null, redund:false, lte:false, bases:B_ISR,
   tuneles:200, tunelesNota:'túneles del overlay SD-WAN; 100 SVTI en modo autónomo', rutas:800000,
   ports:'2 GE WAN + 8 GE LAN', nim:0, sm:0, pim:false, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna', datasheet:DS.isr},
  {id:'ISR 1116-4P',      ser:'ISR 1000', fam:'Sucursal pequeña con VDSL2/ADSL2+',      fwd:1600, ipsec:500, sdwan:200, amenazas:null, aps:null, redund:false, lte:false, bases:B_ISR,
   tuneles:200, tunelesNota:'túneles del overlay SD-WAN; 100 SVTI en modo autónomo', rutas:280000,
   ports:'1 GE WAN + DSL · 4 GE LAN', nim:0, sm:0, pim:false, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna', datasheet:DS.isr},
  {id:'ISR 1121X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña, 8 GB de memoria',      fwd:1600, ipsec:600, sdwan:250, amenazas:null, aps:null, redund:false, lte:false, bases:B_ISR,
   tuneles:200, tunelesNota:'túneles del overlay SD-WAN; 100 SVTI en modo autónomo', rutas:280000, nat:100000,
   ports:'2 GE WAN + 8 GE LAN', nim:0, sm:0, pim:false, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna', datasheet:DS.isr},
  {id:'ISR 1161X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña de alto reenvío, 8 GB', fwd:1900, ipsec:700, sdwan:350, amenazas:null, aps:null, redund:false, lte:false, bases:B_ISR,
   tuneles:200, tunelesNota:'túneles del overlay SD-WAN; 100 SVTI en modo autónomo', rutas:800000, nat:100000,
   ports:'2 GE WAN + 8 GE LAN', nim:0, sm:0, pim:false, optics:['sfp1g'], parts:['LIC-HSEC'], lic:'dna', datasheet:DS.isr},

  // ── Catalyst 8000 Edge ── Fin de venta anunciado en todos (ver EOL_ANNOUNCED); el del 8500-20X6C
  // apareció en la lista de avisos de la serie el 2026-10-20 (EOL15954, anunciado el 27-jul-2026).
  // Precios de lista del export de CCW del 17-ago-2026 en los tres que los traían.
  {id:'Catalyst 8200L',   ser:'Catalyst 8000', fam:'Sucursal SD-WAN compacta',          fwd:3800, ipsec:400, sdwan:300, amenazas:null, aps:null, redund:false, lte:false, bases:B_C8K,
   tuneles:1500, pim:true, clase:null,
   psu:{tipo:'fuente interna fija de AC', texto:'Ficha: «Both models use an internal, fixed AC power supply»; el PoE de una NIM pide una fuente externa adicional.'},
   ports:'2 GE RJ45 + 2 GE SFP WAN · 1 NIM · 1 PIM', nim:1, sm:0, optics:['sfp1g'], parts:['DNA-ADVANTAGE'], lic:'dna', dnaTierMax:'T2', datasheet:DS.c8200},
  {id:'Catalyst 8200',    ser:'Catalyst 8000', fam:'Sucursal SD-WAN estándar',          fwd:3800, ipsec:900, sdwan:850, amenazas:980, aps:null, redund:false, lte:false, bases:B_C8K,
   tuneles:2500, pim:true,
   psu:{tipo:'fuente interna fija de AC', texto:'Ficha: «Both models use an internal, fixed AC power supply»; el PoE de una NIM pide una fuente externa adicional.'},
   ports:'2 GE RJ45 + 2 GE SFP WAN · 1 NIM · 1 PIM', nim:1, sm:0, optics:['sfp1g'], parts:['DNA-ADVANTAGE'], elp:'$6,967.76', elpN:6967.76, lic:'dna', dnaTierMax:'T2', datasheet:DS.c8200},
  {id:'Catalyst 8300-1N1S-6T',   ser:'Catalyst 8000', fam:'Hub regional SD-WAN, WAN 1G',  fwd:19700, ipsec:1900, sdwan:1700, amenazas:2100, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'6 GE (2 SFP) · 1 NIM · 1 SM · 1 PIM · 1RU', nim:1, sm:1, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], elp:'$21,286.41', elpN:21286.41, lic:'dna', dnaTierMax:'T2', datasheet:DS.c8300},
  {id:'Catalyst 8300-1N1S-4T2X', ser:'Catalyst 8000', fam:'Hub regional SD-WAN, WAN 10G', fwd:19700, ipsec:6600, sdwan:5500, amenazas:2900, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'2x 10G SFP+ + 4 GE · 1 NIM · 1 SM · 1 PIM · 1RU', nim:1, sm:1, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', dnaTierMax:'T3', datasheet:DS.c8300},
  {id:'Catalyst 8300-2N2S-6T',   ser:'Catalyst 8000', fam:'Hub regional SD-WAN doble NIM, WAN 1G', fwd:19700, ipsec:1900, sdwan:1700, amenazas:2300, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'6 GE (2 SFP) · 2 NIM · 2 SM · 1 PIM · 2RU', nim:2, sm:2, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], elp:'$29,026.93', elpN:29026.93, lic:'dna', dnaTierMax:'T2', datasheet:DS.c8300},
  {id:'Catalyst 8300-2N2S-4T2X', ser:'Catalyst 8000', fam:'Hub regional SD-WAN doble NIM, WAN 10G', fwd:19700, ipsec:9300, sdwan:5600, amenazas:4900, aps:null, redund:true, lte:false, bases:B_C8K,
   tuneles:6000, pim:true,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «All Catalyst 8300 platforms ship with dual power supplies for redundancy».'},
   ports:'2x 10G SFP+ + 4 GE · 2 NIM · 2 SM · 1 PIM · 2RU', nim:2, sm:2, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', dnaTierMax:'T3', datasheet:DS.c8300},
  {id:'Catalyst 8500L-8S4X',     ser:'Catalyst 8000', fam:'Agregación / hub DC compacto',  fwd:39000, ipsec:19000, sdwan:10000, amenazas:4000, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:6000,
   psu:{tipo:'dos fuentes de serie', texto:'Ficha: «High-efficiency dual power supplies by default for power supply redundancy».'},
   ports:'4x 1/10G SFP+ + 8x 1G SFP · 1RU', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', dnaTierMax:'T3', datasheet:DS.c8500},
  {id:'Catalyst 8500-12X',       ser:'Catalyst 8000', fam:'Hub DC / agregación 10G',       fwd:118000, ipsec:84000, sdwan:22600, amenazas:null, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:8000,
   psu:{tipo:'dos fuentes de serie (PWR-CH1-750WACR o PWR-CH1-950WDCR)', texto:'Ficha: «High-efficiency dual power supplies by default for power supply redundancy».'},
   ports:'12x 1/10G SFP+ · 1RU', nim:0, sm:0, optics:['sfp10g'], parts:['DNA-ADVANTAGE'], lic:'dna', dnaTierMax:'T3', datasheet:DS.c8500},
  {id:'Catalyst 8500-12X4QC',    ser:'Catalyst 8000', fam:'Hub DC / Edge de alto rendimiento', fwd:197000, ipsec:135000, sdwan:31900, amenazas:null, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:8000,
   psu:{tipo:'dos fuentes de serie (PWR-CH1-750WACR o PWR-CH1-950WDCR)', texto:'Ficha: «High-efficiency dual power supplies by default for power supply redundancy».'},
   ports:'12x 1/10G SFP+ + 2x 40G QSFP+ + 2x 40/100G QSFP28 (240 GE simultáneos) · 1RU', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['DNA-ADVANTAGE'], lic:'dna', dnaTierMax:'T3', datasheet:DS.c8500},
  {id:'Catalyst 8500-20X6C',     ser:'Catalyst 8000', fam:'Núcleo SD-WAN / DC de alta densidad', fwd:500000, ipsec:400000, sdwan:100000, amenazas:null, aps:null, redund:true, lte:false, bases:B_C85,
   tuneles:8000,
   psu:{tipo:'fuentes N+1 de serie (opción N+2): PWR-CH1-1100WAC o PWR-CH1-950WDC', texto:'Ficha: «N+1 redundancy (Option N+2 redundancy)».'},
   ports:'20x 1/10G SFP+ + 6x 40/100G QSFP28 · 3RU', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['DNA-ADVANTAGE'], lic:'dna', dnaTierMax:'T5', datasheet:DS.c8500},

  // ── Cisco Secure Router (G2) ── Fichas de las series 8100 a 8600 y «Cisco 8000 Series Secure Routers
  // Ordering Guide» (oct-2026). `clase` es la «Platform class» de su tabla 1 (S, M, L, XL, 2XL), que es
  // la que fija la referencia de cada licencia (LIC-CSWAN-<clase>-E/A, LIC-SEC-<clase>-T...). Los
  // túneles son los de IOS XE 26.2.1 en adelante; la cifra anterior va en `tunelesNota`. Precio de
  // lista solo en el C8355-G2, el único que traía el export de CCW del 17-ago-2026.
  {id:'Cisco Secure Router C8130-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña, 6 GE', clase:'S', fwd:1900, ipsec:1500, sdwan:900, amenazas:null, aps:null, redund:false, lte:false, bases:B_G2, secAddon:false,
   tuneles:250, rutas:280000, nat:100000, pim:false, sdwanDesde:'IOS XE 26.2.1',
   psu:{watts:16, tipo:'adaptador externo (PWR-CC1-30WAC por defecto)'},
   ports:'1 GE + 1 GE RJ45/SFP WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  // Variantes de la ficha de la serie 8100 (tablas 10, 12 y 13; incorporadas el 2026-10-26): el DSL
  // integrado (VAI: Annex B/J sobre RDSI; VAP: Annex A sobre POTS), la jaula XGSPON/10GBASE-T (solo
  // SFP-10G-ONT20-I o SFP-10G-T-X, tabla 10 de su guía de hardware) y el 10GBASE-T nativo de las «H».
  // Mismas cifras que su modelo base (columnas compartidas de las tablas 12 y 13); sin complementos de
  // seguridad las 8130 (guía de pedido: «do not support Threat, URL Filtering, and Malware Defense»).
  {id:'Cisco Secure Router C8130-VAI-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con DSL (Annex B/J) y XGSPON/10GBASE-T', clase:'S', fwd:1900, ipsec:1500, sdwan:900, amenazas:null, aps:null, redund:false, lte:false, bases:B_G2, secAddon:false,
   tuneles:250, rutas:280000, nat:100000, pim:false, sdwanDesde:'IOS XE 26.2.1',
   psu:{watts:23, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'1 GE RJ45/SFP + 1 DSL + 1 XGSPON/10GBASE-T WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g', 'sfp10gt', 'xgspon'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8130-VAP-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con DSL (Annex A) y XGSPON/10GBASE-T', clase:'S', fwd:1900, ipsec:1500, sdwan:900, amenazas:null, aps:null, redund:false, lte:false, bases:B_G2, secAddon:false,
   tuneles:250, rutas:280000, nat:100000, pim:false, sdwanDesde:'IOS XE 26.2.1',
   psu:{watts:23, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'1 GE RJ45/SFP + 1 DSL + 1 XGSPON/10GBASE-T WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g', 'sfp10gt', 'xgspon'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8130H-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con WAN 10GBASE-T', clase:'S', fwd:1900, ipsec:1500, sdwan:900, amenazas:null, aps:null, redund:false, lte:false, bases:B_G2, secAddon:false,
   tuneles:250, rutas:280000, nat:100000, pim:false, sdwanDesde:'IOS XE 26.2.1',
   psu:{watts:22, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'1 GE RJ45/SFP + 1 10GBASE-T WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8131-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con Threat Protection', clase:'S', fwd:1900, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:false,
   psu:{watts:16, tipo:'adaptador externo (PWR-CC1-30WAC por defecto)'},
   ports:'1 GE + 1 GE RJ45/SFP WAN · 2 GE flex · 2 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8140-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña, 10 GE', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:null, aps:null, redund:false, lte:false, bases:B_G2, secAddon:false,
   tuneles:250, rutas:280000, nat:100000, pim:false, sdwanDesde:'IOS XE 26.2.1',
   psu:{watts:20, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'2 GE RJ45/SFP WAN · 2 GE flex · 6 GE LAN', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8151-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con PIM 5G/LTE', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:false, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:true,
   psu:{watts:23, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'2 GE RJ45/SFP WAN · 2 GE flex · 6 GE LAN · 1 PIM', nim:0, sm:0, optics:['sfp1g'], parts:PIM, lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8151-CVAI-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con DSL (Annex B/J), XGSPON/10GBASE-T y 5G RedCap', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:true, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:false,
   psu:{watts:27, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'1 GE RJ45/SFP + 1 DSL + 1 XGSPON/10GBASE-T WAN · 2 GE flex · 6 GE LAN · 5G RedCap integrado', nim:0, sm:0, optics:['sfp1g', 'sfp10gt', 'xgspon'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8151-CVAP-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con DSL (Annex A), XGSPON/10GBASE-T y 5G RedCap', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:true, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:false,
   psu:{watts:27, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'1 GE RJ45/SFP + 1 DSL + 1 XGSPON/10GBASE-T WAN · 2 GE flex · 6 GE LAN · 5G RedCap integrado', nim:0, sm:0, optics:['sfp1g', 'sfp10gt', 'xgspon'], parts:[], lic:'cswan', datasheet:DS.sr8100},
  {id:'Cisco Secure Router C8151H-C-G2', ser:'Secure Router (G2)', fam:'Sucursal pequeña con WAN 10GBASE-T y 5G RedCap', clase:'S', fwd:5600, ipsec:1500, sdwan:900, amenazas:1000, aps:null, redund:false, lte:true, bases:B_G2,
   tuneles:250, rutas:500000, nat:100000, pim:false,
   psu:{watts:25, tipo:'adaptador externo (PWR-CC1-66WAC por defecto)'},
   ports:'1 GE RJ45/SFP + 1 10GBASE-T WAN · 2 GE flex · 6 GE LAN · 5G RedCap integrado', nim:0, sm:0, optics:['sfp1g'], parts:[], lic:'cswan', datasheet:DS.sr8100},
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
   ports:'4x 10G SFP+ + 4x 5G mGig + 2 GE · 1 PIM · 16 GB', nim:0, sm:0, optics:['sfp1g','sfp10g','sfp10gt'], parts:PIM, elp:'$15,552.28', elpN:15552.28, lic:'cswan', datasheet:DS.sr8300},
  {id:'Cisco Secure Router C8375-E-G2', ser:'Secure Router (G2)', fam:'Hub regional modular (NIM + SM + PIM)', clase:'L', fwd:38000, ipsec:20000, sdwan:12000, amenazas:7000, aps:null, redund:true, lte:false, bases:B_G2,
   tuneles:4000, tunelesNota:'3.500 antes de IOS XE 26.2.1', rutas:2000000, nat:1500000, pim:true, poe:360, poeNota:'con la fuente PWR-CC1-760WAC', macsec:'nim',
   psu:{watts:55, tipo:'dos fuentes internas (FRU) de 400 W AC por defecto; 760 W AC con PoE o 500 W DC', texto:'Ficha: «Power Supply (Default - Dual PSU)»; consumo típico 55 W con la fuente por defecto y sin módulos.'},
   ports:'2x 10G SFP+ + 4x 2,5G mGig · 1 NIM · 1 SM · 1 PIM · 1RU', nim:1, sm:1, optics:['sfp1g','sfp10g','sfp10gt'], parts:PIM, lic:'cswan', datasheet:DS.sr8300},
  {id:'Cisco Secure Router C8455-G2', ser:'Secure Router (G2)', fam:'Internet edge / campus, familia 8400', clase:'XL', fwd:67000, ipsec:31000, sdwan:15500, amenazas:9500, aps:null, redund:null, lte:false, bases:B_G2,
   tuneles:6000, tunelesNota:'3.500 antes de IOS XE 26.2.1', rutas:5800000, nat:null, pim:false,
   psu:{tipo:'250 W AC (PWR-CH1-250WAC) por defecto; 400 W DC u HVDC', texto:'La ficha da el peso «with 2x AC power supplies and fan tray» y la guía de pedido una sola referencia de fuente por defecto: cuántas vienen de serie no consta. Confirmar en CCW antes de prometer redundancia.'},
   ports:'8x 1G SFP + 2x 10G SFP+ + 2x 10/25G SFP28 · 1RU · 32 GB', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8400},
  {id:'Cisco Secure Router C8475-G2', ser:'Secure Router (G2)', fam:'Internet edge / campus de alta densidad, familia 8400', clase:'XL', fwd:91000, ipsec:45000, sdwan:21700, amenazas:10900, aps:null, redund:null, lte:false, bases:B_G2,
   tuneles:6000, tunelesNota:'3.500 antes de IOS XE 26.2.1', rutas:5800000, nat:null, pim:false,
   psu:{tipo:'400 W AC (PWR-CH1-400WAC) por defecto; 400 W DC u HVDC', texto:'La ficha da el peso «with 2x AC power supplies and fan tray» y la guía de pedido una sola referencia de fuente por defecto: cuántas vienen de serie no consta. Confirmar en CCW antes de prometer redundancia.'},
   ports:'8x 1G SFP + 8x 10G SFP+ + 4x 10/25G SFP28 · 1RU · 32 GB', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8400},
  {id:'Cisco Secure Router C8550-G2', ser:'Secure Router (G2)', fam:'Agregación / headend DC, 12x 10G', clase:'XL', fwd:115000, ipsec:48000, sdwan:19000, amenazas:null, aps:null, redund:null, lte:false, bases:B_G2, secAddon:false,
   tuneles:10000, rutas:8000000, nat:16000000, pim:false, macsec:'integrado',
   psu:{tipo:'750 W AC (PWR-CH1-750WACR) o 950 W DC', texto:'La guía de instalación muestra dos bahías de fuente (PEM 0 y PEM 1); la guía de pedido no dice cuántas vienen por defecto.'},
   ports:'12x 1/10G SFP+ · MACsec en todos · 1RU', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:[], lic:'cswan', datasheet:DS.sr8500},
  {id:'Cisco Secure Router C8570-G2', ser:'Secure Router (G2)', fam:'Agregación / headend DC con 40/100G', clase:'XL', fwd:190000, ipsec:63000, sdwan:21000, amenazas:null, aps:null, redund:null, lte:false, bases:B_G2, secAddon:false,
   tuneles:10000, rutas:8000000, nat:16000000, pim:false, macsec:'integrado',
   psu:{tipo:'750 W AC (PWR-CH1-750WACR) o 950 W DC', texto:'La guía de instalación muestra dos bahías de fuente (PEM 0 y PEM 1); la guía de pedido no dice cuántas vienen por defecto.'},
   ports:'12x 10G SFP+ + 2x 40G QSFP+ + 2x 40/100G QSFP28 (240G simultáneos) · 1RU', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:[], lic:'cswan', datasheet:DS.sr8500},
  {id:'Cisco Secure Router C8650-G2', ser:'Secure Router (G2)', fam:'Núcleo SD-WAN / headend de proveedor', clase:'2XL', fwd:540000, ipsec:225000, sdwan:80000, amenazas:null, aps:null, redund:true, lte:false, bases:B_G2, secAddon:false,
   tuneles:12000, rutas:16000000, nat:32000000, pim:false, macsec:'integrado',
   psu:{tipo:'tres fuentes de 1.100 W AC por defecto (3x PWR-CH1-1100WAC-D) o 950 W DC', texto:'Ficha: «AC or DC power supplies (N+2 redundancy)»; guía de pedido: tres fuentes por defecto y una cuarta opcional.'},
   ports:'20x 1/10G SFP+ + 6x 40/100G QSFP28 · 3RU · 64 GB', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:[], lic:'cswan', datasheet:DS.sr8600},

  // ── ASR 1000 ── Fin de venta vencido: parque instalado.
  {id:'ASR 1001-X',       ser:'ASR 1000', fam:'WAN Edge compacto (2.5–20 Gbps)',        fwd:20000, ipsec:8000, sdwan:5000, aps:null, redund:true, lte:false, bases:B_ANT,
   ports:'6 GE integrados + 2 SFP+ · ESP escal.', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['ASR1001X-10G-HA-BUN'], lic:'dna'},
  {id:'ASR 1002-HX',      ser:'ASR 1000', fam:'WAN Edge / DC gateway (35 Gbps)',        fwd:35000, ipsec:18000,sdwan:10000,aps:null, redund:true, lte:false, bases:B_ANT,
   ports:'8x 1GE SFP + 8x 10GE SFP+ · 1 ranura EPA', nim:0, sm:0, optics:['sfp1g','sfp10g','qsfp100g'], parts:['ASR1002HX-HA-BUN'], lic:'dna'},
  {id:'ASR 1006-X',       ser:'ASR 1000', fam:'Core WAN modular (200 Gbps)',            fwd:200000,ipsec:78000,sdwan:20000,aps:null, redund:true, lte:false, bases:B_ANT,
   ports:'6 slots SPA · hasta 200GE · modular', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['ASR1006X-HA-BUN'], lic:'dna'},

  // ── Meraki MX ── Fichas vigentes de documentation.meraki.com (2026-10-20). `clientes` es el
  // «Recommended Device Count» de la ficha; las cifras del 2026-08 se quedaron cortas frente a ellas.
  // La ficha del MX95/MX105 no lo publica: sale de la «MX Sizing Guide and Principles» (tabla «Use
  // Case Recommendations», que casa con las fichas en los demás modelos).
  // `sdwPlus` es el grupo de la ampliación SD-WAN+ por dispositivo de la página de licencias de
  // Meraki (LIC-MX-SDW-<grupo>-<n>Y, solo en co-terminación): solo donde la tabla nombra el modelo
  // sin ambigüedad. Escribe «MX68C/W» y no nombra los G2-MX: en esos no se pone.
  // `licClase` es la clase de licencia por SUSCRIPCIÓN («Subscription - MX Licensing»): una
  // referencia por clase de equipo, LIC-MX-S/M/L/XL o LIC-CSR-S/L/XL, con -E (Essential) o -A
  // (Advantage). La de co-terminación va por modelo y esa página no la publica.
  // El C8111-G2-MX y el C8121-G2-MX son el hardware G2 con MX OS: se gestionan desde el dashboard y se
  // licencian como un MX, así que van en esta plataforma aunque su nombre sea de Secure Router.
  {id:'Meraki MX67',  ser:'Meraki MX', fam:'Sucursal pequeña (hasta 50 dispositivos)', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:false, bases:B_MX,
   psu:{tipo:'adaptador externo (MA-PWR-30WAC)', texto:'Carga de 5 W en reposo y 14 W como máximo (ficha).'},
   ports:'1 GE WAN + 1 GE LAN/WAN convertible + 3 GE LAN', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-S', sdwPlus:'S', hwSku:'MX67-HW', datasheet:DS.mx6768},
  {id:'Meraki MX67C', ser:'Meraki MX', fam:'Sucursal pequeña con LTE CAT 6 integrado', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:true, bases:B_MX,
   psu:{tipo:'adaptador externo (MA-PWR-30WAC)', texto:'Carga de 15 W en reposo y 23 W como máximo (ficha).'},
   ports:'1 GE WAN + 1 GE LAN/WAN convertible + 3 GE LAN + celular integrado', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-S', sdwPlus:'S', hwSku:null, datasheet:DS.mx6768},
  {id:'Meraki MX68',  ser:'Meraki MX', fam:'Sucursal pequeña con PoE+ (hasta 50 dispositivos)', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:false, bases:B_MX,
   poeNota:'2 puertos LAN PoE+',
   psu:{tipo:'adaptador externo (MA-PWR-100WAC)', texto:'Carga de 11 W en reposo y 79 W como máximo (ficha).'},
   ports:'2 GE WAN + 10 GE LAN (2 PoE+)', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-S', hwSku:'MX68-HW', datasheet:DS.mx6768},
  {id:'Meraki MX68CW', ser:'Meraki MX', fam:'Sucursal pequeña con PoE+, LTE y Wi-Fi integrados', fwd:700, ipsec:400, sdwan:400, amenazas:400, aps:null, clientes:50, redund:false, lte:true, bases:B_MX,
   poeNota:'2 puertos LAN PoE+',
   psu:{tipo:'adaptador externo (MA-PWR-100WAC)', texto:'Carga de 19 W en reposo y 89 W como máximo (ficha).'},
   ports:'2 GE WAN + 10 GE LAN (2 PoE+) + celular y 802.11ac integrados', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-S', hwSku:null, datasheet:DS.mx6768},
  {id:'Meraki MX75',  ser:'Meraki MX', fam:'Sucursal pequeña / mediana (hasta 200 dispositivos)', fwd:1000, ipsec:1000, sdwan:1000, amenazas:1000, aps:null, clientes:200, redund:false, lte:false, bases:B_MX,
   tuneles:75, poeNota:'2 puertos LAN PoE+',
   psu:{tipo:'adaptador externo de 100 W DC (incluido)', texto:'Carga de 12 W en reposo y 96 W como máximo (ficha).'},
   ports:'1 GE SFP + 2 GE WAN · 10 GE LAN', nim:0, sm:0, optics:['mxsfp1g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-M', sdwPlus:'M', hwSku:'MX75-HW', datasheet:DS.mx75},
  {id:'Meraki MX85',  ser:'Meraki MX', fam:'Sucursal mediana (hasta 250 dispositivos)', fwd:1000, ipsec:1000, sdwan:1000, amenazas:1000, aps:null, clientes:250, redund:false, lte:false, bases:B_MX,
   tuneles:200,
   psu:{tipo:'fuente interna', texto:'Carga de 12 W en reposo y 55 W como máximo (ficha).'},
   ports:'2 GE SFP + 2 GE WAN · 8 GE + 2 GE SFP LAN · rack', nim:0, sm:0, optics:['mxsfp1g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-M', sdwPlus:'M', hwSku:'MX85-HW', datasheet:DS.mx85},
  {id:'Meraki MX95',  ser:'Meraki MX', fam:'Campus / hub regional (hasta 500 dispositivos)', fwd:3000, ipsec:2500, sdwan:2500, amenazas:2000, aps:null, clientes:500, redund:false, lte:false, bases:B_MX,
   psu:{tipo:'fuente interna', texto:'Carga de 42 W en reposo y 109 W como máximo (ficha). Un puerto WAN de 2,5G con PoE+.'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 4 GE + 2x 10G SFP+ LAN · rack', nim:0, sm:0, optics:['mxsfp1g','mxsfp10g','mxdac10g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-L', sdwPlus:'L', hwSku:'MX95-HW', datasheet:DS.mx95},
  {id:'Meraki MX105', ser:'Meraki MX', fam:'Campus / hub grande con fuentes modulares (hasta 750 dispositivos)', fwd:5000, ipsec:3500, sdwan:3500, amenazas:2500, aps:null, clientes:750, redund:true, lte:false, bases:B_MX,
   psu:{tipo:'modulares, 2 x 150 W AC (MA-PWR-150WAC)', texto:'Carga de 53 W en reposo y 123 W como máximo (ficha); el peso se da «con 2 ventiladores y 2 fuentes».'},
   ports:'2x 10G SFP+ + 2x 2,5G WAN · 4 GE + 2x 10G SFP+ LAN · rack', nim:0, sm:0, optics:['mxsfp1g','mxsfp10g','mxdac10g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-L', sdwPlus:'L', hwSku:'MX105-HW', datasheet:DS.mx95},
  {id:'Meraki MX250', ser:'Meraki MX', fam:'Concentrador VPN / campus grande (2.000 dispositivos)', fwd:7500, ipsec:4000, sdwan:4000, amenazas:2000, amenazasDet:3000, aps:null, clientes:2000, redund:true, lte:false, bases:B_MXP,
   psu:{tipo:'modulares, 2 x 250 W AC (MA-PWR-250WAC)', texto:'Carga de 105 W en reposo y 190 W como máximo (ficha).'},
   ports:'2x 10G SFP+ WAN · 8x 10G SFP+ + 8x 1G SFP + 8 GE LAN · 1RU', nim:0, sm:0, optics:['mxsfp1g','mxsfp10g','mxdac10g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-XL', sdwPlus:'XL', hwSku:'MX250-HW', datasheet:DS.mx250},
  {id:'Meraki MX450', ser:'Meraki MX', fam:'Concentrador VPN / campus grande (10.000 dispositivos)', fwd:10000, ipsec:6500, sdwan:6500, amenazas:5000, amenazasDet:7000, aps:null, clientes:10000, redund:true, lte:false, bases:B_MXP,
   psu:{tipo:'modulares, 2 x 250 W AC (MA-PWR-250WAC)', texto:'Carga de 105 W en reposo y 190 W como máximo (ficha).'},
   ports:'2x 10G SFP+ WAN · 8x 10G SFP+ + 8x 1G SFP + 8 GE LAN · 1RU', nim:0, sm:0, optics:['mxsfp1g','mxsfp10g','mxdac10g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-MX-XL', sdwPlus:'XL', hwSku:'MX450-HW', datasheet:DS.mx450},
  {id:'Cisco Secure Router C8111-G2-MX', ser:'Meraki MX', fam:'Sucursal G2 gestionada en la nube (hasta 200 dispositivos)', fwd:2000, ipsec:1200, sdwan:1200, amenazas:1200, aps:null, clientes:200, redund:false, lte:false, bases:{...B_MX, amenazas:'Advanced Security'},
   poe:75, poeNota:'30 W en un WAN mGig (802.3at) y 45 W en un LAN (802.3bt)',
   psu:{tipo:'adaptador externo de 150 W DC (MA-PWR-150WAC-ADP)', texto:'Sistema: 16 W en reposo y 22 W como máximo; con PoE, hasta 97 W (ficha).'},
   ports:'2 WAN mGig RJ45 · LAN GE (1 PoE)', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', licClase:'LIC-CSR-S', hwSku:'C8111-G2-MX', datasheet:DS.c81mx},
  {id:'Cisco Secure Router C8121-G2-MX', ser:'Meraki MX', fam:'Sucursal G2 gestionada en la nube, más PoE (hasta 200 dispositivos)', fwd:2000, ipsec:1200, sdwan:1200, amenazas:1200, aps:null, clientes:200, redund:false, lte:false, bases:{...B_MX, amenazas:'Advanced Security'},
   poe:165, poeNota:'30 W en un WAN mGig (802.3at) y 135 W en tres LAN (802.3bt)',
   psu:{tipo:'adaptador externo de 250 W DC (MA-PWR-250WAC-ADP)', texto:'Sistema: 18 W en reposo y 26 W como máximo; con PoE, hasta 176 W (ficha).'},
   ports:'2 WAN mGig RJ45 · hasta 10 GE LAN (3 PoE)', nim:0, sm:0, optics:[], parts:MX_LIC, lic:'meraki', licClase:'LIC-CSR-S', hwSku:'C8121-G2-MX', datasheet:DS.c81mx},
  // El C8355-G2-MX y el C8455-G2-MX (2026-10-20): el chasis G2 de las series 8300 y 8400 con MX OS.
  // Sus fichas de Meraki dan «Maximum NGFW Throughput», VPN sitio a sitio, Advanced Security,
  // dispositivos recomendados y túneles; sin tamaño de paquete, como el resto de Meraki. El PoE
  // del C8355 aún no está activo: la ficha lo anuncia para una versión 26.2 posterior.
  {id:'Cisco Secure Router C8355-G2-MX', ser:'Meraki MX', fam:'Sucursal grande G2 gestionada en la nube (hasta 5.000 dispositivos)', fwd:10000, ipsec:5000, sdwan:5000, amenazas:4000, aps:null, clientes:5000, redund:true, lte:false, bases:B_MXG2,
   tuneles:1500, tunelesNota:'«Maximum Recommended Tunnels» de su ficha; la MX Sizing Guide da 1.250 recomendados y 3.500 como máximo', poeNota:'UPoE+ en los cuatro mGig a partir de una versión 26.2 posterior (ficha); opción de fuente de 230 W AC con 120 W de PoE',
   psu:{watts:45, tipo:'dos fuentes de 110 W AC de serie', texto:'Ficha de Meraki: «Power supplies included by default: 2x 110W AC»; consumo típico 45 W sin PoE.'},
   ports:'2x 10G SFP+ WAN · 2x 10G SFP+ LAN/WAN · 4x 5G mGig LAN · 2 GE LAN · 1RU', nim:0, sm:0, optics:['mxg2sfp1g','mxg2sfp10g','mxdac10g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-CSR-L', hwSku:'C8355-G2-MX', datasheet:DS.c8355mx},
  {id:'Cisco Secure Router C8455-G2-MX', ser:'Meraki MX', fam:'Campus grande y concentrador VPN G2 en la nube (hasta 15.000 dispositivos)', fwd:20000, ipsec:10000, sdwan:10000, amenazas:8000, aps:null, clientes:15000, redund:true, lte:false, bases:B_MXG2,
   tuneles:3500,
   psu:{tipo:'dos fuentes de 250 W AC de serie', texto:'Ficha de Meraki: «2 x 250W AC are included by default».'},
   ports:'2x 25G SFP28 WAN · 2x 10G SFP+ LAN/WAN · 8x 1G SFP LAN · 1RU', nim:0, sm:0, optics:['mxg2sfp1g','mxg2sfp10g','mxdac10g','mxsfp25g','mxdac25g'], parts:MX_LIC, lic:'meraki', licClase:'LIC-CSR-XL', hwSku:'C8455-G2-MX', datasheet:DS.c8455mx},
];

// Segunda fuente para la redundancia, de la guía de pedido de la G2 (tabla 3, «Configurable options
// for the Cisco 8200 Series»): el chasis trae entrada doble y la segunda fuente se pide aparte. En el
// C8211, C8221, C8221L y C8225 «Secondary PSU available only as a spare, with power cords to
// purchased separately»: va con «=» y el cable se pide aparte.
const REPUESTO = 'solo se pide como repuesto («=»), con el cable aparte (guía de pedido, tabla 3)';
const PSU_SEGUNDA = {
  'Cisco Secure Router C8211-G2':   {sku:'PWR-CC1-30WAC=', d:`Segunda fuente externa de 30 W AC; ${REPUESTO}.`},
  'Cisco Secure Router C8221-G2':   {sku:'PWR-CC1-66WAC=', d:`Segunda fuente externa de 66 W AC; ${REPUESTO}.`},
  'Cisco Secure Router C8221L-G2':  {sku:'PWR-CC1-66WAC=', d:`Segunda fuente externa de 66 W AC; ${REPUESTO}.`},
  'Cisco Secure Router C8225-G2':   {sku:'PWR-CC1-66WAC=', d:`Segunda fuente externa de 66 W AC; ${REPUESTO}.`},
  'Cisco Secure Router C8231-E-G2': {sku:'PWR-ADPT-150WAC', d:'Segunda fuente, adaptador externo de 150 W AC (PWR-ADPT-150WDC en continua), guía de pedido, tabla 3.'},
  'Cisco Secure Router C8235-E-G2': {sku:'PWR-ADPT-150WAC', d:'Segunda fuente, adaptador externo de 150 W AC (PWR-ADPT-150WDC en continua), guía de pedido, tabla 3.'},
};

/* ══ PUERTOS DE DATOS POR EQUIPO (2026-10-21, propuesta 1.1: cada enlace WAN a un puerto real) ══
   Contados de la ficha de cada familia, no del texto `ports`. Mismo formato que lee `ficha.js`
   (`{n, vel, medios, uso}`, vel en GE): la ficha los pinta solos y un grupo con dos medios es un
   puerto de medio compartido (combo), que cuenta una vez.
   · uso: 'WAN' (puerto enrutado: «WAN Ports», o los L3 de los Catalyst, «for WAN or LAN»),
     'LAN/WAN' (los «Flex L2/L3 Ports» de la G2 —guía de hardware de la serie 8100, tabla 1— y los
     convertibles de Meraki) y 'LAN' (solo LAN: nunca recibe un enlace).
   · velMin: la velocidad más baja que admite, solo donde la ficha lo dice («1/10», «SFP/SFP+»,
     «10/25», «40/100», «2.5/1»). Un puerto multigigabit (mGig, 2,5G o 5G) admite también 1G: en
     la G2 lo dicen sus guías de hardware (8200: «1000BASE-T… 2.5GBASE-T»; 8300: el C8375-E-G2,
     «100BASE-TX, 1000BASE-T, and 2500BASE_T», y el C8355-G2 hasta «5000BASE-T»); en el MX95 y el
     MX105, la página «WAN Behavior on MX75/85/95/105» de documentation.meraki.com (tabla de LED de
     los RJ-45: «Slow link… 10/100 Mbps, 1Gbps for MX95/105»; «Full speed… 2.5 Gbps for MX95/105»,
     leída el 2026-10-27). En los C8111/C8121-G2-MX sigue siendo la norma 802.3bz, supuesto
     declarado (`velMinSupuesto`): su ficha y su guía de instalación solo dan la velocidad máxima.
     Un SFP+ que la ficha da «no reducible a 1G» (ASR) no lleva velMin.
   · Fuentes, por familia: fichas de las series 8100 a 8600 («Interfaces and slots»), de los
     Catalyst 8200 («four built-in Ethernet WAN ports: two SFP and two RJ45»), 8300 («6 built-in
     Layer 3 Ethernet ports for WAN or LAN… at least 2 SFP or SFP+ in addition to 4 RJ-45», tabla 2)
     y 8500 («Platforms and configurations»), del ISR 1000 («1 copper/SFP Ethernet port + 1 copper
     Ethernet port», tablas 1, 7, 13 y 20), del ASR 1000 (tabla 5) y de cada Meraki («WAN
     Interface», «LAN Interface»). El ASR 1006-X es modular: sus puertos los dan las tarjetas. */
const G = (n, vel, medios, uso, extra) => ({n, vel, medios, uso, ...(extra || {})});
const RJ = (n, uso, vel = 1, extra) => G(n, vel, ['RJ45'], uso, extra);
const MGIG = (n, vel, uso) => G(n, vel, ['RJ45'], uso, {velMin:1, mgig:true});
const MGIG_MX = (n, vel, uso) => G(n, vel, ['RJ45'], uso, {velMin:1, mgig:true, velMinSupuesto:true});
const COMBO = (n, uso) => G(n, 1, ['RJ45', 'SFP'], uso);
const SFP1 = (n, uso) => G(n, 1, ['SFP'], uso);
const SFPP = (n, uso, dual = true) => G(n, 10, ['SFP+'], uso, dual ? {velMin:1} : null);
const SFP28 = (n, uso) => G(n, 25, ['SFP28'], uso, {velMin:10});
const QSFP40 = (n, uso) => G(n, 40, ['QSFP+'], uso);
const QSFP28 = (n, uso) => G(n, 100, ['QSFP28'], uso, {velMin:40});
// La jaula XGSPON/10GBASE-T de las 8100 VAI/VAP y CVAI/CVAP: solo admite la ONT XGSPON
// (SFP-10G-ONT20-I) o el SFP-10G-T-X (guía de hardware de la serie 8100, tabla 10). Recibe un
// enlace XGS-PON con esa ONT (`pon`) o un cobre de 10G con ese transceptor; nunca una óptica
// (`sinOptica`).
const XGS = (n) => G(n, 10, ['SFP+'], 'WAN', {sinOptica:true, pon:true, rotulo:'XGSPON/10GBASE-T: SFP-10G-ONT20-I o SFP-10G-T-X'});
const ISR_8P = [COMBO(1, 'WAN'), RJ(1, 'WAN'), RJ(8, 'LAN')];
const C8200 = [RJ(2, 'WAN'), SFP1(2, 'WAN')];
const C8300_6T = [RJ(4, 'WAN'), SFP1(2, 'WAN')];
const C8300_4T2X = [RJ(4, 'WAN'), SFPP(2, 'WAN')];
const SR8140 = [COMBO(2, 'WAN'), RJ(2, 'LAN/WAN'), RJ(6, 'LAN')];
const SR8221 = [SFPP(2, 'WAN'), RJ(2, 'WAN'), RJ(2, 'LAN/WAN'), RJ(4, 'LAN')];
const SR_E = [SFPP(2, 'WAN'), MGIG(2, 2.5, 'WAN')];
const MX67 = [RJ(1, 'WAN'), RJ(1, 'LAN/WAN'), RJ(3, 'LAN')];
const MX68 = [RJ(2, 'WAN'), RJ(10, 'LAN')];
const MX95 = [SFPP(2, 'WAN'), MGIG(2, 2.5, 'WAN'), RJ(4, 'LAN'), SFPP(2, 'LAN')];
const MX250 = [SFPP(2, 'WAN'), SFPP(8, 'LAN'), SFP1(8, 'LAN'), RJ(8, 'LAN')];
const PUERTOS = {
  'ISR 1111-8P': ISR_8P, 'ISR 1111X-8P': ISR_8P, 'ISR 1121X-8P': ISR_8P, 'ISR 1161X-8P': ISR_8P,
  'ISR 1116-4P': [COMBO(1, 'WAN'), RJ(4, 'LAN')],
  'Catalyst 8200L': C8200, 'Catalyst 8200': C8200,
  'Catalyst 8300-1N1S-6T': C8300_6T, 'Catalyst 8300-2N2S-6T': C8300_6T,
  'Catalyst 8300-1N1S-4T2X': C8300_4T2X, 'Catalyst 8300-2N2S-4T2X': C8300_4T2X,
  'Catalyst 8500L-8S4X': [SFPP(4, 'WAN'), SFP1(8, 'WAN')],
  'Catalyst 8500-12X': [SFPP(12, 'WAN')],
  // Tabla 3 de su ficha: «12-port 1/10GE, 2-port 40/100GE, 2-port 40GE» (4 jaulas QSFP; el texto
  // «3x 40GE ports» de la misma ficha son las tres de la bahía 2 a 40G, una de ellas 40/100).
  'Catalyst 8500-12X4QC': [SFPP(12, 'WAN'), QSFP40(2, 'WAN'), QSFP28(2, 'WAN')],
  'Catalyst 8500-20X6C': [SFPP(20, 'WAN'), QSFP28(6, 'WAN')],
  'Cisco Secure Router C8130-G2': [RJ(1, 'WAN'), COMBO(1, 'WAN'), RJ(2, 'LAN/WAN'), RJ(2, 'LAN')],
  'Cisco Secure Router C8131-G2': [RJ(1, 'WAN'), COMBO(1, 'WAN'), RJ(2, 'LAN/WAN'), RJ(2, 'LAN')],
  'Cisco Secure Router C8130-VAI-G2': [COMBO(1, 'WAN'), XGS(1), RJ(2, 'LAN/WAN'), RJ(2, 'LAN')],
  'Cisco Secure Router C8130-VAP-G2': [COMBO(1, 'WAN'), XGS(1), RJ(2, 'LAN/WAN'), RJ(2, 'LAN')],
  'Cisco Secure Router C8130H-G2': [COMBO(1, 'WAN'), RJ(1, 'WAN', 10), RJ(2, 'LAN/WAN'), RJ(2, 'LAN')],
  'Cisco Secure Router C8151-CVAI-G2': [COMBO(1, 'WAN'), XGS(1), RJ(2, 'LAN/WAN'), RJ(6, 'LAN')],
  'Cisco Secure Router C8151-CVAP-G2': [COMBO(1, 'WAN'), XGS(1), RJ(2, 'LAN/WAN'), RJ(6, 'LAN')],
  'Cisco Secure Router C8151H-C-G2': [COMBO(1, 'WAN'), RJ(1, 'WAN', 10), RJ(2, 'LAN/WAN'), RJ(6, 'LAN')],
  'Cisco Secure Router C8140-G2': SR8140, 'Cisco Secure Router C8151-G2': SR8140, 'Cisco Secure Router C8161-G2': SR8140,
  'Cisco Secure Router C8211-G2': [COMBO(2, 'WAN'), RJ(2, 'LAN/WAN'), RJ(2, 'LAN')],
  'Cisco Secure Router C8221-G2': SR8221, 'Cisco Secure Router C8225-G2': SR8221,
  'Cisco Secure Router C8221L-G2': [RJ(2, 'WAN', 10), RJ(2, 'WAN'), RJ(2, 'LAN/WAN'), RJ(4, 'LAN')],
  'Cisco Secure Router C8231-G2': [SFPP(2, 'WAN'), MGIG(2, 2.5, 'WAN'), MGIG(2, 2.5, 'LAN/WAN'), RJ(4, 'LAN')],
  'Cisco Secure Router C8235-G2': [SFPP(2, 'WAN'), MGIG(2, 2.5, 'WAN'), MGIG(2, 2.5, 'LAN/WAN'), MGIG(4, 2.5, 'LAN')],
  'Cisco Secure Router C8231-E-G2': SR_E, 'Cisco Secure Router C8235-E-G2': SR_E,
  'Cisco Secure Router C8355-G2': [SFPP(2, 'WAN'), MGIG(2, 5, 'WAN'), MGIG(2, 5, 'LAN/WAN'), RJ(2, 'LAN/WAN'), SFPP(2, 'LAN')],
  'Cisco Secure Router C8375-E-G2': [SFPP(2, 'WAN'), MGIG(4, 2.5, 'WAN')],
  'Cisco Secure Router C8455-G2': [SFP1(8, 'WAN'), SFPP(2, 'WAN'), SFP28(2, 'WAN')],
  'Cisco Secure Router C8475-G2': [SFP1(8, 'WAN'), SFPP(8, 'WAN'), SFP28(4, 'WAN')],
  'Cisco Secure Router C8550-G2': [SFPP(12, 'WAN')],
  'Cisco Secure Router C8570-G2': [SFPP(12, 'WAN'), QSFP40(2, 'WAN'), QSFP28(2, 'WAN')],
  'Cisco Secure Router C8650-G2': [SFPP(20, 'WAN'), QSFP28(6, 'WAN')],
  'ASR 1001-X': [SFP1(6, 'WAN'), SFPP(2, 'WAN', false)],
  'ASR 1002-HX': [SFP1(8, 'WAN'), SFPP(8, 'WAN', false)],
  'ASR 1006-X': null,
  'Meraki MX67': MX67, 'Meraki MX67C': MX67, 'Meraki MX68': MX68, 'Meraki MX68CW': MX68,
  'Meraki MX75': [SFP1(1, 'WAN'), RJ(2, 'WAN'), RJ(10, 'LAN')],
  'Meraki MX85': [SFP1(2, 'WAN'), RJ(2, 'WAN'), RJ(8, 'LAN'), SFP1(2, 'LAN')],
  'Meraki MX95': MX95, 'Meraki MX105': MX95,
  'Meraki MX250': MX250, 'Meraki MX450': MX250,
  'Cisco Secure Router C8111-G2-MX': [MGIG_MX(2, 2.5, 'WAN'), RJ(4, 'LAN')],
  'Cisco Secure Router C8121-G2-MX': [MGIG_MX(2, 2.5, 'WAN'), RJ(10, 'LAN')],
  'Cisco Secure Router C8355-G2-MX': [SFPP(2, 'WAN'), SFPP(2, 'LAN/WAN'), MGIG_MX(4, 5, 'LAN'), RJ(2, 'LAN')],
  'Cisco Secure Router C8455-G2-MX': [SFP28(2, 'WAN'), SFPP(2, 'LAN/WAN'), SFP1(8, 'LAN')],
};
// Enlaces WAN que el equipo admite a la vez, donde la ficha lo dice: Meraki «# of WAN uplinks» (MX75
// 3; MX85, MX95 y MX105 4), «Dual WAN uplinks (with LAN conversion)» en los MX67/68 y «Up to 3 with
// LAN/WAN conversion» en el C8355-G2-MX. Donde no consta, el límite son los puertos.
const MAX_WAN = {
  'Meraki MX67': 2, 'Meraki MX67C': 2, 'Meraki MX68': 2, 'Meraki MX68CW': 2,
  'Meraki MX75': 3, 'Meraki MX85': 4, 'Meraki MX95': 4, 'Meraki MX105': 4,
  'Cisco Secure Router C8355-G2-MX': 3,
};
// Restricciones de la ficha que el reparto de puertos no modela: se dicen cuando un enlace usa ese
// tipo de puerto.
// AppQoE con DRE (2026-10-21, propuesta 2.3): «Cisco Catalyst SD-WAN AppQoE Configuration Guide,
// Releases 26.x», capítulo «Traffic Optimization with DRE» (10-mar-2026). «Supported Devices for DRE»
// dice qué equipos ejecutan el DRE (nodos integrados) y cuáles solo lo redirigen a un nodo externo
// (controladores de servicio); su tabla 4, los perfiles de cada nodo con sus conexiones optimizadas
// y la RAM y el disco que piden además de los del equipo. No publica caudal con optimización.
const DRE = (p, conexiones, ram, disco) => ({p, conexiones, ram, disco});
const APPQOE = {
  'Catalyst 8200':                  {rol:'nodo', perfiles:[DRE('S', 750, 8, 120)]},
  'Catalyst 8300-1N1S-6T':          {rol:'nodo', perfiles:[DRE('S', 750, 8, 120), DRE('M', 5000, 8, 280)]},
  'Catalyst 8300-1N1S-4T2X':        {rol:'nodo', perfiles:[DRE('S', 750, 8, 120), DRE('M', 5000, 8, 280)]},
  'Catalyst 8300-2N2S-6T':          {rol:'nodo', perfiles:[DRE('S', 750, 8, 120), DRE('M', 5000, 8, 280)]},
  'Catalyst 8300-2N2S-4T2X':        {rol:'nodo', perfiles:[DRE('S', 750, 8, 120), DRE('M', 5000, 8, 280), DRE('L', 10000, 16, 500)]},
  'Cisco Secure Router C8231-E-G2': {rol:'nodo', perfiles:[]},
  'Cisco Secure Router C8235-E-G2': {rol:'nodo', perfiles:[DRE('S', 750, 16, 120)]},
  'Cisco Secure Router C8375-E-G2': {rol:'nodo', perfiles:[DRE('M', 5000, 16, 280), DRE('L', 10000, 32, 500)]},
  'Cisco Secure Router C8355-G2':   {rol:'nodo', perfiles:[DRE('M', 5000, 16, 280)]},
  'Cisco Secure Router C8455-G2':   {rol:'nodo', perfiles:[DRE('L', 16000, 32, 500)]},
  'Cisco Secure Router C8475-G2':   {rol:'nodo', perfiles:[DRE('L', 22000, 32, 500)]},
  'ASR 1001-X':                     {rol:'controlador'},
  'ASR 1002-HX':                    {rol:'controlador'},
  'Catalyst 8500-12X4QC':           {rol:'controlador'},
  'Catalyst 8500-12X':              {rol:'controlador'},
  'Catalyst 8500L-8S4X':            {rol:'controlador'},
  'Catalyst 8500-20X6C':            {rol:'controlador'},
  'Cisco Secure Router C8550-G2':   {rol:'controlador'},
  'Cisco Secure Router C8570-G2':   {rol:'controlador'},
};
const NOTA_PUERTOS = {};
// La bahía de módulos del ASR 1000 (2026-10-27), de sus guías de hardware («Supported Hardware
// Components»): lo que el motivo de un enlace sin puerto fijo cita. El catálogo no propone esos
// módulos: el chasis está fuera de venta (solo cuenta el parque instalado) y su ciclo de vida no
// está contrastado. El 1006-X es modular (`puertos: null`): lo deciden sus tarjetas.
const BAHIA_ASR = {
  'ASR 1001-X': {doc:'guía de hardware del ASR 1001-X, «Supported Hardware Components», 3-oct-2019',
    texto:'una bahía SPA de media altura (Ethernet: SPA-1X10GE-L-V2 y SPA-1X10GE-WL-V2 de 10G, SPA-2X1GE-V2, ' +
      'SPA-5X1GE-V2 y SPA-8X1GE-V2 de 1G) y una ranura NIM solo para NIM-SSD y NIM-T1/E1, sin Ethernet'},
  'ASR 1002-HX': {doc:'guía de hardware del ASR 1001-HX/1002-HX, «Supported EPAs», 13-oct-2016',
    texto:'una bahía EPA (EPA-18X1GE: 18 SFP de 1G; EPA-10X10GE: 10 SFP+; EPA-1X100GE con CPAK; ' +
      'EPA-CPAK-2X40GE; EPA-1X40GE y EPA-2X40GE en QSFP)'},
};
// Combinaciones de puertos que el equipo admite a la vez (`combinaciones`): cuántos puertos SFP+
// (de 1 o 10G), de 40G y de 100G como mucho en cada una, y de dónde sale la lista. Lo que no cabe en
// ninguna aparta el equipo; el «breakout» 4x10G no se modela (la ficha del 12X4QC dice que no va
// en SD-WAN). `maxGE`: lo que la ficha deja habilitar a la vez, sumando la velocidad de cada enlace.
// · Catalyst 8500-12X4QC: tabla 5 de su ficha («Maximum ports configurations»), con su nota: con la
//   bahía 1 en 100G no queda ningún otro puerto de las bahías 0 y 1. Todas suman 240 GE o menos.
// · C8570-G2: su guía de hardware («Bay configuration», 9-sep-2025) da las mismas bahías —0: 8 SFP+;
//   1: 4 SFP+ o 1 QSFP de 40 o 100G; 2: 1x 100G o 3x 40G— y su ficha, «max 240GE ports can be
//   enabled simultaneously». Y su guía de configuración (capítulo «Bay Configuration», 12-oct-2026)
//   la misma nota que el 12X4QC: con la bahía 1 en 100G, «all ports of Bay 0 move to admin down
//   state» (2026-10-27). El «breakout» 4x10G de la bahía 2 que esa guía documenta no se modela: pide
//   un cable o una óptica de breakout que el catálogo no trae.
const COMBINACIONES = {
  'Catalyst 8500-12X4QC': {fuente:'tabla 5 de su ficha', lista:[
    {sfp:12, q40:0, q100:0}, {sfp:8, q40:4, q100:0}, {sfp:0, q40:0, q100:2}, {sfp:0, q40:3, q100:1},
    {sfp:8, q40:1, q100:1}, {sfp:12, q40:0, q100:1}, {sfp:12, q40:3, q100:0},
  ]},
  'Cisco Secure Router C8570-G2': {fuente:'bahías de sus guías de hardware y de configuración', maxGE:240, lista:[
    {sfp:12, q40:3, q100:0}, {sfp:12, q40:0, q100:1}, {sfp:8, q40:4, q100:0}, {sfp:8, q40:1, q100:1},
    {sfp:0, q40:3, q100:1}, {sfp:0, q40:0, q100:2},
  ]},
};
// Puerto DSL integrado (`dsl`): ISR 1116-4P, tabla 20 de la ficha del ISR 1000 («WAN interface
// combinations»: la última cifra del PID es la combinación; la 6 es «1 copper/SFP Ethernet port + 1
// ADSL2/VDSL2+ port (Annex B/J ISDN)»). Recibe un enlace con entrega DSL, nunca uno Ethernet.
const DSL = {
  'ISR 1116-4P': 'ADSL2/VDSL2+, Annex B/J sobre RDSI',
  // DSL integrado de las 8100 (ficha, tablas 10 y 15: VDSL2 G.993.2, perfiles 8a a 35b, y ADSL,
  // ADSL2 y ADSL2+): VAI sobre RDSI (Annex B/J), VAP sobre POTS (Annex A).
  'Cisco Secure Router C8130-VAI-G2': 'VDSL2/ADSL2+, Annex B/J sobre RDSI',
  'Cisco Secure Router C8130-VAP-G2': 'VDSL2/ADSL2+, Annex A sobre POTS',
  'Cisco Secure Router C8151-CVAI-G2': 'VDSL2/ADSL2+, Annex B/J sobre RDSI',
  'Cisco Secure Router C8151-CVAP-G2': 'VDSL2/ADSL2+, Annex A sobre POTS',
};
// Alcance del cobre en los RJ-45 del equipo (`alcanceRJ45`, 2026-10-21): 100 m. Las guías de
// hardware de los Catalyst 8200 y 8300 y de la G2 8100, 8200 y 8300 lo dicen para 1000BASE-T
// («Supports the Ethernet maximum length of 328 feet (100 meters)»), y la de la 8200 también para
// 2.5GBASE-T: `hasta` es la velocidad hasta la que consta. Por encima, y en las familias cuya guía
// no lo trae (ISR 1000, ASR, Meraki), es la norma IEEE 802.3, supuesto declarado.
const RJ45_GUIA = [
  {de:/^Catalyst 8[23]00/, hasta:1, guia:'la guía de hardware de los Catalyst 8200/8300'},
  {de:/^Cisco Secure Router C82\d\d/, hasta:2.5, guia:'la guía de hardware de la serie 8200 de la G2'},
  {de:/^Cisco Secure Router C8(1\d\d|3\d\d)-/, hasta:1, guia:'la guía de hardware de su serie de la G2'},
];

// CRIPTOGRAFÍA POST-CUÁNTICA (2026-10-27, encargo del dueño). «Release Notes for Cisco 8000
// Series Secure Routers, Release 26.1.x» (12-oct-2026), tabla de funciones nuevas de la 26.1.1:
// «Post Quantum Crypto for IKEv2 and SSH Sessions», plataformas «Cisco 8000 Series Secure
// Routers», en modo híbrido: ML-KEM (p. ej. mlkem768) con ECDH P-256 o X25519 y SHA-256. Solo
// la G2 con IOS XE: los G2-MX llevan MX OS, y ni los Catalyst 8000, ni el ISR ni el ASR tienen
// documento de ML-KEM (los dos primeros traen PPK, abajo). Seis modelos llegan en la 26.1.2
// (tabla 1 de las mismas notas): para ellos, esa es la primera versión.
const PQC_G2 = {tipo:'mlkem', mecanismo:'ML-KEM (p. ej. mlkem768) en modo híbrido con ECDH P-256 o X25519 y SHA-256',
  donde:'IKEv2 (IPsec) y SSH',
  fuente:'Release Notes for Cisco 8000 Series Secure Routers, Release 26.1.x (12-oct-2026), «Post Quantum Crypto for IKEv2 and SSH Sessions»',
  urls:['https://www.cisco.com/c/en/us/td/docs/routers/secure-routers/cisco-8000-series-secure-routers-release-26-1-x.html']};
const PQC_DESDE_26_1_2 = ['C8130H-G2', 'C8151H-C-G2', 'C8221-G2', 'C8221L-G2', 'C8225-G2', 'C8650-G2'];
// Y la PPK (2026-10-27, tema pqc-documentos). «Configuring Quantum-Safe Encryption Using
// Postquantum Preshared Keys», de la «Security and VPN Configuration Guide, Cisco IOS XE 17.x»:
// claves precompartidas post-cuánticas (RFC 8784) en IKEv2 e IPsec, manuales o importadas de una
// fuente externa con Cisco SKIP, en FlexVPN y DMVPN (no en GETVPN). Su tabla de funciones: IOS XE
// 17.11.1a, y la 17.12.1a la lleva al ISR 1000 y al Catalyst 8500; su lista de plataformas nombra
// ISR 1000, ASR 1000, Catalyst 8200, 8300 y 8500, Catalyst 8000V y las Secure Router 8100 a 8500
// (que ya traen ML-KEM). No es un algoritmo post-cuántico: la ficha lo dice. Los Meraki llevan
// MX OS, al que la guía no aplica. Los ASR 1000 están fuera de venta: cada uno, hasta la última
// versión que dice su boletín de fin de venta (2026-10-27): el ASR1002-HX, la 17.15 («The last
// supported release is 17.15») y el ASR1006-X, la 17.18; el ASR1001-X se queda en la 17.9 («The last
// supported IOS XE release […] is IOS XE 17.9»), anterior a la 17.11.1a: sin PPK.
const PQC_IOSXE = [
  {ser:'Catalyst 8000', de:/^Catalyst 8[23]00/, desde:'IOS XE 17.11.1a'},
  {ser:'Catalyst 8000', de:/^Catalyst 8500/, desde:'IOS XE 17.12.1a'},
  {ser:'ISR 1000', de:/^ISR /, desde:'IOS XE 17.12.1a'},
  {ser:'ASR 1000', de:/^ASR 1002-HX$/, desde:'IOS XE 17.11.1a',
    alcance:'hasta la IOS XE 17.15, la última que soporta según su boletín de fin de venta (5-feb-2025)',
    boletin:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1002-hx-asso-part-eol.html'},
  {ser:'ASR 1000', de:/^ASR 1006-X$/, desde:'IOS XE 17.11.1a',
    alcance:'hasta la IOS XE 17.18, la última que soporta según su boletín de fin de venta (29-ene-2026)',
    boletin:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1006-x-chassis-eol.html'},
];
// Un «no» documentado (`pqcNo`, 2026-10-28): el boletín del ASR1001-X dice que su última versión es
// la 17.9, anterior a la 17.11.1a que trae la PPK. No es un hueco («no consta»): es un no con su
// documento, y la ficha, el requisito y la hoja «Supuestos» lo dicen así. Solo con fuente.
const PQC_NO = {
  'ASR 1001-X': {motivo:'su última versión de IOS XE es la 17.9 («The last supported IOS XE release […] is IOS XE 17.9»), anterior a la 17.11.1a que trae la PPK',
    corto:'última versión IOS XE 17.9; la PPK llega en la 17.11.1a',
    fuente:'Boletín de fin de venta de los Cisco ASR1001-X y ASR1002-X',
    urls:['https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1001-x-1002-x-eol.html']},
};
const PQC_PPK = {tipo:'ppk',
  mecanismo:'Claves precompartidas post-cuánticas (PPK, RFC 8784) mezcladas en IKEv2 e IPsec: manuales o importadas de una fuente externa con Cisco SKIP',
  donde:'IKEv2 e IPsec (FlexVPN y DMVPN; no GETVPN)',
  fuente:'«Configuring Quantum-Safe Encryption Using Postquantum Preshared Keys», Security and VPN Configuration Guide, Cisco IOS XE 17.x',
  urls:['https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m-sec-cfg-quantum-encryption-ppk.html']};
for (const m of MODELS) {
  m.eolAnnounced = EOL_ANNOUNCED[m.id] || null;
  if (PSU_SEGUNDA[m.id]) m.psu2 = PSU_SEGUNDA[m.id];
  // `undefined` es «no contado»; `null`, chasis modular (sus puertos los dan las tarjetas).
  if (Object.prototype.hasOwnProperty.call(PUERTOS, m.id)) m.puertos = PUERTOS[m.id];
  if (MAX_WAN[m.id]) m.maxWan = MAX_WAN[m.id];
  if (NOTA_PUERTOS[m.id]) m.notaPuertos = NOTA_PUERTOS[m.id];
  if (BAHIA_ASR[m.id]) m.bahia = BAHIA_ASR[m.id];
  if (m.ser === 'Secure Router (G2)') {
    const tarde = PQC_DESDE_26_1_2.some((c) => m.id.endsWith(` ${c}`));
    m.pqc = {...PQC_G2, desde: tarde ? 'IOS XE 26.1.2 (primera versión de este modelo; la función llega en la 26.1.1)' : 'IOS XE 26.1.1'};
  }
  const ppk = PQC_IOSXE.find((x) => x.ser === m.ser && x.de.test(m.id));
  if (ppk) m.pqc = {...PQC_PPK, desde: ppk.desde, ...(ppk.alcance ? {alcance: ppk.alcance} : {}),
    ...(ppk.boletin ? {urls: [...PQC_PPK.urls, ppk.boletin]} : {})};
  if (PQC_NO[m.id]) m.pqcNo = PQC_NO[m.id];
  if (COMBINACIONES[m.id]) m.combinaciones = COMBINACIONES[m.id];
  if (DSL[m.id]) m.dsl = DSL[m.id];
  if (APPQOE[m.id]) m.appqoe = APPQOE[m.id];
  const rj = RJ45_GUIA.find((x) => x.de.test(m.id) && !/-MX$/.test(m.id));
  m.alcanceRJ45 = rj ? {m:100, hasta:rj.hasta, guia:rj.guia} : {m:100, hasta:0, guia:null};
}

// Licencias de la línea G2 (guía de pedido, tablas 9 y 10). La referencia completa sale de la clase
// de la plataforma; el término y el precio, de CCW. Los add-ons de seguridad (LIC-SEC) no van en el
// C8130-G2, el C8140-G2 ni las series 8500 y 8600 (la guía los nombra: `secAddon: false` en cada
// modelo), y con Routing Advantage piden el SD-WAN Manager local (LIC-R-OP-SWM). La gestión en la
// nube del SD-WAN Manager es opcional y se elige.
const LICENCIAS_G2 = {
  cswanE: {sku:'LIC-CSWAN-{c}-E', n:'Cisco WAN Essentials', d:'Bajo Cisco Networking subscription. SD-WAN gestionado desde Catalyst SD-WAN Manager.'},
  cswanA: {sku:'LIC-CSWAN-{c}-A', n:'Cisco WAN Advantage', d:'Bajo Cisco Networking subscription. Todo Essentials más las funciones avanzadas de la matriz de licencias.'},
  rosA:   {sku:'LIC-ROS-{c}-A',   n:'Cisco Routing Advantage', d:'Suscripción de enrutamiento sin SD-WAN gestionado (modo autónomo). R-OS-{c}-A es su equivalente perpetuo.'},
  osE:    {sku:'R-OS-{c}-E',      n:'Cisco OS Essentials', d:'Sistema embebido precargado en cada Secure Router: va con el equipo.'},
  secT:   {sku:'LIC-SEC-{c}-T',   n:'Seguridad — Threat', d:'Complemento de amenazas (IPS). Requiere WAN Essentials/Advantage, Routing Advantage u OS Advantage.'},
  secC:   {sku:'LIC-SEC-{c}-C',   n:'Seguridad — URL Filtering', d:'Requiere además el complemento Threat. Se gestiona desde SD-WAN Manager.'},
  secM:   {sku:'LIC-SEC-{c}-M',   n:'Seguridad — Malware Defense', d:'Requiere además el complemento Threat. Se gestiona desde SD-WAN Manager.'},
  swmOnPrem: {sku:'LIC-R-OP-SWM', n:'SD-WAN Manager local', d:'«Required for Security Add-ons with Routing Advantage/OS Advantage» (guía de pedido, tabla 10).'},
  nube: {n:'Gestión del SD-WAN Manager (opcional) — elegir una', d:'Cisco Hosted Cloud (LIC-CSWAN-HCLD), Hosted Cloud Pro (LIC-CSWAN-HCLDP-A, proveedor elegido por Cisco, o LIC-CSWAN-HCLDPRO, por el cliente) o controladores propios; LIC-CSWAN-HCLDMSP solo para proveedores de servicio calificados (guía de pedido, tabla 10).'},
};

// Licencias DNA de los Catalyst 8000, el ISR 1000 y el ASR 1000. Fuentes: «Cisco DNA Software for
// SD-WAN and Routing — Subscription FAQ» (16-jun-2026), la guía de pedido de los Catalyst 8300/8200
// (17-jun-2026) y la ficha del ISR 1000.
//  · Tiers de ancho de banda (FAQ, tabla 3): nominal y agregado. En SD-WAN cuenta TODO el tráfico
//    WAN (IPsec, salida directa, GRE); en modo autónomo con cifrado, el cifrado; sin cifrado, el
//    tier más bajo de la plataforma ya libera todo el reenvío. T4 solo en el 8000V y el 8500-20X6C;
//    T5 solo en el 20X6C. El tier máximo de cada plataforma va en su `dnaTierMax` (notas de la
//    tabla 11 de la guía: T2 da el máximo del 8200 y de los 8300-6T; T3, el de los 4T2X y los 8500).
//  · Plazos de 3, 5 y 7 años. DNA Premier está discontinuado (FAQ). El 8500 y el ASR 1000 solo
//    admiten Advantage. Essentials trae firewall de aplicaciones, IPS/IDS, filtrado de URL y Secure
//    Endpoint, pero solo 10 VPN de usuario (más la de gestión); la segmentación sin límite es de
//    Advantage.
//  · HSEC (guía, tabla 8): obligatoria para el cifrado completo en los 8200/8300; va incluida con la
//    suscripción DNA (C8000-HSEC, o C8000-HSEC-DNA si DNA se pide aparte). En el ISR 1000 (ficha,
//    tabla 41): SEC da 50 Mbps de IPsec, VPERF lo lleva a 250 (8P) o 150 (4P) y HSEC quita el límite.
//  · Voz (guía, tabla 9): los módulos de voz y SRST piden DNA Advantage; CUBE, Essentials.
//  · Catalyst Routing Essentials (guía y FAQ): solo modo autónomo, 7 años, sin tier de ancho de banda;
//    firewall de aplicaciones e IPsec punto a punto con HSEC; sin SD-WAN.
const LICENCIAS_DNA = {
  tiers: [
    {t:'T0', nominal:25,    agregado:50},
    {t:'T1', nominal:200,   agregado:400},
    {t:'T2', nominal:1000,  agregado:2000},
    {t:'T3', nominal:10000, agregado:20000},
    {t:'T4', nominal:25000, agregado:50000, solo:['Catalyst 8500-20X6C']},
    {t:'T5', nominal:50000, agregado:100000, solo:['Catalyst 8500-20X6C']},
  ],
  terminos: [3, 5, 7],
  // Prefijos de `id` (no RegExp: el objeto viaja como JSON a la página).
  soloAdvantage: ['Catalyst 8500', 'ASR 1'],
  vpnsEssentials: 10,
  hsecCatalyst: {sku:'C8000-HSEC', familias:['Catalyst 8200', 'Catalyst 8300'], n:'Licencia HSEC (exportación de criptografía)',
    d:'Obligatoria para el cifrado completo; va incluida con la suscripción DNA (C8000-HSEC-DNA si DNA se pide aparte). Guía de pedido, tabla 8.'},
  isr: {sec:50, vperf8P:250, vperf4P:150, hsec8P:'FL-1100-8P-HSEC', hsec4P:'FL-1100-4P-HSEC'},
  routingEssentials: [{familia:'Catalyst 8300', sku:'ROUT-P-C8300-E-7Y'}, {familia:'Catalyst 8200', sku:'ROUT-P-C8200-E-7Y'}],
};
// Módulos de la guía de pedido de la G2 (tabla 7, «Supported NIM and SM modules on the C8300 and
// C8200 Series») y de celular (tabla 8). `en` dice qué tipo de ranura ocupa.
const MODULOS_G2 = [
  {sku:'C-NIM-WAN-2X', en:'nim', d:'2 puertos 1/10 Gbps SFP/SFP+ WAN, con WAN MACsec', puertos:[SFPP(2, 'WAN')]},
  {sku:'C-NIM-WAN-4S', en:'nim', d:'4 puertos 1 Gbps SFP WAN, con WAN MACsec', puertos:[SFP1(4, 'WAN')]},
  {sku:'C-NIM-4X',     en:'nim', d:'Switch de 4 puertos 1/10 Gbps SFP/SFP+, MACsec LAN/WAN y L3 opcional', puertos:[SFPP(4, 'LAN/WAN')]},
  {sku:'C-NIM-8T',     en:'nim', d:'Switch de 8 puertos 100 Mbps/1 Gbps, MACsec LAN/WAN y L3 opcional', puertos:[RJ(8, 'LAN/WAN')]},
  {sku:'C-NIM-8M',     en:'nim', d:'Switch de 8 puertos 100M/1/2,5 Gbps, UPoE+, MACsec LAN/WAN y L3 opcional', puertos:[MGIG(8, 2.5, 'LAN/WAN')]},
  {sku:'C-SM-16P4M2X', en:'sm',  d:'Módulo switch Catalyst L2 de 22 puertos con ASIC UADP'},
  {sku:'C-SM-NIM-ADPT',en:'sm',  d:'Portador de 2 NIM en formato SM-X'},
  {sku:'P-5GS6-R16SA-GL', en:'pim', d:'5G Sub-6 GHz Pluggable — 5G SA Global'},
  {sku:'P-LTEA7-NA',   en:'pim', d:'CAT7 LTE Advanced Pluggable — Norteamérica'},
  {sku:'P-LTEA7-EAL',  en:'pim', d:'CAT7 LTE Advanced Pluggable — EMEA, APAC y LATAM'},
  {sku:'P-LTEA7-JP',   en:'pim', d:'CAT7 LTE Advanced Pluggable — Japón'},
];

// Módulos de los Catalyst 8300 y 8200 (guía de pedido de la serie, actualizada el 17-jun-2026,
// tabla 5 «NIM, PIM, and SM modules supported on all Catalyst 8300 and 8200 edge platforms»).
// La tabla solo da la referencia, agrupada por columna: `d` es esa columna, no una descripción
// inventada. `familia` limita el módulo a los equipos cuyo id empieza así: la guía marca con un
// asterisco los «specific to Catalyst 8300 edge platforms», y sus SM de doble ancho (`ranuras: 2`)
// van solo en los C8300-2N2S. El 8200 no admite SM (tabla 4: 0 ranuras). Un módulo que la tabla
// pone en dos columnas (las T1/E1 y PRI, en datos y en voz) va una vez, con las dos.
const MODULOS_C8K = (() => {
  const columnas = [
    {en:'pim', d:'Celular LTE (PIM)', skus:['P-LTEA-LA', 'P-LTEA-EA', 'P-LTEAP18-GL']},
    {en:'nim', d:'Celular LTE (NIM)', skus:['NIM-LTEA-LA', 'NIM-LTEA-EA']},
    {en:'nim', d:'NIM de datos y switching LAN', skus:['C-NIM-1X', 'NIM-ES2-4', 'NIM-ES2-8', 'NIM-ES2-8-P', 'NIM-1T', 'NIM-2T', 'NIM-4T',
      'NIM-16A', 'NIM-24A', 'NIM-VA-B', 'NIM-VAB-A', 'NIM-VAB-M', 'NIM-4SHDSL-EA', 'NIM-1MFT-T1/E1', 'NIM-2MFT-T1/E1', 'NIM-4MFT-T1/E1',
      'NIM-8MFT-T1/E1', 'NIM-1CE1T1-PRI', 'NIM-2CE1T1-PRI', 'NIM-8CE1T1-PRI', 'NIM-2BRI-S/T', 'NIM-4BRI-S/T', 'C-NIM-4X', 'C-NIM-8T',
      'C-NIM-8M', 'C-NIM-2T', 'C-NIM-1M']},
    {en:'nim', d:'NIM de voz', skus:['NIM-2FXO', 'NIM-4FXO', 'NIM-2FXSP', 'NIM-4FXSP', 'NIM-4E/M', 'NIM-2BRI-NT/TE', 'NIM-4BRI-NT/TE',
      'NIM-2FXS/4FXOP', 'NIM-1MFT-T1/E1', 'NIM-2MFT-T1/E1', 'NIM-4MFT-T1/E1', 'NIM-8MFT-T1/E1', 'NIM-1CE1T1-PRI', 'NIM-2CE1T1-PRI',
      'NIM-8CE1T1-PRI', 'NIM-PVDM-32', 'NIM-PVDM-64', 'NIM-PVDM-128', 'NIM-PVDM-256']},
    {en:'sm', d:'Módulo de servicio SM-X', skus:['C-SM-NIM-ADPTR', 'C-SM-16P4M2X', 'C-SM-40P8M2X', 'SM-X-1T3/E3', 'SM-X-64A', 'SM-X-8FXS/12FXO',
      'SM-X-16FXS/2FXO', 'SM-X-24FXS/4FXO', 'SM-X-72FXS', 'SM-X-PVDM-500', 'SM-X-PVDM-1000', 'SM-X-PVDM-2000', 'SM-X-PVDM-3000',
      'UCS-E160S-M3/K9', 'UCS-E180D-M3/K9', 'UCS-E1120D-M3/K9']},
  ];
  const solo8300 = new Set(['C-NIM-1X', 'C-SM-NIM-ADPTR', 'C-SM-16P4M2X', 'C-SM-40P8M2X']);
  const dobleAncho = new Set(['C-SM-40P8M2X', 'SM-X-72FXS']);
  const lista = [];
  for (const c of columnas) {
    for (const sku of c.skus) {
      const ya = lista.find(x => x.sku === sku);
      if (ya) { ya.d = 'NIM de datos y de voz'; ya.voz = true; continue; }
      const x = {sku, en:c.en, d:c.d};
      if (c.d === 'NIM de voz' || /^SM-X-(\d+FXS|8FXS|16FXS|24FXS|72FXS|PVDM)/.test(sku)) x.voz = true;
      if (solo8300.has(sku)) x.familia = 'Catalyst 8300';
      if (dobleAncho.has(sku)) { x.familia = 'Catalyst 8300-2N2S'; x.ranuras = 2; }
      lista.push(x);
    }
  }
  // Descripción y puertos de los módulos Ethernet, de la tabla 7 de las fichas de los Catalyst 8200
  // y 8300 («Modules supported»): la guía de pedido solo da la referencia. Los «Ethernet Layer 3
  // modules» son WAN; los LAN/LANWAN con «Optional L3» pueden llevar un enlace; los NIM-ES2, no.
  const DETALLE = {
    'C-NIM-1X': {d:'1 puerto 10 Gbps SFP/SFP+ con WAN MACsec (L3)', puertos:[SFPP(1, 'WAN')]},
    'C-NIM-1M': {d:'1 puerto 2,5/1 Gbps RJ-45 WAN con PoE de 90 W (L3)', puertos:[MGIG(1, 2.5, 'WAN')]},
    'C-NIM-2T': {d:'2 puertos 100 Mbps/1 Gbps de modo dual RJ-45/SFP con WAN MACsec (L3)', puertos:[COMBO(2, 'WAN')]},
    'C-NIM-4X': {d:'Switch de 4 puertos 1/10 Gbps SFP/SFP+, MACsec LAN/WAN y L3 opcional', puertos:[SFPP(4, 'LAN/WAN')]},
    'C-NIM-8T': {d:'Switch de 8 puertos 100 Mbps/1 Gbps, MACsec LAN/WAN y L3 opcional', puertos:[RJ(8, 'LAN/WAN')]},
    'C-NIM-8M': {d:'Switch de 8 puertos 100M/1/2,5 Gbps, UPoE, MACsec LAN/WAN y L3 opcional', puertos:[MGIG(8, 2.5, 'LAN/WAN')]},
    // El portador lo describe el texto de la guía de pedido (sección D): «allows two NIMs to be
    // housed together in one single-wide SM slot».
    'C-SM-NIM-ADPTR': {d:'Portador de 2 NIM en una ranura SM de ancho simple'},
    'NIM-ES2-4': {d:'Switch LAN de 4 puertos Gigabit Ethernet'},
    'NIM-ES2-8': {d:'Switch LAN de 8 puertos Gigabit Ethernet'},
    'NIM-ES2-8-P': {d:'Switch LAN de 8 puertos Gigabit Ethernet con PoE'},
  };
  for (const x of lista) if (DETALLE[x.sku]) Object.assign(x, DETALLE[x.sku]);
  // Fuera de venta (2026-10-21): boletín EOL15805 (actualizado el 30-ene-2026), último pedido el
  // 1-ago-2026 y sin reemplazo. La guía de pedido aún los lista; el BOM no los propone.
  const EOL15805 = ['NIM-4SHDSL-EA', 'NIM-VAB-A', 'NIM-VA-B', 'NIM-VAB-M', 'SM-X-1T3/E3'];
  for (const x of lista) if (EOL15805.includes(x.sku)) x.finVenta = {boletin:'EOL15805', ultimoPedido:'2026-08-01'};
  return lista;
})();

// Alcance de cada óptica por tipo de fibra, en metros (2026-10-21), de la tabla de cableado de la
// ficha de su familia, traídas por Actions a fuente/cisco-opticas-2026-10-21: 1G «Cisco SFP Modules
// for Gigabit Ethernet Applications» (tabla 2), 10G «Cisco 10GBASE SFP+ Modules» (tabla 3 y sus
// notas), 40G «Cisco 40GBASE QSFP Modules» y 100G «Cisco 100GBASE QSFP-100G Modules». Fibras: om1
// (62,5 µm), om2 (50 µm), om3, om4 y smf (G.652). Cada tramo: hasta `m` metros (desde `desde`, si
// la nota cambia con la distancia), `nota` con lo que la ficha añade y `segunda` si la ficha exige
// algo al equipo o al cableado (RS-FEC, cable de acondicionamiento): el motor la elige solo si
// ninguna otra llega sin eso. El orden de cada lista es el de preferencia (de menor a mayor
// alcance, el estándar de cada fibra antes que el alternativo): el motor toma la primera que
// llega. La ficha da alcances, no la compatibilidad con cada router.
const T = (fibra, m, nota, extra) => ({fibra, m, ...(nota ? {nota} : {}), ...(extra || {})});
const MM = ['om1', 'om2', 'om3', 'om4'];
const ACONDICIONADOR = 'en multimodo lleva un cable de acondicionamiento de modo (mode-conditioning patch cord), que la ficha exige sea cual sea el tramo';
const OPTICS = {
  sfp1g: [
    {sku:'GLC-SX-MMD',  bom:'SFP-1GE-SX',   d:'1000BASE-SX · multimodo · LC · 275 m (OM1) a 1 km (OM3/OM4)',
      alcance:[T('om1', 275), T('om2', 550), T('om3', 1000), T('om4', 1000)]},
    {sku:'GLC-LH-SMD',  bom:'SFP-1GE-LH',   d:'1000BASE-LX/LH · monomodo · LC · 10 km (550 m en multimodo con cable de acondicionamiento)',
      alcance:[T('smf', 10000), ...MM.map((f) => T(f, 550, ACONDICIONADOR, {segunda:true}))]},
    {sku:'GLC-ZX-SMD',  bom:'SFP-1GE-ZX',   d:'1000BASE-ZX · monomodo · LC · unos 70 km',
      alcance:[T('smf', 70000, 'unos 70 km según la pérdida del enlace (presupuesto óptico de 21 dB); con una pérdida de tramo menor de 8 dB, la ficha pide un atenuador de 10 dB en recepción en cada extremo')]},
    // Los de cobre: «up to 100 m» sobre Cat 5 (GLC-T) y Cat 5e (GLC-TE), texto de la misma ficha.
    {sku:'GLC-T',       bom:'SFP-1GE-T',     d:'1000BASE-T · cobre · RJ45 · 100 m', alcance:[T('cobre', 100)]},
    {sku:'GLC-TE',      bom:'SFP-GE-T',      d:'1000BASE-T enhanced · cobre · RJ45 · 100 m · para ISR/Catalyst', alcance:[T('cobre', 100)]},
  ],
  sfp10g: [
    {sku:'SFP-10G-SR',   bom:'SFP-10G-SR-S', d:'10GBASE-SR · multimodo · LC · 33 m (OM1) a 400 m (OM4)',
      alcance:[T('om1', 33), T('om2', 82), T('om3', 300), T('om4', 400)]},
    {sku:'SFP-10G-LR',   bom:'SFP-10G-LR-S', d:'10GBASE-LR · monomodo · LC · 10 km', alcance:[T('smf', 10000)]},
    {sku:'SFP-10G-ER',   bom:'SFP-10G-ER-I', d:'10GBASE-ER · monomodo · LC · 40 km',
      alcance:[T('smf', 30000), T('smf', 40000, 'más de 30 km es un enlace de ingeniería (IEEE 802.3ae): calcular el presupuesto óptico', {desde:30000})]},
    {sku:'SFP-10G-ZR',   bom:'SFP-10G-ZR',   d:'10GBASE-ZR · monomodo · LC · unos 80 km',
      alcance:[
        T('smf', 5000, 'con un atenuador de 15 dB (15216 ATT LC 15=) por debajo de 5 km'),
        T('smf', 25000, 'con un atenuador de 10 dB (15216 ATT LC 10=) entre 5 y 25 km', {desde:5000}),
        T('smf', 45000, 'con un atenuador de 5 dB (15216 ATT LC 5=) entre 25 y 45 km', {desde:25000}),
        T('smf', 80000, 'unos 80 km: alcance aproximado de la ficha', {desde:45000}),
      ]},
  ],
  // SFP+ de cobre 10GBASE-T: solo en la G2 de la serie 8300, cuya guía de hardware lo lista en su
  // tabla de cableado («Gigabit Ethernet SFP+, copper · RJ-45 · 10GBASE-T · Category 6, Category
  // 7»); la referencia y su alcance son los de la ficha de 10G (tabla 1, «up to 30 meters»).
  sfp10gt: [
    {sku:'SFP-10G-T-X', bom:'SFP-10G-T-X', d:'10GBASE-T · cobre · RJ45 · hasta 30 m (CAT6A/CAT7) · 100M/1G/10G', alcance:[T('cobre', 30)]},
  ],
  // ONT XGS-PON en SFP+ (2026-10-27): solo en la jaula XGSPON/10GBASE-T de las 8100 VAI/VAP y
  // CVAI/CVAP (guía de hardware de la serie 8100, tabla 10). Ficha «Cisco 10G PON ONT Modules Data
  // Sheet» (actualizada el 15-oct-2026): ITU-T G.9807.1 (clase N1), SC/APC, una fibra monomodo
  // G.652, hasta 20 km (tabla 1), 2,1 W típicos y sin DOM (tabla 2). No es la óptica de un enlace
  // de fibra punto a punto: la pide un enlace XGS-PON, y la fibra y la distancia a la OLT son de
  // la red del operador.
  xgspon: [
    {sku:'SFP-10G-ONT20-I', bom:'SFP-10G-ONT20-I', d:'ONT XGS-PON · SFP+ · monomodo G.652, una fibra · SC/APC · hasta 20 km · 2,1 W',
      alcance:[T('smf', 20000)]},
  ],
  qsfp40g: [
    {sku:'QSFP-40G-SR4', bom:'QSFP-40G-SR4-S',d:'40GBASE-SR4 · multimodo · MPO de 12 fibras · 100 m (OM3) y 150 m (OM4)',
      alcance:[T('om3', 100, 'MPO de 12 fibras en paralelo'), T('om4', 150, 'MPO de 12 fibras en paralelo')]},
    {sku:'QSFP-40G-LR4', bom:'QSFP-40G-LR4-S',d:'40GBASE-LR4 · monomodo · LC · 10 km', alcance:[T('smf', 10000)]},
  ],
  qsfp100g: [
    {sku:'QSFP-100G-SR4-S', bom:'QSFP-100G-SR4-S',d:'100GBASE-SR4 · multimodo · MPO de 12 fibras · 70 m (OM3) y 100 m (OM4)',
      alcance:[T('om3', 70, 'MPO de 12 fibras en paralelo'), T('om4', 100, 'MPO de 12 fibras en paralelo')]},
    {sku:'QSFP-100G-LR4-S', bom:'QSFP-100G-LR4-S',d:'100GBASE-LR4 · monomodo · LC · 10 km', alcance:[T('smf', 10000)]},
    // La ficha de 100G no trae un «QSFP-100G-ER4-S» (lo que había aquí): su óptica de 40 km es la
    // ER4-Lite, que llega a 30 km sin FEC y a 40 km con el FEC del equipo.
    {sku:'QSFP-100G-ER4L-S', bom:'QSFP-100G-ER4L-S',d:'100GBASE ER4-Lite · monomodo · LC · 30 km (40 km con FEC en el equipo)',
      alcance:[T('smf', 30000), T('smf', 40000, 'necesita FEC en el puerto del equipo (sin FEC llega a 30 km)', {desde:30000, segunda:true})]},
  ]
};

// Ópticas de Meraki (2026-10-20). Los MX no llevan las GLC/SFP-10G de Catalyst: sus fichas y la
// guía «Small-Form Factor Pluggable (SFP) and Stacking Accessories» de documentation.meraki.com
// (revisada el 2-oct-2026) dan las MA-SFP, con su estándar, su alcance por tipo de fibra y con qué
// equipo van. Las categorías van por familia porque la compatibilidad no es la misma: los G2-MX no
// admiten la MA-SFP-1GB-SX ni la MA-SFP-10GB-ZR, y la MA-SFP-10GB-LRM solo va en multimodo en los
// G2-MX (en los MX, la guía la da solo en monomodo). Las de 25 Gbps solo las publica la ficha del
// C8455-G2-MX; su alcance sale de la ficha «Cisco 25GBASE SFP28 Modules» (tabla 2 y el texto de
// cada módulo, traída el 2026-10-21 a fuente/cisco-opticas-2026-10-21).
const MX_1G = [
  {sku:'MA-SFP-1GB-SX',   bom:'MA-SFP-1GB-SX',   d:'1000BASE-SX · multimodo · 850 nm · 220 m (OM1) a 1 km (OM4)',
    alcance:[T('om1', 220), T('om2', 550), T('om3', 550), T('om4', 1000)]},
  {sku:'MA-SFP-1GB-LX10', bom:'MA-SFP-1GB-LX10', d:'1000BASE-LX10 · monomodo · 1310 nm · 10 km (550 m en multimodo con cable de acondicionamiento)',
    alcance:[T('smf', 10000), ...MM.map((f) => T(f, 550, 'en multimodo lleva un cable LC de acondicionamiento de modo', {segunda:true}))]},
  {sku:'MA-SFP-1GB-TX',   bom:'MA-SFP-1GB-TX',   d:'1000BASE-T · cobre RJ45 · 100 m', alcance:[T('cobre', 100)]},
];
const LRM_SMF = T('smf', 300, '10GBASE-LRM es de multimodo; la guía de Meraki lo admite en monomodo hasta 300 m', {segunda:true});
const MX_10G = [
  {sku:'MA-SFP-10GB-SR',  bom:'MA-SFP-10GB-SR',  d:'10GBASE-SR · multimodo · 850 nm · 26 m (OM1) a 400 m (OM4)',
    alcance:[T('om1', 26), T('om2', 82), T('om3', 300), T('om4', 400)]},
  {sku:'MA-SFP-10GB-LR',  bom:'MA-SFP-10GB-LR',  d:'10GBASE-LR · monomodo · 1310 nm · 10 km', alcance:[T('smf', 10000)]},
  {sku:'MA-SFP-10GB-LRM', bom:'MA-SFP-10GB-LRM', d:'10GBASE-LRM · 1310 nm · 300 m en monomodo', alcance:[LRM_SMF]},
  {sku:'MA-SFP-10GB-ER',  bom:'MA-SFP-10GB-ER',  d:'10GBASE-ER · monomodo · 1550 nm · 40 km', alcance:[T('smf', 40000)]},
  {sku:'MA-SFP-10GB-ZR',  bom:'MA-SFP-10GB-ZR',  d:'10GBASE-ZR · monomodo · 1550 nm · 80 km', alcance:[T('smf', 80000)]},
];
// La LRM de los G2-MX: la guía la da también en OM1, OM2 (a 500 MHz·km) y OM3, 220 m; en OM4 no.
const LRM_G2 = {...MX_10G[2], d:'10GBASE-LRM · 1310 nm · 220 m en multimodo (OM1 a OM3), 300 m en monomodo',
  alcance:[T('om1', 220), T('om2', 220, 'OM2 de 500 MHz·km'), T('om3', 220), LRM_SMF]};
const RS_FEC = 'requiere RS-FEC en el puerto del equipo';
Object.assign(OPTICS, {
  mxsfp1g: MX_1G,
  mxg2sfp1g: MX_1G.filter((o) => o.sku !== 'MA-SFP-1GB-SX'),
  mxsfp10g: MX_10G,
  mxg2sfp10g: MX_10G.filter((o) => o.sku !== 'MA-SFP-10GB-ZR').map((o) => (o.sku === 'MA-SFP-10GB-LRM' ? LRM_G2 : o)),
  mxdac10g: [
    {sku:'MA-CBL-TA-1M', bom:'MA-CBL-TA-1M', d:'10GSFP+Cu · twinax pasivo · 1 m'},
    {sku:'MA-CBL-TA-3M', bom:'MA-CBL-TA-3M', d:'10GSFP+Cu · twinax pasivo · 3 m'},
  ],
  // A 25G, la ficha de cada módulo da el alcance según el FEC del puerto: el del C8455-G2-MX no
  // consta, así que lo que pide FEC va como segunda opción y con su nota.
  mxsfp25g: [
    {sku:'SFP-25G-SR-S',     bom:'SFP-25G-SR-S',     d:'25GBASE-SR · multimodo · 70 m (OM3) y 100 m (OM4), con RS-FEC en el equipo',
      alcance:[T('om3', 70, RS_FEC, {segunda:true}), T('om4', 100, RS_FEC, {segunda:true})]},
    {sku:'SFP-10/25G-CSR-S', bom:'SFP-10/25G-CSR-S', d:'10/25GBASE-CSR · multimodo · a 25G, 30/50 m (OM3/OM4) sin FEC y 300/400 m con RS-FEC',
      alcance:[
        T('om3', 30), T('om4', 50),
        T('om3', 70, 'requiere BASE-R FEC (o RS-FEC) en el puerto del equipo', {segunda:true}),
        T('om4', 100, 'requiere BASE-R FEC (o RS-FEC) en el puerto del equipo', {segunda:true}),
        T('om2', 70, RS_FEC, {segunda:true}),
        T('om3', 300, `${RS_FEC}; según la calidad de la fibra`, {segunda:true}),
        T('om4', 400, `${RS_FEC}; según la calidad de la fibra`, {segunda:true}),
      ]},
    {sku:'SFP-10/25G-LR-S',  bom:'SFP-10/25G-LR-S',  d:'10/25GBASE-LR · monomodo · a 25G, 1,5 km sin FEC y 10 km con RS-FEC',
      alcance:[
        T('smf', 1500, 'según la calidad de la fibra'),
        T('smf', 3500, 'requiere BASE-R FEC (o RS-FEC) en el puerto del equipo; según la calidad de la fibra', {segunda:true}),
        T('smf', 10000, RS_FEC, {segunda:true}),
      ]},
  ],
  mxdac25g: ['1M', '3M', '5M'].flatMap((l) => [
    {sku:`SFP-H25G-CU${l}`, bom:`SFP-H25G-CU${l}`, d:`Cable de cobre de 25 Gbps, ${l.replace('M', ' m')} (ficha del C8455-G2-MX, «SFP-H25G-CU1M/3M/5M»)`},
    {sku:`SFP-25G-AOC${l}`, bom:`SFP-25G-AOC${l}`, d:`Cable óptico activo de 25 Gbps, ${l.replace('M', ' m')} (ficha del C8455-G2-MX, «SFP-25G-AOC1M/3M/5M»)`},
  ]),
});

// Controladores de Catalyst SD-WAN (2026-10-21, propuesta 2.2): «Recommended Computing Resources for
// Cisco Catalyst SD-WAN Control Components Release 20.18.x» (actualizada el 25-sep-2026), un solo
// inquilino. Tabla 2: el SD-WAN Manager por número de equipos, sin y con SAIE (rangos que se solapan:
// la tabla da varias opciones, con o sin recuperación ante desastres); tablas 5 y 6: Validators y
// Controllers, ya contando la redundancia 1:1 entre dos centros de datos. Por encima de 12.500
// equipos, varios overlays; en la nube de Cisco, los recursos los fija Cisco Cloud Ops.
const CONTROLADORES_SDWAN = {
  version:'20.18.x', maxEquipos:12500,
  tipos:{Small:'16 vCPU, 32 GB de RAM, 500 GB', Medium:'32 vCPU, 64 GB de RAM, 1 TB', Large:'32 vCPU, 128 GB de RAM, 5 TB'},
  manager:{
    sinSaie:[
      {de:0, a:249, n:'Un nodo Small', tipo:'Small', dr:false},
      {de:0, a:999, n:'Un nodo Large', tipo:'Large', dr:true},
      {de:1000, a:1500, n:'Un nodo Large', tipo:'Large', dr:true},
      {de:1500, a:2000, n:'Clúster de tres nodos Medium (todos los servicios)', tipo:'Medium', dr:false},
      {de:1000, a:2500, n:'Clúster de tres nodos Large (todos los servicios)', tipo:'Large', dr:true},
      {de:2000, a:5000, n:'Clúster de tres nodos Large (todos los servicios)', tipo:'Large', dr:true},
      {de:2000, a:5000, n:'Clúster de seis nodos Large (tres con ConfigDB)', tipo:'Large', dr:true},
      {de:5000, a:12500, n:'Clúster de seis nodos Large (tres con ConfigDB)', tipo:'Large', dr:false},
    ],
    conSaie:[
      {de:0, a:249, n:'Un nodo Medium', tipo:'Medium', dr:false},
      {de:0, a:249, n:'Un nodo Large', tipo:'Large', dr:true},
      {de:250, a:1000, n:'Un nodo Large', tipo:'Large', dr:true},
      {de:1000, a:2500, n:'Clúster de tres nodos Large (todos los servicios)', tipo:'Large', dr:true},
      {de:2500, a:4000, n:'Clúster de tres nodos Large (todos los servicios)', tipo:'Large', dr:true},
      {de:2500, a:5000, n:'Clúster de seis nodos Large (tres con ConfigDB)', tipo:'Large', dr:true},
      {de:4000, a:7000, n:'Clúster de seis nodos Large (tres con ConfigDB)', tipo:'Large', dr:true},
      {de:7000, a:12500, n:'Clúster de seis nodos Large (tres con ConfigDB)', tipo:'Large', dr:true},
    ],
  },
  validadores:[
    {de:0, a:50, n:2, vcpu:2, ram:4}, {de:51, a:1000, n:2, vcpu:2, ram:4}, {de:1000, a:4000, n:2, vcpu:4, ram:8},
    {de:4000, a:8000, n:4, vcpu:4, ram:8}, {de:8000, a:12500, n:6, vcpu:4, ram:8},
  ],
  controladores:[
    {de:0, a:249, n:2, vcpu:4, ram:8}, {de:250, a:1000, n:2, vcpu:4, ram:16}, {de:1000, a:2500, n:2, vcpu:8, ram:16},
    {de:2500, a:5000, n:4, vcpu:8, ram:16}, {de:5000, a:7500, n:6, vcpu:8, ram:16}, {de:7500, a:10000, n:8, vcpu:8, ram:16},
    {de:10000, a:12500, n:10, vcpu:8, ram:16},
  ],
};

// Módulos celulares (2026-10-21, propuesta 1.2): categoría y ancho de banda de bajada y subida de la
// ficha «Cisco Wireless WAN Routers and Modules» (tabla 1, 4-jun-2024). Es el de la categoría de la
// norma, un pico teórico: el operador da menos. La ficha no lista la G2 entre los equipos que los
// admiten (es anterior a ella): qué PIM va en cada familia lo siguen diciendo sus guías de pedido.
const CELULAR = {
  'P-5GS6-R16SA-GL': {red:'5G SA', bajada:3600, subida:450},
  'P-5GS6-GL':       {red:'5G', bajada:3300, subida:400},
  'P-LTEAP18-GL':    {red:'LTE CAT18', bajada:1200, subida:150},
  'P-LTEA7-NA':      {red:'LTE CAT7', bajada:300, subida:150},
  'P-LTEA7-EAL':     {red:'LTE CAT7', bajada:300, subida:150},
  'P-LTEA7-JP':      {red:'LTE CAT7', bajada:300, subida:150},
  'P-LTEA-EA':       {red:'LTE CAT6', bajada:300, subida:50},
  'P-LTEA-LA':       {red:'LTE CAT6', bajada:300, subida:50},
  'NIM-LTEA-EA':     {red:'LTE CAT6', bajada:300, subida:50},
  'NIM-LTEA-LA':     {red:'LTE CAT6', bajada:300, subida:50},
};

// Cisco Secure Firewall para la opción «Firewall dedicado» (2026-10-21, propuesta 3.2). Cifras de
// Threat Defense de cada ficha: serie 1200 (tablas 6 y 8, 9-jul-2025), 3100 (tabla 2, 6-oct-2026) y
// 4200 (tabla 1, 29-oct-2024), en Mbps: FW + AVC y FW + AVC + IPS con paquetes de 1.024 B, IPsec con
// TCP de 1.024 B y Fastpath, y TLS con un 50 % de TLS 1.2 (AES256-SHA, RSA de 2.048). Referencias de
// la «Cisco Network Security Ordering Guide» (oct-2026): el equipo con Threat Defense y la licencia de
// Threat, Malware y URL (TMC); en la 1200 el plazo (1, 3 o 5 años) se elige en CCW, en la 3100 y la
// 4200 va en la referencia. La ficha no dice si el caudal es de un sentido o la suma: se compara con
// la suma de los dos (lo prudente). Malware y URL no tienen cifra propia en ninguna ficha.
const FW = (id, serie, pid, tmc, fwAvc, ips, vpn, tls, sesiones, cps, peers, extra) =>
  ({id, serie, pid, tmc, fwAvc, ips, vpn, tls, sesiones, cps, peers, ...(extra || {})});
// HARDWARE (2026-10-31, decisión del dueño: «Sí, ficha completa»): interfaces, formato, PoE,
// alimentación y segmento de las mismas fichas. 1200: tablas 3 y 4 (rasgos), 5 (interfaces), 10 y 11
// (especificaciones; el consumo típico de 32 W va en una celda que cubre los tres compactos, y los 1U
// no lo publican). 3100: tabla 4 («Single 400W AC, Dual 400W AC optional» en 3105/3110/3120, «Dual
// 400W AC» en 3130/3140). 4200: tabla 3 (dos fuentes de 1.900 W a 220 V y 1.200 W a 110 V; el 4245,
// «Only 200 to 240 VAC»). El segmento es la frase de cada ficha: «branch offices and smaller sites»
// (1200), «from the Internet edge to the data center» (3100), «large enterprises, datacenters, and
// service providers» (4200). Ningún dato de consumo que la ficha no da: sin él, «sin dato».
const HW1200C = (ports, poe, extra) => ({ports, poe, ru:null, redund:false, gestion:'1x 1000BASE-T',
  psu:{watts:32, tipo:'Fuente externa única (100-240 V AC)'}, formato:'Sobremesa compacto (rack o pared con accesorios opcionales)', seg:'Sucursal y sede pequeña', ...(extra || {})});
const HW1200U = (ports) => ({ports, poe:false, ru:1, redund:false, gestion:'1x 1000BASE-T',
  psu:{watts:null, tipo:'Fuente única integrada (100-240 V AC)'}, formato:'1U en rack', seg:'Sucursal y sede pequeña'});
const HW3100 = (sfp, dual) => ({ports:`8x 1GBASE-T (RJ-45) + 8x ${sfp} (SFP) + 1 ranura de módulo de red (hasta 24 puertos)`,
  poe:false, ru:1, redund:dual ? true : 'opcional', gestion:'1x 1/10G SFP',
  psu:{watts:null, tipo:dual ? 'Dos fuentes de 400 W AC de serie (DC opcional)' : 'Una fuente de 400 W AC; la segunda, opcional (DC opcional)'},
  formato:'1U en rack', seg:'Internet edge y data center'});
const HW4200 = (extra) => ({ports:'8x 1/10/25G (SFP28) + 2 ranuras de módulo de red', poe:false, ru:1, redund:true,
  gestion:'2x 1/10/25G (SFP28)', psu:{watts:null, tipo:'Dos fuentes AC (1.900 W a 220 V, 1.200 W a 110 V)'},
  formato:'1U en rack', seg:'Gran empresa, data center y operador', ...(extra || {})});
const SECURE_FIREWALL = {
  // La ficha oficial de cada serie (2026-10-31): la misma URL que su entrada de fuentes.js, que la
  // prueba casa; la ficha del firewall dedicado en la página la enlaza.
  fichas:{
    1200:'https://www.cisco.com/c/en/us/products/collateral/security/firewalls/secure-firewall-1200-series-ds.html',
    3100:'https://www.cisco.com/c/en/us/products/collateral/security/firewalls/secure-firewall-3100-series-ds.html',
    4200:'https://www.cisco.com/c/en/us/products/collateral/security/firewalls/secure-firewall-4200-ds.html',
  },
  bases:{fwAvc:'FW + AVC, 1.024 B', ips:'FW + AVC + IPS, 1.024 B', vpn:'IPsec, TCP de 1.024 B con Fastpath', tls:'50 % de TLS 1.2, AES256-SHA, RSA de 2.048'},
  modelos:[
    FW('Secure Firewall 1210CE', '1200', 'CSF1210CE-TD-K9', 'CSF1210CET-TMC', 6000, 6000, 5000, 1000, 200000, 35000, 200, HW1200C('8x 1000BASE-T', false)),
    FW('Secure Firewall 1210CP', '1200', 'CSF1210CP-TD-K9', 'CSF1210CPT-TMC', 6000, 6000, 5000, 1000, 200000, 35000, 200, HW1200C('8x 1000BASE-T (4 con PoE+ 802.3at, 120 W en total)', true, {psu:{watts:32, tipo:'Fuente externa única (100-240 V AC); 165 W máximos con PoE'}})),
    FW('Secure Firewall 1220CX', '1200', 'CSF1220CX-TD-K9', 'CSF1220CXT-TMC', 9000, 9000, 10000, 1500, 300000, 50000, 300, HW1200C('8x 1000BASE-T + 2x SFP+ (1/10G)', false)),
    FW('Secure Firewall 1230', '1200', 'CSF1230-TD-K9', 'CSF1230T-TMC', 13000, 9000, 13000, 2500, 400000, 50000, 500, HW1200U('8x 1000BASE-T + 4x SFP+ (1/10G)')),
    FW('Secure Firewall 1240', '1200', 'CSF1240-TD-K9', 'CSF1240T-TMC', 18000, 12000, 18000, 3200, 600000, 70000, 1000, HW1200U('8x 1000BASE-T + 4x SFP+ (1/10G)')),
    FW('Secure Firewall 1250', '1200', 'CSF1250-TD-K9', 'CSF1250T-TMC', 24000, 18000, 22000, 4100, 1000000, 100000, 1500, HW1200U('8x 2.5GBASE-T + 4x SFP+ (1/10G)')),
    FW('Secure Firewall 3105', '3100', 'FPR3105-NGFW-K9', 'L-FPR3105T-TMC-{n}Y', 10000, 10000, 5500, 3200, 1500000, 90000, 2000, HW3100('1/10G', false)),
    FW('Secure Firewall 3110', '3100', 'FPR3110-NGFW-K9', 'L-FPR3110T-TMC-{n}Y', 17000, 17000, 8000, 4800, 2000000, 130000, 3000, HW3100('1/10G', false)),
    FW('Secure Firewall 3120', '3100', 'FPR3120-NGFW-K9', 'L-FPR3120T-TMC-{n}Y', 21000, 21000, 10000, 6700, 4000000, 170000, 7000, HW3100('1/10G', false)),
    FW('Secure Firewall 3130', '3100', 'FPR3130-NGFW-K9', 'L-FPR3130T-TMC-{n}Y', 38000, 38000, 17800, 9100, 6000000, 240000, 15000, HW3100('1/10/25G', true)),
    FW('Secure Firewall 3140', '3100', 'FPR3140-NGFW-K9', 'L-FPR3140T-TMC-{n}Y', 45000, 45000, 22400, 11500, 10000000, 300000, 20000, HW3100('1/10/25G', true)),
    FW('Secure Firewall 4215', '4200', 'FPR4215-NGFW-K9', 'L-FPR4215T-TMC-{n}Y', 65000, 65000, 45000, 20000, 15000000, 350000, 20000, HW4200()),
    FW('Secure Firewall 4225', '4200', 'FPR4225-NGFW-K9', 'L-FPR4225T-TMC-{n}Y', 80000, 80000, 80000, 30000, 30000000, 600000, 25000, HW4200()),
    FW('Secure Firewall 4245', '4200', 'FPR4245-NGFW-K9', 'L-FPR4245T-TMC-{n}Y', 140000, 140000, 140000, 45000, 60000000, 800000, 30000, HW4200({psu:{watts:null, tipo:'Dos fuentes AC de 1.900 W; solo a 200-240 V AC'}})),
  ],
};

// Cisco Secure Access, la salida a Internet protegida en la nube (2026-10-21, propuesta 3.1).
// Guía de pedido «Secure-Access-Sub» (actualizada el 20-oct-2026): una suscripción por cliente
// (SECURE-ACCESS-SUB, sin precio propio), plazos de 12, 36 o 60 meses, licencia por usuario cubierto
// (SIA y SPA, Essentials o Advantage, mínimo 50 usuarios; precio por tramos en CCW) o, solo en SIA
// Essentials y para los usuarios de la sede, por ancho de banda de la sede con un volumen mensual de
// datos. Advantage incluye IPS y control L7; en Essentials es el complemento SA-THRT, con la cantidad
// del mayor número de puestos. «Best Practices for Configuring Network Tunnels by Device» de su guía
// de usuario: «a throughput of 1 Gbps per tunnel», túnel principal y de respaldo obligatorios, y más
// de 1 Gbps con varios túneles en ECMP. «Establish an IPsec Tunnel» (26-oct-2026, tabla «Tunnel
// Throughput, Capacity, and Scaling»): «1 Gbps per tunnel (in either direction)» y «up to 10 ECMP
// tunnels».
const SECURE_ACCESS = {
  sub:'SECURE-ACCESS-SUB', plazos:[12, 36, 60], minUsuarios:50, tunelMbps:1000, ecmpMax:10,
  usuario:{
    ess:{n:'Essentials', sia:'SA-SIA-ESS', spa:'SA-SPA-ESS-K9'},
    adv:{n:'Advantage', sia:'SA-SIA-ADV-K9', spa:'SA-SPA-ADV-K9'},
  },
  amenazas:{sku:'SA-THRT', n:'Cisco Secure Access Threat Defense', d:'IPS y control L7 («This is L7/IPS functionality»): complemento de Essentials; Advantage lo incluye.'},
  sede:[
    {grupo:'Small', hastaMbps:50, tiers:[{t:'S1', sku:'SA-SIAS-S1-ESS', datos:'100 GB'}, {t:'S2', sku:'SA-SIAS-S2-ESS', datos:'250 GB'}, {t:'S3', sku:'SA-SIAS-S3-ESS', datos:'500 GB'}]},
    {grupo:'Medium', hastaMbps:500, tiers:[{t:'M1', sku:'SA-SIAS-M1-ESS', datos:'1 TB'}, {t:'M2', sku:'SA-SIAS-M2-ESS', datos:'2,5 TB'}, {t:'M3', sku:'SA-SIAS-M3-ESS', datos:'5 TB'}]},
    {grupo:'Large', hastaMbps:5000, tiers:[{t:'L1', sku:'SA-SIAS-L1-ESS', datos:'10 TB'}, {t:'L2', sku:'SA-SIAS-L2-ESS', datos:'25 TB'}, {t:'L3', sku:'SA-SIAS-L3-ESS', datos:'50 TB'}]},
  ],
};

const OPTIC_LABEL = {sfp1g:'1GE — SFP / GLC', sfp10g:'10GE — SFP+', sfp10gt:'10GE — SFP+ de cobre (10GBASE-T)', xgspon:'10G — ONT XGS-PON en SFP+', qsfp40g:'40GE — QSFP+', qsfp100g:'100GE — QSFP28',
  mxsfp1g:'1GE — SFP Meraki', mxg2sfp1g:'1GE — SFP Meraki (G2-MX)', mxsfp10g:'10GE — SFP+ Meraki', mxg2sfp10g:'10GE — SFP+ Meraki (G2-MX)',
  mxdac10g:'10GE — twinax Meraki', mxsfp25g:'25GE — SFP28 (C8455-G2-MX)', mxdac25g:'25GE — cable (C8455-G2-MX)'};

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
  ess:  'DNA Essentials — SD-WAN Manager (nube o local), topología libre, políticas por aplicación, firewall de aplicaciones, IPS/IDS Snort, filtrado de URL, Secure Endpoint, FEC y OSPF/BGP; hasta 10 VPN de usuario. No disponible en el Catalyst 8500 ni el ASR 1000 (FAQ de DNA, 16-jun-2026).',
  adv:  'DNA Advantage — todo Essentials más segmentación sin límite, SD-WAN Analytics, Predictive Path Recommendations (ThousandEyes WAN Insights), Cloud OnRamp avanzado y encadenado de servicios (FAQ de DNA, 16-jun-2026).',
  pre:  'DNA Premier — discontinuado (FAQ de DNA, 16-jun-2026): se propone Advantage.',
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

module.exports = { MODELS, PUERTOS, OPTICS, SECURE_ACCESS, SECURE_FIREWALL, CELULAR, CONTROLADORES_SDWAN, OPTIC_LABEL, PARTS_DESC, SMARTNET, DNA_DESC, LICENCIAS_G2, LICENCIAS_DNA, MODULOS_G2, MODULOS_C8K, CLOUD_UNIFICATION_NOTE, SDWAN_COMPARISON_NOTE };
