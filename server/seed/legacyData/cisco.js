// Copiado tal cual de dimensionador-cisco-catalyst8k.html (lineas 336-436)
const MODELS = [
  // ISR 1000
  {id:'ISR 1111-8P',      ser:'ISR 1000', fam:'Sucursal muy pequeña / SOHO',           fwd:300,  ipsec:100, sdwan:null, aps:0,    redund:false, lte:false,
   ports:'1 GE WAN combo + 8 GE LAN · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC','NIM-4G-LTE']},
  {id:'ISR 1111X-8P',     ser:'ISR 1000', fam:'Sucursal pequeña con HSEC',              fwd:500,  ipsec:200, sdwan:null, aps:0,    redund:false, lte:false,
   ports:'2 GE WAN combo + 8 GE LAN · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC','NIM-4G-LTE']},
  {id:'ISR 1116-4P',      ser:'ISR 1000', fam:'Sucursal + LTE integrado',               fwd:300,  ipsec:100, sdwan:null, aps:0,    redund:false, lte:true,
   ports:'4 GE WAN + LTE integrado · 1 NIM slot', nim:1, sm:0, optics:['sfp1g'], parts:['LIC-HSEC']},
  // ISR 4000
  {id:'ISR 4221',         ser:'ISR 4000', fam:'Sucursal mediana (35–75 Mbps)',          fwd:75,   ipsec:75,  sdwan:75,   aps:25,   redund:false, lte:false,
   ports:'2 GE WAN + 2 NIM + 1 EHWIC · 4 GB RAM', nim:2, sm:0, optics:['sfp1g'], parts:['MEM-4400-4GU8G','NIM-2GE-CU-SFP','NIM-4G-LTE','PWR-4430-AC']},
  {id:'ISR 4331',         ser:'ISR 4000', fam:'Sucursal mediana (100–300 Mbps)',        fwd:300,  ipsec:200, sdwan:200,  aps:50,   redund:false, lte:false,
   ports:'3 GE WAN + 2 NIM + 1 SM · 4 GB RAM', nim:2, sm:1, optics:['sfp1g'], parts:['MEM-4430-8GU16G','NIM-2GE-CU-SFP','NIM-4G-LTE','SM-X-1T3/E3','PWR-4330-AC']},
  {id:'ISR 4351',         ser:'ISR 4000', fam:'Sucursal grande (200–400 Mbps)',         fwd:400,  ipsec:300, sdwan:300,  aps:100,  redund:false, lte:false,
   ports:'3 GE WAN + 3 NIM + 2 SM · 4 GB RAM', nim:3, sm:2, optics:['sfp1g'], parts:['MEM-4450-16GU32G','NIM-2GE-CU-SFP','NIM-4G-LTE','PWR-4450-AC']},
  {id:'ISR 4431',         ser:'ISR 4000', fam:'Hub regional / Sucursal XL',             fwd:1000, ipsec:500, sdwan:500,  aps:200,  redund:true,  lte:false,
   ports:'4 GE WAN + 4 NIM · redundancia fuente opt.', nim:4, sm:0, optics:['sfp1g','sfp10g'], parts:['MEM-4430-8GU16G','NIM-2GE-CU-SFP','PWR-4430-DC','PWR-4430-AC']},
  {id:'ISR 4451',         ser:'ISR 4000', fam:'Hub / Gateway DC compacto',              fwd:1500, ipsec:700, sdwan:700,  aps:300,  redund:true,  lte:false,
   ports:'4 GE + 4 NIM + 2 SM · fuente DC opt.', nim:4, sm:2, optics:['sfp1g','sfp10g'], parts:['MEM-4450-16GU32G','NIM-2GE-CU-SFP','PWR-4450-DC','PWR-4450-AC']},
  {id:'ISR 4461',         ser:'ISR 4000', fam:'Hub WAN / Concentrador grande',          fwd:2000, ipsec:1500, sdwan:1200, aps:500, redund:true,  lte:false,
   ports:'4 GE + 4x10GE SFP+ + 4 NIM + 2 SM', nim:4, sm:2, optics:['sfp1g','sfp10g'], parts:['MEM-4460-16GU32G','NIM-2GE-CU-SFP','PWR-4460-DC','PWR-4460-AC']},
  // Catalyst 8000
  {id:'Catalyst 8200L',   ser:'Catalyst 8000', fam:'Sucursal SD-WAN compacta',          fwd:800,  ipsec:600, sdwan:600,  aps:50,  redund:false, lte:false,
   ports:'4 GE WAN + 8 GE LAN + 2 SFP · 1 NIM', nim:1, sm:0, optics:['sfp1g'], parts:['DNA-ADVANTAGE','C8200L-NIM-1X']},
  {id:'Catalyst 8200',    ser:'Catalyst 8000', fam:'Sucursal SD-WAN estándar',          fwd:1500, ipsec:1000, sdwan:1000, aps:100, redund:false, lte:false,
   ports:'4 GE WAN + 2 NIM · IOS XE SD-WAN nativo', nim:2, sm:0, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE','C8200-NIM-2G']},
  {id:'Catalyst 8300-1N1S-6T', ser:'Catalyst 8000', fam:'Hub regional SD-WAN',         fwd:5000, ipsec:2500, sdwan:2500, aps:500, redund:true,  lte:false,
   ports:'6 GE + 2 SFP+ + 1 NIM + 1 SM · mod. fuente', nim:1, sm:1, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE','C8300-NIM-2X']},
  {id:'Catalyst 8300-2N2S-6T', ser:'Catalyst 8000', fam:'Hub regional SD-WAN doble NIM',fwd:10000,ipsec:4000, sdwan:4000, aps:1000,redund:true,  lte:false,
   ports:'6 GE + 2 SFP+ + 2 NIM + 2 SM', nim:2, sm:2, optics:['sfp1g','sfp10g'], parts:['DNA-ADVANTAGE','C8300-NIM-2X']},
  {id:'Catalyst 8500-12X4QC',  ser:'Catalyst 8000', fam:'Hub DC / Edge de alto rendimiento',fwd:20000,ipsec:8000,sdwan:8000,aps:2000,redund:true,lte:false,
   ports:'12x10GE SFP+ + 4x40GE QSFP · modular', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['DNA-ADVANTAGE']},
  // ASR 1000
  {id:'ASR 1001-X',       ser:'ASR 1000', fam:'WAN Edge compacto (2.5–20 Gbps)',        fwd:20000, ipsec:5000, sdwan:5000, aps:0, redund:true, lte:false,
   ports:'6 GE integrados + 2 SFP+ · ESP escal.', nim:0, sm:0, optics:['sfp1g','sfp10g'], parts:['ASR1001X-10G-HA-BUN']},
  {id:'ASR 1002-HX',      ser:'ASR 1000', fam:'WAN Edge / DC gateway (35 Gbps)',        fwd:35000, ipsec:10000,sdwan:10000,aps:0, redund:true, lte:false,
   ports:'8 GE + 4x10GE SFP+ + 2x100GE QSFP28', nim:0, sm:0, optics:['sfp1g','sfp10g','qsfp100g'], parts:['ASR1002HX-HA-BUN']},
  {id:'ASR 1006-X',       ser:'ASR 1000', fam:'Core WAN modular (100 Gbps)',            fwd:100000,ipsec:20000,sdwan:20000,aps:0, redund:true, lte:false,
   ports:'6 slots SPA · hasta 100GE · modular', nim:0, sm:0, optics:['sfp10g','qsfp40g','qsfp100g'], parts:['ASR1006X-HA-BUN']},
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
  'C8200L-NIM-1X':'C8200L-NIM-1X — slot NIM adicional para Catalyst 8200L',
  'C8200-NIM-2G':'C8200-NIM-2G — módulo NIM 2G para Catalyst 8200',
  'C8300-NIM-2X':'C8300-NIM-2X — módulo NIM 2x10GE para Catalyst 8300',
  'DNA-ADVANTAGE':'Licencia Cisco DNA Advantage — SD-WAN, seguridad, analítica avanzada, ThousandEyes integrado',
  'MEM-4400-4GU8G':'Upgrade de RAM 4 → 8 GB para ISR 4221',
  'MEM-4430-8GU16G':'Upgrade de RAM 8 → 16 GB para ISR 4331/4431',
  'MEM-4450-16GU32G':'Upgrade de RAM 16 → 32 GB para ISR 4351/4451',
  'MEM-4460-16GU32G':'Upgrade de RAM 16 → 32 GB para ISR 4461',
  'PWR-4430-AC':'Fuente AC de respaldo para ISR 4331/4431 — redundancia 1+1',
  'PWR-4430-DC':'Fuente DC para ISR 4431 — instalaciones con rack de telecomunicaciones',
  'PWR-4450-AC':'Fuente AC de respaldo para ISR 4351/4451',
  'PWR-4450-DC':'Fuente DC para ISR 4451',
  'PWR-4460-AC':'Fuente AC para ISR 4461',
  'PWR-4460-DC':'Fuente DC para ISR 4461',
  'ASR1001X-10G-HA-BUN':'Bundle HA para ASR 1001-X: ESP10G, RP2, 10G AIM, licencia SEC',
  'ASR1002HX-HA-BUN':'Bundle HA para ASR 1002-HX: 2x ESP200, 2x RP3, licencia AES',
  'ASR1006X-HA-BUN':'Bundle HA para ASR 1006-X: chasis, 2x ESP200, 2x RP3, licencia AES',
};

const SMARTNET = {
  low: {n:'SMARTnet 8x5xNBD',   sla:'8x5xNBD', d:'Soporte técnico 8x5, reemplazo de hardware al siguiente día hábil. Para equipos sin horario crítico.'},
  med: {n:'SMARTnet 8x5x4',     sla:'8x5x4H',  d:'Soporte 8x5 con respuesta 4 horas. Para sucursales productivas con ventana de mantenimiento nocturna.'},
  high:{n:'SMARTnet 24x7x4',    sla:'24x7x4H', d:'Soporte 24x7 con respuesta 4 horas. Para hubs, DC edge y sitios críticos sin tolerancia a caída.'},
};

const DNA_DESC = {
  ess:  'DNA Essentials — licenciamiento básico: SD-WAN, QoS, administración centralizada',
  adv:  'DNA Advantage — SD-WAN avanzado: AppFlow, SLA, ThousandEyes, Zero Trust Network Access',
  pre:  'DNA Premier — todo lo anterior + Umbrella SIG, Secure Endpoint, Duo MFA integrado',
};

module.exports = { MODELS, OPTICS, OPTIC_LABEL, PARTS_DESC, SMARTNET, DNA_DESC };
