'use strict';
/* PENDIENTE 38 — POR QUE TRES FUENTES DAN 403, MEDIDO CON UN GRUPO DE CONTROL.
 *
 * El pendiente afirma que el 403 «no es el proxy de este entorno, asi que es una restriccion
 * del propio fabricante». Esa conclusion no estaba medida: se dedujo de que el codigo llegara
 * igual desde un ejecutor de Actions. Pero hay una explicacion mas simple que nadie descarto,
 * y se ve mirando las URL:
 *
 *     https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/     <- carpeta
 *     https://www.juniper.net/documentation/us/en/hardware/                          <- indice
 *     https://arubanetworking.hpe.com/techdocs/VSG/docs/070-sd-branch-design/        <- indice
 *
 * Las tres terminan en `/`. NO SON DOCUMENTOS: son directorios, y un CDN responde 403 a un
 * listado de directorio por configuracion, no por bloquear a nadie. Si eso es lo que pasa, el
 * vigia lleva desde el 2026-09-14 vigilando una carpeta que nunca podra leer, y esa fuente se
 * queda «no comprobada» para siempre — un aviso que nadie puede cerrar entrena a la gente a
 * ignorarlo, que es el mismo vicio que el lock que se curaba solo.
 *
 * COMO SE DISTINGUE UNA COSA DE LA OTRA: CON UN GRUPO DE CONTROL. Junto a cada URL bloqueada
 * se prueba un ARCHIVO del mismo dominio, y cuando se puede del mismo directorio, que este
 * repositorio ya sabe que se descarga. Las dos hipotesis predicen resultados distintos:
 *
 *   · si el fabricante bloquea al ejecutor  -> el control tambien falla;
 *   · si lo que falla es la forma de la URL -> el control responde 200 y la carpeta 403.
 *
 * Ninguna candidata se escribe en el catalogo desde aqui. Este script MIDE; sustituir una URL
 * en `legacyData/fuentes.js` es un commit que hace una persona despues de abrir el documento,
 * igual que `--revisado` del vigia.
 *
 *   node scripts/probar-candidatas.js [--json] [--timeout=20]
 */
const { FUENTES } = require('../server/seed/legacyData/fuentes.js');

// Cada entrada declara la fuente bloqueada, las candidatas a sustituirla y el CONTROL con el
// que se distingue «me bloquean» de «estoy pidiendo una carpeta». `porQue` no es adorno: una
// candidata sin procedencia es una URL inventada, y este repositorio ya pago ese error con un
// SKU que no existia.
const CASOS = [
  {
    fabricante: 'juniper',
    bloqueada: 'https://www.juniper.net/documentation/us/en/hardware/',
    respalda: 'redund / psu de los 12 SRX (hardware guides, una por modelo)',
    candidatas: [
      // Medido el 2026-09-16: `/documentation/` responde 200 y la carpeta 403, asi que el
      // dominio no bloquea. Falta una guia CONCRETA: sin ella, sustituir la carpeta por la
      // portada de la TechLibrary seria vigilar algo que no respalda ningun dato de este
      // catalogo — el error del `noAplica` deducido, con otra forma.
      { url: 'https://www.juniper.net/documentation/us/en/hardware/srx1600/index.html',
        porQue: 'patron de la TechLibrary por modelo, sobre un SRX que este catalogo trae' },
      { url: 'https://www.juniper.net/documentation/us/en/hardware/srx1600/srx1600-hardware-guide/index.html',
        porQue: 'el mismo patron con el sufijo -hardware-guide, que es como se nombra el documento' },
      { url: 'https://www.juniper.net/documentation/us/en/hardware/srx1600/srx1600-hardware-guide/srx1600-hardware-guide.pdf',
        porQue: 'la version PDF de esa guia: un PDF es lo que el vigia sabe comparar por bytes' },
      { url: 'https://www.juniper.net/documentation/',
        porQue: 'la portada de la TechLibrary: responde 200, asi que el dominio no bloquea al ejecutor (grupo de control secundario)' },
    ],
    control: { url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/security-products-comparison-chart.pdf',
      porQue: 'ARCHIVO del mismo dominio que este repositorio ya trajo con exito (la matriz SRX)' },
  },
  {
    fabricante: 'juniper',
    bloqueada: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/',
    respalda: 'fwImix / ips / atp de la generacion 2024 (fichas por modelo)',
    candidatas: [
      { url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/srx1600-firewall-datasheet.pdf',
        porQue: 'patron de nombre de las fichas de esa misma carpeta, aplicado a un modelo del catalogo' },
      { url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/srx4300-firewall-datasheet.pdf',
        porQue: 'el mismo patron en un segundo modelo: una coincidencia puede ser suerte, dos no' },
    ],
    // El control es EL MISMO DIRECTORIO: si el archivo responde y la carpeta no, queda probado
    // que lo que falla es pedir el listado, no el acceso.
    control: { url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/security-products-comparison-chart.pdf',
      porQue: 'ARCHIVO DEL MISMO DIRECTORIO que la URL bloqueada, ya descargado por este repositorio' },
  },
  {
    fabricante: 'aruba',
    bloqueada: 'https://arubanetworking.hpe.com/techdocs/VSG/docs/070-sd-branch-design/',
    respalda: 'reglas de diseno SD-Branch (Validated Solution Guide)',
    candidatas: [
      { url: 'https://arubanetworking.hpe.com/techdocs/VSG/docs/070-sd-branch-design/Media/PDF/Aruba_VSG_SD-Branch-Design.pdf',
        porQue: 'EL MISMO DOCUMENTO, ya declarado en legacyData/aruba.js como DATASHEETS.sdBranchVsg — el repositorio tiene la URL concreta en otro sitio y `fuentes.js` vigila la carpeta' },
      { url: 'https://arubanetworking.hpe.com/techdocs/VSG/',
        porQue: 'el indice del VSG un nivel por encima' },
    ],
    control: { url: 'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/hardware/reference/EdgeConnect-Hardware-Reference_latest.pdf',
      porQue: 'ARCHIVO del mismo dominio que `npm run datasheets` ya descarga (Hardware Reference)' },
  },
];

// UNA LISTA QUE NO CASA CON NADA SE PUDRE EN SILENCIO. Es el modo de fallo de
// CISCO_EOL_MODELS, que vivio meses enumerando una serie que ya no estaba: un conjunto inerte
// se porta igual que uno que funciona. Si alguien arregla una de estas URL en `fuentes.js`,
// este script tiene que DECIRLO en vez de seguir midiendo una URL que ya nadie vigila.
function urlsVigentes() {
  const v = new Set();
  for (const arr of Object.values(FUENTES)) for (const f of arr) if (f.url) v.add(f.url);
  return v;
}

const arg = (n, d) => {
  const p = process.argv.find((a) => a.startsWith('--' + n + '='));
  return p ? p.slice(n.length + 3) : d;
};
const TIMEOUT = Math.max(1, parseInt(arg('timeout', '20'), 10)) * 1000;
const JSON_OUT = process.argv.includes('--json');

// Se pide con GET y no con HEAD: varios CDN responden 403 a HEAD y 200 a GET, asi que un HEAD
// mediria la configuracion del metodo en vez del acceso al documento.
async function pedir(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctrl.signal });
    const buf = Buffer.from(await r.arrayBuffer());
    return {
      url, estado: r.status, ok: r.ok,
      tipo: r.headers.get('content-type') || '',
      bytes: buf.length,
      // Que el cuerpo empiece por %PDF es la unica prueba de que lo servido es el documento y
      // no una pagina de error con codigo 200, que es como un chequeo se pone verde en falso.
      esPdf: buf.slice(0, 4).toString('latin1') === '%PDF',
      urlFinal: r.url !== url ? r.url : null,
    };
  } catch (e) {
    return { url, estado: null, ok: false, error: e.name === 'AbortError' ? 'tiempo agotado' : e.message };
  } finally { clearTimeout(t); }
}

const linea = (r) => r.estado == null
  ? `sin respuesta (${r.error})`
  : `${r.estado}${r.ok ? ' OK' : ''} · ${r.bytes} B · ${r.esPdf ? 'PDF real' : (r.tipo.split(';')[0] || 'sin tipo')}`
    + (r.urlFinal ? ` · redirige a ${r.urlFinal}` : '');

(async () => {
  const salida = [];
  for (const caso of CASOS) {
    const bloqueada = await pedir(caso.bloqueada);
    const control = await pedir(caso.control.url);
    const candidatas = [];
    for (const c of caso.candidatas) candidatas.push({ ...c, r: await pedir(c.url) });
    salida.push({ caso, bloqueada, control, candidatas });
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(salida.map((s) => ({
      fabricante: s.caso.fabricante, bloqueada: s.bloqueada, control: s.control,
      candidatas: s.candidatas.map((c) => ({ url: c.url, porQue: c.porQue, ...c.r })),
    })), null, 1));
    return;
  }

  console.log('PENDIENTE 38 — las tres fuentes que dan 403, con grupo de control\n');
  const vigentes = urlsVigentes();
  const huerfanas = CASOS.filter((c) => !vigentes.has(c.bloqueada));
  if (huerfanas.length) {
    console.log('AVISO: estas URL ya no estan en legacyData/fuentes.js, asi que este script las');
    console.log('mide sin que nadie las vigile — alguien las cambio y esta lista se quedo atras:');
    for (const c of huerfanas) console.log(`  · ${c.fabricante}: ${c.bloqueada}`);
    console.log('');
  }
  let resueltas = 0, formaDeUrl = 0;
  for (const s of salida) {
    console.log(`== ${s.caso.fabricante} · ${s.caso.respalda} ==`);
    console.log(`   bloqueada : ${s.caso.bloqueada}`);
    console.log(`               ${linea(s.bloqueada)}`);
    console.log(`   CONTROL   : ${s.caso.control.url}`);
    console.log(`               ${linea(s.control)}`);
    console.log(`               (${s.caso.control.porQue})`);
    // El veredicto sale de comparar las dos, no de mirar solo el codigo de la bloqueada.
    let veredicto;
    if (s.control.ok && !s.bloqueada.ok) {
      veredicto = 'ES LA FORMA DE LA URL: el dominio responde a un archivo y niega el listado. No es un bloqueo al ejecutor.';
      formaDeUrl++;
    } else if (!s.control.ok && !s.bloqueada.ok) {
      veredicto = 'ES EL FABRICANTE (o la red): tambien falla un archivo que ya se descargo antes.';
    } else if (s.bloqueada.ok) {
      veredicto = 'YA NO ESTA BLOQUEADA: responde. Revisar si el vigia puede volver a vigilarla.';
    } else {
      veredicto = 'sin conclusion: revisar los codigos de arriba.';
    }
    console.log(`   VEREDICTO : ${veredicto}`);
    console.log('   candidatas:');
    for (const c of s.candidatas) {
      const buena = c.r.ok && (c.r.esPdf || /html/i.test(c.r.tipo));
      if (buena) resueltas++;
      console.log(`     ${buena ? '[SIRVE]' : '[  no  ]'} ${c.url}`);
      console.log(`             ${linea(c.r)}`);
      console.log(`             ${c.porQue}`);
    }
    console.log('');
  }
  console.log(`Resumen: ${formaDeUrl} de ${salida.length} casos son forma de URL y no bloqueo; `
    + `${resueltas} candidata(s) sirven como sustituto.`);
  console.log('Ninguna URL se escribe desde aqui: sustituirla en legacyData/fuentes.js es un commit');
  console.log('que hace una persona despues de abrir el documento.');
})();
