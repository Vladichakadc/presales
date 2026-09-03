// Catálogo Nokia. Dos bloques, porque son dos preguntas: `MODELS` es la línea 7220 IXR sobre
// SR Linux, que se diseña como FABRIC, y `MODELS_ROUTER` son los otros catorce (7250 IXR y
// 7750 SR), que se eligen de UNO EN UNO por capacidad. Ver la cabecera de cada bloque.
//
// POR QUÉ SOLO 4 MODELOS Y NO LOS 18 DEL PORTAL
// `indexPR.js` y `cotizadorCatalog.js` ya listan los 18 modelos Nokia (7220 IXR, 7250 IXR,
// 7750 SR) como referencia comercial, pero el dimensionador (pendiente 6 de PENDIENTES.md)
// no se puede construir igual para los tres: la 7220 IXR es fabric de datacenter puro —dos
// roles claros, leaf y spine, cada modelo con una única velocidad de puerto— mientras que
// 7250 IXR y 7750 SR son routers de agregación/borde/core IP-MPLS, que se dimensionan por
// capacidad y densidad de puertos de UN equipo, no por cuántos leafs y spines hacen falta.
// Mezclar los dos motores en una sola pasada habría dejado ambos a medias. La primera entrega
// cubrió la 7220 IXR, que además es el ejemplo que el propio PENDIENTES.md usa para justificar
// un motor de fabric ("no se dimensiona por ancho de banda WAN"). **La fase 2 (2026-09-03)
// cubre los otros catorce** en `MODELS_ROUTER`, más abajo en este mismo archivo, con su propia
// página y su propio motor por capacidad.
//
// PROCEDENCIA
// Las cifras de puertos y capacidad de conmutación no son nuevas: ya estaban verificadas en
// `indexPR.js` (campo `ports`, con las URL de datasheet en su cabecera) y en
// `cotizadorCatalog.js`. Aquí se ESTRUCTURAN en campos numéricos que un motor pueda usar —no
// se inventa ni se corrige ningún dato, es la misma cifra ya publicada, solo parseada.
//
// `puertos`: un array de grupos {cantidad, veloc (Gbps), uso}. `uso` distingue para qué sirve
// cada grupo de puertos en un diseño de fabric:
//   'acceso'  — hacia servidores o hacia un leaf de nivel inferior (solo en modelos de acceso).
//   'fabric'  — hacia el spine, o desde el spine hacia los leafs (uplink/downlink de fabric).
//   'ambos'   — puertos uniformes que el diseño reparte entre acceso y fabric según el rol
//               que se le asigne al equipo (p. ej. el D3L, vendido explícitamente como
//               "Leaf / Spine compacto": los mismos 32x100GE sirven de acceso si se usa como
//               leaf, o de downlink si se usa como spine).
//   'gestion' — fuera de la escala de fabric (gestión, OOB): el motor no los cuenta.
const MODELS = [
  {id:'7220 IXR-D1', redund:true, psu:{tipo:'1+1 redundante, AC o DC, intercambiable en caliente', volts:'AC 100-240 V · DC -48 a -60 V', texto:'Fuentes de 240 W AC y 550 W DC — es la potencia de la fuente, no el consumo del equipo, asi que no se declara como consumo tipico.'}, ser:'7220 IXR', seg:'Acceso / Gestión DC', rol:['acceso'],
   puertos:[{cantidad:48, veloc:1, uso:'acceso'}, {cantidad:4, veloc:10, uso:'fabric'}],
   cap:88, ifaces:'48x1GE RJ45 + 4x SFP+ · 1U'},
  {id:'7220 IXR-D2L', redund:true, psu:{tipo:'1+1 redundante, AC, DC o HVDC, intercambiable en caliente', volts:'AC 100-240 V · DC -48 a -60 V · HVDC 190-310 V', texto:'Fuentes de 650 W AC y 650 W DC. Es potencia de fuente y no consumo: el D3L, con 3,2 Tb/s frente a los 2,0 de este, declara exactamente la misma cifra.'}, ser:'7220 IXR', seg:'Leaf datacenter', rol:['leaf'],
   puertos:[{cantidad:48, veloc:25, uso:'acceso'}, {cantidad:8, veloc:100, uso:'fabric'}, {cantidad:2, veloc:10, uso:'gestion'}],
   cap:4000, ifaces:'48x25GE SFP28 + 8x100GE QSFP28 + 2x10GE · 1U'},
  {id:'7220 IXR-D3L', redund:true, psu:{tipo:'1+1 redundante, AC, DC o HVDC, intercambiable en caliente', volts:'AC 100-240 V · DC -48 a -60 V · HVDC 190-310 V', texto:'Fuentes de 650 W AC y 650 W DC — la misma cifra que el D2L pese a tener mas capacidad, lo que confirma que es potencia de fuente y no consumo.'}, ser:'7220 IXR', seg:'Leaf / Spine compacto', rol:['leaf', 'spine'],
   puertos:[{cantidad:32, veloc:100, uso:'ambos'}, {cantidad:2, veloc:10, uso:'gestion'}],
   cap:6400, ifaces:'32x100GE QSFP28 + 2x SFP+ · 1U'},
  {id:'7220 IXR-D5', redund:true, psu:{tipo:'1+1 redundante, AC o DC, intercambiable en caliente', volts:'AC 100-240 V · DC -48 a -60 V', texto:'Fuentes de 1500 W AC y 1600 W DC — potencia de fuente, no consumo del equipo.'}, ser:'7220 IXR', seg:'Spine datacenter 400G', rol:['spine'],
   puertos:[{cantidad:32, veloc:400, uso:'fabric'}, {cantidad:2, veloc:10, uso:'gestion'}],
   cap:12800, ifaces:'32x400GE QSFP-DD + 2x SFP+ · 1U'},
];


// ── FASE 2: los 14 modelos que NO son fabric (7250 IXR y 7750 SR) ───────────────────────
//
// POR QUE UN SEGUNDO MOTOR Y NO UNA LISTA MAS LARGA
// La 7220 IXR de arriba se dimensiona como FABRIC: la pregunta es cuantos leafs y cuantos
// spines hacen falta para N servidores. Estos catorce se dimensionan como UN EQUIPO: la
// pregunta es cual aguanta el caudal y trae los puertos que el enlace necesita. Son dos
// preguntas distintas y por eso son dos paginas; meterlas en la misma habria dejado las dos
// a medias, que es justo lo que decidio la fase 1.
//
// LA PLATAFORMA SE ELIGE ANTES QUE EL CAUDAL, igual que en Cisco. Estas cinco familias no son
// intercambiables aunque coincidan en Tbps: un router de cell site, un agregador de datacenter
// y un PE de core IP-MPLS cambian el sistema operativo, el papel en la red y quien la opera.
// `plat` las separa y el motor acota por familia antes de aplicar el mas pequenyo que cumple.
//
// PROCEDENCIA: NO HAY NINGUN DATO NUEVO AQUI. La capacidad y los puertos ya estaban
// verificados en `indexPR.js` como texto libre ("6.4 Tbps", "36x100GE o 12x400GE · 1U"); esto
// los ESTRUCTURA en campos numericos que un motor pueda usar. No se anyadio, corrigio ni
// completo ninguna cifra: donde el texto no dice algo, el campo va en `null`.
//
// TRES COSAS QUE EL TEXTO LIBRE ESCONDIA Y QUE ESTRUCTURAR OBLIGO A DECIDIR:
//
//   1. «36x100GE o 12x400GE» son DOS CONFIGURACIONES ALTERNATIVAS, no la suma de las dos. Un
//      7250 IXR-6e da 36 puertos de 100GE **o** 12 de 400GE, nunca ambos. Por eso `configs`
//      es una lista de opciones y el motor comprueba si ALGUNA cumple, en vez de sumar
//      puertos que no coexisten -que habria prometido 48 interfaces donde hay 36.
//
//   2. LOS CHASIS MODULARES NO PUBLICAN DENSIDAD. «7 slots IOM · hasta 400GE» dice cuantas
//      tarjetas caben, no cuantos puertos salen: eso depende de que IOM se pida, y este
//      catalogo no tiene el catalogo de IOM. `configs: null` y `slots` con lo que si se sabe.
//      El motor los dimensiona por caudal y DECLARA que no puede comprobar los puertos, en vez
//      de inventar una densidad por slot -el mismo trato que da `ficha.js` a una capa sin cifra.
//
//   3. «GE / 10GE» TAMPOCO ES UNA DENSIDAD. El 7250 IXR-e y el IXR-e2 publican las velocidades
//      que admiten pero no cuantos puertos de cada una. Mismo trato: caudal si, puertos no.
//
// `cap` va en Gbps para que sea un numero comparable, aunque el material comercial lo cite en
// Tbps: 6.4 Tbps son 6400. Es la capacidad de conmutacion del equipo.
const PLATAFORMAS = {
  ixr:   { n: '7250 IXR', d: 'Agregacion y cell site. Routers de acceso y agregacion IP/MPLS, con los modelos de datacenter (6e/10e) sobre SR Linux.' },
  ixrx:  { n: '7250 IXR-X', d: 'Agregacion y spine de alta capacidad en formato fijo 1U, sobre SR Linux.' },
  ixrr:  { n: '7250 IXR-R', d: 'Agregacion modular, la unica familia de este grupo con interfaces TDM heredadas.' },
  sr:    { n: '7750 SR / SR-s', d: 'PE, borde y core IP/MPLS. Es donde viven SR-MPLS, SRv6 y FlexE.' },
  sr1x:  { n: '7750 SR-1x', d: 'PE de alta densidad en formato fijo 2U, la generacion compacta del 7750.' },
};

// `configs`: cada entrada es UNA configuracion posible de puertos, con su nombre tal y como lo
// cita el catalogo. `puertos` dentro de ella son grupos {cantidad, veloc} en Gbps.
// `slots`: solo en los chasis modulares, con lo que el catalogo si publica.
const MODELS_ROUTER = [
  // ── 7250 IXR ──
  {id:'7250 IXR-e', plat:'ixr', ser:'7250 IXR', seg:'Cell Site / Edge compacto', cap:300,
   configs:null, slots:null, ru:null, velocidades:[1, 10],
   protos:'SR-MPLS, EVPN',
   notaPuertos:'El catalogo publica las velocidades que admite (GE y 10GE) pero no cuantos puertos de cada una, asi que no se dimensiona por densidad.',
   ifaces:'GE / 10GE'},
  {id:'7250 IXR-e2', plat:'ixr', ser:'7250 IXR', seg:'Cell site / Acceso', cap:800,
   configs:null, slots:null, ru:null, velocidades:[1, 10, 25],
   protos:'SR-MPLS, SRv6, EVPN',
   notaPuertos:'El catalogo publica las velocidades que admite (GE, 10GE y 25GE) pero no cuantos puertos de cada una.',
   ifaces:'GE / 10GE / 25GE'},
  {id:'7250 IXR-6e', plat:'ixr', ser:'7250 IXR', seg:'Leaf datacenter', cap:6400,
   configs:[{n:'36x100GE', puertos:[{cantidad:36, veloc:100}]},
            {n:'12x400GE', puertos:[{cantidad:12, veloc:400}]}],
   slots:null, ru:1, velocidades:[100, 400],
   protos:'SR Linux, EVPN-VXLAN, ECMP', notaPuertos:null,
   ifaces:'36x100GE o 12x400GE · 1U'},
  {id:'7250 IXR-10e', plat:'ixr', ser:'7250 IXR', seg:'Spine datacenter', cap:12800,
   configs:[{n:'36x400GE', puertos:[{cantidad:36, veloc:400}]}],
   slots:null, ru:1, velocidades:[400],
   protos:'SR Linux, EVPN-VXLAN', notaPuertos:null,
   ifaces:'36x400GE · 1U'},

  // ── 7250 IXR-X ──
  {id:'7250 IXR-X1b', plat:'ixrx', ser:'7250 IXR-X', seg:'Agregacion / Edge', cap:7200,
   configs:[{n:'24x100GE + 12x400GE', puertos:[{cantidad:24, veloc:100}, {cantidad:12, veloc:400}]}],
   slots:null, ru:1, velocidades:[100, 400],
   protos:'SR Linux, SR-MPLS, EVPN', notaPuertos:null,
   ifaces:'24x100GE QSFP28 + 12x400GE QSFP-DD · 1U'},
  {id:'7250 IXR-X3b', plat:'ixrx', ser:'7250 IXR-X', seg:'Spine / Core DC', cap:14400,
   configs:[{n:'36x400GE', puertos:[{cantidad:36, veloc:400}]}],
   slots:null, ru:1, velocidades:[400],
   protos:'SR Linux, SR-MPLS, EVPN', notaPuertos:null,
   ifaces:'36x400GE QSFP-DD · 1U'},

  // ── 7250 IXR-R ──
  {id:'7250 IXR-R6dl', plat:'ixrr', ser:'7250 IXR-R', seg:'Agregacion modular', cap:2400,
   configs:null, slots:{cantidad:6, tipo:'tarjeta', hasta:400}, ru:7, velocidades:[400],
   protos:'SR-MPLS, SRv6, EVPN, interfaces TDM heredadas',
   notaPuertos:'Chasis modular de 6 slots con interfaces de hasta 400GE. Cuantos puertos salen depende de que tarjetas se pidan, y este catalogo no tiene el catalogo de tarjetas.',
   ifaces:'6 slots · 4x400GE QSFP-DD · 7U'},

  // ── 7750 SR y SR-s ──
  {id:'7750 SR-1', plat:'sr', ser:'7750 SR', seg:'PE compacto / Edge', cap:400,
   configs:[{n:'36x10GE', puertos:[{cantidad:36, veloc:10}]},
            {n:'8x100GE', puertos:[{cantidad:8, veloc:100}]}],
   slots:null, ru:1, velocidades:[10, 100],
   protos:'SR-MPLS, SRv6, EVPN, FlexAlgo', notaPuertos:null,
   ifaces:'36x10GE o 8x100GE · 1U'},
  {id:'7750 SR-1s', plat:'sr', ser:'7750 SR-s', seg:'PE / Edge', cap:1200,
   configs:[{n:'36x100GE', puertos:[{cantidad:36, veloc:100}]},
            {n:'12x400GE', puertos:[{cantidad:12, veloc:400}]}],
   slots:null, ru:2, velocidades:[100, 400],
   protos:'SR-MPLS, SRv6, EVPN, FlexE', notaPuertos:null,
   ifaces:'36x100GE o 12x400GE · 2U'},
  {id:'7750 SR-2s', plat:'sr', ser:'7750 SR-s', seg:'Edge / Agregacion', cap:4000,
   configs:[{n:'144x100GE', puertos:[{cantidad:144, veloc:100}]},
            {n:'36x400GE', puertos:[{cantidad:36, veloc:400}]}],
   slots:null, ru:4, velocidades:[100, 400],
   protos:'SR-MPLS, SRv6, EVPN', notaPuertos:null,
   ifaces:'144x100GE o 36x400GE · 4U'},
  {id:'7750 SR-7s', plat:'sr', ser:'7750 SR-s', seg:'Core IP/MPLS', cap:19200,
   configs:null, slots:{cantidad:7, tipo:'IOM', hasta:400}, ru:null, velocidades:[400],
   protos:'SR-MPLS, SRv6, FlexE, EVPN',
   notaPuertos:'Chasis modular de 7 slots IOM con interfaces de hasta 400GE. La densidad depende de que IOM se pida.',
   ifaces:'7 slots IOM · hasta 400GE'},
  {id:'7750 SR-14s', plat:'sr', ser:'7750 SR-s', seg:'Core grande', cap:38400,
   configs:null, slots:{cantidad:14, tipo:'IOM', hasta:400}, ru:null, velocidades:[400],
   protos:'SR-MPLS, SRv6, FlexE, EVPN',
   notaPuertos:'Chasis modular de 14 slots IOM con interfaces de hasta 400GE. La densidad depende de que IOM se pida.',
   ifaces:'14 slots IOM · hasta 400GE'},

  // ── 7750 SR-1x ──
  {id:'7750 SR-1x-48D', redund:true, psu:{tipo:'1+1 redundante en AC y en DC, con redundancia tambien de acometida', volts:'AC 180-264 V, 50/60 Hz (20 A max por acometida) · DC -40 a -72 V (80 A max por acometida)', texto:'La ficha declara 1+1 de fuente y redundancia de acometida en las dos alimentaciones. No publica consumo tipico.'}, plat:'sr1x', ser:'7750 SR-1x', seg:'PE / Edge alta densidad', cap:6000,
   configs:[{n:'48x400GE', puertos:[{cantidad:48, veloc:400}]},
            {n:'192x100GE', puertos:[{cantidad:192, veloc:100}]}],
   slots:null, ru:2, velocidades:[100, 400],
   protos:'SR-MPLS, SRv6, EVPN, FlexE', notaPuertos:null,
   ifaces:'48x400GE QSFP-DD o 192x100GE · 2U'},
  {id:'7750 SR-1x-92S', redund:true, psu:{tipo:'1+1 redundante en AC y en DC, con redundancia tambien de acometida', volts:'AC 180-264 V, 50/60 Hz (20 A max por acometida) · DC -40 a -72 V (80 A max por acometida)', texto:'La ficha declara 1+1 de fuente y redundancia de acometida en las dos alimentaciones. No publica consumo tipico.'}, plat:'sr1x', ser:'7750 SR-1x', seg:'PE / Edge multiservicio', cap:6000,
   configs:[{n:'12x400GE + 80x100GE', puertos:[{cantidad:12, veloc:400}, {cantidad:80, veloc:100}]}],
   slots:null, ru:2, velocidades:[100, 400],
   protos:'SR-MPLS, SRv6, EVPN, FlexE', notaPuertos:null,
   ifaces:'12x400GE + 80x100GE SFP-DD · 2U'},
];

module.exports = { MODELS, MODELS_ROUTER, PLATAFORMAS };
