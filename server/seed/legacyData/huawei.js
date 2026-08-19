// Copiado tal cual de dimensionador-bom-huawei-v3_1.html (lineas 302-457)
const OPTICS = {
  ge:[
    {sku:'eSFP-GE-SX-MM850', bom:['02313URD','02315204'], d:'1000BASE-SX · 850 nm · multimodo · LC · hasta 550 m'},
    {sku:'SFP-GE-LX-SM1310', bom:['02313URF','02315200'], d:'1000BASE-LX · 1310 nm · monomodo · LC · 10 km'},
    {sku:'SFP-1000BaseT', bom:['02314171','02313URG'], d:'1000BASE-T · cobre · RJ45 · 100 m'},
    {sku:'SFP-GE-SX-C', bom:['02314KKF'], d:'GE multimodo, rango de temperatura comercial'},
    {sku:'SFP-GE-LX-SM1310-BIDI', bom:['02314KKJ'], d:'GE bidireccional sobre una fibra · Tx 1310 / Rx 1490'},
    {sku:'SFP-GE-LX-SM1490-BIDI', bom:['02314KKH'], d:'GE bidireccional sobre una fibra · Tx 1490 / Rx 1310'},
    {sku:'S-SFP-GE-LH40-SM1310', bom:[], d:'GE monomodo de largo alcance · 40 km'},
    {sku:'S-SFP-GE-LH80-SM1550', bom:[], d:'GE monomodo de largo alcance · 80 km'},
    {sku:'eSFP-GE-ZX100-SM1550', bom:[], d:'GE monomodo · 1550 nm · 100 km'}
  ],
  sfp10:[
    {sku:'OMXD30000', bom:['02318169','02313URC'], d:'10GE SFP+ · 850 nm · multimodo · LC · 0.3 km (SR)'},
    {sku:'OSX010000', bom:['02318170','02313URK'], d:'10GE SFP+ · 1310 nm · monomodo · LC · 10 km (LR)'},
    {sku:'SFP-10G-LR', bom:['02310QDJ','02313URL'], d:'10GBASE-LR · 1310 nm · monomodo · 10 km'},
    {sku:'OSX040N01', bom:['02310CNF'], d:'10GE SFP+ · monomodo de alcance extendido · 40 km (ER)'},
    {sku:'SFP-10G-USR', bom:['02310MNW','02313URN'], d:'10GE SFP+ · multimodo de alcance ultracorto · 100 m'},
    {sku:'OSXD22N00', bom:[], d:'10GE SFP+ monomodo'},
    {sku:'SFP-10G-ZR', bom:[], d:'10GE SFP+ · 1550 nm · 80 km'},
    {sku:'SFP-10G-BXD1 / SFP-10G-BXU1', bom:[], d:'10GE bidireccional sobre una fibra · se piden en pareja'}
  ],
  sfp25:[
    {sku:'SFP28-25G-SR', bom:[], d:'25GE SFP28 · 850 nm · multimodo · 100 m'},
    {sku:'SFP28-25G-LR', bom:[], d:'25GE SFP28 · 1310 nm · monomodo · 10 km'},
    {sku:'SFP-25G-CU (DAC)', bom:[], d:'Cable de cobre de conexión directa 25G para tramos cortos en rack'}
  ],
  qsfp100:[
    {sku:'QSFP28-100G-SR4', bom:['02311GBW','02313URQ'], d:'100GBASE-SR4 · 850 nm · multimodo · MPO/MTP-12 · 100 m OM4'},
    {sku:'QSFP28-100G-LR4', bom:['02311KNU','02313URT'], d:'100GBASE-LR4 · monomodo · LC · 10 km'},
    {sku:'QSFP-100G-ER4', bom:['02313HLU','02314HES'], d:'100GBASE-ER4 · monomodo de alcance extendido · 40 km'},
    {sku:'QSFP-100G-LR1', bom:['02314LBY'], d:'100G de portadora única · monomodo · LC'},
    {sku:'QSFP-100G-SWDM4', bom:['02314LCB'], d:'100G multimodo con multiplexación de onda corta · LC'},
    {sku:'QSFP-100G-LX4-MM', bom:['02314DBX'], d:'100G multimodo LX4 · LC'},
    {sku:'QSFP28-100G-PSM4 / CWDM4', bom:[], d:'Variantes monomodo de alcance medio, 500 m a 2 km'}
  ],
  qsfpdd400:[
    {sku:'QSFP-DD-400G-SR8', bom:[], d:'400GE · multimodo · MPO-16 · corto alcance'},
    {sku:'QSFP-DD-400G-DR4', bom:[], d:'400GE · monomodo · 500 m'},
    {sku:'QSFP-DD-400G-FR4 / LR4', bom:[], d:'400GE · monomodo · 2 km a 10 km'}
  ]
};

const OPTIC_LABEL = {ge:'GE — SFP / eSFP', sfp10:'10GE — SFP+', sfp25:'25GE — SFP28', qsfp100:'100GE — QSFP28', qsfpdd400:'400GE — QSFP-DD'};

const PARTS = {
  PAC350:{sku:'PAC350S12-CR', bom:null, d:'Fuente AC-DC 350 W · 90–290 V · salida 12 V / 29.2 A · rango –25 a 55 °C'},
  PAC180:{sku:'PAC180S12-CN', bom:null, d:'Fuente AC 180 W'},
  PAC1000:{sku:'PAC1000S56-EB', bom:null, d:'Fuente AC y 240 V DC de 1000 W · chasis 66 mm · flujo trasero-frontal'},
  PAC600:{sku:'PAC600S56-EB', bom:null, d:'Fuente AC y 240 V DC de 600 W · chasis 66 mm · flujo trasero-frontal'},
  PDC1000:{sku:'PDC1000S56-EB', bom:null, d:'Fuente DC PoE de 1000 W · chasis 66 mm · flujo trasero-frontal'},
  FAN240:{sku:'FAN-240SN-B', bom:null, d:'Módulo de ventilación de una capa con tres ventiladores'},
  MPU100:{sku:'MPU-100', bom:null, d:'Unidad de procesamiento principal del AR8700 · en pareja para redundancia'},
  MPU100T:{sku:'MPU-100-T', bom:null, d:'MPU del AR8700 con módulo de plataforma confiable (TPM)'},
  WSIC4GE:{sku:'AR6000-WSIC-4GE-C-V2', bom:null, d:'Tarjeta WAN de 4 puertos GE combo · ocupa 1 slot WSIC'},
  WSIC8GE:{sku:'WSIC-8GE-T-V2', bom:null, d:'Tarjeta WAN de 8 puertos GE eléctricos · ocupa 1 slot WSIC'},
  SICNR:{sku:'AR6000-SIC-NR-102-V2', bom:null, d:'Tarjeta 5G NR / LTE / WCDMA · ocupa 2 slots SIC'},
  RU5G:{sku:'RU-5G-101', bom:null, d:'Unidad remota 5G externa · conecta al AR por Ethernet, permite ubicar la antena donde hay cobertura'},
  RACK:{sku:'Kit de montaje en rack 19"', bom:null, d:'Orejas y guías. Verifica profundidad del gabinete: la serie M del NE8000 son 220 mm.'},
  CONSOLE:{sku:'Cable de consola RJ45–DB9/USB', bom:null, d:'Para puesta en marcha inicial antes del aprovisionamiento por ZTP'}
};

// Actualizado con datasheets oficiales de Huawei — Fase 2 verificación (Ago 2026)
const MODELS = [
{id:'AR611', cls:'AR', ser:'AR610', fam:'SOHO / oficina pequeña', fwd:300, ipsec:200, typ:null, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:0, apsMax:0, boost:0,
 ports:'1 x GE combo WAN, 8 x GE LAN', optics:['ge'], parts:['RACK','CONSOLE']},
{id:'AR617VW-LTE4', cls:'AR', ser:'AR610', fam:'Sucursal pequeña con respaldo móvil', fwd:300, ipsec:200, typ:null, mpps:null, lan:8, poe:0, wan:1, wifi:1, apsFree:0, apsMax:0, boost:0,
 ports:'1 x GE combo + VDSL 35B + LTE, Wi-Fi', optics:['ge'], parts:['RACK','CONSOLE']},
{id:'AR651', cls:'AR', ser:'AR650', fam:'Sucursal pequeña', fwd:2000, ipsec:2000, typ:null, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:0, apsMax:0, boost:1000,
 ports:'2 x GE combo WAN, 8 x GE LAN', optics:['ge'], parts:['RACK','CONSOLE']},
{id:'AR651W-8P', cls:'AR', ser:'AR650', fam:'Sucursal pequeña con PoE y Wi-Fi', fwd:2000, ipsec:2000, typ:null, mpps:null, lan:8, poe:1, wan:0, wifi:1, apsFree:0, apsMax:0, boost:1000,
 ports:'2 x GE combo WAN, 8 x GE LAN PoE, Wi-Fi', optics:['ge'], parts:['RACK','CONSOLE']},
{id:'AR5710-S8T2S', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana, uplink GE óptico', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x GE SFP WAN, 8 x GE eléctricos LAN', optics:['ge'], parts:['RACK','CONSOLE','RU5G']},
{id:'AR5710-S8T2X', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x 10GE SFP+/2.5GE combo WAN, 4 x GE + 4 x GE combo LAN', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G']},
{id:'AR5710-S8P2X', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana con PoE++', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:1, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x 10GE SFP+ WAN, 8 x GE LAN · PoE++ 130 W total', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G']},
{id:'AR5710-S8T2X-LTE4EA', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana con LTE', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:1, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x 10GE SFP+ WAN, LTE4EA con 2 SIM activo/standby', optics:['sfp10','ge'], parts:['RACK','CONSOLE']},
{id:'AR5710-S10T1X2', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana con slots SIC', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'1 x 10GE SFP+ combo + 2 x GE WAN, 4 x GE + 4 x GE combo LAN, 2 x SIC', optics:['sfp10','ge'], parts:['SICNR','RACK','CONSOLE']},
{id:'AR5710-S8T2XE', cls:'AR', ser:'AR5710-SE', fam:'Sucursal mediana reforzada', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+/2.5GE combo WAN, 8 x GE LAN · 4 GB RAM', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G']},
{id:'AR5710-S8T2XE-NRGL', cls:'AR', ser:'AR5710-SE', fam:'Sucursal con 5G integrado', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:0, wan:1, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, 5G SA/NSA con 2 SIM activo/standby', optics:['sfp10','ge'], parts:['RACK','CONSOLE']},
{id:'AR5710-S8T1XWE-NRGL', cls:'AR', ser:'AR5710-SE', fam:'Todo en uno: Wi-Fi 7 y 5G', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:0, wan:1, wifi:1, apsFree:16, apsMax:64, boost:0,
 ports:'1 x 10GE SFP+ WAN, 5G, Wi-Fi 7 doble banda, hasta 256 usuarios', optics:['sfp10','ge'], parts:['RACK','CONSOLE']},
{id:'AR5710-S8P2XE-NRGL', cls:'AR', ser:'AR5710-SE', fam:'Sucursal con PoE++ y 5G', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:1, wan:1, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, 8 x GE LAN (4 PoE++), 5G SA/NSA', optics:['sfp10','ge'], parts:['RACK','CONSOLE']},
{id:'AR5710-S28T2S2XE4', cls:'AR', ser:'AR5710-SE', fam:'Sucursal grande, 24 puertos', fwd:1500, ipsec:800, typ:720, mpps:null, lan:24, poe:0, wan:0, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ + 2 x GE óptico + 4 x GE WAN, 24 x GE LAN, 4 x SIC', optics:['sfp10','ge'], parts:['SICNR','RACK','CONSOLE']},
{id:'AR5710-S52T2XE4', cls:'AR', ser:'AR5710-SE', fam:'Sucursal grande, 48 puertos', fwd:1500, ipsec:800, typ:720, mpps:null, lan:48, poe:0, wan:0, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ + 4 x GE WAN, 48 x GE LAN, 4 x SIC', optics:['sfp10','ge'], parts:['SICNR','RACK','CONSOLE']},
{id:'AR6710-L8T3TS1X2', cls:'AR', ser:'AR6700-L', fam:'Campus pequeño', fwd:2000, ipsec:1600, typ:1200, mpps:null, lan:9, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'1 x 10GE óptico + 2 x GE combo WAN, 1 x GE combo + 8 x GE LAN, 2 x SIC, 0/1 WSIC', optics:['sfp10','ge'], parts:['PAC180','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE']},
{id:'AR6710-L26T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano, 24 puertos', fwd:2000, ipsec:1600, typ:1200, mpps:null, lan:24, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 24 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE']},
{id:'AR6710-L50T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano, 48 puertos', fwd:2000, ipsec:1600, typ:1200, mpps:null, lan:48, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 48 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE']},
{id:'AR6710-L14T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano de alto caudal', fwd:4000, ipsec:2500, typ:1800, mpps:null, lan:12, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 4 x GE combo + 8 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE']},
{id:'AR6710-H4T4X2Y7', cls:'AR', ser:'AR6700-H', fam:'Casa matriz / campus grande', fwd:13000, ipsec:10000, typ:7000, mpps:null, lan:0, poe:0, wan:0, wifi:0, apsFree:32, apsMax:512, boost:0,
 ports:'2 x 25GE SFP28 + 4 x 10GE SFP+ + 4 x GE · 6 x SIC, 1/4 WSIC · reemplaza AR6280/AR6300', optics:['sfp25','sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE']},
{id:'AR8140-12G10XG', cls:'AR', ser:'AR8000', fam:'Hub SD-WAN / borde de campus grande', fwd:25000, ipsec:20000, typ:12000, mpps:null, lan:0, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'10 x 10GE óptico + 8 x GE combo + 4 x GE · 4 x SIC, 0/2 WSIC · doble fuente 350 W', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE']},
{id:'AR8140-T-12G10XG', cls:'AR', ser:'AR8000', fam:'Hub SD-WAN con TPM', fwd:25000, ipsec:20000, typ:12000, mpps:null, lan:0, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'Igual al AR8140 más módulo de plataforma confiable (TPM)', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE']},
{id:'AR8700-8', cls:'AR', ser:'AR8700', fam:'Hub SD-WAN de alta disponibilidad', fwd:30000, ipsec:20000, typ:24000, mpps:null, lan:0, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'Doble MPU, sin interrupción de servicio en conmutación · 24 Gbps SD-WAN IPsec IMIX', optics:['sfp25','sfp10','ge'], parts:['MPU100','MPU100T','PAC1000','PAC600','PDC1000','FAN240','RACK','CONSOLE']},

{id:'NetEngine A816 E', cls:'WAN', ser:'A800 E', fam:'CPE de acceso, 1U, consumo mínimo', cap:20000, mpps:4.4, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 24 W típicos · SRv6, L2VPN/L3VPN, EVPN, IFIT · fuente AC 120 W integrada', optics:['ge','sfp10'], parts:['RACK','CONSOLE']},
{id:'NetEngine A813 E', cls:'WAN', ser:'A800 E', fam:'CPE de acceso multiservicio, 1U', cap:20000, mpps:4.4, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 32.7 W típicos · slicing, SRv6, IFIT · fuente AC 120 W integrada, adaptador DC opcional', optics:['ge','sfp10'], parts:['RACK','CONSOLE']},
{id:'NetEngine A822 E', cls:'WAN', ser:'A800 E', fam:'CPE de acceso de mayor densidad, 1U', cap:20000, mpps:4.4, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 33.2 W típicos · 32 G/U · SRv6, EVPN · fuente AC 120 W integrada', optics:['ge','sfp10'], parts:['RACK','CONSOLE']},
{id:'NetEngine A821 E', cls:'WAN', ser:'A800 E', fam:'Acceso 10GE con slicing FlexE, 1U', cap:72000, mpps:108, lan:0, poe:0, wan:0, wifi:0,
 ports:'2 x 10GE/GE + 8 x GE óptico + 8 x GE eléctrico · FlexE con granularidad Mbps · 70 W típicos', optics:['sfp10','ge'], parts:['RACK','CONSOLE']},

{id:'NE8000 M6', cls:'WAN', ser:'NE8000 M', fam:'Agregación compacta, 2U', cap:320000, mpps:72, lan:0, poe:0, wan:0, wifi:0,
 ports:'2U · 6 tarjetas DC / 4 AC de 50 G · MPU 1:1 · fuentes 1+1 · 205.8 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE']},
{id:'NE8000 M1C', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de configuración fija, 1U', cap:344000, mpps:78, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · sin tarjetas flexibles · fuentes 1+1 · 89 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE']},
{id:'NE8000 M1A', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de configuración fija, 1U', cap:176000, mpps:72, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · sin tarjetas flexibles · fuentes DC 1+1 · 74.8 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE']},
{id:'NE8000 M1D-B', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de configuración fija, 1U', cap:368000, mpps:72, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · sin tarjetas flexibles · fuentes 1+1 · 107.2 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE']},
{id:'NE8000 M1D', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de alta densidad, 1U', cap:1760000, mpps:398, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 880 G/U · fuentes 1+1 · 124.5 W típicos', optics:['qsfp100','sfp25','sfp10'], parts:['RACK','CONSOLE']},
{id:'NE8000 M4', cls:'WAN', ser:'NE8000 M', fam:'Agregación, 2U, 4 tarjetas', cap:2400000, mpps:405, lan:0, poe:0, wan:0, wifi:0,
 ports:'2U · 4 tarjetas de 400 G · MPU simple · fuentes 1+1 · 283.4 W típicos', optics:['qsfp100','sfp25','sfp10','ge'], parts:['RACK','CONSOLE']},
{id:'NE8000 F1A', cls:'WAN', ser:'NE8000 F', fam:'Agregación fija de alta densidad, 1U', cap:2400000, mpps:453, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 1200 G/U, la mayor densidad por unidad de rack · fuentes 1+1 · 325 W típicos', optics:['qsfp100','sfp25','sfp10'], parts:['RACK','CONSOLE']},
{id:'NE8000 M8', cls:'WAN', ser:'NE8000 M', fam:'Agregación, 3U, hasta 8 tarjetas', cap:2400000, mpps:453, lan:0, poe:0, wan:0, wifi:0,
 ports:'3U · 8 tarjetas DC / 6 AC de 400 G · MPU y SFU 1:1 · 774.3 W típicos', optics:['qsfp100','sfp25','sfp10','ge'], parts:['RACK','CONSOLE']},
{id:'NE8000 M14', cls:'WAN', ser:'NE8000 M', fam:'Agregación grande, 5U, 14 tarjetas', cap:2000000, mpps:1117, lan:0, poe:0, wan:0, wifi:0,
 ports:'5U · 14 tarjetas DC de 400 G · MPU y SFU 1:1 · fuentes 1+1 · 865.8 W típicos', optics:['qsfp100','sfp25','sfp10','ge'], parts:['RACK','CONSOLE']},
{id:'NE8000 F8', cls:'WAN', ser:'NE8000 F', fam:'Núcleo compacto, 13U', cap:6400000, mpps:2035, lan:0, poe:0, wan:0, wifi:0,
 ports:'13U · 8 tarjetas de 800 G · MPU y SFU 1:1 · hasta 5+1 DC o 3+3 AC · 2370 W típicos', optics:['qsfpdd400','qsfp100','sfp25','sfp10'], parts:['RACK','CONSOLE']},
{id:'NE8000 X4', cls:'WAN', ser:'NE8000 X', fam:'Núcleo WAN / DCI, 9.8U', cap:173150000, mpps:24424, lan:0, poe:0, wan:0, wifi:0,
 ports:'4 tarjetas de hasta 19.2 T · SFU 7+1 · MPU 1:1 · hasta 6 fuentes N+1 · 5913 W típicos', optics:['qsfpdd400','qsfp100'], parts:['RACK','CONSOLE']},
{id:'NE8000 X8', cls:'WAN', ser:'NE8000 X', fam:'Núcleo WAN / DCI, 15.8U', cap:346300000, mpps:48848, lan:0, poe:0, wan:0, wifi:0,
 ports:'8 tarjetas de hasta 19.2 T · SFU 7+1 · MPU 1:1 · hasta 10 fuentes N+1 · 11 017 W típicos', optics:['qsfpdd400','qsfp100'], parts:['RACK','CONSOLE']},
{id:'NE8000 X16', cls:'WAN', ser:'NE8000 X', fam:'Núcleo WAN de máxima capacidad, 32.3U', cap:692600000, mpps:97280, lan:0, poe:0, wan:0, wifi:0,
 ports:'16 tarjetas de 14.4 T · hasta 42 x 400GE o 72 x 100GE · 20 fuentes N+1 · 24 015 W típicos', optics:['qsfpdd400','qsfp100'], parts:['RACK','CONSOLE']}
];

const HICARE = {
  essential:{n:'Hi-Care Essential', sla:'9x5x10BD-Ship', d:'Soporte técnico y online 24x7, envío de repuesto en 10 días hábiles. Para equipos con redundancia o repuesto propio en almacén.'},
  basic:{n:'Hi-Care Basic', sla:'9x5xNBD-Ship', d:'Soporte técnico y online 24x7, repuesto despachado al siguiente día hábil.'},
  standard:{n:'Hi-Care Standard', sla:'9x5xNBD', d:'Soporte 24x7 y repuesto entregado al siguiente día hábil, no solo despachado. El estándar para sedes productivas.'},
  premier:{n:'Hi-Care Premier', sla:'24x7x4H', d:'Soporte 24x7 y repuesto en sitio dentro de 4 horas. Para operación continua sin ruta alterna.'},
  onsiteStd:{n:'Hi-Care Onsite Standard', sla:'9x5xNBD + ingeniero 9x5', d:'Añade especialista de campo en horario laboral al reemplazo del siguiente día hábil.'},
  onsitePre:{n:'Hi-Care Onsite Premier', sla:'24x7x4H + ingeniero 24x7', d:'Repuesto en 4 horas e ingeniero en sitio 24x7. El nivel para hubs, núcleo y salida de datacenter.'}
};

module.exports = { OPTICS, OPTIC_LABEL, PARTS, MODELS, HICARE };
