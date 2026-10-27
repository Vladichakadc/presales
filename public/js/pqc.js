'use strict';
/* global module */
/* ══ CRIPTOGRAFIA POST-CUANTICA: EL REQUISITO «EXIGIR PQC» (2026-10-27) ══
   La mejora propuesta al cerrar la quincuagesimoseptima entrega, aprobada con «ejecuta las
   mejoras propuestas»: para el pliego que pide cifrado resistente a la computacion cuantica,
   los siete dimensionadores apartan el equipo que no lo trae documentado. UNA sola regla para
   los siete (y para el motor de Fortinet, que corre tambien en el servidor):
     ''       no se exige (por defecto);
     'clave'  basta un mecanismo quantum-safe documentado: una clave simetrica precompartida
              (PPK de RFC 8784 en IKEv2, o MACsec/ANYsec con clave precompartida) o ML-KEM;
     'mlkem'  hace falta un algoritmo post-cuantico ML-KEM (FIPS 203).
   Un equipo sin `pqc` sale con «no consta en ningun documento oficial», nunca «no la tiene»:
   que el catalogo no traiga el documento no prueba que el equipo no la tenga. El dato `pqc`
   y su fuente los pone `legacyData/` (ver `seccionPqc` en ficha.js). */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.PQC = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  const NIVELES = {
    '': 'No se exige',
    clave: 'Mecanismo quantum-safe documentado (PPK, MACsec/ANYsec o ML-KEM)',
    mlkem: 'Algoritmo post-cuántico ML-KEM (FIPS 203)',
  };
  const TIPO = { mlkem: 'ML-KEM', ppk: 'PPK (RFC 8784)', macsec: 'MACsec/ANYsec quantum-safe' };

  // El nivel que llega de un formulario o de un enlace: lo desconocido es «no se exige».
  function nivel(v) { return Object.prototype.hasOwnProperty.call(NIVELES, v) && v ? v : ''; }

  // null si cumple; si no, el motivo para apartarlo, dicho como lo que es.
  function motivo(m, n) {
    const k = nivel(n);
    if (!k) return null;
    const p = m && m.pqc;
    if (!p) return 'criptografía post-cuántica: no consta en ningún documento oficial que la traiga';
    if (k === 'mlkem' && p.tipo !== 'mlkem') {
      return `criptografía post-cuántica: su documento da ${TIPO[p.tipo] || p.tipo}, no un algoritmo ML-KEM`;
    }
    return null;
  }

  return { NIVELES, TIPO, nivel, motivo };
}));
