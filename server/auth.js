// Autenticación de la herramienta: un único usuario compartido, con sesión por cookie.
//
// POR QUÉ UN SOLO USUARIO. Lo que se protege es que precios, SKUs y márgenes no queden
// legibles en la web abierta, no quién del equipo consultó qué. Es control de perímetro,
// no de identidad. La contrapartida, asumida a conciencia: no hay trazabilidad por persona
// y dar de baja a alguien obliga a rotar la contraseña de todas. Si eso deja de ser
// aceptable, el cambio es introducir una tabla de usuarios y autorización por rol.
//
// DÓNDE VIVE LA CONTRASEÑA. En un archivo JSON dentro de AUTH_STATE_DIR (un volumen
// persistente en Railway). Si ese archivo no existe, se cae a la semilla de AUTH_PASSWORD,
// que es también el mecanismo de restablecimiento por administrador: borrar el archivo
// devuelve el acceso a la contraseña de la variable de entorno. La base del catálogo sigue
// siendo efímera y en otra ruta, para que cada despliegue la resiembre desde los seeds.
//
// SIN DEPENDENCIAS NUEVAS. scrypt y HMAC vienen en el módulo `crypto` de Node; una sesión
// firmada sin estado evita además tener que montar un almacén de sesiones.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STATE_DIR = process.env.AUTH_STATE_DIR || path.join(__dirname, '..', '.auth');
const STATE_FILE = path.join(STATE_DIR, 'credentials.json');

const USER = process.env.AUTH_USER || 'presales';
const SEED_PASSWORD = process.env.AUTH_PASSWORD || '';

// Si no se fija SESSION_SECRET, se genera uno al arrancar: las sesiones no sobreviven a un
// reinicio, lo cual es una molestia menor y no un problema de seguridad. Fijarlo en Railway
// mantiene la sesión abierta entre despliegues.
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const SESSION_HOURS = 12;
const COOKIE_NAME = 'presales_sesion';

// Fuerza bruta: 8 intentos por IP en 15 minutos. En memoria y por proceso, que es suficiente
// con una sola instancia. ponytail: si algún día hay varias réplicas, esto debe ir a un store
// compartido o el atacante multiplica su cuota por el número de instancias.
const MAX_INTENTOS = 8;
const VENTANA_MS = 15 * 60 * 1000;
const intentos = new Map();

/* ── Contraseñas ─────────────────────────────────────────────────────────────── */

// Parámetros de scrypt recomendados por OWASP (N=2^15, r=8, p=1). Se definen una sola vez
// porque cifrar y verificar con parámetros distintos produce hashes que nunca coinciden.
// maxmem es obligatorio: scrypt necesita ~128*N*r = 32 MB y el techo por defecto de Node es
// justo 32 MB, así que sin subirlo lanza ERR_CRYPTO_INVALID_SCRYPT_PARAMS.
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

// Devuelve "salt:hash" en hexadecimal.
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, KEYLEN, SCRYPT);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [saltHex, hashHex] = stored.split(':');
  let esperado;
  try {
    esperado = Buffer.from(hashHex, 'hex');
  } catch {
    return false;
  }
  if (esperado.length !== KEYLEN) return false;
  const calculado = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), KEYLEN, SCRYPT);
  return crypto.timingSafeEqual(calculado, esperado);
}

function leerEstado() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null; // no existe todavia, o quedo ilegible: se usa la semilla
  }
}

function guardarEstado(estado) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  // mode 0600: el archivo guarda el hash de la contrasena, no debe ser legible por otros.
  fs.writeFileSync(STATE_FILE, JSON.stringify(estado, null, 2), { mode: 0o600 });
}

// El hash vigente: el del archivo si existe, o el derivado de la semilla si no.
function hashVigente() {
  const estado = leerEstado();
  if (estado && estado.passwordHash) return estado.passwordHash;
  return SEED_PASSWORD ? hashPassword(SEED_PASSWORD) : null;
}

// Indica si sigue en uso la contrasena semilla (para avisar en la UI que conviene cambiarla).
function usandoSemilla() {
  const estado = leerEstado();
  return !(estado && estado.passwordHash);
}

function comprobarCredenciales(usuario, password) {
  const estado = leerEstado();
  const hash = estado && estado.passwordHash;

  if (hash) {
    // Se comparan ambos factores siempre, sin cortocircuito, para no filtrar por tiempo
    // si el usuario existe o no.
    const usuarioOk = crypto.timingSafeEqual(
      crypto.createHash('sha256').update(String(usuario)).digest(),
      crypto.createHash('sha256').update(USER).digest(),
    );
    const passOk = verifyPassword(password, hash);
    return usuarioOk && passOk;
  }

  if (!SEED_PASSWORD) return false;
  const usuarioOk = crypto.timingSafeEqual(
    crypto.createHash('sha256').update(String(usuario)).digest(),
    crypto.createHash('sha256').update(USER).digest(),
  );
  const passOk = crypto.timingSafeEqual(
    crypto.createHash('sha256').update(String(password)).digest(),
    crypto.createHash('sha256').update(SEED_PASSWORD).digest(),
  );
  return usuarioOk && passOk;
}

function cambiarPassword(actual, nueva) {
  if (!comprobarCredenciales(USER, actual)) return { ok: false, error: 'La contraseña actual no es correcta.' };
  if (typeof nueva !== 'string' || nueva.length < 12) {
    return { ok: false, error: 'La nueva contraseña debe tener al menos 12 caracteres.' };
  }
  if (nueva.length > 200) return { ok: false, error: 'La contraseña es demasiado larga.' };
  guardarEstado({ passwordHash: hashPassword(nueva), actualizada: new Date().toISOString() });
  return { ok: true };
}

/* ── Sesión ──────────────────────────────────────────────────────────────────── */

// Cookie de sesión sin estado: "expiracion.firma". No lleva datos porque hay un solo
// usuario; la firma HMAC es lo unico que hace falta validar.
//
// La clave de firma se deriva de SESSION_SECRET *y de la credencial vigente*. Es lo que
// hace que cambiar la contraseña invalide de verdad las sesiones ya emitidas: borrar la
// cookie solo funciona si el cliente coopera, y un token robado seguiria siendo valido
// hasta su expiracion. Al mover la clave, todas las firmas anteriores dejan de validar.
//
// La huella debe ser determinista, asi que no puede usar hashPassword: ese genera un salt
// aleatorio en cada llamada y ninguna firma volveria a validar.
function huellaCredencial() {
  const estado = leerEstado();
  const base = (estado && estado.passwordHash) || `semilla:${SEED_PASSWORD}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function claveSesion() {
  return crypto.createHmac('sha256', SESSION_SECRET).update(huellaCredencial()).digest();
}

function firmar(valor) {
  return crypto.createHmac('sha256', claveSesion()).update(valor).digest('base64url');
}

function crearToken() {
  const exp = String(Date.now() + SESSION_HOURS * 3600 * 1000);
  return `${exp}.${firmar(exp)}`;
}

function tokenValido(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const i = token.lastIndexOf('.');
  const exp = token.slice(0, i);
  const firma = token.slice(i + 1);
  const esperada = firmar(exp);
  if (firma.length !== esperada.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return false;
  return Number(exp) > Date.now();
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

function ponerCookieSesion(res) {
  const attrs = [
    `${COOKIE_NAME}=${crearToken()}`,
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

const haySesion = (req) => tokenValido(leerCookie(req, COOKIE_NAME));

/* ── Límite de intentos ──────────────────────────────────────────────────────── */

// Se usa req.ip, que Express calcula segun 'trust proxy' tomando el salto no confiable
// mas cercano al proxy. Leer el primer valor de X-Forwarded-For a mano seria explotable:
// los proxies AÑADEN a esa cabecera, asi que el primer valor lo pone el cliente y bastaria
// con rotar cabeceras falsas para tener cuota nueva en cada intento y anular el limite.
function claveCliente(req) {
  return req.ip || req.socket.remoteAddress || 'desconocido';
}

function intentosRestantes(req) {
  const reg = intentos.get(claveCliente(req));
  if (!reg || Date.now() > reg.hasta) return MAX_INTENTOS;
  return Math.max(0, MAX_INTENTOS - reg.n);
}

function registrarFallo(req) {
  const k = claveCliente(req);
  const reg = intentos.get(k);
  if (!reg || Date.now() > reg.hasta) intentos.set(k, { n: 1, hasta: Date.now() + VENTANA_MS });
  else reg.n += 1;
}

const limpiarIntentos = (req) => intentos.delete(claveCliente(req));

// Se purgan las entradas vencidas cada 15 min para que el Map no crezca sin limite bajo
// un ataque distribuido. unref() evita que este temporizador impida cerrar el proceso.
setInterval(() => {
  const ahora = Date.now();
  for (const [k, v] of intentos) if (ahora > v.hasta) intentos.delete(k);
}, VENTANA_MS).unref();

module.exports = {
  USER, COOKIE_NAME, MAX_INTENTOS,
  comprobarCredenciales, cambiarPassword, usandoSemilla, hashVigente,
  ponerCookieSesion, borrarCookieSesion, haySesion,
  intentosRestantes, registrarFallo, limpiarIntentos,
  STATE_FILE,
};
