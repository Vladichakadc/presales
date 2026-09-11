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
  {id:'EC-XS', redund:false, psu:{tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50-60 Hz', texto:'Requerimiento de alimentación 23 W en la primera revisión de hardware y 34 W en las posteriores — HPE publica el requerimiento, no un consumo típico. Fuente única mediante adaptador externo, sin opción de segunda.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal peq / Oficina remota',
   wanMin:2, wanMax:200, boostMax:200,
   ifaces:'4x RJ45 10/100/1000 LAN/WAN + 2x RJ45 10/100/1000 gestión + serie RJ-45',
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
   hwSku:'R9D72A', skus:[{sku:'R9D72A',d:'EdgeConnect 10104 · 4x RJ45 10/100/1000'},
                         {sku:'S3N78A',d:'EdgeConnect 10104 TAA · 4x RJ45'},
                         {sku:'S3N69A',d:'EdgeConnect 10104 NAL · 4x RJ45'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', dsFile:null},

  {id:'EC-10106', redund:false, psu:{tipo:'adaptador externo, único (54 V)', texto:'Fuente única — el QuickSpecs confirma que no hay segunda fuente pero no publica el consumo.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal pequeña',
   wanMin:2, wanMax:1000, boostMax:1000,
   ifaces:'2x SFP+ 1/10G + 2x Combo (SFP/1GbE) + 2x GbE PoE+',
   hwSku:'S0E22A', skus:[{sku:'S0E22A',d:'EdgeConnect 10106 · 2x SFP+ · 2x Combo · 2x GbE PoE+'},
                         {sku:'S3N71A',d:'EdgeConnect 10106 NAL · 2x SFP+ · 2x Combo · 2x GbE PoE+'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', dsFile:null},

  {id:'EC-10108', redund:false, psu:{tipo:'adaptador externo, único (54 V)', texto:'Fuente única — el QuickSpecs confirma que no hay segunda fuente pero no publica el consumo.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal mediana',
   wanMin:2, wanMax:2000, boostMax:2000,
   ifaces:'2x SFP+ 1/10G + 2x Combo (SFP/1GbE) + 2x GbE PoE+',
   hwSku:'S0E23A', skus:[{sku:'S0E23A',d:'EdgeConnect 10108 · 2x SFP+ · 2x Combo · 2x GbE PoE+'},
                         {sku:'S3N72A',d:'EdgeConnect 10108 NAL · 2x SFP+ · 2x Combo · 2x GbE PoE+'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', dsFile:null},

  {id:'EC-S', redund:false, psu:{tipo:'fuente única interna, AC (S3N73A) o DC (S3N74A) según el SKU', volts:'100-240 V AC, 47-63 Hz', texto:'Requerimiento de alimentación 100 W — HPE publica el requerimiento, no un consumo típico. El EdgeConnect Hardware Reference confirma lo que el catálogo ya decía: una sola fuente por unidad. Las variantes EC-S-P sí traen 1+1 redundante (111 W en AC, 103 W en DC).'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Sucursal grande / Oficina remota',
   wanMin:10, wanMax:3000, boostMax:3000,
   ifaces:'8x RJ45 10/100/1000 + 4x SFP+ 1/10G',
   hwSku:'S3N73A', skus:[{sku:'S3N73A',d:'EC-S-P · 4x SFP+ · 10x RJ45 · PSU AC · 2x SSD · NAL'},
                         {sku:'S3N74A',d:'EC-S-P · 4x SFP+ · 10x RJ45 · PSU DC · 2x SSD · NAL'}],
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet', dsFile:'edgeconnect-spec-sheet-us.pdf'},

  {id:'EC-M', redund:true, psu:{tipo:'1+1 redundante, sustituible e intercambiable en caliente', volts:'100-240 V AC, 50-60 Hz', texto:'Requerimiento de alimentación 126 W — HPE publica el requerimiento, no un consumo típico.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Hub / Sucursal grande',
   wanMin:50, wanMax:5000, boostMax:5000,
   ifaces:'8x RJ45 1GbE + 4x SFP+ 1/10G (SR o LR)',
   hwSku:'JZ872A', skus:[{sku:'JZ872A',d:'EC-M-H · 8x RJ45 10/100/1000 · 4x SFP+ 1/10G'},
                         {sku:null,d:'EC-M-P-FIPS (validado FIPS 140)'}],
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet', dsFile:'edgeconnect-spec-sheet-us.pdf'},

  {id:'EC-L', redund:true, psu:{tipo:'1+1 redundante, sustituible e intercambiable en caliente', volts:'100-240 V AC, 50-60 Hz', texto:'Requerimiento de alimentación 401 W — HPE publica el requerimiento, no un consumo típico.'}, fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Datacenter / Hub grande',
   wanMin:2000, wanMax:10000, boostMax:10000,
   ifaces:'6x SFP+ 10G (SR o LR)',
   hwSku:'JZ878A', skus:[{sku:'JZ878A',d:'EC-L-H · 6x SFP+ 1/10G'}],
   ds:'https://www.arubanetworks.com/resource/edgeconnect-us-spec-sheet', dsFile:'edgeconnect-spec-sheet-us.pdf'},

  // SEÑAL SIN CONFIRMAR (2026-09-10): en el export de lista de precios del distribuidor (ver
  // DATASHEETS.priceList), la fila de S0B67A SIN sufijo de país marca estado PLC "ES" (End of
  // Sale) con vigencia 2026-06-30, mientras que las ~20 filas por país del mismo SKU (US, EU,
  // BR...) marcan "GA". No se sabe si la fila sin sufijo es la maestra (y EC-XL ya estaría en
  // salida) o un residuo desactualizado — un solo documento, y contradictorio consigo mismo,
  // no alcanza para tocar nada (misma regla que el conflicto de wanMax de EC-XS). Se deja sin
  // marcar como EOL; confirmar con HPE/el distribuidor antes de cotizar EC-XL en una propuesta
  // nueva. Ver PENDIENTES.md, "Aruba: List Price real para EdgeConnect y gateways".
  {id:'EC-XL', fam:'ec', rol:'sdwan', serie:'EdgeConnect', seg:'Datacenter / Head-end de fabric',
   wanMin:2000, wanMax:10000, boostMax:10000,
   ifaces:'hasta 6x SFP+ 10G y/o SFP28 25G · network memory en flash PCIe · PSU y almacenamiento redundantes',
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
  {id:'Gateway 9004', fam:'gw', rol:'sucursal', serie:'Serie 9000', seg:'Sucursal peq',
   fw:4000, clients:2048, aps:32, fwSess:null, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'4x GbE RJ45', hwSku:'R1B20A', skus:[{sku:'R1B20A',d:'9004 (US) · 4x GbE RJ45'}],
   ds:'https://www.hpe.com/psnow/doc/a00091602enw', dsFile:'gateway-9004.pdf'},

  {id:'Gateway 9004-LTE', fam:'gw', rol:'sucursal', serie:'Serie 9000', seg:'Sucursal peq + LTE',
   fw:4000, clients:2048, aps:32, fwSess:null, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'4x GbE RJ45 + LTE integrado (uplink dedicado o redundante)', hwSku:'R3V91A',
   skus:[{sku:'R3V91A',d:'9004-LTE (US) · 4x GbE RJ45 + LTE'}],
   ds:'https://www.hpe.com/psnow/doc/a00091602enw', dsFile:'gateway-9004.pdf'},

  {id:'Gateway 9012', fam:'gw', rol:'sucursal', serie:'Serie 9000', seg:'Sucursal med / gde',
   fw:6000, clients:2048, aps:32, fwSess:null, ipsecSess:2048, greTuns:544, boostMax:null,
   ifaces:'12x GbE RJ45 (6x PoE+)', hwSku:'R1B31A',
   skus:[{sku:'R1B31A',d:'9012 (US) · 12x GbE · 6x PoE+'},{sku:'R1B37A',d:'9012 (RW) TAA · 12x GbE · 6x PoE+'}],
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
   hwSku:'S5H02A', skus:[{sku:'S5H02A',d:'9106 (US) · 2x SFP+ · 2x Combo · 2x PoE'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50006999enw.html', dsFile:'serie-9100-hybrid-quickspecs.pdf'},

  {id:'Gateway 9114', fam:'gw', rol:'campus', serie:'Serie 9100 Hybrid', seg:'Campus peq / Sucursal grande',
   fw:20000, clients:10000, aps:4000, fwSess:2000000, ipsecSess:32000, greTuns:null, boostMax:null,
   ifaces:'4x SFP+ 10GbE + 4x combo SFP/RJ45 1GbE + 1 slot de expansión',
   hwSku:'R9M45A', skus:[{sku:'R9M45A',d:'9114 · 4x SFP+ · 4x combo · 1 slot de expansión'}],
   ds:'https://www.hpe.com/us/en/collaterals/collateral.a50006999enw.html', dsFile:'serie-9100-hybrid-quickspecs.pdf'},

  // ─── Serie 9200 · Campus Gateways ──────────────────────────────────────────
  {id:'Gateway 9240', fam:'gw', rol:'campus', serie:'Serie 9200', seg:'Campus / Hub regional',
   fw:20000, clients:16000, aps:512, fwSess:null, ipsecSess:null, greTuns:null, boostMax:null,
   licCap:[
     {code:'hw',     n:'Solo hardware',             fw:20000, aps:512,  clients:16000},
     {code:'silver', n:'+ licencia Silver (perp.)', fw:30000, aps:1000, clients:24000},
     {code:'gold',   n:'+ licencia Gold (perp.)',   fw:40000, aps:2000, clients:32000},
   ],
   ifaces:'4x SFP28 + 1 slot de expansión · 1U rack', hwSku:'R7H95A',
   skus:[{sku:'R7H95A',d:'9240 (US) · 4x SFP28 · 1 slot de expansión'}],
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
   skus:[{sku:null,d:'7005 (US / RW)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  {id:'7008', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal peq + PoE',
   fw:2000, clients:1024, aps:16, fwSess:16384, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'8x RJ45 10/100/1000 con PoE y PoE+ integrados · sin ventilador', hwSku:null,
   skus:[{sku:null,d:'7008 (US / RW)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  {id:'7010', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal med',
   fw:4000, clients:2048, aps:32, fwSess:32768, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'16x RJ45 10/100/1000 + 2x SFP', hwSku:null,
   skus:[{sku:null,d:'7010 (US / RW)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  {id:'7024', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal med · acceso unificado 24p',
   fw:4000, clients:2048, aps:32, fwSess:32768, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'24x RJ45 10/100/1000 + 2x SFP+ 10G', hwSku:null,
   skus:[{sku:null,d:'7024 (US / RW)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  {id:'7030', fam:'gw', legacy:true, rol:'sucursal', serie:'Serie 7000', seg:'Sucursal gde',
   fw:8000, clients:4096, aps:64, fwSess:65536, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'8x RJ45 10/100/1000 (combo) + puertos 10G', hwSku:null,
   skus:[{sku:null,d:'7030 (US / RW)'}],
   ds:'https://support.hpe.com/hpesc/public/docDisplay?docId=c05330596&docLocale=en_US', dsFile:'serie-7000-especificaciones.pdf'},

  // ─── Serie 7200 · Mobility Controllers de campus (AOS 8) ───────────────────
  // Sin URL de datasheet oficial confirmada en las fuentes consultadas: `ds` queda en null
  // y la pagina lo dice, en vez de enlazar una copia de tercero como si fuera oficial.
  {id:'7205', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus med',
   fw:15000, clients:8000, aps:256, fwSess:null, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'2x 10GBASE-X (SFP+) + 4x dual-media (1000BASE-X o 10/100/1000BASE-T)', hwSku:null,
   skus:[{sku:null,d:'7205 (US / RW)'}], ds:null, dsFile:null},

  {id:'7210', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus gde',
   fw:20000, clients:16000, aps:512, fwSess:null, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'4x 10GBASE-X (SFP+)', hwSku:null,
   skus:[{sku:null,d:'7210 (US / RW)'}], ds:null, dsFile:null},

  {id:'7220', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus grande / alta densidad',
   fw:40000, clients:24000, aps:1024, fwSess:null, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'4x 10GBASE-X (SFP+)', hwSku:null,
   skus:[{sku:null,d:'7220 (US / RW)'}], ds:null, dsFile:null},

  {id:'7240XM', fam:'gw', legacy:true, rol:'campus', serie:'Serie 7200', seg:'Campus máxima escala',
   fw:40000, clients:32000, aps:2048, fwSess:null, ipsecSess:null, greTuns:null, boostMax:null,
   ifaces:'4x 10GBASE-X (SFP+)', hwSku:null,
   skus:[{sku:null,d:'7240XM (US / RW)'}], ds:null, dsFile:null},
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
