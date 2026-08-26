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
