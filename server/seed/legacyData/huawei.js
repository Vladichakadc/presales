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
  // PAC180 y PDC240 (2026-10-14): «Applicable power modules» de las paginas del AR6710-L26T2X4 y el
  // L50T2X4 en la descripcion de hardware (EDOC1100213474, 2026-07-23), leidas en el Chrome del dueño.
  PAC180:{sku:'PAC180S12-CN', bom:null, d:'Fuente AC de 180 W · la admite el AR6710-L26/L50 junto a la PAC350S12-CR (descripción de hardware de Huawei)'},
  PDC240:{sku:'PDC240S12-CN', bom:null, d:'Fuente DC de 240 W · la del AR6710-L26/L50 en DC (descripción de hardware de Huawei)'},
  PAC36:{sku:'PAC36S24-CN', bom:null, d:'Adaptador AC-DC de 36 W · 90–290 V · salida 24 V / 1,5 A · –40 a +70 °C · para el AR502H-V2 donde no hay DC («Ordering Information» de su ficha)'},
  PAC1000:{sku:'PAC1000S56-EB', bom:null, d:'Fuente AC y 240 V DC de 1000 W · chasis 66 mm · flujo trasero-frontal'},
  PAC600:{sku:'PAC600S56-EB', bom:null, d:'Fuente AC y 240 V DC de 600 W · chasis 66 mm · flujo trasero-frontal'},
  PDC1000:{sku:'PDC1000S56-EB', bom:null, d:'Fuente DC PoE de 1000 W · chasis 66 mm · flujo trasero-frontal'},
  FAN240:{sku:'FAN-240SN-B', bom:null, d:'Módulo de ventilación de una capa con tres ventiladores'},
  MPU100:{sku:'MPU-100', bom:null, d:'Unidad de procesamiento principal del AR8700 · en pareja para redundancia'},
  MPU100T:{sku:'MPU-100-T', bom:null, d:'MPU del AR8700 con módulo de plataforma confiable (TPM)'},
  SPU700H:{sku:'SPU-700H', bom:null, d:'Unidad de servicio del AR8700 (Service Process Unit) · 1 x 40GE QSFP+, 8 x 10GE SFP+, 8 x GE combo'},
  SRU700S:{sku:'SRU-700S', bom:null, d:'Placa de servicio y enrutamiento del AR6710-H (Service and Router Unit) · 2 x 25GE SFP28, 4 x 10GE SFP+, 4 x GE RJ45, 1 x USB 3.0'},
  // Las tres fuentes del AR6710-H (2026-10-07): «Applicable power modules» de su página en la
  // descripción de hardware de Huawei (EDOC1100213474, actualizada el 2026-07-23), leída renderizada
  // por PDF4me. Su ficha solo publicaba la potencia (300 W AC / 260 W DC), y hasta ese día la línea
  // decía «código por confirmar» en vez de citar la PAC350, que es de otro equipo.
  PAC300:{sku:'PAC300S12-CL', bom:null, d:'Fuente AC de 300 W · extraíble en caliente · la del AR6710-H (descripción de hardware de Huawei)'},
  PDC260:{sku:'PDC260S12-CL', bom:null, d:'Fuente DC de 260 W · extraíble en caliente · la del AR6710-H (descripción de hardware de Huawei)'},
  PDC260DL:{sku:'PDC260S12-DL', bom:null, d:'Fuente DC de 260 W · extraíble en caliente · con la versión V600R024C00SPC100 pide el parche V600R024HP1502 o posterior (descripción de hardware de Huawei)'},
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
// LA CAPACIDAD DE LA A800 E NO LA PUBLICA NINGUNA FICHA, pero si su pagina de producto (2026-10-06,
// noche: e.huawei.com/en/products/routers/netengine-a800, tabla «Specifications», traida por Actions):
// 20 / 72 / 20 / 20 Gbps y 4,4 / 108 / 4,4 / 4,4 Mpps, exactamente lo que ya llevaba el catalogo. No
// era relleno: le faltaba el documento. Lo que sigue es lo que se escribio antes de leerla.
// El folleto, mezclando criterios:
// 14 G al A813 E y 32 G al A822 E (la suma de sus puertos en un sentido) frente a 72 G al A821 E
// (los dos sentidos), y al A816 E «64-172 Gbit/s» y «112-246 Mpps» con 4 + 4 puertos GE, que no
// es posible. Se quedan 20 / 20 / 20 / 72 aqui, y queda en PENDIENTES.md.
// NE8000 M1A (2026-10-06): 176 -> 352 Gbps, la capacidad de conmutacion de su ficha; los 176 eran
// la capacidad de puertos que cita su presentacion, el mismo error que ya se corrigio en el M8,
// el F8 y el M14. Su consumo NO se toca: la ficha da 89,21 W, identico al centesimo al del M1C,
// cuya ficha si lo desglosa por configuracion; en el M1A es la plantilla copiada. Los 74,8 W del
// catalogo los respalda la pagina de producto de la serie (2026-10-06, noche), como los 124,5 W del M1D.
// Y esa misma pagina da al M8 1.086 Mpps en la columna de sus 4,8 Tbps y 774,3 W (la IPU-2T4 de la
// fila): es la cifra que el catalogo tenia en null. El resto de lo que dice, en fuentes.js.
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
//    ficha no publica su codigo, y la linea lo decia en vez de citar el de otro equipo. Desde el
//    2026-10-07 lo da su pagina de la descripcion de hardware: PAC300S12-CL en AC, y PDC260S12-CL
//    o PDC260S12-DL en DC.
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
// AR5710-H (2026-10-12): serie nueva, de «Huawei NetEngine AR5710-H Series Enterprise Router Data
// Sheet-R26C00», que la página de la familia en e.huawei.com/en/products/routers enlaza y el
// repositorio no tenía (traída por traer-cisco-huawei.yml, rama fuente/huawei-familias-2026-10-12).
// Las nueve filas comparten las cifras de la serie: 4 Gbps de reenvío (NAT+ACL+QoS, IMIX, con
// «cambio manual al modo de reenvío por hardware»), 1,6 Gbps de IPsec IMIX y 900 Mbps de SD-WAN
// típico IMIX. Las tres son los mismos tres campos que ya usan las AR5710-S, no 512 bytes ni 1420.
// `mpps` queda en null: la ficha no publica paquetes por segundo. El consumo es el «Typical power
// consumption» de cada columna; la fuente es integrada («Built-in»), no se pide aparte.
{id:'AR5710-H8T2TS1', cls:'AR', ser:'AR5710-H', fam:'Sucursal mediana, WAN combo GE', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:32, apsMax:64, boost:0,
 ports:'2 x GE combo WAN, 8 x GE eléctricos LAN, 1 ranura MIC', optics:['ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:25, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 25 W típicos, 36 W de salida máxima (ficha AR5710-H R26C00).'}},
{id:'AR5710-H8T2TS1-T', cls:'AR', ser:'AR5710-H', fam:'Sucursal mediana con TPM', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:32, apsMax:64, boost:0,
 ports:'2 x GE combo WAN, 8 x GE eléctricos LAN, 1 ranura MIC · TPM', optics:['ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:25, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 25 W típicos, 36 W de salida máxima (ficha AR5710-H R26C00).'}},
{id:'AR5710-H4T4N2X', cls:'AR', ser:'AR5710-H', fam:'Sucursal mediana, WAN 10GE', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:8, poe:0, wan:0, wifi:0, apsFree:32, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, 4 x 2.5GE + 4 x GE eléctricos LAN', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:32, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 32 W típicos, 32 W de salida máxima (ficha AR5710-H R26C00).'}},
{id:'AR5710-H4T4N2X-LTE4EA', cls:'AR', ser:'AR5710-H', fam:'Sucursal mediana con LTE', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:8, poe:0, wan:1, wifi:0, apsFree:32, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, LTE4EA con 2 SIM activo/standby, 4 x 2.5GE + 4 x GE eléctricos LAN', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:36, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 36 W típicos, 70 W de salida máxima (ficha AR5710-H R26C00).'}},
{id:'AR5710-H2T4N2X-NRGL', cls:'AR', ser:'AR5710-H', fam:'Sucursal con 5G integrado', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:6, poe:0, wan:1, wifi:0, apsFree:32, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, 5G SA/NSA con 2 SIM activo/standby, 4 x 2.5GE + 2 x GE eléctricos LAN', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:35, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 35 W típicos, 70 W de salida máxima (ficha AR5710-H R26C00).'}},
{id:'AR5710-H2T4PN2X-NRGL', cls:'AR', ser:'AR5710-H', fam:'Sucursal con PoE++ y 5G', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:6, poe:1, wan:1, wifi:0, apsFree:32, apsMax:64, boost:0,
 ports:'2 x 10GE SFP+ WAN, 5G SA/NSA con 2 SIM, 4 x 2.5GE PoE++ + 2 x GE LAN · PoE 130 W total', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:36, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 36 W típicos sin carga PoE y 190 W de consumo máximo con ella (ficha AR5710-H R26C00).'}},
{id:'AR5710-H2T4N2XW', cls:'AR', ser:'AR5710-H', fam:'Todo en uno con Wi-Fi 7', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:6, poe:0, wan:0, wifi:1, apsFree:32, apsMax:64, boost:0,
 ports:'2 x 10GE combo WAN, 4 x 2.5GE + 2 x GE LAN, Wi-Fi 7 doble banda, hasta 256 usuarios', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:32.59, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 32,59 W típicos, 70 W de salida máxima (ficha AR5710-H R26C00).'}},
{id:'AR5710-H2T4N2XW-NRGL', cls:'AR', ser:'AR5710-H', fam:'Todo en uno: Wi-Fi 7 y 5G', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:6, poe:0, wan:1, wifi:1, apsFree:32, apsMax:64, boost:0,
 ports:'2 x 10GE combo WAN, 5G SA/NSA con 2 SIM, 4 x 2.5GE + 2 x GE LAN, Wi-Fi 7 doble banda, hasta 256 usuarios', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:34.93, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 34,93 W típicos, 70 W de salida máxima (ficha AR5710-H R26C00).'}},
{id:'AR5710-H2T4N2XW-Q', cls:'AR', ser:'AR5710-H', fam:'Todo en uno con Wi-Fi 7, sin ventilador', fwd:4000, ipsec:1600, typ:900, mpps:null, lan:6, poe:0, wan:0, wifi:1, apsFree:32, apsMax:64, boost:0,
 ports:'2 x 10GE combo WAN, 4 x 2.5GE + 2 x GE LAN, Wi-Fi 7 doble banda, hasta 256 usuarios · disipación natural', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:32.56, tipo:'AC integrada', texto:'Una fuente AC integrada de 100-240 V; 32,56 W típicos, 70 W de salida máxima (ficha AR5710-H R26C00).'}},
// AR5710I-RU-NRGL, AR6121E y AR6140E-9G-2AC (2026-10-12): de «Huawei NetEngine AR5710I-RU-NRGL
// Enterprise Router Data Sheet-R26C00» y «Huawei NetEngine AR6000 Series Enterprise Routers
// Datasheet-R26C00», enlazadas desde las paginas de familia de e.huawei.com y traidas por
// traer-cisco-huawei.yml (rama fuente/huawei-familias-2026-10-12). `mpps` en null: no publican
// paquetes por segundo. En el AR6000 la ficha no dice cuantos APs gestiona su WAC, asi que
// `apsFree`/`apsMax` quedan en null (sin dato) y no en 0 («no gestiona APs»).
{id:'AR5710I-RU-NRGL', cls:'AR', industrial:true, ser:'AR5710-I', fam:'Industrial IP65 con 5G, para poste o pared', fwd:1500, ipsec:800, typ:720, mpps:null, lan:2, poe:0, wan:1, wifi:0, apsFree:16, apsMax:64, boost:0,
 ports:'1 x 2.5GE eléctrico + 1 x 10GE SFP+ (WAN o LAN), 5G SA/NSA con 2 SIM, antenas 5G/LTE integradas · IP65, –40 a +65 °C', optics:['sfp10','ge'], parts:[],
 redund:false, psu:{watts:15, tipo:'PoE (–48 V DC) o adaptador AC externo', texto:'Una entrada: PoE (–42,5 a –57 V DC) o adaptador AC (90–270 V); 15 W típicos y 18,5 W de máximo, sin ventilador (ficha AR5710I-RU-NRGL R26C00).'}},
{id:'AR6121E', cls:'AR', ser:'AR6000', fam:'Sucursal modular con ranuras SIC y WSIC', fwd:2000, ipsec:2000, typ:800, mpps:null, lan:9, poe:0, wan:0, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'2 x GE combo + 1 x 10GE SFP+ WAN, 1 x GE combo + 8 x GE LAN · 2 ranuras SIC y 1 WSIC', optics:['sfp10','ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:false, psu:{watts:28, tipo:'AC integrada', texto:'Una fuente AC de 100-240 V, sin redundancia; 28 W típicos y 33 W de máximo (ficha AR6000 R26C00).'}},
{id:'AR6140E-9G-2AC', cls:'AR', ser:'AR6000', fam:'Sucursal modular con doble fuente', fwd:2000, ipsec:2000, typ:800, mpps:null, lan:5, poe:0, wan:0, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'2 x GE SFP + 2 x GE eléctricos WAN, 2 x GE SFP + 3 x GE eléctricos LAN · 4 ranuras SIC y hasta 2 WSIC', optics:['ge'], parts:['RACK','CONSOLE','RU5G'],
 redund:true, psu:{watts:22, tipo:'AC, dos módulos', texto:'Dos módulos de alimentación AC (redundancia 1+1, «Dual power modules»); 22 W típicos y 28 W de máximo (ficha AR6000 R26C00).'}},
{id:'AR6710-L8T3TS1X2', cls:'AR', ser:'AR6700-L', fam:'Campus pequeño', fwd:2000, ipsec:1600, typ:1200, mpps:null, lan:9, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'1 x 10GE óptico + 2 x GE combo WAN, 1 x GE combo + 8 x GE LAN, 2 x SIC, 0/1 WSIC', optics:['sfp10','ge'], parts:['WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 redund:false, psu:{watts:27, salida:[{w:70, tipo:'AC'}], tipo:'AC integrada', texto:'Sin redundancia de fuente («Power supply redundancy: N/A»), 70 W de salida máxima en AC; 27 W típicos (ficha AR6710-L R26C00). El BOM no pide fuente: la PAC180S12-CN que listaba el catálogo es de 180 W.'}},
{id:'AR6710-L26T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano, 24 puertos', fwd:3200, ipsec:1600, typ:1200, mpps:null, lan:24, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 24 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['PAC350','PAC180','PDC240','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 psu:{watts:68, salida:[{w:350, tipo:'AC'}, {w:180, tipo:'AC'}, {w:240, tipo:'DC'}], tipo:'AC o DC', texto:'«Dual power supplies, hot-swappable» (350 W AC / 240 W DC de salida): admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. Su página en la descripción de hardware (EDOC1100213474, 2026-07-23) admite la PAC350S12-CR o la PAC180S12-CN en AC y la PDC240S12-CN en DC, con dos ranuras y respaldo 1:1, y tampoco dice cuántas vienen. 68 W típicos (ficha AR6710-L R26C00).'}},
{id:'AR6710-L50T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano, 48 puertos', fwd:3200, ipsec:1600, typ:1200, mpps:null, lan:48, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 48 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['PAC350','PAC180','PDC240','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 psu:{watts:83, salida:[{w:350, tipo:'AC'}, {w:180, tipo:'AC'}, {w:240, tipo:'DC'}], tipo:'AC o DC', texto:'«Dual power supplies, hot-swappable» (350 W AC / 240 W DC de salida): admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. Su página en la descripción de hardware (EDOC1100213474, 2026-07-23) admite la PAC350S12-CR o la PAC180S12-CN en AC y la PDC240S12-CN en DC, con dos ranuras y respaldo 1:1, y tampoco dice cuántas vienen. 83 W típicos (ficha AR6710-L R26C00).'}},
{id:'AR6710-L14T2X4', cls:'AR', ser:'AR6700-L', fam:'Campus mediano de alto caudal', fwd:4000, ipsec:2500, typ:1800, mpps:null, lan:12, poe:0, wan:0, wifi:0, apsFree:32, apsMax:128, boost:0,
 ports:'2 x 10GE óptico + 2 x GE WAN, 4 x GE combo + 8 x GE LAN, 4 x SIC, 0/2 WSIC', optics:['sfp10','ge'], parts:['WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 redund:true, psu:{watts:41, salida:[{w:150, tipo:'AC'}], tipo:'AC integrada, doble', texto:'Dos fuentes AC integradas en respaldo 1:1: su página en la descripción de hardware (EDOC1100213474, 02355PSD, 2026-07-23) dice «Power supply mode: AC built-in», «Number of power modules: 2» y «Dual power supplies in 1:1 backup mode»; la ficha AR6710-L R26C00, «Dual power supplies, not hot-swappable», 150 W de salida máxima. 41 W típicos. El BOM no pide fuente: vienen dentro del equipo.'}},
{id:'AR6710-H4T4X2Y7', cls:'AR', ser:'AR6700-H', fam:'Casa matriz / campus grande', fwd:13000, ipsec:10000, typ:7000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:512, boost:0,
 ports:'2 x 25GE SFP28 + 4 x 10GE SFP+ + 4 x GE · 6 x SIC, 1/4 WSIC · reemplaza AR6280/AR6300', optics:['sfp25','sfp10','ge'], parts:['SRU700S','PAC300','PDC260','PDC260DL','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 psu:{watts:83, salida:[{w:300, tipo:'AC'}, {w:260, tipo:'DC'}], tipo:'AC o DC', texto:'«Dual power supplies, hot-swappable» (300 W AC / 260 W DC de salida): admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. 83 W típicos con una SRU y 145 W con dos (ficha AR6710-H R25C10). La PAC350S12-CR que listaba el catálogo es de 350 W y no es la suya: su descripción de hardware (EDOC1100213474, 2026-07-23) da la PAC300S12-CL en AC y la PDC260S12-CL o la PDC260S12-DL en DC, con dos ranuras de fuente («Number of power modules 2», «Double AC power modules (1+1)»), sin decir cuántas vienen.'}},
{id:'AR8140-12G10XG', cls:'AR', ser:'AR8000', fam:'Hub SD-WAN / borde de campus grande', fwd:25000, ipsec:20000, typ:15000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'10 x 10GE óptico + 8 x GE combo + 4 x GE · 4 x SIC, 0/2 WSIC · doble fuente 350 W', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 redund:true, psu:{watts:168, salida:[{w:350, tipo:'AC'}, {w:350, tipo:'HVDC'}, {w:240, tipo:'DC'}], tipo:'AC-DC (PAC350S12-CR)', volts:'90–290 V', amps:'salida 12 V / 29,2 A',
  texto:'Doble fuente de 350 W — el catálogo publica dos PAC350S12-CR (90–290 V, salida 12 V / 29.2 A) para el AR8140; la ficha AR8000 R25C10 dice «Dual power supplies, hot-swappable». 168 W típicos: los 350 W eran la potencia de cada fuente, no el consumo.'}},
{id:'AR8140-T-12G10XG', cls:'AR', ser:'AR8000', fam:'Hub SD-WAN con TPM', fwd:25000, ipsec:20000, typ:15000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'Igual al AR8140 más módulo de plataforma confiable (TPM)', optics:['sfp10','ge'], parts:['PAC350','WSIC4GE','WSIC8GE','SICNR','RACK','CONSOLE'],
 redund:true, psu:{watts:168, salida:[{w:350, tipo:'AC'}, {w:350, tipo:'HVDC'}, {w:240, tipo:'DC'}], tipo:'AC-DC (PAC350S12-CR)', volts:'90–290 V', amps:'salida 12 V / 29,2 A',
  texto:'Igual al AR8140-12G10XG: doble fuente de 350 W (PAC350S12-CR, 90–290 V, salida 12 V / 29.2 A). 168 W típicos (ficha AR8000 R25C10).'}},
{id:'AR8700-8', cls:'AR', ser:'AR8700', fam:'Hub SD-WAN de alta disponibilidad', fwd:30000, ipsec:20000, typ:15500, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:32, apsMax:1024, boost:0,
 ports:'Doble MPU, sin interrupción de servicio en conmutación · 24 Gbps SD-WAN IPsec IMIX', optics:['sfp25','sfp10','ge'], parts:['SPU700H','MPU100','MPU100T','PAC1000','PAC600','PDC1000','FAN240','RACK','CONSOLE'],
 psu:{watts:221, salida:[{w:600, tipo:'AC'}, {w:600, tipo:'HVDC'}, {w:1000, tipo:'AC'}, {w:1000, tipo:'HVDC'}, {w:1000, tipo:'DC'}], tipo:'AC, HVDC o DC', texto:'«Dual power supplies, hot-swappable», con módulos de 600 o 1000 W: admite dos fuentes extraíbles en caliente; la ficha no dice si vienen las dos de serie, y por eso no se marca. 221 W típicos con SPU, dos MPU y ventiladores (ficha AR8000 R25C10).'}},

// AR502H-V2 (2026-10-14): «Huawei AR502H-V2 Data Sheet» (rama fuente/huawei-familias-2026-10-12),
// gateway industrial IP40 de carril DIN con 4G o 5G. Una sola columna de rendimiento para la serie:
// 1,3 Gbps de reenvío (NAT+ACL+QoS, IMIX), 800 Mbps de IPsec y 620 de SD-WAN típico (IMIX). Se dejan
// fuera el AR502H-ELTE-V2 (eLTE, red privada que no aplica a la región) y las variantes sin ficha.
// La entrada es DC doble (9,6–60 V) integrada; el adaptador PAC36S24-CN es opcional para sitios sin DC.
{id:'AR502H-LTE4EA-V2', cls:'AR', industrial:true, ser:'AR502H-V2', fam:'Gateway industrial con LTE, carril DIN', fwd:1300, ipsec:800, typ:620, mpps:null, lan:4, poe:0, wan:1, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'4 x GE eléctricos + 2 x 10GE SFP+, LTE con 2 SIM, 2 x RS485/RS232, DI/DO, GNSS · IP40, –40 a +75 °C', optics:['sfp10','ge'], parts:['PAC36'],
 redund:true, psu:{watts:12, salida:[{w:36, tipo:'AC por adaptador opcional'}], tipo:'DC doble integrada (9,6–60 V)', texto:'Dos entradas DC integradas de bornera industrial («Dual DC power supplies», 9,6–60 V, 12–48 V nominal); menos de 12 W típicos y 16 W de máximo sin ópticas (ficha AR502H-V2). Sin DC en el sitio se pide el adaptador AC PAC36S24-CN.'}},
{id:'AR502H-LTE4AU-V2', cls:'AR', industrial:true, ser:'AR502H-V2', fam:'Gateway industrial con LTE (bandas Australia/América), carril DIN', fwd:1300, ipsec:800, typ:620, mpps:null, lan:4, poe:0, wan:1, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'4 x GE eléctricos + 2 x 10GE SFP+, LTE con 2 SIM, 2 x RS485/RS232, DI/DO, GNSS, ranura M.2 · IP40, –40 a +75 °C', optics:['sfp10','ge'], parts:['PAC36'],
 redund:true, psu:{watts:12, salida:[{w:36, tipo:'AC por adaptador opcional'}], tipo:'DC doble integrada (9,6–60 V)', texto:'Dos entradas DC integradas («Dual DC power supplies», 9,6–60 V); menos de 12 W típicos y 16 W de máximo sin ópticas (ficha AR502H-V2). Sin DC se pide el adaptador AC PAC36S24-CN.'}},
{id:'AR502H-NRGL-V2', cls:'AR', industrial:true, ser:'AR502H-V2', fam:'Gateway industrial con 5G, carril DIN', fwd:1300, ipsec:800, typ:620, mpps:null, lan:4, poe:0, wan:1, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'4 x GE eléctricos + 2 x 10GE SFP+, 5G con 2 SIM, 2 x RS485/RS232, DI/DO, GNSS · IP40, –40 a +75 °C', optics:['sfp10','ge'], parts:['PAC36'],
 redund:true, psu:{watts:11.3, salida:[{w:36, tipo:'AC por adaptador opcional'}], tipo:'DC doble integrada (9,6–60 V)', texto:'Dos entradas DC integradas («Dual DC power supplies», 9,6–60 V); 11,3 W típicos y 18,3 W de máximo sin ópticas (ficha AR502H-V2). Sin DC se pide el adaptador AC PAC36S24-CN.'}},

// AR6700V-L (2026-10-14): router VIRTUAL, «Huawei NetEngine AR6700V-L Virtual Router Data Sheet» (rama
// fuente/huawei-familias-2026-10-12). Va en su propia plataforma (`vcpe`): sus cifras dependen del
// servidor con que Huawei las midió (RH2288X V5, Xeon Gold 6238R a 2,2 GHz, Intel X710 con SR-IOV) y
// no compite con un equipo físico. Publica SD-WAN típico IMIX (IPsec + QoS + SA + AppFlow, suma de los
// dos sentidos) y SD-WAN IPsec solo a 1400 bytes; no publica reenvío ni IPsec IMIX: esas capas quedan
// en null y el modelo se aparta con su motivo si el perfil las pide. Con 2 vCPU no publica SD-WAN típico.
{id:'AR6700V-L (2 vCPU)', cls:'AR', ser:'AR6700V-L', virtual:true, vcpu:2, fam:'Router virtual (vCPE) en nube o hipervisor, 2 vCPU · 4 GB', fwd:null, ipsec:null, typ:null, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'Interfaces virtuales (SR-IOV, VirtIO o PCI-Passthrough) · KVM, VMware ESXi, OpenStack, ZStack, HUAWEI Cloud, AWS, Azure, Google Cloud y otras · 4 GB de RAM, 38 GB de disco · SD-WAN IPsec 700 Mbps a 1400 B', optics:[], parts:[],
 redund:'no-aplica', psu:{watts:null, tipo:'No aplica: router virtual', texto:'Corre como máquina virtual: la alimentación y su redundancia son las del servidor o la nube que lo aloja.'}},
{id:'AR6700V-L (4 vCPU)', cls:'AR', ser:'AR6700V-L', virtual:true, vcpu:4, fam:'Router virtual (vCPE) en nube o hipervisor, 4 vCPU · 8 GB', fwd:null, ipsec:null, typ:2000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'Interfaces virtuales (SR-IOV, VirtIO o PCI-Passthrough) · 8 GB de RAM, 38 GB de disco · SD-WAN IPsec 7 Gbps a 1400 B', optics:[], parts:[],
 redund:'no-aplica', psu:{watts:null, tipo:'No aplica: router virtual', texto:'Corre como máquina virtual: la alimentación y su redundancia son las del servidor o la nube que lo aloja.'}},
{id:'AR6700V-L (8 vCPU)', cls:'AR', ser:'AR6700V-L', virtual:true, vcpu:8, fam:'Router virtual (vCPE) en nube o hipervisor, 8 vCPU · 8 GB', fwd:null, ipsec:null, typ:4000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'Interfaces virtuales (SR-IOV, VirtIO o PCI-Passthrough) · 8 GB de RAM, 38 GB de disco · SD-WAN IPsec 14 Gbps a 1400 B', optics:[], parts:[],
 redund:'no-aplica', psu:{watts:null, tipo:'No aplica: router virtual', texto:'Corre como máquina virtual: la alimentación y su redundancia son las del servidor o la nube que lo aloja.'}},
{id:'AR6700V-L (16 vCPU)', cls:'AR', ser:'AR6700V-L', virtual:true, vcpu:16, fam:'Router virtual (vCPE) en nube o hipervisor, 16 vCPU · 16 GB', fwd:null, ipsec:null, typ:7000, mpps:null, lan:null, poe:0, wan:0, wifi:0, apsFree:null, apsMax:null, boost:0,
 ports:'Interfaces virtuales (SR-IOV, VirtIO o PCI-Passthrough) · 16 GB de RAM, 38 GB de disco · SD-WAN IPsec 29 Gbps a 1400 B', optics:[], parts:[],
 redund:'no-aplica', psu:{watts:null, tipo:'No aplica: router virtual', texto:'Corre como máquina virtual: la alimentación y su redundancia son las del servidor o la nube que lo aloja.'}},

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
// NE8000 F1A-C (2026-10-12): «NetEngine 8000 F1A-C Datasheet» (e.huawei.com, pagina de la familia NE8000,
// traida por traer-cisco-huawei.yml). Misma conmutacion que el F1A (2,4 Tbps) en una caja de 1U de 420 mm
// con hasta 56 puertos combinables. La ficha NO publica Mpps ni redundancia de fuentes: `mpps` en null y
// `redund` sin declarar. El titulo del PDF es una plantilla («NetEngine 8000 M4»); el texto nombra el F1A-C.
{id:'NE8000 F1A-C', cls:'WAN', ser:'NE8000 F', fam:'Agregación fija de alta densidad, 1U, hasta 56 puertos', cap:2400000, mpps:null, lan:0, poe:0, wan:0, wifi:0,
 ports:'1U · 420 mm · 28 x 10GE/GE + 8 x 25GE/10GE/GE + 12 x 25GE/10GE + 8 x 100GE, hasta 56 puertos combinables · 325 W típicos', optics:['qsfp100','sfp25','sfp10'], parts:['RACK','CONSOLE'],
 psu:{watts:325, tipo:'AC/DC', texto:'AC 90–290 V, DC –40 a –72 V o HVDC 190–290 V; 325 W típicos (ficha NE8000 F1A-C). La ficha no declara fuentes redundantes.'}},
// NE8000 M8 y F8 (2026-10-02): capacidad leída de su ficha oficial en e.huawei.com (PDF generado
// el 2025-06-12 el del M8 y el 2025-02-27 el del F8, los dos «© 2022»), traída por
// `traer-cisco-huawei.yml` a la rama de transporte. La identidad se comprobó por el contenido y
// no por el título del PDF, que en los dos dice «NetEngine 8000 M4» (una plantilla). `cap` es
// conmutación, como en el resto de NetEngine (docs/revision-huawei-2026-09-29.md). El M8 la
// publica POR TARJETA DE CONTROL: IPU-480 960 Gbps, IPU-1T2 2,4 Tbps e IPU-2T4 4,8 Tbps; los
// «2,4 Tbps» de su portada son capacidad de puertos, la mitad. Esta fila describe la IPU-2T4
// —tarjetas de 400 G y los 774 W típicos de esa columna—, así que su conmutación es 4,8 Tbps.
// Llevaba 2,4 Tbps y 453 Mpps, la fila exacta del F1A. La ficha no publica Mpps, y ni esos 453
// ni los 1.086 del cotizador tenian un documento que los respaldara: `mpps` quedo en null.
// 2026-10-06 (noche): la pagina de producto de la serie (e.huawei.com, tabla «Specifications»)
// publica 1.086 Mpps en la columna del M8 junto a 4,8 Tbps y 774,3 W, que son esta configuracion.
// Ahora si hay documento, y la cifra entra.
{id:'NE8000 M8', cls:'WAN', ser:'NE8000 M', fam:'Agregación, 3U, hasta 8 tarjetas', cap:4800000, mpps:1086, lan:0, poe:0, wan:0, wifi:0,
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

// FICHA TECNICA DEL FABRICANTE (2026-10-12). Lo que la tarjeta del equipo muestra ademas de las
// cifras que dimensionan: las demas capas de rendimiento con su tamano de paquete, la memoria, las
// dimensiones, la envolvente electrica y la ambiental. Cada valor se copia de la tabla de su
// ficha, columna por columna, sin convertir; lo que la ficha no publica no se escribe. Solo estan
// las series cuya ficha esta en el repositorio leida con esta estructura (AR5710-H, AR5710I-RU,
// AR6000); las demas se amplian cuando se relean sus fichas. `rev` es la edicion del documento.
const F_H = (mod) => ({
  rev: 'R26C00', doc: 'Huawei NetEngine AR5710-H Series Enterprise Router Data Sheet-R26C00',
  grupos: [
    {t: 'Rendimiento por tamaño de paquete', f: [
      ['Reenvío IPv4, 512 bytes', mod.fwd512],
      ['IPsec, IMIX', '1,6 Gbps'], ['IPsec, 512 bytes', '2 Gbps'], ['IPsec, 1420 bytes', '5 Gbps'],
      ['SD-WAN IPsec, IMIX / 512 B / 1400 B', '2 / 2,6 / 5,2 Gbps'],
      ['SD-WAN (IPsec + QoS), IMIX / 512 B / 1400 B', '1,5 / 2,2 / 3,8 Gbps'],
      ['SD-WAN típico, IMIX / 512 B / 1400 B', '900 Mbps / 1,2 / 3 Gbps'],
    ]},
    {t: 'Hardware', f: [
      ['Puertos WAN fijos', mod.wan], ['Puertos LAN fijos', mod.lan],
      ...(mod.extra || []),
      ['Memoria / flash', '4 GB / 2 GB'], ['Consola / USB', '1 x RJ45 / 1 x USB 2.0'],
      ['Dimensiones (Al × An × Fo)', mod.dim], ['Peso sin embalaje', mod.peso], ['Montaje', 'Rack (1U), mesa o pared'],
    ]},
    {t: 'Alimentación y ambiente', f: [
      ['Tensión de entrada', '100–240 V, 50/60 Hz'], ['Corriente máxima', mod.amp],
      ['Potencia de salida máxima', mod.salida], ['Consumo típico / máximo', mod.consumo],
      ['Ventilación', mod.vent], ['Ruido', mod.ruido],
      ['Temperatura de operación', '0 °C a 45 °C'], ['Humedad', '5 % a 95 % sin condensación'],
      ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C'],
    ]},
  ],
});
const F_AR6 = (o) => ({
  rev: 'R26C00', doc: 'Huawei NetEngine AR6000 Series Enterprise Routers Datasheet-R26C00',
  grupos: [
    {t: 'Rendimiento por tamaño de paquete', f: [
      ['Reenvío IPv4, IMIX', '3.800 Mbps'], ['IPsec, IMIX / 1400 B', '2 / 4 Gbps'],
      ['SD-WAN IPsec, IMIX / 1400 B', '1,5 / 4,5 Gbps'], ['SD-WAN (IPsec + QoS), IMIX / 1400 B', '1,2 / 1,85 Gbps'],
      ['SD-WAN típico, IMIX / 1400 B', '800 Mbps / 1,8 Gbps'],
    ]},
    {t: 'Hardware', f: [
      ['Puertos WAN fijos', o.wan], ['Puertos LAN fijos', o.lan], ['Ranuras', o.slots],
      ['Memoria / flash', '4 GB / 1 GB'], ['Consola / USB', '1 x RJ45 / ' + o.usb], ['Cambio en caliente', 'Compatible'],
      ['Dimensiones (Al × An × Fo)', o.dim], ['Peso sin embalaje', o.peso], ['Montaje', o.montaje + ' (1U)'],
    ]},
    {t: 'Alimentación y ambiente', f: [
      ['Tensión de entrada', '100–240 V, 50/60 Hz'], ['Corriente máxima', '2 A'], ['Potencia de salida máxima', '70 W'],
      ['Consumo típico / máximo', o.consumo], ['Redundancia de alimentación', o.red],
      ['Ventilación', 'Ventiladores integrados fijos, flujo izquierda a derecha'], ['Ruido', '49,9 dB(A)'],
      ['Temperatura de operación', '0 °C a 45 °C'], ['Humedad', '5 % a 95 % sin condensación'],
      ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C'],
    ]},
  ],
});
const FICHAS = {
  'AR5710-H8T2TS1': F_H({fwd512:'10 Gbps', wan:'2 x GE combo', lan:'8 x GE eléctricos', extra:[['Ranura MIC','1 x MIC'],['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'44,0 × 300,0 × 220,3 mm', peso:'1,8 kg', amp:'1 A', salida:'36 W', consumo:'25 W / 29 W', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'41,9 dB(A)'}),
  'AR5710-H8T2TS1-T': F_H({fwd512:'10 Gbps', wan:'2 x GE combo', lan:'8 x GE eléctricos', extra:[['Ranura MIC','1 x MIC'],['TPM','Sí'],['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'44,0 × 300,0 × 220,3 mm', peso:'1,8 kg', amp:'1 A', salida:'36 W', consumo:'25 W / 29 W', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'41,9 dB(A)'}),
  'AR5710-H4T4N2X': F_H({fwd512:'13 Gbps', wan:'2 x 10GE SFP+', lan:'4 x 2.5GE + 4 x GE eléctricos', extra:[['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'43,6 × 320 × 210 mm', peso:'1,937 kg', amp:'0,8 A', salida:'32 W', consumo:'32 W / 38 W', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'50 dB(A)'}),
  'AR5710-H4T4N2X-LTE4EA': F_H({fwd512:'13 Gbps', wan:'2 x 10GE SFP+ · LTE4EA con 2 SIM', lan:'4 x 2.5GE + 4 x GE eléctricos', extra:[['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'43,6 × 320 × 210 mm', peso:'2,145 kg', amp:'2 A', salida:'70 W', consumo:'36 W / 43 W', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'50 dB(A)'}),
  'AR5710-H2T4N2X-NRGL': F_H({fwd512:'13 Gbps', wan:'2 x 10GE SFP+ · 5G SA/NSA con 2 SIM', lan:'4 x 2.5GE + 2 x GE eléctricos', extra:[['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'43,6 × 320 × 210 mm', peso:'2,327 kg', amp:'2 A', salida:'70 W', consumo:'35 W / 42 W', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'50 dB(A)'}),
  'AR5710-H2T4PN2X-NRGL': F_H({fwd512:'13 Gbps', wan:'2 x 10GE SFP+ · 5G SA/NSA con 2 SIM', lan:'4 x 2.5GE PoE++ + 2 x GE eléctricos', extra:[['PoE','130 W en total: PoE 15,4 W en hasta 4 puertos, PoE+ 30 W en hasta 4, PoE++ 60 W en hasta 2 o 90 W en 1'],['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'43,6 × 320 × 210 mm', peso:'2,602 kg', amp:'3 A', salida:'70 W', consumo:'36 W / 190 W (con PoE)', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'50 dB(A)'}),
  'AR5710-H2T4N2XW': F_H({fwd512:'13 Gbps', wan:'2 x 10GE combo', lan:'4 x 2.5GE + 2 x GE eléctricos', extra:[['Wi-Fi 7','Doble banda 2,4 y 5 GHz, 802.11a/b/g/n/ac/ax/be, hasta 256 usuarios, 3,57 Gbps de pico (690 Mbps a 2,4 GHz y 2,88 Gbps a 5 GHz)'],['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'43,6 × 320 × 210 mm', peso:'2,2 kg', amp:'2 A', salida:'70 W', consumo:'32,59 W / 47,8 W', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'50 dB(A)'}),
  'AR5710-H2T4N2XW-NRGL': F_H({fwd512:'13 Gbps', wan:'2 x 10GE combo · 5G SA/NSA con 2 SIM', lan:'4 x 2.5GE + 2 x GE eléctricos', extra:[['Wi-Fi 7','Doble banda 2,4 y 5 GHz, 802.11a/b/g/n/ac/ax/be, hasta 256 usuarios, 3,57 Gbps de pico'],['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'43,6 × 320 × 210 mm', peso:'2,264 kg', amp:'2 A', salida:'70 W', consumo:'34,93 W / 53 W', vent:'Ventiladores integrados fijos, flujo izquierda a derecha', ruido:'50 dB(A)'}),
  'AR5710-H2T4N2XW-Q': F_H({fwd512:'13 Gbps', wan:'2 x 10GE combo', lan:'4 x 2.5GE + 2 x GE eléctricos', extra:[['Wi-Fi 7','Doble banda 2,4 y 5 GHz, 802.11a/b/g/n/ac/ax/be, hasta 256 usuarios, 3,57 Gbps de pico'],['Gestión de APs (incluidos / máximo)','32 / 64']], dim:'43,6 × 320 × 210 mm', peso:'2,869 kg', amp:'1 A', salida:'70 W', consumo:'32,56 W / 46,2 W', vent:'Sin ventilador: disipación natural', ruido:'0 dB(A)'}),
  'AR5710I-RU-NRGL': {rev:'R26C00', doc:'Huawei NetEngine AR5710I-RU-NRGL Enterprise Router Data Sheet-R26C00', grupos:[
    {t:'Rendimiento por tamaño de paquete', f:[
      ['Reenvío IPv4, 512 bytes','13 Gbps'], ['IPsec, IMIX','800 Mbps'], ['IPsec, 512 bytes','1 Gbps'], ['IPsec, 1420 bytes','2,5 Gbps'],
      ['SD-WAN IPsec, 512 B / 1400 B','1,7 / 2,5 Gbps'], ['SD-WAN (IPsec + QoS), 512 B / 1400 B','1,4 / 2,3 Gbps'],
      ['SD-WAN típico, IMIX / 512 B / 1400 B','720 Mbps / 1 / 2 Gbps']]},
    {t:'Hardware', f:[
      ['Puertos fijos (WAN o LAN)','1 x 2.5GE eléctrico + 1 x 10GE SFP+'], ['5G integrado','SA/NSA, 2 SIM activo/standby; pico teórico SA 5,4 Gbps bajada y 500 Mbps subida'],
      ['Memoria / flash','4 GB / 1 GB NAND'], ['Consola / USB','USB 3.0 tipo A / 1 x USB 2.0'],
      ['Dimensiones (Al × An × Fo)','80,0 × 240,0 × 200,0 mm'], ['Peso sin embalaje','2,21 kg'], ['Montaje','Poste, pared o mesa'], ['Protección','IP65']]},
    {t:'Alimentación y ambiente', f:[
      ['Entrada','PoE –48 V DC (–42,5 a –57 V) o adaptador AC 110–220 V'], ['Consumo típico / máximo','15 W / 18,5 W'],
      ['Ventilación','Sin ventilador'], ['Ruido','0 dB(A)'], ['Temperatura de operación','–40 °C a +65 °C (sin radiación solar directa)'],
      ['Humedad','5 % a 95 % sin condensación'], ['Altitud','< 5000 m'], ['Temperatura de almacenamiento','–40 °C a +85 °C']]},
  ]},
  'AR6121E': F_AR6({wan:'2 x GE combo + 1 x 10GE SFP+ (compatible con GE SFP)', lan:'1 x GE combo + 8 x GE eléctricos (todos conmutables a WAN)', slots:'2 x SIC, WSIC 0 / 1', usb:'2 x USB 2.0', dim:'44,4 × 442,0 × 220,4 mm', peso:'3,2 kg', montaje:'Rack, mesa o pared', consumo:'28 W / 33 W', red:'Sin redundancia'}),
  'AR6140E-9G-2AC': F_AR6({wan:'2 x GE SFP + 2 x GE eléctricos', lan:'2 x GE SFP + 3 x GE eléctricos (todos conmutables a WAN)', slots:'4 x SIC, WSIC 0 / 2', usb:'1 x USB 2.0', dim:'44,4 × 442,0 × 428,2 mm', peso:'5,35 kg', montaje:'Rack', consumo:'22 W / 28 W', red:'Dos módulos de alimentación'}),
};
// Constructor general de la tarjeta «Ficha técnica» (2026-10-12, segunda tanda): tres grupos, con el
// documento y su edición. Las series anteriores (F_H, F_AR6) quedan como estaban.
const F_GEN = (doc, rev, rend, hw, ele) => ({rev, doc, grupos: [
  {t: 'Rendimiento publicado', f: rend},
  {t: 'Hardware', f: hw},
  {t: 'Alimentación y ambiente', f: ele},
]});
// AR5710-S y AR5710-SE: «Huawei NetEngine AR5710-S Series Enterprise Router Data Sheet-R25C10».
const DOC_S = 'Huawei NetEngine AR5710-S Series Enterprise Router Data Sheet-R25C10';
const REND_S = [['Reenvío (NAT + ACL + QoS), IMIX', '1,3 Gbps'], ['IPsec, IMIX / 512 B', '800 Mbps / 1 Gbps'],
  ['SD-WAN IPsec, IMIX / 512 B', '1 / 1,2 Gbps'], ['SD-WAN (IPsec + QoS), IMIX / 512 B', '800 Mbps / 1 Gbps'],
  ['SD-WAN típico, IMIX / 512 B', '620 / 700 Mbps']];
const REND_SE = [['Reenvío (NAT + ACL + QoS), IMIX', '1,5 Gbps'], ['IPsec, IMIX / 512 B', '800 Mbps / 1 Gbps'],
  ['SD-WAN IPsec, IMIX / 512 B', '1,2 / 1,7 Gbps'], ['SD-WAN (IPsec + QoS), IMIX / 512 B', '1 / 1,4 Gbps'],
  ['SD-WAN típico, IMIX / 512 B', '720 / 900 Mbps']];
const HW_S = (o) => [['Puertos WAN fijos', o.wan], ['Puertos LAN fijos', o.lan], ...(o.extra || []),
  ['Gestión de APs (incluidos / máximo)', o.aps || '16 / 32'], ['Memoria', o.mem || '2 GB'],
  ['Consola / USB', '1 x RJ45 / 1 x USB 2.0'], ['Dimensiones (Al × An × Fo)', o.dim || '43,6 × 321 × 210 mm'],
  ['Peso sin embalaje', o.peso], ['Montaje', o.montaje || 'Rack (1U) o mesa']];
const ELE_S = (o) => [['Tensión de entrada', '100–240 V, 50/60 Hz'], ['Corriente máxima', o.amp],
  ['Potencia de salida máxima', o.salida], ['Consumo típico / máximo', o.consumo],
  ['Ventilación', o.fan || 'Sin ventilador: disipación natural'], ['Ruido', o.ruido || '—'],
  ['Temperatura de operación', '0 °C a 45 °C'], ['Humedad', '5 % a 95 % sin condensación'],
  ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C']];
const COMBO = '2 x 10GE SFP+/2.5GE eléctrico combo';
const L44 = '4 x GE eléctricos + 4 x GE combo';
const PoE130 = ['PoE', '130 W en total: PoE 15,4 W en hasta 4 puertos, PoE+ 30 W en hasta 4, PoE++ 60 W en hasta 2 o 90 W en 1'];
Object.assign(FICHAS, {
  'AR5710-S8T2S': F_GEN(DOC_S, 'R25C10', REND_S, HW_S({wan: '2 x GE SFP', lan: '8 x GE eléctricos', peso: '1,79 kg'}), ELE_S({amp: '0,8 A', salida: '32 W', consumo: '14,6 W / 16 W'})),
  'AR5710-S8T2X': F_GEN(DOC_S, 'R25C10', REND_S, HW_S({wan: COMBO, lan: L44, peso: '1,902 kg'}), ELE_S({amp: '0,8 A', salida: '32 W', consumo: '12 W / 15 W'})),
  'AR5710-S8P2X': F_GEN(DOC_S, 'R25C10', REND_S, HW_S({wan: COMBO, lan: L44, extra: [PoE130], peso: '2,402 kg'}), ELE_S({amp: '3 A', salida: '180 W', consumo: '157 W / 162 W (con PoE)', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '50 dB(A)'})),
  'AR5710-S8T2X-LTE4EA': F_GEN(DOC_S, 'R25C10', REND_S, HW_S({wan: COMBO + ' · LTE4EA con 2 SIM', lan: L44, peso: '1,978 kg'}), ELE_S({amp: '1 A', salida: '32 W', consumo: '14 W / 19 W'})),
  'AR5710-S10T1X2': F_GEN(DOC_S, 'R25C10', REND_S, HW_S({wan: '1 x 10GE SFP+/2.5GE combo + 2 x GE eléctricos', lan: L44, extra: [['Ranuras SIC', '2 x SIC']], dim: '43,6 × 442 × 220 mm', peso: '3,18 kg'}), ELE_S({amp: '2 A', salida: '70 W', consumo: '15 W / 20 W', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '50 dB(A)'})),
  'AR5710-S8T2XE': F_GEN(DOC_S, 'R25C10', REND_SE, HW_S({wan: COMBO, lan: L44, aps: '16 / 64', mem: '4 GB', peso: '1,902 kg'}), ELE_S({amp: '0,8 A', salida: '32 W', consumo: '12 W / 15 W'})),
  'AR5710-S8T2XE-NRGL': F_GEN(DOC_S, 'R25C10', REND_SE, HW_S({wan: COMBO + ' · 5G SA/NSA con 2 SIM', lan: '8 x GE eléctricos', aps: '16 / 64', mem: '4 GB', peso: '2,250 kg'}), ELE_S({amp: '0,8 A', salida: '32 W', consumo: '20 W / 24 W'})),
  'AR5710-S8P2XE-NRGL': F_GEN(DOC_S, 'R25C10', REND_SE, HW_S({wan: COMBO + ' · 5G SA/NSA con 2 SIM', lan: '8 x GE eléctricos (4 PoE++)', extra: [PoE130], aps: '16 / 64', mem: '4 GB', peso: '2,696 kg'}), ELE_S({amp: '3 A', salida: '180 W', consumo: '25 W / 176 W (con PoE)', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '50 dB(A)'})),
  'AR5710-S8T1XWE-NRGL': F_GEN(DOC_S, 'R25C10', REND_SE, HW_S({wan: '1 x 10GE SFP+/2.5GE combo · 5G SA/NSA con 2 SIM', lan: '8 x GE eléctricos', extra: [['Wi-Fi 7', 'Doble banda 2,4 y 5 GHz, 802.11a/b/g/n/ac/ax/be, hasta 256 usuarios, 3,57 Gbps de pico (690 Mbps a 2,4 GHz y 2,88 Gbps a 5 GHz)']], aps: '16 / 64', mem: '4 GB', peso: '2,382 kg'}), ELE_S({amp: '0,8 A', salida: '32 W', consumo: '24 W / 27 W'})),
  'AR5710-S28T2S2XE4': F_GEN(DOC_S, 'R25C10', REND_SE, HW_S({wan: '2 x 10GE SFP+ + 2 x GE ópticos + 4 x GE eléctricos', lan: '24 x GE eléctricos', extra: [['Ranuras SIC', '4 x SIC'], ['MACsec', 'GE eléctricos 0–23, GE ópticos 24–25, 10GE ópticos 0']], aps: '16 / 64', mem: '4 GB', dim: '43,6 × 442 × 420 mm', peso: '5,175 kg', montaje: 'Rack (1U)'}), ELE_S({amp: '3 A', salida: '70 W', consumo: '29 W / 38 W', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '47,2 dB(A)'})),
  'AR5710-S52T2XE4': F_GEN(DOC_S, 'R25C10', REND_SE, HW_S({wan: '2 x 10GE SFP+ + 4 x GE eléctricos', lan: '48 x GE eléctricos', extra: [['Ranuras SIC', '4 x SIC'], ['MACsec', 'GE eléctricos 0–47, 10GE ópticos 0–1']], aps: '16 / 64', mem: '4 GB', dim: '43,6 × 442 × 420 mm', peso: '5,565 kg', montaje: 'Rack (1U)'}), ELE_S({amp: '3 A', salida: '150 W', consumo: '53 W / 65 W', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '49,3 dB(A)'})),
});
// AR650, AR610, AR6710-L, AR6710-H y AR8000 (2026-10-12, segunda tanda), de sus fichas de serie.
const DOC_650 = 'Huawei NetEngine AR650 Series Enterprise Routers Datasheet (20250810-v3)';
const REND_650 = [['Reenvío (NAT + ACL + QoS), IMIX', '1 Gbps (2 Gbps con la licencia Boost)'], ['IPsec, IMIX / 1400 B', '2 / 3,7 Gbps'],
  ['SD-WAN IPsec, IMIX / 1400 B', '1,5 / 3,5 Gbps'], ['SD-WAN (IPsec + QoS), IMIX / 1400 B', '800 Mbps / 1,85 Gbps'],
  ['SD-WAN típico, IMIX / 1400 B', '600 Mbps / 1,8 Gbps']];
const HW_650 = (o) => [['Puertos WAN fijos', '2 x GE combo'], ['Puertos LAN fijos', '8 x GE eléctricos (todos conmutables a WAN)'], ...(o.extra || []),
  ['Ranura MIC', '1 x MIC'], ['Memoria', '2 GB'], ['Consola / USB', '1 x RJ45 / 1 x USB 2.0'],
  ['Dimensiones (Al × An × Fo)', '44,0 × 300,0 × 220,3 mm'], ['Peso sin embalaje', o.peso], ['Montaje', 'Rack (1U), mesa o pared']];
const ELE_650 = (o) => [['Tensión de entrada', '100–220 V, 50/60 Hz'], ['Corriente máxima', o.amp], ['Potencia de salida máxima', o.salida],
  ['Consumo típico / máximo', o.consumo], ['Ventilación', 'Ventiladores integrados fijos, flujo izquierda a derecha'], ['Ruido', o.ruido],
  ['Temperatura de operación', '0 °C a 45 °C'], ['Humedad', '5 % a 95 % sin condensación'], ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C']];
const DOC_610 = 'Huawei NetEngine AR610 Series Enterprise Routers Datasheet-R26C00';
const REND_610 = [['Reenvío (dúplex, NAT + ACL + QoS), IMIX', '300 Mbps'], ['Reenvío IPv4, IMIX', '800 Mbps'], ['IPsec, IMIX / 1400 B', '200 / 300 Mbps'],
  ['SD-WAN IPsec, IMIX / 1400 B', '200 / 400 Mbps'], ['SD-WAN (IPsec + QoS), IMIX / 1400 B', '80 / 300 Mbps'], ['SD-WAN típico, IMIX / 1400 B', '50 / 250 Mbps']];
const ELE_610 = (consumo) => [['Tensión de entrada', '110–220 V, 50/60 Hz'], ['Corriente máxima', '0,8 A'], ['Potencia de salida máxima', '24 W'],
  ['Consumo típico / máximo', consumo], ['Ventilación', 'Sin ventilador: disipación natural'], ['Ruido', '0 dB(A)'], ['Temperatura de operación', '0 °C a 40 °C'], ['Humedad', '5 % a 95 % sin condensación'], ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C']];
const DOC_6L = 'Huawei NetEngine AR6710-L Series Enterprise Router Data Sheet-R26C00';
const REND_6L = (r) => [['Reenvío IPv4, 512 bytes', r.f512], ['IPsec, IMIX / 512 B / 1420 B', r.ip], ['SD-WAN IPsec, IMIX / 512 B / 1400 B', r.sdi],
  ['SD-WAN (IPsec + QoS), IMIX / 512 B / 1400 B', r.sd], ['SD-WAN típico, IMIX / 512 B / 1400 B', r.ty]];
const HW_6L = (o) => [['Puertos WAN fijos', o.wan], ['Puertos LAN fijos', o.lan], ['Ranuras SIC / WSIC (por defecto / máximo)', o.slots],
  ['Gestión de APs (incluidos / máximo)', '32 / 128'], ['Memoria / flash', '4 GB / 2 GB'], ['Dimensiones (Al × An × Fo)', o.dim],
  ['Peso sin embalaje', o.peso], ['Montaje', 'Rack (1U)']];
const ELE_6L = (o) => [['Tensión de entrada', o.vin], ['Potencia de salida máxima', o.salida], ['Consumo típico / máximo', o.consumo],
  ['Redundancia de alimentación', o.red], ['Ventilación', o.fan], ['Ruido', o.ruido], ['Temperatura de operación', '0 °C a 45 °C'],
  ['Humedad', '5 % a 95 % sin condensación'], ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C']];
const AC_DC = 'AC 100–240 V, 50/60 Hz; DC –48 a –60 V';
const AC_ONLY = 'AC 100–240 V, 50/60 Hz';
const DOC_8K = 'Huawei NetEngine AR8000 Series Enterprise Router Data Sheet-R25C10';
const REND_8140 = [['Reenvío (NAT + ACL + QoS), IMIX', '25 Gbps'], ['IPsec, IMIX / 512 B', '20 / 25 Gbps'], ['SD-WAN IPsec, IMIX / 512 B', '22 / 26 Gbps'],
  ['SD-WAN (IPsec + QoS), IMIX / 512 B', '20 / 21 Gbps'], ['SD-WAN típico, IMIX / 512 B', '15 / 17 Gbps']];
const HW_8140 = (tpm) => [['Puertos WAN fijos', '10 x 10GE SFP+, 8 x GE combo, 4 x GE eléctricos (todos conmutables a LAN)'], ['Ranuras SIC / WSIC (por defecto / máximo)', '4 SIC; WSIC 0 / 2'],
  ['TPM', tpm], ['Gestión de APs (incluidos / máximo)', '32 / 1024'], ['Memoria (SPU / MPU)', '16 GB / 16 GB'], ['Consola / USB', '1 x RJ45 / 1 x USB 3.0'],
  ['Dimensiones (Al × An × Fo)', '44,4 × 442,0 × 420,0 mm (442,5 mm hasta el asa trasera)'], ['Montaje', 'Rack (1U)']];
const ELE_8140 = [['Tensión de entrada', 'AC 100–240 V; HVDC 240 V; DC –48/–60/+48 V'], ['Potencia de salida máxima', 'AC 350 W · HVDC 350 W · DC 240 W'],
  ['Consumo típico / máximo', '168 W / 191 W'], ['Redundancia de alimentación', 'Dos fuentes, intercambiables en caliente'],
  ['Ventilación', 'Módulos de ventilador integrados, flujo izquierda a derecha'], ['Ruido', '57,6 dB(A)'], ['Temperatura de operación', '0 °C a 45 °C'],
  ['Humedad', '5 % a 95 % sin condensación'], ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C']];
Object.assign(FICHAS, {
  'AR651': F_GEN(DOC_650, '20250810-v3', REND_650, HW_650({peso: '1,8 kg'}), ELE_650({amp: '3 A', salida: '36 W', consumo: '25,2 W / 29 W', ruido: '41,9 dB(A)'})),
  'AR651W-8P': F_GEN(DOC_650, '20250810-v3', REND_650, HW_650({extra: [['Wi-Fi', 'Doble banda 2,4 y 5 GHz, 802.11a/b/g/n/ac'], ['PoE', 'PoE+ en GE0 a GE7, hasta 100 W en total: PoE 15,4 W en hasta 6 puertos o PoE+ 30 W en hasta 3']], peso: '1,92 kg'}),
    ELE_650({amp: 'Adaptador 12 V: 1,5 A; adaptador 48 V: 2 A', salida: 'Adaptador 12 V: 60 W; adaptador 48 V: 100 W', consumo: 'Con 12 V: 40 W típicos / 46 W máx.; con 48 V: máx. 115 W', ruido: '50 dB(A)'})),
  'AR611': F_GEN(DOC_610, 'R26C00', REND_610, [['Puertos WAN fijos', '1 x GE combo'], ['Puertos LAN fijos', '4 x GE eléctricos (todos conmutables a WAN)'],
    ['Memoria / flash', '1 GB / 1 GB'], ['Consola / USB', '1 x RJ45 / 1 x USB 2.0'], ['Dimensiones (Al × An × Fo)', '38,0 × 240,0 × 161,5 mm'], ['Peso sin embalaje', '0,58 kg'], ['Montaje', 'Mesa o pared']], ELE_610('8 W / 12 W')),
  'AR617VW-LTE4': F_GEN(DOC_610, 'R26C00', REND_610, [['Puertos WAN fijos', '1 x GE combo + 1 x VDSL2 + 1 x LTE CAT4'], ['Puertos LAN fijos', '4 x GE eléctricos (todos conmutables a WAN)'],
    ['Voz', '2 x FXS (RTP, SIP, SIP AG, IP PBX/TDM PBX, VoIP, SBC)'], ['Wi-Fi 5', 'Doble banda 2,4 y 5 GHz, 802.11a/b/g/n/ac, 866 Mbps'], ['xDSL', 'ADSL Anexos A, M, B y J; VDSL2 con vectoring'],
    ['Memoria / flash', '1 GB / 1 GB'], ['Consola / USB', '1 x RJ45 / 1 x USB 2.0'], ['Dimensiones (Al × An × Fo)', '38,0 × 240,0 × 161,5 mm'], ['Peso sin embalaje', '0,69 kg'], ['Montaje', 'Mesa o pared']], ELE_610('13,6 W / 17 W')),
  'AR6710-L26T2X4': F_GEN(DOC_6L, 'R26C00', REND_6L({f512: '26 Gbps', ip: '1,6 / 2 / 5 Gbps', sdi: '2 / 2,6 / 6 Gbps', sd: '1,5 / 2,2 / 4,5 Gbps', ty: '1,2 / 1,6 / 4 Gbps'}),
    HW_6L({wan: '2 x 10GE ópticos + 2 x GE eléctricos', lan: '24 x GE eléctricos', slots: '4 SIC; WSIC 0 / 2', dim: '44,4 × 442,0 × 420 mm', peso: '5,62 kg'}),
    ELE_6L({vin: AC_DC, salida: 'AC 350 W · DC 240 W', consumo: '68 W / 98 W', red: 'Dos fuentes, intercambiables en caliente', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '57,2 dB(A)'})),
  'AR6710-L50T2X4': F_GEN(DOC_6L, 'R26C00', REND_6L({f512: '26 Gbps', ip: '1,6 / 2 / 5 Gbps', sdi: '2 / 2,6 / 6 Gbps', sd: '1,5 / 2,2 / 4,5 Gbps', ty: '1,2 / 1,6 / 4 Gbps'}),
    HW_6L({wan: '2 x 10GE ópticos + 2 x GE eléctricos', lan: '48 x GE eléctricos', slots: '4 SIC; WSIC 0 / 2', dim: '44,4 × 442,0 × 420 mm', peso: '5,75 kg'}),
    ELE_6L({vin: AC_DC, salida: 'AC 350 W · DC 240 W', consumo: '83 W / 115 W', red: 'Dos fuentes, intercambiables en caliente', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '57,2 dB(A)'})),
  'AR6710-L8T3TS1X2': F_GEN(DOC_6L, 'R26C00', REND_6L({f512: '10 Gbps', ip: '1,6 / 2 / 5 Gbps', sdi: '2 / 2,6 / 6 Gbps', sd: '1,5 / 2,2 / 4,5 Gbps', ty: '1,2 / 1,6 / 4 Gbps'}),
    HW_6L({wan: '1 x 10GE óptico + 2 x GE combo', lan: '1 x GE combo + 8 x GE eléctricos', slots: '2 SIC; WSIC 0 / 1', dim: '44,4 × 442,0 × 220,4 mm', peso: '3,2 kg'}),
    ELE_6L({vin: AC_ONLY, salida: 'AC 70 W', consumo: '27 W / 33 W', red: 'No aplica (una fuente)', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '45,3 dB(A)'})),
  'AR6710-L14T2X4': F_GEN(DOC_6L, 'R26C00', REND_6L({f512: '20 Gbps', ip: '2,5 / 2,8 / 6,5 Gbps', sdi: '3 / 4 / 10 Gbps', sd: '2,5 / 3,2 / 8 Gbps', ty: '1,8 / 2,5 / 6 Gbps'}),
    HW_6L({wan: '2 x 10GE ópticos + 2 x GE eléctricos', lan: '4 x GE combo + 8 x GE eléctricos', slots: '4 SIC; WSIC 0 / 2', dim: '43,6 × 442,0 × 420 mm', peso: '5,612 kg'}),
    ELE_6L({vin: AC_ONLY, salida: 'AC 150 W', consumo: '41 W / 52 W', red: 'Dos fuentes, no intercambiables en caliente', fan: 'Ventiladores integrados fijos, flujo izquierda a derecha', ruido: '57,2 dB(A)'})),
  'AR6710-H4T4X2Y7': F_GEN('Huawei NetEngine AR6710-H Series Enterprise Router Data Sheet-R25C10', 'R25C10',
    [['Reenvío (NAT + ACL + QoS), IMIX', '13 Gbps'], ['IPsec, IMIX / 512 B', '10 / 12 Gbps'], ['SD-WAN IPsec, IMIX / 512 B', '11 / 15 Gbps'],
      ['SD-WAN (IPsec + QoS), IMIX / 512 B', '9 / 12 Gbps'], ['SD-WAN típico, IMIX / 512 B', '7 / 9 Gbps']],
    [['Puertos WAN fijos', '2 x 25GE SFP28 + 4 x 10GE SFP+ + 4 x GE eléctricos (todos conmutables a LAN)'], ['Ranuras SIC / WSIC (por defecto / máximo)', '6 SIC; WSIC 1 / 4'],
      ['Gestión de APs (incluidos / máximo)', '32 / 512'], ['Memoria', '8 GB'], ['Consola / USB', '1 x RJ45 / 1 x USB 2.0'],
      ['Dimensiones (Al × An × Fo)', '43,6 × 442,0 × 420,0 mm (467,8 mm hasta el asa trasera)'], ['Montaje', 'Rack (1U)']],
    [['Tensión de entrada', AC_DC], ['Potencia de salida máxima', 'AC 300 W · DC 260 W'], ['Consumo típico / máximo', 'Una SRU: 83 W / 92 W · dos SRU: 145 W / 160 W'],
      ['Redundancia de alimentación', 'Dos fuentes, intercambiables en caliente'], ['Ventilación', 'Dos módulos de ventilador, intercambiables en caliente, flujo izquierda a derecha'],
      ['Ruido', '54,3 dB(A)'], ['Temperatura de operación', '0 °C a 45 °C'], ['Humedad', '5 % a 95 % sin condensación'], ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C']]),
  'AR8140-12G10XG': F_GEN(DOC_8K, 'R25C10', REND_8140, HW_8140('No soportado'), ELE_8140),
  'AR8140-T-12G10XG': F_GEN(DOC_8K, 'R25C10', REND_8140, HW_8140('Soportado (solo el modelo -T)'), ELE_8140),
  'AR8700-8': F_GEN(DOC_8K, 'R25C10',
    [['Reenvío (NAT + ACL + QoS), IMIX', '30 Gbps'], ['IPsec, IMIX / 512 B', '20 / 25 Gbps'], ['SD-WAN IPsec, IMIX / 512 B', '24 / 28 Gbps'],
      ['SD-WAN (IPsec + QoS), IMIX / 512 B', '20 / 22 Gbps'], ['SD-WAN típico, IMIX / 512 B', '15,5 / 18 Gbps']],
    [['Puertos WAN fijos', '1 x 40GE QSFP+ + 8 x 10GE SFP+ + 8 x GE combo (todos conmutables a LAN)'], ['Ranuras SIC / WSIC (por defecto / máximo)', '8 SIC; WSIC 0 / 4'],
      ['TPM', 'No soportado'], ['Gestión de APs (incluidos / máximo)', '32 / 1024'], ['Memoria (SPU / MPU)', '16 GB / 8 GB'], ['Consola / USB', '1 x RJ45 / 1 x USB 2.0'],
      ['Dimensiones (Al × An × Fo)', '88,1 × 442,0 × 482,8 mm (525,1 mm hasta el asa trasera)'], ['Montaje', 'Rack (2U)']],
    [['Tensión de entrada', 'AC 110/220 V, 50/60 Hz; HVDC 240 V; DC –48 a –60 V'], ['Potencia de salida máxima', 'Fuente de 600 W: AC 300 W a 100–130 V y 600 W a 200–240 V · fuente de 1000 W: AC 900/1000 W, HVDC y DC 1000 W'],
      ['Consumo típico / máximo', '221 W / 288 W (SPU + 2 MPU + ventiladores)'], ['Redundancia de alimentación', 'Dos fuentes, intercambiables en caliente'],
      ['Ventilación', 'Bandeja de ventiladores enchufable, flujo lateral trasero + frontal a trasero'], ['Ruido', '57,6 dB(A)'], ['Temperatura de operación', '0 °C a 45 °C'],
      ['Humedad', '5 % a 95 % sin condensación'], ['Altitud', '< 5000 m'], ['Temperatura de almacenamiento', '–40 °C a +70 °C']]),
});
// NetEngine NE8000 y A800 E (2026-10-12, segunda tanda): las fichas publican una tabla corta por
// plataforma. El CONSUMO TÍPICO no se repite aquí: ya está en «Alimentación eléctrica» con la
// decisión de cada modelo (el M1A y el M1D, por ejemplo, difieren entre el resumen y la tabla de su
// ficha), y mostrarlo dos veces con dos cifras sería peor que mostrarlo una.
const NE = (doc, rend, hw, amb) => F_GEN(doc, null, rend, hw, amb);
const VOLT_M = 'DC –40 a –72 V; AC 200–240 V / 100–127 V (dos fases vivas), compatible con 240 V HVDC';
const IFZ_M = '400GE/100GE/50GE/40GE/25GE/10GE/GE/FE/E1/cPOS/POS/V.35/X.21/V.24/C37.94&CoDir64K/FXS/FXO/E&M/RS232/RS485';
const NE_BOX = (cap, ifz, modos) => NE('NetEngine 8000 Universal Service Router Datasheet (serie M1)',
  [['Capacidad de conmutación', cap]],
  [['Tipos de interfaz', ifz], ['Tarjeta de control', 'Caja fija'], ['Dimensiones (An × Fo × Al)', '442 × 220 × 44,5 mm (1U)'], ...(modos ? [['Configuraciones de puertos', modos]] : [])],
  [['Tensión', 'AC 200–240 V / 100–127 V (dos fases vivas), compatible con 240 V HVDC; DC –48/–60 V'], ['Temperatura de operación', '–40 °C a +65 °C']]);
Object.assign(FICHAS, {
  'NE8000 M6': NE('NetEngine 8000 M6 Universal Service Router Datasheet',
    [['Capacidad de conmutación (CXP-160)', '320 Gbps'], ['Reenvío', '72 Mpps'], ['Capacidad máxima por tarjeta', '50GE']],
    [['Tipos de interfaz', '50GE/40GE/25GE/10GE/GE/FE/E1/cPOS/POS/V.35/X.21/V.24/C37.94&CoDir64K/FXS/FXO/E&M/RS232/RS485'], ['Tarjeta de control', '2, en 1:1'], ['Ranuras de servicio', '6 (DC) · 4 (AC)'], ['Dimensiones (An × Fo × Al)', '442 × 220 × 88,9 mm (2U)']],
    [['Tensión', 'DC –48/–60 V; AC 200–240 V / 100–127 V (dos fases vivas), compatible con 240 V HVDC'], ['Reloj', '1588v2 y Ethernet síncrono'], ['Temperatura de operación', 'DC –40 °C a +65 °C; AC –20 °C a +55 °C']]),
  'NE8000 M8': NE('NetEngine 8000 M8 Universal Service Router Datasheet',
    [['Capacidad de conmutación', 'IPU-480: 960 Gbps · IPU-1T2: 2,4 Tbps · IPU-2T4: 4,8 Tbps'], ['Capacidad máxima por tarjeta', 'IPU-480 y IPU-1T2: 100GE · IPU-2T4: 400GE']],
    [['Tipos de interfaz', IFZ_M + ' (la IPU-480 y la IPU-1T2 no admiten 400GE)'], ['Tarjeta de control', '2, en 1:1'], ['Ranuras de servicio', '8 (DC) · 6 (4 AC)'], ['Dimensiones (An × Fo × Al)', '442 × 220 × 132,6 mm (3U)']],
    [['Tensión', VOLT_M], ['Reloj', 'ITU-T G.8275.1, G.8265.1, G.8275.2, SyncE, ITU-T G.8273.2 Clase C'], ['Temperatura de operación', 'DC –40 °C a +65 °C; AC –5 °C a +55 °C']]),
  'NE8000 M14': NE('NetEngine 8000 M14 Universal Service Router Datasheet',
    [['Capacidad de conmutación', 'IPU-1T2: 2,4 Tbps · IPU-2T: 4 Tbps · IPU-3T6: 7,2 Tbps'], ['Capacidad máxima por tarjeta', 'IPU-1T2: 200GE · IPU-2T e IPU-3T6: 400GE']],
    [['Tipos de interfaz', IFZ_M + ' (la IPU-1T2 no admite 400GE)'], ['Tarjeta de control', '2, en 1:1'], ['Ranuras de servicio', 'IPU-1T2 e IPU-2T: 14 (DC) · 10 (4 AC). IPU-3T6: 14 (DC) · 12 (2 AC) · 10 (4 AC)'], ['Dimensiones (An × Fo × Al)', '442 × 220 × 222 mm (5U)']],
    [['Tensión', VOLT_M], ['Reloj', 'ITU-T G.8275.1, G.8265.1, G.8275.2, SyncE, ITU-T G.8273.2 Clase C'], ['Temperatura de operación', 'DC –20 °C a +55 °C; AC –20 °C a +55 °C']]),
  'NE8000 F8': NE('NetEngine 8000 F8 Datasheet',
    [['Capacidad de conmutación', 'Versión 2T: 4 Tbps · versión 6.4T: 12,8 Tbps'], ['Capacidad máxima por tarjeta', '2T: 400GE · 6.4T: 800GE']],
    [['Tipos de interfaz', '400GE/100GE/50GE/40GE/25GE/10GE/GE/FE/E1/STM-1c/STM-4c/2.5GE POS'], ['Tarjeta de control', '2, en 1:1'], ['Ranuras de servicio', '8, con tarjetas hijas y unidades de procesamiento combinadas: hasta 32 PIC y 8 LPUC'], ['Dimensiones', '442 × 482,8 × 578,5 mm (13U)']],
    [['Tensión', 'DC –40 a –72 V; AC 90–290 V; HVDC 190–290 V'], ['Reloj', 'Ethernet síncrono, 1588v2, G.8275.1, G.8275.2, SMPTE-2059'], ['Temperatura de operación (largo plazo)', '0 °C a 45 °C']]),
  'NE8000 M4': NE('NetEngine 8000 M4 Universal Service Router Datasheet',
    [['Capacidad de conmutación', '2,4 Tbps'], ['Reenvío', '405 Mpps'], ['Capacidad máxima por tarjeta', '400GE'], ['Rutas máximas (FIBv4 / FIBv6)', 'Hasta 8 M / 4 M'], ['Túneles IPsec máximos', '20.000']],
    [['Tipos de interfaz', '400G/100GE/50GE/40GE/25GE/10GE/GE/FE/E1/cPOS/POS'], ['Tarjeta de control', 'Simple'], ['Almacenamiento M.2', '16 GB'], ['Ranuras de servicio', '4'], ['Dimensiones (An × Fo × Al)', '442 × 220 × 88,9 mm (2U)']],
    [['Tensión', 'DC –48/–60 V; AC 200–240 V / 100–127 V (dos fases vivas), compatible con 240 V HVDC'], ['Reloj', '1588v2, 1588 ATR, 1588 ACR, G.8275.1, Ethernet síncrono'], ['Temperatura de operación', 'DC –20 °C a +60 °C; AC –20 °C a +55 °C']]),
  'NE8000 M1A': NE_BOX('352 Gbps', '10GE/GE/FE(o)/FE(e)', '4 x 10G + 8 x GE(o) + 4 x GE(e); o 6 x 10G + 22 x GE(o) + 4 x GE(e)'),
  'NE8000 M1C': NE_BOX('344 Gbps', '10GE/GE/FE(o)/FE(e)', 'Básica: 4 x 10G + 8 x GE(o) + 4 x GE(e); estándar: 6 x 10G + 18 x GE(o) + 4 x GE(e)'),
  'NE8000 M1D': NE_BOX('1,76 Tbps', '100GE/50GE/40GE/25GE/10GE/GE/FE(o)/FE(e)', null),
  'NE8000 M1D-B': NE_BOX('368 Gbps', '50GE/40GE/25GE/10GE/GE/FE(o)/FE(e)', null),
  'NE8000 F1A': NE('NetEngine 8000 F1A Datasheet V800R024C10',
    [['Capacidad de conmutación', '2,4 Tbps']],
    [['Tipos de interfaz', '100GE/50GE/40GE/25GE/10GE/GE'], ['Dimensiones (Al × An × Fo)', '43,6 (1U) × 442 × 420 mm']],
    [['Tensión', 'DC –40 a –72 V; AC 90–290 V; HVDC 190–290 V'], ['Reloj', 'Ethernet síncrono, 1588v2, G.8275.1, G.8275.2, SMPTE-2059'], ['Temperatura de operación (largo plazo)', '–5 °C a 45 °C']]),
  'NetEngine A813 E': NE('NetEngine A813 E Datasheet V800R025C00',
    [], [['Tipos de interfaz', '6 x GE/FE ópticos + 8 x GE/FE eléctricos'], ['Tarjeta de control y ranuras', 'Caja fija'], ['Alimentación', 'Una AC, dos AC, o una AC + una DC'], ['Dimensiones (An × Fo × Al)', '320 × 220 × 43,6 mm (1U)'], ['Disipación', 'Natural']],
    [['Tensión', 'AC 100–240 V; DC ±48 V / +24 a 12 V'], ['Temperatura de operación (largo plazo)', '–5 °C a 55 °C']]),
  'NetEngine A816 E': NE('NetEngine A816 E Datasheet V800R025C00',
    [['IPsec', '300 Mbps @ 512 B'], ['NAT', '600 Mbps @ 512 B']],
    [['Tipos de interfaz', '4 x GE/FE ópticos + 4 x GE/FE eléctricos'], ['Tarjeta de control y ranuras', 'Caja fija'], ['Alimentación', 'Una AC, dos AC, o una AC + una DC'], ['Dimensiones (An × Fo × Al)', '320 × 220 × 43,6 mm (1U)'], ['Disipación', 'Natural']],
    [['Tensión', 'AC 100–240 V; DC ±48 V / +24 a 12 V'], ['Temperatura de operación (largo plazo)', '–5 °C a 50 °C']]),
  'NetEngine A821 E': NE('NetEngine A821 E Datasheet (presentación)',
    [['Capacidad', '72 Gbit/s']],
    [['Tipos de interfaz', '6 x 10GE + 4 x GE/FE ópticos + 8 x GE/FE eléctricos'], ['Tarjeta de control y ranuras', 'Caja fija'], ['Alimentación', 'Una AC, dos AC, o una AC + una DC'], ['Dimensiones (An × Fo × Al)', '320 × 220 × 43,6 mm (1U)'], ['Disipación', 'Natural']],
    [['Tensión', 'AC 100–240 V; DC ±48 V / +24 a 12 V'], ['Temperatura de operación (largo plazo)', '–40 °C a 65 °C']]),
  'NetEngine A822 E': NE('NetEngine A822 E Datasheet V800R025C00 (presentación)',
    [['Capacidad', '20 Gbit/s']],
    [['Tipos de interfaz', '2 x 10GE + 4 x GE/FE ópticos + 8 x GE/FE eléctricos'], ['Tarjeta de control y ranuras', 'Caja fija'], ['Alimentación', 'Una AC, dos AC, o una AC + una DC'], ['Dimensiones (An × Fo × Al)', '320 × 220 × 43,6 mm (1U)'], ['Disipación', 'Natural']],
    [['Tensión', 'AC 100–240 V; DC ±48 V / +24 a 12 V'], ['Temperatura de operación (largo plazo)', '–5 °C a 55 °C']]),
  'NE8000 X4': NE('NetEngine 8000 X Series Brochure',
    [['Capacidad por ranura', '1T/2T/4T/14,4T/19,2T']],
    [['Ranuras de servicio', '4'], ['Dimensiones (An × Fo × Al)', '442 × 872 × 437,4 mm (9,8U)'], ['Peso sin embalaje', '72 kg']], []),
  'NE8000 X8': NE('NetEngine 8000 X Series Brochure',
    [['Capacidad por ranura', '1T/2T/4T/9,6T/14,4T/19,2T']],
    [['Ranuras de servicio', '8'], ['Dimensiones (An × Fo × Al)', '442 × 872 × 703 mm (15,8U)'], ['Peso sin embalaje', '94 kg']], []),
  'NE8000 X16': NE('NetEngine 8000 X Series Brochure',
    [['Capacidad por ranura', '1T/2T/9,6T/14,4T']],
    [['Ranuras de servicio', '16'], ['Dimensiones (An × Fo × Al)', '442 × 1033 × 1436 mm (32,3U)'], ['Peso sin embalaje', '244,8 kg']], []),
});
FICHAS['NE8000 F1A-C'] = NE('NetEngine 8000 F1A-C Datasheet',
  [['Capacidad de conmutación', '2,4 Tbps'], ['Capacidad máxima de puertos', '1,2 Tbps']],
  [['Tipos de interfaz', '100GE/50GE/40GE/25GE/10GE/GE'], ['Puertos', '28 x 10GE/GE, 8 x 25GE/10GE/GE, 12 x 25GE/10GE y 8 x 100GE (los 100GE admiten 4 x 25GE o 4 x 10GE por ruptura); hasta 56 puertos'], ['Dimensiones (Al × An × Fo)', '43,6 × 442 × 420 mm (1U)']],
  [['Tensión', 'DC –40 a –72 V; AC 90–290 V; HVDC 190–290 V'], ['Reloj', 'Ethernet síncrono, 1588v2, G.8275.1, G.8275.2, SMPTE-2059'], ['Temperatura de operación (largo plazo)', '–5 °C a 45 °C']]);
for (const m of MODELS) if (FICHAS[m.id]) m.ficha = FICHAS[m.id];

// CAPACIDADES SD-WAN DE LA LINEA AR (2026-10-14, encargo del dueño: «el dimensionador no trae de la
// ficha las capacidades de SD-WAN, como la cantidad de tuneles o EVPN»). Todo sale de las mismas
// fichas de serie que ya respaldan `fwd`/`ipsec`/`typ` (`fuentes.js`), releidas enteras con
// pdftotext desde sus copias de Actions (ramas fuente/cisco-huawei y fuente/huawei-familias-2026-10-12):
//   · las dos filas SD-WAN que el motor no usaba: «SD-WAN IPsec performance» (solo IPsec) y «SD-WAN
//     performance» (IPsec + QoS), IMIX, suma de los dos sentidos como `typ`;
//   · la tabla «Software Features and Protocols» (filas VPN, WAN optimization, Multicast, MPLS y
//     Security) y la memoria;
//   · la «Ordering Information» de licencias: el paquete N1 de cada serie, la suscripcion de
//     amenazas por años y los paquetes de valor añadido (DSVPN, compresion).
// TRES ESTADOS, como FlexE: `true` lo lista la ficha; `false` la ficha lo RESTRINGE con nota al pie
// («Supported only by the NetEngine AR5710-SE series routers with 4 GB memory»); `null` la tabla no
// lo lista, que es «no consta» y no «no lo soporta». El motor aparta solo por `false`.
// TUNELES Y SESIONES: NINGUNA FICHA AR LOS PUBLICA, ni la ficha de la solucion SD-WAN (R25C00, leida
// el 2026-10-14: no da topes de tuneles, sedes, rutas ni VPN por modelo). Viven en la consulta de
// especificaciones de Info-Finder, que pide la sesion de una cuenta Huawei: quedan en null.
const TUNELES_MOTIVO = 'Huawei no publica el tope de túneles (IPsec ni SD-WAN EVPN), de sesiones ni de rutas: ni en la ficha de ningún AR, ni en la de su solución SD-WAN (R25C00), ni en la consulta de especificaciones de Info-Finder (comprobado el 2026-10-14 con sesión). Hay que pedirlo a Huawei o al configurador eDeal.';
// Suscripcion de amenazas por años, como la lista la ficha: {años: codigo}. Datos planos (viajan por
// SQLite como JSON): ni funciones ni patrones.
const anualTP = (base, paso) => Object.fromEntries([1, 2, 3, 4, 5].map((a) => [a, 'LAR0TP' + (base + paso * (a - 1))]));
const TP = (prefijo) => Object.fromEntries([1, 2, 3, 4, 5].map((a) => [a, prefijo + a]));
const SDWAN_SERIE = {
  AR610: {doc: 'Huawei NetEngine AR610 Series Enterprise Routers Datasheet-R26C00', mem: '1 GB',
    vpn: 'IPsec VPN, GRE, Ethernet over GRE, DSVPN, A2A VPN, L2TP, L2TPv3, VXLAN, SD-WAN EVPN',
    evpn: true, dsvpn: true, srv6: null, mpls: null, mcast: null, fec: null, compresion: null, ips: null, url: null, av: null, macsec: null,
    n1: {sin: 'N1-Campus-F-610/630', f: 'N1-LANWAN-F-610/630', a: 'N1-LANWAN-A-610/630'}, amenazas: null, paquetes: []},
  AR650: {doc: 'Huawei NetEngine AR650 Series Enterprise Routers Datasheet_20250810-v3', mem: '2 GB',
    vpn: 'IPsec VPN, GRE, DSVPN, A2A VPN, L2TP, L2TPv3, Ethernet over GRE, VXLAN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: null, mpls: true, mcast: null, fec: 'FEC', compresion: null, ips: true, url: true, av: true, macsec: null,
    n1: {sin: 'N1-Campus-F-AR650', f: 'N1-LANWAN-F-AR650', a: 'N1-LANWAN-A-AR650'}, amenazas: anualTP(1001, 3),
    paquetes: [{sku: 'LAR0SECE08', d: 'AR650 Value-Added Security Package: SAC, DSVPN, Efficient VPN, IPS, antivirus y filtrado URL', para: 'utm'}]},
  AR6000: {doc: 'Huawei NetEngine AR6000 Series Enterprise Routers Datasheet-R26C00', mem: '4 GB',
    vpn: 'IPsec VPN, GRE, Ethernet over GRE, DSVPN, A2A VPN, L2TP, L2TPv3, VXLAN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: null, mpls: true, mcast: null, fec: 'FEC', compresion: null, ips: true, url: true, av: true, macsec: null,
    nota: 'La optimización WAN (FEC, multi-fed y balanceo por paquete) exige V300R019C13 o posterior (nota de la ficha).',
    n1: {sin: 'N1-Campus-F-AR6100', f: 'N1-LANWAN-F-AR6100', a: 'N1-LANWAN-A-AR6100'}, amenazas: anualTP(1003, 3),
    paquetes: [{sku: 'LAR0SECE10', d: 'AR6100 Value-Added Security Package: SAC, DSVPN, Efficient VPN, A2A VPN, IPS, antivirus y filtrado URL', para: 'utm'}]},
  'AR5710-S': {doc: 'Huawei NetEngine AR5710-S Series Enterprise Router Data Sheet-R25C10', mem: '2 GB',
    vpn: 'GRE, GRE over IPsec, Ethernet over GRE, IPsec v4/v6, IKEv1/v2, SRv6, L2TP client, DSVPN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: false, compresion: null, ips: false, url: false, av: false,
    macsec: 'Solo el AR5710-S10 con la tarjeta SIC-2X2S-V2',
    nota: 'A-FEC, IPS, filtrado URL y antivirus: «Supported only by the NetEngine AR5710-SE series routers with 4 GB memory» (nota de la ficha). Esta variante tiene 2 GB.',
    n1: {sin: 'N1-AR57-B', f: 'N1-AR57-F', a: 'N1-AR57-A'}, amenazas: null,
    paquetes: [{sku: 'AR57-LIC-NETCONN', d: 'AR5700 Value-added Network Connection Package: DSVPN', para: 'dsvpn'}]},
  'AR5710-SE': {doc: 'Huawei NetEngine AR5710-S Series Enterprise Router Data Sheet-R25C10', mem: '4 GB',
    vpn: 'GRE, GRE over IPsec, Ethernet over GRE, IPsec v4/v6, IKEv1/v2, SRv6, L2TP client, DSVPN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: 'A-FEC', compresion: null, ips: true, url: true, av: true,
    macsec: 'AR5710-S28 y S52 en parte de los puertos del panel, o con la tarjeta SIC-2X2S-V2',
    n1: {sin: 'N1-AR57-B', f: 'N1-AR57-F', a: 'N1-AR57-A'}, amenazas: TP('LAR0TP140'),
    paquetes: [{sku: 'AR57-LIC-NETCONN', d: 'AR5700 Value-added Network Connection Package: DSVPN', para: 'dsvpn'}]},
  'AR5710-H': {doc: 'Huawei NetEngine AR5710-H Series Enterprise Router Data Sheet-R26C00', mem: '4 GB',
    vpn: 'GRE, GRE over IPsec, Ethernet over GRE, IPsec v4/v6, SRv6, L2TP client y LNS, DSVPN, SD-WAN EVPN; MPLS L3VPN y L2VPN (VPWS)',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: 'A-FEC', compresion: true, ips: true, url: true, av: true, macsec: null,
    n1: {sin: 'N1-AR57-B', f: 'N1-AR57-F', a: 'N1-AR57-A'}, amenazas: TP('LAR0TP140'),
    paquetes: [{sku: 'AR57-LIC-NETCONN', d: 'AR5700 Value-added Network Connection Package: DSVPN', para: 'dsvpn'},
      {sku: 'AR57-LIC-Enh-WANOP', d: 'AR5700 Value-added Enhanced WAN-Optimize Package: compresión de datos', para: 'compresion'}]},
  'AR5710-I': {doc: 'Huawei NetEngine AR5710I-RU-NRGL Enterprise Router Data Sheet-R26C00', mem: '4 GB',
    vpn: 'GRE, IPsec v4/v6, SRv6, L2TP client y LNS, DSVPN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: 'A-FEC', compresion: null, ips: true, url: true, av: true, macsec: null,
    n1: {sin: 'N1-AR57-B', f: 'N1-AR57-F', a: 'N1-AR57-A'}, amenazas: TP('LAR0TP140'),
    paquetes: [{sku: 'AR57-LIC-NETCONN', d: 'AR5700 Value-added Network Connection Package: DSVPN', para: 'dsvpn'}]},
  'AR6700-L': {doc: 'Huawei NetEngine AR6710-L Series Enterprise Router Data Sheet-R26C00', mem: '4 GB',
    vpn: 'GRE, Ethernet over GRE, IPsec v4/v6, SRv6, L2TP client y LNS, DSVPN, SD-WAN EVPN; MPLS L3VPN y L2VPN',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: 'A-FEC', compresion: true, ips: true, url: true, av: true,
    macsec: 'Con la tarjeta SIC-2X2S-V2',
    n1: {sin: 'N1-AR67-L-B', f: 'N1-AR67-L-F', a: 'N1-AR67-L-A'}, amenazas: TP('LAR0TP130'),
    paquetes: [{sku: 'AR67-L-LIC-NETCONN', d: 'AR6700-L Value-added Network Connection Package: DSVPN y MPLS L2VPN (solo VPWS)', para: 'dsvpn'},
      {sku: 'AR67-L-LIC-Enh-WANOP', d: 'AR6700-L Value-added Enhanced WAN-Optimize Package: compresión de datos', para: 'compresion'}]},
  'AR6700-H': {doc: 'Huawei NetEngine AR6710-H Series Enterprise Router Data Sheet-R25C10', mem: '8 GB',
    vpn: 'GRE, Ethernet over GRE, IPsec v4/v6, SRv6, L2TP client, DSVPN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: 'A-FEC', compresion: true, ips: true, url: true, av: true,
    macsec: 'Con la tarjeta SIC-2X2S-V2', extra: 'Duplicación de paquetes por varias rutas e ITP (Intelligent Traffic Policing)',
    n1: {sin: 'N1-AR67-H-B', f: 'N1-AR67-H-F', a: 'N1-AR67-H-A'}, amenazas: TP('LAR0TP130'),
    paquetes: [{sku: 'AR67-H-LIC-NETCONN', d: 'AR6700-H Value-added Network Connection Package: DSVPN', para: 'dsvpn'},
      {sku: 'AR67-H-LIC-Enh-WANOP', d: 'AR6700-H Value-added Enhanced WAN-Optimize Package: compresión de datos', para: 'compresion'}]},
  AR8000: {doc: 'Huawei NetEngine AR8000 Series Enterprise Router Data Sheet-R25C10', mem: '16 GB (SPU) / 16 GB (MPU)',
    vpn: 'GRE, Ethernet over GRE, IPsec v4/v6, SRv6, L2TP client, DSVPN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: 'A-FEC', compresion: true, ips: true, url: true, av: true,
    macsec: 'Con la tarjeta SIC-2X2S-V2', extra: 'Red con doble hub («dual-hub flexible networking»)',
    n1: {sin: 'N1-AR81-B', f: 'N1-AR81-F', a: 'N1-AR81-A'}, amenazas: TP('LAR0TP120'),
    paquetes: [{sku: 'AR81-LIC-NETCONN', d: 'AR8100 Value-added Network Connection Package: DSVPN', para: 'dsvpn'},
      {sku: 'AR81-LIC-Enh-WANOP', d: 'AR8100 Value-added Enhanced WAN-Optimize Package: compresión de datos', para: 'compresion'}]},
  'AR502H-V2': {doc: 'Huawei AR502H-V2 Data Sheet', mem: '4 GB DDR4',
    vpn: 'GRE, IPsec, L2TP client, Ethernet over GRE, DSVPN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: null, mpls: true, mcast: null, fec: 'A-FEC', compresion: null, ips: true, url: true, av: true, macsec: null,
    extra: 'Modo de cómputo en el borde (contenedores) con un interruptor DIP; GNSS (BeiDou, GPS, Galileo, GLONASS)',
    n1: null, amenazas: null, paquetes: []},
  'AR6700V-L': {doc: 'Huawei NetEngine AR6700V-L Virtual Router Data Sheet', mem: '4 GB (2 vCPU) · 8 GB (4 y 8 vCPU) · 16 GB (16 vCPU)',
    vpn: 'L3VPN, SD-WAN EVPN, GRE VPN; SRv6; IPsec e IKEv2 con AES-CBC, AES-GCM y SM',
    evpn: true, dsvpn: null, srv6: true, mpls: null, mcast: true, fec: 'A-FEC', compresion: true, ips: true, url: true, av: true, macsec: null,
    nota: 'IPS, filtrado URL y antivirus: «Only the AR6700V-L with 4vCPU/8vCPU/16vCPU supports this function» (nota de la ficha). Su SD-WAN IPsec es EVPN + IPsec (AES-256-CBC); el IMIX sale de la ficha R25C00.',
    extra: 'Pasarela IWG hacia redes MPLS tradicionales y varias pasarelas SD-WAN; nube: host VPC, transit VPC y cloud router; HA con VRRP y HRP',
    n1: null, amenazas: null, paquetes: []},
  AR8700: {doc: 'Huawei NetEngine AR8000 Series Enterprise Router Data Sheet-R25C10', mem: '16 GB (SPU) / 8 GB (MPU)',
    vpn: 'GRE, Ethernet over GRE, IPsec v4/v6, SRv6, L2TP client, DSVPN, SD-WAN EVPN; MPLS L3VPN',
    evpn: true, dsvpn: true, srv6: true, mpls: true, mcast: true, fec: 'A-FEC', compresion: true, ips: true, url: true, av: true,
    macsec: 'Con la tarjeta SIC-2X2S-V2', extra: 'Red con doble hub; con dos placas de control, SD-WAN exige la versión 25.1 o posterior',
    n1: {sin: 'N1-AR87-B', f: 'N1-AR87-F', a: 'N1-AR87-A'}, amenazas: TP('LAR0TP150'),
    paquetes: [{sku: 'AR87-LIC-NETCONN', d: 'AR8700 Value-added Network Connection Package: DSVPN', para: 'dsvpn'},
      {sku: 'AR87-LIC-Enh-WANOP', d: 'AR8700 Value-added Enhanced WAN-Optimize Package: compresión de datos', para: 'compresion'}]},
};
// «SD-WAN IPsec performance» y «SD-WAN performance» (IPsec + QoS), IMIX, en Mbps. El AR5710I solo
// publica estas dos filas a 512 y 1400 bytes: queda en null, con su texto en la ficha ampliada.
const SDWAN_CIFRAS = {
  AR610: [200, 80], AR650: [1500, 800], AR6000: [1500, 1200], 'AR5710-S': [1000, 800], 'AR5710-SE': [1200, 1000],
  'AR5710-H': [2000, 1500], 'AR5710-I': [null, null], 'AR6700-L': [2000, 1500], 'AR6710-L14T2X4': [3000, 2500],
  'AR6700-H': [11000, 9000], 'AR502H-V2': [1000, 800], 'AR6700V-L': [null, null], 'AR8140-12G10XG': [22000, 20000], 'AR8140-T-12G10XG': [22000, 20000], 'AR8700-8': [24000, 20000],
};
const SERIE_SDWAN = (m) => (m.ser === 'AR8000' ? 'AR8000' : m.ser);
for (const m of MODELS) {
  const s = SDWAN_SERIE[SERIE_SDWAN(m)];
  if (!s) continue;
  const [ipsecSdwan, qos] = SDWAN_CIFRAS[m.id] || SDWAN_CIFRAS[SERIE_SDWAN(m)] || [null, null];
  m.capSdwan = {...s, ipsecSdwan, qos, tuneles: null, sesiones: null, tunelesMotivo: TUNELES_MOTIVO};
  // El AR6700V-L de 2 vCPU no admite IPS, URL ni antivirus (nota de su ficha): `false`, que aparta con UTM.
  if (m.virtual && m.vcpu < 4) Object.assign(m.capSdwan, {ips: false, url: false, av: false});
  // vCPE (2026-10-15, leídos en el Chrome del dueño): el SD-WAN IPsec IMIX de la ficha R25C00, que la
  // R26C00 quitó (casa con ella en el SD-WAN IPsec a 1400 B y en el típico IMIX: doble ancla), y los
  // paquetes N1 por tamaño de la «License Usage Guide» V600R025C00 (EDOC1100516044). El vCPE no tiene
  // paquete sin SD-WAN: Foundation, Advanced o la actualización de uno a otro.
  if (m.virtual) {
    m.capSdwan.ipsecSdwan = {2: 400, 4: 3000, 8: 5000, 16: 11000}[m.vcpu];
    const v = `${m.vcpu}V`;
    m.capSdwan.n1 = {sin: null, f: `N1-AR6700V-L-F-${v}`, a: `N1-AR6700V-L-A-${v}`,
      sns: {f: `N1-AR6700V-L-F-${v}-{años}SNS`, a: `N1-AR6700V-L-A-${v}-{años}SNS`}};
    m.capSdwan.doc = 'Huawei NetEngine AR6700V-L Virtual Router Data Sheet-R26C00; códigos N1 de la NetEngine AR6700V-L V600R025C00 License Usage Guide';
  }
}


module.exports = { OPTICS, OPTIC_LABEL, PARTS, MODELS, HICARE };
