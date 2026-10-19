'use strict';
// Escritura atómica en el volumen persistente (AUTH_STATE_DIR).
//
// POR QUE. `writeFileSync` sobre el archivo vivo lo trunca y lo reescribe: si Railway manda el
// SIGTERM del redespliegue (o el contenedor muere) a mitad, queda un JSON cortado. Con
// `usuarios.json` eso no es un fallo cosmético: el almacén ilegible se lee como «no existe» y el
// arranque reconstruye el administrador desde AUTH_PASSWORD, perdiendo los usuarios dados de alta.
// Con el manifiesto de fuentes subidas, desaparecen todas de la procedencia.
//
// COMO. Se escribe a un temporal EN EL MISMO DIRECTORIO (rename solo es atómico dentro del mismo
// sistema de archivos), se fuerza a disco con fsync y se renombra encima del destino: quien lea
// ve el archivo anterior entero o el nuevo entero, nunca uno a medias. Si algo falla, el temporal
// se borra y el destino queda como estaba.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function escribirAtomico(destino, datos, opciones = {}) {
  const dir = path.dirname(destino);
  fs.mkdirSync(dir, { recursive: true });
  const temporal = path.join(dir, `.${path.basename(destino)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  let fd = null;
  try {
    // 'wx': el temporal es nuevo; si existiera (nombre repetido) se falla en vez de pisarlo.
    fd = fs.openSync(temporal, 'wx', opciones.mode == null ? 0o600 : opciones.mode);
    fs.writeFileSync(fd, datos);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(temporal, destino);
  } catch (err) {
    if (fd !== null) { try { fs.closeSync(fd); } catch { /* ya cerrado */ } }
    try { fs.unlinkSync(temporal); } catch { /* no llegó a crearse */ }
    throw err;
  }
  // El rename vive en el directorio: sin su fsync, un corte de luz podría devolver el nombre
  // viejo. Donde el sistema no deja abrir un directorio (Windows), se omite sin fallar.
  try {
    const d = fs.openSync(dir, 'r');
    try { fs.fsyncSync(d); } finally { fs.closeSync(d); }
  } catch { /* plataforma sin fsync de directorio */ }
}

module.exports = { escribirAtomico };
