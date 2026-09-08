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

test('un tipo no admitido o un buffer vacio se rechazan', () => {
  assert.throws(() => subidas.registrar('aruba', { originalname: 'x.exe', buffer: pdf(), tipo: 'exe' }));
  assert.throws(() => subidas.registrar('aruba', { originalname: 'x.pdf', buffer: Buffer.alloc(0), tipo: 'pdf' }));
});
