// Autenticación de la herramienta: sesión firmada por cookie, con usuarios y roles.
//
// DE PERÍMETRO A IDENTIDAD. Durante la primera etapa hubo una sola credencial compartida:
// lo que se protegía era que precios, SKUs y márgenes no quedaran legibles en la web
// abierta, no quién del equipo consultó qué. La cabecera de este archivo declaraba la
// contrapartida —sin trazabilidad por persona, y dar de baja a alguien obligaba a rotar la
// contraseña de todos— y decía cuál sería el cambio: usuarios y autorización por rol. Es
// esto. El almacén vive en server/usuarios.js; aquí queda la sesión y el freno a la fuerza
// bruta.
//
// LA SESIÓN AHORA DICE QUIÉN. El token pasa de "expiración.firma" a "expiración.id.firma",
// y la clave con la que se firma se deriva de la credencial DE ESE USUARIO. Dos
// consecuencias buscadas: la petición sabe qué usuario y qué rol tiene delante, y cambiar
// una contraseña invalida solo las sesiones de esa persona, no las del resto.
//
// DÓNDE VIVEN LAS CREDENCIALES. En AUTH_STATE_DIR, un volumen persistente en Railway — no
// en la base SQLite, que es efímera y se resiembra en cada despliegue. Borrar ese archivo
// sigue siendo el restablecimiento por administrador: al no existir, el almacén se
// reconstruye desde AUTH_PASSWORD.
//
// SIN DEPENDENCIAS NUEVAS. scrypt y HMAC vienen en el módulo `crypto` de Node; una sesión
// firmada sin estado evita además tener que montar un almacén de sesiones.

const crypto = require('crypto');

const usuarios = require('./usuarios');

const STATE_FILE = usuarios.USERS_FILE;

const USER = process.env.AUTH_USER || 'presales';

// Si no se fija SESSION_SECRET, se genera uno al arrancar: las sesiones no sobreviven a un
// reinicio, lo cual es una molestia menor y no un problema de seguridad. Fijarlo en Railway
// mantiene la sesión abierta entre despliegues.
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const SESSION_HOURS = 12;
const COOKIE_NAME = 'presales_sesion';

// Fuerza bruta: dos frenos en capas, porque el conteo por IP no basta.
//
// La identidad por IP sale de X-Forwarded-For, cabecera que el cliente puede escribir.
// Detrás del proxy de Railway no se puede saber con certeza cuántos saltos descartar, y se
// comprobó en producción que rotando la cabecera se obtenía cuota nueva en cada intento.
// Por eso el freno que sostiene la defensa no depende de la IP.
//
// Se descartó un tope global duro: negaba también el login correcto, así que cualquiera
// podía dejar al equipo fuera mandando basura cada 15 minutos. En su lugar hay un retardo
// global progresivo, que nunca niega el acceso a quien tiene la credencial pero vuelve
// inviable el barrido — con el retardo al máximo quedan menos de dos intentos por segundo
// contra una contraseña aleatoria de 28 caracteres.
//
// ponytail: los contadores son por proceso; con varias réplicas hay que moverlos a un store
// compartido o cada instancia concede su propia cuota.
const MAX_INTENTOS = 8;             // por IP, cuando la IP es distinguible
const RETARDO_DESDE = 10;           // fallos globales recientes a partir de los cuales se frena
const RETARDO_MAX_MS = 2000;
const VENTANA_MS = 15 * 60 * 1000;
const intentos = new Map();
let globalFallos = { n: 0, hasta: 0 };

/* ── Credenciales ────────────────────────────────────────────────────────────── */

// El hashing, el almacén y la verificación viven en usuarios.js. Aquí quedan solo los
// envoltorios que usa el resto del servidor, para no tener dos sitios que sepan comparar
// una contraseña — que es como acaban divergiendo.

// Devuelve el usuario autenticado, o null. No lanza: un login fallido no es un error.
function comprobarCredenciales(usuario, password) {
  if (typeof usuario !== 'string' || typeof password !== 'string') return null;
  return usuarios.verificar(usuario, password);
}

// Hay con qué autenticar a alguien. Es la comprobación de arranque: en producción el
// servidor se niega a levantarse si esto es falso, en vez de servir precios sin puerta.
const hashVigente = () => usuarios.hayAdministrador();

// Sigue en uso la contraseña semilla de AUTH_PASSWORD (para avisarlo en la UI).
function usandoSemilla() {
  return usuarios.listar().some((u) => u.desdeSemilla);
}

const cambiarPassword = (id, actual, nueva) => usuarios.cambiarPassword(id, actual, nueva);
const crearUsuario = (datos) => usuarios.crear(datos);

/* ── Sesión ──────────────────────────────────────────────────────────────────── */

// Cookie de sesión sin estado: "expiracion.id.firma". Antes no llevaba datos porque había
// un solo usuario; ahora lleva a quién pertenece, que es lo que permite autorizar por rol
// sin montar un almacén de sesiones.
//
// La clave de firma se deriva de SESSION_SECRET *y de la credencial de ese usuario*. Es lo
// que hace que cambiar una contraseña invalide de verdad sus sesiones: borrar la cookie
// solo funciona si el cliente coopera, y un token robado seguiría siendo válido hasta
// expirar. Al moverse la huella, sus firmas anteriores dejan de validar — y solo las suyas,
// las de los demás usuarios siguen en pie.
function claveSesion(usuario) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(usuarios.huella(usuario)).digest();
}

function firmar(valor, usuario) {
  return crypto.createHmac('sha256', claveSesion(usuario)).update(valor).digest('base64url');
}

function crearToken(usuario) {
  const cuerpo = `${Date.now() + SESSION_HOURS * 3600 * 1000}.${usuario.id}`;
  return `${cuerpo}.${firmar(cuerpo, usuario)}`;
}

// Devuelve el usuario del token, o null. Se valida en este orden a propósito: primero que
// el id exista, después la firma, y solo al final la expiración — así una firma inválida
// nunca llega a tratarse como sesión, ni siquiera vencida.
function usuarioDeToken(token) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [exp, id, firma] = partes;
  const usuario = usuarios.porId(id);
  if (!usuario || usuario.activo === false) return null;
  const esperada = firmar(`${exp}.${id}`, usuario);
  if (firma.length !== esperada.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return null;
  if (!(Number(exp) > Date.now())) return null;
  return usuario;
}

function leerCookie(req, nombre) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const parte of raw.split(';')) {
    const idx = parte.indexOf('=');
    if (idx === -1) continue;
    if (parte.slice(0, idx).trim() === nombre) return decodeURIComponent(parte.slice(idx + 1));
  }
  return null;
}

function ponerCookieSesion(res, usuario) {
  const attrs = [
    `${COOKIE_NAME}=${crearToken(usuario)}`,
    'Path=/',
    'HttpOnly',                       // inaccesible desde JavaScript: acota el impacto de un XSS
    'SameSite=Strict',                // el navegador no la envia desde otro sitio: cubre CSRF
    `Max-Age=${SESSION_HOURS * 3600}`,
  ];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure'); // solo por HTTPS
  res.append('Set-Cookie', attrs.join('; '));
}

function borrarCookieSesion(res) {
  const attrs = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure');
  res.append('Set-Cookie', attrs.join('; '));
}

// Quien viene en esta peticion, o null. El muro de auth de server.js lo cuelga en req.usuario
// para que ninguna ruta tenga que volver a mirar la cookie.
const usuarioDeSesion = (req) => usuarioDeToken(leerCookie(req, COOKIE_NAME));

const haySesion = (req) => usuarioDeSesion(req) !== null;

/* ── Límite de intentos ──────────────────────────────────────────────────────── */

// Se usa req.ip, que Express calcula segun 'trust proxy' tomando el salto no confiable
// mas cercano al proxy. Leer el primer valor de X-Forwarded-For a mano seria explotable:
// los proxies AÑADEN a esa cabecera, asi que el primer valor lo pone el cliente y bastaria
// con rotar cabeceras falsas para tener cuota nueva en cada intento y anular el limite.
function claveCliente(req) {
  return req.ip || req.socket.remoteAddress || 'desconocido';
}

function intentosRestantes(req) {
  const ahora = Date.now();
  const reg = intentos.get(claveCliente(req));
  return (!reg || ahora > reg.hasta) ? MAX_INTENTOS : Math.max(0, MAX_INTENTOS - reg.n);
}

// Retardo global: no niega el intento, solo lo encarece. Se aplica antes de comprobar la
// credencial para que tambien frene al atacante que rota la cabecera X-Forwarded-For.
function retardoGlobalMs() {
  if (Date.now() > globalFallos.hasta) return 0;
  const exceso = globalFallos.n - RETARDO_DESDE;
  if (exceso <= 0) return 0;
  return Math.min(RETARDO_MAX_MS, exceso * 150);
}

const esperarRetardo = () => new Promise((r) => setTimeout(r, retardoGlobalMs()));

function registrarFallo(req) {
  const ahora = Date.now();
  const k = claveCliente(req);
  const reg = intentos.get(k);
  if (!reg || ahora > reg.hasta) intentos.set(k, { n: 1, hasta: ahora + VENTANA_MS });
  else reg.n += 1;

  if (ahora > globalFallos.hasta) globalFallos = { n: 1, hasta: ahora + VENTANA_MS };
  else globalFallos.n += 1;

  // Deja rastro de la IP que resolvio Express: si en los logs sale siempre la misma o
  // siempre distinta, se sabe si el limite por IP aporta algo detras de este proxy.
  console.warn(`[auth] intento fallido · ip=${k} · fallos=${globalFallos.n} · retardo=${retardoGlobalMs()}ms`);
}

// El acierto limpia la cuota de esa IP y afloja la global, para que un intento legitimo
// no quede penalizado por el ruido de fondo de un atacante.
function limpiarIntentos(req) {
  intentos.delete(claveCliente(req));
  globalFallos = { n: 0, hasta: 0 };
}

// Se purgan las entradas vencidas cada 15 min para que el Map no crezca sin limite bajo
// un ataque distribuido. unref() evita que este temporizador impida cerrar el proceso.
setInterval(() => {
  const ahora = Date.now();
  for (const [k, v] of intentos) if (ahora > v.hasta) intentos.delete(k);
}, VENTANA_MS).unref();

module.exports = {
  USER, COOKIE_NAME, MAX_INTENTOS,
  comprobarCredenciales, cambiarPassword, crearUsuario, usandoSemilla, hashVigente,
  ponerCookieSesion, borrarCookieSesion, haySesion, usuarioDeSesion,
  ROLES: usuarios.ROLES, listarUsuarios: usuarios.listar, permiso: usuarios.permiso,
  intentosRestantes, registrarFallo, limpiarIntentos, esperarRetardo, retardoGlobalMs,
  STATE_FILE,
};
