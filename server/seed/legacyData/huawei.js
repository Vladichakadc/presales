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
  PAC1000:{sku:'PAC1000S56-EB', bom:null, d:'Fuente AC y 240 V DC de 1000 W · chasis 66 mm · flujo trasero-frontal'},
  PAC600:{sku:'PAC600S56-EB', bom:null, d:'Fuente AC y 240 V DC de 600 W · chasis 66 mm · flujo trasero-frontal'},
  PDC1000:{sku:'PDC1000S56-EB', bom:null, d:'Fuente DC PoE de 1000 W · chasis 66 mm · flujo trasero-frontal'},
  FAN240:{sku:'FAN-240SN-B', bom:null, d:'Módulo de ventilación de una capa con tres ventiladores'},
  MPU100:{sku:'MPU-100', bom:null, d:'Unidad de procesamiento principal del AR8700 · en pareja para redundancia'},
  MPU100T:{sku:'MPU-100-T', bom:null, d:'MPU del AR8700 con módulo de plataforma confiable (TPM)'},
  SPU700H:{sku:'SPU-700H', bom:null, d:'Unidad de servicio del AR8700 (Service Process Unit) · 1 x 40GE QSFP+, 8 x 10GE SFP+, 8 x GE combo'},
  SRU700S:{sku:'SRU-700S', bom:null, d:'Placa de servicio y enrutamiento del AR6710-H (Service and Router Unit) · 2 x 25GE SFP28, 4 x 10GE SFP+, 4 x GE RJ45, 1 x USB 3.0'},
  PSU6710H:{sku:'Fuente del AR6710-H (código por confirmar)', bom:null, d:'Extraíble en caliente. La ficha AR6710-H R25C10 publica 300 W de salida en AC y 260 W en DC, no el código de pedido'},
  WSIC4GE:{sku:'AR6000-WSIC-4GE-C-V2', bom:null, d:'Tarjeta WAN de 4 puertos GE combo · ocupa 1 slot WSIC'},
  WSIC8GE:{sku:'WSIC-8GE-T-V2', bom:null, d:'Tarjeta WAN de 8 puertos GE eléctricos · ocupa 1 slot WSIC'},
  SICNR:{sku:'AR6000-SIC-NR-102-V2', bom:null, d:'Tarjeta 5G NR / LTE / WCDMA · ocupa 2 slots SIC'},
  RU5G:{sku:'RU-5G-101', bom:null, d:'Unidad remota 5G externa · conecta al AR por Ethernet, permite ubicar la antena donde hay cobertura'},
  RACK:{sku:'Kit de montaje en rack 19"', bom:null, d:'Orejas y guías. Verifica profundidad del gabinete: la serie M del NE8000 son 220 mm.'},
  CONSOLE:{sku:'Cable de consola RJ45–DB9/USB', bom:null, d:'Para puesta en marcha inicial antes del aprovisionamiento por ZTP'}
};

// Actualizado con datasheets oficiales de Huawei — Fase 2 verificación (Ago 2026)
// `flexe: true` solo donde el propio registro ya lo publica («FlexE con granularidad Mbps» en el
// A821 E); en el resto queda sin declarar, que es «no consta» y no «no lo soporta» (2026-09-30).
//
// CONTRASTE CON LAS FICHAS DE SERIE DE LA LINEA AR (2026-10-05). Cinco fichas oficiales
// (AR610 R26C00, AR650 20250810-v3, AR5710-S, AR6710-H y AR8000 R25C10), traidas por Actions y
// leidas con PDF4me y con pdf-parse; la procedencia de cada una, en `fuentes.js`. Entraron por
// `npm run huawei`, anclando cada fila en el reenvio y el IPsec, que casaron en las 23 filas AR.
//   · `typ` es la fila «SD-WAN typical performance (IMIX)»: IPsec + QoS + SA + AppFlow, la suma de
//     los dos sentidos. No es «SD-WAN IPsec performance» (solo IPsec) ni «SD-WAN performance».
//   · AR8700-8: llevaba 24 Gbps, que es la fila «SD-WAN IPsec» de su propia tabla; su SD-WAN
//     tipico es 15,5. El dimensionador lo recomendaba entre 16,9 y 20,8 Gbps de demanda (6,5 a
//     8 Gbps por sentido con el margen por defecto), donde su ficha no llega.
//   · AR8140 y AR8140-T: 12 -> 15 Gbps, la cifra de la edicion R25C10.
//   · AR611, AR617VW-LTE4 (50 Mbps), AR651 y AR651W-8P (600 Mbps): `typ` era null y se apartaban
//     del perfil SD-WAN. Con esto los 23 AR tienen las tres cifras.
//   · Ninguna ficha AR publica Mpps: el `mpps: null` de los AR es lo que dice el fabricante.
//   · AR611 y AR617VW-LTE4: `lan` 8 -> 4 (2026-10-06). La ficha AR610 R26C00 publica «Fixed LAN
//     ports: 4 x GE electrical» en los dos, y su tabla de pedido lo repite («1*GE COMBO WAN,
//     4*GE LAN»); la trasera que dibuja tiene cuatro puertos LAN. `lan` es un filtro duro del
//     motor: con 8, el AR611 salia recomendado para un sitio que pide 6 puertos LAN.
//
// ALIMENTACION DE LA A800 E (2026-10-06). Las fichas individuales de los cuatro modelos (A816 E
// V800R024C10, A813 E, A822 E y A821 E V800R025C00; las dos ultimas son presentaciones .pptx)
// publican «Power supply: Single AC, dual AC, single AC+single DC», y este registro decia
// `redund:false` («fija y unica») y `psu.watts:120`, que la ficha rotula «Consumo tipico» en
// equipos de 24 a 70 W. Ahora son `'opcional'` —se pide con una fuente o con dos, segun la
// variante— con el consumo tipico de cada ficha. Esa misma manana se habia corregido con el
// folleto de la serie, de 2022, que daba 35 W a la A822 E: su ficha confirma los 33,2 que ya
// estaban, y manda la mas reciente. Tambien la A821 E: su ficha publica 6 x 10GE + 4 GE/FE
// opticos + 8 electricos, no la composicion del folleto. Los 120 W de fuente integrada se quedan
// en el texto de puertos y la ficha dice que ningun documento los publica.
// LA CAPACIDAD DE LA A800 E NO LA PUBLICA NINGUNA FICHA. Solo el folleto, y mezclando criterios:
// 14 G al A813 E y 32 G al A822 E (la suma de sus puertos en un sentido) frente a 72 G al A821 E
// (los dos sentidos), y al A816 E «64-172 Gbit/s» y «112-246 Mpps» con 4 + 4 puertos GE, que no
// es posible. Se quedan 20 / 20 / 20 / 72 aqui, y queda en PENDIENTES.md.
// NE8000 M1A (2026-10-06): 176 -> 352 Gbps, la capacidad de conmutacion de su ficha; los 176 eran
// la capacidad de puertos que cita su presentacion, el mismo error que ya se corrigio en el M8,
// el F8 y el M14. Su consumo NO se toca: la ficha da 89,21 W, identico al centesimo al del M1C,
// cuya ficha si lo desglosa por configuracion; en el M1A es la plantilla copiada.
// AR6710-L26T2X4 y L50T2X4 (2026-10-06): reenvio 2 -> 3,2 Gbps, de la ficha AR6710-L R26C00, con
// `npm run huawei -- --force` anclado en IPsec y SD-WAN tipico, que casaban.
// ALIMENTACION DE LOS AR (2026-10-06), de sus fichas de serie: `redund` solo donde la ficha dice
// cuantas fuentes trae (una o dos integradas, o «N/A»). «Dual power supplies, hot-swappable» dice
// que admite dos, no que vengan las dos, y marcarlo `true` haria que el BOM pidiera dos fuentes:
// esos modelos (AR6710-L26/L50/L14, AR6710-H, AR8700-8) quedan sin `redund`, con la frase literal
// en `psu.texto`. Los 350 W del AR8140 eran la potencia de cada fuente; su consumo tipico es 168.
// LAS PIEZAS DE PEDIDO DE LOS AR (2026-10-06, noche), de la «Ordering Information» y la fila
// «Maximum output power» de esas mismas fichas. Las guias de hardware de support.huawei.com, que
// darian el codigo de cada modulo, las niega Akamai al acceso automatizado (ver la cabecera de
// traer-cisco-huawei.yml). Cinco correcciones, y ninguna inventa un codigo:
//  - AR8700-8: se pide como «assembly chassis» y la SPU-700H lleva todos sus puertos; el BOM
//    cotizaba un chasis sin puertos. Entra SPU700H, que se pide siempre.
//  - AR6710-H: la placa de control SRU-700S es un paso de pedido aparte («main control board
//    selection»), y no se pedia. Su fuente es de 300 W AC / 260 W DC, no la PAC350 de 350 W; la
//    ficha no publica su codigo, y la linea lo dice (PSU6710H) en vez de citar el de otro equipo.
//  - AR6710-L14T2X4 (150 W, «not hot-swappable») y L8T3TS1X2 (70 W, sin redundancia): sus fuentes
//    no son modulos que se pidan aparte, y el BOM pedia una PAC350 y una PAC180. Ya no piden fuente.
// `test/huawei-motor.test.js` guarda que la potencia de cada fuente pedida sea una de las que
// publica la ficha del equipo; las tres salieron de esa comparacion.
const MODELS = [
{id:'AR611', cls:'AR', ser:'AR610', fam:'SOHO / oficina pequeña', fwd:300, ipsec:200, typ:50, mpps:null, lan:4, poe:0, wan:0, wifi:0, apsFree:0, apsMax:0, boost:0,
 ports:'1 x GE combo WAN, 4 x GE LAN', optics:['ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:8, tipo:'12 V DC por adaptador externo', texto:'Una sola entrada de 12 V DC por adaptador (24 W de salida máxima), como dibuja su vista trasera; 8 W típicos (ficha AR610 R26C00).'}},
{id:'AR617VW-LTE4', cls:'AR', ser:'AR610', fam:'Sucursal pequeña con respaldo móvil', fwd:300, ipsec:200, typ:50, mpps:null, lan:4, poe:0, wan:1, wifi:1, apsFree:0, apsMax:0, boost:0,
 ports:'1 x GE combo + VDSL2 + LTE, 4 x GE LAN, 2 x FXS, Wi-Fi', optics:['ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:13.6, tipo:'12 V DC por adaptador externo', texto:'Una sola entrada de 12 V DC por adaptador (24 W de salida máxima), como dibuja su vista trasera; 13,6 W típicos (ficha AR610 R26C00, columna común con el AR617VW-LTE4EA).'}},
{id:'AR651', cls:'AR', ser:'AR650', fam:'Sucursal pequeña', fwd:2000, ipsec:2000, typ:600, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:0, apsMax:0, boost:1000,
 ports:'2 x GE combo WAN, 8 x GE LAN', optics:['ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:25.2, tipo:'12 V DC por adaptador externo', texto:'Una sola entrada de 12 V DC por adaptador (36 W de salida máxima); 25,2 W típicos (ficha AR650 20250810-v3).'}},
{id:'AR651W-8P', cls:'AR', ser:'AR650', fam:'Sucursal pequeña con PoE y Wi-Fi', fwd:2000, ipsec:2000, typ:600, mpps:null, lan:8, poe:1, wan:0, wifi:1, apsFree:0, apsMax:0, boost:1000,
 ports:'2 x GE combo WAN, 8 x GE LAN PoE, Wi-Fi', optics:['ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:40, tipo:'12 V DC y 48 V DC para el PoE, por adaptadores externos', texto:'Dos entradas que NO son redundantes: la de 12 V alimenta el equipo y la de 48 V el PoE («12 V adapter» y «48 V adapter», 60 y 100 W de salida). 40 W típicos con el de 12 V; la ficha no da el típico con el de 48 V (ficha AR650 20250810-v3).'}},
{id:'AR5710-S8T2S', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana, uplink GE óptico', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x GE SFP WAN, 8 x GE eléctricos LAN', optics:['ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:14.6, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 14,6 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S8T2X', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x 10GE SFP+/2.5GE combo WAN, 4 x GE + 4 x GE combo LAN', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:12, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 12 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S8P2X', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana con PoE++', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:1, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x 10GE SFP+ WAN, 8 x GE LAN · PoE++ 130 W total', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:157, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 157 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S8T2X-LTE4EA', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana con LTE', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:1, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'2 x 10GE SFP+ WAN, LTE4EA con 2 SIM activo/standby', optics:['sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:14, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 14 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S10T1X2', cls:'AR', ser:'AR5710-S', fam:'Sucursal mediana con slots SIC', fwd:1300, ipsec:800, typ:620, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:32, boost:0,
 ports:'1 x 10GE SFP+ combo + 2 x GE WAN, 4 x GE + 4 x GE combo LAN, 2 x SIC', optics:['sfp10','ge'], parts:['SICNR','RACK','CONSOLE'],
 redund:false, psu:{watts:15, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 15 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S8T2XE', cls:'AR', ser:'AR5710-SE', fam:'Sucursal mediana reforzada', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+/2.5GE combo WAN, 8 x GE LAN · 4 GB RAM', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:12, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 12 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S8T2XE-NRGL', cls:'AR', ser:'AR5710-SE', fam:'Sucursal con 5G integrado', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:0, wan:1, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, 5G SA/NSA con 2 SIM activo/standby', optics:['sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:20, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 20 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S8T1XWE-NRGL', cls:'AR', ser:'AR5710-SE', fam:'Todo en uno: Wi-Fi 7 y 5G', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:0, wan:1, wifi:1, apsFree:16, apsMax:64, boost:0,
 ports:'1 x 10GE SFP+ WAN, 5G, Wi-Fi 7 doble banda, hasta 256 usuarios', optics:['sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:24, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 24 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S8P2XE-NRGL', cls:'AR', ser:'AR5710-SE', fam:'Sucursal con PoE++ y 5G', fwd:1500, ipsec:800, typ:720, mpps:null, lan:8, poe:1, wan:1, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, 8 x GE LAN (4 PoE++), 5G SA/NSA', optics:['sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:false, psu:{watts:25, tipo:'AC integrada', texto:'Una fuente AC integrada («One built-in power module (AC)»); 25 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S28T2S2XE4', cls:'AR', ser:'AR5710-SE', fam:'Sucursal grande, 24 puertos', fwd:1500, ipsec:800, typ:720, mpps:null, lan:24, poe:0, wan:0, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ + 2 x GE óptico + 4 x GE WAN, 24 x GE LAN, 4 x SIC', optics:['sfp10','ge'], parts:['SICNR','RACK','CONSOLE'],
 redund:true, psu:{watts:29, tipo:'AC integrada, doble', texto:'Dos fuentes AC integradas («Built-in dual power modules (AC)»); 29 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR5710-S52T2XE4', cls:'AR', ser:'AR5710-SE', fam:'Sucursal grande, 48 puertos', fwd:1500, ipsec:800, typ:720, mpps:null, lan:48, poe:0, wan:0, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ + 4 x GE WAN, 48 x GE LAN, 4 x SIC', optics:['sfp10','ge'], parts:['SICNR','RACK','CONSOLE'],
 redund:true, psu:{watts:53, tipo:'AC integrada, doble', texto:'Dos fuentes AC integradas («Built-in dual power modules (AC)»); 53 W típicos (ficha AR5710-S R25C10).'}},
{id:'AR6710-L8T3TS1X2', cls:'AR', ser:'AR6700-L', fam:'Campus pequeño', fwd:2000, ipsec:1600, typ:1200, mpps:null, lan:9, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'1 x 10GE óptico + 2 x GE combo WAN, 1 x GE combo + 8 x GE LAN, 2 x SIC, 0/1 WSIC', optics:['sfp10','ge'], parts:['WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 redund:false, psu:{watts:27, tipo:'AC integrada', texto:'Sin redundancia de fuente («Power supply redundancy: N/A»), 70 W de salida máxima en AC; 27 W típicos (ficha AR6710-L R26C00). El BOM no pide fuente: la PAC180S12-CN que listaba el catálogo es de 180 W.'}},
{id:'AR6710-L26T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano, 24 puertos', fwd:3200, ipsec:1600, typ:1200, mpps:null, lan:24, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 24 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 psu:{watts:68, tipo:'AC o DC', texto:'«Dual power supplies, hot-swappable» (350 W AC / 240 W DC de salida): admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. 68 W típicos (ficha AR6710-L R26C00).'}},
{id:'AR6710-L50T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano, 48 puertos', fwd:3200, ipsec:1600, typ:1200, mpps:null, lan:48, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 48 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 psu:{watts:83, tipo:'AC o DC', texto:'«Dual power supplies, hot-swappable» (350 W AC / 240 W DC de salida): admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. 83 W típicos (ficha AR6710-L R26C00).'}},
{id:'AR6710-L14T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano de alto caudal', fwd:4000, ipsec:2500, typ:1800, mpps:null, lan:12, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 4 x GE combo + 8 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 psu:{watts:41, tipo:'AC', texto:'«Dual power supplies, not hot-swappable», 150 W de salida máxima en AC; 41 W típicos (ficha AR6710-L R26C00). El BOM no pide fuente: la PAC350S12-CR que listaba el catálogo es un módulo de 350 W extraíble en caliente, y la ficha publica 150 W y fuentes que no lo son. No se marca la redundancia: la ficha no dice si las dos vienen montadas.'}},
{id:'AR6710-H4T4X2Y7', cls:'AR', ser:'AR6700-H', fam:'Casa matriz / campus grande', fwd:13000, ipsec:10000, typ:7000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:512, boost:0,
 ports:'2 x 25GE SFP28 + 4 x 10GE SFP+ + 4 x GE · 6 x SIC, 1/4 WSIC · reemplaza AR6280/AR6300', optics:['sfp25','sfp10','ge'], parts:['SRU700S','PSU6710H','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 psu:{watts:83, tipo:'AC o DC', texto:'«Dual power supplies, hot-swappable» (300 W AC / 260 W DC de salida): admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. 83 W típicos con una SRU y 145 W con dos (ficha AR6710-H R25C10). La PAC350S12-CR que listaba el catálogo es de 350 W y no es la suya; el código de su fuente de 300 W no lo publica la ficha.'}},
{id:'AR8140-12G10XG', cls:'AR', ser:'AR8000', fam:'Hub SD-WAN / borde de campus grande', fwd:25000, ipsec:20000, typ:15000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'10 x 10GE óptico + 8 x GE combo + 4 x GE · 4 x SIC, 0/2 WSIC · doble fuente 350 W', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 redund:true, psu:{watts:168, tipo:'AC-DC (PAC350S12-CR)', volts:'90–290 V', amps:'salida 12 V / 29,2 A',
  texto:'Doble fuente de 350 W — el catálogo publica dos PAC350S12-CR (90–290 V, salida 12 V / 29.2 A) para el AR8140; la ficha AR8000 R25C10 dice «Dual power supplies, hot-swappable». 168 W típicos: los 350 W eran la potencia de cada fuente, no el consumo.'}},
{id:'AR8140-T-12G10XG', cls:'AR', ser:'AR8000', fam:'Hub SD-WAN con TPM', fwd:25000, ipsec:20000, typ:15000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'Igual al AR8140 más módulo de plataforma confiable (TPM)', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 redund:true, psu:{watts:168, tipo:'AC-DC (PAC350S12-CR)', volts:'90–290 V', amps:'salida 12 V / 29,2 A',
  texto:'Igual al AR8140-12G10XG: doble fuente de 350 W (PAC350S12-CR, 90–290 V, salida 12 V / 29.2 A). 168 W típicos (ficha AR8000 R25C10).'}},
{id:'AR8700-8', cls:'AR', ser:'AR8700', fam:'Hub SD-WAN de alta disponibilidad', fwd:30000, ipsec:20000, typ:15500, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'Doble MPU, sin interrupción de servicio en conmutación · 24 Gbps SD-WAN IPsec IMIX', optics:['sfp25','sfp10','ge'], parts:['SPU700H','MPU100','MPU100T','PAC1000','PAC600','PDC1000','FAN240','RACK','CONSOLE'],
 psu:{watts:221, tipo:'AC, HVDC o DC', texto:'«Dual power supplies, hot-swappable», con módulos de 600 o 1000 W: admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. 221 W típicos con SPU, dos MPU y ventiladores (ficha AR8000 R25C10).'}},

{id:'NetEngine A816 E', cls:'WAN', ser:'A800 E', fam:'CPE de acceso, 1U, consumo mínimo', cap:20000, mpps:4.4, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 24 W típicos · SRv6, L2VPN/L3VPN, EVPN, IFIT · fuente AC 120 W integrada', optics:['ge','sfp10'], parts:['RACK','CONSOLE'],
 redund:'opcional', psu:{watts:24, tipo:'AC; doble AC o AC + DC según la variante', texto:'Se pide en tres variantes: una fuente AC, doble AC o AC + DC (ficha NetEngine A816 E V800R024C10, «Power supply»). 24 W típicos. La fuente AC de 120 W integrada que trae este registro no la publica ninguna ficha.'}},
{id:'NetEngine A813 E', cls:'WAN', ser:'A800 E', fam:'CPE de acceso multiservicio, 1U', cap:20000, mpps:4.4, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 32.7 W típicos · slicing, SRv6, IFIT · fuente AC 120 W integrada, adaptador DC opcional', optics:['ge','sfp10'], parts:['RACK','CONSOLE'],
 redund:'opcional', psu:{watts:32.7, tipo:'AC; doble AC o AC + DC según la variante', texto:'Se pide en tres variantes: una fuente AC, doble AC o AC + DC (ficha NetEngine A813 E V800R025C00, «Power supply»). 32,7 W típicos. La fuente AC de 120 W integrada que trae este registro no la publica ninguna ficha.'}},
{id:'NetEngine A822 E', cls:'WAN', ser:'A800 E', fam:'CPE de acceso de mayor densidad, 1U', cap:20000, mpps:4.4, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 33.2 W típicos · 32 G/U · SRv6, EVPN · fuente AC 120 W integrada', optics:['ge','sfp10'], parts:['RACK','CONSOLE'],
 redund:'opcional', psu:{watts:33.2, tipo:'AC; doble AC o AC + DC según la variante', texto:'Se pide en tres variantes: una fuente AC, doble AC o AC + DC (ficha NetEngine A822 E V800R025C00, «Power supply»). 33,2 W típicos según esa ficha; el folleto de la serie, de 2022, decía 35. La fuente AC de 120 W integrada que trae este registro no la publica ninguna ficha.'}},
{id:'NetEngine A821 E', cls:'WAN', ser:'A800 E', fam:'Acceso 10GE con slicing FlexE, 1U', cap:72000, mpps:108, flexe:true, lan:0, poe:0, wan:0, wifi:0,
 ports:'6 x 10GE + 4 x GE/FE óptico + 8 x GE/FE eléctrico · FlexE con granularidad Mbps · 70 W típicos', optics:['sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:'opcional', psu:{watts:70, tipo:'AC; doble AC o AC + DC según la variante', texto:'Se pide en tres variantes: una fuente AC, doble AC o AC + DC (ficha NetEngine A821 E V800R025C00, «Power supply»). 70 W típicos.'}},

{id:'NE8000 M6', cls:'WAN', ser:'NE8000 M', fam:'Agregación compacta, 2U', cap:320000, mpps:72, lan:0, poe:0, wan:0, wifi:0,
 ports:'2U · 6 tarjetas DC / 4 AC de 50 G · MPU 1:1 · fuentes 1+1 · 205.8 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:205.8, tipo:'AC/DC', texto:'Fuentes 1+1 · 205.8 W típicos.'}},
{id:'NE8000 M1C', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de configuración fija, 1U', cap:344000, mpps:78, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · sin tarjetas flexibles · fuentes 1+1 · 89 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:89, tipo:'AC/DC', texto:'Fuentes 1+1 · 89 W típicos.'}},
{id:'NE8000 M1A', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de configuración fija, 1U', cap:352000, mpps:72, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · sin tarjetas flexibles · fuentes DC 1+1 · 74.8 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:74.8, tipo:'DC', texto:'Fuentes DC 1+1 · 74.8 W típicos.'}},
{id:'NE8000 M1D-B', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de configuración fija, 1U', cap:368000, mpps:72, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · sin tarjetas flexibles · fuentes 1+1 · 107.2 W típicos', optics:['sfp10','sfp25','ge'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:107.2, tipo:'AC/DC', texto:'Fuentes 1+1 · 107.2 W típicos.'}},
{id:'NE8000 M1D', cls:'WAN', ser:'NE8000 M1', fam:'Acceso WAN de alta densidad, 1U', cap:1760000, mpps:398, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 880 G/U · fuentes 1+1 · 124.5 W típicos', optics:['qsfp100','sfp25','sfp10'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:124.5, tipo:'AC/DC', texto:'Fuentes 1+1 · 124.5 W típicos.'}},
{id:'NE8000 M4', cls:'WAN', ser:'NE8000 M', fam:'Agregación, 2U, 4 tarjetas', cap:2400000, mpps:405, lan:0, poe:0, wan:0, wifi:0,
 ports:'2U · 4 tarjetas de 400 G · MPU simple · fuentes 1+1 · 283.4 W típicos', optics:['qsfp100','sfp25','sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:283.4, tipo:'AC/DC', texto:'Fuentes 1+1 · 283.4 W típicos.'}},
{id:'NE8000 F1A', cls:'WAN', ser:'NE8000 F', fam:'Agregación fija de alta densidad, 1U', cap:2400000, mpps:453, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 1200 G/U, la mayor densidad por unidad de rack · fuentes 1+1 · 325 W típicos', optics:['qsfp100','sfp25','sfp10'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:325, tipo:'AC/DC', texto:'Fuentes 1+1 · 325 W típicos.'}},
// NE8000 M8 y F8 (2026-10-02): capacidad leída de su ficha oficial en e.huawei.com (PDF generado
// el 2025-06-12 el del M8 y el 2025-02-27 el del F8, los dos «© 2022»), traída por
// `traer-cisco-huawei.yml` a la rama de transporte. La identidad se comprobó por el contenido y
// no por el título del PDF, que en los dos dice «NetEngine 8000 M4» (una plantilla). `cap` es
// conmutación, como en el resto de NetEngine (docs/revision-huawei-2026-09-29.md). El M8 la
// publica POR TARJETA DE CONTROL: IPU-480 960 Gbps, IPU-1T2 2,4 Tbps e IPU-2T4 4,8 Tbps; los
// «2,4 Tbps» de su portada son capacidad de puertos, la mitad. Esta fila describe la IPU-2T4
// —tarjetas de 400 G y los 774 W típicos de esa columna—, así que su conmutación es 4,8 Tbps.
// Llevaba 2,4 Tbps y 453 Mpps, la fila exacta del F1A. La ficha no publica Mpps, y ni esos 453
// ni los 1.086 del cotizador tienen un documento que los respalde: `mpps` queda en null.
{id:'NE8000 M8', cls:'WAN', ser:'NE8000 M', fam:'Agregación, 3U, hasta 8 tarjetas', cap:4800000, mpps:null, lan:0, poe:0, wan:0, wifi:0,
 ports:'3U · 8 tarjetas DC / 6 AC de 400 G · MPU y SFU 1:1 · 774.3 W típicos', optics:['qsfp100','sfp25','sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:774.3, tipo:'AC o DC', texto:'Fuentes 1+1 («Redundant power supply: 1+1» en la variante AC y en la DC, ficha NE8000 M8) · 774,3 W típicos con IPU-2T4.'}},
// M14 (2026-10-02): su ficha oficial (PDF generado el 2026-05-27, «© 2025»), traída por el mismo
// camino que la del M8 y con la misma plantilla en el título («NetEngine 8000 M4»; el texto nombra
// el M14 doce veces y el M4 ninguna). Publica la conmutación POR TARJETA DE CONTROL: IPU-1T2
// 2,4 Tbps, IPU-2T 4 Tbps e IPU-3T6 7,2 Tbps, con tarjetas de 400 G las dos últimas. La fila
// llevaba 2 Tbps, que no es ninguna de las tres —es la capacidad de PUERTOS de la IPU-2T, la
// mitad—, mientras el portal y la guía decían 7,2. Como el M8, la fila describe la tarjeta de
// control más alta: IPU-3T6, 7,2 Tbps y sus 931 W típicos (los 865,8 W que llevaba no salen en
// ninguna columna de esta edición). La ficha no publica Mpps: los 1.117 siguen, como los del F8,
// con la verificación de la Fase 2 detrás.
{id:'NE8000 M14', cls:'WAN', ser:'NE8000 M', fam:'Agregación grande, 5U, 14 tarjetas', cap:7200000, mpps:1117, lan:0, poe:0, wan:0, wifi:0,
 ports:'5U · 14 tarjetas DC de 400 G con IPU-3T6 · MPU y SFU 1:1 · fuentes 1+1 · 931 W típicos', optics:['qsfp100','sfp25','sfp10','ge'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:931, tipo:'DC', texto:'Fuentes 1+1 · 931 W típicos con IPU-3T6.'}},
// F8: la ficha publica conmutación de 4 Tbps (versión 2T) y 12,8 Tbps (versión 6.4T). Esta fila
// es la 6.4T —tarjetas de 800 G— y llevaba 6,4 Tbps, que es su capacidad de PUERTOS, otra base:
// la mitad de la conmutación, que cuenta los dos sentidos.
{id:'NE8000 F8', cls:'WAN', ser:'NE8000 F', fam:'Núcleo compacto, 13U', cap:12800000, mpps:2035, lan:0, poe:0, wan:0, wifi:0,
 ports:'13U · 8 tarjetas de 800 G · MPU y SFU 1:1 · hasta 5+1 DC o 3+3 AC · 2370 W típicos', optics:['qsfpdd400','qsfp100','sfp25','sfp10'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:2370, tipo:'DC o AC', texto:'Hasta 5+1 DC o 3+3 AC · 2370 W típicos — el esquema exacto depende de la configuración pedida.'}},
{id:'NE8000 X4', cls:'WAN', ser:'NE8000 X', fam:'Núcleo WAN / DCI, 9.8U', cap:173150000, mpps:24424, lan:0, poe:0, wan:0, wifi:0,
 ports:'4 tarjetas de hasta 19.2 T · SFU 7+1 · MPU 1:1 · hasta 6 fuentes N+1 · 5913 W típicos', optics:['qsfpdd400','qsfp100'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:5913, texto:'Hasta 6 fuentes N+1 · 5913 W típicos.'}},
{id:'NE8000 X8', cls:'WAN', ser:'NE8000 X', fam:'Núcleo WAN / DCI, 15.8U', cap:346300000, mpps:48848, lan:0, poe:0, wan:0, wifi:0,
 ports:'8 tarjetas de hasta 19.2 T · SFU 7+1 · MPU 1:1 · hasta 10 fuentes N+1 · 11 017 W típicos', optics:['qsfpdd400','qsfp100'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:11017, texto:'Hasta 10 fuentes N+1 · 11 017 W típicos.'}},
{id:'NE8000 X16', cls:'WAN', ser:'NE8000 X', fam:'Núcleo WAN de máxima capacidad, 32.3U', cap:692600000, mpps:97280, lan:0, poe:0, wan:0, wifi:0,
 ports:'16 tarjetas de 14.4 T · hasta 42 x 400GE o 72 x 100GE · 20 fuentes N+1 · 24 015 W típicos', optics:['qsfpdd400','qsfp100'], parts:['RACK','CONSOLE'],
 redund:true, psu:{watts:24015, texto:'20 fuentes N+1 · 24 015 W típicos.'}}
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
