#!/usr/bin/env node
'use strict';
/* LOS DATASHEETS DE ARUBA, COMPROBADOS EN EL JOB QUE TIENE PERMISOS (2026-10-02).

   `datasheets-aruba.yml` corre en dos jobs. `descargar` baja los PDF de HPE sin permiso de
   escritura y deja los nuevos o cambiados como artefacto; `publicar` tiene el permiso para
   empujar la rama y no ejecuta nada más que esto y git.

     node scripts/publicar-datasheets.js <carpeta del artefacto>

   Lo que llega se trata como DATO: solo se copia a `public/datasheets/` un archivo cuyo nombre
   es uno de los que declara `DATASHEETS` en `legacyData/aruba.js` (la misma lista que usan la
   aplicación y el descargador), que empieza por la firma `%PDF-` y que no pasa de 30 MB, con
   150 MB en total. Se comprueba todo antes de copiar nada: si un archivo no encaja, sale con 1
   y no copia ninguno. Deja `cuantos` y `peso` en `$GITHUB_OUTPUT` para el resumen. */
const fs = require('fs');
const path = require('path');
const { DATASHEETS } = require('../server/seed/legacyData/aruba');

const MAX_ARCHIVO = 30 * 1024 * 1024;
const MAX_TOTAL = 150 * 1024 * 1024;
const DESTINO = path.join(__dirname, '..', 'public', 'datasheets');

const permitidos = () => new Set(Object.values(DATASHEETS).filter((d) => d && d.url && typeof d.file === 'string').map((d) => d.file));

// Lo que se puede copiar, o el motivo por el que no.
function revisar(dir, nombres = permitidos()) {
  if (!fs.existsSync(dir)) return { error: 'el artefacto no trae la carpeta de documentos' };
  const archivos = [];
  let total = 0;
  for (const nombre of fs.readdirSync(dir)) {
    const ruta = path.join(dir, nombre);
    const st = fs.lstatSync(ruta);
    if (!st.isFile()) return { error: `«${nombre}» no es un archivo normal` };
    if (!nombres.has(nombre)) return { error: `«${nombre}» no está en el manifiesto DATASHEETS` };
    if (st.size > MAX_ARCHIVO) return { error: `«${nombre}» pasa de 30 MB` };
    const cabeza = Buffer.alloc(5);
    const fd = fs.openSync(ruta, 'r');
    try { fs.readSync(fd, cabeza, 0, 5, 0); } finally { fs.closeSync(fd); }
    if (cabeza.toString('latin1') !== '%PDF-') return { error: `«${nombre}» no empieza por la firma %PDF-` };
    total += st.size;
    archivos.push(nombre);
  }
  if (total > MAX_TOTAL) return { error: 'el artefacto pasa de 150 MB' };
  return { archivos, total };
}

function publicar(dir, destino = DESTINO) {
  const { error, archivos, total } = revisar(dir);
  if (error) throw new Error(error);
  for (const nombre of archivos) fs.copyFileSync(path.join(dir, nombre), path.join(destino, nombre));
  return { archivos, total };
}

if (require.main === module) {
  try {
    const { archivos, total } = publicar(process.argv[2]);
    const peso = `${(total / (1024 * 1024)).toFixed(1)} MB`;
    console.log(`[datasheets] ${archivos.length} PDF validado(s) y copiado(s), ${peso}: ${archivos.join(', ') || '(ninguno)'}`);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `cuantos=${archivos.length}\npeso=${peso}\n`);
  } catch (e) {
    console.error(`[datasheets] no se publica nada: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { revisar, publicar, permitidos };
