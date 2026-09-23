'use strict';
/* ══ EL TERMINO DE UNA REFERENCIA LO DICE SU CODIGO, NO SU TEXTO (F18 / T23, 2026-09-23) ══
   El informe de auditoria del 23-sep encontro en la price list de Fortinet una referencia de
   60 meses descrita como de un ano: `FG-90G-BDL-1082-60` → «1 Year HW, Sovereign SASE
   Security». Medido sobre las 6.849 referencias de `fortinetSkus.js` es la UNICA, y el precio
   confirma que el codigo tiene razon y el texto no (4.867,40 a 12 meses, 7.326,20 a 36 y
   9.785 a 60). Una cotizacion que la copie tal cual pone delante del cliente «1 Year» junto a
   un precio de cinco anos.

   QUE HACE ESTE MODULO. Compara el termino del CODIGO (sufijo -12/-36/-60, la convencion de
   la price list que ya usa `skuTermino` en fortinet-reglas.js) con el que dice el TEXTO
   («N Year», «N Month»). Si discrepan, gana el codigo —es lo que se pide al distribuidor— y
   la descripcion se corrige A LA VISTA: el texto original se conserva en `dLista` y el
   motivo en `aviso`. No se reescribe el dato en silencio ni se esconde la referencia.

   Lo usan el servicio de referencias (lo que ve y exporta quien cotiza) y el importador (que
   lo reporta al regenerar el archivo, para que una lista nueva con el mismo error se note el
   dia que entra y no el dia que alguien la cotiza). */

const MESES_POR_SUFIJO = { 12: 12, 36: 36, 60: 60 };

// Meses que declara el codigo. `null` si el SKU no lleva sufijo de termino (hardware, o el
// marcador DD de un patron): ahi no hay nada que contrastar.
function mesesDeSku(sku) {
  const x = /-(12|36|60)$/.exec(String(sku || ''));
  return x ? MESES_POR_SUFIJO[x[1]] : null;
}

// Meses que declara el texto. Solo se reconoce la forma de la price list («1 Year», «3 Years»,
// «36 Month»); un texto sin termino no contradice nada y devuelve null.
function mesesDeTexto(d) {
  const t = String(d || '');
  const anos = /\b(\d{1,2})\s*Years?\b/i.exec(t);
  if (anos) return Number(anos[1]) * 12;
  const meses = /\b(\d{1,3})\s*Months?\b/i.exec(t);
  return meses ? Number(meses[1]) : null;
}

function validar(ref) {
  const mesesSku = mesesDeSku(ref && ref.sku);
  const mesesTexto = mesesDeTexto(ref && ref.d);
  const ok = mesesSku == null || mesesTexto == null || mesesSku === mesesTexto;
  return { ok, mesesSku, mesesTexto };
}

// Devuelve la referencia tal cual si es coherente, o una copia con el texto corregido al
// termino del codigo y el original a la vista.
function normalizar(ref) {
  const v = validar(ref);
  if (v.ok) return ref;
  const anos = v.mesesSku % 12 === 0 ? v.mesesSku / 12 : null;
  const nuevo = anos
    ? String(ref.d).replace(/\b\d{1,2}\s*Years?\b/i, `${anos} Year`)
    : String(ref.d).replace(/\b\d{1,3}\s*Months?\b/i, `${v.mesesSku} Month`);
  return {
    ...ref,
    d: nuevo,
    dLista: ref.d,
    aviso: `La price list describe este código de ${v.mesesSku} meses como de ${v.mesesTexto} meses; `
      + 'manda el sufijo del código, que es lo que se pide. Texto original de la lista: «' + ref.d + '».',
  };
}

module.exports = { mesesDeSku, mesesDeTexto, validar, normalizar };
