'use strict';
// La cookie de sesion, de extremo a extremo: se emite, se lee, se rechaza manipulada.
//
// EL TOKEN LLEVA IDENTIDAD Y SE FIRMA CON LA CREDENCIAL DE ESA PERSONA. Paso de
// `expiracion.firma` a `expiracion.id.firma` cuando la herramienta dejo de tener una unica
// credencial compartida. La consecuencia que hay que proteger con una prueba es la de la
// ultima: cambiar una contrasena invalida las sesiones DE ESE USUARIO y no las del resto.
// Si la clave de firma fuera global, cambiar la propia echaria a todo el mundo.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { estadoLimpio } = require('./ayuda/navegador');

const DIR = estadoLimpio('sesion');
process.env.SESSION_SECRET = 'secreto-de-prueba';
delete process.env.AUTH_PASSWORD;

// Dos usuarios reales, escritos antes de cargar el modulo: asi no se migra desde semilla.
const usuariosMod = require('../server/usuarios');
const estadoInicial = {
  version: 1,
  usuarios: [
    { id: 'u1', usuario: 'ana', nombre: 'Ana', rol: 'admin', activo: true,
      passwordHash: usuariosMod.hashPassword('contrasena-de-ana-larga') },
    { id: 'u2', usuario: 'bruno', nombre: 'Bruno', rol: 'consulta', activo: true,
      passwordHash: usuariosMod.hashPassword('contrasena-de-bruno-larga') },
  ],
};
fs.writeFileSync(path.join(DIR, 'usuarios.json'), JSON.stringify(estadoInicial));

const auth = require('../server/auth');

// Dobles minimos de req/res: lo unico que auth.js toca de ellos es la cabecera de cookie.
function respuesta() {
  const cabeceras = {};
  const guardar = (k, v) => { cabeceras[k] = v; };
  return { cabeceras, setHeader: guardar, append: guardar, getHeader: (k) => cabeceras[k] };
}
function peticionCon(cookie) {
  return { headers: cookie ? { cookie } : {}, path: '/', originalUrl: '/' };
}
function cookieDe(res) {
  const puesta = res.cabeceras['Set-Cookie'];
  const cruda = Array.isArray(puesta) ? puesta[0] : puesta;
  return cruda.split(';')[0];
}
function sesionDe(usuario) {
  const res = respuesta();
  auth.ponerCookieSesion(res, usuario);
  return cookieDe(res);
}

const ana = usuariosMod.porId('u1');
const bruno = usuariosMod.porId('u2');

test('una sesion recien emitida identifica a su usuario', () => {
  const req = peticionCon(sesionDe(ana));
  assert.strictEqual(auth.usuarioDeSesion(req).id, 'u1');
  assert.strictEqual(auth.haySesion(req), true);
});

test('sin cookie no hay sesion', () => {
  assert.strictEqual(auth.usuarioDeSesion(peticionCon(null)), null);
  assert.strictEqual(auth.haySesion(peticionCon(null)), false);
});

test('la cookie de sesion no es accesible desde JavaScript ni viaja fuera del sitio', () => {
  const res = respuesta();
  auth.ponerCookieSesion(res, ana);
  const cruda = String(res.cabeceras['Set-Cookie']);
  assert.match(cruda, /HttpOnly/i, 'sin HttpOnly, un XSS se lleva la sesion');
  assert.match(cruda, /SameSite/i);
});

test('una firma manipulada se rechaza', () => {
  const cookie = sesionDe(ana);
  const roto = cookie.slice(0, -3) + (cookie.slice(-3) === 'AAA' ? 'BBB' : 'AAA');
  assert.strictEqual(auth.usuarioDeSesion(peticionCon(roto)), null);
});

test('no se puede cambiar de usuario editando el id del token', () => {
  // El id va dentro de lo firmado; cambiarlo invalida la firma. Sin esto, cualquiera con
  // una sesion de consulta se convertiria en administrador editando una cookie.
  const cookie = sesionDe(bruno);
  const [nombre, valor] = cookie.split('=');
  const [exp, , firma] = valor.split('.');
  const suplantada = `${nombre}=${exp}.u1.${firma}`;
  assert.strictEqual(auth.usuarioDeSesion(peticionCon(suplantada)), null);
});

test('un token vencido se rechaza aunque la firma sea buena', () => {
  const cookie = sesionDe(ana);
  const [nombre, valor] = cookie.split('=');
  const partes = valor.split('.');
  // Se firma un cuerpo caducado con la clave real: no hay atajo, hay que reconstruirlo.
  const crypto = require('crypto');
  const cuerpo = `${Date.now() - 1000}.u1`;
  const clave = crypto.createHmac('sha256', process.env.SESSION_SECRET)
    .update(usuariosMod.huella(ana)).digest();
  const firma = crypto.createHmac('sha256', clave).update(cuerpo).digest('base64url');
  assert.strictEqual(auth.usuarioDeSesion(peticionCon(`${nombre}=${cuerpo}.${firma}`)), null);
  assert.strictEqual(partes.length, 3, 'el token es expiracion.id.firma');
});

test('cambiar la contrasena de Ana invalida SU sesion y no la de Bruno', () => {
  const deAna = peticionCon(sesionDe(ana));
  const deBruno = peticionCon(sesionDe(bruno));
  assert.strictEqual(auth.usuarioDeSesion(deAna).id, 'u1');
  assert.strictEqual(auth.usuarioDeSesion(deBruno).id, 'u2');

  const r = usuariosMod.cambiarPassword('u1', 'contrasena-de-ana-larga', 'la-nueva-de-ana-larga');
  assert.strictEqual(r.ok, true);

  assert.strictEqual(auth.usuarioDeSesion(deAna), null,
    'la clave de firma se deriva de la credencial de Ana: al cambiarla, su token deja de valer');
  assert.strictEqual(auth.usuarioDeSesion(deBruno).id, 'u2',
    'si esto falla, la clave de firma es global y cambiar una contrasena echa a todo el mundo');
});

test('cerrar sesion borra la cookie', () => {
  const res = respuesta();
  auth.borrarCookieSesion(res);
  assert.match(String(res.cabeceras['Set-Cookie']), /=;|Max-Age=0|Expires=/i);
});

test('el freno a la fuerza bruta: cuota por IP y retardo global que la rotacion no evita', () => {
  // Dos capas, y hacen falta las dos. La cuota por IP corta al que insiste desde un sitio;
  // el retardo global existe porque detras del proxy de Railway se comprobo que rotando la
  // cabecera X-Forwarded-For se conseguia cuota nueva en cada intento. El retardo no depende
  // de la IP, asi que rotarla no lo esquiva — solo empieza a partir de RETARDO_DESDE fallos.
  const desde = (ip) => ({ ip, headers: {}, socket: { remoteAddress: ip } });
  const atacante = desde('203.0.113.9');

  const antes = auth.intentosRestantes(atacante);
  auth.registrarFallo(atacante);
  assert.strictEqual(auth.intentosRestantes(atacante), antes - 1);
  assert.strictEqual(auth.intentosRestantes(desde('198.51.100.7')), auth.MAX_INTENTOS,
    'la cuota es por IP: fallar desde una no debe gastar la de otra');

  // Se agota la cuota y se sigue fallando desde IPs distintas, como haria quien rota.
  for (let i = 0; i < auth.MAX_INTENTOS; i += 1) auth.registrarFallo(atacante);
  assert.strictEqual(auth.intentosRestantes(atacante), 0);
  for (let i = 0; i < 12; i += 1) auth.registrarFallo(desde(`198.51.100.${i}`));

  const nueva = desde('192.0.2.55');
  assert.strictEqual(auth.intentosRestantes(nueva), auth.MAX_INTENTOS,
    'una IP nueva empieza con cuota entera: por eso sola no basta');
  assert.ok(auth.retardoGlobalMs() > 0,
    'y por eso el retardo global es el que de verdad encarece rotar la IP');

  auth.limpiarIntentos(atacante);
  assert.strictEqual(auth.intentosRestantes(atacante), auth.MAX_INTENTOS,
    'un inicio de sesion correcto devuelve la cuota');
});
