// Catalogo de kits Starlink (constelacion LEO de SpaceX) para el dimensionador de enlace
// satelital — public/dimensionador-starlink-leo.html.
//
// PROCEDENCIA: las fichas de especificaciones oficiales en PDF, leidas una por una el
// 2026-09-24. starlink.com no conecta desde el proxy de egreso del entorno donde se edita
// este repositorio, asi que las trajo `.github/workflows/traer-starlink.yml` desde un
// ejecutor de Actions a la rama de transporte `fuente/starlink-specs` (corrida 35949951292).
// Los PDF no llevan fecha impresa: la `fecha` de FUENTE es la de descarga, y se dice.
//
// LO QUE ESTA LECTURA CORRIGIO de la primera version, que se escribio sin poder abrir las
// fichas. Queda escrito para que se vea que estaba mal y por que:
//   - Un «cable Starlink de 45 m» para el Standard: ninguna ficha lo menciona. Se retiro;
//     un tendido mas largo que el cable incluido ahora APARTA el kit con su motivo.
//   - El Flat High Performance como «linea anterior»: la ficha no dice nada del ciclo de
//     vida. Deducirlo es el `noAplica` deducido que este catalogo prohibe.
//   - `maritimo: true` en Performance y Flat High Performance: ninguna de las dos fichas
//     menciona uso maritimo. La del Performance dice «in-motion usage» y nada mas.
//   - `enMovimiento: false` en el Standard: la ficha no lo prohibe, solo no lo menciona.
//     Es «no consta» (null), no «no» — el mismo tercer estado de `redund`.
//   - La fuente del Flat High Performance es solo AC (100-240 V): `dc` pasa de null a false.
// Y lo que aporto que no estaba: el Performance entero (estaba casi todo en null) y el kit
// Enterprise, que no estaba en el catalogo.
//
// `null` SIGUE SIGNIFICANDO «LA FICHA NO LO DICE», nunca «no tiene». Un escenario que pide
// ese dato aparta el kit con su motivo en vez de darlo por bueno.
//
// PRECIOS Y SKU: `null` en todos. Starlink tarifica kit y plan por pais; las fichas no traen
// precio ni numero de pedido, y no hay lista del canal en este repositorio.
//
// RENDIMIENTO: las fichas no publican un caudal garantizado. La unica cifra es la del
// Performance («download speeds up to 400+ Mbps»), que es un maximo y no una capacidad de
// planificacion — por eso se muestra como dato y no alimenta el calculo. El numero de
// terminales sale de un SUPUESTO de la herramienta, editable y declarado en pantalla.

const BASE = 'https://api.starlink.com/public-files/specification_sheet_';

const FUENTE = {
  documento: 'Fichas de especificaciones Starlink (PDF oficiales)',
  url: `${BASE}standard.pdf`,
  fecha: '2026-09-24',
  verificado: true,
  nota: 'Fecha de descarga: los PDF no llevan fecha impresa. Traidos por traer-starlink.yml a la rama fuente/starlink-specs; starlink.com no conecta desde el entorno de edicion.',
};

// `enMovimiento` / `maritimo`: solo `true` si la ficha lo dice. `dc`: si la fuente del kit
// acepta DC. `watts`: consumo medio publicado {min, max}. `cableIncluidoM`: el cable que trae
// la caja desde la antena (en el Mini es el de alimentacion DC, porque el router va en la
// antena). `cableMaxM`: el cable mas largo que la ficha documenta para el kit; null en todos
// porque ninguna ficha documenta uno. `routerIncluido`: si la caja trae router Wi-Fi.
const KITS = [
  {
    id: 'standard',
    nombre: 'Starlink Standard',
    uso: 'Sitio fijo: sucursal, oficina remota, respaldo de enlace terrestre.',
    legacy: false,
    orden: 1,
    enMovimiento: null,
    maritimo: null,
    dc: false,
    watts: { min: 75, max: 100 },
    ip: 'IP67 Type 4',
    campoVision: '110°',
    temperatura: '-30 °C a 50 °C',
    dimensiones: '594 × 383 × 39,7 mm',
    pesoKg: 2.9,
    router: 'Router 3: Wi-Fi 6 tribanda, 2 puertos Ethernet LAN',
    routerIncluido: true,
    cableIncluidoM: 15,
    cableTipo: 'cable Starlink antena → router',
    cableMaxM: null,
    velocidad: null,
    fuenteUrl: `${BASE}standard.pdf`,
    nota: 'La ficha se titula «Standard 4 X».',
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
    ip: 'IP67 Type 4 (con cable DC y Starlink Plug)',
    campoVision: '110°',
    temperatura: '-30 °C a 50 °C',
    dimensiones: '298,5 × 259 × 38,5 mm',
    pesoKg: 1.1,
    router: 'Wi-Fi 5 integrado en la antena, 1 puerto Ethernet con Starlink Plug',
    routerIncluido: true,
    cableIncluidoM: 15,
    cableTipo: 'cable de alimentación DC (el router va en la antena)',
    cableMaxM: null,
    velocidad: null,
    fuenteUrl: `${BASE}mini.pdf`,
    nota: 'Entrada 12-48 V, 60 W; por USB-C exige 100 W PD con el cable accesorio. El cable Ethernet del Mini no viene en la caja.',
    sku: null,
    elpN: null,
  },
  {
    id: 'enterprise',
    nombre: 'Starlink Enterprise',
    uso: 'Sitio fijo con tendido largo y red propia: sin router Wi-Fi, se integra por Ethernet.',
    legacy: false,
    orden: 3,
    enMovimiento: null,
    maritimo: null,
    dc: false,
    watts: { min: 75, max: 100 },
    ip: 'IP67 Type 4',
    campoVision: '110°',
    temperatura: '-30 °C a 50 °C',
    dimensiones: '594 × 383 × 39,7 mm',
    pesoKg: null,
    router: 'Sin router: puerto de red en la fuente y cable Ethernet de 5 m',
    routerIncluido: false,
    cableIncluidoM: 50,
    cableTipo: 'cable Enterprise antena → fuente',
    cableMaxM: null,
    velocidad: null,
    fuenteUrl: `${BASE}enterprise.pdf`,
    nota: 'La ficha no publica el peso de la antena, solo el del paquete (12,2 kg).',
    sku: null,
    elpN: null,
  },
  {
    id: 'performance',
    nombre: 'Starlink Performance',
    uso: 'Exigente: en movimiento, clima extremo, alta vibración o misión crítica.',
    legacy: false,
    orden: 4,
    enMovimiento: true,
    maritimo: null,
    dc: true,
    watts: { min: 75, max: 100 },
    ip: 'IP68 sin cables / IP69K con cables',
    campoVision: '140°',
    temperatura: '-40 °C a 60 °C',
    dimensiones: '609 × 396 × 40 mm',
    pesoKg: 5.2,
    router: 'Sin router: fuente avanzada con puerto LAN y PoE; compatible con Router 3, Router Mini o router de terceros',
    routerIncluido: false,
    cableIncluidoM: 25,
    cableTipo: 'cable Performance antena → fuente',
    cableMaxM: null,
    velocidad: 'hasta 400+ Mbps de bajada (máximo publicado, no garantizado)',
    fuenteUrl: `${BASE}performance.pdf`,
    nota: 'Fuente avanzada 100-240 VAC y 12-56 VDC, montable en rack, con entrada DC para batería de respaldo.',
    sku: null,
    elpN: null,
  },
  {
    id: 'flat-hp',
    nombre: 'Starlink Flat High Performance',
    uso: 'Montaje fijo plano de alto rendimiento (orientación fija, 140° de campo de visión).',
    legacy: false,
    orden: 5,
    enMovimiento: null,
    maritimo: null,
    dc: false,
    watts: { min: 110, max: 150 },
    ip: 'IP56',
    campoVision: '140°',
    temperatura: '-30 °C a 50 °C',
    dimensiones: '575 × 511 × 41 mm',
    pesoKg: 5.9,
    router: 'Sin router: puerto Ethernet en la fuente y cable Ethernet de 5 m',
    routerIncluido: false,
    cableIncluidoM: 25,
    cableTipo: 'cable Starlink antena → fuente',
    cableMaxM: null,
    velocidad: null,
    fuenteUrl: `${BASE}flat_high_performance.pdf`,
    nota: 'La ficha no dice nada de su ciclo de vida ni de uso en movimiento.',
    sku: null,
    elpN: null,
  },
];

module.exports = { KITS, FUENTE };
