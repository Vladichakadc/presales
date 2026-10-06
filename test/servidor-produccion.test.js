'use strict';
// Arranca el servidor de verdad con NODE_ENV=production y lo interroga por HTTP.
//
// Es la unica prueba que cruza todas las capas, y existe porque las tres cosas que solo
// pasan en produccion (arranque cerrado sin AUTH_PASSWORD, cookie Secure, sync en 503) eran
// invisibles para el resto de la bateria — y porque la autorizacion por permiso solo se
// puede probar donde se aplica: en la ruta. Tarda unos segundos por la siembra del catalogo
// en una base temporal; es el precio de no fingir el servidor.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'presales-servidor-'));
process.env.AUTH_STATE_DIR = dir;
const usuariosMod = require('../server/usuarios');

fs.writeFileSync(path.join(dir, 'usuarios.json'), JSON.stringify({
  version: 1,
  usuarios: [
    { id: 'u1', usuario: 'ana', nombre: 'Ana', rol: 'admin', activo: true,
      passwordHash: usuariosMod.hashPassword('contrasena-de-ana-larga') },
    { id: 'u2', usuario: 'bruno', nombre: 'Bruno', rol: 'consulta', activo: true,
      passwordHash: usuariosMod.hashPassword('contrasena-de-bruno-larga') },
  ],
}));

const PORT = 4300 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
let servidor;
let salida = '';

function arrancar() {
  return new Promise((resolve, reject) => {
    servidor = spawn(process.execPath, ['server/server.js'], {
      cwd: RAIZ,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(PORT),
        AUTH_PASSWORD: 'no-se-usa-porque-hay-usuarios',
        AUTH_STATE_DIR: dir,
        DATABASE_PATH: path.join(dir, 'catalogo.sqlite'),
        SESSION_SECRET: 'secreto-de-prueba',
        ANTHROPIC_API_KEY: '',
      },
    });
    const temporizador = setTimeout(() => reject(new Error(`el servidor no arranco en 60 s:\n${salida}`)), 60000);
    const escuchar = (chunk) => {
      salida += chunk;
      if (salida.includes('Presales corriendo en')) { clearTimeout(temporizador); resolve(); }
    };
    servidor.stdout.on('data', escuchar);
    servidor.stderr.on('data', escuchar);
    servidor.on('exit', (code) => { clearTimeout(temporizador); reject(new Error(`el servidor salio con ${code}:\n${salida}`)); });
  });
}

async function sesionDe(usuario, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  });
  assert.strictEqual(res.status, 200, `login de ${usuario}`);
  const cookie = res.headers.get('set-cookie');
  assert.ok(cookie, 'el login pone cookie');
  // En produccion la cookie de sesion lleva Secure: es uno de los tres comportamientos
  // que solo existen en ese modo.
  assert.match(cookie, /Secure/);
  return cookie.split(';')[0];
}

test.before(arrancar);
test.after(() => { if (servidor) servidor.kill(); });

test('el arranque en produccion siembra el catalogo y llega a escuchar', () => {
  assert.match(salida, /\[seed\]/);
  assert.match(salida, /Presales corriendo en/);
  // Y dice donde vive la base y que la sembro: es la linea que se lee en el log de Railway.
  assert.ok(salida.includes(`[db] SQLite en ${path.join(dir, 'catalogo.sqlite')}: catálogo sembrado desde legacyData/ en este arranque.`), salida);
  assert.doesNotMatch(salida, /no se volvió a sembrar/);
});

test('un arranque en produccion sobre una base que ya trae catalogo lo avisa', async () => {
  // POR QUE. La siembra solo corre con la base vacia, asi que una base que sobrevive al
  // despliegue (DATABASE_PATH dentro del volumen) sigue sirviendo el catalogo de antes y los
  // cambios de legacyData/ no llegan a produccion. Aqui la base es la que acaba de sembrar el
  // primer arranque, que es exactamente ese caso.
  const puerto = PORT + 1;
  let otra = '';
  const segundo = spawn(process.execPath, ['server/server.js'], {
    cwd: RAIZ,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(puerto),
      AUTH_PASSWORD: 'no-se-usa-porque-hay-usuarios',
      AUTH_STATE_DIR: dir,
      DATABASE_PATH: path.join(dir, 'catalogo.sqlite'),
      SESSION_SECRET: 'secreto-de-prueba',
      ANTHROPIC_API_KEY: '',
    },
  });
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`el segundo arranque no llego a escuchar:\n${otra}`)), 60000);
      const oir = (c) => { otra += c; if (otra.includes('Presales corriendo en')) { clearTimeout(t); resolve(); } };
      segundo.stdout.on('data', oir);
      segundo.stderr.on('data', oir);
      segundo.on('exit', (code) => { clearTimeout(t); reject(new Error(`el segundo arranque salio con ${code}:\n${otra}`)); });
    });
  } finally {
    segundo.removeAllListeners('exit');
    segundo.kill();
  }
  assert.doesNotMatch(otra, /\[seed\]/);
  assert.match(otra, /\[db\] SQLite en .*: catálogo reutilizado de un arranque anterior\./);
  assert.match(otra, /\[db\] La base ya traía catálogo y no se volvió a sembrar: los cambios de legacyData\/ de este despliegue NO están en producción/);
});

test('/salud responde sin sesion y cuenta el catalogo sembrado', async () => {
  // Sin sesion a proposito: el healthcheck de Railway no tiene cookie, y si esta ruta
  // quedara detras del muro recibiria un 302 que Railway leeria como "sano".
  const res = await fetch(`${BASE}/salud`, { redirect: 'manual' });
  assert.strictEqual(res.status, 200);
  const cuerpo = await res.json();
  assert.strictEqual(cuerpo.ok, true);
  // Contar el catalogo es lo que distingue "el proceso responde" de "el proceso sirve":
  // un {ok:true} fijo estaria igual de verde con la base vacia.
  assert.ok(cuerpo.fabricantes > 0, 'hay fabricantes sembrados');
  assert.ok(cuerpo.modelos > 0, 'hay modelos sembrados');
  // Y no filtra nada: solo cuantos, ni cuales ni a que precio.
  assert.deepStrictEqual(Object.keys(cuerpo).sort(), ['fabricantes', 'modelos', 'ok']);
});

test('sin sesion, la API responde 401 y la navegacion redirige al login', async () => {
  const api = await fetch(`${BASE}/api/sync/analyze`, { method: 'POST' });
  assert.strictEqual(api.status, 401);
  const pagina = await fetch(`${BASE}/cotizador.html`, { redirect: 'manual' });
  assert.strictEqual(pagina.status, 302);
  assert.match(pagina.headers.get('location'), /^\/login\?m=sesion&r=/);
});

test('el permiso sync se exige en la ruta: consulta recibe 403, administrador pasa', async () => {
  const bruno = await sesionDe('bruno', 'contrasena-de-bruno-larga');
  const negado = await fetch(`${BASE}/api/sync/analyze`, { method: 'POST', headers: { cookie: bruno } });
  assert.strictEqual(negado.status, 403);

  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  // Analizar SÍ corre en producción (a diferencia de antes). El siguiente muro es la clave:
  // sin ANTHROPIC_API_KEY falla cerrado con SinClave, nunca con un dato inventado. El servidor
  // de esta prueba arranca con la clave vacía a propósito.
  const admin = await fetch(`${BASE}/api/sync/analyze`, {
    method: 'POST',
    headers: { cookie: ana, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendor: 'fortinet' }),
  });
  assert.strictEqual(admin.status, 503);
  const cuerpo = await admin.json();
  assert.match(cuerpo.error, /ANTHROPIC_API_KEY/);
});

test('aplicar a la base sí sigue bloqueado en producción: la base es efímera', async () => {
  // La escritura a la base no tiene sentido en producción y ese muro se queda. El camino
  // durable es descargar la propuesta y abrir el PR desde el workflow.
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const res = await fetch(`${BASE}/api/sync/apply`, {
    method: 'POST',
    headers: { cookie: ana, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendor: 'fortinet', changes: [] }),
  });
  assert.strictEqual(res.status, 503);
  assert.match((await res.json()).error, /aplicar-propuesta|efímera|PR/i);
});

test('/api/sync/estado informa entorno y presencia de clave, bajo el permiso sync', async () => {
  const bruno = await sesionDe('bruno', 'contrasena-de-bruno-larga');
  assert.strictEqual((await fetch(`${BASE}/api/sync/estado`, { headers: { cookie: bruno } })).status, 403);

  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const res = await fetch(`${BASE}/api/sync/estado`, { headers: { cookie: ana } });
  assert.strictEqual(res.status, 200);
  const estado = await res.json();
  assert.strictEqual(estado.produccion, true);
  assert.strictEqual(estado.tieneClave, false); // la prueba arranca con la clave vacía
});

test('las cabeceras de seguridad estan puestas', async () => {
  const res = await fetch(`${BASE}/login`);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(res.headers.get('strict-transport-security'), /max-age=\d+/);
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
});

test('/vendor/xlsx.js sirve SheetJS desde la dependencia y detras del muro', async () => {
  const sinSesion = await fetch(`${BASE}/vendor/xlsx.js`, { redirect: 'manual' });
  assert.strictEqual(sinSesion.status, 302);
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const res = await fetch(`${BASE}/vendor/xlsx.js`, { headers: { cookie: ana } });
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
  const cuerpo = await res.text();
  assert.match(cuerpo, /SheetJS/);
});

// De extremo a extremo: un administrador da de alta a alguien, esa cuenta queda encerrada en
// /cuenta hasta que cambia la clave temporal de verdad, y solo entonces recupera el portal.
// Es el flujo completo que server.js, usuarios.js y las dos paginas tienen que sostener entre
// los tres — la pieza que faltaba del pendiente 1 de PENDIENTES.md.
test('alta de usuario: la cuenta nueva queda encerrada hasta cambiar la clave temporal', async () => {
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga'); // admin

  const alta = await fetch(`${BASE}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: ana },
    body: JSON.stringify({ usuario: 'recien.llegada', nombre: 'Recién Llegada', rol: 'consulta' }),
  });
  assert.strictEqual(alta.status, 201);
  const cuerpoAlta = await alta.json();
  assert.strictEqual(cuerpoAlta.ok, true);
  assert.ok(cuerpoAlta.passwordTemporal, 'la clave se devuelve una vez en esta respuesta');
  assert.strictEqual(cuerpoAlta.usuario.debeCambiar, true);

  const nueva = await sesionDe('recien.llegada', cuerpoAlta.passwordTemporal);

  // Con debeCambiar en true, cualquier otra pantalla (API o navegacion) redirige a /cuenta.
  const catalogo = await fetch(`${BASE}/api/catalog`, { headers: { cookie: nueva } });
  assert.strictEqual(catalogo.status, 403);
  const errCatalogo = await catalogo.json();
  assert.strictEqual(errCatalogo.debeCambiar, true);

  const portal = await fetch(`${BASE}/`, { headers: { cookie: nueva }, redirect: 'manual' });
  assert.strictEqual(portal.status, 302);
  assert.match(portal.headers.get('location'), /^\/cuenta/);

  // Pero /cuenta y su propio ciclo de cambio de clave siguen abiertos: si tambien
  // redirigieran, nadie podria salir nunca del encierro.
  const cuentaEstado = await fetch(`${BASE}/api/cuenta/estado`, { headers: { cookie: nueva } });
  assert.strictEqual(cuentaEstado.status, 200);
  const estadoCuenta = await cuentaEstado.json();
  assert.strictEqual(estadoCuenta.debeCambiar, true);

  const cambio = await fetch(`${BASE}/api/cuenta/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: nueva },
    body: JSON.stringify({ actual: cuerpoAlta.passwordTemporal, nueva: 'la-clave-que-ella-eligio-de-verdad' }),
  });
  assert.strictEqual(cambio.status, 200);

  // Cambiar la clave invalida la sesion (misma regla que cualquier otro cambio de clave):
  // hay que volver a entrar, y esta vez sin bloqueo.
  const otraVez = await sesionDe('recien.llegada', 'la-clave-que-ella-eligio-de-verdad');
  const catalogoLibre = await fetch(`${BASE}/api/catalog`, { headers: { cookie: otraVez } });
  assert.strictEqual(catalogoLibre.status, 200);
});

test('el alta rechaza un rol invalido y no exige el permiso a quien no lo tiene', async () => {
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const rolMalo = await fetch(`${BASE}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: ana },
    body: JSON.stringify({ usuario: 'rolmalo.e2e', nombre: 'X', rol: 'superadmin' }),
  });
  assert.strictEqual(rolMalo.status, 400);

  const bruno = await sesionDe('bruno', 'contrasena-de-bruno-larga'); // consulta
  const negado = await fetch(`${BASE}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: bruno },
    body: JSON.stringify({ usuario: 'intento.e2e', nombre: 'X', rol: 'consulta' }),
  });
  assert.strictEqual(negado.status, 403);
});

test('la calculadora no aparta un fabricante por un dato que el catálogo SI publica', async () => {
  // POR QUE AQUI Y NO EN test/calculadora.test.js. El mapa de capas de public/js/calculadora.js
  // se escribio contra `legacyData/indexPR.js`, donde el campo `sdwan` de Cisco es el texto
  // «Sí» — y apartaba los 19 modelos de Cisco del perfil SD-WAN por un dato que si estaba.
  // Lo que sirve la aplicacion es OTRA cosa: `seedCatalog.js` funde en la misma fila el
  // catalogo del portal y el del dimensionador de ese fabricante, asi que en /api/catalog el
  // `sdwan` de Cisco es un numero. Un «sin dato» falso es del peor tipo de error de este
  // repositorio: no rompe nada, solo miente — el mismo que el comparador cometio diciendo
  // «IPS: no aplica» de un Catalyst 8300. Solo se caza contra el servidor de verdad.
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const res = await fetch(`${BASE}/api/catalog`, { headers: { cookie: ana } });
  assert.strictEqual(res.status, 200);
  const PR = await res.json();

  const { cargar } = require('./ayuda/navegador.js');
  const { CALC } = cargar('public/js/calculadora.js');
  const devs = Object.keys(PR).flatMap((g) => PR[g].map((p) => ({ grupo: g, raw: p, model: p.model, vendor: g })));
  assert.ok(devs.length > 100, 'el catalogo llego entero');

  // Un modelo se aparta SOLO si el campo del que sale esa capa esta vacio en su fila. Si
  // trae el dato y aun asi se aparta, el mapa esta mirando el campo equivocado.
  const CAMPOS = {
    fwd: { hw_ar: ['fwd'], hw_wan: ['cap'], cisco: ['fwd', 'cap'], nokia: ['cap'], fortinet: ['fw'], juniper: ['fw', 'cap'], mikrotik: ['fwd'], aruba: ['fw', 'fwd'] },
    ipsec: { hw_ar: ['ipsec'], cisco: ['ipsec'], fortinet: ['vpn'], juniper: ['vpn'], mikrotik: ['ipsec'], aruba: ['ipsec'] },
    sdwan: { hw_ar: ['sdwan'], cisco: ['sdwan'], aruba: ['wanMax'] },
    ngfw: { fortinet: ['ngfw'], juniper: ['ips'] },
    tp: { fortinet: ['tp'], juniper: ['atp'] },
    ssl: { fortinet: ['ssl'] },
  };
  for (const perfil of Object.keys(CALC.PERFILES)) {
    for (const a of CALC.evaluar(devs, perfil, 1).apartados) {
      const campos = (CAMPOS[perfil] || {})[a.d.grupo];
      if (!campos) continue; // ese catalogo no publica esa capa para nadie
      const traeDato = campos.some((c) => CALC.mbps(a.d.raw[c]) !== null);
      // Los SSR de Juniper leen `cap` en el perfil SD-WAN aunque el resto de la serie no.
      if (perfil === 'sdwan' && a.d.grupo === 'juniper') continue;
      assert.ok(!traeDato,
        `${perfil}: ${a.d.model} se aparta pero su fila trae ${campos.join('/')} = ${campos.map((c) => a.d.raw[c]).join('/')}`);
    }
  }

  // Y al reves: en cada capa que algun catalogo publica, alguien tiene que llegar a
  // comprobarse. Un perfil que aparta el catalogo entero seria un mapa roto, no un hueco.
  for (const perfil of Object.keys(CALC.PERFILES)) {
    const r = CALC.evaluar(devs, perfil, 1);
    assert.ok(r.candidatos.length > 0, `el perfil ${perfil} comprueba algun equipo`);
  }

  // Los tres fabricantes cuyo dato solo aparece tras la fusion de la siembra: si alguien
  // vuelve a escribir el mapa contra indexPR.js, esto lo dice.
  const conCifra = (perfil, grupo) => CALC.evaluar(devs, perfil, 1).candidatos
    .filter((f) => f.d.grupo === grupo).length;
  assert.ok(conCifra('sdwan', 'cisco') >= 10, 'Cisco publica SD-WAN por modelo');
  assert.ok(conCifra('ipsec', 'juniper') >= 5, 'los SRX de 2024 publican IPsec');
  assert.ok(conCifra('ngfw', 'juniper') >= 5, 'y su cifra de IPS');
  assert.ok(conCifra('sdwan', 'aruba') >= 5, 'EdgeConnect publica su rango de ancho de banda WAN');

  /* PERFIL DE INSPECCION TLS (2026-09-23). Entro cuando `ssl` paso de 9 a 51 de 58 modelos
     al leer el Product Matrix de septiembre; antes el perfil habria sido un hueco con 9
     equipos dentro. Se afirma contra el servidor de verdad por lo mismo que el resto de este
     caso: `ssl` llega a /api/catalog por la FUSION de la siembra -esta en los MODELS del
     dimensionador, no en indexPR.js-, asi que un mapa escrito contra el archivo legacy lo
     apartaria entero y esta prueba es lo unico que lo dice. */
  assert.ok(conCifra('ssl', 'fortinet') >= 15, 'Fortinet publica SSL Inspection por modelo');

  // LA REGLA, Y NO SOLO EL CONTEO: en inspeccion TLS no puede aparecer NINGUN equipo de otro
  // fabricante, porque ninguno publica esa cifra. Si apareciera, el mapa estaria leyendo el
  // campo de otra capa — que es el derate que este repositorio retiro del dimensionador.
  const otrosEnSsl = CALC.evaluar(devs, 'ssl', 1).candidatos
    .concat(CALC.evaluar(devs, 'ssl', 1).cortos)
    .filter((f) => f.d.grupo !== 'fortinet');
  assert.strictEqual(otrosEnSsl.length, 0,
    `en inspeccion TLS solo compite quien publica la cifra; aparecieron ${otrosEnSsl.map((f) => f.d.model).join(', ')}`);

  // Y LA COBERTURA SE MIDE CONTRA EL CATALOGO, NO SE DECLARA. Es lo que la pantalla pinta
  // encima de la lista para que una lista corta se lea como «falta el dato» y no como «falta
  // el equipo»; una lista de fabricantes escrita a mano se quedaria con los de ayer.
  const cob = CALC.cobertura(devs, 'ssl');
  assert.strictEqual(cob.conCifra, 1, 'hoy solo un fabricante publica la inspeccion TLS');
  assert.ok(cob.fabricantes >= 7, 'y se compara contra los fabricantes que trae el catalogo');
  assert.ok(cob.con > 0 && cob.con < cob.total, 'con cifra son algunos, no todos ni ninguno');
  // El perfil de reenvio es el control: ahi lo publican todos, y la frase de la pantalla
  // cambia. Sin este control, un `cobertura` roto que devolviera siempre 1 pasaria en verde.
  const cobFwd = CALC.cobertura(devs, 'fwd');
  assert.strictEqual(cobFwd.conCifra, cobFwd.fabricantes, 'la cifra de reenvio la publican todos');
});

test('referencias de pedido: bajo demanda, tras el muro y sin cruzar de fabricante', async () => {
  // Van por modelo a proposito: las 6.849 de Fortinet pesan 774 KB y no caben en el payload
  // del dimensionador. Se interroga al servidor real porque cruza muro de sesion, ruta y
  // servicio.
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');

  // Sin sesion, 401 JSON: es una ruta de API, no una navegacion.
  const sin = await fetch(`${BASE}/api/referencias/fortinet/FortiGate%20120G`);
  assert.strictEqual(sin.status, 401);

  const res = await fetch(`${BASE}/api/referencias/fortinet/FortiGate%20120G`, { headers: { cookie: ana } });
  assert.strictEqual(res.status, 200);
  const d = await res.json();
  assert.ok(d.refs.length > 10, 'devuelve las referencias del equipo');
  assert.ok(d.refs.some((r) => r.sku === 'FG-120G'), 'incluye su SKU de hardware');

  // El payload por modelo tiene que seguir siendo pequenyo: si un dia alguien mete aqui el
  // catalogo entero, esta asercion lo dice antes de que llegue a produccion.
  const kb = Buffer.byteLength(JSON.stringify(d)) / 1024;
  assert.ok(kb < 120, `el payload de un equipo son ${kb.toFixed(0)} KB`);

  // Un fabricante inventado no devuelve un objeto vacio que parezca valido.
  const malo = await fetch(`${BASE}/api/referencias/marte/x`, { headers: { cookie: ana } });
  assert.strictEqual(malo.status, 400);

  // Un fabricante sin referencias responde 200 explicando por que, no un 404 mudo.
  const hw = await fetch(`${BASE}/api/referencias/huawei/AR611`, { headers: { cookie: ana } });
  assert.strictEqual(hw.status, 200);
  const dh = await hw.json();
  assert.strictEqual(dh.refs.length, 0);
  assert.ok(dh.nota, 'y lo declara');
});

test('carga de fuente oficial: exige permiso sync, valida el tipo y aparece en /api/fuentes', async () => {
  // Credito-cero: subir el documento actualiza la PROCEDENCIA del fabricante al instante, sin
  // tocar la IA. Se prueba de punta a punta contra el servidor real porque cruza permiso,
  // validacion por firma, escritura en el volumen y la proyeccion de /api/fuentes.
  const bruno = await sesionDe('bruno', 'contrasena-de-bruno-larga'); // consulta, sin sync
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga'); // admin, con sync

  const pdf = () => new Blob([Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64, 7)])], { type: 'application/octet-stream' });
  const conArchivo = (blob, nombre) => { const fd = new FormData(); fd.append('documento', blob, nombre); return fd; };

  // consulta no puede: el permiso se exige en la ruta, no se oculta solo en la interfaz.
  const negado = await fetch(`${BASE}/api/fuentes/fortinet`, { method: 'POST', headers: { cookie: bruno }, body: conArchivo(pdf(), 'x.pdf') });
  assert.strictEqual(negado.status, 403);

  // Lo que no es PDF/XLSX/CSV/TXT por su CONTENIDO recibe 415, aunque la extension diga .pdf.
  const falso = new Blob([Buffer.from([0, 1, 2, 3, 4, 5])], { type: 'application/pdf' });
  const rechazado = await fetch(`${BASE}/api/fuentes/fortinet`, { method: 'POST', headers: { cookie: ana }, body: conArchivo(falso, 'trampa.pdf') });
  assert.strictEqual(rechazado.status, 415);

  // Un fabricante inexistente no crea nada.
  const malVendor = await fetch(`${BASE}/api/fuentes/marte`, { method: 'POST', headers: { cookie: ana }, body: conArchivo(pdf(), 'x.pdf') });
  assert.strictEqual(malVendor.status, 400);

  // El admin sube un PDF de verdad.
  const ok = await fetch(`${BASE}/api/fuentes/fortinet`, { method: 'POST', headers: { cookie: ana }, body: conArchivo(pdf(), 'matrix.pdf') });
  assert.strictEqual(ok.status, 201);
  const { entrada } = await ok.json();
  assert.match(entrada.id, /^[0-9a-f]{16}$/);

  // Aparece YA en /api/fuentes, como fuente «cargada» y la primera de la lista del fabricante.
  const fuentes = await (await fetch(`${BASE}/api/fuentes`, { headers: { cookie: ana } })).json();
  const cargada = fuentes.fortinet.fuentes.find((f) => f.subida);
  assert.ok(cargada, 'la fuente subida sale en la proyeccion');
  assert.strictEqual(cargada.estado, 'cargada');

  // Y el documento se puede consultar (detras del muro de sesion), pero no sin sesion.
  const doc = await fetch(`${BASE}${cargada.url}`, { headers: { cookie: ana }, redirect: 'manual' });
  assert.strictEqual(doc.status, 200);
  // Bajo /api/ el muro responde 401 JSON (no 302): es una ruta de API, no una navegación.
  const sinSesion = await fetch(`${BASE}${cargada.url}`);
  assert.strictEqual(sinSesion.status, 401);

  // ── Borrado ──────────────────────────────────────────────────────────────────
  // Quitar la procedencia de un fabricante es mantenimiento, no consulta: mismo permiso que
  // subirla. Ocultar el boton a quien no lo tenga es comodidad; esto es el control.
  const borrar = (cookie, v, id) => fetch(`${BASE}/api/fuentes/${v}/documento/${id}`, { method: 'DELETE', headers: { cookie } });

  assert.strictEqual((await borrar(bruno, 'fortinet', entrada.id)).status, 403, 'consulta no borra');
  assert.strictEqual((await borrar(ana, 'fortinet', 'c'.repeat(16))).status, 404, 'id inexistente');
  assert.strictEqual((await borrar(ana, 'marte', entrada.id)).status, 400, 'fabricante invalido');
  // Un id valido pero de OTRO fabricante no debe borrar nada: el 404 protege al de al lado.
  assert.strictEqual((await borrar(ana, 'cisco', entrada.id)).status, 404, 'no cruza de fabricante');

  // Y tras esos cuatro intentos el documento sigue sirviendose.
  assert.strictEqual((await fetch(`${BASE}${cargada.url}`, { headers: { cookie: ana } })).status, 200);

  // El admin si lo borra: desaparece de /api/fuentes y deja de servirse.
  assert.strictEqual((await borrar(ana, 'fortinet', entrada.id)).status, 200);
  const tras = await (await fetch(`${BASE}/api/fuentes`, { headers: { cookie: ana } })).json();
  assert.ok(!tras.fortinet.fuentes.some((f) => f.id === entrada.id), 'sale de la proyeccion');
  assert.strictEqual((await fetch(`${BASE}${cargada.url}`, { headers: { cookie: ana } })).status, 404);
  // Pero la procedencia del CATALOGO (legacyData/fuentes.js) sigue intacta: eso no se borra
  // desde la interfaz, se quita con un commit.
  assert.ok(tras.fortinet.fuentes.length >= 1, 'las fuentes del codigo no se tocan');
});

/* ══ API AUTORITATIVA DEL DIMENSIONADOR FORTIGATE (etapa 7, 2026-09-23) ════════════════════
   El navegador calcula mientras se escribe; quien deja SALIR una cotizacion es el servidor,
   con el mismo motor y su propio catalogo. Estas pruebas fijan el contrato que hace que eso
   signifique algo: no confirma otra huella, no confirma otro catalogo, no deja pasar una
   accion que la puerta no admite aunque el cliente la pida, rechaza lo que no conoce, y
   deja rastro de cada accion comercial —solo la huella, nunca el escenario ni el cliente—. */
const EVAL = `${BASE}/api/v1/fortinet/evaluations`;
const CU01 = () => ({
  topologia: { rol: 'spoke', hubs: 2, enlaces: [{ id: 1, tipo: 'DIA', down: 500, overlay: true }] },
  trafico: { interVlanMbps: 200 },
  seguridad: { capa: 'tp', funciones: ['chkAv', 'chkWeb', 'chkSsl'] },
  remoto: { activo: true, metodo: 'ipsec', usuarios: 50, mbps: 100 },
  escala: { usuarios: 300, sesionesPorUsuario: 75, vidaSesionS: 30 },
  politica: { crecimientoPct: 30, techoPct: 70 },
});
const pedir = (cookie, cuerpo) => fetch(EVAL, { method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(cuerpo) });

test('evaluaciones Fortinet: sin sesion no hay API, y con sesion el CU-01 da el 90G listo', async () => {
  assert.strictEqual((await pedir(null, { scenario: CU01() })).status, 401);
  const bruno = await sesionDe('bruno', 'contrasena-de-bruno-larga');
  const res = await pedir(bruno, { scenario: CU01() });
  assert.strictEqual(res.status, 200);
  const r = await res.json();
  assert.strictEqual(r.recommendation.id, 'FortiGate 90G');
  assert.strictEqual(r.selectedValidatedModel.id, 'FortiGate 90G');
  assert.strictEqual(r.bom.modelo, 'FortiGate 90G', 'el BOM sale del modelo validado');
  assert.strictEqual(r.quoteGate, 'READY');
  assert.match(r.scenarioHash, /^sha256:[0-9a-f]{64}$/);
  assert.match(r.datasetVersion, /^fortinet@[0-9a-f]{16}$/);
  assert.ok(!('models' in r), 'la respuesta no arrastra el catalogo entero');
});

test('evaluaciones Fortinet: una accion comercial se confirma, se audita y no se duplica', async () => {
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const base = await (await pedir(ana, { scenario: CU01() })).json();
  const cuerpo = { scenario: CU01(), accion: 'excel', scenarioHash: base.scenarioHash,
    datasetVersion: base.datasetVersion, idempotencyKey: 'prueba-excel-1' };
  const ok = await pedir(ana, cuerpo);
  assert.strictEqual(ok.status, 200);
  const j = await ok.json();
  assert.strictEqual(j.permitida, true);
  assert.strictEqual(j.auditada, true);
  const log = path.join(dir, 'auditoria', 'fortinet.jsonl');
  const lineas = () => fs.readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const ultima = lineas().pop();
  assert.strictEqual(ultima.usuario, 'ana');
  assert.strictEqual(ultima.accion, 'excel');
  assert.strictEqual(ultima.scenarioHash, base.scenarioHash);
  assert.ok(!('scenario' in ultima) && !JSON.stringify(ultima).includes('FortiGate 40F'),
    'se guarda la huella, no el escenario');
  // Doble clic o reintento de red: misma respuesta y ninguna linea nueva.
  const n = lineas().length;
  const otra = await (await pedir(ana, cuerpo)).json();
  assert.strictEqual(otra.repetida, true);
  assert.strictEqual(lineas().length, n);
});

test('evaluaciones Fortinet: huella, catalogo y puerta los decide el servidor, no el cliente', async () => {
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const base = await (await pedir(ana, { scenario: CU01() })).json();
  // Otra huella: el servidor evaluo algo distinto de lo que muestra la pagina.
  const h = await pedir(ana, { scenario: CU01(), accion: 'excel', scenarioHash: 'sha256:otra' });
  assert.strictEqual(h.status, 409);
  assert.strictEqual((await h.json()).codigo, 'huella-distinta');
  // Otro catalogo: la pagina se cargo con cifras que ya no son las vigentes.
  const d = await pedir(ana, { scenario: CU01(), accion: 'excel', datasetVersion: 'fortinet@0000000000000000' });
  assert.strictEqual(d.status, 409);
  assert.strictEqual((await d.json()).codigo, 'dataset-distinto');
  // F01: un override que no cumple cierra la puerta aunque el cliente pida exportar.
  const ov = await pedir(ana, { scenario: CU01(), requestedOverrideModel: 'FortiGate 40F', accion: 'cotizador' });
  assert.strictEqual(ov.status, 409);
  const jov = await ov.json();
  assert.strictEqual(jov.codigo, 'puerta-cerrada');
  assert.strictEqual(jov.quoteGate, 'BLOCKED');
  assert.strictEqual(jov.selectedValidatedModel.id, 'FortiGate 90G', 'el validado sigue siendo el recomendado');
  assert.ok(jov.override && jov.override.elegible === false && jov.override.deficit.some((x) => x.eje === 'tp'));
  // DRAFT: un borrador tecnico sale; el cotizador, no.
  const draft = { ...CU01(), escala: { ...CU01().escala, vdoms: 20 }, seleccion: { manual: 'FortiGate 200G' } };
  assert.strictEqual((await pedir(ana, { scenario: draft, accion: 'cotizador' })).status, 409);
  const borrador = await pedir(ana, { scenario: draft, accion: 'excel-borrador' });
  assert.strictEqual(borrador.status, 200);
  assert.strictEqual((await borrador.json()).quoteGate, 'DRAFT');
  // Base de la comparacion: la huella del escenario limpio sigue confirmandose.
  assert.strictEqual((await pedir(ana, { scenario: CU01(), scenarioHash: base.scenarioHash })).status, 200);
});

test('evaluaciones Fortinet: lo que no esta en el contrato se rechaza, no se ignora', async () => {
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const extra = await pedir(ana, { scenario: CU01(), precioEspecial: 1 });
  assert.strictEqual(extra.status, 400);
  assert.strictEqual((await extra.json()).codigo, 'campo-desconocido');
  const campo = await pedir(ana, { scenario: { ...CU01(), descuento: 30 } });
  assert.strictEqual(campo.status, 400);
  const jc = await campo.json();
  assert.strictEqual(jc.codigo, 'entrada-invalida');
  assert.ok(jc.errores.some((e) => e.campo === 'descuento'));
  const accion = await pedir(ana, { scenario: CU01(), accion: 'enviar-por-correo' });
  assert.strictEqual(accion.status, 400);
  assert.strictEqual((await accion.json()).codigo, 'accion-invalida');
  const rango = await pedir(ana, { scenario: { ...CU01(), remoto: { activo: true, usuarios: -5 } } });
  assert.strictEqual(rango.status, 400, 'un numero fuera de rango es un error con nombre, no un cero');
});

// T62 del prompt maestro de integracion de Starlink LEO (2026-09-24): frontend y backend deben
// producir la MISMA recomendacion para el mismo estado. Aqui se prueba contra el servidor real
// (no una llamada directa a la funcion) porque es la unica forma de probar tambien el muro de
// sesion y el saneo de un payload que llega por HTTP, no ya como objeto JS de confianza.
test('POST /api/sizing/starlink: exige sesion y recalcula igual que el motor del navegador', async () => {
  const sinSesion = await fetch(`${BASE}/api/sizing/starlink`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  });
  assert.strictEqual(sinSesion.status, 401);

  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const entrada = { availability: 99.9, criticality: 'mission', users: 80, applications: { manual: { enabled: true, gb: 900, down: 40, up: 8 } } };
  const res = await fetch(`${BASE}/api/sizing/starlink`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie: ana },
    body: JSON.stringify({ inputs: entrada }),
  });
  assert.strictEqual(res.status, 200);
  const { state, result } = await res.json();

  const engine = require('../public/js/dimensionador-starlink-leo.js');
  const directo = engine.calculate(state, engine.createCatalogs());
  // `calculatedAt` es la hora de cada llamada, no parte de la recomendacion: se compara aparte.
  const sinHora = (r) => { const { calculatedAt, ...resto } = r; return resto; };
  assert.deepStrictEqual(sinHora(result), sinHora(directo), 'el backend debe recalcular, no confiar en lo que enviara el navegador');

  // Un cliente que intente enviar un resultado ya calculado (para inflar una cotizacion) no
  // logra nada: el servidor solo mira `inputs`/`catalogSnapshot` y descarta el resto.
  const intento = await fetch(`${BASE}/api/sizing/starlink`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie: ana },
    body: JSON.stringify({ inputs: entrada, plan: { name: 'Local Priority 50 GB', price: 1 }, status: 'ready' }),
  });
  assert.strictEqual(intento.status, 200);
  assert.deepStrictEqual(sinHora((await intento.json()).result), sinHora(directo), 'los campos ajenos a inputs/catalogSnapshot se ignoran');
});

test('fin de venta: el portal y el cotizador retiran lo que el dimensionador ya no recomienda', async () => {
  // Medido el 2026-10-01: el portal listaba como vigentes ocho equipos con el ultimo pedido
  // vencido y el cotizador ofrecia el ASR 1006-X («hasta EoS Jul-2026») y, por una fila con
  // otro espaciado, el SRX 1500 y el SRX 4100. El dimensionador los degradaba solo; las otras
  // dos pantallas solo miraban `eol`. Se pregunta al servidor de verdad porque el fallo vivia
  // en la FUSION de dos filas del mismo equipo, que solo existe tras la siembra.
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const cot = await (await fetch(`${BASE}/api/cotizador/catalog`, { headers: { cookie: ana } })).json();
  const PR = await (await fetch(`${BASE}/api/catalog`, { headers: { cookie: ana } })).json();
  const enCotizador = new Set(cot.map((c) => c.model));
  const enPortal = new Set(Object.values(PR).flat().map((p) => p.model));

  const { cargar } = require('./ayuda/navegador.js');
  const { FICHA } = cargar('public/js/ficha.js');
  const { normalizarModelo } = require('../server/services/cifrasCotizador');
  const vencidos = ['cisco', 'juniper', 'aruba'].flatMap((v) => require(`../server/seed/legacyData/${v}`).MODELS)
    .filter((m) => m.eolAnnounced && FICHA.rango(m) === 2);
  assert.ok(vencidos.length >= 10, `hay modelos con el ultimo pedido vencido (${vencidos.length})`);
  // La guia de diseno recomendaba el SRX 1500, el SRX 4100 y el EC-XL hasta el 2026-10-02: es la
  // pantalla que mas claramente RECOMIENDA, y la regla no la cubria.
  const guia = await (await fetch(`${BASE}/api/guia/roles`, { headers: { cookie: ana } })).json();
  const enGuia = new Set(Object.values(guia).flat().map((e) => e.model));
  assert.ok(enGuia.size > 30, `la guia sigue recomendando (${enGuia.size} equipos)`);
  // Salvo la unidad REMANUFACTURADA (opcion B del dueno, 2026-10-06): es otro SKU, y la fila
  // sigue si lo cita y la lista del distribuidor lo vende. Tiene que decirlo.
  const reman = new Set(cot.filter((c) => c.reman).map((c) => c.model));
  for (const c of cot.filter((x) => x.reman)) {
    assert.match(c.spec, new RegExp('SKU ' + c.reman + ' \\(Reman\\)'), `${c.model}: la fila Reman dice su SKU`);
  }
  for (const m of vencidos) {
    const clave = normalizarModelo(m.id);
    for (const nombre of [...enCotizador]) {
      if (reman.has(nombre)) continue;
      assert.notStrictEqual(normalizarModelo(nombre), clave, `${nombre} sigue en el cotizador con el ultimo pedido vencido`);
    }
    for (const nombre of [...enPortal]) assert.notStrictEqual(normalizarModelo(nombre), clave, `${nombre} sigue en el portal con el ultimo pedido vencido`);
    for (const nombre of [...enGuia]) assert.notStrictEqual(normalizarModelo(nombre), clave, `${nombre} sigue recomendado en la guia con el ultimo pedido vencido`);
  }
  // Las siete Reman de la linea AOS 8 que la lista vende siguen cotizables, y solo como Reman.
  const csv = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'datasheets', 'aruba-lista-precios-hpe.csv'), 'utf8');
  for (const [modelo, sku] of [['Aruba 7005', 'JW633AR'], ['Aruba 7008', 'JX927AR'], ['Aruba 7010', 'JW678AR'], ['Aruba 7030', 'JW686AR'],
    ['Aruba 7205', 'JW735AR'], ['Aruba 7210', 'JW743AR'], ['Aruba 7220', 'JW751AR']]) {
    assert.ok(new RegExp('^' + sku + ',').test(csv.split('\n').find((l) => l.startsWith(sku + ',')) || ''), `${sku} esta en la lista`);
    const fila = cot.find((c) => c.model === modelo);
    assert.ok(fila && fila.reman === sku, `${modelo}: la Reman ${sku} sigue en el cotizador (${fila ? fila.reman : 'no esta'})`);
  }
  // Un fin de venta anunciado y TODAVIA pedible sigue ofreciendose: hasta esa fecha se pide.
  const anunciados = require('../server/seed/legacyData/cisco').MODELS.filter((m) => m.eolAnnounced && FICHA.rango(m) < 2);
  for (const m of anunciados) assert.ok(enCotizador.has(m.id) || !require('../server/seed/legacyData/cotizadorCatalog').some((r) => r.model === m.id), `${m.id} se puede pedir todavia y desaparecio del cotizador`);
});

test('el cotizador no cita una cifra de rendimiento que el dimensionador contradice', async () => {
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const cot = await (await fetch(`${BASE}/api/cotizador/catalog`, { headers: { cookie: ana } })).json();
  const { contrasteCotizador } = require('../server/services/cifrasCotizador');
  const difieren = contrasteCotizador().flatMap((r) => r.difiere);
  for (const d of difieren) {
    const fila = cot.find((c) => c.model === d.modelo);
    if (!fila) continue; // retirado por fin de venta
    assert.ok(!fila.spec.includes(d.cotizador), `${d.modelo} sigue citando «${d.cotizador}» frente a ${d.dimensionador} Mbps del dimensionador`);
    assert.match(fila.spec, /en revisión/);
    assert.ok(fila.enRevision.some((r) => r.cotizador === d.cotizador), `${d.modelo} no explica la cifra retirada`);
  }
  // Lo que coincide se cita intacto: Cisco quedo alineado con sus fichas el 2026-10-01.
  const c8200 = cot.find((c) => c.model === 'Catalyst 8200');
  assert.strictEqual(c8200.spec, '1 Gbps FWD · IPsec 900 Mbps · SD-WAN nativo · 2 NIM');
  assert.strictEqual(c8200.enRevision, undefined);
  // Y desde el 2026-10-03 la cifra de una linea con pareja la pone el dimensionador, asi que lo
  // servido no puede quedar en revision salvo que el relleno la escriba mal: una escala de Nokia
  // olvidada citaria «6.4 Gbps» por 6,4 Tbps, y esto es lo que lo dice sobre el catalogo real.
  assert.deepStrictEqual(cot.filter((c) => c.enRevision && !difieren.some((d) => d.modelo === c.model)).map((c) => `${c.model}: ${c.spec}`), [],
    'el relleno del hueco escribe una cifra que el dimensionador contradice');
});

test('el cotizador cita el texto de su propio catalogo, no el de otra pantalla', async () => {
  // Medido el 2026-10-02: seis lineas de Huawei salian con el texto de la guia de diseno, y la del
  // NE8000 M8 citaba «1086 Mpps», que ningun documento respalda. La guia nombraba «NetEngine
  // NE8000 M8» lo que el catalogo guarda como «NE8000 M8»; la siembra creaba un segundo producto
  // con el texto de la guia, y el cotizador, que casa por nombre normalizado, se quedaba con el.
  // El informe de `npm run catalogo` no podia verlo: lee el archivo, y el archivo estaba bien.
  // Por eso se pregunta al servidor: el fallo solo existe tras la siembra.
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const cot = await (await fetch(`${BASE}/api/cotizador/catalog`, { headers: { cookie: ana } })).json();
  const archivo = require('../server/seed/legacyData/cotizadorCatalog');
  // Desde el 2026-10-03 el archivo deja un hueco donde la cifra la pone el dimensionador: el texto
  // que se cita es el del archivo con esos huecos rellenos, y ningun hueco llega a la pantalla.
  const { rellenarSpec, indiceDimensionador, normalizarModelo } = require('../server/services/cifrasCotizador');
  const indice = indiceDimensionador();
  const escrito = (r) => {
    const vendor = r.vendor.toLowerCase();
    return rellenarSpec(r.spec, (indice[vendor] && indice[vendor].get(normalizarModelo(r.model))) || null, vendor).spec;
  };
  assert.deepStrictEqual(cot.filter((f) => /[{}]/.test(f.spec)).map((f) => f.spec), [], 'un hueco llega al cotizador');
  assert.ok(archivo.filter((r) => /\{\w+\}/.test(r.spec)).length > 100, 'el archivo ya no deja huecos: esta prueba no mira lo que dice mirar');
  let comparadas = 0;
  for (const fila of cot) {
    if (fila.enRevision) continue; // la cifra en disputa se retira: lo prueba el caso anterior
    const propia = archivo.find((r) => r.vendor.toLowerCase() === fila.vendor.toLowerCase() && r.model === fila.model);
    assert.ok(propia, `${fila.model} no esta en cotizadorCatalog.js`);
    assert.strictEqual(fila.spec, escrito(propia), `${fila.model} cita otro texto que el de su catalogo`);
    comparadas++;
  }
  assert.ok(comparadas > 100, `solo se compararon ${comparadas} lineas`);
  // Y la guia apunta a ese mismo equipo, no a una copia con su propio texto.
  const guia = await (await fetch(`${BASE}/api/guia/roles`, { headers: { cookie: ana } })).json();
  const m8 = Object.values(guia).flat().find((e) => /NE8000 M8$/.test(e.model));
  assert.strictEqual(m8.spec, escrito(archivo.find((r) => r.model === 'NetEngine NE8000 M8')));
  assert.deepStrictEqual(Object.values(guia).flat().filter((e) => /[{}]/.test(e.spec)).map((e) => e.spec), [], 'un hueco llega a la guia');
});

test('el portal sirve las cifras del dimensionador, en la unidad que lee la calculadora', async () => {
  // Medido el 2026-10-02 en el navegador: la calculadora trataba un 7250 IXR-e de 300 Gbps como uno
  // de 300 Mbps, porque la siembra le fundia al portal la capacidad de Nokia en Gbps; y apartaba el
  // SRX 345 «porque el catalogo no publica su IPsec», porque «SRX 345» no casaba con «SRX345».
  // Ninguna de las dos cosas esta en un archivo: solo existen tras la siembra.
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const PR = await (await fetch(`${BASE}/api/catalog`, { headers: { cookie: ana } })).json();
  const { contrastePortal } = require('../server/services/cifrasCotizador');
  const r = contrastePortal(PR);
  const malas = r.flatMap((g) => [
    ...g.difiere.map((x) => `${g.grupo} · ${x.modelo}: ${x.campo} ${x.portal} frente a ${x.dimensionador} Mbps`),
    ...g.calla.map((x) => `${g.grupo} · ${x.modelo}: el portal no da ${x.destino} y el dimensionador si`),
    ...g.ilegible.map((x) => `${g.grupo} · ${x.modelo}: ${x.campo} «${x.texto}» no se sabe leer`),
  ]);
  assert.deepStrictEqual(malas, [], 'el portal y el dimensionador no dicen lo mismo (npm run catalogo)');
  assert.ok(r.reduce((n, g) => n + g.comparadas, 0) > 300, 'se compararon pocas cifras: el contraste no esta mirando');

  const nokia = require('../server/seed/legacyData/nokia');
  const ixr = PR.nokia.find((p) => p.model === '7250 IXR-e');
  assert.strictEqual(ixr.cap, nokia.MODELS_ROUTER.find((m) => m.id === '7250 IXR-e').cap * 1000, 'la capacidad de Nokia llega en Mbps');
  const juniper = require('../server/seed/legacyData/juniper').MODELS.find((m) => m.id === 'SRX345');
  const srx = PR.juniper.find((p) => p.model === 'SRX 345');
  assert.deepStrictEqual([srx.vpn, srx.ips, srx.atp], [juniper.vpn, juniper.ips, juniper.atp], 'la fila del portal recibe las cifras de su gemela');
  // Y la gemela no aparece dos veces en el dimensionador: conserva su categoria del portal.
  const dim = await (await fetch(`${BASE}/api/dimensionador/juniper`, { headers: { cookie: ana } })).json();
  assert.deepStrictEqual(dim.models.filter((m) => /^SRX ?345$/.test(m.id)).map((m) => m.id), ['SRX345']);
});

test('la guia de diseno pinta el texto del catalogo y no cita ni recomienda lo que el catalogo descarta', async () => {
  const ana = await sesionDe('ana', 'contrasena-de-ana-larga');
  const guia = await (await fetch(`${BASE}/api/guia/roles`, { headers: { cookie: ana } })).json();
  const cot = await (await fetch(`${BASE}/api/cotizador/catalog`, { headers: { cookie: ana } })).json();
  const archivo = require('../server/seed/legacyData/guiaRoles');
  const { contrasteGuia, normalizarModelo } = require('../server/services/cifrasCotizador');
  const servidas = Object.values(guia).flat();

  // Cada rol conserva sus fabricantes: retirar un equipo fuera de venta sin sustituirlo dejo el
  // rol de NGFW sin FortiGate ni SRX hasta el 2026-10-02.
  for (const [rol, lista] of Object.entries(archivo)) {
    assert.deepStrictEqual((guia[rol] || []).map((e) => e.v), lista.map((e) => e.v), `${rol}: la guia perdio una recomendacion`);
  }
  // Ninguna ficha en blanco, y la del catalogo es la misma que cita el cotizador, regla incluida.
  for (const e of servidas) {
    assert.ok(String(e.spec).trim(), `${e.model} se recomienda sin texto`);
    const linea = cot.find((c) => c.vendor === e.v && normalizarModelo(c.model) === normalizarModelo(e.model));
    if (linea) assert.strictEqual(e.spec, linea.spec, `${e.model}: la guia y el cotizador citan textos distintos`);
  }
  // El texto propio del archivo solo lo llevan los equipos fuera del catalogo, y es el que se pinta.
  for (const [rol, lista] of Object.entries(archivo)) {
    for (const e of lista) {
      const s = guia[rol].find((x) => x.model === e.model || normalizarModelo(x.model) === normalizarModelo(e.model));
      assert.strictEqual(Boolean(s.soloGuia), e.spec !== undefined, `${rol} · ${e.model}: ${s.soloGuia ? 'no casa con el catalogo' : 'casa con el catalogo y trae un texto que no se ve'}`);
      if (e.spec !== undefined) assert.strictEqual(s.spec, e.spec);
    }
  }
  // Lo que el servidor deja pasar se cuenta con la misma regla que el informe. Fuera de venta, sin
  // mirar la base: un equipo del portal que el portal ya no sirve (el portal retira lo que esta
  // fuera de venta, conjunto de Fortinet incluido) o uno cuyo ultimo pedido vencio (`ficha.js`).
  const PR = await (await fetch(`${BASE}/api/catalog`, { headers: { cookie: ana } })).json();
  const grupo = (g) => (g === 'hw_ar' || g === 'hw_wan' ? 'huawei' : g);
  const claves = (obj) => new Set(Object.entries(obj).flatMap(([g, filas]) => filas.map((f) => `${grupo(g)}::${normalizarModelo(f.model)}`)));
  const vigentes = claves(PR);
  const delPortal = claves(require('../server/seed/legacyData/indexPR'));
  const { FICHA } = require('./ayuda/navegador.js').cargar('public/js/ficha.js');
  const fuera = (vendor, m) => {
    const clave = `${vendor}::${normalizarModelo(m.id)}`;
    return (delPortal.has(clave) && !vigentes.has(clave)) || FICHA.rango(m) === 2;
  };
  assert.ok(fuera('fortinet', { id: 'FortiGate 600F' }) && fuera('cisco', { id: 'ASR 1006-X', eolAnnounced: { lastOrder: '2026-07-31' } }),
    'la regla de fin de venta de esta prueba no reconoce los casos conocidos');
  const r = contrasteGuia(guia, { fuera });
  assert.deepStrictEqual(r.enRevision.filter((x) => x.sinRetirar), [], 'la guia cita una cifra que el dimensionador contradice');
  assert.deepStrictEqual(r.altRetiradas.filter((x) => x.sinRetirar), [], 'la guia recomienda como alternativa un equipo fuera de venta');
  assert.ok(r.comparadas > 50, `solo se contrastaron ${r.comparadas} cifras de la guia`);
  // La alternativa que nombra un equipo del dimensionador sale con la cifra de ese equipo, puesta
  // por el servidor: ningun hueco llega a la pantalla y ninguno se queda «sin dato».
  assert.deepStrictEqual(servidas.filter((e) => /[{}]/.test(e.alt)).map((e) => e.alt), [], 'un hueco llega a la pantalla');
  assert.deepStrictEqual(r.altSinCifra, [], 'una alternativa perdio la cifra que el archivo le dejaba al dimensionador');
  assert.ok(r.altDelCatalogo > 25, `solo ${r.altDelCatalogo} alternativas llevan la cifra del dimensionador`);
});
