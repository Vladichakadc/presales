// Almacén de usuarios y roles. Es la pieza que convierte el acceso de "control de
// perímetro" en "control de identidad", que era la salvedad declarada en la cabecera de
// auth.js desde el primer día.
//
// POR QUÉ UN ARCHIVO Y NO UNA TABLA. La base SQLite de este proyecto es EFÍMERA: no se fija
// DATABASE_PATH en producción, así que Railway la recrea y la resiembra desde los seeds en
// cada despliegue. Guardar ahí las credenciales significaría perderlas en el siguiente
// deploy. Los usuarios viven, como ya vivía la contraseña compartida, en AUTH_STATE_DIR,
// que sí es un volumen persistente. Si algún día el catálogo pasa a una base persistente,
// éste es el módulo que se reemplaza, y sólo éste.
//
// MIGRACIÓN SIN INTERVENCIÓN MANUAL. Antes de esto había una única credencial compartida.
// La primera vez que se lee el almacén y no existe, se construye a partir de esa credencial:
// el usuario que ya se usaba pasa a ser el ADMINISTRADOR, con su mismo hash. Nadie se queda
// fuera, no hay contraseña nueva que comunicar y no se inventa un acceso por defecto.
//
// NINGÚN VALOR POR DEFECTO ABRE LA PUERTA. No hay contraseña de administrador cableada ni
// de reserva: si no hay archivo de usuarios y tampoco AUTH_PASSWORD, no se puede construir
// el administrador y no entra nadie — en producción el servidor ni siquiera arranca. Es la
// misma propiedad de fallo cerrado que ya tenía auth.js, conservada a propósito.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STATE_DIR = process.env.AUTH_STATE_DIR || path.join(__dirname, '..', '.auth');
const USERS_FILE = path.join(STATE_DIR, 'usuarios.json');
// Archivo de la etapa anterior: una sola credencial compartida. Se lee solo para migrar.
const LEGACY_FILE = path.join(STATE_DIR, 'credentials.json');

const USER_LEGADO = process.env.AUTH_USER || 'presales';
const SEED_PASSWORD = process.env.AUTH_PASSWORD || '';

// Roles. Hoy solo se usa `admin`; `consulta` existe para que crear el primer usuario sin
// privilegios sea añadir una fila, no rediseñar la autorización. Cada permiso se declara
// explícitamente en vez de deducirse del nombre del rol: leer qué puede hacer cada uno no
// debería exigir leer el código que lo comprueba.
const ROLES = {
  admin: {
    n: 'Administrador',
    d: 'Acceso completo: herramientas, catálogos y gestión de usuarios.',
    permisos: { herramientas: true, usuarios: true, sync: true },
  },
  consulta: {
    n: 'Consulta',
    d: 'Acceso a las herramientas de dimensionamiento y cotización, sin gestión de usuarios.',
    permisos: { herramientas: true, usuarios: false, sync: false },
  },
};
const ROL_POR_DEFECTO = 'consulta'; // el menos privilegiado, nunca `admin`

/* ── Contraseñas ─────────────────────────────────────────────────────────────── */

// Parámetros de scrypt recomendados por OWASP (N=2^15, r=8, p=1). Tienen que ser los mismos
// al cifrar y al verificar: con parámetros distintos el hash nunca coincide. maxmem es
// obligatorio porque scrypt necesita ~128*N*r = 32 MB y el techo por defecto de Node es
// justo 32 MB, así que sin subirlo lanza ERR_CRYPTO_INVALID_SCRYPT_PARAMS.
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, KEYLEN, SCRYPT);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

// Contraseña temporal para un alta: 24 caracteres de un alfabeto sin 0/O/1/l/I ni símbolos,
// para que se pueda leer y transcribir en voz alta sin ambigüedad si hace falta. La entropía
// (24 caracteres de un alfabeto de 54) sobra de sobra frente a las 8 letras mínimas que ya
// exige cambiarPassword — no es la contraseña definitiva, es la que se cambia en el primer
// acceso y que mientras tanto solo debe conocer quien la generó y a quien se le comunique.
const ALFABETO_TEMPORAL = 'abcdefghjkmnpqrstuvwxyzACDEFGHJKMNPQRSTUVWXYZ23456789';
function generarPasswordTemporal() {
  const bytes = crypto.randomBytes(24);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += ALFABETO_TEMPORAL[bytes[i] % ALFABETO_TEMPORAL.length];
  return out;
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

/* ── Almacén ─────────────────────────────────────────────────────────────────── */

function leerArchivo(archivo) {
  try {
    return JSON.parse(fs.readFileSync(archivo, 'utf8'));
  } catch {
    return null; // no existe todavía, o quedó ilegible
  }
}

function guardar(estado) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  // mode 0600: el archivo guarda hashes de contraseña, no debe ser legible por otros.
  fs.writeFileSync(USERS_FILE, JSON.stringify(estado, null, 2), { mode: 0o600 });
}

// Construye el almacén inicial a partir de lo que hubiera antes. Devuelve null cuando no hay
// de qué construirlo — sin contraseña compartida ni semilla no se fabrica un administrador
// con una clave inventada, se falla cerrado.
function migrar() {
  const legado = leerArchivo(LEGACY_FILE);
  const hash = (legado && legado.passwordHash) || (SEED_PASSWORD ? hashPassword(SEED_PASSWORD) : null);
  if (!hash) return null;
  return {
    version: 1,
    usuarios: [{
      id: 'u1',
      usuario: USER_LEGADO,
      nombre: 'Administrador',
      rol: 'admin',
      passwordHash: hash,
      // `desdeSemilla` sostiene el aviso de la UI: mientras la contraseña siga siendo la de
      // AUTH_PASSWORD conviene cambiarla, y eso solo se sabe si se recuerda de dónde salió.
      desdeSemilla: !(legado && legado.passwordHash),
      activo: true,
      creado: new Date().toISOString(),
      actualizado: null,
    }],
  };
}

// Estado vigente, migrando la primera vez.
//
// LA MIGRACIÓN SE PERSISTE, Y NO ES UN DETALLE. hashPassword genera un salt aleatorio en
// cada llamada, así que migrar en cada lectura producía un hash distinto cada vez — y como
// auth.js deriva de ese hash la clave con la que firma la sesión, la firma dejaba de validar
// en la siguiente petición: se podía iniciar sesión y acto seguido el servidor la
// desconocía. Se guarda una sola vez y a partir de ahí el hash es estable.
//
// Si la escritura falla (volumen no montado, sistema de solo lectura) se avisa y se conserva
// el estado en memoria: el proceso sigue funcionando y las sesiones son estables mientras
// viva, en vez de caerse el arranque por algo recuperable. Al reiniciar se vuelve a migrar
// desde AUTH_PASSWORD, que es exactamente el comportamiento anterior.
let enMemoria = null;

function estado() {
  const guardado = leerArchivo(USERS_FILE);
  if (guardado) { enMemoria = null; return guardado; }
  if (!enMemoria) {
    enMemoria = migrar();
    if (enMemoria) {
      try {
        guardar(enMemoria);
      } catch (e) {
        console.warn(`[auth] no se pudo escribir ${USERS_FILE} (${e.code || e.message}): `
          + 'los usuarios quedan solo en memoria y se rehacen al reiniciar.');
      }
    }
  }
  return enMemoria;
}

function listaCruda() {
  const e = estado();
  return (e && Array.isArray(e.usuarios)) ? e.usuarios : [];
}

// Vista pública: nunca sale un hash de este módulo hacia una respuesta HTTP.
function publico(u) {
  return {
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    rol: u.rol,
    rolNombre: (ROLES[u.rol] || {}).n || u.rol,
    activo: u.activo !== false,
    desdeSemilla: !!u.desdeSemilla,
    // A diferencia de desdeSemilla (aviso blando: el admin migrado puede seguir trabajando),
    // debeCambiar lo hace cumplir el muro de auth — ver exige() en server.js. Se lo lleva la
    // lista para que el administrador vea quién no ha completado su primer acceso todavía.
    debeCambiar: !!u.debeCambiar,
    creado: u.creado || null,
    actualizado: u.actualizado || null,
  };
}

const listar = () => listaCruda().map(publico);

function porId(id) {
  return listaCruda().find((u) => u.id === id) || null;
}

// Comparación del nombre en tiempo constante y sin cortocircuito: comparar con === filtra
// por tiempo si el usuario existe, que es medio paso hacia enumerarlos.
function mismoUsuario(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Verifica usuario + contraseña y devuelve el usuario, o null.
//
// Cuando el nombre no existe se verifica igualmente contra un hash señuelo. Sin eso, un
// usuario inexistente responde en microsegundos y uno real tarda lo que tarda scrypt: la
// diferencia es medible desde fuera y permite enumerar cuentas.
const HASH_SENUELO = hashPassword(crypto.randomBytes(32).toString('hex'));

function verificar(usuario, password) {
  const candidatos = listaCruda().filter((u) => u.activo !== false);
  let encontrado = null;
  for (const u of candidatos) {
    if (mismoUsuario(u.usuario, usuario)) { encontrado = u; break; }
  }
  const ok = verifyPassword(password, encontrado ? encontrado.passwordHash : HASH_SENUELO);
  return (ok && encontrado) ? encontrado : null;
}

function cambiarPassword(id, actual, nueva) {
  const e = estado();
  if (!e) return { ok: false, error: 'No hay usuarios configurados.' };
  const u = e.usuarios.find((x) => x.id === id);
  if (!u) return { ok: false, error: 'Usuario no encontrado.' };
  if (!verifyPassword(actual, u.passwordHash)) {
    return { ok: false, error: 'La contraseña actual no es correcta.' };
  }
  if (typeof nueva !== 'string' || nueva.length < 12) {
    return { ok: false, error: 'La nueva contraseña debe tener al menos 12 caracteres.' };
  }
  if (nueva.length > 200) return { ok: false, error: 'La contraseña es demasiado larga.' };
  if (nueva === actual) return { ok: false, error: 'La nueva contraseña debe ser distinta de la actual.' };
  u.passwordHash = hashPassword(nueva);
  u.desdeSemilla = false;
  u.debeCambiar = false; // cambiarla de verdad es lo que levanta el muro del primer acceso
  u.actualizado = new Date().toISOString();
  guardar(e);
  return { ok: true };
}

// Alta de un usuario, con contraseña temporal generada por el servidor.
//
// LA DECISIÓN QUE PENDIENTES.md DEJABA ABIERTA era cómo llega la primera contraseña a la
// persona nueva. Se resuelve así: el servidor la genera, la devuelve UNA VEZ en la respuesta
// de esta llamada —nunca queda en un log ni se puede volver a pedir— para que el
// administrador la comunique por un canal distinto a este panel, y la cuenta nace con
// `debeCambiar: true`. Ese campo no es un aviso: el muro de autenticación de server.js le
// impide usar cualquier pantalla que no sea cambiar su propia contraseña hasta que lo haga,
// así que la clave provisional nunca llega a ser la clave con la que esa persona trabaja.
//
// Validación deliberadamente estricta y sin normalizar el nombre de usuario: el punto 13 de
// PENDIENTES.md ya registra que la comparación exacta (`PreSales` ≠ `presales`) es una
// decisión abierta aparte, y esta función no la toca de tapadillo — usa la misma unicidad
// exacta que ya rige el login.
function crear({ usuario, nombre, rol }) {
  if (typeof usuario !== 'string' || !usuario.trim()) return { ok: false, error: 'Falta el nombre de usuario.' };
  if (typeof nombre !== 'string' || !nombre.trim()) return { ok: false, error: 'Falta el nombre para mostrar.' };
  const u = usuario.trim();
  const n = nombre.trim();
  if (u.length < 3 || u.length > 60) return { ok: false, error: 'El usuario debe tener entre 3 y 60 caracteres.' };
  if (n.length > 120) return { ok: false, error: 'El nombre es demasiado largo.' };
  if (/\s/.test(u) || [...u].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) {
    return { ok: false, error: 'El usuario no puede tener espacios ni caracteres de control.' };
  }
  const rolFinal = rol || ROL_POR_DEFECTO;
  if (!ROLES[rolFinal]) return { ok: false, error: `Rol desconocido: "${rolFinal}".` };

  const e = estado();
  if (!e) return { ok: false, error: 'No hay almacén de usuarios inicializado.' };
  if (e.usuarios.some((x) => x.usuario === u)) {
    return { ok: false, error: `Ya existe un usuario "${u}".` };
  }

  const passwordTemporal = generarPasswordTemporal();
  const nuevo = {
    id: `u_${crypto.randomBytes(6).toString('hex')}`,
    usuario: u,
    nombre: n,
    rol: rolFinal,
    passwordHash: hashPassword(passwordTemporal),
    desdeSemilla: false,
    debeCambiar: true,
    activo: true,
    creado: new Date().toISOString(),
    actualizado: null,
  };
  e.usuarios.push(nuevo);
  guardar(e);
  return { ok: true, usuario: publico(nuevo), passwordTemporal };
}

// Huella determinista de la credencial de un usuario. auth.js deriva de aquí la clave con
// la que firma su sesión, y por eso cambiar la contraseña invalida las sesiones emitidas:
// al moverse la huella, ninguna firma anterior vuelve a validar. Tiene que ser determinista,
// así que no puede usar hashPassword — ése genera un salt distinto en cada llamada.
function huella(u) {
  return crypto.createHash('sha256').update(String(u && u.passwordHash)).digest('hex');
}

function permiso(usuario, nombrePermiso) {
  const rol = ROLES[usuario && usuario.rol];
  return !!(rol && rol.permisos[nombrePermiso]);
}

// Hay administrador utilizable: es la comprobación de arranque en producción. Sin esto el
// servidor se levantaría sin que nadie pudiera entrar ni arreglarlo desde dentro.
function hayAdministrador() {
  return listaCruda().some((u) => u.rol === 'admin' && u.activo !== false && u.passwordHash);
}

module.exports = {
  ROLES, ROL_POR_DEFECTO, USERS_FILE,
  listar, porId, verificar, cambiarPassword, crear, huella, permiso, hayAdministrador,
  hashPassword, verifyPassword,
};
