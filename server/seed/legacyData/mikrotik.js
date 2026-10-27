// ── MikroTik · datos de dimensionamiento RouterOS ────────────────────────────
//
// Fuente autoritativa de MikroTik para el dimensionador, igual que huawei.js / cisco.js /
// fortinet.js. indexPR.mikrotik conserva la vista del portal; seedCatalog.js fusiona ambos por
// nombre de modelo.
//
// DE DONDE SALE CADA CAMPO (revision del 2026-10-13, fichas oficiales de mikrotik.com/product/…
// traidas por `traer-cisco-huawei.yml` a las ramas fuente/mikrotik-*)
//   De la MATRIZ DE PRUEBAS de cada ficha, transcrita por `npm run mikrotik` a
//   `mikrotikPruebas.js` y DERIVADOS aqui al cargar (no se escriben a mano):
//     pruebas  la matriz entera: ruteo (fastpath, colas, filtro, l3hw, l3hwFiltro), puente e
//              IPsec (un tunel / 256 tuneles, por cifrado) a 1518/512/64 B (IPsec 1400/512/64).
//     fwd      ruteo en fast path a 1518 B: la cifra de portada (sin firewall ni colas).
//     fw       ruteo con 25 reglas de filtro a 1518 B: firewall sin FastTrack.
//     ipsec    un tunel AES-128-CBC + SHA1 a 1400 B: la primera fila que publica MikroTik. null
//              donde la ficha no publica IPsec (hEX lite, hEX PoE, L009): el dimensionador los
//              aparta con su motivo, nunca les pone la cifra de otra capa.
//     cpu, elp/elpN  CPU y frecuencia, y el «Suggested price» de la ficha (USD, MSRP).
//   Escritos a mano DESDE LA MISMA FICHA (prosa, no tabla): codigo (el «Product code», que es
//   la llave del anclaje), cores, ram (MB), lvl (nivel de licencia), puertos, jaulas, PoE,
//   alimentacion. `npm run mikrotik` ancla cada ficha contra cores/ram/lvl antes de escribir.
//   wanMax  el puerto mas rapido del equipo en Mbps. La prueba «all port» SUMA lo que reenvian
//           todos los puertos; un sitio con un enlace WAN no pasa de la velocidad de ese puerto
//           por sentido, por mucho que la cifra agregada sea mayor.
//   poe     vatios de PoE-out SOLO donde la ficha publica «Total output power» (RB5009UPr). En
//           el resto la ficha da corriente (`poeA`, amperios) y no vatios: los vatios dependen
//           de la tension de entrada, y ponerlos a ojo seria inventar el dato.
//   poeSalida  (2026-10-14) los limites de corriente de PoE-out, transcritos de la ficha y del
//           manual: `puertos` con PoE-out, `aPuerto` y `aTotal` hasta `hastaV` voltios de entrada
//           («low voltage» en la ficha; 12-30 V en los manuales del hEX PoE y la PowerBox Pro).
//           El manual dice que la salida va a la MISMA tension que la entrada («The output
//           voltage will be the same as the input voltage»), asi que con `adaptador` (el que
//           viene en la caja, de la ficha) el motor puede calcular vatios: tension del adaptador
//           x corriente de la ficha, sin pasar de lo que da el adaptador menos el consumo del
//           equipo sin accesorios (`consumoSinAcc`). Es aritmetica sobre cifras oficiales, y la
//           pantalla la declara como calculo. Sin adaptador en la caja la tension no se conoce y
//           el PoE sigue sin poder comprobarse... salvo que se elija una FUENTE DE 48 V aparte
//           (2026-10-14): entonces mandan los limites de alta tension de la ficha (`alta`), la
//           entrada maxima del equipo (`vMax`, «DC jack input Voltage») y, donde el manual lo dice
//           («It can power af/at mode B compatible devices, if 48-57 V input voltage is used»),
//           la salida es 802.3af/at (`af48`). El L009 entra desde el 2026-10-27: su ficha rotula
//           «Low voltage PoE-Out current limit» 1 A y «High voltage PoE-Out current limit» 450 mA,
//           igual que la del RB4011 y la del hEX S, y su PoE-out solo funciona alimentado por el
//           jack DC («Works only if powered by DC jack»), que es por donde entra la fuente de 48 V.
//
// LO QUE ANTES ESTABA MAL Y POR QUE (todas contra la ficha oficial): IPsec del RB5009 2.400
// Mbps (ficha 1.354), del CCR2216 15.000 (ficha 2.013 con un tunel, 4.108 con 256) y del hEX 470
// (232); CPU del RB4011 y del RB5009 de otro equipo; el L009 con 1 nucleo (son 2) y con IPsec
// (no lo publica); el hEX con PoE-out (no tiene); el CCR2116 con 12 GE (son 13); el CCR2216 a
// $5.999 (son $2.795). El RB4011iGS+ sin RM sale del catalogo: no tiene ficha ni figura en el
// listado oficial de routers, y sus cifras eran las del RM copiadas.

const { FICHAS } = require('./mikrotikPruebas');

// BGP full table en RAM. SUPUESTO DE DISENO DECLARADO, NO UNA CIFRA DE MIKROTIK: ninguna
// ficha ni la documentacion de RouterOS publica cuanta memoria ocupa un feed completo. Es la
// regla de trabajo con la que se aparta un equipo que no la sostiene, y la pantalla la rotula
// como supuesto. No es lineal: el RIB guarda cada camino por separado, pero el FIB resultante
// se comparte entre feeds, asi que el segundo upstream cuesta menos que el primero.
const BGP_RAM = {
  baseMb:      384,   // RouterOS y servicios base
  firstFeedMb: 1200,  // primer feed completo: RIB + FIB
  extraFeedMb: 900,   // cada feed adicional: solo caminos extra del RIB
};

// Topes por nivel de licencia, de la tabla oficial «RouterOS license key levels»
// (help.mikrotik.com/docs/spaces/ROS/pages/328149, leida el 2026-10-13). El nivel viene
// grabado en el hardware y no se sube por software. `null` es «unlimited» en la tabla.
// Los niveles NO aplican a CHR («License levels described until now do not apply to Cloud
// Hosted Routers»): sus licencias solo limitan el caudal por interfaz.
const LICENSE_LEVELS = {
  4: { ppp: 200, ovpn: 200, hotspot: 200, userman: 20,
       d: 'Nivel 4 — 200 túneles PPPoE/PPTP/L2TP, 200 OpenVPN y 200 usuarios HotSpot activos. Routing, VLAN, EoIP y colas sin tope.' },
  5: { ppp: 500, ovpn: null, hotspot: 500, userman: 50,
       d: 'Nivel 5 — 500 túneles PPPoE/PPTP/L2TP, OpenVPN sin tope y 500 usuarios HotSpot activos. Routing, VLAN, EoIP y colas sin tope.' },
  6: { ppp: null, ovpn: null, hotspot: null, userman: null,
       d: 'Nivel 6 (Controller) — sin tope de túneles ni de usuarios HotSpot.' },
  chr: { ppp: null, ovpn: null, hotspot: null, userman: null,
       d: 'CHR — los niveles 4/5/6 no aplican: «All the rest of the features provided by CHR are available without restrictions». La licencia solo fija el caudal de subida por interfaz.' },
};

const MANO = [
  // ── hEX / PoE — SOHO y sucursal pequena ──────────────────────────────────────
  {id:'hEX lite RB750r2', codigo:'RB750r2', ser:'hEX', seg:'Hogar / Básico', cores:1, ram:64, lvl:4, wanMax:100, poe:null,
   ports:'5x FE (100 Mbps)', cages:{}, legacy:true,
   note:'Puertos Fast Ethernet y 64 MB de RAM — solo para reemplazo de equipos instalados, no para diseños nuevos.', redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'6-30 V DC', texto:'Consumo máximo 2 W — MikroTik publica el máximo, no un consumo típico, y para este modelo no publica la cifra sin accesorios. Dos entradas independientes, pero la fuente interna es única.'}},
  {id:'hEX PoE lite RB750UPr2', codigo:'RB750UPr2', ser:'hEX', seg:'Hogar / Básico + PoE-out', cores:1, ram:64, lvl:4, wanMax:100, poe:null, poeA:2, poeSalida:{puertos:4, aPuerto:0.5, aTotal:2, hastaV:30, vMax:30, nota:'la ficha da 1 A por puerto y el manual 500 mA: se toma el menor'}, adaptador:{v:24, a:2.5}, consumoSinAcc:3,
   ports:'5x FE (100 Mbps) · PoE-out pasivo en ether2-ether5 (2 A en total)', cages:{},
   note:'Puertos Fast Ethernet y 64 MB de RAM: el caudal de un enlace no pasa de 100 Mbps.', redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'8-30 V DC', texto:'Consumo máximo 51 W, y 3 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Incluye adaptador de 24 V 2,5 A.'}},
  {id:'hEX RB750Gr3', codigo:'RB750Gr3', ser:'hEX', seg:'SOHO / Home', cores:2, ram:256, lvl:4, wanMax:1000, poe:null,
   ports:'5x GE', cages:{}, legacy:true,
   note:'Relevado por el hEX refresh (E50UG): «same price, twice the performance», según la ficha del E50UG.', redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'8-30 V DC', texto:'Consumo máximo 10 W, y 5 W sin accesorios — MikroTik publica máximos, no un consumo típico. Dos entradas independientes, pero la fuente interna es única.'}},
  {id:'hEX E50UG', codigo:'E50UG', ser:'hEX', seg:'SOHO / Home (hEX refresh)', cores:2, ram:512, lvl:4, wanMax:1000, poe:null,
   ports:'5x GE', cages:{}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'12-28 V DC', texto:'Consumo máximo 10 W, y 4 W sin accesorios — MikroTik publica máximos, no un consumo típico. Dos entradas independientes, pero la fuente interna es única.'}},
  {id:'hEX S RB760iGS', codigo:'RB760iGS', ser:'hEX', seg:'SOHO + SFP', cores:2, ram:256, lvl:4, wanMax:1000, poe:null, poeA:0.5, poeSalida:{puertos:1, alta:{aPuerto:0.5, aTotal:0.5}, vMax:57}, consumoSinAcc:6,
   ports:'5x GE + 1x SFP · PoE-out pasivo en ether5 (0,5 A)', cages:{ge:1}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN 802.3af/at)', volts:'12-57 V DC', texto:'Consumo máximo 24 W, y 6 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 2 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},
  {id:'hEX S E60iUGS', codigo:'E60iUGS', ser:'hEX', seg:'SOHO + SFP 2,5G (hEX S 2025)', cores:2, ram:512, lvl:4, wanMax:2500, poe:null, poeA:0.5, poeSalida:{puertos:1, aPuerto:0.5, aTotal:0.5, hastaV:57, alta:{aPuerto:0.5, aTotal:0.5}, vMax:57}, adaptador:{v:24, a:1.2}, consumoSinAcc:5,
   ports:'5x GE + 1x SFP (admite 2,5G) · PoE-out pasivo en ether5 (0,5 A)', cages:{ge:1}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN 802.3af/at)', volts:'12-57 V DC', texto:'Consumo máximo 23 W, y 5 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Incluye adaptador de 24 V 1,2 A.'}},
  {id:'hEX PoE RB960PGS', codigo:'RB960PGS', ser:'hEX', seg:'SOHO + PoE-out 802.3af/at', cores:1, ram:128, lvl:4, wanMax:1000, poe:null, poeA:2, poeSalida:{puertos:4, aPuerto:1, aTotal:2, hastaV:30, alta:{aPuerto:0.45, aTotal:2}, vMax:57, af48:true}, adaptador:{v:24, a:2.5}, consumoSinAcc:6,
   ports:'5x GE + 1x SFP · PoE-out 802.3af/at en ether2-ether5 (2 A en total)', cages:{ge:1}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'12-57 V DC', texto:'Consumo máximo 54 W, y 6 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Incluye adaptador de 24 V 2,5 A.'}},
  {id:'PowerBox Pro RB960PGS-PB', codigo:'RB960PGS-PB', ser:'PowerBox', seg:'Exterior + PoE-out 802.3af/at', cores:1, ram:128, lvl:4, wanMax:1000, poe:null, poeA:2, poeSalida:{puertos:4, aPuerto:1, aTotal:2, hastaV:30, alta:{aPuerto:0.45, aTotal:2}, vMax:57, af48:true}, adaptador:{v:24, a:2.5}, consumoSinAcc:6,
   ports:'5x GE + 1x SFP · PoE-out 802.3af/at en ether2-ether5 (2 A en total) · caja de exterior', cages:{ge:1}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'12-57 V DC', texto:'Consumo máximo 54 W, y 6 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Incluye adaptador de 24 V 2,5 A e inyector PoE gigabit.'}},

  // ── L009 / RB4011 / RB1100 / RB5009 — sucursal ─────────────────────────────
  {id:'L009UiGS-2HaxD', codigo:'L009UiGS-2HaxD-IN', ser:'L009', seg:'Sucursal pequeña + Wi-Fi 6', cores:2, ram:512, lvl:5, wanMax:2500, poe:null, poeA:1, poeSalida:{puertos:1, alta:{aPuerto:0.45, aTotal:1}, vMax:56}, consumoSinAcc:14,
   ports:'8x GE + 1x SFP (admite 2,5G) · Wi-Fi 6 a 2,4 GHz (AX600) · PoE-out pasivo en ether8 (1 A a baja tensión, 450 mA a alta; solo alimentado por el jack DC)', cages:{ge:1}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN 802.3af/at)', volts:'24-56 V DC', texto:'Consumo máximo 47 W, y 14 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 2 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},
  {id:'L009UiGS-RM', codigo:'L009UiGS-RM', ser:'L009', seg:'Sucursal pequeña rackmount', cores:2, ram:512, lvl:5, wanMax:2500, poe:null, poeA:1, poeSalida:{puertos:1, alta:{aPuerto:0.45, aTotal:1}, vMax:56}, consumoSinAcc:8,
   ports:'8x GE + 1x SFP (admite 2,5G) · PoE-out pasivo en ether8 (1 A a baja tensión, 450 mA a alta; solo alimentado por el jack DC) · rack', cages:{ge:1}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN 802.3af/at)', volts:'24-56 V DC', texto:'Consumo máximo 40 W, y 8 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico.'}},
  {id:'RB4011iGS+RM', codigo:'RB4011iGS+RM', ser:'RB4011', seg:'Sucursal pequeña rackmount', cores:4, ram:1024, lvl:5, wanMax:10000, poe:null, poeA:0.6, poeSalida:{puertos:1, alta:{aPuerto:0.42, aTotal:0.6}, vMax:57}, consumoSinAcc:18,
   ports:'10x GE + 1x SFP+ · PoE-out pasivo en ether10 (0,6 A) · rack 1U', cages:{sfp10:1}, redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y PoE-IN pasivo)', volts:'12-57 V DC', texto:'Consumo máximo 33 W, y 18 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 2 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},
  {id:'RB1100AHx4', codigo:'RB1100x4', ser:'RB1100', seg:'Sucursal rackmount 13 GE', cores:4, ram:1024, lvl:6, wanMax:1000, poe:null,
   ports:'13x GE · rack 1U', cages:{}, redund:true, psu:{tipo:'2 entradas AC en respaldo (failover), más PoE-IN 802.3af/at y terminal de 2 pines', volts:'100-240 V AC; -48 y 12-57 V DC', texto:'Consumo máximo 20 W — MikroTik publica el máximo, no un consumo típico. Redundante: la ficha habla de «dual redundant power supplies» y el manual (RB1100 series) dice que los dos conectores IEC se usan por separado o a la vez «for failover purposes». No declara ranuras de fuente: no son extraíbles.'}},
  {id:'RB5009UG+S+IN', codigo:'RB5009UG+S+IN', ser:'RB5009', seg:'Sucursal mediana', cores:4, ram:1024, lvl:5, wanMax:10000, poe:null,
   ports:'7x GE + 1x 2.5G + 1x SFP+', cages:{sfp10:1}, redund:false, psu:{tipo:'fuente única con 3 entradas de alimentación (jack DC, PoE-IN 802.3af/at y terminal de 2 pines)', volts:'24-57 V DC', texto:'Consumo máximo 25 W, y 14 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 3 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},
  {id:'RB5009UPr+S+IN', codigo:'RB5009UPr+S+IN', ser:'RB5009', seg:'Sucursal mediana + PoE-out', cores:4, ram:1024, lvl:5, wanMax:10000, poe:130,
   ports:'7x GE + 1x 2.5G (PoE-out 802.3af/at en los 8) + 1x SFP+', cages:{sfp10:1},
   note:'Los 130 W de PoE-out publicados no caben en el adaptador incluido (48 V 2 A, 96 W): para acercarse a esa cifra hace falta otra fuente.', redund:false, psu:{tipo:'fuente única con 3 entradas de alimentación (jack DC, PoE-IN 802.3af/at y terminal de 2 pines)', volts:'24-57 V DC', texto:'Consumo máximo 150 W, y 16 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. Tiene 3 entradas independientes, así que se puede alimentar desde dos tomas distintas, aunque la fuente interna es única.'}},
  {id:'RB5009UPr+S+OUT', codigo:'RB5009UPr+S+OUT', ser:'RB5009', seg:'Sucursal mediana exterior (IP66) + PoE-out', cores:4, ram:1024, lvl:5, wanMax:10000, poe:130,
   ports:'7x GE + 1x 2.5G (PoE-out 802.3af/at en los 8) + 1x SFP+ · exterior IP66', cages:{sfp10:1},
   note:'Equipo de exterior (IP66) sin adaptador incluido: se alimenta por PoE-IN o por el terminal de 2 pines, y la fuente fija cuánto de los 130 W de PoE-out hay de verdad.', redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (PoE-IN 802.3af/at y terminal de 2 pines)', volts:'24-57 V DC', texto:'Consumo máximo 150 W, y 15 W sin accesorios ni PoE de salida — MikroTik publica máximos, no un consumo típico. No incluye adaptador.'}},

  // ── CCR — agregacion, hub y core ─────────────────────────────────────────────
  {id:'CCR2004-16G-2S+', codigo:'CCR2004-16G-2S+', ser:'CCR2004', seg:'Hub campus', cores:4, ram:4096, lvl:6, wanMax:10000, poe:null,
   ports:'16x GE + 2x SFP+ · 2 ranuras de fuente', cages:{sfp10:2}, redund:true, psu:{tipo:'doble fuente AC (2 ranuras de PSU, 2 entradas)', volts:'100-240 V AC, 50-60 Hz', texto:'Consumo máximo 48 W, y 35 W sin accesorios — MikroTik publica máximos, no un consumo típico. Dos ranuras de fuente y dos entradas AC independientes.'}},
  {id:'CCR2004-16G-2S+PC', codigo:'CCR2004-16G-2S+PC', ser:'CCR2004', seg:'Hub campus sin ventiladores', cores:4, ram:4096, lvl:6, wanMax:10000, poe:null,
   ports:'16x GE + 2x SFP+ · refrigeración pasiva', cages:{sfp10:2},
   note:'Versión sin ventiladores: CPU a 1.200 MHz en lugar de 1.700, y por eso cifras algo menores que el CCR2004-16G-2S+ al mismo precio.', redund:false, psu:{tipo:'fuente única con 2 entradas de alimentación (jack DC y terminal de 2 pines)', volts:'36-57 V DC', texto:'Consumo máximo 36 W, y 30 W sin accesorios — MikroTik publica máximos, no un consumo típico. Incluye adaptador de 48 V 0,95 A.'}},
  {id:'CCR2004-1G-12S+2XS', codigo:'CCR2004-1G-12S+2XS', ser:'CCR2004', seg:'Sucursal grande / Agregación', cores:4, ram:4096, lvl:6, wanMax:25000, poe:null,
   ports:'1x GE + 12x SFP+ + 2x SFP28 (25G)', cages:{sfp10:12, sfp25:2}, redund:true,
   psu:{tipo:'doble fuente AC integrada (2 entradas IEC)', volts:'100-240 V AC', texto:'Consumo máximo 60 W, y 31 W sin accesorios, según la ficha — MikroTik publica máximos, no un consumo típico (su manual da 32 W y 49 W con accesorios). Redundante: la ficha habla de «dual redundant power supply» y el manual de «dual integrated power supply units» con dos tomas IEC. No declara ranuras de fuente: no son extraíbles.'}},
  {id:'CCR2116-12G-4S+', codigo:'CCR2116-12G-4S+', ser:'CCR2116', seg:'Hub regional / DC Edge', cores:16, ram:16384, lvl:6, wanMax:10000, poe:null,
   ports:'13x GE + 4x SFP+ · 2 ranuras de fuente', cages:{sfp10:4},
   redund:true, psu:{tipo:'doble fuente AC (2 ranuras de PSU, 2 entradas)', volts:'100-240 V AC', texto:'Consumo máximo 83 W, y 60 W sin accesorios — MikroTik publica máximos, no un consumo típico. Dos ranuras de fuente.'}},
  {id:'CCR2216-1G-12XS-2XQ', codigo:'CCR2216-1G-12XS-2XQ', ser:'CCR2216', seg:'Core WAN / ISP', cores:16, ram:16384, lvl:6, wanMax:100000, poe:null,
   ports:'1x GE + 12x SFP28 (25G) + 2x QSFP28 (100G) · 2 ranuras de fuente', cages:{sfp25:12, qsfp100:2},
   redund:true, psu:{tipo:'doble fuente AC (2 ranuras de PSU, 2 entradas)', volts:'100-240 V AC, 50-60 Hz', texto:'Consumo máximo 128 W, y 80 W sin accesorios — MikroTik publica máximos, no un consumo típico. Dos ranuras de fuente.'}},

  // ── CHR — RouterOS virtual ───────────────────────────────────────────────────
  // El "hardware" es la licencia, de la tabla «CHR License Levels» de la misma pagina oficial:
  // tope de SUBIDA por interfaz y precio. vCPU y RAM los pone el hipervisor, por eso cores y
  // ram van en null, y MikroTik no publica caudal de IPsec de un CHR (depende del anfitrion).
  {id:'CHR P1', codigo:null, ser:'CHR', seg:'Virtual — licencia perpetua 1 Gbps', cores:null, ram:null, lvl:'chr', poe:null, wanMax:1000,
   chrTope:1000, chrPrecio:45, ports:'vNIC ilimitadas · tope de 1 Gbps de subida por interfaz', cages:{}, redund:'no-aplica'},
  {id:'CHR P10', codigo:null, ser:'CHR', seg:'Virtual — licencia perpetua 10 Gbps', cores:null, ram:null, lvl:'chr', poe:null, wanMax:10000,
   chrTope:10000, chrPrecio:95, ports:'vNIC ilimitadas · tope de 10 Gbps de subida por interfaz', cages:{}, redund:'no-aplica'},
  {id:'CHR P-Unlimited', codigo:null, ser:'CHR', seg:'Virtual — sin límite de throughput', cores:null, ram:null, lvl:'chr', poe:null, wanMax:null,
   chrTope:999999, chrPrecio:250, ports:'vNIC ilimitadas · sin tope de throughput', cages:{}, redund:'no-aplica'},
];

// MATRIZ OFICIAL DE COMPATIBILIDAD DE MODULOS (2026-10-13, segundo enlace WAN). Fuente:
// «MikroTik wired interface compatibility», manual.mikrotik.com/docs/7.25/wired-connections/
// (RouterOS 7.25), traida por traer-cisco-huawei.yml (rama fuente/mikrotik-compat-2026-10-13,
// corrida 38440589580) y extraida de sus tablas «1G SFP», «10G SFP+/25G SFP28» y «100G QSFP28»
// por programa, no a ojo. Solo las filas de los equipos de este catalogo y los modulos que el
// dimensionador puede recomendar. true es «+», false es «-» (no funciona) y un texto es «+»
// con la nota de ese numero. La matriz dice que modulo FUNCIONA en que equipo: es lo que separa
// un «compatible» de un «se pide». Un equipo que no figura (hEX lite, hEX PoE lite, hEX,
// hEX refresh, RB1100, CCR2004-16G-2S+PC) no recibe modulo recomendado: va «consultar».
const COMPATIBILIDAD = {
  'hEX S':                { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': false, 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true },
  'hEX S (2025)':         { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': false, 'S+85DLC03D': '14', 'S+31DLC10D': '14', 'XS+31LC10D': '14', 'XS+85LC01D': '14', 'S-55DLC80D': true, 'XS+2733LC15D': '14' },
  'hEX PoE/PowerBox Pro': { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': false, 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true },
  'L009':                 { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': false, 'S+85DLC03D': '14', 'S+31DLC10D': '14', 'XS+31LC10D': '14', 'XS+85LC01D': '14', 'S-55DLC80D': true, 'XS+2733LC15D': '14' },
  'RB4011':               { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': true, 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true },
  'RB5009':               { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': true, 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true },
  'CCR2004-16G-2S+':      { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': true, 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true },
  'CCR2004-1G-12S+2XS':   { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': '11', 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true },
  'CCR2116-12G-4S+':      { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': true, 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true },
  'CCR2216-1G-12XS-2XQ':  { 'S-RJ01': true, 'S-85DLC05D': true, 'S-31DLC20D': true, 'S+RJ10': true, 'S+85DLC03D': true, 'S+31DLC10D': true, 'XS+31LC10D': true, 'XS+85LC01D': true, 'XQ+31LC10D': true, 'XQ+85MP01D': true, 'S-55DLC80D': true, 'XS+2733LC15D': true, 'XQ+31LC02D': true },
};
// Notas de la matriz que tocan a estos equipos, literales.
const NOTAS_COMPAT = {
  '11': 'CCR2004-1G-12S+2XS - supports up to 6 simultaneous S+RJ10 modules.',
  '14': '10G SFP+/25G SFP28 modules - device SFP supports up to 2.5G rate, manual speed setting is required to work.',
  pasiva: 'We do not recommend using S+RJ10 in passive cooling devices without additional cooling, as they have relatively high power consumption and in turn high operating temperature.',
  rj01: 'S-RJ01 en el hEX S: la tabla de velocidades marca 1000 «+» y 100 y 10 «-».',
};
// Fila de la matriz por «Product code». La matriz nombra familias (RB5009, L009): MikroTik
// las usa para todos sus modelos, y asi se leen.
const FILA_COMPAT = {
  'RB760iGS': 'hEX S', 'E60iUGS': 'hEX S (2025)', 'RB960PGS': 'hEX PoE/PowerBox Pro', 'RB960PGS-PB': 'hEX PoE/PowerBox Pro',
  'L009UiGS-2HaxD-IN': 'L009', 'L009UiGS-RM': 'L009', 'RB4011iGS+RM': 'RB4011',
  'RB5009UG+S+IN': 'RB5009', 'RB5009UPr+S+IN': 'RB5009', 'RB5009UPr+S+OUT': 'RB5009',
  'CCR2004-16G-2S+': 'CCR2004-16G-2S+', 'CCR2004-1G-12S+2XS': 'CCR2004-1G-12S+2XS',
  'CCR2116-12G-4S+': 'CCR2116-12G-4S+', 'CCR2216-1G-12XS-2XQ': 'CCR2216-1G-12XS-2XQ',
};

const celda = (tabla, bytes) => (tabla && tabla[bytes] ? tabla[bytes][1] : null);
const money = (n) => '~ $' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

// Une lo escrito a mano con la ficha transcrita. Un modelo con `codigo` y sin ficha sale con
// sus cifras en null (el arranque lo dice): nunca con un numero de otra fuente.
const MODELS = MANO.map((m) => {
  const out = { ...m, optics: Object.keys(m.cages || {}) };
  if (m.ser === 'CHR') {
    return { ...out, cpu: 'Según hipervisor', fwd: m.chrTope, fw: null, ipsec: null, pruebas: null,
      elp: money(m.chrPrecio), elpN: m.chrPrecio };
  }
  const f = m.codigo ? FICHAS[m.codigo] : null;
  if (!f) {
    return { ...out, cpu: null, fwd: null, fw: null, ipsec: null, pruebas: null, elp: null, elpN: null };
  }
  const ipsec1 = f.ipsec && f.ipsec.uno['aes128-sha1'];
  return {
    ...out,
    puertos: f.puertos || null,
    refrigeracion: f.refrigeracion || null,
    compat: FILA_COMPAT[m.codigo] || null,
    cpu: `${f.cpu} · ${f.mhz}`,
    arq: f.arq,
    fwd: celda(f.ruteo.fastpath, 1518),
    fw: celda(f.ruteo.filtro, 1518),
    ipsec: ipsec1 ? celda(ipsec1, 1400) : null,
    pruebas: { ruteo: f.ruteo, puente: f.puente, ipsec: f.ipsec },
    url: f.url,
    elp: f.precio != null ? money(f.precio) : null,
    elpN: f.precio,
  };
});

// Anclaje vivo: si alguien corrige cores/ram/lvl sin volver a leer la ficha (o la ficha se
// relee y cambia), el arranque lo dice en vez de servir cifras de un equipo que ya no casa.
const DESANCLADOS = MANO.filter((m) => m.codigo && FICHAS[m.codigo]).flatMap((m) => {
  const f = FICHAS[m.codigo];
  const p = f.puertos || {};
  const jaulas = m.cages || {};
  return [['cores', m.cores, f.nucleos], ['ram', m.ram, f.ram], ['lvl', m.lvl, f.lvl],
    // Las jaulas del BOM (escritas a mano) contra los puertos que transcribe la ficha.
    ['jaulas SFP', jaulas.ge || 0, p.sfp || 0], ['jaulas SFP+', jaulas.sfp10 || 0, p.sfp10 || 0],
    ['jaulas SFP28', jaulas.sfp25 || 0, p.sfp25 || 0], ['jaulas QSFP28', jaulas.qsfp100 || 0, p.qsfp100 || 0]]
    .filter(([, a, b]) => a !== b).map(([c, a, b]) => `${m.id}: ${c} ${a} en el catálogo, ${b} en la ficha`);
});
const SIN_FICHA = MANO.filter((m) => m.codigo && !FICHAS[m.codigo]).map((m) => m.id);

// Opticas y cables directos de MikroTik, de sus fichas oficiales (listado «SFP/QSFP» de
// mikrotik.com, leido el 2026-10-13): SKU, «Suggested price» y lo que la ficha dice del
// modulo. Las que la pagina no detalla lo dicen en vez de completarse por el nombre del SKU.
// Un CCR2216 son 12 jaulas SFP28 y 2 QSFP28 vacias: sin estas lineas no es instalable.
const OPTICS = {
  ge: [
    {sku:'S-31DLC20D',  price:29, d:'SFP 1,25G · 1310 nm · monomodo · LC dúplex · 20 km'},
    {sku:'S-55DLC80D',  price:39, d:'SFP 1,25G · 1550 nm · monomodo · LC dúplex · 80 km'},
    {sku:'S-3553LC20D', price:79, d:'SFP 1,25G BiDi · 1310/1550 nm · monomodo · LC simplex · 20 km (va en par con su complementario)'},
    {sku:'S-RJ01',      price:29, d:'SFP 1,25G cobre · RJ45 · 100 m'},
    {sku:'HS-31DLC20D', price:29, d:'SFP 1G/2,5G · 1310 nm · monomodo · LC dúplex · 20 km (aún no figura en la matriz de compatibilidad)'},
    {sku:'HS-85DLC05D', price:22, d:'SFP 1G/2,5G · 850 nm · multimodo · LC dúplex · 550 m (aún no figura en la matriz de compatibilidad)'},
  ],
  sfp10: [
    {sku:'S+85DLC03D', price:59, d:'SFP+ 1G/10G · 850 nm · multimodo · LC dúplex · 300 m'},
    {sku:'S+31DLC10D', price:69, d:'SFP+ 10G · 1310 nm · monomodo · LC dúplex · 10 km'},
    {sku:'S+RJ10',     price:65, d:'SFP+ cobre · RJ45 · 10M a 10G · hasta 30 m a 10 Gbps'},
    {sku:'S+AO0005',   price:49, d:'Cable óptico activo SFP+ a SFP+ · 1G/10G · 5 m'},
    {sku:'XS+DA0001',  price:29, d:'Cable directo SFP/SFP+/SFP28 · 1G/10G/25G · 1 m'},
    {sku:'XS+DA0003',  price:39, d:'Cable directo SFP/SFP+/SFP28 · 1G/10G/25G · 3 m'},
  ],
  sfp25: [
    {sku:'XS+31LC10D',   price:149, d:'SFP28 1G/10G/25G · 1310 nm · monomodo · LC dúplex · 10 km'},
    {sku:'XS+85LC01D',   price:59,  d:'SFP28 1G/10G/25G · 850 nm · multimodo · LC dúplex · 100 m'},
    {sku:'XS+2733LC15D', price:349, d:'SFP28 1G/10G/25G BiDi · 1270/1330 nm · monomodo · LC simplex · 15 km'},
    {sku:'XS+DA0001',    price:29,  d:'Cable directo SFP/SFP+/SFP28 · 1G/10G/25G · 1 m'},
    {sku:'XS+DA0003',    price:39,  d:'Cable directo SFP/SFP+/SFP28 · 1G/10G/25G · 3 m'},
  ],
  qsfp100: [
    {sku:'XQ+85MP01D',    price:89,  d:'QSFP28 40G/100G · 850 nm · multimodo · MTP/MPO 1x12 · 100 m'},
    {sku:'XQ+31LC02D',    price:229, d:'QSFP28 100G · 1271-1331 nm · monomodo · LC dúplex · 2 km'},
    {sku:'XQ+31LC10D',    price:349, d:'QSFP28 100G · 1296-1309 nm · monomodo · LC dúplex · 10 km'},
    {sku:'XQ+DA0001',     price:39,  d:'Cable directo QSFP28 · 40G/100G · 1 m'},
    {sku:'XQ+DA0003',     price:59,  d:'Cable directo QSFP28 · 40G/100G · 3 m'},
    {sku:'XQ+CM0000-XS+', price:59,  d:'Adaptador QSFP28 a SFP/SFP+/SFP28 · 1G/10G/25G'},
  ],
};

// Las etiquetas legibles de ge/sfp10/sfp25/qsfp100 salen del mapa compartido
// OPTIC_LABEL de catalogProjection.js — son iguales para todos los vendors.

// Puntos de acceso gestionables por CAPsMAN, de sus fichas oficiales (listado «Indoor
// wireless», 2026-10-13). `poeDraw` es el «Max power consumption without attachments» de la
// ficha (un maximo, no un consumo tipico); `poeIn` dice que PoE acepta: los hAP solo aceptan
// PoE pasivo de 18-28 V, asi que un router con PoE-out 802.3af/at no los alimenta.
const ACCESS_POINTS = [
  {sku:'cAP ax',  model:'cAPGi-5HaxD2HaxD',    price:129, poeDraw:11, poeIn:'802.3af/at', poeV:[18, 57], d:'AP de techo Wi-Fi 6 · doble banda AX · 2x GE · PoE-in 802.3af/at (18-57 V)'},
  {sku:'wAP ax',  model:'wAPG-5HaxD2HaxD',     price:89,  poeDraw:9,  poeIn:'802.3af/at', poeV:[18, 57], d:'AP de pared/exterior Wi-Fi 6 · doble banda AX · 2x GE · PoE-in 802.3af/at (18-57 V)'},
  {sku:'hAP ax²', model:'C52iG-5HaxD2HaxD-TC', price:99,  poeDraw:12, poeIn:'pasivo', poeV:[18, 28],     d:'AP/router de escritorio Wi-Fi 6 · doble banda AX · 5x GE · PoE-in pasivo (18-28 V)'},
  {sku:'hAP ax³', model:'C53UiG+5HPaxD2HPaxD', price:139, poeDraw:15, poeIn:'pasivo', poeV:[18, 28],     d:'AP/router Wi-Fi 6 de alta potencia · 4x GE + 1x 2.5G · PoE-in pasivo (18-28 V)'},
];

const SUPPORT = {
  'sw-basic':   {n:'Comunidad (gratuito)', sla:'Sin SLA — foros + documentación oficial', d:'Soporte por comunidad MikroTik: forum.mikrotik.com, help.mikrotik.com y sistema de tickets del fabricante sin compromiso de tiempo de respuesta.'},
  'sw-premium': {n:'Contrato partner regional', sla:'8x5 NBD — partners certificados', d:'Soporte a través de partner certificado con SLA contractual. MikroTik no vende soporte directo con SLA: se contrata al canal.'},
  'training':   {n:'Certificación MTCNA / MTCRE', sla:'Capacitación formal', d:'Programa oficial: MTCNA (básico), MTCRE (routing), MTCWE (wireless), MTCTCE (traffic control), MTCINE (inter-networking).'},
};

// CRIPTOGRAFÍA POST-CUÁNTICA (2026-10-27, tema pqc-documentos). El manual de RouterOS, «QKD
// Integration in RouterOS IPsec (PPK)», describe la PPK de IPsec (RFC 9867, que amplía la 8784):
// estática por par, PSK de un solo uso o tomada de un servidor QKD, en IKEv2. El changelog oficial
// de la 7.21 (12-ene-2026) la anuncia: «ipsec - support Post-Quantum Pre-shared Key (PPK) with QKD
// integration (CLI only)». Es una clave simétrica, no un algoritmo post-cuántico: la ficha lo dice
// así. La PPK es de RouterOS, no de un modelo: se marca donde la ficha del equipo dice «RouterOS
// v7» (la 7.21 es una versión de la 7), y en CHR, que el manual describe como la edición virtual
// de RouterOS con las mismas funciones de VPN. Las fichas del hEX lite, el hEX RB750Gr3, el hEX PoE
// y el hEX S RB760iGS dicen solo «RouterOS», pero su manual de usuario (manual.mikrotik.com/hardware)
// dice «The device supports RouterOS v7 and above» (2026-10-27). Los del RB1100AHx4, el hEX PoE lite
// y la PowerBox Pro dicen solo «RouterOS software with the version number at or above what is
// indicated in […] /system resource», y la página de descargas solo sirve el cascarón sin
// JavaScript: «no consta», sin deducirlo de la arquitectura del procesador.
const PQC_ROUTEROS_V7 = new Set(['L009UiGS-2HaxD-IN', 'L009UiGS-RM', 'RB4011iGS+RM', 'RB5009UG+S+IN', 'RB5009UPr+S+IN',
  'RB5009UPr+S+OUT', 'CCR2004-16G-2S+', 'CCR2004-16G-2S+PC', 'CCR2004-1G-12S+2XS', 'CCR2116-12G-4S+',
  'CCR2216-1G-12XS-2XQ', 'E50UG', 'E60iUGS']);
const PQC_MANUAL_V7 = new Set(['RB750r2', 'RB750Gr3', 'RB960PGS', 'RB760iGS']);
for (const m of MODELS) {
  const chr = m.ser === 'CHR';
  const manual = PQC_MANUAL_V7.has(m.codigo);
  if (!chr && !manual && !PQC_ROUTEROS_V7.has(m.codigo)) continue;
  m.pqc = {tipo:'ppk',
    mecanismo:'Claves precompartidas post-cuánticas (PPK, RFC 9867 sobre la 8784) mezcladas en IKEv2: estáticas por par, PSK de un solo uso o tomadas de un servidor QKD',
    donde:'IKEv2 (IPsec); en la 7.21, solo por CLI', desde:'RouterOS 7.21',
    alcance: chr ? 'CHR es la edición virtual de RouterOS, con las mismas funciones de VPN (manual de RouterOS 7.26)'
      : manual ? 'su manual de usuario dice «The device supports RouterOS v7 and above»; la PPK es de RouterOS, no de un modelo'
      : 'su ficha dice «RouterOS v7»; la PPK es de RouterOS, no de un modelo',
    fuente:'«QKD Integration in RouterOS IPsec (PPK)» del manual de RouterOS y el changelog oficial de RouterOS 7.21'
      + (manual ? `; manual de usuario del ${m.codigo}` : '')};
}

module.exports = {
  MODELS, OPTICS, ACCESS_POINTS, SUPPORT, COMPATIBILIDAD, NOTAS_COMPAT,
  LICENSE_LEVELS, BGP_RAM, DESANCLADOS, SIN_FICHA,
};
