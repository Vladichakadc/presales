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
// LIST PRICE (2026-09-10). Los 15 modelos EdgeConnect/gateway con SKU confirmado (ver
// `hwSku` en cada fila) tienen List Price real de HPE, extraído de un export de lista de
// precios de un distribuidor autorizado — ver DATASHEETS.priceList y
// public/datasheets/aruba-lista-precios-hpe.csv. Es precio de lista, no neto: no incluye el
// % de descuento del distribuidor (deliberadamente fuera de este catálogo, es su dato
// confidencial) ni impuestos ni promoción. Lo que sigue sin SKU (EC-XS-SP, EC-XS-FIPS, EC-V,
// la serie 7000/7200) sigue sin precio, y el BOM declara esas líneas "sin cotizar" en vez de
// inventar un importe.
//
// LIST PRICE DE SUSCRIPCIONES Y SERVICIOS (2026-09-13). LICENSES, BOOST, CENTRAL_TIERS y
// las licencias perpetuas del 9240 llevan ahora SKU y List Price 1/3/5 años. Doble fuente:
//   1. QuickSpecs oficial EdgeConnect SD-WAN (v18, 06-jul-2026 — DATASHEETS.ecQuickspecs)
//      para la correspondencia SKU↔descripción, verificada además contra la copia publicada
//      en hpe.com (a50004289enw) el mismo día.
//   2. El mismo export de lista de precios del distribuidor ya descrito arriba para el
//      List Price (solo SKU, descripción, List Price y vigencia — nunca el distribuidor
//      ni su descuento). Punto de control externo: JZ118AAE aparece en tienda pública con
//      LIST PRICE $1,260.00, idéntico al de la lista.
// Lo que la lista no cubre sigue en null y se declara: EC-V, EC-XS-SP, Dynamic Threat
// Defense y el Orchestrator cloud-hosted. Los SKU de Foundational Care SÍ salen de la
// lista — van por VARIANTE de hardware, no por tier de caudal — y viven en CARE_SKU
// (ver su comentario para la correspondencia fcnbd↔"NBD Exch" / fc247↔"4HR Onsite").
//
// CORRECCIONES RESPECTO A LA PRIMERA VERSIÓN DE ESTE ARCHIVO (documentadas a propósito):
//   · Se elimina "EC-2XL": no existe en el portafolio. La gama va XS → S → M → L → XL.
//   · Los niveles de suscripción no son "Base/Advanced" sino Foundation / Advanced /
//     On-Premises, y los tiers de caudal publicados son 100 Mbps, 1 Gbps e ilimitado.
//   · El soporte no es "Pointnext Tech Care" sino HPE Aruba Networking Foundational Care.
//   · El 9240 no es un gateway de sucursal sino de campus (serie 9200), y su capacidad la
//     fija la licencia perpetua, no el hardware.
//   · Corregido (2026-09-10): esta nota decía que se retiraban 9106/9114 por no aparecer en
//     el portafolio publicado, pero las filas de abajo siempre los tuvieron. Confirmados
//     como vigentes contra el QuickSpecs oficial de la Serie 9100 Hybrid — la nota estaba
//     desactualizada, no el catálogo.

// Documentos de referencia del portafolio. Se enlazan desde la página para que el
// preventa llegue al PDF sin buscarlo.
//
// `file` es el nombre con el que ese documento se guarda en public/datasheets/ cuando se
// ejecuta `npm run datasheets`. Si el archivo está presente, la página enlaza la COPIA
// LOCAL (servida detrás del muro de autenticación, sin depender de que HPE mantenga la
// URL); si no está, enlaza la URL oficial. Ese fallback es deliberado: el repositorio
// sigue siendo utilizable sin los PDF, y los PDF se pueden refrescar sin tocar código.
const DATASHEETS = {
  ecHardware:  {n:'EdgeConnect Hardware Reference Guide (PDF)', url:'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/hardware/reference/EdgeConnect-Hardware-Reference_latest.pdf', file:'edgeconnect-hardware-reference.pdf'},
  ecQuickspecs:{n:'EdgeConnect SD-WAN QuickSpecs',              url:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', file:'edgeconnect-quickspecs.pdf'},
  ecSpecSheet: {n:'EdgeConnect Spec Sheet (US)',                url:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet', file:'edgeconnect-spec-sheet-us.pdf'},
  ecOverview:  {n:'EdgeConnect SD-WAN — página de producto',    url:'https://www.hpe.com/us/en/aruba-edgeconnect-sd-wan.html', file:'edgeconnect-overview.pdf'},
  ecXsSpec:    {n:'EdgeConnect EC-XS — spec sheet',            url:'https://www.hpe.com/psnow/doc/a00110177enw', file:'edgeconnect-xs-spec-sheet.pdf'},
  ecXlSpec:    {n:'EdgeConnect EC-XL — spec sheet',            url:'https://www.arubanetworks.com/resource/edgeconnect-xl-spec-sheet/', file:'edgeconnect-xl-spec-sheet.pdf'},
  gw9004:      {n:'Gateway 9004 — Branch Gateway, data sheet', url:'https://www.hpe.com/psnow/doc/a00091602enw', file:'gateway-9004.pdf'},
  ecvAzure:    {n:'EdgeConnect Virtual (EC-V) en Azure — guía de despliegue (PDF)', url:'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/deployments/dg_ECV-Azure_latest.pdf', file:'edgeconnect-ecv-azure.pdf'},
  gw9000:      {n:'Serie 9000 — Branch Gateways, data sheet (PDF)', url:'https://www.arubanetworks.com/assets/ds/DS_9000Series.pdf', file:'serie-9000-branch-gateways.pdf'},
  gw9000Psnow: {n:'Serie 9000 — Branch Gateways (HPE PSNow)',    url:'https://www.hpe.com/psnow/doc/a00067607enw', file:'serie-9000-psnow.pdf'},
  gw9000Spec:  {n:'Serie 9000 — especificaciones (soporte HPE)', url:'https://support.hpe.com/hpesc/public/docDisplay?docId=a00099295en_us&docLocale=en_US', file:'serie-9000-especificaciones.pdf'},
  gw9100:      {n:'Serie 9100 — Hybrid Gateways, QuickSpecs', url:'https://www.hpe.com/us/en/collaterals/collateral.a50006999enw.html', file:'serie-9100-hybrid-quickspecs.pdf'},
  gw7000:      {n:'Serie 7000 — Mobility Controllers, especificaciones (soporte HPE)', url:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', file:'serie-7000-especificaciones.pdf'},
  gw9200Qs:    {n:'Serie 9200 — Campus Gateways, QuickSpecs', url:'https://www.hpe.com/psnow/doc/a50004272enw.html', file:'serie-9200-quickspecs.pdf'},
  gwSoportados:{n:'Gateways soportados en SD-Branch — enumeración oficial', url:'https://arubanetworking.hpe.com/techdocs/central/latest/content/sd-branch/overview/supported_gateways.htm', file:'gateways-soportados-sd-branch.pdf'},
  gw9200:      {n:'Serie 9200 — Campus Gateways, data sheet',    url:'https://www.hpe.com/psnow/doc/PSN1014459233NGEN', file:'serie-9200-campus-gateways.pdf'},
  gw9200Psnow: {n:'Serie 9200 — Campus Gateway (HPE PSNow)',     url:'https://www.hpe.com/psnow/doc/a00121209enw', file:'serie-9200-psnow.pdf'},
  sdBranchVsg: {n:'SD-Branch Design — Validated Solution Guide (PDF)', url:'https://arubanetworking.hpe.com/techdocs/VSG/docs/070-sd-branch-design/Media/PDF/Aruba_VSG_SD-Branch-Design.pdf', file:'sd-branch-design-vsg.pdf'},
  sdwanOrder:  {n:'SD-WAN Gateways — Ordering Guide (PDF)',      url:'https://higherlogicdownload.s3.amazonaws.com/HPE/MigratedAssets/OG_SD-WAN.pdf', file:'sd-wan-ordering-guide.pdf'},
  centralLic:  {n:'Central — Licensing Guide (PDF)',             url:'https://arubanetworking.hpe.com/techdocs/central/pdfs/2.5.8/licensing-guide.pdf', file:'central-licensing-guide.pdf'},
  centralSaas: {n:'Central — suscripciones SaaS (Foundation / Advanced)', url:'https://www.hpe.com/psnow/doc/a00125615enw', file:'central-suscripciones-saas.pdf'},
  foundCare:   {n:'HPE Aruba Networking Foundational Care',      url:'https://www.hpe.com/psnow/doc/a00111733enw', file:'foundational-care.pdf'},
  clearpass:   {n:'ClearPass — Access License, data sheet',      url:'https://www.hpe.com/psnow/doc/PSN1010354100DEEN', file:'clearpass-access-license.pdf'},
  orchDocs:    {n:'EdgeConnect Orchestrator — documentación',    url:'https://arubanetworking.hpe.com/techdocs/sdwan/', file:'orchestrator-documentacion.pdf'},
  // A diferencia de las filas de arriba, esto NO es un documento público de HPE: es un
  // extracto que este catálogo elaboró (2026-09-10) a partir de un export de lista de
  // precios de un distribuidor autorizado de HPE. Se guardaron SOLO el SKU, la descripción,
  // el List Price de HPE y su vigencia — nunca el nombre del distribuidor ni su % de
  // descuento negociado, que es la parte confidencial de ese documento y no le sirve a
  // nadie para dimensionar un equipo. Por eso no hay `url` pública: no existe, y no se
  // inventa una. Ver PENDIENTES.md, "Aruba: List Price real para EdgeConnect y gateways".
  priceList:   {n:'Lista de precios de referencia — List Price HPE (sin descuento de distribuidor)', file:'aruba-lista-precios-hpe.csv'},
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
// FAMILIAS Y COMO SE DIMENSIONA CADA UNA
//   fam  'ec' EdgeConnect SD-WAN — se dimensiona por el RANGO de caudal WAN publicado y
//             admite Boost.
//        'gw' Gateway — se dimensiona por throughput de firewall mas capacidad de
//             clientes y APs. No hace optimizacion WAN.
//   rol  Para que sirve en el diseno: 'sdwan', 'sucursal' o 'campus'. Es el filtro util
//        en preventa, mas que la serie comercial.
//   skus Referencias pedibles del modelo, como DATOS y no como prosa. La revision
//        anterior las llevaba dentro de un texto libre: no se podian buscar, no salian en
//        el BOM y en la practica el catalogo mostraba 9 equipos ocultando el doble de
//        referencias reales.
const MODELS = [
  // ─── EdgeConnect SD-WAN ────────────────────────────────────────────────────
  // CONFLICTO SIN RESOLVER (2026-09-10): el QuickSpecs oficial de abajo (v18, 06-jul-2026)
  // publica el rango de EC-XS como 2-1000 Mbps, el doble del wanMax:200 de esta fila. Un solo
  // documento contradice lo ya verificado — por debajo del doble anclaje que este catálogo
  // exige antes de pisar un dato existente (misma regla que el SRX380 de Juniper) — así que
  // se deja sin tocar. Ver PENDIENTES.md, "Conflictos abiertos entre el catálogo y una ficha
  // oficial", para la decisión pendiente del dueño del catálogo.
  // ── Campo `spec` (2026-09-13) ─────────────────────────────────────────────
  // Características técnicas adicionales leídas de los datasheets oficiales, literales:
  // · EdgeConnect: QuickSpecs HPE a50004289enw (tabla "Comparison" p.30 + fichas por
  //   modelo) y EdgeConnect Hardware Reference (tablas de alimentación/físico pp.20-26,
  //   ambiental p.33, ruido p.35) — copias locales en public/datasheets/.
  // · Serie 9000: DS_9000Series (serie-9000-branch-gateways.pdf pp.5-7).
  // · Serie 9100: QuickSpecs a50006999enw (serie-9100-hybrid-quickspecs.pdf pp.14-16).
  // · Serie 9200: QuickSpecs serie 9200 (serie-9200-campus-gateways.pdf pp.9-11).
  // · Series 7000/7200: DS_7000Series y DS_7200Series oficiales de Aruba (doble ancla:
  //   dos copias independientes del mismo documento consultadas el 2026-09-13).
  // `spec` NO sobrescribe ningún campo existente: solo añade lo que la ficha no tenía.
  // Conflictos detectados y NO aplicados (quedan documentados en PENDIENTES.md):
  // · 7010: el DS actual declara 8 Gbps de firewall y 64K sesiones; el catálogo conserva
  //   4 Gbps / 32K del DS anterior (decisión del dueño: no tocar sin confirmación).
  // · 7205: el DS declara 12 Gbps de firewall; el catálogo conserva 15 Gbps.
  // · 7030: el DS declara 8x combo 1G (sin 10G); el texto de `ifaces` del catálogo
  //   menciona "puertos 10G" — pendiente de corrección por el dueño.
  // · EC-L: psu.texto cita 401 W; el QuickSpecs por modelo declara 404 W y el Hardware
  //   Reference 440 W para la variante EC-L-P — se muestran ambos en spec.watts.
  {id:'EC-XS', redund:false, psu:{tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50-60 Hz', texto:'Requerimiento de alimentación 23 W en la primera revisión de hardware y 34 W en las posteriores — HPE publica el requerimiento, no un consumo típico. Fuente única mediante adaptador externo, sin opción de segunda.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal peq / Oficina remota',
   wanMin:2, wanMax:200, boostMax:200,
   ifaces:'4x RJ45 10/100/1000 LAN/WAN + 2x RJ45 10/100/1000 gestión + serie RJ-45',
   spec:{conexiones:'256.000', boostRec:'250 Mbps', idsips:'Sí', fru:'Ninguna',
     mtbf:'162.171 h (18,5 años)', watts:'23 W (primera revisión HW) / 34 W (posteriores) — requerimiento de alimentación', btu:'116 BTU/h',
     ruido:'40 dBA', peso:'1,59 kg (3,5 lb)'},
   // hwSku de la variante base completado el 2026-09-10 desde DATASHEETS.priceList (el
   // QuickSpecs no lo publica); EC-XS-SP y EC-XS-FIPS no aparecen como SKU propio en esa
   // fuente tampoco, así que siguen sin confirmar.
   hwSku:'JM962A', skus:[{sku:'JM962A',d:'EC-XS'},{sku:null,d:'EC-XS-SP'},{sku:null,d:'EC-XS-FIPS (validado FIPS 140)'}],
   ds:'https://www.hpe.com/psnow/doc/a00110177enw', dsFile:'edgeconnect-xs-spec-sheet.pdf'},

  // Los tres siguientes (EdgeConnect 10104/10106/10108) no estaban en el catálogo: se
  // incorporan el 2026-09-10 desde el QuickSpecs oficial HPE (v18, 06-jul-2026, ver `ds`),
  // leído completo vía Jina Reader — el bloqueo de egreso documentado en la cabecera de este
  // archivo (2026-09) resultó ser del lado de HPE/Akamai contra ciertos clientes HTTP, no
  // contra toda automatización; Jina sí atravesó. SKU y cifras de capacidad son literales del
  // documento (tabla "Comparison" + fichas por modelo); ninguno trae voltaje/consumo publicado.
  {id:'EC-10104', redund:false, psu:{tipo:'adaptador externo, único', texto:'Fuente única — el QuickSpecs confirma que no hay segunda fuente pero no publica voltaje ni consumo.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal peq / oficina en casa',
   wanMin:2, wanMax:500, boostMax:500,
   ifaces:'4x RJ45 10/100/1000',
   spec:{conexiones:'256.000', boostRec:'200 Mbps', idsips:'Sí', fru:'Ninguna',
     ram:'ECC (HPE no publica la capacidad)', mtbf:'63 años',
     watts:'48 W', btu:'163,78 BTU/h', ruido:'Sin ventilador (0 dBA)',
     dims:'3,8 × 19,8 × 15,3 cm (1,50 × 7,81 × 6,03 in)', peso:'1,14 kg (2,52 lb)',
     certs:'Cifrado de disco AES-128 · IPsec AES-256'},
   hwSku:'R9D72A', skus:[{sku:'R9D72A',d:'EdgeConnect 10104 · 4x RJ45 10/100/1000'},
                         {sku:'S3N78A',d:'EdgeConnect 10104 TAA · 4x RJ45'},
                         {sku:'S3N69A',d:'EdgeConnect 10104 NAL · 4x RJ45'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', dsFile:null},

  {id:'EC-10106', redund:false, psu:{tipo:'adaptador externo, único (54 V)', texto:'Fuente única — el QuickSpecs confirma que no hay segunda fuente pero no publica el consumo.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal pequeña',
   wanMin:2, wanMax:1000, boostMax:1000,
   ifaces:'2x SFP+ 1/10G + 2x Combo (SFP/1GbE) + 2x GbE PoE+',
   spec:{conexiones:'256.000', boostRec:'250 Mbps', idsips:'Sí', fru:'Ninguna',
     ram:'16 GB ECC', mtbf:'125.075 h', watts:'165 W', btu:'563 BTU/h',
     ruido:'42 dBA', peso:'2,30 kg (5,08 lb)'},
   hwSku:'S0E22A', skus:[{sku:'S0E22A',d:'EdgeConnect 10106 · 2x SFP+ · 2x Combo · 2x GbE PoE+'},
                         {sku:'S3N71A',d:'EdgeConnect 10106 NAL · 2x SFP+ · 2x Combo · 2x GbE PoE+'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', dsFile:null},

  {id:'EC-10108', redund:false, psu:{tipo:'adaptador externo, único (54 V)', texto:'Fuente única — el QuickSpecs confirma que no hay segunda fuente pero no publica el consumo.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal mediana',
   wanMin:2, wanMax:2000, boostMax:2000,
   ifaces:'2x SFP+ 1/10G + 2x Combo (SFP/1GbE) + 2x GbE PoE+',
   spec:{conexiones:'256.000', boostRec:'500 Mbps', idsips:'Sí', fru:'Ninguna',
     ram:'32 GB ECC', mtbf:'125.452 h', watts:'165 W', vlanMax:'128',
     ruido:'42 dBA'},
   hwSku:'S0E23A', skus:[{sku:'S0E23A',d:'EdgeConnect 10108 · 2x SFP+ · 2x Combo · 2x GbE PoE+'},
                         {sku:'S3N72A',d:'EdgeConnect 10108 NAL · 2x SFP+ · 2x Combo · 2x GbE PoE+'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', dsFile:null},

  {id:'EC-S', redund:false, psu:{tipo:'fuente única interna, AC (S3N73A) o DC (S3N74A) según el SKU', volts:'100-240 V AC, 47-63 Hz', texto:'Requerimiento de alimentación 100 W — HPE publica el requerimiento, no un consumo típico. El EdgeConnect Hardware Reference confirma lo que el catálogo ya decía: una sola fuente por unidad. Las variantes EC-S-P sí traen 1+1 redundante (111 W en AC, 103 W en DC).'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal grande / Oficina remota',
   wanMin:10, wanMax:3000, boostMax:3000,
   ifaces:'8x RJ45 10/100/1000 + 4x SFP+ 1/10G',
   spec:{conexiones:'256.000', boostRec:'500 Mbps', idsips:'Sí',
     fru:'SSD y fuente de poder (variantes EC-S-P)', disco:'2x SSD (variantes EC-S-P)',
     mtbf:'177.726 h (20 años)', watts:'100 W (EC-S, fuente única) · 111 W AC / 103 W DC a -48 V (EC-S-P, 1+1)',
     ruido:'40 dBA', peso:'8,23 kg (18,14 lb)'},
   hwSku:'S3N73A', skus:[{sku:'S3N73A',d:'EC-S-P · 4x SFP+ · 10x RJ45 · PSU AC · 2x SSD · NAL'},
                         {sku:'S3N74A',d:'EC-S-P · 4x SFP+ · 10x RJ45 · PSU DC · 2x SSD · NAL'}],
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet', dsFile:'edgeconnect-spec-sheet-us.pdf'},

  {id:'EC-M', redund:true, psu:{tipo:'1+1 redundante, sustituible e intercambiable en caliente', volts:'100-240 V AC, 50-60 Hz', texto:'Requerimiento de alimentación 126 W — HPE publica el requerimiento, no un consumo típico.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Hub / Sucursal grande',
   wanMin:50, wanMax:5000, boostMax:5000,
   ifaces:'8x RJ45 1GbE + 4x SFP+ 1/10G (SR o LR)',
   spec:{conexiones:'2.000.000', boostRec:'1 Gbps', idsips:'Sí',
     fru:'SSD y fuente de poder', disco:'960 GB SSD',
     mtbf:'15 años', watts:'153 W (1+1)', btu:'522 BTU/h',
     ruido:'44,3 dBA', peso:'8,21 kg (18,1 lb)'},
   hwSku:'JZ872A', skus:[{sku:'JZ872A',d:'EC-M-H · 8x RJ45 10/100/1000 · 4x SFP+ 1/10G'},
                         {sku:null,d:'EC-M-P-FIPS (validado FIPS 140)'}],
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet', dsFile:'edgeconnect-spec-sheet-us.pdf'},

  {id:'EC-L', redund:true, psu:{tipo:'1+1 redundante, sustituible e intercambiable en caliente', volts:'100-240 V AC, 50-60 Hz', texto:'Requerimiento de alimentación 401 W — HPE publica el requerimiento, no un consumo típico.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Datacenter / Hub grande',
   wanMin:2000, wanMax:10000, boostMax:10000,
   ifaces:'6x SFP+ 10G (SR o LR)',
   spec:{conexiones:'2.000.000', boostRec:'1 Gbps', idsips:'Sí',
     fru:'SSD y fuente de poder', disco:'960 GB SSD',
     mtbf:'> 10 años', watts:'404 W (EC-L-H, QuickSpecs) · 440 W (EC-L-P, Hardware Reference)', btu:'1.379 BTU/h',
     peso:'14,5 kg (32 lb)'},
   hwSku:'JZ878A', skus:[{sku:'JZ878A',d:'EC-L-H · 6x SFP+ 1/10G'}],
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet', dsFile:'edgeconnect-spec-sheet-us.pdf'},

  // FIN DE VENTA CONFIRMADO Y MARCADO (2026-09-13, decisión del dueño): ver EOL_ANNOUNCED
  // al final de MODELS. La pista fue la fila de S0B67A sin sufijo de país con PLC "ES" en
  // el export del distribuidor; la confirmación, la Product Lifecycle Policy oficial de
  // EdgeConnect. Desde la marca, el EC-XL nunca sale recomendado para diseño nuevo (cae
  // solo a rango 2 por fecha vencida, patrón ficha.js) y la página avisa en ámbar
  // cualquier línea cotizada con PLC "ES" (fase 7: PLC_POR_SKU + bom-eos).
  {id:'EC-XL', fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Datacenter / Head-end de fabric',
   wanMin:2000, wanMax:10000, boostMax:10000,
   ifaces:'hasta 6x SFP+ 10G y/o SFP28 25G · network memory en flash PCIe · PSU y almacenamiento redundantes',
   spec:{conexiones:'2.000.000', boostRec:'5 Gbps', idsips:'Sí',
     fru:'SSD, NVMe y fuente de poder', disco:'960 GB SSD (ECOS) + 3,2 TB NVMe (Network Memory)',
     mtbf:'> 10 años', watts:'438 – 480 W según variante (Hardware Reference)',
     peso:'15,2 kg (33,5 lb)'},
   hwSku:'S0B67A', skus:[{sku:'S0B67A',d:'EC-XL-H-10G · 6x SFP+ 1/10G'},
                         {sku:'S3N77A',d:'EC-XL-H · 6x SFP28 · 2x NVMe · 2x PSU · 2x SSD · NAL'},
                         {sku:null,d:'EC-XL-P-FIPS (validado FIPS 140)'}],
   redund:true, psu:{tipo:'1+1 redundante, sustituible e intercambiable en caliente', volts:'100-240 V AC, 50-60 Hz', texto:'Requerimiento de alimentación 474 W — HPE publica el requerimiento, no un consumo típico. El EdgeConnect Hardware Reference confirma la doble fuente que el catálogo ya deducía del SKU S3N77A.'},
   ds:'https://www.arubanetworks.com/resource/edgeconnect-xl-spec-sheet/', dsFile:'edgeconnect-xl-spec-sheet.pdf'},

  // No estaba en el catálogo: incorporado el 2026-09-10 desde el mismo QuickSpecs oficial que
  // los EC-10104/10106/10108 (ver comentario más arriba). HPE no publica un mínimo de rango
  // WAN para este modelo (solo "hasta 12 Gbps") — a diferencia de los demás EdgeConnect, que
  // sí traen piso y techo — así que `wanMin` queda en null en vez de inventar un suelo; el
  // motor de dimensionamiento ya trata ese caso (lo mismo que EC-V) sin marcar sobredimensionado.
  {id:'EC-10150', redund:true, psu:{tipo:'1+1 redundante (2x PSU)', texto:'Dos fuentes redundantes y dos SSD NVMe de sistema — el QuickSpecs confirma la redundancia pero no publica voltaje ni consumo.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Datacenter / Hub grande',
   wanMin:null, wanMax:12000, boostMax:12000,
   ifaces:'2x RJ45 10/100/1000 gestión + 8x SFP28 1/10/25G · 2x PSU',
   spec:{conexiones:'2.000.000', boostRec:'8 Gbps', idsips:'Sí',
     fru:'SSD, NVMe y fuente de poder', tuneles:'10.000 túneles IPsec', peers:'4.096 peers de fabric',
     prefijos:'60.000 IPv4 / 30.000 IPv6', certs:'FIPS 140-2 Nivel 1 · NDcPP v2.2e · TPM 2.0',
     mtbf:'300.236 h (sin almacenamiento)', watts:'423 W típico / 456 W máx. · PSU 800 W (1+1)',
     ruido:'71,5 dBA', peso:'14,7 kg (32,4 lb)'},
   hwSku:'S2N65A', skus:[{sku:'S2N65A',d:'EdgeConnect 10150 · 8x SFP28 · 2x RJ45 · 2x PSU'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', dsFile:null},

  {id:'EC-V', redund:'no-aplica', fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Virtual / Cloud (VMware, KVM, Hyper-V, AWS, Azure)',
   wanMin:null, wanMax:null, boostMax:null,
   ifaces:'vNIC según hipervisor · dimensionado por vCPU y por el tier de licencia contratado',
   hwSku:null, skus:[{sku:null,d:'EC-V — licencia portable entre appliance fisico y virtual'}],
   ds:'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/deployments/dg_ECV-Azure_latest.pdf', dsFile:'edgeconnect-ecv-azure.pdf'},

  // ─── Serie 9000 · Branch Gateways (AOS 10, gestionados por Central) ─────────
  // hwSku completado el 2026-09-10 desde el QuickSpecs de la serie (SKU (US) base; el
  // documento trae ademas variantes RW/JP/IL/EG y TAA, no listadas por brevedad).
  // fwSess completado el 2026-09-13 desde el DS de la serie 9000 (tabla AOS 10: 128K
  // sesiones de firewall). El `aps:32` del catálogo es la cifra AOS 8 (campus APs); la
  // tabla AOS 10 declara 128/256 "devices" por gateway — distinta arquitectura de gestión,
  // se muestra en spec.aps10 sin tocar el campo existente (ver PENDIENTES.md).
  {id:'Gateway 9004', fam:'gw', rol:'sucursal', serie:'Serie 9000', seg:'Sucursal peq',
   fw:4000, clients:2048, aps:32, fwSess:128000, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'4x GbE RJ45', hwSku:'R1B20A', skus:[{sku:'R1B20A',d:'9004 (US) · 4x GbE RJ45'}],
   spec:{aps10:'128', cps:'130.000 sesiones nuevas/s', cluster:'Hasta 4 gateways por cluster · 8.192 clientes por cluster (AOS 10)',
     vlanMax:'4.094', ospf:'8.000 rutas', acls:'2.678 entradas', dhcp:'4.000 clientes', bridge:'64.000 entradas',
     fwSessSdwan:'64.000 sesiones activas de firewall en modo SD-WAN (doc oficial HPE a00099294en_us) — en conflicto con las 128.000 del datasheet AOS 10, ver PENDIENTES',
     ruido:'0 dBA (sin ventilador)', watts:'25 W máx.', dims:'3,82 × 19,85 × 15,31 cm', peso:'1,143 kg'},
   ds:'https://www.hpe.com/psnow/doc/a00091602enw', dsFile:'gateway-9004.pdf'},

  {id:'Gateway 9004-LTE', fam:'gw', rol:'sucursal', serie:'Serie 9000', seg:'Sucursal peq + LTE',
   fw:4000, clients:2048, aps:32, fwSess:128000, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'4x GbE RJ45 + LTE integrado (uplink dedicado o redundante)', hwSku:'R3V91A',
   skus:[{sku:'R3V91A',d:'9004-LTE (US) · 4x GbE RJ45 + LTE'}],
   spec:{aps10:'128', cps:'130.000 sesiones nuevas/s', cluster:'Hasta 4 gateways por cluster · 8.192 clientes por cluster (AOS 10)',
     vlanMax:'4.094', ospf:'8.000 rutas', acls:'2.678 entradas', dhcp:'4.000 clientes', bridge:'64.000 entradas',
     lte:'Cat 12 · hasta 600 Mbps de bajada / 150 Mbps de subida',
     ruido:'0 dBA (sin ventilador)', watts:'25 W máx.', dims:'3,82 × 19,85 × 15,31 cm', peso:'1,143 kg'},
   ds:'https://www.hpe.com/psnow/doc/a00091602enw', dsFile:'gateway-9004.pdf'},

  {id:'Gateway 9012', fam:'gw', rol:'sucursal', serie:'Serie 9000', seg:'Sucursal med / gde',
   fw:6000, clients:2048, aps:32, fwSess:128000, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'12x GbE RJ45 (6x PoE+)', hwSku:'R1B31A',
   skus:[{sku:'R1B31A',d:'9012 (US) · 12x GbE · 6x PoE+'},{sku:'R1B37A',d:'9012 (RW) TAA · 12x GbE · 6x PoE+'}],
   spec:{aps10:'256', cps:'130.000 sesiones nuevas/s', cluster:'Hasta 4 gateways por cluster · 8.192 clientes por cluster (AOS 10)',
     vlanMax:'4.094', ospf:'8.000 rutas', acls:'2.678 entradas', dhcp:'4.000 clientes', bridge:'64.000 entradas',
     fwSessSdwan:'64.000 sesiones activas de firewall en modo SD-WAN (doc oficial HPE a00099294en_us) — en conflicto con las 128.000 del datasheet AOS 10, ver PENDIENTES',
     ruido:'29,1 – 63,5 dBA', watts:'160 W máx. (incluye 120 W de presupuesto PoE)', dims:'4,37 × 39,5 × 26 cm', peso:'3,42 kg'},
   ds:'https://www.arubanetworks.com/assets/ds/DS_9000Series.pdf', dsFile:'serie-9000-branch-gateways.pdf'},

  // ─── Serie 9100 · Hybrid Gateways ──────────────────────────────────────────
  // Familia que la revision anterior habia ELIMINADO por error, dando por inexistente lo
  // que solo faltaba en una busqueda. Es el escalon entre la sucursal grande y el campus
  // pequeno. HPE no publica en las fuentes consultadas su throughput de firewall, asi que
  // `fw` queda en null y el dimensionador lo dice en vez de inventarlo.
  // fw/fwSess/ipsecSess completados el 2026-09-10 desde la misma ficha ya citada en `ds`
  // (tabla "Performance and Capacity" y "AOS-10 Specifications", arquitectura que gestiona
  // Central — la que aplica a este catálogo, no la fila separada "AOS-8" del mismo documento).
  // `greTuns` se deja en null a propósito: esa tabla no publica un tunel GRE aparte para
  // AOS-10, solo lo hace la sección AOS-8 (8K, solo 9106) que es otra arquitectura de gestión.
  {id:'Gateway 9106', fam:'gw', rol:'sucursal', serie:'Serie 9100 Hybrid', seg:'Sucursal gde / Campus peq',
   fw:10000, clients:8000, aps:2000, fwSess:2000000, ipsecSess:16000, greTuns:null, boostMax:null,
   ifaces:'2x SFP+ 10GbE + 2x combo SFP/RJ45 1GbE + 2x RJ45 1GbE con PoE hasta 60W',
   spec:{cluster:'Hasta 6 gateways por cluster (AOS 10)', tuneles:'20.000 túneles totales (AOS 10)',
     encTput:'GRE / AES-CBC-128/256 / AES-GCM-128/256: 10 Gbps (a velocidad de línea)',
     mtbf:'236.076 h', watts:'150 W', btu:'290 BTU/h', ruido:'54,6 dBA', peso:'2,305 kg',
     extra:'Formato desktop · PoE hasta 60 W'},
   hwSku:'S5H02A', skus:[{sku:'S5H02A',d:'9106 (US) · 2x SFP+ · 2x Combo · 2x PoE'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50006999enw.html', dsFile:'serie-9100-hybrid-quickspecs.pdf'},

  {id:'Gateway 9114', fam:'gw', rol:'campus', serie:'Serie 9100 Hybrid', seg:'Campus peq / Sucursal grande',
   fw:20000, clients:10000, aps:4000, fwSess:2000000, ipsecSess:32000, greTuns:null, boostMax:null,
   ifaces:'4x SFP+ 10GbE + 4x combo SFP/RJ45 1GbE + 1 slot de expansión',
   spec:{cluster:'Hasta 6 gateways por cluster (AOS 10)', tuneles:'40.000 túneles totales (AOS 10)',
     encTput:'GRE / AES-CBC-128/256 / AES-GCM-128/256: 20 Gbps (a velocidad de línea)',
     mtbf:'280.165 h', watts:'185 W', btu:'631 BTU/h', ruido:'69 dBA', peso:'6,2 kg',
     extra:'1U rack · 1 slot de expansión'},
   hwSku:'R9M45A', skus:[{sku:'R9M45A',d:'9114 · 4x SFP+ · 4x combo · 1 slot de expansión'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50006999enw.html', dsFile:'serie-9100-hybrid-quickspecs.pdf'},

  // ─── Serie 9200 · Campus Gateways ──────────────────────────────────────────
  {id:'Gateway 9240', fam:'gw', rol:'campus', serie:'Serie 9200', seg:'Campus / Hub regional',
   fw:20000, clients:16000, aps:512, fwSess:null, ipsecSess:null, greTuns:null, boostMax:null,
   // SKU y List Price de las licencias perpetuas (2026-09-13, lista del distribuidor):
   // variante AOS-10, la arquitectura que gestiona Central y la que usa este catálogo.
   // Existen las equivalentes AOS-8 (R8R13AAE/R8R14AAE) — no aplican aquí.
   licCap:[
     {code:'hw',     n:'Solo hardware',             fw:20000, aps:512,  clients:16000},
     {code:'silver', n:'+ licencia Silver (perp.)', fw:30000, aps:1000, clients:24000, sku:'R8R41AAE', elp:9995},
     {code:'gold',   n:'+ licencia Gold (perp.)',   fw:40000, aps:2000, clients:32000, sku:'R8R42AAE', elp:19995},
   ],
   ifaces:'4x SFP28 + 1 slot de expansión · 1U rack', hwSku:'R7H95A',
   skus:[{sku:'R7H95A',d:'9240 (US) · 4x SFP28 · 1 slot de expansión'}],
   // clients/aps de licCap son las cifras AOS 8; la tabla AOS 10 del QuickSpecs declara
   // otras (32K/48K/64K clientes, 4K/8K/16K APs) — se muestran en spec.extra sin tocar
   // los campos existentes (misma regla que la serie 9000, ver PENDIENTES.md).
   spec:{encTput:'AES-CCM: 20 / 28 / 30 Gbps según licencia Base / Silver / Gold',
     ospf:'57.000 rutas', mtbf:'185.301 h', watts:'190 W máx. · PSU 550 W (ranuras 1+1)',
     btu:'648 BTU/h', ruido:'65,2 dBA', peso:'8,2 kg (18,08 lb)',
     extra:'AOS 10 por licencia (Base/Silver/Gold): 32K/48K/64K clientes · 4K/8K/16K APs · 4M sesiones · 32K/64K/128K IPsec · 40K/80K/160K túneles. Consola USB-C + RJ45 · OOBM RJ45 · 2x USB · 5 bandejas de ventilador.'},
   ds:'https://www.hpe.com/psnow/doc/PSN1014459233NGEN', dsFile:'serie-9200-campus-gateways.pdf'},

  // ─── Serie 7000 · Mobility Controllers de sucursal (AOS 8) ─────────────────
  // legacy:true — el dimensionador prefiere un equipo de generacion actual cuando ambos
  // cumplen, y solo propone esta linea si nada mas encaja o si se pide expresamente. Sin
  // esa preferencia recomendaba un 7005 para una sucursal de 1.5 Gbps por ser el candidato
  // mas pequeno, que es exactamente el consejo equivocado para un despliegue nuevo.
  // Linea anterior a los gateways AOS 10, todavia vigente en canal y muy presente en
  // parque instalado. Se incluye porque una preventa real se cruza con ella
  // constantemente, y omitirla obligaba a salirse de la herramienta.
  {id:'7005', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal peq (fanless)',
   fw:2000, clients:1024, aps:16, fwSess:16384, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'4x RJ45 10/100/1000 · sin ventilador · alimentable por PoE', hwSku:null,
   spec:{encTput:'3DES/AES-CBC: 1,2 Gbps · AES-CCM: 1,6 Gbps',
     ruido:'0 dBA (sin ventilador)', watts:'16,6 W máx. (con USB) · PoE PD (puerto 0) o adaptador 12 V 30 W',
     btu:'51,18 BTU/h', dims:'4,1 × 20 × 20 cm', peso:'0,92 kg'},
   // Remanufacturado HPE (2026-09-13, lista del distribuidor): la unidad nueva no está en
   // la lista; el SKU reman sí, con List Price — ver cotizadorCatalog.js.
   skus:[{sku:null,d:'7005 (US / RW)'},{sku:'JW633AR',d:'7005 remanufacturado HPE (Reman)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  {id:'7008', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal peq + PoE',
   fw:2000, clients:1024, aps:16, fwSess:16384, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'8x RJ45 10/100/1000 con PoE y PoE+ integrados · sin ventilador', hwSku:null,
   spec:{encTput:'3DES/AES-CBC: 1,2 Gbps · AES-CCM: 1,6 Gbps',
     ruido:'0 dBA (sin ventilador)', watts:'126 W máx. con PoE (26 W sin PoE) · fuente 150 W · PoE+ 100 W (8 puertos)',
     btu:'430 BTU/h', dims:'4,2 × 20,52 × 20,32 cm', peso:'1,0 kg'},
   skus:[{sku:null,d:'7008 (US / RW)'},{sku:'JX927AR',d:'7008 remanufacturado HPE (Reman)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  // ipsecSess/greTuns completados el 2026-09-13 desde el DS oficial de la serie 7000
  // (tabla "Performance and capacity": 2.048 IPsec, 512 GRE, 2.048 SSL, 4.096 VLANs).
  // Ese mismo DS declara 8 Gbps de firewall y 64K sesiones — conflicto con el fw:4000 /
  // fwSess:32768 del catálogo (DS anterior): NO se sobrescribe, queda en PENDIENTES.md.
  {id:'7010', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal med',
   fw:4000, clients:2048, aps:32, fwSess:32768, ipsecSess:2048, greTuns:512, boostMax:null,
   ifaces:'16x RJ45 10/100/1000 + 2x SFP', hwSku:null,
   spec:{encTput:'3DES: 2,4 Gbps · AES-CBC-256: 2,6 Gbps · AES-CCM: 3,4 Gbps · AES-GCM-256: 3,3 Gbps',
     vlanMax:'4.096', ssl:'2.048 sesiones SSL', mtbf:'232.843 h',
     watts:'190 W máx. (con PoE) · fuente interna · PoE+ 150 W (12 puertos)',
     btu:'300 BTU/h', ruido:'39,8 – 58,6 dBA', dims:'4,42 × 31,75 × 33,7 cm', peso:'3,4 kg'},
   skus:[{sku:null,d:'7010 (US / RW)'},{sku:'JW678AR',d:'7010 remanufacturado HPE (Reman)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  {id:'7024', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal med · acceso unificado 24p',
   fw:4000, clients:2048, aps:32, fwSess:32768, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'24x RJ45 10/100/1000 + 2x SFP+ 10G', hwSku:null,
   spec:{encTput:'3DES/AES-CBC: 2,4 Gbps · AES-CCM: 3,4 Gbps', mtbf:'311.901 h',
     watts:'450 W máx. (con PoE) · fuente interna · PoE+ 400 W (24 puertos)',
     btu:'1.842 BTU/h', ruido:'34,3 – 71,2 dBA', dims:'4,37 × 44,2 × 31,3 cm', peso:'5,13 kg'},
   skus:[{sku:null,d:'7024 (US / RW)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  // ipsecSess/greTuns completados el 2026-09-13 desde el DS oficial de la serie 7000
  // (4.096 IPsec, 1.024 GRE, 4.096 SSL, 4.096 VLANs). El DS declara 8x combo 1G sin
  // puertos 10G — el `ifaces` del catálogo dice lo contrario: NO se toca, PENDIENTES.md.
  {id:'7030', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal gde',
   fw:8000, clients:4096, aps:64, fwSess:65536, ipsecSess:4096, greTuns:1024, boostMax:null,
   ifaces:'8x RJ45 10/100/1000 (combo) + puertos 10G', hwSku:null,
   spec:{encTput:'3DES: 2,4 Gbps · AES-CBC-256: 2,6 Gbps · AES-CCM: 4,0 Gbps · AES-GCM-256: 3,4 Gbps',
     vlanMax:'4.096', ssl:'4.096 sesiones SSL', mtbf:'390.679 h',
     watts:'55 W máx. · fuente interna',
     btu:'168 BTU/h', ruido:'29,1 – 57,4 dBA', dims:'4,4 × 30,5 × 21,1 cm', peso:'2,06 kg'},
   skus:[{sku:null,d:'7030 (US / RW)'},{sku:'JW686AR',d:'7030 remanufacturado HPE (Reman)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  // ─── Serie 7200 · Mobility Controllers de campus (AOS 8) ───────────────────
  // Sin URL de datasheet oficial confirmada en las fuentes consultadas: `ds` queda en null
  // y la pagina lo dice, en vez de enlazar una copia de tercero como si fuera oficial.
  // fwSess/ipsecSess/greTuns y `spec` completados el 2026-09-13 desde el DS oficial
  // DS_7200Series (tabla "Performance and capacity" + físico/ambiental), obtenido en dos
  // copias independientes del mismo documento (doble ancla). Conflicto NO aplicado: el DS
  // declara 12 Gbps de firewall para el 7205 y el catálogo conserva 15 Gbps (PENDIENTES.md).
  {id:'7205', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus med',
   fw:15000, clients:8000, aps:256, fwSess:1000000, ipsecSess:8192, greTuns:4096, boostMax:null,
   ifaces:'2x 10GBASE-X (SFP+) + 4x dual-media (1000BASE-X o 10/100/1000BASE-T)', hwSku:null,
   spec:{encTput:'3DES / AES-CBC-256 / AES-CCM / AES-GCM-256: 5 Gbps',
     vlanMax:'4.096', ssl:'4.096 sesiones SSL', tuneles:'4.096 puertos tunelizados',
     mtbf:'129.597 h @ 40 °C', watts:'75,2 W máx. · PSU 350 W AC', ruido:'49,0 dBA',
     dims:'4,4 × 44,2 × 33,4 cm', peso:'4,95 kg'},
   skus:[{sku:null,d:'7205 (US / RW)'},{sku:'JW735AR',d:'7205 remanufacturado HPE (Reman)'}], ds:null, dsFile:null},

  {id:'7210', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus gde',
   fw:20000, clients:16000, aps:512, fwSess:2015291, ipsecSess:16384, greTuns:8192, boostMax:null,
   ifaces:'4x 10GBASE-X (SFP+)', hwSku:null,
   spec:{encTput:'3DES: 7 Gbps · AES-CBC-256: 7 Gbps · AES-CCM: 6 Gbps · AES-GCM-256: 7 Gbps',
     vlanMax:'4.096', ssl:'8.192 sesiones SSL', tuneles:'8.192 puertos tunelizados',
     mtbf:'106.536 h @ 40 °C', watts:'110 W máx. · PSU 350 W AC', ruido:'46,9 dBA',
     dims:'4,4 × 44,5 × 44,5 cm', peso:'7,45 kg'},
   skus:[{sku:null,d:'7210 (US / RW)'},{sku:'JW743AR',d:'7210 remanufacturado HPE (Reman)'}], ds:null, dsFile:null},

  {id:'7220', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus grande / alta densidad',
   fw:40000, clients:24000, aps:1024, fwSess:2015291, ipsecSess:24576, greTuns:16384, boostMax:null,
   ifaces:'4x 10GBASE-X (SFP+)', hwSku:null,
   spec:{encTput:'3DES: 27 Gbps · AES-CBC-256: 24 Gbps · AES-CCM: 22 Gbps · AES-GCM-256: 26 Gbps',
     vlanMax:'4.096', ssl:'8.192 sesiones SSL', tuneles:'12.288 puertos tunelizados',
     mtbf:'113.751 h @ 40 °C', watts:'125 W máx. · PSU 350 W AC', ruido:'46,9 dBA',
     dims:'4,4 × 44,2 × 40,1 cm', peso:'7,9 kg'},
   skus:[{sku:null,d:'7220 (US / RW)'},{sku:'JW751AR',d:'7220 remanufacturado HPE (Reman)'}], ds:null, dsFile:null},

  {id:'7240XM', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus máxima escala',
   fw:40000, clients:32000, aps:2048, fwSess:2015291, ipsecSess:32768, greTuns:32768, boostMax:null,
   ifaces:'4x 10GBASE-X (SFP+)', hwSku:null,
   spec:{encTput:'3DES: 29 Gbps · AES-CBC-256: 31 Gbps · AES-CCM: 29 Gbps · AES-GCM-256: 35 Gbps',
     vlanMax:'4.096', ssl:'8.192 sesiones SSL', tuneles:'16.384 puertos tunelizados',
     mtbf:'116.590 h @ 40 °C', watts:'165 W máx. · PSU 350 W AC', ruido:'54,7 dBA',
     dims:'4,4 × 44,5 × 44,5 cm', peso:'7,45 kg'},
   skus:[{sku:null,d:'7240XM (US / RW)'}], ds:null, dsFile:null},
];

// ── Fin de venta confirmado (mismo patrón que Cisco) ─────────────────────────
// Fuente OFICIAL: Product Lifecycle Policy de EdgeConnect (arubanetworking.hpe.com/
// techdocs, EC_LifecyclePolicy_latest.pdf), consultada el 2026-09-13:
//   · "EC-XL-H end of sale announcement. June 2025" (los agregadores la fijan el 30-jun).
//   · "EC-XL-H end of sale (EoS). Mar 31, 2026" — último día de pedido. OJO: los
//     checkers de terceros (router-switch, layer23) dicen 30-sep-2025; se usa la fecha
//     del documento oficial, y ambas están ya vencidas a la fecha de la marca.
//   · "Last date to renew HW Maintenance. Mar 31, 2030" (+4 años tras el EoS, renovación
//     limitada a término de 1 año) y End of Support +7 años tras el EoS → 31-mar-2033.
// El sucesor NO se declara: la política dice que la notificación nombra el reemplazo,
// pero esa notificación no está publicada en las fuentes abiertas consultadas — poner
// "EC-10150" sería inferirlo. Confirmar con el distribuidor (ver PENDIENTES.md).
// Señales de terceros SIN confirmar por fuente oficial (quedan pendientes): EC-L-H
// (JZ878A, EoS 31-dic-2025) y EC-XS (JM962A, EoS 31-ene-2026) según router-switch.
const EOL_ANNOUNCED = {
  'EC-XL': {pid:'S0B67A', lastOrder:'2026-03-31', sucesor:null,
            endOfSupport:'2033-03-31',
            url:'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/docs/eula/EC_LifecyclePolicy_latest.pdf'},
};
for (const m of MODELS) {
  m.eolAnnounced = EOL_ANNOUNCED[m.id] || null;
}

// Sucesor natural de cada gateway legacy (series 7000/7200) para el semáforo de ciclo de
// vida del catálogo (fase 11, E5). INFERENCIA POR CAPACIDAD — no existe documento oficial
// de tech-refresh que nombre el reemplazo de cada modelo; la página lo etiqueta como
// «inferencia por capacidad, sin doc oficial» junto al dato. Decisión del dueño
// (2026-09-13): mostrar la inferencia marcada vale más que no mostrar nada.
const SUCESORES = {
  '7005': 'Gateway 9004',
  '7008': 'Gateway 9004',
  '7030': 'Gateway 9012',
  '7210': 'Gateway 9240',
  '7220': 'Gateway 9240',
};
for (const m of MODELS) {
  m.sucesor = SUCESORES[m.id] || null;
}

// ── Matriz de versiones mínimas de sistema operativo (fase 11, E5) ───────────
// Versión mínima de ECOS / AOS que soporta cada plataforma. Fuentes oficiales
// (2026-09-13): release notes de ECOS 8.3/9.x y matriz de compatibilidad AOS 10
// (10.3.1.1 SSR para 7000/7200/9000, 10.4.0.0 LSR para 9200, 10.5/10.6/10.7 para 9100).
// `min: null` = la matriz de hardware no aplica (EC-V sigue el tren ECOS con matriz
// propia de hipervisores).
const OS_MATRIX = {
  ecos: {
    'EC-XS':   { min: '8.3.1.0', nota: 'PIDs 4 GB (200889/200900): N/A en 9.5+ · Next Gen 201694-001: mín. 8.3.4.0' },
    'EC-10104':{ min: '9.1.3.0', nota: '9.2.3.0 en el tren 9.2 · N/A en 9.0/8.3' },
    'EC-10106':{ min: '9.3.2.0', nota: '9.4.2.0 en el tren 9.4 · N/A en 9.2 y anteriores' },
    'EC-10108':{ min: '9.3.4.0', nota: '9.4.3.0 / 9.5.1.0 en trenes posteriores · secure boot' },
    'EC-10150':{ min: '9.5.3.0', nota: 'default shipping 9.5.3.2 · N/A en 9.4 y anteriores' },
    'EC-S':    { min: '8.3.1.0', nota: 'EC-S-P: 8.3.1.5 / 8.3.2.1 / 8.3.3.0 (9.0.2.0 en tren 9.0)' },
    'EC-M':    { min: '8.3.1.0', nota: 'EC-M-H: mín. 8.3.4.0' },
    'EC-L':    { min: '8.3.1.0', nota: 'EC-L-H: mín. 8.3.4.0' },
    'EC-XL':   { min: '8.3.1.0', nota: 'EC-XL-H: 8.3.4.0 · EC-XL-H-10G: 8.3.7.0' },
    'EC-V':    { min: null,      nota: 'no aplica en la matriz de hardware: sigue el tren ECOS con matriz propia de hipervisores' },
  },
  aos: {
    'Serie 7000': { a8: '8.0+ (máx. 8.13)', a10: '10.3.1.1+ (SSR)' },
    'Serie 7200': { a8: '8.0+ (7280: 8.3+) · máx. 8.13', a10: '10.3.1.1+ (SSR)' },
    'Serie 9000': { a8: '8.5+ (9004) · 8.7+ (9012)', a10: '10.3.1.1+ (SSR)' },
    'Serie 9100': { a8: '8.13.1+ (9106 recientes)', a10: '10.5.0.1+ (9114) · 10.6.0.1+ (9106; SKUs S5Hxx: 10.7.2.0)' },
    'Serie 9200': { a8: '8.10+ (9240)', a10: '10.4.0.0+ (LSR)' },
  },
};

// ── Suscripción EdgeConnect ──────────────────────────────────────────────────
//
// DIFERENCIA ESTRUCTURAL CON FORTINET: en FortiGate la licencia va atada al MODELO (cada
// SKU lleva el código del equipo embebido). En EdgeConnect va atada al CAUDAL del sitio,
// así que dos sedes con el mismo appliance pueden llevar suscripciones distintas y subir
// de caudal no obliga a cambiar el hardware mientras el equipo dé la talla.
// La matriz que gobierna el licenciamiento automático (2026-09-13, refactor arquitectónico
// pedido por el dueño — documento «Actúa como un Arquitecto de Soluciones de Redes») es la
// oficial del QuickSpecs EdgeConnect SD-WAN v18, p.31, transcrita literal. Tres correcciones
// a lo que la arquitectura proponía como disparadores de Advanced, documentadas porque la
// fuente oficial manda:
//   · El steering dinámico por SLA de aplicación (Dynamic Path Control) y TODAS las
//     capacidades NGFW son de FOUNDATION («essential SD-WAN features and all of the
//     advanced NGFW features», p.31): no fuerzan Advanced. La matriz los lista en ambos.
//   · IDS/IPS NO va en ninguno de los dos niveles: es la licencia opcional aparte
//     Dynamic Threat Defense (QuickSpecs p.32: «adds IDS/IPS, Adaptive DDoS, Smart SYN
//     cookie and Secure web service»), sin SKU en la lista del distribuidor — consultar.
//   · La salida directa a Internet con First-packet iQ y el service chaining a SSE son
//     capacidades de PLATAFORMA (QuickSpecs p.4 y p.12), no un distintivo de nivel: la
//     matriz oficial no los vincula a Advanced. Se retira esa afirmación del texto.
//   Precisiones VSG/data sheet de suscripciones (validadas 2026-09-13, fase 10):
//   · Foundation son exactamente 2 VRF (default y guest), no «un número limitado».
//   · AppExpress: Foundation solo MONITORA; el steering de aplicaciones por AppExpress
//     es Advanced/On-Prem. El steering básico por BIO (tunnel bonding/DPC) sí es común
//     a todos los niveles — por eso DPC no fuerza Advanced.
//   · On-Prem solo existe como «Advanced On-Prem» (no hay Foundation On-Prem) e INCLUYE
//     el software de Orchestrator on-prem; el cliente aporta el alojamiento (VM, uptime,
//     backup y actualizaciones) — data sheet a50010073enw.
const BUNDLES = {
  foundation: {
    n: 'EdgeConnect Foundation',
    svcs: 'Funciones SD-WAN esenciales más TODAS las capacidades NGFW avanzadas: steering dinámico por SLA '
      + '(Dynamic Path Control), tunnel bonding, Path Conditioning (FEC y corrección de orden), firewall '
      + 'con estado y Orchestrator cloud (Foundation OaaS). Hasta 3 Business Intent Overlays, 2 VRF '
      + '(default y guest), topología hub-and-spoke (4 hubs por región), QoS esencial y retención '
      + 'fundamental de datos. AppExpress en modo solo monitor. Tiers: 100 Mbps, 1 Gbps e ilimitado.',
  },
  advanced: {
    n: 'EdgeConnect Advanced',
    svcs: 'Todo Foundation más las funciones SD-WAN avanzadas: topología ilimitada, 64 VRFs y hasta 7 '
      + 'Business Intent Overlays (segmentación multi-overlay real), QoS avanzada, retención ampliada '
      + 'de datos, AppExpress con steering de aplicaciones y Orchestrator cloud (Advanced OaaS). '
      + 'Tiers más finos: 20/50/100/200/500 Mbps, 1/2 Gbps e ilimitado. OJO: HPE no admite mezclar '
      + 'niveles en un mismo fabric.',
  },
  onprem: {
    n: 'EdgeConnect On-Premises',
    svcs: 'Existe solo como «Advanced On-Prem» (no hay Foundation On-Prem): mismo alcance funcional '
      + 'que Advanced e INCLUYE el software de Orchestrator on-prem; el cliente aporta el alojamiento '
      + '(VM, disponibilidad, backup y actualizaciones). Cambia el modelo de entrega y de consumo.',
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
  // Reducción de tráfico WAN según el perfil de datos. Ancla oficial localizada
  // 2026-09-13 (caso de estudio HPE Aruba — Universal Health Services): con Boost,
  // reducción de ~85 % para Microsoft 365 (≈6,7:1), ~45 % para Veeam (≈1,8:1) y ~40 %
  // para CIFS (≈1,7:1). El technical paper oficial de WAN Optimization (a00110933enw)
  // no publica ratios típicos y el «up to 99 %» del marketing histórico es un máximo,
  // no un típico. Por eso `repetido` queda en 1,8 (el ancla oficial para CIFS/backups):
  // el 3,5:1 anterior era un supuesto sin ancla que el caso oficial REFUTA para esas
  // cargas. `generico` y `oficina` siguen siendo supuestos conservadores de trabajo.
  // El ahorro real depende de cuánto se repita el contenido y solo una prueba con el
  // tráfico del cliente lo confirma — así se declara en la interfaz.
  reduccion: {
    generico: {n:'Tráfico genérico mixto (web, SaaS)',    factor:1.3},
    oficina:  {n:'Ficheros de oficina y correo interno',  factor:2.0},
    repetido: {n:'Réplicas, backups, VDI, CIFS/SMB',      factor:1.8},
  },
  // SKU y List Price por bloque (2026-09-13 — doble fuente como LICENSES: QuickSpecs v18
  // para SKU↔descripción, lista del distribuidor para el precio). El dimensionador consume
  // el bloque de 100 Mbps; el de 10 Gbps existe para hubs grandes y se deja documentado.
  // `saas` acompaña a Foundation/Advanced; `onprem` a la suscripción On-Premises.
  saas: {
    bloque100: {sku:{y1:'S0Z71AAS', y3:'S0Z73AAS', y5:'S0Z75AAS'}, y1:6552,   y3:19656,  y5:32760},
    bloque10g: {sku:{y1:'S0Z85AAS', y3:'S0Z87AAS', y5:'S0Z89AAS'}, y1:327600, y3:982800, y5:1638000},
  },
  onprem: {
    bloque100: {sku:{y1:'S0Z99AAS', y3:'S1A01AAS', y5:'S1A03AAS'}, y1:6552,   y3:19656,  y5:32760},
    bloque10g: {sku:{y1:'S0Z23AAS', y3:'S0Z25AAS', y5:'S0Z27AAS'}, y1:327600, y3:982800, y5:1638000},
  },
};

// Path Conditioning: el FEC envía paquetes de paridad para reconstruir pérdidas sin esperar
// retransmisión, que es lo que permite sustituir MPLS por banda ancha o 5G manteniendo SLA
// de aplicación. Cuesta ancho de banda: se suma al caudal, no se descuenta.
// Los porcentajes son supuestos de trabajo de esta herramienta, no cifras publicadas.
// Overhead de Path Conditioning (FEC). Anclas oficiales del VSG SD-Branch de HPE
// (validadas 2026-09-13): ratio 1:8 = 12,5 % para aplicaciones en tiempo real y 1:4 = 25 %
// para VoIP; el FEC de EdgeConnect es ADAPTATIVO — sin pérdida medida no genera overhead—,
// y la política HA (1:1 = 50 % de caudal efectivo) NO se ofrece aquí porque la propia guía
// la reserva para tráfico estrictamente de tiempo real. Satélite Starlink/LEO es transporte
// soportado según la misma guía.
const FEC_OVERHEAD = {
  off:  {n:'Desactivado', pct:0,    d:'Enlaces limpios: MPLS dedicado o fibra sin pérdida medida. Con FEC adaptativo, un enlace sin pérdida tampoco genera overhead.'},
  auto: {n:'Automático',  pct:0.10, d:'Orchestrator ajusta la paridad según la pérdida medida. Es el modo habitual. Ancla oficial: ratio 1:8 = 12,5 % (VSG); el motor estima 10 % como caso típico.'},
  alto: {n:'Agresivo',    pct:0.25, d:'Enlaces con pérdida alta o variable: LTE/5G, satelital (Starlink/LEO soportado según el VSG), banda ancha residencial. Ancla oficial: ratio 1:4 = 25 % para VoIP.'},
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
// SKU y List Price 1/3/5 años (2026-09-13, lista del distribuidor + SD-WAN Gateways
// Ordering Guide — DATASHEETS.sdwanOrder). Los SKU cargados son los de gateway 70xx/90xx,
// la línea SD-Branch que dimensiona esta herramienta. Variantes documentadas, no cargadas:
//   · 72xx Foundation: JZ195AAE/JZ196AAE/JZ197AAE ($9,450/$18,900/$28,350).
//   · 9004/9012 Foundation Base: JZ124AAE/JZ125AAE/JZ126AAE ($473/$945/$1,418).
//   · Foundation+Security 90xx: R4D98AAE/R4D99AAE/R4E00AAE ($1,680/$3,360/$5,040);
//     Foundation Base+Security: R4D93AAE/R4D94AAE/R4D95AAE ($893/$1,785/$2,678);
//     Advanced+Security: R4E03AAE/R4E04AAE/R4E05AAE ($2,310/$4,620/$6,930).
//   · Gateway virtual (vGW) 500M/2G/4G: R0X97-99AAE, R3V73-75AAE, R3V76-78AAE.
const CENTRAL_TIERS = {
  foundation: {n:'Central Foundation', d:'Gestión, monitorización y configuración del dispositivo.',
    sku:{y1:'JZ118AAE', y3:'JZ119AAE', y5:'JZ120AAE'}, y1:1260, y3:2520, y5:3780},
  advanced:   {n:'Central Advanced',   d:'Añade analítica avanzada, AIOps y las capacidades de seguridad del nivel superior.',
    sku:{y1:'JZ121AAE', y3:'JZ122AAE', y5:'JZ123AAE'}, y1:1890, y3:3780, y5:5670},
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

// ── SKU de Foundational Care por modelo (2026-09-13) ─────────────────────────
// El servicio se vende atado a la VARIANTE de hardware, no al tier de caudal: cada modelo
// tiene su propio juego de SKU por nivel y por duración (1/3/5 años). Fuente: el mismo
// export de lista de precios del distribuidor ya descrito en la cabecera (solo SKU,
// descripción, List Price y vigencia — nunca el distribuidor ni su descuento), filas
// literales del PL "SD-WAN Support".
//
// Correspondencia con los niveles CARE de la app (decisión documentada, 2026-09-13):
//   · fcnbd («24x7 / NBD HW — repuesto al siguiente día hábil») ↔ filas "FC NBD Exch"
//     (Next Business Day Exchange: reemplazo de hardware al siguiente día hábil).
//   · fc247 («24x7 HW — reparación in situ») ↔ filas "FC 4HR Onsite" (ingeniero en sitio
//     en 4 horas). La app lo describe como reparación in situ; es la variante con onsite
//     que publica la lista para estos modelos.
// Lo que la lista NO cubre sigue en "consultar" a propósito:
//   · fcsw: la lista no trae SKU de soporte de SOFTWARE para los EdgeConnect.
//   · Gateways (9004/9012/9106/9114/9240): sus SKU de FC van por sub-variante de pedido
//     (p. ej. 9240C vs 9240TAAC) y la app no modela esa sub-variante — mapear uno sería
//     inventar la correspondencia.
//   · EC-10150 fc247: la lista solo publica NBD Exch para el 10150 (no hay fila 4HR).
// Estructura: [SKU, List Price USD] por duración; la descripción literal de cada fila es
// "<Aruba|HPE ANW> <1Y|3Y|5Y> FC <NBD Exch|4HR Onsite> <variante> SVC".
const CARE_SKU = {
  'EC-XS':    {fcnbd:{y1:['H43W0E',277],  y3:['H43W1E',832],   y5:['H43W3E',1386]},
               fc247:{y1:['H46D5E',454],  y3:['H46D6E',1227],  y5:['H46D7E',1931]}},
  'EC-10104': {fcnbd:{y1:['H44Z4E',159],  y3:['H44Z5E',476],   y5:['H44Z7E',794]},
               fc247:{y1:['H46E7E',225],  y3:['H46E8E',609],   y5:['H46E9E',958]}},
  'EC-10106': {fcnbd:{y1:['H45D0E',446],  y3:['H45D1E',1339],  y5:['H45D3E',2231]},
               fc247:{y1:['H46F3E',530],  y3:['H46F4E',1432],  y5:['H46F5E',2253]}},
  'EC-10108': {fcnbd:{y1:['H45D4E',577],  y3:['H45D5E',1731],  y5:['H45D7E',2884]},
               fc247:{y1:['H46F6E',831],  y3:['H46F7E',2245],  y5:['H46F8E',3533]}},
  'EC-S':     {fcnbd:{y1:['H43N2E',1390], y3:['H43N3E',4170],  y5:['H43N5E',6950]},
               fc247:{y1:['H46C9E',1675], y3:['H46D0E',4522],  y5:['H46D1E',7118]}},
  'EC-M':     {fcnbd:{y1:['H43V0E',2197], y3:['H43V1E',6589],  y5:['H44F1E',10983]},
               fc247:{y1:['H46D8E',2622], y3:['H46D9E',7078],  y5:['H46E0E',11142]}},
  'EC-L':     {fcnbd:{y1:['H44F6E',3591], y3:['H44F7E',10773], y5:['H44E3E',17955]},
               fc247:{y1:['H46E1E',5796], y3:['H46E2E',15648], y5:['H46E3E',24631]}},
  'EC-XL':    {fcnbd:{y1:['H44Z0E',4813], y3:['H44Z1E',14440], y5:['H44Z3E',24066]},
               fc247:{y1:['H46F0E',7811], y3:['H46F1E',21090], y5:['H46F2E',33197]}},
  'EC-10150': {fcnbd:{y1:['H07BKE',4647], y3:['H07BLE',13942], y5:['H07BME',23238]}},
};

// Licencias por tier de caudal (2026-09-13). Cada suscripción tiene un SKU DISTINTO por
// duración (1/3/5 años), así que `sku` va desglosado igual que el precio. Doble fuente,
// ver cabecera: QuickSpecs oficial v18 para SKU↔descripción (verificado contra hpe.com),
// lista del distribuidor para el List Price. La lista también publica SKU de 7 años, por
// suscripción purga y de alta disponibilidad — no los consume el dimensionador.
//
// El soporte NO va aquí: los SKU de Foundational Care (H43W0E, H44Z4E, H07BKE…) van
// atados a la VARIANTE de hardware, no al tier de caudal — viven en CARE_SKU por modelo
// (2026-09-13, ver su comentario para fuente y correspondencias).
const LICENSES = {
  bw100: {
    foundation: {sku:{y1:'S1C49AAS', y3:'S1C51AAS', y5:'S1C53AAS'}, y1:900,  y3:2700,  y5:4500},
    advanced:   {sku:{y1:'S1B34AAS', y3:'S1B36AAS', y5:'S1B38AAS'}, y1:1848, y3:5544,  y5:9240},
    onprem:     {sku:{y1:'S1B99AAS', y3:'S1C01AAS', y5:'S1C03AAS'}, y1:1932, y3:5796,  y5:9660},
  },
  bw1g: {
    foundation: {sku:{y1:'S1A22AAS', y3:'S1A24AAS', y5:'S1A26AAS'}, y1:1680, y3:5040,  y5:8400},
    advanced:   {sku:{y1:'S1B77AAS', y3:'S1B79AAS', y5:'S1B81AAS'}, y1:6540, y3:19620, y5:32700},
    onprem:     {sku:{y1:'S0Y07AAS', y3:'S0Y09AAS', y5:'S0Y11AAS'}, y1:6864, y3:20592, y5:34320},
  },
  bwunl: {
    foundation: {sku:{y1:'S1A36AAS', y3:'S1A38AAS', y5:'S1A40AAS'}, y1:7848,  y3:23544, y5:39240},
    advanced:   {sku:{y1:'S1C35AAS', y3:'S1C37AAS', y5:'S1C39AAS'}, y1:23580, y3:70740, y5:117900},
    onprem:     {sku:{y1:'S0Z57AAS', y3:'S0Z59AAS', y5:'S0Z61AAS'}, y1:24744, y3:74232, y5:123720},
  },
};

// ── SKU de suscripción de ALTA DISPONIBILIDAD (2026-09-13) ───────────────────
// Para un par HA 1+1, HPE publica un juego de SKU propio para el SEGUNDO nodo: la
// notación «HA» del QuickSpecs (p.21-24: «Foundation High Availability 1Gbps… SaaS»).
// El par se cotiza 1× suscripción estándar (LICENSES) + 1× suscripción HA (esta tabla).
// Dato que conviene saber: el precio HA es IDÉNTICO al estándar, tier a tier y año a
// año — lo que cambia es el SKU de pedido, no el importe. Verificado literal contra el
// export de lista de precios del distribuidor (misma fuente y misma regla de extracción
// que LICENSES: solo SKU, descripción, List Price y vigencia 2026-06-01, PLC GA).
// On-Premises NO se mapea: la lista trae SKU HA E-STU de la línea antigua EC-BW
// (JM075AAS…) pero ninguna fuente consultada declara su equivalencia con los niveles
// Foundation/Advanced, así que el par on-prem se cotiza 2× estándar y se declara.
const LICENSES_HA = {
  bw100: {
    foundation: {sku:{y1:'S1C56AAS', y3:'S1A17AAS', y5:'S1A19AAS'}, y1:900,  y3:2700,  y5:4500},
    advanced:   {sku:{y1:'S1B41AAS', y3:'S1B43AAS', y5:'S1B45AAS'}, y1:1848, y3:5544,  y5:9240},
  },
  bw1g: {
    foundation: {sku:{y1:'S1A29AAS', y3:'S1A31AAS', y5:'S1A33AAS'}, y1:1680, y3:5040,  y5:8400},
    advanced:   {sku:{y1:'S1B84AAS', y3:'S1B86AAS', y5:'S1B88AAS'}, y1:6540, y3:19620, y5:32700},
  },
  bwunl: {
    foundation: {sku:{y1:'S1A43AAS', y3:'S1A45AAS', y5:'S1A77AAS'}, y1:7848,  y3:23544, y5:39240},
    advanced:   {sku:{y1:'S1C42AAS', y3:'S1C44AAS', y5:'S1C46AAS'}, y1:23580, y3:70740, y5:117900},
  },
};

// ── Catálogo maestro de accesorios (fase 12, 2026-09-13) ─────────────────────
// Transcrito VERBATIM del brief del dueño («Actúa como un Ingeniero Principal de
// Software Full-Stack…», sección 1.1 ARUBA_ACCESSORY_CATALOG). Es la fuente que
// GOBIERNA la compatibilidad y la cotización de accesorios — sustituye a los precios
// de partner autorizado usados en la fase 11 (E3), que eran provisionales porque HPE
// no publica List oficial de transceptores. Discrepancias documentadas (partner →
// dueño): J4858D $480 → $271 · J9150D $1.454 → $859 · J9281D $164 → $115 · la 2ª PSU
// del 9240 pasa de R7J63A ($721) a R1C72A ($890), que es el SKU que el dueño declara.
// Queda en PENDIENTES.md confirmar con el distribuidor cuál de las dos PSU aplica.
const ARUBA_ACCESSORY_CATALOG = {
  // Transceptores 1G SFP (Cobre y Fibra)
  "S3R03A": { name: "HPE Aruba Networking EdgeConnect 1G SFP RJ45 100m Cat5e XCVR", speed: "1G", media: "COPPER", reach: "100m", listPrice: 260.00 },
  "S1H24A": { name: "HPE Aruba Networking 9240 1G SFP RJ45 T 100m Cat5e XCVR", speed: "1G", media: "COPPER", reach: "100m", listPrice: 260.00 },
  "J4858D": { name: "HPE Aruba Networking 1G SFP LC SX 500m OM2 MMF XCVR", speed: "1G", media: "MMF", reach: "500m", listPrice: 271.00 },
  "J4859D": { name: "HPE Aruba Networking 1G SFP LC LX 10km SMF XCVR", speed: "1G", media: "SMF", reach: "10km", listPrice: 419.00 },
  "J4860D": { name: "HPE Aruba Networking 1G SFP LC LH 70km SMF XCVR", speed: "1G", media: "SMF", reach: "70km", listPrice: 1250.00 },
  "JL745A": { name: "HPE Aruba Networking 1G SFP LC SX 500m MMF TAA XCVR", speed: "1G", media: "MMF_TAA", reach: "500m", listPrice: 315.00 },
  "JL746A": { name: "HPE Aruba Networking 1G SFP LC LX 10km SMF TAA XCVR", speed: "1G", media: "SMF_TAA", reach: "10km", listPrice: 480.00 },
  // Transceptores y Cables Twinax 10G SFP+
  "J9150D": { name: "HPE Aruba Networking 10G SFP+ LC SR 300m OM3 MMF XCVR", speed: "10G", media: "MMF", reach: "300m", listPrice: 859.00 },
  "J9151E": { name: "HPE Aruba Networking 10G SFP+ LC LR 10km SMF XCVR", speed: "10G", media: "SMF", reach: "10km", listPrice: 1981.00 },
  "J9153D": { name: "HPE Aruba Networking 10G SFP+ LC ER 40km SMF XCVR", speed: "10G", media: "SMF", reach: "40km", listPrice: 3850.00 },
  "JL747A": { name: "HPE Aruba Networking 10G SFP+ LC SR 300m OM3 MMF TAA XCVR", speed: "10G", media: "MMF_TAA", reach: "300m", listPrice: 990.00 },
  "JL748A": { name: "HPE Aruba Networking 10G SFP+ LC LR 10km SMF TAA XCVR", speed: "10G", media: "SMF_TAA", reach: "10km", listPrice: 2280.00 },
  "J9281D": { name: "HPE Aruba Networking 10G SFP+ to SFP+ 1m DAC Cable", speed: "10G", media: "DAC", reach: "1m", listPrice: 115.00 },
  "J9283D": { name: "HPE Aruba Networking 10G SFP+ to SFP+ 3m DAC Cable", speed: "10G", media: "DAC", reach: "3m", listPrice: 163.00 },
  "J9285D": { name: "HPE Aruba Networking 10G SFP+ to SFP+ 7m DAC Cable", speed: "10G", media: "DAC", reach: "7m", listPrice: 249.00 },
  // Transceptores y DACs 25G SFP28 (EC-10150 y Gateway 9240)
  "JL484A": { name: "HPE Aruba Networking 25G SFP28 LC SR 100m MMF XCVR", speed: "25G", media: "MMF", reach: "100m", listPrice: 1299.00 },
  "JL485A": { name: "HPE Aruba Networking 25G SFP28 LC eSR 400m MMF XCVR", speed: "25G", media: "MMF", reach: "400m", listPrice: 1650.00 },
  "JL486A": { name: "HPE Aruba Networking 25G SFP28 LC LR 10km SMF XCVR", speed: "25G", media: "SMF", reach: "10km", listPrice: 2600.00 },
  "JL487A": { name: "HPE Aruba Networking 25G SFP28 to SFP28 0.65m DAC Cable", speed: "25G", media: "DAC", reach: "0.65m", listPrice: 120.00 },
  "JL488A": { name: "HPE Aruba Networking 25G SFP28 to SFP28 3m DAC Cable", speed: "25G", media: "DAC", reach: "3m", listPrice: 190.00 },
  "JL489A": { name: "HPE Aruba Networking 25G SFP28 to SFP28 5m DAC Cable", speed: "25G", media: "DAC", reach: "5m", listPrice: 260.00 },
  // Almacenamiento NVMe Boost, Fuentes Redundantes y Racks
  "S2N67A": { name: "HPE Aruba Networking EC 10010 NM Drive Kit (2x 1.6TB NVMe)", category: "STORAGE_BOOST", listPrice: 7146.00 },
  "R1C72A": { name: "HPE Aruba Networking 9240 550W Secondary AC Power Supply", category: "PSU", listPrice: 890.00 },
  "R1B23A": { name: "Aruba 9004-MNT-19 19-inch Rack Mount Kit", category: "MOUNT", listPrice: 120.00 },
  "R1B24A": { name: "Aruba 9012-MNT-19 19-inch Rack Mount Kit", category: "MOUNT", listPrice: 140.00 },
  "JW084A": { name: "Aruba AP-CBL-SERU Micro-USB/USB-C to RJ45 Console Cable", category: "CABLE", listPrice: 45.00 }
};

// Matriz modelo → accesorios ofertables. Procedencia de cada regla:
//   · VSG EdgeConnect oficial (fase 11): las ópticas 1G de fibra (J4858D/J4859D) solo se
//     certifican en EC-10106; 10G (J9150D/J9151E) y DAC 10G (J9281D/J9283D) en
//     EC-10106/10108/10150; EC-10104 no tiene ranuras SFP; 9240 = 4x SFP28.
//   · Brief del dueño (fase 12): 25G SFP28 → «EC-10150 y Gateway 9240»; S1H24A → 9240;
//     R1C72A → 9240; R1B23A → 9004; R1B24A → 9012; S2N67A → kit NVMe Boost.
//   · Inferencia por familia (marcada): J4860D y las variantes TAA (JL745A/JL746A) van
//     donde van los 1G; J9153D, JL747A/JL748A y J9285D donde van los 10G; S3R03A (1G
//     cobre EdgeConnect) sigue la regla 1G del VSG. Confirmar con el distribuidor.
//   · S2N67A solo en EC-10106/10108: el EC-10150 ya lleva 2 SSD NVMe de sistema de
//     fábrica (QuickSpecs) y los EC-XS/S/M/L/XL usan otro kit fuera de este catálogo.
//   · JW084A (consola) se ofrece en todo el hardware; el EC-V es virtual.
const ACCESSORY_COMPAT = {
  'EC-10106': { items: ['S3R03A','J4858D','J4859D','J4860D','JL745A','JL746A','J9150D','J9151E','J9153D','JL747A','JL748A','J9281D','J9283D','J9285D','S2N67A','JW084A'],
    nota: '2 ranuras SFP 1G + 2 SFP+ 10G (VSG). Fuente externa única: sin opción de 2ª PSU. Boost exige el kit NVMe S2N67A.' },
  'EC-10108': { items: ['J9150D','J9151E','J9153D','JL747A','JL748A','J9281D','J9283D','J9285D','S2N67A','JW084A'],
    nota: '4 ranuras SFP+ 10G (VSG) — la tabla oficial NO certifica ópticas 1G en este modelo. Fuente externa única: sin opción de 2ª PSU. Boost exige el kit NVMe S2N67A.' },
  'EC-10150': { items: ['J9150D','J9151E','J9153D','JL747A','JL748A','J9281D','J9283D','J9285D','JL484A','JL485A','JL486A','JL487A','JL488A','JL489A','JW084A'],
    nota: '8 ranuras SFP+/SFP28 1/10/25G (VSG). Lleva 2 PSU redundantes y 2 SSD NVMe de sistema de fábrica: ni 2ª fuente ni kit Boost.' },
  'Gateway 9004': { items: ['R1B23A','JW084A'],
    nota: 'Sin ranuras SFP. Kit de rack 19" R1B23A.' },
  'Gateway 9012': { items: ['R1B24A','JW084A'],
    nota: 'Sin ranuras SFP. Kit de rack 19" R1B24A.' },
  'Gateway 9240': { items: ['S1H24A','JL484A','JL485A','JL486A','JL487A','JL488A','JL489A','R1C72A','JW084A'],
    nota: '4 ranuras SFP28 1/10/25G (datasheet). 1+1 PSU: la 2ª fuente es la R1C72A (550 W). Ópticas 25G y cobre 1G S1H24A según catálogo maestro.' },
};
// Consola universal: todo el hardware que no tiene regla propia la ofrece (el EC-V es
// virtual y no la necesita). Los legacy 7000/7200 quedan fuera: usan otro cable.
for (const m of MODELS) {
  if (!ACCESSORY_COMPAT[m.id] && m.fam === 'ec' && m.id !== 'EC-V') {
    ACCESSORY_COMPAT[m.id] = { items: ['JW084A'], nota: 'Sin matriz de ópticas en el catálogo maestro para este modelo — solo cable de consola. Confirmar transceptores con el distribuidor.' };
  }
}

module.exports = {
  MODELS, BUNDLES, CARE, CARE_SKU, LICENSES, LICENSES_HA, BW_TIERS, BOOST, FEC_OVERHEAD,
  SOFTWARE, CENTRAL_TIERS, DATASHEETS, EOL_ANNOUNCED, OS_MATRIX,
  ARUBA_ACCESSORY_CATALOG, ACCESSORY_COMPAT,
};
