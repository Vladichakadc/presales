// ── HPE Aruba Networking · catálogo y datos de dimensionamiento ──────────────
//
// Cubre las tres piezas del portafolio que intervienen en una preventa de WAN/sucursal:
// los appliances EdgeConnect SD-WAN, los gateways (SD-Branch serie 9000 y campus serie
// 9200) y el software/servicios que los acompañan.
//
// PROCEDENCIA DE LOS DATOS — LEER ANTES DE COTIZAR
// Los valores de esta revisión provienen de páginas de producto y de tienda oficiales de
// HPE/Aruba (hpe.com, buy.hpe.com, arubanetworks.com, arubanetworking.hpe.com), no de una
// estimación. Cada modelo lleva en `ds` la URL de su datasheet o spec sheet oficial para
// contrastar, y DATASHEETS reúne los documentos de referencia del portafolio.
//
// Límite honesto de esta revisión: los PDF no pudieron abrirse directamente desde el
// entorno donde se hizo la recopilación (bloqueo de egreso de red), así que las cifras se
// tomaron de las descripciones publicadas en esas páginas oficiales y NO de la lectura
// íntegra del datasheet. Sirven para elegir modelo y armar el alcance; antes de emitir una
// propuesta hay que abrir el PDF enlazado y confirmar la fila exacta.
//
// SIN PRICE LIST. Sigue sin haber lista de precios verificada, a diferencia de Fortinet.
// Los SKU de hardware que aparecen SÍ son reales (tomados de buy.hpe.com); los precios
// quedan en null y el BOM declara esas líneas "sin cotizar" en vez de inventar un importe.
//
// CORRECCIONES RESPECTO A LA PRIMERA VERSIÓN DE ESTE ARCHIVO (documentadas a propósito):
//   · Se elimina "EC-2XL": no existe en el portafolio. La gama va XS → S → M → L → XL.
//   · Los niveles de suscripción no son "Base/Advanced" sino Foundation / Advanced /
//     On-Premises, y los tiers de caudal publicados son 100 Mbps, 1 Gbps e ilimitado.
//   · El soporte no es "Pointnext Tech Care" sino HPE Aruba Networking Foundational Care.
//   · El 9240 no es un gateway de sucursal sino de campus (serie 9200), y su capacidad la
//     fija la licencia perpetua, no el hardware.
//   · Se retiran los modelos 9106/9114, que no aparecen en el portafolio publicado.

// Documentos de referencia del portafolio. Se enlazan desde la página para que el
// preventa llegue al PDF sin buscarlo.
const DATASHEETS = {
  ecHardware:  {n:'EdgeConnect Hardware Reference Guide (PDF)', url:'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/hardware/reference/EdgeConnect-Hardware-Reference_latest.pdf'},
  ecQuickspecs:{n:'EdgeConnect SD-WAN QuickSpecs',              url:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html'},
  ecSpecSheet: {n:'EdgeConnect Spec Sheet (US)',                url:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet'},
  ecOverview:  {n:'EdgeConnect SD-WAN — página de producto',    url:'https://www.hpe.com/us/en/aruba-edgeconnect-sd-wan.html'},
  ecvAzure:    {n:'EdgeConnect Virtual (EC-V) en Azure — guía de despliegue (PDF)', url:'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/deployments/dg_ECV-Azure_latest.pdf'},
  gw9000:      {n:'Serie 9000 — Branch Gateways, data sheet (PDF)', url:'https://www.arubanetworks.com/assets/ds/DS_9000Series.pdf'},
  gw9000Psnow: {n:'Serie 9000 — Branch Gateways (HPE PSNow)',    url:'https://www.hpe.com/psnow/doc/a00067607enw'},
  gw9000Spec:  {n:'Serie 9000 — especificaciones (soporte HPE)', url:'https://support.hpe.com/hpesc/public/docDisplay?docId=a00099295en_us&docLocale=en_US'},
  gw9200:      {n:'Serie 9200 — Campus Gateways, data sheet',    url:'https://www.hpe.com/psnow/doc/PSN1014459233NGEN'},
  gw9200Psnow: {n:'Serie 9200 — Campus Gateway (HPE PSNow)',     url:'https://www.hpe.com/psnow/doc/a00121209enw'},
  sdBranchVsg: {n:'SD-Branch Design — Validated Solution Guide (PDF)', url:'https://arubanetworking.hpe.com/techdocs/VSG/docs/070-sd-branch-design/Media/PDF/Aruba_VSG_SD-Branch-Design.pdf'},
  sdwanOrder:  {n:'SD-WAN Gateways — Ordering Guide (PDF)',      url:'https://higherlogicdownload.s3.amazonaws.com/HPE/MigratedAssets/OG_SD-WAN.pdf'},
  centralLic:  {n:'Central — Licensing Guide (PDF)',             url:'https://arubanetworking.hpe.com/techdocs/central/pdfs/2.5.8/licensing-guide.pdf'},
  centralSaas: {n:'Central — suscripciones SaaS (Foundation / Advanced)', url:'https://www.hpe.com/psnow/doc/a00125615enw'},
  foundCare:   {n:'HPE Aruba Networking Foundational Care',      url:'https://www.hpe.com/psnow/doc/a00111733enw'},
  clearpass:   {n:'ClearPass — Access License, data sheet',      url:'https://www.hpe.com/psnow/doc/PSN1010354100DEEN'},
  orchDocs:    {n:'EdgeConnect Orchestrator — documentación',    url:'https://arubanetworking.hpe.com/techdocs/sdwan/'},
};

// CAMPOS Y CÓMO INTERPRETARLOS
//
//   fam    'ec'  EdgeConnect SD-WAN (admite Boost)
//          'gwb' Gateway SD-Branch serie 9000 (WAN + LAN + WLAN; no hace optimización WAN)
//          'gwc' Gateway de campus serie 9200 (capacidad fijada por licencia perpetua)
//
//   wanMin/wanMax  Rango de ancho de banda WAN para el que HPE publica cada EdgeConnect.
//          Es la cifra que HPE realmente publica para esta familia, y por eso se dimensiona
//          con ella en vez de con un throughput sintético. Que el requerimiento quede por
//          DEBAJO de wanMin es una señal tan útil como que lo supere: indica que el equipo
//          está sobredimensionado y que hay un modelo más barato que cumple.
//
//   fw     Throughput de firewall en Mbps (gateways). Es la cifra que publica HPE para las
//          series 9000/9200.
//   clients / aps     Clientes y puntos de acceso soportados (gateways).
//   ipsecSess / greTuns  Sesiones IPsec concurrentes y túneles GRE (serie 9000).
//   licCap Para la serie 9200: capacidad por nivel de licencia perpetua. El hardware solo
//          entrega la fila 'hw'; silver y gold la amplían SIN cambiar el equipo. Es el
//          detalle que descoloca en una comparativa contra un competidor que vende la
//          capacidad cerrada en el hardware.
//   boostMax  Techo de optimización WAN del appliance, en Mbps, cuando se licencia Boost.
//          null = la plataforma no hace optimización WAN.
const MODELS = [
  // ─── EdgeConnect SD-WAN ────────────────────────────────────────────────────
  {id:'EC-XS', fam:'ec', seg:'Sucursal peq / Oficina remota',
   wanMin:2, wanMax:200, boostMax:200,
   ifaces:'4x RJ45 10/100/1000 LAN/WAN + 2x RJ45 10/100/1000 gestión + serie RJ-45',
   hwSku:null, variantes:'EC-XS · EC-XS-SP · EC-XS-FIPS',
   ds:'https://www.hpe.com/psnow/doc/a00110177enw'},

  {id:'EC-S', fam:'ec', seg:'Sucursal grande / Oficina remota',
   wanMin:10, wanMax:3000, boostMax:3000,
   ifaces:'8x RJ45 10/100/1000 + 4x SFP+ 1/10G',
   hwSku:'S3N73A', variantes:'EC-S-P (PSU AC: S3N73A · PSU DC: S3N74A) · 2x SSD',
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet'},

  {id:'EC-M', fam:'ec', seg:'Hub / Sucursal grande',
   wanMin:50, wanMax:5000, boostMax:5000,
   ifaces:'8x RJ45 1GbE + 4x SFP+ 1/10G (SR o LR)',
   hwSku:'JZ872A', variantes:'EC-M-H · EC-M-P-FIPS',
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet'},

  {id:'EC-L', fam:'ec', seg:'Datacenter / Hub grande',
   wanMin:2000, wanMax:10000, boostMax:10000,
   ifaces:'6x SFP+ 10G (SR o LR)',
   hwSku:'JZ878A', variantes:'EC-L-H',
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet'},

  {id:'EC-XL', fam:'ec', seg:'Datacenter / Head-end de fabric',
   wanMin:2000, wanMax:10000, boostMax:10000,
   ifaces:'hasta 6x SFP+ 10G y/o SFP28 25G · network memory en flash PCIe · PSU y almacenamiento redundantes',
   hwSku:'S0B67A', variantes:'EC-XL-H-10G (6x SFP+ 1/10G: S0B67A) · EC-XL-H (6x SFP28, 2x NVMe, 2x PSU, 2x SSD: S3N77A) · EC-XL-P-FIPS',
   ds:'https://www.arubanetworks.com/resource/edgeconnect-xl-spec-sheet/'},

  // El mismo software sobre hipervisor o nube pública. La licencia de EdgeConnect es
  // portable entre appliance físico y virtual, así que se puede arrancar virtual en el
  // datacenter y migrar a hardware sin recomprar la suscripción.
  {id:'EC-V', fam:'ec', seg:'Virtual / Cloud (VMware, KVM, Hyper-V, AWS, Azure)',
   wanMin:null, wanMax:null, boostMax:null,
   ifaces:'vNIC según hipervisor · dimensionado por vCPU y por el tier de licencia contratado',
   hwSku:null, variantes:'EC-V',
   ds:'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/deployments/dg_ECV-Azure_latest.pdf'},

  // ─── Gateways SD-Branch serie 9000 ─────────────────────────────────────────
  // No hacen optimización WAN: su ventaja es la convergencia del acceso — el mismo equipo
  // termina la WAN, hace de controladora de APs y aplica Dynamic Segmentation con el rol
  // de usuario que traen el switch CX o el AP.
  {id:'Gateway 9004', fam:'gwb', seg:'Sucursal peq',
   fw:4000, clients:2048, aps:32, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'4x GbE RJ45', hwSku:null, variantes:'9004 · 9004-LTE (LTE integrado como uplink dedicado o redundante)',
   ds:'https://www.hpe.com/psnow/doc/a00091602enw'},

  {id:'Gateway 9012', fam:'gwb', seg:'Sucursal med / gde',
   fw:6000, clients:2048, aps:32, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'12x GbE RJ45 (6x PoE+)', hwSku:'R1B31A', variantes:'9012 US: R1B31A · 9012 RW TAA: R1B37A',
   ds:'https://www.arubanetworks.com/assets/ds/DS_9000Series.pdf'},

  // ─── Gateway de campus serie 9200 ──────────────────────────────────────────
  // Capacidad escalonada por licencia perpetua sobre el MISMO hardware.
  {id:'Gateway 9240', fam:'gwc', seg:'Campus / Hub regional',
   fw:20000, clients:16000, aps:512, ipsecSess:null, greTuns:null, boostMax:null,
   licCap:[
     {code:'hw',     n:'Solo hardware',          fw:20000, aps:512,  clients:16000},
     {code:'silver', n:'+ licencia Silver (perp.)', fw:30000, aps:1000, clients:24000},
     {code:'gold',   n:'+ licencia Gold (perp.)',   fw:40000, aps:2000, clients:32000},
   ],
   ifaces:'4x SFP28 + 1 slot de expansión · 1U rack', hwSku:'R7H95A', variantes:'9240 US: R7H95A',
   ds:'https://www.hpe.com/psnow/doc/PSN1014459233NGEN'},
];

// ── Suscripción EdgeConnect ──────────────────────────────────────────────────
//
// DIFERENCIA ESTRUCTURAL CON FORTINET: en FortiGate la licencia va atada al MODELO (cada
// SKU lleva el código del equipo embebido). En EdgeConnect va atada al CAUDAL del sitio,
// así que dos sedes con el mismo appliance pueden llevar suscripciones distintas y subir
// de caudal no obliga a cambiar el hardware mientras el equipo dé la talla.
const BUNDLES = {
  foundation: {
    n: 'EdgeConnect Foundation',
    svcs: 'Funciones SD-WAN esenciales más las capacidades NGFW avanzadas: Dynamic Path Control por SLA, '
      + 'tunnel bonding de los enlaces WAN, Path Conditioning (FEC y corrección de orden de paquetes), '
      + 'firewall con estado y orquestación centralizada desde EdgeConnect Orchestrator.',
  },
  advanced: {
    n: 'EdgeConnect Advanced',
    svcs: 'Todo Foundation más routing dinámico, segmentación multi-overlay, salida directa a Internet con '
      + 'First-packet iQ, service chaining hacia SSE/SASE de terceros y las funciones avanzadas de seguridad. '
      + 'Es el nivel que pide un despliegue con segmentación real o integrado con un SSE.',
  },
  onprem: {
    n: 'EdgeConnect On-Premises',
    svcs: 'Variante para despliegues donde el Orchestrator vive en la infraestructura del cliente en lugar '
      + 'de consumirse como servicio. Mismo alcance funcional; cambia el modelo de entrega y de consumo.',
  },
};

// Tiers de caudal publicados. Son tres, no una escalera fina: 100 Mbps, 1 Gbps e ilimitado.
const BW_TIERS = [
  {code:'bw100', n:'100 Mbps',            mbps:100},
  {code:'bw1g',  n:'1 Gbps',              mbps:1000},
  {code:'bwunl', n:'Sin límite de caudal', mbps:null},
];

// ── BOOST · la licencia de aceleración ───────────────────────────────────────
//
// Es lo más particular de Aruba y tiene un efecto CONTRA-INTUITIVO en el dimensionamiento:
//
//   1. BAJA el techo de proceso del appliance. Deduplicar y acelerar TCP cuesta CPU y no se
//      descarga a silicio dedicado como sí ocurre con el cifrado.
//   2. Pero REDUCE el tráfico que sale a la WAN. Network Memory sustituye por referencias
//      los patrones ya vistos y comprime el resto, así que 100 Mbps de aplicación pueden
//      viajar como 40.
//
// El error de preventa es ver solo (1) y descartar Boost por "costar rendimiento", o ver
// solo (2) y prometer una reducción que el appliance no sostiene. Se calculan juntos.
//
// Y lo que no tiene equivalente directo en la competencia: Boost se vende en BLOQUES DE
// 100 Mbps que se agrupan como un POOL del fabric. Orchestrator lo reparte entre las sedes
// que lo necesitan y se puede reasignar sin tocar hardware: en una red de 60 sucursales
// donde solo 8 mueven ficheros pesados, se licencia para esas 8. Se consume como servicio
// (Boost-aaS) o como suscripción on-premises.
const BOOST = {
  n: 'EdgeConnect Boost',
  bloque: 100, // Mbps por bloque licenciable
  svcs: 'Optimización WAN: deduplicación Network Memory, compresión y aceleración TCP y de protocolos. '
    + 'Add-on sobre Foundation o Advanced, licenciado en bloques de 100 Mbps que forman un pool del fabric '
    + 'y que Orchestrator reparte entre los sitios que lo aprovechan. Disponible como servicio (Boost-aaS) '
    + 'o como suscripción on-premises.',
  // Reducción de tráfico WAN según el perfil de datos. Rango deliberadamente conservador:
  // el ahorro real depende de cuánto se repita el contenido y solo una prueba con el
  // tráfico del cliente lo confirma. NO es una cifra publicada por HPE: es un supuesto de
  // trabajo de esta herramienta, y así se declara en la interfaz.
  reduccion: {
    generico: {n:'Tráfico genérico mixto (web, SaaS)',    factor:1.3},
    oficina:  {n:'Ficheros de oficina y correo interno',  factor:2.0},
    repetido: {n:'Réplicas, backups, VDI, CIFS/SMB',      factor:3.5},
  },
};

// Path Conditioning: el FEC envía paquetes de paridad para reconstruir pérdidas sin esperar
// retransmisión, que es lo que permite sustituir MPLS por banda ancha o 5G manteniendo SLA
// de aplicación. Cuesta ancho de banda: se suma al caudal, no se descuenta.
// Los porcentajes son supuestos de trabajo de esta herramienta, no cifras publicadas.
const FEC_OVERHEAD = {
  off:  {n:'Desactivado', pct:0,    d:'Enlaces limpios: MPLS dedicado o fibra sin pérdida medida.'},
  auto: {n:'Automático',  pct:0.10, d:'Orchestrator ajusta la paridad según la pérdida medida. Es el modo habitual.'},
  alto: {n:'Agresivo',    pct:0.25, d:'Enlaces con pérdida alta o variable: LTE/5G, satelital, banda ancha residencial.'},
};

// ── Software del portafolio ──────────────────────────────────────────────────
// Lo que acompaña al hardware en una propuesta y que suele olvidarse en el BOM.
const SOFTWARE = [
  {id:'EdgeConnect Orchestrator', cat:'Orquestación SD-WAN',
   d:'Gestión centralizada del fabric, Business Intent Overlays, ZTP y reparto del pool de Boost entre sedes. '
     + 'No se licencia por dispositivo gestionado.', ds:DATASHEETS.orchDocs.url},
  {id:'HPE Aruba Networking Central', cat:'Gestión cloud',
   d:'Gestión SaaS de gateways SD-Branch, switches CX y APs. Suscripción por dispositivo en niveles '
     + 'Foundation y Advanced, con variantes Base y Base+Security para los gateways 90xx.', ds:DATASHEETS.centralSaas.url},
  {id:'ClearPass Policy Manager', cat:'Control de acceso / NAC',
   d:'Fuente del rol de usuario que habilita Dynamic Segmentation extremo a extremo. Se licencia por '
     + 'endpoints concurrentes. Integra con EdgeConnect para políticas de seguridad consistentes.', ds:DATASHEETS.clearpass.url},
];

// Niveles de suscripción de Central aplicables a los gateways.
const CENTRAL_TIERS = {
  foundation: {n:'Central Foundation', d:'Gestión, monitorización y configuración del dispositivo.'},
  advanced:   {n:'Central Advanced',   d:'Añade analítica avanzada, AIOps y las capacidades de seguridad del nivel superior.'},
};

// ── Servicios de soporte ─────────────────────────────────────────────────────
// La oferta vigente para redes Aruba es Foundational Care, en variantes de hardware y de
// software. Confirmar cobertura regional y tiempos de RMA con HPE antes de comprometerlos.
const CARE = {
  fcnbd: {n:'Foundational Care 24x7 / NBD HW', sla:'Soporte 24x7 · repuesto al siguiente día hábil',
          d:'Diagnóstico remoto, acceso a actualizaciones y entrega de repuesto al siguiente día hábil. Adecuado para sedes con redundancia.'},
  fc247: {n:'Foundational Care 24x7 HW',       sla:'Soporte 24x7 · reparación in situ si hace falta',
          d:'Añade reparación de hardware en sitio cuando el diagnóstico remoto no resuelve. Estándar para producción.'},
  fcsw:  {n:'Foundational Care 24x7 SW',       sla:'Soporte de software 24x7 · updates y parches',
          d:'Soporte técnico remoto y acceso a actualizaciones y parches para el software. Se contrata junto al de hardware.'},
};

// Licencias por tier de caudal. sku/precio en null: sin price list verificado (ver cabecera).
// La estructura queda lista para rellenarse con la lista del distribuidor sin tocar la
// página ni la proyección.
function tierVacio() {
  return {sku:null, y1:null, y3:null, y5:null};
}
const LICENSES = {};
for (const t of BW_TIERS) {
  LICENSES[t.code] = {
    foundation: tierVacio(),
    advanced: tierVacio(),
    onprem: tierVacio(),
    care: {fcnbd: tierVacio(), fc247: tierVacio(), fcsw: tierVacio()},
  };
}

module.exports = {
  MODELS, BUNDLES, CARE, LICENSES, BW_TIERS, BOOST, FEC_OVERHEAD,
  SOFTWARE, CENTRAL_TIERS, DATASHEETS,
};
