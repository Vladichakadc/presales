'use strict';
// Carga manual de fuentes oficiales por fabricante (server/fuentesSubidas.js).
//
// Es credito-cero a proposito: guarda el documento y su procedencia, no reescribe el catalogo.
// Lo que se prueba aqui es lo que puede fallar EN SILENCIO y con consecuencias: que el nombre
// del archivo subido no controle la ruta en disco (path traversal), que solo entren
// fabricantes conocidos, que el id se valide antes de tocar el disco, y que lo guardado
// sobreviva en el volumen (se relee del manifiesto).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Volumen limpio ANTES de requerir el modulo: lee AUTH_STATE_DIR al cargarse.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fuentes-subidas-'));
process.env.AUTH_STATE_DIR = dir;
const subidas = require('../server/fuentesSubidas');

const pdf = () => Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64, 7)]);

test('un fabricante fuera de la lista no crea nada', () => {
  assert.strictEqual(subidas.esVendor('fortinet'), true);
  assert.strictEqual(subidas.esVendor('../etc'), false);
  assert.strictEqual(subidas.esVendor('marte'), false);
  assert.throws(() => subidas.registrar('../etc', { originalname: 'x.pdf', buffer: pdf(), tipo: 'pdf' }));
});

test('el nombre en disco lo genera el modulo, no el originalname (path traversal)', () => {
  const e = subidas.registrar('fortinet', {
    originalname: '../../../../etc/passwd .pdf', buffer: pdf(), tipo: 'pdf', usuario: 'ana',
  });
  // El archivo real vive dentro de la carpeta del vendor, con nombre <vendor>-<id>.<ext>.
  assert.match(e.archivo, /^fortinet-[0-9a-f]{16}\.pdf$/);
  const p = path.join(dir, 'fuentes', e.archivo);
  assert.ok(fs.existsSync(p), 'el archivo se guardo donde debe');
  // El nombre para mostrar se saneo: sin separadores de ruta.
  assert.ok(!e.documento.includes('/') && !e.documento.includes('\\'));
  // Y trae procedencia util: hash, tamanyo, fecha y quien.
  assert.match(e.hash, /^[0-9a-f]{64}$/);
  assert.ok(e.bytes > 0 && e.usuario === 'ana' && e.fecha);
});

test('lo guardado se relee del volumen y se sirve con la forma de procedencia', () => {
  const antes = subidas.listar('cisco').length;
  subidas.registrar('cisco', { originalname: 'catalyst.csv', buffer: Buffer.from('a,b\n1,2\n'), tipo: 'csv' });
  assert.strictEqual(subidas.listar('cisco').length, antes + 1);

  const proc = subidas.comoProcedencia('cisco');
  assert.ok(proc.length >= 1);
  assert.strictEqual(proc[0].estado, 'cargada');
  assert.strictEqual(proc[0].subida, true);
  assert.strictEqual(proc[0].meses, null, 'no finge antiguedad: subir no es verificar');
  assert.match(proc[0].url, /^\/api\/fuentes\/cisco\/documento\/[0-9a-f]{16}$/);
  assert.match(proc[0].nota, /No reescribe/i);
});

test('rutaArchivo valida el id antes de tocar el disco y no cruza de fabricante', () => {
  const e = subidas.registrar('nokia', { originalname: 'n.txt', buffer: Buffer.from('texto plano'), tipo: 'txt' });
  assert.ok(subidas.rutaArchivo('nokia', e.id), 'encuentra el suyo');
  assert.strictEqual(subidas.rutaArchivo('nokia', 'no-hex'), null, 'id con forma invalida');
  assert.strictEqual(subidas.rutaArchivo('nokia', 'a'.repeat(16)), null, 'id inexistente');
  assert.strictEqual(subidas.rutaArchivo('fortinet', e.id), null, 'no se sirve el de otro fabricante');
});

test('subir de nuevo deja UNA vigente y manda la anterior al historico, sin borrarla', () => {
  // Decision del dueno del repo (2026-09-08): antes esto acumulaba, asi que subir la lista de
  // precios del trimestre nuevo dejaba dos filas «Cargada» iguales sin decir cual manda.
  const v1 = subidas.registrar('fortinet', { originalname: '2026Q2.xlsx', buffer: Buffer.from('PKq2'), tipo: 'xlsx' });
  const v2 = subidas.registrar('fortinet', { originalname: '2026Q3.xlsx', buffer: Buffer.from('PKq3'), tipo: 'xlsx' });

  const proc = subidas.comoProcedencia('fortinet');
  const vigentes = proc.filter((f) => f.vigente);
  assert.strictEqual(vigentes.length, 1, 'exactamente una vigente');
  assert.strictEqual(vigentes[0].id, v2.id, 'la vigente es la ultima subida');
  assert.strictEqual(vigentes[0].estado, 'cargada');

  const vieja = proc.find((f) => f.id === v1.id);
  assert.strictEqual(vieja.estado, 'historico', 'la anterior queda como sustituida');
  assert.match(vieja.cubre, /versi[oó]n anterior/i);
  // Reemplazar NO es destruir: el archivo anterior sigue consultable.
  assert.ok(subidas.rutaArchivo('fortinet', v1.id), 'la version anterior se conserva');
});

test('si se borra la vigente, la mas reciente que queda pasa a serlo', () => {
  // Un fabricante con documentos cargados pero ninguno vigente seria un estado que la pestana
  // no sabria explicar.
  const a = subidas.registrar('aruba', { originalname: 'a.txt', buffer: Buffer.from('uno'), tipo: 'txt' });
  const b = subidas.registrar('aruba', { originalname: 'b.txt', buffer: Buffer.from('dos'), tipo: 'txt' });
  assert.ok(subidas.comoProcedencia('aruba').find((f) => f.id === b.id).vigente);

  subidas.eliminar('aruba', b.id);
  const proc = subidas.comoProcedencia('aruba');
  assert.strictEqual(proc.filter((f) => f.vigente).length, 1, 'sigue habiendo exactamente una');
  assert.ok(proc.find((f) => f.id === a.id).vigente, 'la anterior fue promovida');
});

test('eliminar borra el archivo del volumen y su fila de procedencia', () => {
  const e = subidas.registrar('juniper', { originalname: 'srx.csv', buffer: Buffer.from('a,b\n1,2\n'), tipo: 'csv' });
  const p = path.join(dir, 'fuentes', e.archivo);
  assert.ok(fs.existsSync(p));

  const borrada = subidas.eliminar('juniper', e.id);
  assert.strictEqual(borrada.id, e.id);
  assert.ok(!fs.existsSync(p), 'el archivo sale del volumen, no solo del manifiesto');
  assert.ok(!subidas.listar('juniper').some((x) => x.id === e.id));
  assert.ok(!subidas.comoProcedencia('juniper').some((x) => x.id === e.id));
});

test('eliminar valida el id y no cruza de fabricante', () => {
  const e = subidas.registrar('mikrotik', { originalname: 'ccr.txt', buffer: Buffer.from('texto'), tipo: 'txt' });
  // Un id de otro fabricante no borra el de este, ni al reves: el 404 protege el de al lado.
  assert.strictEqual(subidas.eliminar('aruba', e.id), null, 'no borra el de otro fabricante');
  assert.strictEqual(subidas.eliminar('mikrotik', 'no-hex'), null, 'id con forma invalida');
  assert.strictEqual(subidas.eliminar('../etc', e.id), null, 'fabricante fuera de la lista');
  assert.strictEqual(subidas.eliminar('mikrotik', 'b'.repeat(16)), null, 'id inexistente');
  // Y tras esos cuatro intentos el documento sigue ahi.
  assert.ok(subidas.rutaArchivo('mikrotik', e.id), 'el documento no se toco');
});

test('si el archivo ya no esta, la entrada se retira igual', () => {
  // Un enlace roto presentado como procedencia es peor que no tener la fila: la pestaña
  // anunciaria un documento oficial que no se puede abrir.
  const e = subidas.registrar('huawei', { originalname: 'ar.csv', buffer: Buffer.from('a\n1\n'), tipo: 'csv' });
  fs.unlinkSync(path.join(dir, 'fuentes', e.archivo));
  assert.strictEqual(subidas.eliminar('huawei', e.id).id, e.id);
  assert.ok(!subidas.listar('huawei').some((x) => x.id === e.id));
});

test('un tipo no admitido o un buffer vacio se rechazan', () => {
  assert.throws(() => subidas.registrar('aruba', { originalname: 'x.exe', buffer: pdf(), tipo: 'exe' }));
  assert.throws(() => subidas.registrar('aruba', { originalname: 'x.pdf', buffer: Buffer.alloc(0), tipo: 'pdf' }));
});
