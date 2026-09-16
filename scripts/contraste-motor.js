'use strict';
/* ARNES DE CONTRASTE ANTES/DESPUES — el motor, compartido por todos los casos.
 *
 * DE DONDE SALE. Nacio como `scripts/contraste-fortinet.js` para probar que el
 * Multi-Underlay Builder de FortiGate no cambiaba el dimensionamiento. Al llegar el segundo
 * caso (la auditoria de puertos de Nokia, pendiente 35) la alternativa era copiar el archivo
 * y cambiarle los escenarios — que es exactamente como `llevarABom` acabo en seis copias que
 * no hacian lo mismo, y como `presales-bom-refs` acabo con una clave por pagina.
 *
 * QUE ES LO UNICO QUE CAMBIA ENTRE CASOS: traducir un escenario a controles de SU pagina, y
 * leer de ella lo que se compara. Todo lo demas —entrar por el muro de acceso, conducir
 * Chromium, comparar contra la linea base, decir en que difiere y salir con codigo distinto
 * de cero— es identico, y por eso vive aqui.
 *
 * LA LINEA BASE VA EMBEBIDA EN CADA CASO, NO EN UN ARCHIVO DE DATOS. Es un hecho historico
 * medido sobre un commit concreto, no un dato que se regenere: un fichero regenerable se
 * regeneraria justo cuando el contraste fallara, que es cuando importa.
 *
 * NO GENERALIZA DE MAS, A PROPOSITO. `preparar()` recibe la pagina y el escenario y hace lo
 * que haga falta; el arnes no intenta adivinar campos comunes. Un traductor que aceptara
 * campos que una pagina no tiene acabaria rellenando controles inexistentes, que es el fallo
 * que el gancho `caudal(page)` de verificar-pantallas.js existe para evitar.
 *
 * Playwright va FUERA de package.json, como en scripts/generar-manual-usuario.js: es una
 * dependencia pesada para un script que se corre pocas veces.
 */
const RUTA_PW = process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright';
const EJECUTABLE = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function traerPlaywright() {
  try { return require(RUTA_PW); }
  catch {
    console.error(`No se encontro Playwright en ${RUTA_PW}.`);
    console.error('Instalalo con:  npm i -g playwright   (o exporta PLAYWRIGHT_PATH al modulo)');
    process.exit(2);
  }
}

const pausa = (p, ms) => p.waitForTimeout(ms);

async function entrar(page, base, usuario, clave) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#usuario', usuario);
  await page.fill('#password', clave);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.endsWith('/login'), { waitUntil: 'domcontentloaded' }),
    page.click('button[type=submit]'),
  ]);
}

// Compara solo las claves que la linea base DECLARA. Una linea base que no menciona un campo
// no esta diciendo «me da igual»: esta diciendo que no se midio, y comparar contra undefined
// convertiria el contraste en ruido que la gente aprende a ignorar.
function comparar(esperado, obtenido, claves) {
  const difs = [];
  for (const k of claves) {
    const a = esperado[k], b = obtenido[k];
    const iguales = Array.isArray(a) ? JSON.stringify(a) === JSON.stringify(b) : a === b;
    if (!iguales) difs.push({ campo: k, esperado: a, obtenido: b });
  }
  return difs;
}

const corto = (v) => (Array.isArray(v) ? `[${v.length}] ${v.slice(0, 4).join(', ')}${v.length > 4 ? '…' : ''}` : String(v));

/* Un caso declara:
 *   nombre     · para el encabezado del informe
 *   pagina     · ruta relativa de la pantalla que se conduce
 *   claves     · que campos se comparan, en orden de lectura
 *   baseLinea  · [{n, ...escenario, ...esperado}] medido sobre el commit anterior
 *   preparar   · async (page, escenario) => void — traduce el escenario a ESA pagina
 *   leer       · async (page) => obtenido
 *   extra      · opcional: async (page, ctx) => [{n, ok, detalle}] comprobaciones propias
 */
async function correr(caso, opciones) {
  const { chromium } = traerPlaywright();
  const base = (opciones.base || 'http://127.0.0.1:4000').replace(/\/$/, '');
  const usuario = opciones.usuario || process.env.AUTH_USER || 'presales';
  const clave = opciones.password || process.env.AUTH_PASSWORD;
  if (!clave) { console.error('Falta la contrasena. Pasa --password=... o define AUTH_PASSWORD.'); process.exit(2); }

  const b = await chromium.launch({ executablePath: EJECUTABLE });
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  await entrar(p, base, usuario, clave);

  console.log(`CONTRASTE · ${caso.nombre}`);
  console.log(`  pantalla : ${caso.pagina}`);
  console.log(`  escenarios: ${caso.baseLinea.length} · campos: ${caso.claves.join(', ')}\n`);

  let fallos = 0;
  for (const esc of caso.baseLinea) {
    await p.goto(`${base}/${caso.pagina}`, { waitUntil: 'domcontentloaded' });
    await pausa(p, caso.esperaInicial || 1300);
    await caso.preparar(p, esc, { pausa });
    await pausa(p, caso.esperaTrasPreparar || 900);
    const obtenido = await caso.leer(p);
    const difs = comparar(esc, obtenido, caso.claves);
    if (difs.length) fallos++;
    console.log(`${difs.length ? 'MAL ' : ' ok '} ${esc.n}`);
    for (const d of difs) {
      console.log(`      ${d.campo}: esperado ${corto(d.esperado)}`);
      console.log(`      ${' '.repeat(d.campo.length)}  obtenido ${corto(d.obtenido)}`);
    }
  }

  if (caso.extra) {
    console.log('');
    for (const r of await caso.extra(p, { base, pausa })) {
      if (!r.ok) fallos++;
      console.log(`${r.ok ? ' ok ' : 'MAL '} ${r.n}${r.detalle ? ' — ' + r.detalle : ''}`);
    }
  }

  await b.close();
  console.log(fallos
    ? `\n${fallos} discrepancia(s): el cambio SI altera lo que decide esta pantalla.`
    : '\nSin discrepancias: el cambio no altera lo que decide esta pantalla.');
  return fallos;
}

module.exports = { correr, pausa, comparar };
