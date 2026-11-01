'use strict';
/* global module */
/* ══ EXPLICACIÓN DEL RESULTADO DEL DIMENSIONADOR FORTIGATE (2026-10-31) ═══════════════════
   Fase 3.2 del plan de mejora de los dimensionadores, primera entrega: lo que la página dice
   SOBRE el resultado del motor —por qué se apartó cada modelo, qué fuera de venta cumplen, cómo se
   licencia FortiGuard en HA— vivía en dimensionador-fortinet-fortigate.js, junto al DOM, y solo se
   podía probar recortando su código con una expresión regular. Aquí, sin DOM ni estado: reciben el
   resultado de `FortinetMotor.evaluar` (o el modelo y el modo de HA) y devuelven datos o texto.

   NO es parte del motor: `fortinet-motor.js` y `fortinet-reglas.js` (arquitectura aprobada por el
   dueño el 2026-10-07) no se tocan. Esto solo lee lo que el motor ya decidió.

   Mismo patrón UMD que fortinet-reglas.js: global `FortinetExplicacion` en el navegador y
   require() en las pruebas de Node (test/fortinet-explicacion.test.js). La página conserva los
   mismos nombres como envoltorios de una línea. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FortinetExplicacion = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  // Las restricciones del motor, dichas para quien lee la lista de descartados.
  const RESTRICCION_N = {
    CICLO_VIDA: 'fuera de venta en compra nueva', FORTIOS_INCOMPATIBLE: 'FortiOS no admite la función pedida',
    PROXY_LIMITADO: 'soporte proxy limitado', PUERTOS_INSUFICIENTES: 'puertos insuficientes',
    ALMACENAMIENTO_SIN_DATO: 'disco sin dato', ALMACENAMIENTO_INSUFICIENTE: 'disco insuficiente',
    POE_SIN_DATO: 'PoE sin dato', POE_NO_DISPONIBLE: 'sin PoE en el SKU base',
    PSU_SIN_DATO: 'fuente sin dato', PSU_SIN_REDUNDANCIA: 'sin fuente redundante',
  };

  // Los descartados agrupados por motivo: apartados porque el catálogo no trae la cifra de un eje
  // (una tarea de datos, no una falta de capacidad), los que no llegan por el eje que manda y los
  // que bloquea una restricción.
  function resumenDescartes(r) {
    const sinDato = new Map();
    const porCapacidad = new Map();
    const porRestriccion = new Map();
    for (const c of r.descartados) {
      const ev = c.eval;
      if (ev.estado === 'apartado' && ev.apartadoPor) {
        if (!sinDato.has(ev.apartadoPor)) sinDato.set(ev.apartadoPor, { n: ev.apartadoPorN, modelos: [] });
        sinDato.get(ev.apartadoPor).modelos.push(c.id);
      } else if (ev.estado === 'excede' && ev.manda) {
        const k = ev.manda.k;
        if (!porCapacidad.has(k)) porCapacidad.set(k, { n: ev.manda.n, modelos: [] });
        porCapacidad.get(k).modelos.push(c.id);
      } else if (c.bloqueos.length) {
        for (const b of c.bloqueos) {
          if (!porRestriccion.has(b.codigo)) porRestriccion.set(b.codigo, { n: b.codigo, ejemplo: b.mensaje, modelos: [] });
          porRestriccion.get(b.codigo).modelos.push(c.id);
        }
      }
    }
    return { sinDato, porCapacidad, porRestriccion };
  }

  // Los fuera de venta que cumplen el escenario y solo se apartan por su ciclo de vida (compra
  // nueva): van al desplegable de la ficha, detrás de los vigentes. Nunca salen recomendados.
  function fueraDeVentaQueCumplen(r) {
    return r.candidatos
      .filter((c) => !c.elegible && c.eol && c.eval.estado === 'ok' && c.bloqueos.length
        && c.bloqueos.every((b) => b.codigo === 'CICLO_VIDA'))
      .sort((a, b) => a.soporta - b.soporta);
  }

  // Cómo se licencia FortiGuard en HA (F3, guía de FortiOS 7.6.6). `cotizada` dice si el BOM ya
  // trae la licencia única del par; la página lo calcula con su resultado (`unicaCotizada`).
  function licenciaHa(m, modo, cotizada) {
    if (modo === 'standalone') return null;
    const u = m && m.haLicenciaUnica;
    if (u && modo === 'ha-ap' && cotizada) {
      return { unica: true, texto: `una sola suscripción para el par: ${u.skuHa} × 2 y un bundle registrado a su número de `
        + 'serie virtual (licencia única de la guía de FortiOS 7.6.6)' };
    }
    if (u && modo === 'ha-ap') {
      return { unica: true, texto: `este BOM cotiza una suscripción por nodo, pero la serie ${u.serie} admite una sola `
        + `para el par en activo-pasivo, con dos unidades del SKU de HA (${u.skuHa || 'que la lista firmada no trae para '
        + 'este modelo: consultar'}), según la guía de FortiOS 7.6.6` };
    }
    return { unica: false, texto: u
      ? 'una suscripción por nodo: la licencia única de su serie solo vale en activo-pasivo (guía de FortiOS 7.6.6)'
      : 'una suscripción por nodo: la guía de FortiOS 7.6.6 no da licencia única en HA a este modelo' };
  }

  return { RESTRICCION_N, resumenDescartes, fueraDeVentaQueCumplen, licenciaHa };
});
