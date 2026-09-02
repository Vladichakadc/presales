'use strict';
// Procedencia del catalogo, por fabricante y como DATOS.
//
// POR QUE EXISTE ESTE ARCHIVO
// Cada `legacyData/*.js` ya documentaba en su cabecera de que documento salieron sus cifras
// y de que fecha es — pero en un comentario, que no lo ve ni la aplicacion ni ninguna
// comprobacion automatica. En una herramienta de preventa eso importa: quien arma una
// propuesta necesita saber si la cifra que esta citando es de julio o de hace tres anos, y
// hoy no habia forma de saberlo sin abrir el codigo.
//
// Aqui esa misma informacion se estructura, sin inventar nada: cada entrada se transcribe
// de la cabecera del archivo correspondiente. Donde la cabecera NO da fecha, `fecha` queda
// en `null` y se declara — igual que el catalogo hace con los precios de Aruba o el `cps`
// de Fortinet. Una fuente sin fecha es un hueco que conviene ver, no uno que rellenar a ojo.
//
// QUIEN LO CONSUME
//   · `catalogProjection.js` lo proyecta a la API y el portal lo muestra por fabricante.
//   · `seedCatalog.js` avisa por consola cuando una fuente supera ANTIGUEDAD_AVISO_MESES.
//   · `scripts/catalogo-check.js` lo lista junto a la cobertura de campos.
//   · `scripts/vigia-fuentes.js` compara el `hash` guardado con el del documento en vivo,
//     desde una maquina con salida a internet, para avisar cuando el fabricante lo cambia.
//
// EL CAMPO `hash`
// Es el SHA-256 del documento tal como se descargo la ultima vez. Va en `null` mientras
// nadie lo haya calculado: el proxy de egreso de este entorno responde 403 a los dominios de
// los cuatro fabricantes, asi que se rellena la primera vez que `npm run vigia` corre desde
// fuera. `null` significa "todavia no se ha medido", nunca "no ha cambiado".
//
// EL CAMPO `estable`, Y POR QUE HIZO FALTA
// Se midio, no se supuso: dos corridas del vigia con minutos de diferencia dieron tamanos
// distintos para las paginas HTML (Cisco 173.913 -> 173.905 bytes, Aruba 333.670 -> 333.667,
// Nokia 307.119 -> 307.115) y EXACTAMENTE el mismo para el PDF de Juniper. Una pagina de
// producto lleva marcas de tiempo, identificadores de sesion y banners rotatorios: su hash
// cambia en cada peticion sin que el dato haya cambiado.
//
// Un vigia que avisa en falso todas las semanas se acaba ignorando, y entonces no avisa de
// nada. Asi que `estable: true` marca los documentos cuyo hash SI significa algo (un PDF
// publicado, un boletin), y solo esos abren un issue. Las paginas siguen midiendose y su
// variacion sale en el informe, pero como observacion y no como alarma.

// A partir de cuantos meses una fuente se considera vieja y el arranque lo dice. Seis meses
// es medio ciclo de refresco de catalogo de estos fabricantes: lo bastante largo para no
// avisar por ruido, lo bastante corto para que no se pase un cambio de gama entero.
const ANTIGUEDAD_AVISO_MESES = 6;

// `fecha` en ISO. Solo el mes cuando la cabecera solo da el mes ("julio 2026"), el dia
// completo cuando lo da ("17-ago-2026"). Nunca se completa el dia a ojo.
const FUENTES = {
  fortinet: [
    { documento: 'Fortinet Product Matrix',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/Fortinet_Product_Matrix.pdf', estable: true,
      fecha: '2026-07', hash: null, cubre: 'throughput por capa, sesiones, cps',
      nota: 'Fuente oficial. `cps` esta en 53 de los 58 modelos (2026-09-02, traido via GitHub Actions a la rama fuente/fortinet-product-matrix y leido pagina por pagina). Los 5 restantes (100F/200F/400F/401F/600F) no aparecen en este documento: es un "Top Selling Models Matrix", subconjunto curado del catalogo completo.' },
    { documento: '2026Q3 Main Price list_AMER_FINAL_EFF 080326.xlsx',
      url: null, fecha: '2026-08-03', hash: null, cubre: 'precios de hardware, licencias FortiGuard y soporte FortiCare',
      nota: 'Lista de precios AMER oficial, vigente desde el 3 de agosto de 2026. Es el unico fabricante de este catalogo con precios verificados contra una lista firmada.' },
  ],

  cisco: [
    { documento: 'Datasheets oficiales de producto',
      url: null, fecha: '2026-08', hash: null, cubre: 'cifras tecnicas de Catalyst 8000, ISR 1000, Meraki MX y ASR 1000',
      nota: 'Verificacion de la Fase 2.' },
    { documento: 'Boletines oficiales de fin de venta (EOL)',
      url: 'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html', estable: true,
      fecha: '2026-07-27', hash: null, cubre: 'fechas de ultimo pedido de los chasis Catalyst 8300/8200, 8500-12X4QC y la linea ASR 1000',
      nota: 'La regla de ficha.js compara la fecha de ultimo pedido contra la de hoy, asi que un equipo deja de proponerse solo el dia que vence.' },
    { documento: 'Export de CCW (Products_115951960955347.xlsx)',
      url: null, fecha: '2026-08-17', hash: null, cubre: 'precios de lista y confirmacion de la generacion Secure Router (G2)',
      nota: 'Export real de la herramienta de cotizacion de Cisco.' },
  ],

  juniper: [
    { documento: 'SRX Series and vSRX Performance and Features Matrix',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/security-products-comparison-chart.pdf', estable: true,
      fecha: '2020-08', hash: null, cubre: 'firewall por base de medicion, IPsec, IPS y ATP de las lineas SRX300/1500/4100/4200/4600/5000 y vSRX',
      nota: '2026-09-02: traido via GitHub Actions (mismo patron que Fortinet). El documento en si es de agosto de 2020 (pie de pagina "1000265-021-EN Aug 2020") — la fecha "2026-08" que llevaba este registro era una suposicion de cuando no se podia leer el documento, no una medicion; corregida. Sigue siendo el que sirve la URL oficial de Juniper hoy.' },
    { documento: 'SRX300 Line of Services Gateways Datasheet',
      url: 'https://www.juniper.net/assets/us/en/local/pdf/datasheets/1000550-en.pdf', estable: true,
      fecha: null, hash: null, cubre: 'ficha individual de la linea SRX300 (300/320/340/345/380)',
      nota: 'Enlazado desde la propia Security Products Comparison Chart como la ficha vigente de esta linea. Se usa para contrastar cifras que difieran entre esa tabla y este documento.' },
    { documento: 'SRX1500 Services Gateway Datasheet',
      url: 'https://www.juniper.net/assets/us/en/local/pdf/datasheets/1000551-en.pdf', estable: true,
      fecha: null, hash: null, cubre: 'ficha individual del SRX1500',
      nota: 'Enlazado desde la propia Security Products Comparison Chart como la ficha vigente de este modelo.' },
  ],

  huawei: [
    { documento: 'Datasheets oficiales de producto',
      url: null, fecha: '2026-08', hash: null, cubre: 'cifras de las lineas AR y NetEngine',
      nota: 'Verificacion de la Fase 2. Faltan el ciclo de vida (0 de 40 modelos marcados), `ipsec` y `typ` en las NetEngine y `mpps` en los AR. 2026-09-02: comprobado desde GitHub Actions (a diferencia de Fortinet, esto NO se cierra igual) que e.huawei.com y support.huawei.com bloquean el navegador automatizado con un "Access Denied" de Akamai -bloqueo del propio Huawei contra automatizacion, no del proxy de este entorno- y que ademas sirven una aplicacion Vue/Nuxt sin contenido en el HTML crudo, asi que ni siquiera un fetch() sin navegador vale. Info.support.huawei.com si carga, pero Info-Finder es un glosario de terminos (AAA, ACL...), no una base de datos de ciclo de vida por modelo, y exige sesion iniciada para cualquier detalle. Se completa a mano, con `npm run huawei`, desde una maquina con navegador real y sesion de Huawei si hace falta el detalle fino.' },
  ],

  mikrotik: [
    { documento: 'Datasheets publicos y MSRP de mikrotik.com',
      url: 'https://mikrotik.com/products', estable: false, fecha: null, hash: null,
      cubre: 'forwarding con FastTrack, IPsec, RAM, nucleos y nivel de licencia',
      nota: 'SIN FECHA en la cabecera del catalogo, y sin price list firmada a diferencia de Fortinet. Confirmar contra distribuidor autorizado antes de cotizar en firme.' },
  ],

  aruba: [
    { documento: 'Paginas de producto y tienda oficiales de HPE/Aruba',
      url: 'https://www.hpe.com/us/en/networking.html', estable: false, fecha: null, hash: null,
      cubre: 'modelos EdgeConnect, gateways 9000/9200, software y SKUs de hardware',
      nota: 'SIN FECHA en la cabecera del catalogo. Los PDF no pudieron abrirse (bloqueo de egreso a los dominios de HPE): las cifras salen de las descripciones publicadas en esas paginas, no de la lectura integra del datasheet. SIN PRICE LIST: todos los precios van en null y el BOM los declara sin cotizar.' },
  ],

  nokia: [
    { documento: 'Datasheets oficiales de producto',
      url: 'https://www.nokia.com/networks/ip-networks/', estable: false, fecha: '2026-08', hash: null,
      cubre: 'lineas 7220 IXR, 7250 IXR y 7750 SR',
      nota: 'Cifras tecnicas verificadas; el PRECIO no, porque no hay lista de precios de Nokia en el material disponible. Van como Consultar y el BOM los cuenta sin cotizar.' },
  ],
};

// Meses transcurridos desde `fecha` hasta `ahora`. Devuelve null si no hay fecha: no se
// puede medir la antiguedad de algo que no dice cuando se hizo, y fingir un 0 seria decir
// "recien verificado", que es justo lo contrario de lo que pasa.
function mesesDesde(fecha, ahora = new Date()) {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).split('-').map(Number);
  if (!anio || !mes) return null;
  const desde = new Date(Date.UTC(anio, mes - 1, dia || 1));
  if (Number.isNaN(desde.getTime())) return null;
  return (ahora.getUTCFullYear() - desde.getUTCFullYear()) * 12
    + (ahora.getUTCMonth() - desde.getUTCMonth())
    - (ahora.getUTCDate() < desde.getUTCDate() ? 1 : 0);
}

// Estado de una fuente: 'vigente', 'vieja' (supera el umbral) o 'sin fecha'.
function estadoFuente(fuente, ahora = new Date()) {
  const meses = mesesDesde(fuente.fecha, ahora);
  if (meses === null) return { estado: 'sin fecha', meses: null };
  return { estado: meses >= ANTIGUEDAD_AVISO_MESES ? 'vieja' : 'vigente', meses };
}

// Las fuentes de un fabricante, cada una con su estado ya resuelto. Lo consumen por igual la
// proyeccion a la API, el aviso del arranque y el inventario de `npm run catalogo`.
function fuentesDe(vendorCode, ahora = new Date()) {
  const lista = FUENTES[String(vendorCode || '').toLowerCase()] || [];
  return lista.map((f) => ({ ...f, ...estadoFuente(f, ahora) }));
}

// Todas las que piden atencion, para el aviso del arranque.
function fuentesQueAvisan(ahora = new Date()) {
  const avisos = [];
  for (const vendor of Object.keys(FUENTES)) {
    for (const f of fuentesDe(vendor, ahora)) {
      if (f.estado !== 'vigente') avisos.push({ vendor, ...f });
    }
  }
  return avisos;
}

module.exports = { FUENTES, ANTIGUEDAD_AVISO_MESES, mesesDesde, estadoFuente, fuentesDe, fuentesQueAvisan };
