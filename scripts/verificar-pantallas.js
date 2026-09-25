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
// catalogo: para eso estan las 266 pruebas, y una asercion sobre «3,1 Gbps» aqui se rompería
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

// Donde vive Playwright y donde vive Chromium: `ayuda/chromium.js`, compartido con
// contraste-motor.js y generar-manual-usuario.js (2026-09-16). Esta era una de las tres
// copias; se conserva EXACTAMENTE su orden de busqueda, que es el que funciona tanto aqui
// como en un ejecutor de Actions.
const { requerirPlaywright, opcionesDeLanzamiento } = require('./ayuda/chromium');

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

// Rellena un control y avisa a la pagina, comprobando ANTES que el control existe.
//
// POR QUE NO SE LLAMA DIRECTAMENTE A page.fill(). El 2026-09-13 el refactor del dimensionador
// Aruba sustituyo su campo `#bw` por el Multi-Underlay Builder, y este script —que rellenaba
// `#bw` en las ocho paginas— se cayo con «page.fill: Timeout 30000ms exceeded». Treinta
// segundos de espera para decir «ese campo ya no existe» hacen que un rojo se lea como
// lentitud del ejecutor, que es justo como se ignora. Un control ausente es un error
// inmediato y con nombre.
async function rellena(page, selector, valor) {
  const existe = await page.$(selector);
  if (!existe) throw new Error(`no existe el control declarado "${selector}" (la pagina cambio de forma)`);
  await page.fill(selector, valor);
  await page.dispatchEvent(selector, 'input');
}

// Las ocho paginas de dimensionamiento comparten el andamio: la ficha del equipo elegido y la
// pestaña de BOM. Lo que NO comparten es como se les declara el caudal, y por eso `caudal` es
// un gancho opcional: SEIS usan el campo unico `#bw` —el valor por defecto, asi que entran
// aqui con una linea, que es la propiedad que este array tiene y conviene conservar— y Aruba
// y Fortinet declaran el suyo, porque su caudal se compone de filas de enlaces WAN y no de un
// numero suelto (Aruba desde el refactor del 2026-09-13, Fortinet desde el del 2026-09-16).
// LA FILA NO ES LA MISMA EN LAS DOS PAGINAS, y por eso no hay un gancho compartido: la de
// Aruba es {tipo, medio, down, up} y la de Fortinet {tipo, down, overlay}. Un gancho comun
// tendria que rellenar campos que en una de las dos no existen, que es exactamente el fallo
// que este gancho existe para evitar.
// El caudal de SUBIDA solo es editable si el enlace NO es simetrico, y las filas nacen
// simetricas (dimensionador-aruba-edgeconnect.js: el input lleva `disabled` mientras
// `simetrico` este marcado). Desmarcarlo antes de rellenar es lo que hace que esta
// comprobacion siga ejercitando el campo en vez de esquivarlo.
async function asimetrico(page, n) {
  const sel = `#wanBuilderFilas .wan-fila >> nth=${n} >> [data-campo=simetrico]`;
  const casilla = await page.$(sel);
  if (!casilla) throw new Error(`no existe la casilla «simetrico» de la fila ${n + 1} (la pagina cambio de forma)`);
  if (await casilla.isChecked()) {
    await casilla.uncheck();
    await espera(page, 200);
  }
}

const caudalPorDefecto = (page) => rellena(page, '#bw', '2500');

const dimensionadores = [
  ['huawei', 'dimensionador-huawei-netengine.html', 'Huawei NetEngine / AR'],
  ['cisco', 'dimensionador-cisco-catalyst8k.html', 'Cisco Catalyst 8000'],
  ['fortinet', 'dimensionador-fortinet-fortigate.html', 'Fortinet FortiGate', {
    // Multi-Underlay Builder de Fortinet (2026-09-16): `#bw` sigue existiendo pero es un
    // espejo OCULTO que el builder calcula, asi que rellenarlo a mano no dimensiona nada.
    // El caudal se declara en la fila: {tipo, down, overlay}.
    caudal: (page) => rellena(page, '#wanBuilderFilas [data-campo=down] >> nth=0', '2500'),
    // La fraccion del overlay era un deslizador estimado y ahora sale de las casillas de las
    // filas. Se conduce el caso que justifica el builder: un segundo enlace de breakout
    // local baja la fraccion cifrada, que es el segundo techo del motor IPsec.
    async extraAcciones(page) {
      await page.click('[data-tab="calc"]');
      await espera(page, 300);
      // Con rol SD-WAN la casilla de overlay deja de estar deshabilitada: sin rol no
      // significa nada y la pagina lo dice en vez de dejarla activa sin efecto.
      await page.click('#rolSeg button[data-v="spoke"]');
      await espera(page, 300);
      const filas = () => page.$$eval('#wanBuilderFilas [data-campo=down]', (es) => es.length);
      const antes = await filas();
      await page.click('#btnAddWan');
      await espera(page, 300);
      if (await filas() !== antes + 1) throw new Error('«+ Anadir enlace» no anadio una fila WAN');
      await rellena(page, '#wanBuilderFilas [data-campo=down] >> nth=1', '1500');
      await espera(page, 400);
      // La barra agregada tiene que declarar la fraccion cifrada; sin ella el builder seria
      // un formulario mas largo que no dice lo que calcula.
      await this.exigeConTexto(page, '#wanResumen', 'con dos enlaces WAN');
      const txt = await page.$eval('#wanResumen', (e) => e.textContent);
      if (!/overlay/i.test(txt)) throw new Error('la barra del builder no declara la fraccion por el overlay');

      // ── REDISENO DEL 2026-09-22 (informe de validacion tecnica) ──────────────────────
      // Se conducen las tres piezas que ANTES NO EXISTIAN y que cambian lo que se entrega:
      // el banner de estado de datos, el panel de utilizacion por eje y la puerta de
      // exportacion. No se afirma ninguna CIFRA del catalogo -eso se rompe en cada cambio de
      // catalogo y ensena a ignorar un rojo-: se afirma que la pieza esta viva y que DICE
      // algo, que es justo lo que un `curl` no ve.
      await this.exigeConTexto(page, '#dataBanner', 'tras dimensionar');
      await this.exigeConTexto(page, '#ejesPanel', 'tras dimensionar');
      const ejes = await page.$eval('#ejesPanel', (e) => e.textContent);
      if (!/Cuello de botella/i.test(ejes)) throw new Error('el panel de ejes no declara el cuello de botella');

      // LA INSPECCION SSL PASA A SER UN EJE CON CIFRA OFICIAL, y tiene DOS ramas que se
      // conducen las dos porque fallan distinto:
      //
      //   (a) a 4 Gbps ningun modelo del catalogo trae cifra de SSL suficiente -la mayor es
      //       la del 90G, 2,6 Gbps-, asi que no hay candidato. Lo que NO puede pasar es que
      //       la pantalla diga «ningun modelo cumple» a secas: eso se lee como «hace falta
      //       mas equipo» cuando lo que falta es el DATO. Tiene que nombrar el motivo.
      //   (b) a 1 Gbps si hay candidatos con cifra oficial, y ahi el eje tiene que aparecer
      //       en el panel de utilizacion con su porcentaje.
      //
      // Conducir solo (b) dejaria sin cubrir justo el caso en el que la pantalla puede
      // mentir por omision.
      await page.check('#chkSsl');
      await espera(page, 700);
      const sinCandidato = await page.$eval('#verdict', (e) => e.textContent);
      if (!/inspecci[oó]n SSL/i.test(sinCandidato)) {
        throw new Error('sin candidato por falta de cifra de SSL, el veredicto no nombra ese motivo');
      }
      await rellena(page, '#wanBuilderFilas [data-campo=down] >> nth=1', '0');
      await rellena(page, '#wanBuilderFilas [data-campo=down] >> nth=0', '800');
      await espera(page, 700);
      const conSsl = await page.$eval('#ejesPanel', (e) => e.textContent);
      if (!/SSL/i.test(conSsl)) throw new Error('con inspeccion SSL marcada, el panel de ejes no muestra ese eje');
      await page.uncheck('#chkSsl');
      await espera(page, 400);

      // AT-03: un bundle por debajo del minimo BLOQUEA la exportacion, no solo avisa.
      await page.check('#chkIotDlp');
      await page.selectOption('#licBundle', 'utp');
      await espera(page, 700);
      const bloqueado = await page.$eval('#xlsBtn', (e) => e.disabled);
      if (!bloqueado) throw new Error('un bundle insuficiente tendria que deshabilitar la exportacion a Excel');
      await this.exigeConTexto(page, '#exportGate', 'con un bundle insuficiente');
      await page.selectOption('#licBundle', 'ent');
      await page.uncheck('#chkIotDlp');
      await espera(page, 700);
      if (await page.$eval('#xlsBtn', (e) => e.disabled)) {
        throw new Error('con Enterprise Protection la exportacion tendria que volver a habilitarse');
      }
    },
  }],
  ['mikrotik', 'dimensionador-mikrotik-routeros.html', 'MikroTik RouterOS'],
  ['aruba', 'dimensionador-aruba-edgeconnect.html', 'Aruba EdgeConnect', {
    // Multi-Underlay Builder: el caudal son filas `{tipo, medio, down, up}` dentro de
    // `#wanBuilderFilas`. El listener delegado de `#wanBuilder` reserializa el estado v2 y
    // repinta, asi que basta con avisar del `input` en la primera fila.
    async caudal(page) {
      await rellena(page, '#wanBuilderFilas [data-campo=down] >> nth=0', '2500');
      await asimetrico(page, 0);
      await rellena(page, '#wanBuilderFilas [data-campo=up] >> nth=0', '2500');
    },
    // LO QUE EL REFACTOR DEL 2026-09-13 TRAJO Y NADIE COMPROBABA. Su verificacion de extremo
    // a extremo vivia en un `/tmp/e2e-refactor.js` que no se commiteo, asi que se perdio con
    // la sesion que lo escribio: 1.702 lineas nuevas sin una sola comprobacion repetible. Va
    // aqui —y no en un archivo aparte— porque este script es lo que corre en cada push.
    // Ninguna asercion mira una cifra del catalogo, por el motivo de la cabecera.
    async extraAcciones(page) {
      await page.click('[data-tab="calc"]');
      await espera(page, 300);

      // Multi-Underlay: un sitio con dos accesos es el caso que justifica el builder entero.
      const filas = () => page.$$eval('#wanBuilderFilas [data-campo=down]', (es) => es.length);
      const antes = await filas();
      await page.click('#btnAddWan');
      await espera(page, 300);
      if (await filas() !== antes + 1) throw new Error('«+ Anadir enlace» no anadio una fila WAN');
      await rellena(page, '#wanBuilderFilas [data-campo=down] >> nth=1', '500');
      await espera(page, 500);
      await this.exigeConTexto(page, '#verdict', 'con dos enlaces WAN');

      // Banner Microbranch: aparece bajo sus umbrales (≤10 usuarios, ≤50 Mbps, sin MPLS) y se
      // retira al salirse de ellos. Un aviso que no sabe apagarse es ruido, no un aviso.
      const visible = () => page.$eval('#bannerMicrobranch', (el) => el.offsetParent !== null).catch(() => false);
      if (await visible()) throw new Error('el banner Microbranch ya estaba visible a 2,5 Gbps');
      await page.click('[data-wan-quitar]');
      await espera(page, 200);
      await rellena(page, '#wanBuilderFilas [data-campo=down] >> nth=0', '20');
      await asimetrico(page, 0);
      await rellena(page, '#wanBuilderFilas [data-campo=up] >> nth=0', '20');
      await rellena(page, '#users', '5');
      await espera(page, 600);
      if (!await visible()) throw new Error('el banner Microbranch no aparecio bajo sus umbrales (5 usuarios, 20 Mbps, sin MPLS)');
    },
  }],
  ['juniper', 'dimensionador-juniper-srx.html', 'Juniper SRX / SSR'],
  ['nokia-sr', 'dimensionador-nokia-7750sr.html', 'Nokia 7750 SR / 7250 IXR'],
].map(([id, url, titulo, extra]) => ({
  id: `dim-${id}`,
  url,
  titulo: `Dimensionador ${titulo}`,
  listo: '#verdict-sel, #verdict',
  caudal: caudalPorDefecto,
  ...extra,
  async acciones(page) {
    // Mover el caudal y comprobar que la ficha se repinta. El «sin candidato» tambien es un
    // resultado valido: lo que no puede pasar es que la pagina se quede como estaba.
    const antes = await page.$eval('#verdict', (el) => el.textContent.trim()).catch(() => '');
    await this.caudal(page);
    await espera(page, 600);
    const despues = await page.$eval('#verdict', (el) => el.textContent.trim()).catch(() => '');
    if (antes && antes === despues) {
      throw new Error('la ficha no se repinto al mover el caudal (se quedo como estaba)');
    }
    // La pestaña de BOM es donde vivio el fallo de sincronizacion de septiembre.
    await page.click('[data-tab="bom"]');
    await espera(page, 400);
    await this.exigeConTexto(page, '#pane-bom');
    if (this.extraAcciones) await this.extraAcciones(page);
  },
}));

const PANTALLAS = [
  {
    id: 'portal',
    url: '',
    titulo: 'Portal — las once secciones',
    listo: '.nav-btn[data-page="dashboard"]',
    async acciones(page) {
      // Los siete fabricantes ya no tienen seccion propia dentro del portal: su boton navega
      // directo a su dimensionador, que paso a ser su pagina principal (2026-09-09 para
      // Fortinet, replicado a los otros seis 2026-09-10). El mapa fabricante -> dimensionador
      // se lee en vivo de window.NAVFAB.FABRICANTES (navegacion.js, cargado tambien en el
      // portal) en vez de mantener aqui una segunda copia que se desincroniza con
      // public/js/index.js — la misma duplicacion que ya se detecto con el piloto de Fortinet.
      const navegaDirecto = Object.fromEntries(
        // eslint-disable-next-line no-undef -- corre dentro de la pagina, no en Node
        await page.evaluate(() => (window.NAVFAB ? window.NAVFAB.FABRICANTES : []).map((f) => [f.id, f.dim])),
      );
      const secciones = await page.$$eval('.nav-btn[data-ir]', (bs) => bs.map((b) => b.dataset.ir));
      for (const s of secciones) {
        if (navegaDirecto[s]) {
          // Espera de verdad a que la URL cambie, en vez de un timeout fijo: con siete
          // fabricantes navegando en la misma prueba (antes solo era uno), un runner de CI
          // cargado puede tardar mas de 250ms en completar la navegacion.
          try {
            // `waitUntil: 'commit'` a proposito. Lo que se afirma aqui es que el boton NAVEGA,
            // no que la pagina de destino termine de cargar cada subrecurso — y el evento
            // `load` por defecto espera tambien a la hoja de Google Fonts. Medido el
            // 2026-09-13 desde este entorno: las navegaciones alternaban 90 ms y 12.100 ms,
            // esos 12 segundos son el mismo bloqueo de tipografias que `js/fuentes.js`
            // documenta, y hacian fallar el paso aqui mientras pasaba en Actions. Un rojo que
            // depende de la latencia de un CDN de terceros es un rojo que se acaba ignorando,
            // y CLAUDE.md ya advierte que esta herramienta se abre desde redes corporativas
            // donde un proxy puede bloquear dominios de Google.
            await Promise.all([
              page.waitForURL((u) => u.pathname.endsWith(navegaDirecto[s]), { timeout: 10000, waitUntil: 'commit' }),
              page.click(`.nav-btn[data-ir="${s}"]`),
            ]);
            // Y despues se espera a `domcontentloaded` —que las hojas `media="print"` de
            // `js/fuentes.js` ya no bloquean— antes de volver al portal. Sin esto, el `goto`
            // de vuelta cancela los `<script>` que el destino aun estaba pidiendo y esos
            // ERR_ABORTED se cuentan como peticiones fallidas al propio origen, que es
            // justamente la firma del fallo historico que este script existe para cazar.
            await page.waitForLoadState('domcontentloaded');
          } catch {
            throw new Error(`la seccion "${s}" no navego a ${navegaDirecto[s]}`);
          }
          // La vuelta al portal cancela los `fetch` que el dimensionador acaba de lanzar. Es
          // este script quien aborta, no la aplicacion: se declara mientras dura.
          this.abandonando(true);
          await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
          await espera(page, 250);
          this.abandonando(false);
          continue;
        }
        await page.click(`.nav-btn[data-ir="${s}"]`);
        await espera(page, 250);
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
    titulo: 'Calculadora de throughput — las seis capas',
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
    // UN ENLACE COMPARTIDO ANTES DEL REFACTOR TIENE QUE SEGUIR LLEVANDO AL MISMO ESCENARIO.
    // El dimensionador Aruba serializaba el escenario como `?bw=…&unit=…&mplsType=…` hasta el
    // 2026-09-13; desde el Multi-Underlay Builder lo hace como `wanLinksData` v2, y
    // `migrarEstadoV1()` convierte lo viejo en filas. Esos enlaces estan pegados en chats y
    // correos, y este es el modo de fallo que CLAUDE.md nombra para las paginas renombradas:
    // llegar a la pagina correcta con los valores por defecto es PEOR que un 404, porque no
    // se nota — el receptor ve otra recomendacion y no tiene forma de saberlo.
    id: 'dim-aruba-enlace-v1',
    url: 'dimensionador-aruba-edgeconnect.html?mplsType=l3&bwMpls=200&inetType=bb&bwInet=500',
    titulo: 'Dimensionador Aruba — enlace compartido v1 migrado',
    listo: '#wanBuilderFilas [data-campo=down]',
    async acciones(page) {
      await espera(page, 600);
      const filas = await page.$$eval('#wanBuilderFilas [data-campo=down]', (es) => es.map((e) => ({
        tipo: e.closest('.wan-fila').querySelector('[data-campo=tipo]').value,
        down: e.value,
      })));
      // Dos enlaces declarados en el enlace viejo = dos filas, con su tipo y su caudal. Que
      // haya «alguna» fila no bastaria: una sola fila vacia es exactamente lo que se veria si
      // la migracion fallara en silencio.
      const esperado = [{ tipo: 'MPLS L3', down: '200' }, { tipo: 'Banda Ancha', down: '500' }];
      if (JSON.stringify(filas) !== JSON.stringify(esperado)) {
        throw new Error(`el enlace v1 no migro al builder: se esperaba ${JSON.stringify(esperado)} y hay ${JSON.stringify(filas)}`);
      }
      await this.exigeConTexto(page, '#verdict', 'tras migrar el enlace v1');
      // Y NO puede avisar de que esos parametros se perdieron, porque no se perdieron: esta
      // pagina los migra. `estado.js` avisa desde el 2026-09-13 cuando un enlace trae algo
      // que la pantalla ya no entiende, y un aviso que salta cuando SI se entendio es peor
      // que no tenerlo — enseña a ignorarlo, que es como se ignoraria el caso real.
      const falso = await page.$('.estado-ignorados');
      if (falso) {
        const txt = await falso.textContent();
        throw new Error(`aviso falso de parametros perdidos en un enlace que SI se migra: ${txt.trim().slice(0, 120)}`);
      }
    },
  },
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
    id: 'dim-starlink',
    url: 'dimensionador-starlink-leo.html',
    titulo: 'Dimensionador Starlink LEO',
    // Modulo canonico integrado sin cambios (prompt maestro del 2026-09-24): estado y
    // recalculo propios, sin ficha.js ni el patron de pestanas de los demas dimensionadores.
    listo: '#resultados',
    async acciones(page) {
      const antes = await page.$eval('#resultPlanName', (el) => el.textContent.trim()).catch(() => '');
      await page.fill('#users', '400');
      await page.dispatchEvent('#users', 'input');
      await espera(page, 500);
      const despues = await page.$eval('#resultPlanName', (el) => el.textContent.trim()).catch(() => '');
      if (antes && antes === despues) {
        throw new Error('el resultado no se repinto al mover usuarios (se quedo como estaba)');
      }
      await this.exigeConTexto(page, '#bomBody');
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

  const navegador = await chromium.launch(opcionesDeLanzamiento());
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
  // ABANDONANDO LA PAGINA A PROPOSITO. El paso del portal navega a los siete dimensionadores y
  // vuelve, y ese `goto` de vuelta cancela los `fetch` que el destino acababa de lanzar
  // (`/api/dimensionador/…`, `/api/fuentes`): ERR_ABORTED que no dice nada de la aplicacion,
  // porque el que aborta es este script. Se descuentan SOLO mientras la bandera esta puesta;
  // fuera de ella un ERR_ABORTED sigue contando, porque un `<script>` que se cancela solo si
  // es un fallo. No se ignora el error por su nombre, se ignora por el momento en que ocurre.
  let abandonando = false;
  page.on('pageerror', (e) => problemas.push(`excepcion: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (!propio((m.location() || {}).url)) return;
    problemas.push(`consola: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    const motivo = (r.failure() || {}).errorText || '';
    if (abandonando && motivo.includes('ERR_ABORTED')) return;
    if (propio(r.url())) problemas.push(`peticion fallida: ${r.url()} (${motivo})`);
  });
  // El paso del portal la usa para envolver su ida y vuelta a cada dimensionador.
  for (const p of PANTALLAS) p.abandonando = (v) => { abandonando = v; };

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
