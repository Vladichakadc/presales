'use strict';
// EL VIGIA NO PUEDE ABSORBER EL CAMBIO QUE ACABA DE DENUNCIAR.
//
// Hasta el 2026-09-14 `--escribir` guardaba el hash nuevo de TODO documento legible, incluidos
// los que acababa de marcar CAMBIO. Como `fuentes.lock.json` es su unica memoria, la semana
// siguiente comparaba contra el hash que se acababa de tragar, decia "sin cambios" y se ponia
// en verde solo: la obligacion de que una persona abriera el documento vivia siete dias en un
// comentario de GitHub y despues desaparecia.
//
// MEDIDO, NO SUPUESTO. El boletin EOL de Cisco cambio en tres mediciones consecutivas
// -48829947 el 02-sep, 4734ea1e el 07-sep, f57ff23f el 14-sep- sin que nadie lo leyera, y cada
// semana se reportaba como hallazgo nuevo porque cada semana se borraba el anterior.
//
// LO QUE SE PRUEBA AQUI es la regla del lock, sin red: `clasificar()` y `aplicarAlLock()` son
// puras justamente para eso. Que las fuentes se alcancen o no es otra cosa, y un 403 se
// reporta con su codigo.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  clasificar, aplicarAlLock, pendientes, normalizarEntrada, marcarRevisado,
} = require('../scripts/vigia-fuentes');

const CLAVE = 'fortinet::https://www.fortinet.com/matrix.pdf';
const DOC = 'Fortinet Product Matrix';

// Una corrida semanal completa sobre un solo documento: mide, clasifica contra lo verificado y
// escribe. Encadenar llamadas es simular semanas.
function semana(lock, { hash, bytes = 1000, estable = true, cuando }) {
  const ahora = cuando || new Date().toISOString();
  const r = {
    clave: CLAVE, vendor: 'fortinet', documento: DOC, url: 'https://www.fortinet.com/matrix.pdf',
    estado: 'leido', hash, bytes, estable,
  };
  clasificar(r, normalizarEntrada(lock.documentos[CLAVE]), ahora);
  aplicarAlLock(lock, [r], ahora);
  return r;
}

const lockCon = (entrada) => ({ documentos: entrada ? { [CLAVE]: entrada } : {} });
const haceSemanas = (n) => new Date(Date.now() - n * 7 * 24 * 3600 * 1000).toISOString();

test('un documento que cambió conserva el hash que una persona verificó', () => {
  const lock = lockCon(null);
  semana(lock, { hash: 'aaa' });                       // primera medición
  const r = semana(lock, { hash: 'bbb', bytes: 2000 }); // cambió

  assert.strictEqual(r.cambio, 'CAMBIÓ');
  const e = lock.documentos[CLAVE];
  assert.strictEqual(e.hashVerificado, 'aaa', 'se tragó el cambio que acababa de denunciar');
  assert.strictEqual(e.visto.hash, 'bbb', 'lo visto tiene que quedar registrado aparte');
  assert.strictEqual(e.visto.bytes, 2000);
  assert.ok(e.pendienteDesde);
});

test('la semana siguiente NO se pone en verde: sigue pendiente', () => {
  // El corazon del defecto. Sin el tercer estado esta segunda corrida daba "sin cambios".
  const lock = lockCon(null);
  semana(lock, { hash: 'aaa' });
  semana(lock, { hash: 'bbb' });
  const r = semana(lock, { hash: 'bbb' });

  assert.strictEqual(r.cambio, 'CAMBIÓ', 'el vigía se curó solo');
  assert.strictEqual(r.yaPendiente, true, 'no distingue una alarma nueva de una que arrastra');
  assert.strictEqual(lock.documentos[CLAVE].hashVerificado, 'aaa');
});

test('la antigüedad mide cuánto lleva sin revisar, no cuándo cambió por última vez', () => {
  // Si `pendienteDesde` se reiniciara con cada cambio, un documento que se republica cada
  // semana pareceria recien aparecido para siempre y nunca envejeceria hasta ningun umbral.
  const desde = haceSemanas(5);
  const lock = lockCon({
    documento: DOC, hashVerificado: 'aaa', bytes: 1000, medido: haceSemanas(9),
    visto: { hash: 'bbb', bytes: 2000, medido: desde },
    pendienteDesde: desde,
  });
  const r = semana(lock, { hash: 'ccc' }); // cambia OTRA VEZ, a un tercer hash

  assert.strictEqual(lock.documentos[CLAVE].pendienteDesde, desde, 'la antigüedad se reinició');
  assert.ok(r.semanas >= 5, `se esperaban 5 semanas o más y salieron ${r.semanas}`);
  assert.strictEqual(lock.documentos[CLAVE].visto.hash, 'ccc', 'lo visto sí es lo más reciente');
  assert.strictEqual(lock.documentos[CLAVE].hashVerificado, 'aaa');
});

test('si el documento vuelve al hash verificado, lo pendiente se limpia', () => {
  // Un fabricante que publica por error y revierte no deja una alarma colgada para siempre.
  const lock = lockCon(null);
  semana(lock, { hash: 'aaa' });
  semana(lock, { hash: 'bbb' });
  assert.strictEqual(pendientes(lock).length, 1);

  const r = semana(lock, { hash: 'aaa' });
  assert.strictEqual(r.cambio, 'sin cambios');
  assert.strictEqual(lock.documentos[CLAVE].visto, undefined);
  assert.strictEqual(pendientes(lock).length, 0);
});

test('una página dinámica sí se absorbe, y es deliberado', () => {
  // `estable: false` marca las paginas cuyo hash varia en cada peticion por marcas de tiempo
  // y banners. Retenerlas las dejaria pendientes para siempre: exactamente el aviso en falso
  // semanal que ese campo existe para evitar, y un vigia que avisa en falso se ignora.
  const lock = lockCon(null);
  semana(lock, { hash: 'aaa', estable: false });
  const r = semana(lock, { hash: 'bbb', estable: false });

  assert.strictEqual(r.cambio, 'varió (página dinámica)');
  assert.strictEqual(lock.documentos[CLAVE].hashVerificado, 'bbb', 'una página dinámica avanza');
  assert.strictEqual(pendientes(lock).length, 0, 'no puede entrar en la cola de revisión');
});

test('el lock v1 se migra leyendo su `hash` como verificado', () => {
  // Sin esto, el primer arranque tras desplegar habria declarado los nueve documentos
  // divergentes de golpe: una divergencia inventada que nadie midio.
  const e = normalizarEntrada({ documento: DOC, hash: 'aaa', bytes: 1000, medido: '2026-09-07T00:00:00.000Z' });
  assert.strictEqual(e.hashVerificado, 'aaa');
  assert.strictEqual(e.visto, undefined);

  const lock = lockCon({ documento: DOC, hash: 'aaa', bytes: 1000, medido: '2026-09-07T00:00:00.000Z' });
  assert.strictEqual(semana(lock, { hash: 'aaa' }).cambio, 'sin cambios');
});

test('un documento inalcanzable esta semana sigue contando como pendiente', () => {
  // Un 403 no cancela una obligacion: "no se pudo comprobar" nunca es "ya está".
  const lock = lockCon({
    documento: DOC, hashVerificado: 'aaa', bytes: 1000, medido: haceSemanas(3),
    visto: { hash: 'bbb', bytes: 2000, medido: haceSemanas(2) },
    pendienteDesde: haceSemanas(2),
  });
  aplicarAlLock(lock, [{ clave: CLAVE, estado: 'inalcanzable', detalle: 'HTTP 403' }], new Date().toISOString());
  assert.strictEqual(pendientes(lock).length, 1);
});

test('--revisado promueve lo visto y deja el lock limpio', () => {
  const ruta = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-')), 'lock.json');
  fs.writeFileSync(ruta, JSON.stringify(lockCon({
    documento: DOC, hashVerificado: 'aaa', bytes: 1000, medido: haceSemanas(3),
    visto: { hash: 'bbb', bytes: 2000, medido: haceSemanas(1) },
    pendienteDesde: haceSemanas(1),
  })));

  const r = marcarRevisado('fortinet', 'matrix.pdf', ruta);
  assert.strictEqual(r.ok, true);
  const e = JSON.parse(fs.readFileSync(ruta, 'utf8')).documentos[CLAVE];
  assert.strictEqual(e.hashVerificado, 'bbb');
  assert.strictEqual(e.bytes, 2000);
  assert.strictEqual(e.visto, undefined);
  assert.strictEqual(e.pendienteDesde, undefined);
});

test('--revisado no dice «hecho» cuando no había nada pendiente', () => {
  // Decirlo seria la misma pequena mentira que este vigia existe para no contar.
  const ruta = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-')), 'lock.json');
  fs.writeFileSync(ruta, JSON.stringify(lockCon({ documento: DOC, hashVerificado: 'aaa', bytes: 1, medido: haceSemanas(1) })));
  assert.strictEqual(marcarRevisado('fortinet', 'matrix.pdf', ruta).ok, false);
});

test('--revisado se niega ante un trozo de URL ambiguo', () => {
  // Marcar el documento equivocado como verificado apaga una alarma que seguia siendo cierta.
  const ruta = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-')), 'lock.json');
  fs.writeFileSync(ruta, JSON.stringify({
    documentos: {
      'cisco::https://www.cisco.com/a-eol.html': { documento: 'A', hashVerificado: 'x', visto: { hash: 'y', bytes: 1, medido: haceSemanas(1) } },
      'cisco::https://www.cisco.com/b-eol.html': { documento: 'B', hashVerificado: 'x', visto: { hash: 'y', bytes: 1, medido: haceSemanas(1) } },
    },
  }));
  const r = marcarRevisado('cisco', 'eol.html', ruta);
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /casa con 2/);
});

test('EL SABOTAJE: la versión que absorbía produce el verde falso, y esta prueba las distingue', () => {
  // El sabotaje vive DENTRO de la prueba y no fue un experimento de un dia. Reproduce la
  // version anterior de `aplicarAlLock` -la que escribia el hash nuevo pasara lo que pasara- y
  // exige que produzca el fallo. Si alguien "simplifica" el tercer estado hasta volver a esa
  // forma, esta comparacion deja de distinguirlas y salta. Es lo mismo que hace `TARDIOS` con
  // su ancla: la excepcion caduca sola en vez de sobrevivir a lo que describia.
  const absorbiendo = (lock, resultados, ahora) => {
    for (const r of resultados) {
      if (r.estado !== 'leido') continue;
      lock.documentos[r.clave] = { documento: r.documento, hashVerificado: r.hash, bytes: r.bytes, medido: ahora };
    }
    return lock;
  };

  // Tres semanas: se mide, cambia, y a la tercera el documento sigue igual que la segunda.
  // Es ahi donde las dos versiones se separan.
  const corrida = (aplicar) => {
    const lock = lockCon(null);
    let ultimo = null;
    for (const hash of ['aaa', 'bbb', 'bbb']) {
      const ahora = new Date().toISOString();
      ultimo = {
        clave: CLAVE, vendor: 'fortinet', documento: DOC, url: 'x',
        estado: 'leido', hash, bytes: 1000, estable: true,
      };
      clasificar(ultimo, normalizarEntrada(lock.documentos[CLAVE]), ahora);
      aplicar(lock, [ultimo], ahora);
    }
    return ultimo;
  };

  assert.strictEqual(corrida(absorbiendo).cambio, 'sin cambios',
    'el sabotaje ya no reproduce el defecto: esta prueba dejó de comprobar nada');
  assert.strictEqual(corrida(aplicarAlLock).cambio, 'CAMBIÓ',
    'la versión real se comporta como la saboteada: el tercer estado no está haciendo nada');
});
