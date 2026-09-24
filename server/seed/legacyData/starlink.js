// Catalogo de kits Starlink (constelacion LEO de SpaceX) para el dimensionador de enlace
// satelital — public/dimensionador-starlink-leo.html.
//
// PROCEDENCIA: SIN VERIFICAR, y se declara igual que en mikrotik.js. Este archivo se escribio
// el 2026-09-24 desde un entorno cuyo proxy de egreso corta starlink.com (medido ese dia:
// `curl https://www.starlink.com/specifications` no conecta), asi que ninguna cifra se leyo
// de la ficha oficial. Lo que hay son los datos generales del kit que la herramienta necesita
// para decidir, y **solo** donde se conocen con seguridad razonable; el resto va en `null`,
// que aqui significa «el catalogo no lo trae», nunca «no tiene» — el mismo tercer estado de
// `redund`. Un dato que falta aparta el kit con su motivo en vez de dejarlo competir a ciegas.
// Para cerrarlo: contrastar cada campo con https://www.starlink.com/specifications desde una
// maquina con salida y dejar el diff en git (PENDIENTES.md).
//
// PRECIOS Y SKU: `null` en todos. Starlink tarifica kit y plan por pais y los cambia sin
// aviso; no hay lista de precios firmada en este repositorio, asi que el BOM los cuenta como
// «sin cotizar» en vez de mostrar una cifra con pinta de oficial.
//
// RENDIMIENTO: Starlink NO publica un caudal garantizado por terminal —publica rangos
// tipicos que dependen de la celda, la congestion y el plan—. Por eso el dimensionador no
// lee una capacidad de este archivo: la cifra de planificacion por terminal es un SUPUESTO
// de la herramienta, editable y declarado en pantalla, igual que OVERHEAD_ESP en Fortinet.

const FUENTE = {
  documento: 'Especificaciones de hardware Starlink',
  url: 'https://www.starlink.com/specifications',
  fecha: null,
  verificado: false,
  nota: 'Transcrito sin contrastar contra la ficha oficial: starlink.com esta bloqueado por la politica de egreso del entorno donde se escribio.',
};

// `enMovimiento` / `maritimo`: si el fabricante lo soporta oficialmente. `watts`: consumo
// medio {min, max} en W. `dc`: si el kit acepta alimentacion DC sin adaptadores de terceros.
// `cableIncluidoM` / `cableMaxM`: longitud del cable que trae la caja y la del cable mas
// largo que vende el propio fabricante para ese kit.
const KITS = [
  {
    id: 'standard',
    nombre: 'Starlink Standard',
    uso: 'Sitio fijo: sucursal, oficina remota, respaldo de enlace terrestre.',
    legacy: false,
    orden: 1,
    enMovimiento: false,
    maritimo: false,
    dc: false,
    watts: { min: 75, max: 100 },
    ip: 'IP67',
    campoVision: '110°',
    dimensiones: '594 × 383 mm',
    pesoKg: 2.9,
    router: 'Router Gen 3 Wi-Fi 6 tribanda, 2 puertos Ethernet',
    cableIncluidoM: 15,
    cableMaxM: 45,
    sku: null,
    elpN: null,
  },
  {
    id: 'mini',
    nombre: 'Starlink Mini',
    uso: 'Portátil y bajo consumo: cuadrillas, sitios temporales, alimentación DC o solar.',
    legacy: false,
    orden: 2,
    enMovimiento: null,
    maritimo: null,
    dc: true,
    watts: { min: 25, max: 40 },
    ip: 'IP67',
    campoVision: null,
    dimensiones: '298,5 × 259 mm',
    pesoKg: 1.1,
    router: 'Wi-Fi integrado en la antena',
    cableIncluidoM: null,
    cableMaxM: null,
    sku: null,
    elpN: null,
  },
  {
    id: 'performance',
    nombre: 'Starlink Performance',
    uso: 'Exigente: en movimiento, marítimo, clima extremo o misión crítica.',
    legacy: false,
    orden: 3,
    enMovimiento: true,
    maritimo: true,
    dc: null,
    watts: null,
    ip: null,
    campoVision: null,
    dimensiones: null,
    pesoKg: null,
    router: null,
    cableIncluidoM: null,
    cableMaxM: null,
    sku: null,
    elpN: null,
  },
  {
    id: 'flat-hp',
    nombre: 'Starlink Flat High Performance',
    uso: 'Línea anterior para uso en movimiento; se conserva para ampliar parque instalado.',
    legacy: true,
    orden: 4,
    enMovimiento: true,
    maritimo: true,
    dc: null,
    watts: { min: 110, max: 150 },
    ip: 'IP56',
    campoVision: null,
    dimensiones: '575 × 511 mm',
    pesoKg: null,
    router: null,
    cableIncluidoM: null,
    cableMaxM: null,
    sku: null,
    elpN: null,
  },
];

module.exports = { KITS, FUENTE };
