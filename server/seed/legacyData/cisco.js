// Actualizado con datasheets oficiales de Cisco — Fase 2 verificación (Ago 2026)
//
// Fin de venta anunciado (27-jul-2026, boletines EOL oficiales de Cisco) para los 4 chasis fijos de la serie
// Catalyst 8300/8200 "Edge Platforms" (no confundir con la línea distinta "Edge uCPE", también descontinuada
// por separado). Siguen 100% vigentes para cotizar — el aviso es sobre la fecha límite de pedido, no remoción
// del catálogo (a diferencia del criterio eol:true de Fortinet, que sí oculta del cotizador). Boletines:
// https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html
// https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8500l-8s4x-4t2x-c8300-1n1s-6t-eol.html
// Ninguno de los dos boletines especifica un PID de reemplazo directo, PERO se confirmó vía export real de CCW
// (Products_115951960955347.xlsx, 17-ago-2026) que Cisco ya vende la generación sucesora bajo la marca
// "Secure Router (G2)" — ver modelo 'Cisco Secure Router C8355-G2' más abajo, sucesor confirmado del 8300 hub.
//
// REVISION DE CICLO DE VIDA (ago-2026). La tabla solo cubria los 4 chasis Catalyst 8300/8200,
// asi que TODA la linea ASR 1000 de este catalogo se ofrecia como si estuviera vigente. No lo
// esta: los tres chasis tienen boletin oficial de fin de venta y en los tres la fecha de
// ultimo pedido YA PASO. El 8500-12X4QC tambien tiene boletin, con fecha aun por delante.
// Se registran con su fecha real en vez de con una marca fija: la regla de ficha.js compara
// esa fecha contra la de hoy, asi que un equipo deja de proponerse solo el dia que vence su
// ultimo pedido, sin que nadie tenga que acordarse de volver aqui. `sucesor` es por entrada
// porque no todos comparten reemplazo — el de los 8300 es el Secure Router G2, el de los ASR
// no lo nombra el boletin.
const EOL_ANNOUNCED = {
  'Catalyst 8200L':             {pid:'C8200L-1N-4T',  lastOrder:'2027-07-31', sucesor:'Cisco Secure Router (G2)',
                                 url:'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html'},
  'Catalyst 8200':              {pid:'C8200-1N-4T',   lastOrder:'2027-07-31', sucesor:'Cisco Secure Router (G2)',
                                 url:'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html'},
  'Catalyst 8300-1N1S-6T':      {pid:'C8300-1N1S-6T', lastOrder:'2027-01-31', sucesor:'Cisco Secure Router (G2)',
                                 url:'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8500l-8s4x-4t2x-c8300-1n1s-6t-eol.html'},
  'Catalyst 8300-2N2S-6T':      {pid:'C8300-2N2S-6T', lastOrder:'2027-07-31', sucesor:'Cisco Secure Router (G2)',
                                 url:'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html'},
  // Fin de venta ya vencido: solo referencia para parque instalado.
  'Catalyst 8500-12X4QC':       {pid:'C8500-12X4QC',  lastOrder:'2027-01-31', sucesor:null,
                                 url:'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8500-12x-c8500-12x4qc-eol.html'},
  'ASR 1001-X':                 {pid:'ASR1001-X',     lastOrder:'2022-08-01', sucesor:null,
                                 url:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1001-x-1002-x-eol.html'},
  'ASR 1002-HX':                {pid:'ASR1002-HX',    lastOrder:'2025-03-31', sucesor:null,
                                 url:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1002-hx-asso-part-eol.html'},
  'ASR 1006-X':                 {pid:'ASR1006-X',     lastOrder:'2026-07-31', sucesor:null,
                                 url:'https://www.cisco.com/c/en/us/products/collateral/routers/asr-1000-series-aggregation-services-routers/asr1006-x-chassis-eol.html'},
};
const MODELS = [
  // ISR 1000
  {id:'ISR 1111-8P',      ser:'ISR 1000', fam:'Sucursal muy pequeña / SOHO',           fwd:300,  ipsec:200, sdwan:null, aps:0,    redund:false, lte:false,
   ports:'1 GE WAN combo + 8 GE LAN · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC','NIM-4G-LTE']},
  {id:'ISR 1111X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña con HSEC',              fwd:800,  ipsec:800, sdwan:null, aps:0,    redund:false, lte:false,
   ports:'2 GE WAN combo + 8 GE LAN · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC','NIM-4G-LTE']},
  {id:'ISR 1116-4P',      ser:'ISR 1000', fam:'Sucursal + LTE integrado',               fwd:300,  ipsec:200, sdwan:null, aps:0,    redund:false, lte:true,
   ports:'4 GE WAN + LTE integrado · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC']},
  // Catalyst 8000 (Reemplazo de ISR 4000) — elp/elpN verificados contra export real de CCW (17-ago-2026, ver
  // nota de fuentes al final del archivo). Fin de venta anunciado en 8200L/8200/8300-1N1S-6T/8300-2N2S-6T,
  // ver EOL_ANNOUNCED — sucesor confirmado: Cisco Secure Router (G2), ver bloque siguiente.
  {id:'Catalyst 8200L',   ser:'Catalyst 8000', fam:'Sucursal SD-WAN compacta',          fwd:500,  ipsec:500, sdwan:400,  aps:50,  redund:false, lte:false,
   ports:'4 GE WAN + 8 GE LAN + 2 SFP · 1 NIM', nim:1, sm:0, optics:['sfp1g'], parts:['DNA-ADVANTAGE','C8200L-NIM-1X']},
  {id:'Catalyst 8200',    ser:'Catalyst 8000', fam:'Sucursal SD-WAN estándar',          fwd:1000, ipsec:1000, sdwan:900, aps:100, redund:false, lte:false,
   ports:'4 GE WAN + 2 NIM · IOS XE SD-WAN nativo', nim:2, sm:0, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE','C8200-NIM-2G'], elp:'$6,967.76', elpN:6967.76},
  {id:'Catalyst 8300-1N1S-6T', ser:'Catalyst 8000', fam:'Hub regional SD-WAN',         fwd:2000, ipsec:2000, sdwan:1800, aps:500, redund:true,  lte:false,
   ports:'6 GE + 2 SFP+ + 1 NIM + 1 SM · mod. fuente', nim:1, sm:1, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE','C8300-NIM-2X'], elp:'$21,286.41', elpN:21286.41},
  {id:'Catalyst 8300-2N2S-6T', ser:'Catalyst 8000', fam:'Hub regional SD-WAN doble NIM',fwd:5000, ipsec:5000, sdwan:5000, aps:1000,redund:true,  lte:false,
   ports:'6 GE + 2 SFP+ + 2 NIM + 2 SM', nim:2, sm:2, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE','C8300-NIM-2X'], elp:'$29,026.93', elpN:29026.93},
  {id:'Catalyst 8500-12X4QC',  ser:'Catalyst 8000', fam:'Hub DC / Edge de alto rendimiento',fwd:96000,ipsec:96000,sdwan:31900,aps:2000,redund:true,lte:false,
   ports:'12x10GE SFP+ + 4x40GE QSFP · modular', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['DNA-ADVANTAGE']},
  // Cisco Secure Router (G2) — generación sucesora confirmada de Catalyst 8300/8200 (mismo IOS XE SD-WAN,
  // nueva marca "Secure Router"). Cada chasis se vende en dos SKUs paralelos sobre el mismo hardware: sin
  // sufijo corre IOS XE clásico (CCW+DNA), con sufijo "-MX" corre Meraki OS (dashboard) — ver nota de unificación.
  // C8355-G2 (familia 8300, sucesor directo del Catalyst 8300): 38 Gbps forwarding, 20 Gbps IPsec, 3.9 Gbps
  // threat protection NGFW/IPS/URL/AMP. Precio real de CCW.
  // C8455-G2 (familia 8400, datasheet oficial "8400 Series Secure Routers"): 67 Gbps forwarding, 31 Gbps
  // IPsec, 15.5 Gbps SD-WAN; la variante -MX agrega threat management hasta 8 Gbps y firewall L3/7 hasta
  // 20 Gbps. Existe además un hermano mayor C8475-G2 (8x1GE+8x10GE+4x25GE) sin throughput публicado — no
  // modelado. Precio de hardware sin confirmar en CCW (solo se vio el SKU de licencia+soporte EAB-C8455-SDW-
  // 3Y/5Y/7Y = $60,197/$100,329/$140,461); licencia real del C8121-G2-MX (branch): EAB-C8121-SDW-3Y/5Y/7Y =
  // $6,182/$10,304/$14,426.
  {id:'Cisco Secure Router C8355-G2', ser:'Secure Router (G2)', fam:'Hub regional SD-WAN — sucesor del Catalyst 8300', fwd:38000, ipsec:20000, sdwan:null, aps:500, redund:false, lte:false,
   ports:'4x10G SFP/SFP+ + 4x5G mGig RJ45 + 2x1G RJ45 · 16GB RAM', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE'], elp:'$15,552.28', elpN:15552.28},
  {id:'Cisco Secure Router C8455-G2', ser:'Secure Router (G2)', fam:'Internet edge / campus de alto rendimiento — familia 8400', fwd:67000, ipsec:31000, sdwan:15500, aps:1000, redund:false, lte:false,
   ports:'8x1GE + 2x10GE + 2x25GE · 32GB RAM · hasta 2TB storage', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE']},
  // ASR 1000
  {id:'ASR 1001-X',       ser:'ASR 1000', fam:'WAN Edge compacto (2.5–20 Gbps)',        fwd:20000, ipsec:8000, sdwan:5000, aps:0, redund:true, lte:false,
   ports:'6 GE integrados + 2 SFP+ · ESP escal.', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['ASR1001X-10G-HA-BUN']},
  {id:'ASR 1002-HX',      ser:'ASR 1000', fam:'WAN Edge / DC gateway (35 Gbps)',        fwd:35000, ipsec:18000,sdwan:10000,aps:0, redund:true, lte:false,
   ports:'8 GE + 4x10GE SFP+ + 2x100GE QSFP28', nim:0, sm:0, optics:['sfp1g','sfp10g','qsfp100g'], parts:['ASR1002HX-HA-BUN']},
  {id:'ASR 1006-X',       ser:'ASR 1000', fam:'Core WAN modular (200 Gbps)',            fwd:200000,ipsec:78000,sdwan:20000,aps:0, redund:true, lte:false,
   ports:'6 slots SPA · hasta 200GE · modular', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['ASR1006X-HA-BUN']},
  // Meraki MX — Seguridad y SD-WAN gestionados en la nube
  {id:'Meraki MX67',       ser:'Meraki MX', fam:'Sucursal pequeña / SOHO (hasta 50 clientes)',    fwd:600,  ipsec:300,  sdwan:300,  aps:50,  redund:false, lte:false,
   ports:'4 GE LAN + 1 GE WAN + 1 GE WAN/LAN', nim:0, sm:0, optics:[], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
  {id:'Meraki MX68',       ser:'Meraki MX', fam:'Sucursal pequeña + PoE / LTE (hasta 50 clientes)',fwd:600,  ipsec:300,  sdwan:300,  aps:50,  redund:false, lte:true,
   ports:'10 GE LAN (2 PoE) + 2 GE WAN', nim:0, sm:0, optics:[], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
  {id:'Meraki MX75',       ser:'Meraki MX', fam:'Sucursal mediana (hasta 200 clientes)',          fwd:1000, ipsec:500,  sdwan:500,  aps:200, redund:false, lte:false,
   ports:'12 GE LAN + 2 GE WAN + 2 SFP', nim:0, sm:0, optics:['sfp1g'], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
  {id:'Meraki MX85',       ser:'Meraki MX', fam:'Sucursal mediana-grande (hasta 250 clientes)',   fwd:1000, ipsec:500,  sdwan:500,  aps:250, redund:false, lte:false,
   ports:'8 GE LAN + 2 GE WAN + 2 SFP + 2 SFP+', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
  {id:'Meraki MX95',       ser:'Meraki MX', fam:'Campus / Hub regional (hasta 500 clientes)',     fwd:2000, ipsec:800,  sdwan:1000, aps:500, redund:true,  lte:false,
   ports:'6 GE LAN + 2 GE WAN + 2 SFP+ 10GE', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
  {id:'Meraki MX105',      ser:'Meraki MX', fam:'Campus / Hub grande (hasta 750 clientes)',       fwd:3000, ipsec:1000, sdwan:1500, aps:750, redund:true,  lte:false,
   ports:'8 GE LAN + 2 GE WAN + 2 SFP+ 10GE', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
  {id:'Meraki MX250',      ser:'Meraki MX', fam:'Datacenter / Concentrador (hasta 2000 clientes)',fwd:4000, ipsec:1000, sdwan:2000, aps:2000,redund:true,  lte:false,
   ports:'8 GE LAN + 2 GE WAN + 2 SFP+ 10GE · 1U rack', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
  {id:'Meraki MX450',      ser:'Meraki MX', fam:'Datacenter / Hub central (hasta 10000 clientes)',fwd:5000, ipsec:2000, sdwan:4000, aps:10000,redund:true, lte:false,
   ports:'8 GE LAN + 2 GE WAN + 4 SFP+ 10GE · 1U rack', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['LIC-MX-ENT','LIC-MX-SEC','LIC-MX-SDW']},
];

for (const m of MODELS) {
  m.eolAnnounced = EOL_ANNOUNCED[m.id] || null;
  // PID de hardware Meraki: mismo patrón "<modelo>-HW" para toda la línea MX vigente (verificado contra
  // documentation.meraki.com y distribuidores — MX67-HW, MX75-HW, MX95-HW, MX250-HW, MX450-HW, etc.)
  if (m.ser === 'Meraki MX') m.hwSku = m.id.replace('Meraki ', '') + '-HW';
}

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
  'C8200L-NIM-1X':'C8200L-NIM-1X — slot NIM adicional para Catalyst 8200L',
  'C8200-NIM-2G':'C8200-NIM-2G — módulo NIM 2G para Catalyst 8200',
  'C8300-NIM-2X':'C8300-NIM-2X — módulo NIM 2x10GE para Catalyst 8300',
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

module.exports = { MODELS, OPTICS, OPTIC_LABEL, PARTS_DESC, SMARTNET, DNA_DESC, CLOUD_UNIFICATION_NOTE, SDWAN_COMPARISON_NOTE };
