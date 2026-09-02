// Catálogo Nokia para el dimensionador de fabric de datacenter — línea 7220 IXR sobre SR Linux.
//
// POR QUÉ SOLO 4 MODELOS Y NO LOS 18 DEL PORTAL
// `indexPR.js` y `cotizadorCatalog.js` ya listan los 18 modelos Nokia (7220 IXR, 7250 IXR,
// 7750 SR) como referencia comercial, pero el dimensionador (pendiente 6 de PENDIENTES.md)
// no se puede construir igual para los tres: la 7220 IXR es fabric de datacenter puro —dos
// roles claros, leaf y spine, cada modelo con una única velocidad de puerto— mientras que
// 7250 IXR y 7750 SR son routers de agregación/borde/core IP-MPLS, que se dimensionan por
// capacidad y densidad de puertos de UN equipo, no por cuántos leafs y spines hacen falta.
// Mezclar los dos motores en una sola pasada habría dejado ambos a medias. Esta primera
// entrega cubre la 7220 IXR, que además es el ejemplo que el propio PENDIENTES.md usa para
// justificar un motor de fabric ("no se dimensiona por ancho de banda WAN"). 7250 IXR/7750 SR
// quedan documentados como fase 2 en PENDIENTES.md.
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
  {id:'7220 IXR-D1', ser:'7220 IXR', seg:'Acceso / Gestión DC', rol:['acceso'],
   puertos:[{cantidad:48, veloc:1, uso:'acceso'}, {cantidad:4, veloc:10, uso:'fabric'}],
   cap:88, ifaces:'48x1GE RJ45 + 4x SFP+ · 1U'},
  {id:'7220 IXR-D2L', ser:'7220 IXR', seg:'Leaf datacenter', rol:['leaf'],
   puertos:[{cantidad:48, veloc:25, uso:'acceso'}, {cantidad:8, veloc:100, uso:'fabric'}, {cantidad:2, veloc:10, uso:'gestion'}],
   cap:4000, ifaces:'48x25GE SFP28 + 8x100GE QSFP28 + 2x10GE · 1U'},
  {id:'7220 IXR-D3L', ser:'7220 IXR', seg:'Leaf / Spine compacto', rol:['leaf', 'spine'],
   puertos:[{cantidad:32, veloc:100, uso:'ambos'}, {cantidad:2, veloc:10, uso:'gestion'}],
   cap:6400, ifaces:'32x100GE QSFP28 + 2x SFP+ · 1U'},
  {id:'7220 IXR-D5', ser:'7220 IXR', seg:'Spine datacenter 400G', rol:['spine'],
   puertos:[{cantidad:32, veloc:400, uso:'fabric'}, {cantidad:2, veloc:10, uso:'gestion'}],
   cap:12800, ifaces:'32x400GE QSFP-DD + 2x SFP+ · 1U'},
];

module.exports = { MODELS };
