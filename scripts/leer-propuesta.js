#!/usr/bin/env node
'use strict';
/* EL FABRICANTE DE UNA PROPUESTA, COMPROBADO ANTES DE QUE LLEGUE A NINGÚN COMANDO (2026-10-02).

   `aplicar-propuesta.yml` recibe pegado el JSON que descarga el panel de sincronización. Lo
   genera una IA que pudo leer un documento subido por cualquiera, y el workflow metía su
   `vendor` en comandos de shell (`git checkout -B propuesta/${vendor}…` y el mensaje del
   commit). No era explotable solo porque el importador no aplica nada con un fabricante
   desconocido y entonces nunca se llegaba a ese paso: una defensa por casualidad. Ahora el
   fabricante tiene que ser, tal cual, uno de los que el importador conoce (`ARCHIVOS`), y se
   comprueba al principio.

     node scripts/leer-propuesta.js propuesta.json   imprime el fabricante o sale con 1 */
const fs = require('fs');
const { ARCHIVOS } = require('./importar-propuesta');

function fabricanteDe(texto) {
  let p;
  try { p = JSON.parse(texto); } catch { throw new Error('lo pegado no es JSON válido'); }
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('la propuesta tiene que ser un objeto {"vendor": …, "cambios": […]}');
  // Sin recortar ni adivinar: el importador busca el fabricante tal cual (en minúsculas), y
  // aceptar aquí algo que él rechaza solo movería el fallo a otro paso. El mensaje no repite
  // lo recibido, que puede ser cualquier cosa.
  const v = typeof p.vendor === 'string' ? p.vendor.toLowerCase() : '';
  if (!Object.prototype.hasOwnProperty.call(ARCHIVOS, v)) {
    throw new Error(`la propuesta no trae un fabricante conocido (${Object.keys(ARCHIVOS).join(', ')})`);
  }
  if (!Array.isArray(p.cambios)) throw new Error('la propuesta no trae la lista "cambios"');
  return v;
}

if (require.main === module) {
  try {
    process.stdout.write(fabricanteDe(fs.readFileSync(process.argv[2], 'utf8')));
  } catch (e) {
    console.error(`[propuesta] ${e.message}`);
    process.exit(1);
  }
}

module.exports = { fabricanteDe };
