'use strict';
// Usuarios, roles y contrasenas.
//
// LA PRUEBA QUE IMPORTA ES LA DE LA MIGRACION ESTABLE. Al construir este modulo aparecio un
// fallo que ninguna revision de codigo cazo y que el navegador solo mostraba como "inicio
// sesion y la siguiente peticion da 401": `estado()` migraba en CADA lectura, hashPassword
// genera un salt aleatorio en cada llamada, y auth.js deriva de ese hash la clave con la que
// firma la sesion. La firma cambiaba entre dos peticiones seguidas. Esa es la clase de fallo
// que un juego minimo de pruebas atrapa y una lectura del codigo no.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { estadoLimpio } = require('./ayuda/navegador');

const DIR = estadoLimpio('usuarios');
process.env.AUTH_USER = 'presales';
process.env.AUTH_PASSWORD = 'semilla-de-prueba-larga';
const usuarios = require('../server/usuarios');

test('sin archivo previo se construye un administrador desde AUTH_PASSWORD', () => {
  const lista = usuarios.listar();
  assert.strictEqual(lista.length, 1);
  assert.strictEqual(lista[0].usuario, 'presales');
  assert.strictEqual(lista[0].rol, 'admin');
  assert.ok(usuarios.hayAdministrador(), 'sin administrador el arranque en produccion falla');
});

test('la migracion se persiste en disco, no se rehace en cada lectura', () => {
  assert.ok(fs.existsSync(path.join(DIR, 'usuarios.json')),
    'si no se escribe, cada lectura genera un hash distinto y la sesion se invalida sola');
});

test('la huella de la credencial es ESTABLE entre lecturas', () => {
  // Es literalmente el fallo original: dos lecturas seguidas daban huellas distintas, la
  // sesion se firmaba con una y se validaba con otra.
  const a = usuarios.huella(usuarios.porId('u1'));
  const b = usuarios.huella(usuarios.porId('u1'));
  assert.strictEqual(a, b);
});

test('verificar acepta la credencial correcta y rechaza la incorrecta', () => {
  assert.ok(usuarios.verificar('presales', 'semilla-de-prueba-larga'));
  assert.strictEqual(usuarios.verificar('presales', 'otra-cosa'), null);
});

test('un usuario que no existe se rechaza igual que una contrasena mala', () => {
  // No hay enumeracion de usuarios: el nombre inexistente se compara contra un hash senuelo
  // para que responder cueste lo mismo y no se pueda distinguir un caso del otro.
  assert.strictEqual(usuarios.verificar('nadie', 'semilla-de-prueba-larga'), null);
});

test('el nombre de usuario se compara EXACTO, mayusculas incluidas', () => {
  // Comportamiento actual, fijado aqui a proposito para que un cambio sea deliberado. La
  // comparacion es en tiempo constante y sin normalizar, asi que "PreSales" no entra. Es
  // correcto de seguridad y aspero de usar: anotado en PENDIENTES.md como decision abierta,
  // no cambiado de tapadillo en una tarea de limpieza.
  assert.strictEqual(usuarios.verificar('PreSales', 'semilla-de-prueba-larga'), null);
  assert.strictEqual(usuarios.verificar(' presales', 'semilla-de-prueba-larga'), null);
  assert.ok(usuarios.verificar('presales', 'semilla-de-prueba-larga'));
});

test('los permisos se declaran por rol, no se deducen del nombre', () => {
  const admin = { rol: 'admin' };
  const consulta = { rol: 'consulta' };
  assert.strictEqual(usuarios.permiso(admin, 'usuarios'), true);
  assert.strictEqual(usuarios.permiso(consulta, 'usuarios'), false);
  assert.strictEqual(usuarios.permiso(consulta, 'herramientas'), true);
  assert.strictEqual(usuarios.permiso(consulta, 'sync'), false);
});

test('un rol inventado no obtiene ningun permiso', () => {
  assert.strictEqual(usuarios.permiso({ rol: 'superadmin' }, 'usuarios'), false);
  assert.strictEqual(usuarios.permiso(null, 'herramientas'), false);
});

test('el rol por defecto es el menos privilegiado', () => {
  assert.strictEqual(usuarios.ROL_POR_DEFECTO, 'consulta');
  assert.strictEqual(usuarios.ROLES[usuarios.ROL_POR_DEFECTO].permisos.usuarios, false);
});

test('cambiar la contrasena exige la actual y una nueva razonable', () => {
  assert.strictEqual(usuarios.cambiarPassword('u1', 'mal', 'otra-larguisima-123').ok, false);
  assert.strictEqual(usuarios.cambiarPassword('u1', 'semilla-de-prueba-larga', 'corta').ok, false);
  assert.strictEqual(
    usuarios.cambiarPassword('u1', 'semilla-de-prueba-larga', 'semilla-de-prueba-larga').ok, false,
    'repetir la misma no es un cambio',
  );
});

test('cambiar la contrasena mueve la huella: las sesiones emitidas dejan de valer', () => {
  const antes = usuarios.huella(usuarios.porId('u1'));
  const r = usuarios.cambiarPassword('u1', 'semilla-de-prueba-larga', 'contrasena-nueva-de-verdad');
  assert.strictEqual(r.ok, true);
  const despues = usuarios.huella(usuarios.porId('u1'));
  assert.notStrictEqual(antes, despues);
  assert.ok(usuarios.verificar('presales', 'contrasena-nueva-de-verdad'));
  assert.strictEqual(usuarios.verificar('presales', 'semilla-de-prueba-larga'), null);
});

test('deja de avisar de la contrasena semilla cuando ya se cambio', () => {
  assert.strictEqual(usuarios.listar()[0].desdeSemilla, false);
});

test('el hash almacenado no contiene la contrasena', () => {
  const crudo = fs.readFileSync(path.join(DIR, 'usuarios.json'), 'utf8');
  assert.ok(!crudo.includes('contrasena-nueva-de-verdad'));
  assert.ok(!crudo.includes('semilla-de-prueba-larga'));
});

test('verifyPassword no revienta con un hash corrupto o ausente', () => {
  // Un archivo de estado manipulado no debe tumbar el arranque: debe fallar cerrado.
  assert.strictEqual(usuarios.verifyPassword('x', null), false);
  assert.strictEqual(usuarios.verifyPassword('x', 'basura'), false);
  assert.strictEqual(usuarios.verifyPassword('x', 'scrypt$sal$mal'), false);
});

/* ── Alta de usuarios ────────────────────────────────────────────────────────
 * La decision que PENDIENTES.md dejaba abierta era como llega la primera contrasena a la
 * persona nueva. Se resuelve generandola en el servidor y devolviendola UNA vez, con la
 * cuenta obligada a cambiarla antes de poder hacer nada mas — eso ultimo lo hace cumplir el
 * muro de server.js, no este modulo; aqui solo se prueba que el dato que ese muro necesita
 * (debeCambiar) queda bien puesto y que se suelta al cambiar la contrasena de verdad. */

test('crear() genera una contrasena temporal que autentica de verdad', () => {
  const r = usuarios.crear({ usuario: 'jmartinez', nombre: 'Juana Martínez', rol: 'consulta' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(typeof r.passwordTemporal, 'string');
  assert.ok(r.passwordTemporal.length >= 20, 'entropia suficiente para una clave que nadie eligio');
  assert.ok(usuarios.verificar('jmartinez', r.passwordTemporal));
});

test('la cuenta recien creada nace con debeCambiar y sin desdeSemilla', () => {
  const r = usuarios.crear({ usuario: 'nuevo1', nombre: 'Alguien', rol: 'consulta' });
  assert.strictEqual(r.usuario.debeCambiar, true);
  assert.strictEqual(r.usuario.desdeSemilla, false, 'desdeSemilla es solo para la cuenta migrada de AUTH_PASSWORD');
});

test('el rol por defecto es el menos privilegiado si no se especifica', () => {
  const r = usuarios.crear({ usuario: 'sinrol1', nombre: 'Sin Rol' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.usuario.rol, usuarios.ROL_POR_DEFECTO);
});

test('un rol admin explicito SI se respeta: dar de alta a otro administrador es valido', () => {
  const r = usuarios.crear({ usuario: 'otroadmin', nombre: 'Otro Admin', rol: 'admin' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.usuario.rol, 'admin');
});

test('crear() rechaza un rol que no existe', () => {
  const r = usuarios.crear({ usuario: 'rolmalo', nombre: 'X', rol: 'superadmin' });
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /rol/i);
});

test('crear() rechaza usuario o nombre vacios, y usuario con espacios', () => {
  assert.strictEqual(usuarios.crear({ usuario: '', nombre: 'X', rol: 'consulta' }).ok, false);
  assert.strictEqual(usuarios.crear({ usuario: 'valido2', nombre: '', rol: 'consulta' }).ok, false);
  assert.strictEqual(usuarios.crear({ usuario: 'con espacio', nombre: 'X', rol: 'consulta' }).ok, false);
  assert.strictEqual(usuarios.crear({ usuario: 'ab', nombre: 'X', rol: 'consulta' }).ok, false, 'demasiado corto');
});

test('crear() no permite dos usuarios con el mismo nombre exacto', () => {
  const primero = usuarios.crear({ usuario: 'duplicado1', nombre: 'Uno', rol: 'consulta' });
  assert.strictEqual(primero.ok, true);
  const segundo = usuarios.crear({ usuario: 'duplicado1', nombre: 'Otro', rol: 'admin' });
  assert.strictEqual(segundo.ok, false);
  assert.match(segundo.error, /ya existe/i);
});

test('crear() no toca la unicidad exacta: sigue sin normalizar mayusculas (punto 13, aparte)', () => {
  // La comparacion exacta del login es una decision abierta distinta (PENDIENTES.md #13) y
  // esta funcion no la cambia de tapadillo: "Duplicado2" y "duplicado2" son usuarios
  // DISTINTOS para crear(), igual que ya lo son para verificar().
  const a = usuarios.crear({ usuario: 'duplicado2', nombre: 'A', rol: 'consulta' });
  const b = usuarios.crear({ usuario: 'Duplicado2', nombre: 'B', rol: 'consulta' });
  assert.strictEqual(a.ok, true);
  assert.strictEqual(b.ok, true);
});

test('dos contrasenas temporales generadas seguidas no coinciden', () => {
  const a = usuarios.crear({ usuario: 'azar1', nombre: 'X', rol: 'consulta' });
  const b = usuarios.crear({ usuario: 'azar2', nombre: 'X', rol: 'consulta' });
  assert.notStrictEqual(a.passwordTemporal, b.passwordTemporal);
});

test('cambiar la contrasena de verdad libera debeCambiar', () => {
  const alta = usuarios.crear({ usuario: 'liberame', nombre: 'X', rol: 'consulta' });
  assert.strictEqual(usuarios.porId(alta.usuario.id).debeCambiar, true);
  const r = usuarios.cambiarPassword(alta.usuario.id, alta.passwordTemporal, 'una-contrasena-elegida-por-mi');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(usuarios.porId(alta.usuario.id).debeCambiar, false);
});

test('la contrasena temporal nunca queda en claro en el archivo de estado', () => {
  const r = usuarios.crear({ usuario: 'nofiltrar', nombre: 'X', rol: 'consulta' });
  const crudo = fs.readFileSync(path.join(DIR, 'usuarios.json'), 'utf8');
  assert.ok(!crudo.includes(r.passwordTemporal));
});
