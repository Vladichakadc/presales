#!/usr/bin/env node
'use strict';
// Conduce TODAS las pantallas de la aplicacion en un navegador de verdad, detras del muro de
// acceso, y falla si alguna se rompe. Captura una imagen de cada una para que una persona
// pueda hojearlas.
//
// POR QUE EXISTE. `npm run verificar` prueba la logica y `verificar.yml` comprueba que el
// servidor arranca y responde /salud, pero ninguno de los dos abre una pagina. Y CLAUDE.md
// lleva escrito, con nombres y fechas, que TODAS las regresiones reales de este repositorio
// fueron invisibles a `curl`: una pagina cuyo propio script quedo detras del muro de auth (el
// navegador recibia HTML donde esperaba JavaScript), un `onclick` viejo sobreviviendo dentro
// de una plantilla de JS (que la CSP bloquea solo en el navegador), un gateway filtrado por
// su capacidad de hardware. Las tres arrancan el servidor sin un solo error en el log.
//
// POR QUE CORRE EN EL EJECUTOR Y NO CONTRA UN SITIO DESPLEGADO. `DATABASE_PATH` va sin
// definir en produccion, asi que la base es efimera y se resiembra desde
// `server/seed/legacyData/` en CADA despliegue: lo que pinta una pantalla es funcion del
// commit, no del entorno. Un arranque de este mismo commit en el ejecutor de Actions —que
// `verificar.yml` ya hace— renderiza exactamente los mismos datos que produccion. Montar un
// segundo entorno publico para mirarlo habria anadido una segunda copia del catalogo de
// PRECIOS tras una contrasena guardada en los secretos del repositorio, para no ver nada que
// no se vea aqui. Lo que este script NO cubre —que el dominio publico este vivo: DNS, TLS, el
// edge de Railway— lo cubre `sonda-produccion.yml`, y son las dos mitades del pendiente 4.
//
// QUE CUENTA COMO FALLO. Errores de consola, excepciones de pagina, peticiones fallidas al
// propio origen (un `<script>` que devuelve 404 o HTML) y contenedores que se quedan vacios
// —el sintoma de un `fetch` que fallo en silencio—. NO se comprueba ninguna cifra del
// catalogo: para eso estan las 181 pruebas, y una asercion sobre «3,1 Gbps» aqui se rompería
// cada vez que el catalogo cambie, que es como se enseña a la gente a ignorar un rojo.
//
// COMO SE USA
//     npm run pantallas                                   # contra 127.0.0.1:4000
//     npm run pantallas -- --base=http://127.0.0.1:4055   # contra otro puerto
//     npm run pantallas -- --usuario=ana --password=xxx --salida=/tmp/capturas
//
// REQUIERE PLAYWRIGHT, A PROPOSITO FUERA DE package.json — misma decision que
// `scripts/generar-manual-usuario.js`: un Chromium descargado pesa cientos de MB y no tiene
// por que bajarse en cada `npm install`. El workflow lo instala con `--no-save` en su job.

const fs = require('fs');
const path = require('path');

const RUTAS_PLAYWRIGHT = ['playwright', '/opt/node22/lib/node_modules/playwright'];
const RUTAS_CHROMIUM = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
];

function requerirPlaywright() {
  for (const ruta of RUTAS_PLAYWRIGHT) {
    try { return require(ruta); } catch { /* probar la siguiente */ }
  }
  console.error('No se encontro el paquete "playwright". Instalalo sin guardarlo en '
    + 'package.json y trae un Chromium:\n\n'
    + '    npm install --no-save playwright\n'
    + '    npx playwright install --with-deps chromium\n');
  process.exit(1);
}

const arg = (n, def) => {
  const p = process.argv.find((a) => a.startsWith(`--${n}=`));
  return p ? p.slice(n.length + 3) : def;
};

const BASE = arg('base', 'http://127.0.0.1:4000').replace(/\/$/, '');
const USUARIO = arg('usuario', process.env.AUTH_USER || 'verificacion');
const PASSWORD = arg('password', process.env.AUTH_PASSWORD || '');
const SALIDA = arg('salida', path.join(__dirname, '..', '.capturas'));

/* ── Que se conduce en cada pantalla ──────────────────────────────────────────
   `listo` es lo que prueba que la pagina termino de montarse con datos; sin el, una captura
   de una pagina a medio pintar pasaria por buena. `acciones` es lo que la usa de verdad:
   abrir una pagina demuestra mucho menos que conducirla, que es literalmente la regla que
   CLAUDE.md fija para cada entrega. */
const espera = (page, ms) => page.waitForTimeout(ms);

// Las ocho paginas de dimensionamiento comparten el andamio: un parametro de entrada, la
// ficha del equipo elegido y la pestaña de BOM. Se conducen igual y por eso se declaran una
// sola vez: si alguien anade un dimensionador nuevo, entra aqui con una linea.
const dimensionadores = [
  ['huawei', 'dimensionador-huawei-netengine.html', 'Huawei NetEngine / AR'],
  ['cisco', 'dimensionador-cisco-catalyst8k.html', 'Cisco Catalyst 8000'],
  ['fortinet', 'dimensionador-fortinet-fortigate.html', 'Fortinet FortiGate'],
  ['mikrotik', 'dimensionador-mikrotik-routeros.html', 'MikroTik RouterOS'],
  ['aruba', 'dimensionador-aruba-edgeconnect.html', 'Aruba EdgeConnect'],
  ['juniper', 'dimensionador-juniper-srx.html', 'Juniper SRX / SSR'],
  ['nokia-sr', 'dimensionador-nokia-7750sr.html', 'Nokia 7750 SR / 7250 IXR'],
].map(([id, url, titulo]) => ({
  id: `dim-${id}`,
  url,
  titulo: `Dimensionador ${titulo}`,
  listo: '#verdict-sel, #verdict',
  async acciones(page) {
    // Mover el caudal y comprobar que la ficha se repinta. El «sin candidato» tambien es un
    // resultado valido: lo que no puede pasar es que la pagina se quede como estaba.
    await page.fill('#bw', '2500');
    await page.dispatchEvent('#bw', 'input');
    await espera(page, 500);
    // La pestaña de BOM es donde vivio el fallo de sincronizacion de septiembre.
    await page.click('[data-tab="bom"]');
    await espera(page, 400);
    await this.exigeConTexto(page, '#pane-bom');
  },
}));

const PANTALLAS = [
  {
    id: 'portal',
    url: '',
    titulo: 'Portal — las once secciones',
    listo: '.nav-btn[data-page="dashboard"]',
    async acciones(page) {
      // Fortinet ya no tiene seccion propia dentro del portal: su boton navega directo al
      // dimensionador, que paso a ser su pagina principal (mismo mapa `directo` que
      // public/js/index.js). Se comprueba la navegacion en vez de una clase .active, y se
      // vuelve al portal para seguir con el resto de secciones.
      const navegaDirecto = { fortinet: 'dimensionador-fortinet-fortigate.html' };
      const secciones = await page.$$eval('.nav-btn[data-page]', (bs) => bs.map((b) => b.dataset.page));
      for (const s of secciones) {
        await page.click(`.nav-btn[data-page="${s}"]`);
        await espera(page, 250);
        if (navegaDirecto[s]) {
          if (!page.url().endsWith(navegaDirecto[s])) {
            throw new Error(`la seccion "${s}" no navego a ${navegaDirecto[s]}`);
          }
          await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
          await espera(page, 250);
          continue;
        }
        // Una seccion que no se activa deja al usuario mirando la anterior sin saberlo.
        const activa = await page.$eval(`#page-${s}`, (el) => el.classList.contains('active')).catch(() => false);
        if (!activa) throw new Error(`la seccion "${s}" no se activo al pulsar su boton`);
      }
    },
  },
  {
    id: 'comparador',
    url: '',
    titulo: 'Comparador de equipos',
    listo: '#cmp1',
    async acciones(page) {
      await page.click('.nav-btn[data-page="comparador"]');
      await espera(page, 300);
      await page.selectOption('#cmp1', { index: 1 });
      await page.selectOption('#cmp2', { index: 2 });
      await page.click('#btnComparar');
      await espera(page, 500);
      await this.exigeConTexto(page, '#compareOut');
      // El interruptor repinta sin volver a pulsar el boton; si dejara de hacerlo, la tabla
      // mostraria una comparacion que ya no corresponde a lo seleccionado.
      await page.check('#cmpSoloDif');
      await espera(page, 400);
      await this.exigeConTexto(page, '#compareOut');
    },
  },
  {
    id: 'calculadora',
    url: '',
    titulo: 'Calculadora de throughput — las cinco capas',
    listo: '#calcProfile',
    async acciones(page) {
      await page.click('.nav-btn[data-page="calculadora"]');
      await espera(page, 300);
      await page.click('#btnCalcular');
      await espera(page, 500);
      await this.exigeConTexto(page, '#calcOut');
      const perfiles = await page.$$eval('#calcProfile option', (os) => os.map((o) => o.value));
      for (const p of perfiles) {
        await page.selectOption('#calcProfile', p);
        await espera(page, 400);
        // Cada perfil tiene que producir pantalla: candidatos, o el motivo de que no los haya.
        await this.exigeConTexto(page, '#calcOut', `perfil ${p}`);
      }
    },
  },
  ...dimensionadores,
  {
    id: 'dim-nokia-fabric',
    url: 'dimensionador-nokia-7220ixr.html',
    titulo: 'Dimensionador Nokia 7220 IXR (fabric)',
    // La unica pagina que no elige un equipo: disena un fabric, asi que no tiene #verdict-sel.
    listo: '#servers',
    async acciones(page) {
      await page.fill('#servers', '480');
      await page.dispatchEvent('#servers', 'input');
      await espera(page, 500);
      await page.click('[data-tab="bom"]');
      await espera(page, 400);
      await this.exigeConTexto(page, '#pane-bom');
    },
  },
  {
    id: 'cotizador',
    url: 'cotizador.html',
    titulo: 'Cotizador BOM',
    listo: '#catalogList',
    async acciones(page) {
      await this.exigeConTexto(page, '#catalogList');
      await this.exigeConTexto(page, '#filterRow');
      // Anadir una linea: el resumen tiene que dejar de estar vacio.
      const primero = await page.$('#catalogList [data-add], #catalogList button, #catalogList .cat-item');
      if (primero) { await primero.click(); await espera(page, 400); }
      await page.fill('#searchBox', 'FortiGate');
      await espera(page, 400);
      await this.exigeConTexto(page, '#catalogList', 'busqueda');
    },
  },
  {
    id: 'guia',
    url: 'guia-diseno-interactiva.html',
    titulo: 'Guia de diseno interactiva',
    listo: 'body',
    async acciones(page) { await espera(page, 600); },
  },
  {
    id: 'cuenta',
    url: 'cuenta.html',
    titulo: 'Mi cuenta',
    listo: 'body',
    async acciones(page) { await espera(page, 500); },
  },
  {
    id: 'usuarios',
    url: 'usuarios.html',
    titulo: 'Panel de usuarios',
    listo: 'body',
    async acciones(page) { await espera(page, 500); },
  },
];

// Un contenedor vacio es el sintoma de un `fetch` que fallo sin ruido: la pagina carga, no
// hay error de consola, y no hay nada. Es el modo de fallo mas silencioso que tiene esta
// aplicacion, porque cada pantalla se pinta desde una sola llamada a la API.
async function exigeConTexto(page, selector, nota) {
  const largo = await page.$eval(selector, (el) => el.textContent.trim().length).catch(() => -1);
  if (largo < 0) throw new Error(`no existe ${selector}${nota ? ` (${nota})` : ''}`);
  if (largo < 20) throw new Error(`${selector} se quedo vacio${nota ? ` (${nota})` : ''}`);
}
for (const p of PANTALLAS) p.exigeConTexto = exigeConTexto;

async function main() {
  if (!PASSWORD) {
    console.error('Falta la contrasena. Pasa --password=... o define AUTH_PASSWORD.');
    process.exit(1);
  }
  const { chromium } = requerirPlaywright();
  fs.mkdirSync(SALIDA, { recursive: true });

  const ejecutable = RUTAS_CHROMIUM.find((r) => fs.existsSync(r));
  const navegador = await chromium.launch(ejecutable ? { executablePath: ejecutable } : {});
  const contexto = await navegador.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await contexto.newPage();

  let problemas = [];
  const origen = new URL(BASE).origin;
  // SOLO EL PROPIO ORIGEN. Las hojas de Google Fonts se cargan sin bloquear a proposito
  // (js/fuentes.js) y desde este entorno de edicion ni siquiera resuelven: el Chromium de
  // aqui no confia en el certificado del proxy de salida, asi que cada pagina emite un
  // ERR_CONNECTION_RESET que no dice nada de la aplicacion. Un verificador que se pone rojo
  // por un CDN de terceros se acaba ignorando, y entonces deja de servir para lo que existe.
  const propio = (url) => !url || url.startsWith(origen);
  page.on('pageerror', (e) => problemas.push(`excepcion: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (!propio((m.location() || {}).url)) return;
    problemas.push(`consola: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    if (propio(r.url())) problemas.push(`peticion fallida: ${r.url()} (${(r.failure() || {}).errorText})`);
  });

  console.log(`Conduciendo ${PANTALLAS.length} pantallas en ${BASE}\n`);

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#usuario', USUARIO);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  if (/\/login/.test(page.url())) {
    console.error(`El login no paso con el usuario "${USUARIO}". Revisa AUTH_USER / AUTH_PASSWORD.`);
    process.exit(1);
  }
  problemas = []; // el login ya se comprobo; lo que se mide es lo de detras del muro

  const informe = [];
  for (const p of PANTALLAS) {
    problemas = [];
    const t0 = Date.now();
    let error = null;
    try {
      await page.goto(`${BASE}/${p.url}`, { waitUntil: 'domcontentloaded' });
      // `attached` y no `visible`: el portal es una SPA por clases CSS y los controles del
      // comparador y de la calculadora existen en el DOM pero viven dentro de una `.page` que
      // no esta activa hasta que se pulsa su boton. Exigir visibilidad ahi es esperar por algo
      // que solo pasa DESPUES de la primera accion.
      await page.waitForSelector(p.listo, { state: 'attached', timeout: 20000 });
      await espera(page, 600); // el fetch inicial de la pagina
      await p.acciones(page);
    } catch (e) {
      error = e.message;
    }
    const captura = path.join(SALIDA, `${p.id}.png`);
    await page.screenshot({ path: captura, fullPage: true }).catch(() => {});
    const fila = { pantalla: p.titulo, ms: Date.now() - t0, error, problemas: problemas.slice() };
    informe.push(fila);
    const mal = error || problemas.length;
    console.log(`${mal ? 'MAL ' : ' ok '} ${p.titulo}${error ? ` — ${error}` : ''}`);
    for (const x of problemas) console.log(`      ${x}`);
  }

  await navegador.close();

  fs.writeFileSync(path.join(SALIDA, 'informe.json'), JSON.stringify(informe, null, 2));
  const fallidas = informe.filter((f) => f.error || f.problemas.length);
  console.log(`\n${informe.length - fallidas.length}/${informe.length} pantallas sin novedad. `
    + `Capturas en ${SALIDA}`);
  if (fallidas.length) {
    console.error(`\n${fallidas.length} pantalla(s) con problemas.`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
