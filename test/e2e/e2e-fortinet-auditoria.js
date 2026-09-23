'use strict';
/* ══ E2E DEL REDISEÑO FORTINET (informe de validación técnica, 22-sep-2026) ══════════════
   `test/fortinet-reglas.test.js` ya afirma las veinte pruebas de aceptación contra el módulo
   puro. Esto prueba lo OTRO, que es lo que ese test no puede ver: que la PANTALLA conduce
   esas reglas. La distinción no es académica en este repositorio — el permiso `sync` vivió
   meses declarado en `ROLES` sin que ninguna ruta lo exigiera, y `CISCO_EOL_MODELS` sobrevivió
   inerte porque nadie comprobó que marcara algo. Una regla que existe y no se aplica se porta
   igual que una que no existe.

   QUÉ SE AFIRMA AQUÍ Y QUÉ NO. Se afirman DECISIONES y ESTADOS (qué equipo sale, qué eje
   manda, si el botón de exportar está habilitado, qué SKU lleva la línea), no cifras sueltas
   del catálogo: una aserción sobre «3,1 Gbps» se rompe en el próximo cambio de catálogo y eso
   es como se enseña a ignorar un rojo. Las dos cifras que sí se fijan —los 310 Mbps de SSL del
   40F y los 390 del escenario— son EL hallazgo: sin ellas la prueba no distingue el motor
   nuevo del que aplicaba un derate. */
/* global document */
/*   ↑ los callbacks de page.evaluate corren EN el navegador, no en Node; eslint los analiza
     como si fueran de este fichero. Mismo comentario que en e2e-sticky.js. */
const { cargarPlaywright, abrirSesion, contador } = require('./ayuda');

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const PAGINA = `${BASE}/dimensionador-fortinet-fortigate.html`;

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());
  const t = contador();

  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await abrirSesion(page);
  await page.goto(PAGINA, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#wanBuilderFilas [data-campo=down]', { timeout: 20000 });
  await page.waitForTimeout(1200);

  const caudal = async (mbps) => {
    await page.fill('#wanBuilderFilas [data-campo=down] >> nth=0', String(mbps));
    await page.dispatchEvent('#wanBuilderFilas [data-campo=down] >> nth=0', 'input');
    await page.waitForTimeout(600);
  };
  const elegido = () => page.$eval('#verdict-sel', (e) => e.value).catch(() => null);
  const nCandidatos = () => page.$eval('#verdict-sel', (e) => e.options.length).catch(() => 0);
  const texto = (sel) => page.$eval(sel, (e) => e.textContent || '').catch(() => '');

  /* ── BANNER DE ESTADO DE DATOS ──────────────────────────────────────────────────────
     Responde «¿esto tiene grado comercial?» antes de mirar una cifra. Lo que se afirma es
     que la COBERTURA sale del catálogo y no de un texto fijo: el día que alguien complete
     `ssl` en el Product Matrix, el banner tiene que subir solo. */
  const banner = await texto('#dataBanner');
  t.ok(/Product Matrix/.test(banner), 'el banner nombra la fuente técnica del catálogo');
  t.ok(/SSL \d+\/\d+/.test(banner), 'el banner cuenta la cobertura real de `ssl` sobre el catálogo servido');
  t.ok(/vigente|vencida|sin fecha/.test(banner), 'el banner declara la vigencia de la lista de precios');

  /* Los 7 modelos cuya cifra de inspeccion SSL el Product Matrix de septiembre ya no lista.
     Se comparan por NOMBRE EXACTO y no por subcadena: `/600F/` casa dentro de `2600F` y
     `/200F/` dentro de `3200F`, que es el mismo tropiezo del ancla corta que este repositorio
     ya pago en `catalogo-check.js`. */
  const SIN_CIFRA_SSL = ['FortiGate 100F', 'FortiGate 200F', 'FortiGate 400F', 'FortiGate 401F',
    'FortiGate 600F', 'FortiGate 1000F', 'FortiGate 1001F'];

  /* ── AT-01 · SSL OFICIAL, NO UN DERATE ──────────────────────────────────────────────
     300 Mbps + 30 % de crecimiento = 390 Mbps. El 40F publica 600 Mbps de Threat Protection
     y 310 de SSL Inspection. El derate que esta página aplicaba (tp × 0,65 = 390) lo dejaba
     JUSTO en el límite y lo daba por bueno; el dato oficial lo rechaza. */
  await caudal(300);
  await page.check('#chkSsl');
  await page.waitForTimeout(700);
  const sel40 = await page.$eval('#verdict-sel', (e) => [...e.options].map((o) => o.value));
  t.ok(!sel40.includes('FortiGate 40F'),
    'AT-01: con inspección SSL a 390 Mbps, el 40F NO es candidato (su SSL oficial son 310 Mbps)');
  // NOMBRE EXACTO Y NO UN TOTAL. Esta afirmacion decia «menos de 20 candidatos», que era
  // cierto solo mientras el catalogo tuviera 9 cifras de SSL de 58 modelos; al leer la tabla
  // del Product Matrix pasaron a 51 y la prueba se puso roja sin que nada estuviera mal. Lo
  // que hay que fijar no es CUANTOS compiten sino QUE NINGUNO SIN LA CIFRA compita: esa es la
  // regla, y no caduca al completarse el catalogo.
  t.ok(sel40.length > 0, 'AT-01: hay candidatos con cifra oficial de SSL');
  t.ok(!sel40.some((v) => SIN_CIFRA_SSL.includes(v)),
    'AT-01: ningún modelo sin cifra oficial de SSL se cuela por su Threat Protection');
  const ejes40 = await texto('#ejesPanel');
  t.ok(/Inspecci[oó]n SSL/i.test(ejes40), 'AT-01: el panel de utilización muestra el eje SSL');
  t.ok(/apartados/.test(ejes40),
    'AT-01: se dice cuántos modelos se apartaron por falta de cifra — una lista corta se explica');

  /* ── AT-20 · UN EJE SIN DATO APARTA, NO SE IMPUTA ───────────────────────────────────
     A 4 Gbps el 600F sobra por Threat Protection (10,5 Gbps) y aun asi no puede competir,
     porque su inspeccion SSL no esta publicada. Hasta el 2026-09-23 esta afirmacion se
     apoyaba en que a 4 Gbps NADIE cumplia -la mayor cifra de SSL del catalogo eran los 2,6
     Gbps del 90G-; al entrar la tabla del Product Matrix el 200G la cubre y ese cero dejo de
     existir. La regla no cambio; la forma de afirmarla, si. Lo que NO puede pasar sigue
     siendo que la pantalla presente la falta de DATO como falta de capacidad. */
  await caudal(4000);
  const sel4G = await page.$eval('#verdict-sel', (e) => [...e.options].map((o) => o.value));
  t.ok(!sel4G.some((v) => SIN_CIFRA_SSL.includes(v)),
    'AT-20: a 4 Gbps, un modelo sin cifra de SSL no entra aunque su Threat Protection sobre');
  const ejes4G = await texto('#ejesPanel');
  t.ok(/apartados/.test(ejes4G),
    'AT-20: se declara cuántos se apartaron por falta de dato');
  t.ok(/tarea de datos|no sustituye|PoC/i.test(ejes4G),
    'AT-20: y distingue «el catálogo no lo trae» de «ningún equipo aguanta»');
  await page.uncheck('#chkSsl');
  await page.waitForTimeout(500);

  /* ── AT-11 · SIMULTANEIDAD DECLARADA, NUNCA `max` AUTOMÁTICO ────────────────────────
     El ejemplo recalculado del informe: 600 Mbps de Internet + 300 de inter-VLAN con 25 %
     de crecimiento dan 750 u 1.125 Mbps según el supuesto, y entre esas dos cifras el equipo
     cambia de familia. */
  await caudal(600);
  await page.fill('#interVlan', '300');
  await page.dispatchEvent('#interVlan', 'input');
  await page.fill('#head', '25');
  await page.dispatchEvent('#head', 'input');
  await page.waitForTimeout(700);
  const sumado = await texto('#needLbl');
  const hint = await texto('#traficoHint');
  t.ok(/suma/i.test(hint), 'AT-11: por defecto los caminos se SUMAN, y la pantalla lo dice');
  await page.check('#chkNoConcurrente');
  await page.waitForTimeout(700);
  const maximo = await texto('#needLbl');
  const hint2 = await texto('#traficoHint');
  t.ok(/m[aá]ximo/i.test(hint2),
    'AT-11: declarar que los picos no son concurrentes cambia la regla a `max`, y se declara');
  t.ok(sumado !== maximo,
    `AT-11: el supuesto de simultaneidad cambia el requerimiento (${sumado} vs ${maximo})`);
  await page.uncheck('#chkNoConcurrente');
  await page.fill('#interVlan', '0');
  await page.dispatchEvent('#interVlan', 'input');
  await page.waitForTimeout(600);

  /* ── TECHO DE UTILIZACIÓN: POLÍTICA SEPARADA DEL CRECIMIENTO ────────────────────────
     Con el mismo escenario, apretar el techo tiene que reducir la lista de candidatos. Si no
     lo hiciera, el control sería un adorno — que es peor que no tenerlo. */
  const antesTecho = await nCandidatos();
  await page.selectOption('#techoUtil', '60');
  await page.waitForTimeout(700);
  const conTecho = await nCandidatos();
  t.ok(conTecho < antesTecho,
    `el techo de utilización recorta candidatos de verdad (${antesTecho} → ${conTecho})`);
  await page.selectOption('#techoUtil', '100');
  await page.waitForTimeout(600);

  /* ── AT-03 · BUNDLE MÍNIMO QUE BLOQUEA, NO QUE AVISA ────────────────────────────────
     DLP e IoT Security solo existen en Enterprise. Elegir UTP no es una advertencia: es una
     cotización que no se puede pedir, así que la exportación se cierra. */
  await page.check('#chkIotDlp');
  await page.selectOption('#licBundle', 'utp');
  await page.waitForTimeout(800);
  t.ok(await page.$eval('#xlsBtn', (e) => e.disabled),
    'AT-03: con UTP y DLP/IoT pedidos, «Exportar a Excel» queda DESHABILITADO');
  const puerta = await texto('#exportGate');
  t.ok(/Enterprise Protection/.test(puerta), 'AT-03: y la puerta nombra el bundle mínimo');
  t.ok(!/y IoT Detection \+ DLP y IoT/.test(puerta),
    'AT-03: el mensaje no repite la misma función dos veces');
  const chip4 = await texto('#chipPaso4');
  t.ok(/insuficiente/i.test(chip4), 'AT-03: el paso 4 se marca como bloqueante en su chip');

  await page.selectOption('#licBundle', 'ent');
  await page.waitForTimeout(800);
  t.ok(!(await page.$eval('#xlsBtn', (e) => e.disabled)),
    'AT-03: con Enterprise Protection la exportación se vuelve a habilitar');

  /* ── AT-04 / AT-05 / AT-06 EN LA LISTA DE MATERIALES ────────────────────────────────
     Los tres P0 comerciales, sobre la tabla que de verdad se exporta. */
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(800);
  const categorias = () => page.$$eval('#bomTabla .bom-cat, #bomTabla tbody tr',
    (ns) => ns.map((n) => (n.textContent || '').trim().toUpperCase()));
  // La descripción del bundle Enterprise CONTIENE las palabras «FortiCare Premium» y
  // «FortiConverter» —es lo que incluye—, así que buscar la palabra en toda la tabla no
  // distingue una LÍNEA COTIZADA de una mención. Se mira la categoría de la fila, que es lo
  // que de verdad entra en el total.
  const cats = await categorias();
  t.ok(!cats.some((c) => /^SOPORTE/.test(c)),
    'AT-04: con Enterprise Protection (que ya incluye FortiCare Premium) NO hay línea de soporte');
  const ficha = await texto('#bomBody');
  t.ok(/ya incluye FortiCare Premium/.test(ficha),
    'AT-04: y se explica por qué, en vez de que la línea desaparezca sin más');

  await page.click('[data-tab=calc]');
  await page.waitForTimeout(400);
  await page.check('#chkConverter');
  await page.waitForTimeout(700);
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  const catsConv = await categorias();
  t.ok(!catsConv.some((c) => /^SERVICIOS OPCIONALES/.test(c)),
    'AT-05: pedir FortiConverter con Enterprise NO añade una segunda línea — el bundle ya lo trae');

  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.uncheck('#chkIotDlp');
  await page.selectOption('#licBundle', 'utp');
  await page.waitForTimeout(700);
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  const catsUtp = await categorias();
  t.ok(catsUtp.some((c) => /^SERVICIOS OPCIONALES/.test(c)),
    'AT-05: fuera de Enterprise y pedido a mano, FortiConverter SÍ entra');

  // AT-06: ninguna línea exportable conserva el marcador DD del patrón del price list.
  const skus = await page.$$eval('#bomTabla code', (ns) => ns.map((n) => n.textContent.trim()));
  t.ok(skus.length > 0, 'la lista de materiales lleva SKU');
  t.ok(!skus.some((s) => /-DD$/.test(s)),
    `AT-06: ningún SKU de la lista conserva «-DD» (${skus.join(', ')})`);
  t.ok(skus.some((s) => /-36$/.test(s)),
    'AT-06: con término de 3 años los SKU llevan el sufijo de 36 meses');

  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.selectOption('#termYears', '5');
  await page.waitForTimeout(700);
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  const skus5 = await page.$$eval('#bomTabla code', (ns) => ns.map((n) => n.textContent.trim()));
  t.ok(skus5.some((s) => /-60$/.test(s)),
    'AT-06: cambiar a 5 años cambia el sufijo del SKU a 60 meses');

  /* ── AT-08 · SERVICIO SD-WAN SIN SKU CONFIRMADO BLOQUEA ─────────────────────────────
     La función base no se licencia; estos servicios sí, y este repositorio no ha leído su
     SKU del Ordering Guide. Una línea sin SKU exacto no es pedible: se declara y se cierra
     la puerta, en vez de inventar un código con pinta de válido. */
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.check('#chkSdwanOrq');
  await page.waitForTimeout(800);
  t.ok(await page.$eval('#xlsBtn', (e) => e.disabled),
    'AT-08: un servicio SD-WAN sin SKU confirmado cierra la exportación');
  const puertaSd = await texto('#exportGate');
  t.ok(/Ordering Guide/.test(puertaSd), 'AT-08: y dice exactamente qué falta por confirmar');

  /* ── AT-18 · EL OVERRIDE EXISTE, PERO EXIGE MOTIVO Y VIAJA ESTAMPADO ────────────────
     Una puerta sin salida se rodea copiando la tabla a mano, y entonces el documento sale
     SIN la advertencia. Así sale con ella. */
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(700);
  await page.click('#btnOverride');
  await page.waitForTimeout(400);
  t.ok(await page.$eval('#xlsBtn', (e) => e.disabled),
    'AT-18: forzar sin motivo no abre la puerta');
  await page.fill('#ovMotivo', 'Borrador técnico para revisión interna');
  await page.click('#btnOverride');
  await page.waitForTimeout(800);
  t.ok(!(await page.$eval('#xlsBtn', (e) => e.disabled)),
    'AT-18: con motivo escrito, la exportación se abre como borrador');
  const txtBom = await page.$eval('#bomOut', (e) => e.value);
  t.ok(/EXPORTACION FORZADA/.test(txtBom) && /Borrador técnico para revisión interna/.test(txtBom),
    'AT-18: el motivo viaja ESTAMPADO en el documento exportado, no solo en pantalla');
  t.ok(/NO es una cotizacion en firme/.test(txtBom),
    'AT-18: y el documento se declara a sí mismo como borrador');

  /* ── ALTERNATIVAS DE UN CLIC ────────────────────────────────────────────────────────
     «Candidato y dos alternativas» del informe. Una alternativa que hay que buscar en un
     desplegable de 39 entradas no es una alternativa. */
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(400);
  await page.uncheck('#chkSdwanOrq');
  await page.uncheck('#chkConverter');
  await caudal(1500);
  const antes = await elegido();
  const alt = await page.$('.sr-alt');
  t.ok(!!alt, 'el resumen fijo ofrece alternativas como botones');
  if (alt) {
    await alt.click();
    await page.waitForTimeout(700);
    const despues = await elegido();
    t.ok(despues && despues !== antes,
      `pulsar una alternativa cambia el equipo evaluado (${antes} → ${despues})`);
    const sticky = await texto('#stickyReco');
    t.ok(/elegido a mano/.test(sticky),
      'y el resumen marca que la elección dejó de ser la recomendada');
  }

  /* ── EL ESCENARIO STALE CIERRA LA PUERTA (AT-15) ────────────────────────────────────
     La lista de materiales guarda la huella del escenario con el que se construyó. Aquí se
     comprueba lo contrario de lo obvio: que un escenario COHERENTE no se marque como stale
     por accidente, que sería una puerta cerrada para siempre. */
  const puertaFinal = await texto('#exportGate');
  t.ok(!/modificado despu[eé]s del c[aá]lculo/.test(puertaFinal),
    'AT-15: un escenario recalculado no se marca como obsoleto');
  t.ok(/Huella del escenario/.test(puertaFinal),
    'AT-15: la puerta publica la huella con la que se construyó la lista');

  /* ── FOTO OFICIAL DEL EQUIPO (2026-09-22) ───────────────────────────────────────────
     Petición del dueño: «como está en Aruba». Lo que se afirma es la CADENA COMPLETA —que
     la foto se sirve de verdad (no un 404 con hueco), que su pie declara de qué documento
     salió, y que un modelo sin foto lo DICE en vez de enseñar una parecida—, no cuántos
     modelos la tienen: ese número sube en cuanto alguien traiga los datasheets que faltan,
     y fijarlo pondría la prueba en rojo por una mejora. */
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(400);
  await caudal(2500);
  await page.waitForTimeout(700);
  await page.evaluate(() => { const f = document.querySelector('.ficha-vista'); if (f) f.scrollIntoView({ block: 'center' }); });
  // `loading="lazy"`: la figura vive por encima del viewport hasta que se desplaza, así que
  // medir naturalWidth antes de eso da 0 y parece un fallo que no existe.
  await page.waitForFunction(() => {
    const i = document.querySelector('.ficha-vista img');
    return i && i.complete && i.naturalWidth > 0;
  }, { timeout: 15000 }).catch(() => {});
  const foto = await page.evaluate(() => {
    const f = document.querySelector('.ficha-vista');
    const i = f && f.querySelector('img');
    return {
      hay: !!f, src: i ? i.getAttribute('src') : null, ancho: i ? i.naturalWidth : 0,
      pie: ((f && f.querySelector('figcaption')) || {}).textContent || '',
      lupa: !!(f && f.querySelector('.ficha-vista-zoom')),
      caras: f ? f.querySelectorAll('.ficha-vista-tab').length : -1,
    };
  });
  t.ok(foto.hay, 'la ficha corona con la foto oficial del equipo, como en Aruba');
  t.ok(foto.ancho > 0, `la foto CARGA de verdad, no es un hueco (natural ${foto.ancho}px)`);
  t.ok(/^\/img\/equipos\/fg-/.test(foto.src || ''), `la foto sale del repositorio (${foto.src})`);
  t.ok(/Datasheet/.test(foto.pie), `el pie declara de qué documento salió (${foto.pie})`);
  t.ok(foto.lupa, 'la lupa está, como en Aruba');
  // CORRECCIÓN DEL 2026-09-22 (tarde). Esta aserción decía lo contrario -«sin conmutador de
  // caras: Fortinet no publica vista trasera»- y era FALSA. La revisión de la mañana miró
  // solo la portada de los 28 datasheets; la página 7 de los 28 es la página «Hardware», con
  // el diagrama de panel, y cuatro de ellos rotulan las caras literalmente («Front Panel» /
  // «Rear Panel»). Se deja escrito aquí porque una prueba que afirmaba un hueco inexistente
  // es peor que no tenerla: bloquea el arreglo y da la falsa sensación de estar cubierto.
  t.ok(foto.caras === 2,
    `conmutador frontal/trasera, como en Aruba: el datasheet publica las dos caras (${foto.caras} pestañas)`);
  const trasera = await page.evaluate(async () => {
    const tab = document.querySelector('.ficha-vista-tab[data-vista="rear"]');
    if (!tab) return null;
    tab.click();
    await new Promise((r) => setTimeout(r, 400));
    const i = document.querySelector('.ficha-vista img');
    i.scrollIntoView();
    await new Promise((r) => setTimeout(r, 900));
    return { src: i.getAttribute('src'), ancho: i.naturalWidth };
  });
  t.ok(trasera && /-rear\.webp$/.test(trasera.src || ''),
    `la pestaña «Trasera» sirve la figura trasera (${trasera && trasera.src})`);
  t.ok(trasera && trasera.ancho > 0,
    `y esa figura CARGA de verdad, no es un hueco (natural ${trasera && trasera.ancho}px)`);

  // El hueco honesto: el 100F no tiene datasheet por serie, así que NO tiene foto y lo dice.
  await caudal(500);
  await page.waitForTimeout(800);
  await page.selectOption('#verdict-sel', 'FortiGate 100F');
  await page.waitForTimeout(900);
  const hueco = await page.evaluate(() => ({
    aviso: ((document.querySelector('.ficha-vista-vacia')) || {}).textContent || '',
    foto: !!document.querySelector('.ficha-vista'),
  }));
  t.ok(!hueco.foto && /Sin foto oficial/.test(hueco.aviso),
    'un modelo sin foto oficial DECLARA el hueco en vez de enseñar una parecida');

  /* ── AT-29 a AT-33 · LOS LIMITES DEL PRODUCT MATRIX, CONDUCIDOS EN LA PANTALLA ───────
     Las reglas se afirman en `test/fortinet-reglas.test.js`; aqui se afirma que la PANTALLA
     las conduce: que los controles existen, que escriben el eje correcto y que lo que se lee
     junto al equipo es el contraste y no la declaracion sin comprobar de antes. */
  await page.goto(`${BASE}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await caudal(1);
  await page.click('#rolSeg button[data-v="hub"]');
  await page.waitForTimeout(500);
  await page.fill('#sites', '190');
  await page.dispatchEvent('#sites', 'input');
  await page.waitForTimeout(900);
  const tunTxt = await texto('#verdict');
  t.ok(/t[uú]neles publicados/.test(tunTxt) && /tope de plataforma/.test(tunTxt),
    'AT-29: el conteo de túneles se contrasta contra la cifra publicada del modelo');
  t.ok(!/no est[aá] en este cat[aá]logo/.test(tunTxt),
    'AT-29: ya no queda el aviso «el límite de túneles no está en este catálogo»');
  const reco190 = await page.$eval('#verdict-sel', (e) => e.value);
  await page.fill('#sites', '260');
  await page.dispatchEvent('#sites', 'input');
  await page.waitForTimeout(900);
  const reco260 = await page.$eval('#verdict-sel', (e) => e.value);
  t.ok(reco190 === 'FortiGate 30G' && reco260 === 'FortiGate 120G',
    `AT-30: pasar de 190 a 260 spokes de 1 Mbps cambia el equipo por el TOPE DE TUNELES (${reco190} → ${reco260})`);

  // El acceso remoto va a un eje o al otro segun el modo, y son dos topes distintos.
  await page.goto(`${BASE}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await caudal(100);
  await page.fill('#vpnUsers', '400');
  await page.dispatchEvent('#vpnUsers', 'input');
  await page.waitForTimeout(800);
  const recoIpsec = await page.$eval('#verdict-sel', (e) => e.value);
  await page.selectOption('#vpnTipo', 'sslvpn');
  await page.waitForTimeout(900);
  const recoSsl = await page.$eval('#verdict-sel', (e) => e.value);
  t.ok(recoIpsec !== recoSsl,
    `AT-31: los mismos 400 remotos dan otro equipo segun el motor que los termina (${recoIpsec} → ${recoSsl})`);
  t.ok(/SSL-VPN/.test(await texto('#verdict')),
    'AT-31: la pantalla dice por qué motor pasa el acceso remoto');

  // VDOM: un tope que este catálogo no tenía y que decide un diseño multi-tenant.
  await page.goto(`${BASE}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await caudal(100);
  await page.fill('#vdoms', '120');
  await page.dispatchEvent('#vdoms', 'input');
  await page.waitForTimeout(900);
  t.ok(await page.$eval('#verdict-sel', (e) => e.value) === 'FortiGate 1800F',
    'AT-32: 120 VDOM declarados llevan al primer modelo cuyo máximo publicado los admite');
  t.ok(/VDOM/.test(await texto('#verdict')), 'AT-32: y la pantalla lo declara junto al equipo');

  // F7 · las excepciones TLS son un supuesto declarado, no una constante del fabricante.
  await page.goto(`${BASE}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  // EL ESCENARIO DE AT-01, QUE ES DONDE EL EJE SSL MANDA DE VERDAD. 300 Mbps + 30 % dan 390:
  // el 40F publica 600 Mbps de Threat Protection y solo 310 de inspeccion SSL, asi que el eje
  // que lo saca es el de SSL y no el de la capa. Un caudal mayor no serviria para esto: alli
  // manda Threat Protection y bajar la demanda del eje SSL no cambiaria la lista, que fue
  // exactamente el falso verde de la primera version de esta prueba.
  await caudal(300);
  await page.check('#chkSsl');
  await page.waitForTimeout(800);
  t.ok(await page.$eval('#fldTlsExento', (e) => e.style.display !== 'none'),
    'F7: el control de excepciones TLS aparece solo con la inspección SSL pedida');
  const sinExento = await page.$eval('#verdict-sel', (e) => [...e.options].map((o) => o.value));
  await page.selectOption('#pctTlsExento', '40');
  await page.waitForTimeout(900);
  const conExento = await page.$eval('#verdict-sel', (e) => [...e.options].map((o) => o.value));
  t.ok(!sinExento.includes('FortiGate 40F') && conExento.includes('FortiGate 40F'),
    'F7: declarar un 40 % exento baja la demanda del eje SSL de 390 a 234 Mbps y el 40F (310) vuelve a caber');
  t.ok(/no es una cifra de Fortinet|supuesto declarado/i.test(await texto('#verdict')),
    'F7: y se declara como supuesto de quien diseña, no como dato del fabricante');

  t.ok(errores.length === 0, `sin excepciones de página (${errores.join(' | ') || 'ninguna'})`);

  await browser.close();
  process.exit(t.resumen('e2e-fortinet-auditoria'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
