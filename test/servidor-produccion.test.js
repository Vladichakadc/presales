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
  const admin = await fetch(`${BASE}/api/sync/analyze`, { method: 'POST', headers: { cookie: ana } });
  // Pasa la autorizacion y choca con el bloqueo de produccion, que es el siguiente muro.
  assert.strictEqual(admin.status, 503);
  const cuerpo = await admin.json();
  assert.match(cuerpo.error, /producci/);
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
});
