'use strict';
// Decide que es un archivo subido mirando su contenido, no el mimetype que declara el
// navegador: ese lo controla quien sube el archivo, y hasta aqui la sincronizacion se lo
// creia. El criterio es el mismo que ya aplica scripts/descargar-datasheets.js al comprobar
// la firma %PDF de lo que baja, en vez de guardar un HTML con extension .pdf.
//
// Devuelve 'pdf' | 'xlsx' | 'csv' | 'txt', o null si no es ninguno de los que la
// sincronizacion sabe leer — y entonces la ruta responde 415 en vez de mandar a la IA un
// binario cualquiera etiquetado como PDF.

const PDF = Buffer.from('%PDF');
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // XLSX es un ZIP con XML dentro
const TOPE_TEXTO = 64 * 1024;

function esTexto(buf) {
  const muestra = buf.subarray(0, Math.min(buf.length, TOPE_TEXTO));
  for (const b of muestra) {
    // Se admiten tab, salto de linea y retorno; cualquier otro control es binario.
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d) return false;
  }
  return true;
}

function tipoPorFirma(buffer, nombre) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  const ext = String(nombre || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  const extension = ext ? ext[1] : '';

  if (buffer.subarray(0, 4).equals(PDF)) return extension === 'pdf' || extension === '' ? 'pdf' : null;
  if (buffer.subarray(0, 4).equals(ZIP)) return extension === 'xlsx' ? 'xlsx' : null;
  if (esTexto(buffer)) {
    if (extension === 'csv' || extension === 'tsv') return 'csv';
    if (extension === 'txt' || extension === '') return 'txt';
  }
  return null;
}

module.exports = { tipoPorFirma };
