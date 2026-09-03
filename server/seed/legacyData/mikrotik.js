// ── MikroTik · datos de dimensionamiento RouterOS ────────────────────────────
//
// Este archivo es la fuente autoritativa de MikroTik para el dimensionador, al igual que
// huawei.js / cisco.js / fortinet.js. Antes los datos vivían solo en indexPR.js (vista
// simplificada del portal) y carecían de los campos que realmente determinan el sizing en
// RouterOS: RAM, núcleos de CPU y nivel de licencia. indexPR.mikrotik se conserva para la
// tabla del portal; seedCatalog.js fusiona ambos por nombre de modelo.
//
// CAMPOS Y CÓMO INTERPRETARLOS
//   fwd    Forwarding en Mbps con FastTrack activo, tramas de 1518 B — las condiciones bajo
//          las que MikroTik publica sus cifras. NO es el rendimiento con queue tree ni con
//          paquetes pequeños: ver FASTTRACK_FACTOR abajo.
//   ipsec  IPsec AES-128-CBC/GCM en Mbps, con el motor criptográfico del SoC activo.
//   cores  Núcleos de CPU. Determinante: WireGuard e IPsec por túnel son mayormente
//          single-thread, así que un CCR de 16 núcleos no acelera UN túnel, acelera MUCHOS.
//   ram    RAM en MB. Es el límite real para BGP full table (~1.5 GB por feed completo en
//          RouterOS 7 con ~1M de rutas IPv4), independiente del throughput.
//   lvl    Nivel de licencia RouterOS embebido en el hardware (4, 5 o 6).
//   sess   Tope duro de sesiones PPPoE/hotspot/túneles que impone ese nivel de licencia
//          (null = ilimitado). Muro invisible que ninguna cifra de throughput anticipa.
//   poe    Presupuesto de PoE-out en W (null = el equipo no entrega PoE).
//   cages  Jaulas SFP/QSFP disponibles por tipo — acota la cantidad de ópticas del BOM.
//
// VERIFICACIÓN PENDIENTE: throughput, precios y SKUs de ópticas provienen de los datasheets
// públicos y del MSRP de mikrotik.com, no de un price list firmado como el de Fortinet.
// Confirmar contra distribuidor autorizado antes de cotizar en firme.

// Rendimiento efectivo cuando se desactiva FastTrack. Queue Tree con parent=global y las
// Simple Queues son incompatibles con FastTrack: el tráfico marcado como fasttrack salta la
// cola por completo, así que habilitar shaping por-conexión obliga a pasar todo el tráfico
// por conntrack + firewall completo. Es la trampa de dimensionamiento clásica de RouterOS y
// la razón por la que un CCR "de 12 Gbps" entrega ~5 en un despliegue ISP con PCQ.
// ponytail: factor único por arquitectura; medir por modelo si algún proyecto lo exige.
const FASTTRACK_FACTOR = { arm: 0.45, mips: 0.35 };

// Consumo de RAM de BGP full table en RouterOS 7 (~1M de rutas IPv4 en 2026). NO es lineal:
// el RIB guarda cada path por separado, pero el FIB resultante se comparte entre feeds, así
// que el segundo upstream cuesta bastante menos que el primero.
//
// Es el límite que más sorprende en preventa: un RB5009 tiene 8.8 Gbps de forwarding —
// throughput de sobra para un borde ISP pequeño — pero con 1 GB de RAM no sostiene ni una
// tabla completa. Ahí el diseño correcto es ruta default o un feed parcial filtrado, no un
// equipo más grande.
const BGP_RAM = {
  baseMb:      384,   // RouterOS y servicios base
  firstFeedMb: 1200,  // primer feed completo: RIB + FIB
  extraFeedMb: 900,   // cada feed adicional: solo paths extra de RIB
};

// Topes por nivel de licencia RouterOS (sesiones PPPoE/hotspot activas, túneles EoIP/PPTP/
// L2TP/OVPN). El nivel viene embebido en el hardware y no se puede subir por software.
const LICENSE_LEVELS = {
  4: { sess: 200,  d: 'Nivel 4 — 200 sesiones PPPoE/hotspot activas y 200 túneles. Routing (OSPF/BGP/MPLS) sin restricción.' },
  5: { sess: 500,  d: 'Nivel 5 — 500 sesiones PPPoE/hotspot activas y 500 túneles. Routing sin restricción.' },
  6: { sess: null, d: 'Nivel 6 — sin tope de sesiones ni túneles. Nivel de la familia CCR.' },
};

const MODELS = [
  // ── hEX / RB — SOHO y sucursal pequeña ───────────────────────────────────────
  {id:'hEX lite RB750r2', ser:'hEX', seg:'Hogar / Básico', fwd:100, ipsec:70, cores:1, cpu:'QCA9533 850 MHz', arch:'mips', ram:64, lvl:4, poe:null,
   ports:'5x FE (100 Mbps)', cages:{}, elp:'~ $29', elpN:29, legacy:true,
   note:'Puertos Fast Ethernet y 64 MB de RAM — solo para reemplazo de equipos instalados, no para diseños nuevos.', redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'6-30 V DC', texto:'Consumo máximo 2 W — MikroTik publica el máximo, no un consumo típico, y para este modelo no publica la cifra sin accesorios. Dos entradas independientes, pero la fuente interna es única.'}},
  {id:'hEX RB750Gr3', ser:'hEX', seg:'SOHO / Home', fwd:1000, ipsec:470, cores:2, cpu:'MT7621A 880 MHz', arch:'mips', ram:256, lvl:4, poe:12,
   ports:'5x GE · PoE-out pasivo en ether5', cages:{}, elp:'~ $59', elpN:59, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'8-30 V DC', texto:'Consumo máximo 10 W, y 5 W sin accesorios — MikroTik publica máximos, no un consumo típico. Dos entradas independientes, pero la fuente interna es única.'}},
  {id:'hEX S RB760iGS', ser:'hEX', seg:'SOHO + SFP', fwd:1000, ipsec:470, cores:2, cpu:'MT7621A 880 MHz', arch:'mips', ram:256, lvl:4, poe:12,
   ports:'5x GE + 1x SFP · PoE-out pasivo en ether5', cages:{ge:1}, optics:['ge'], elp:'~ $79', elpN:79, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN 802.3af/at)', volts:'12-57 V DC', texto:'Consumo máximo 24 W, y 6 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 2 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},
  {id:'L009UiGS-2HaxD', ser:'L009', seg:'SOHO / Sucursal peq + Wi-Fi 6', fwd:2000, ipsec:900, cores:1, cpu:'IPQ-5018 800 MHz', arch:'arm', ram:512, lvl:5, poe:57,
   ports:'8x GE + 1x 2.5G + 1x SFP · Wi-Fi 6 (2.4 GHz) · PoE-out en ether1', cages:{ge:1}, optics:['ge'], elp:'~ $125', elpN:125, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN 802.3af/at)', volts:'24-56 V DC', texto:'Consumo máximo 47 W, y 14 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 2 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},

  {id:'RB4011iGS+', ser:'RB4011', seg:'Sucursal pequeña', fwd:5600, ipsec:1800, cores:4, cpu:'IPQ-8072A 1.4 GHz', arch:'arm', ram:1024, lvl:5, poe:null,
   ports:'10x GE + 1x SFP+', cages:{sfp10:1}, optics:['sfp10'], elp:'~ $200', elpN:200,
   note:'Superado por el RB5009 en precio y rendimiento — preferir RB5009 salvo que se requieran 10 puertos GE.'},
  {id:'RB4011iGS+RM', ser:'RB4011', seg:'Sucursal pequeña rackmount', fwd:5600, ipsec:1800, cores:4, cpu:'IPQ-8072A 1.4 GHz', arch:'arm', ram:1024, lvl:5, poe:null,
   ports:'10x GE + 1x SFP+ · rackmount 1U', cages:{sfp10:1}, optics:['sfp10'], elp:'~ $215', elpN:215, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'12-57 V DC', texto:'Consumo máximo 33 W, y 18 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 2 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},

  {id:'RB5009UG+S+IN', ser:'RB5009', seg:'Sucursal mediana', fwd:8800, ipsec:2400, cores:4, cpu:'AL32400 1.4 GHz', arch:'arm', ram:1024, lvl:5, poe:null,
   ports:'7x GE + 1x 2.5G + 1x SFP+', cages:{sfp10:1}, optics:['sfp10'], elp:'~ $190', elpN:190, redund:false, psu:{tipo:'fuente única con 3 entradas de alimentación (jack DC, PoE-IN 802.3af/at y terminal de 2 pines)', volts:'24-57 V DC', texto:'Consumo máximo 25 W, y 14 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 3 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},
  {id:'RB5009UPr+S+IN', ser:'RB5009', seg:'Sucursal mediana + PoE-out', fwd:8800, ipsec:2400, cores:4, cpu:'AL32400 1.4 GHz', arch:'arm', ram:1024, lvl:5, poe:140,
   ports:'7x GE PoE-out (802.3af/at) + 1x 2.5G + 1x SFP+', cages:{sfp10:1}, optics:['sfp10'], elp:'~ $239', elpN:239,
   note:'Presupuesto PoE real limitado por la fuente: la incluida (48 V 1.4 A) entrega ~60 W. Para acercarse a 140 W se requiere fuente externa de mayor amperaje.', redund:false, psu:{tipo:'fuente única con 3 entradas de alimentación (jack DC, PoE-IN 802.3af/at y terminal de 2 pines)', volts:'24-57 V DC', texto:'Consumo máximo 150 W, y 16 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 3 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},

  // ── CCR — agregación, hub y core ─────────────────────────────────────────────
  {id:'CCR2004-16G-2S+', ser:'CCR2004', seg:'Hub campus', fwd:12000, ipsec:4200, cores:4, cpu:'AL32400 1.7 GHz', arch:'arm', ram:4096, lvl:6, poe:null,
   ports:'16x GE + 2x SFP+', cages:{sfp10:2}, optics:['sfp10'], elp:'~ $659', elpN:659, redund:true, psu:{tipo:'doble fuente AC (2 ranuras de PSU, 2 entradas)', volts:'100-240 V AC, 50-60 Hz', texto:'Consumo máximo 48 W, y 35 W sin accesorios — MikroTik publica máximos, no un consumo típico. Dos ranuras de fuente y dos entradas AC independientes.'}},
  {id:'CCR2004-1G-12S+2XS', ser:'CCR2004', seg:'Sucursal grande / Agregación', fwd:12000, ipsec:4200, cores:4, cpu:'AL32400 1.7 GHz', arch:'arm', ram:4096, lvl:6, poe:null,
   ports:'1x GE + 12x SFP+ + 2x SFP28 (25G) · fuente redundante', cages:{sfp10:12, sfp25:2}, optics:['sfp10','sfp25'], elp:'~ $699', elpN:699,
   redund:true, psu:{texto:'Fuente redundante, según el datasheet MikroTik del CCR2004.'}},
  {id:'CCR2116-12G-4S+', ser:'CCR2116', seg:'Hub regional / DC Edge', fwd:24000, ipsec:6800, cores:16, cpu:'AL73400 2 GHz', arch:'arm', ram:16384, lvl:6, poe:null,
   ports:'12x GE + 4x SFP+ · fuente redundante', cages:{sfp10:4}, optics:['sfp10'], elp:'~ $999', elpN:999,
   redund:true, psu:{texto:'Fuente redundante, según el datasheet MikroTik del CCR2116.'}},
  {id:'CCR2216-1G-12XS-2XQ', ser:'CCR2216', seg:'Core WAN / ISP', fwd:100000, ipsec:15000, cores:16, cpu:'AL73400 2 GHz', arch:'arm', ram:16384, lvl:6, poe:null,
   ports:'1x GE mgmt + 12x 25GE (SFP28) + 2x 100GE (QSFP28) · fuente hot-swap redundante', cages:{sfp25:12, qsfp100:2}, optics:['sfp25','qsfp100'], elp:'~ $5,999', elpN:5999,
   redund:true, psu:{texto:'Fuente hot-swap redundante, según el datasheet MikroTik del CCR2216.'}},

  // ── CHR — RouterOS virtual ───────────────────────────────────────────────────
  // El "hardware" aquí es la licencia: el tope de throughput es por interfaz, y los recursos
  // (vCPU/RAM) los aporta el hipervisor, por eso cores/ram quedan a null.
  {id:'CHR P1', ser:'CHR', seg:'Virtual — licencia perpetua 1 Gbps', fwd:1000, ipsec:400, cores:null, cpu:'Según hipervisor', arch:'arm', ram:null, lvl:6, poe:null,
   ports:'vNIC ilimitadas · tope de 1 Gbps por interfaz', cages:{}, elp:'~ $45', elpN:45, redund:'no-aplica'},
  {id:'CHR P10', ser:'CHR', seg:'Virtual — licencia perpetua 10 Gbps', fwd:10000, ipsec:3000, cores:null, cpu:'Según hipervisor', arch:'arm', ram:null, lvl:6, poe:null,
   ports:'vNIC ilimitadas · tope de 10 Gbps por interfaz', cages:{}, elp:'~ $95', elpN:95, redund:'no-aplica'},
  {id:'CHR P-Unlimited', ser:'CHR', seg:'Virtual — sin límite de throughput', fwd:999999, ipsec:30000, cores:null, cpu:'Según hipervisor', arch:'arm', ram:null, lvl:6, poe:null,
   ports:'vNIC ilimitadas · sin tope de throughput', cages:{}, elp:'~ $250', elpN:250, redund:'no-aplica'},
];

// Línea propia de ópticas y cables directos MikroTik. Un CCR2216 son 12 jaulas SFP28 y 2
// QSFP28 vacías: sin estas líneas el BOM del equipo no es instalable.
// SKUs tomados del catálogo público mikrotik.com/products; precios MSRP aproximados.
const OPTICS = {
  ge: [
    {sku:'S-85DLC05D',  price:29,  d:'1.25G SFP · 850 nm · multimodo · LC · 550 m'},
    {sku:'S-31DLC20D',  price:39,  d:'1.25G SFP · 1310 nm · monomodo · LC · 20 km'},
    {sku:'S-3553LC20D', price:45,  d:'1.25G SFP BiDi · Tx 1550 / Rx 1310 · monomodo · 20 km (requiere par complementario)'},
    {sku:'S-RJ01',      price:39,  d:'1G SFP cobre · RJ45 · 100 m'},
  ],
  sfp10: [
    {sku:'S+85DLC03D', price:59, d:'10G SFP+ · 850 nm · multimodo · LC · 300 m (SR)'},
    {sku:'S+31DLC10D', price:79, d:'10G SFP+ · 1310 nm · monomodo · LC · 10 km (LR)'},
    {sku:'S+RJ10',     price:79, d:'10G SFP+ cobre · RJ45 · Cat6a hasta 30 m'},
    {sku:'S+DA0001',   price:29, d:'10G SFP+ DAC · cable directo de 1 m (par de extremos incluido)'},
    {sku:'S+DA0003',   price:39, d:'10G SFP+ DAC · cable directo de 3 m'},
  ],
  sfp25: [
    {sku:'XS+31LC10D', price:179, d:'25G SFP28 · 1310 nm · monomodo · LC · 10 km (autonegocia a 10G)'},
    {sku:'XS+DA0001',  price:59,  d:'25G SFP28 DAC · cable directo de 1 m'},
    {sku:'XS+DA0003',  price:69,  d:'25G SFP28 DAC · cable directo de 3 m'},
  ],
  qsfp100: [
    {sku:'XQ+DA0001', price:149, d:'100G QSFP28 DAC · cable directo de 1 m'},
    {sku:'XQ+DA0003', price:179, d:'100G QSFP28 DAC · cable directo de 3 m'},
    {sku:'XQ+BC0003', price:199, d:'100G QSFP28 breakout a 4x 25G SFP28 · 3 m (multiplica la densidad de puertos del core)'},
  ],
};

// Las etiquetas legibles de ge/sfp10/sfp25/qsfp100 salen del mapa compartido
// OPTIC_LABEL de catalogProjection.js — son iguales para todos los vendors.

// Puntos de acceso gestionables por CAPsMAN. Sin ellos la opción "controlador WiFi
// centralizado" del dimensionador no tiene nada que cotizar.
const ACCESS_POINTS = [
  {sku:'cAP ax',   model:'cAPGi-5HaxD2HaxD', price:139, poeDraw:12, d:'AP de techo Wi-Fi 6 · doble banda AX · 1x GE con PoE-in 802.3af/at'},
  {sku:'hAP ax²',  model:'C52iG-5HaxD2HaxD', price:99,  poeDraw:12, d:'AP/router de escritorio Wi-Fi 6 · doble banda AX · 5x GE'},
  {sku:'hAP ax³',  model:'C53UiG+5HPaxD2HPaxD', price:189, poeDraw:20, d:'AP/router Wi-Fi 6 de alta potencia · 4x GE + 1x SFP · PoE-in/out'},
];

const SUPPORT = {
  'sw-basic':   {n:'Comunidad (gratuito)', sla:'Sin SLA — foros + wiki oficial', d:'Soporte por comunidad MikroTik: forum.mikrotik.com, help.mikrotik.com y sistema de tickets del fabricante sin compromiso de tiempo de respuesta.'},
  'sw-premium': {n:'Contrato partner regional', sla:'8x5 NBD — partners certificados', d:'Soporte a través de partner certificado Tier 1/2 con SLA contractual. MikroTik no vende soporte directo con SLA: se contrata al canal.'},
  'training':   {n:'Certificación MTCNA / MTCRE', sla:'Capacitación formal', d:'Programa oficial: MTCNA (básico), MTCRE (routing), MTCWE (wireless), MTCTCE (traffic control), MTCINE (inter-networking).'},
};

module.exports = {
  MODELS, OPTICS, ACCESS_POINTS, SUPPORT,
  LICENSE_LEVELS, FASTTRACK_FACTOR, BGP_RAM,
};
