'use strict';
/* global module, require */
/* ══ MOTOR DEL DIMENSIONADOR NOKIA 7750 SR / 7250 IXR (fase 2 de la auditoria del 2026-11-09, ADR-1, corte 4) ══
   Modulo puro, sin DOM ni estado, con el patron UMD de los demas motores: `NokiaSrMotor` en el
   navegador, require() en las pruebas. Hasta este corte vivia dentro de la pagina
   (dimensionador-nokia-7750sr.js), que ademas ordenaba los candidatos por capacidad sin desempate:
   con dos equipos de la misma capacidad (el SR-1x-48D y el SR-1x-92S dan 6 Tbps) mandaba el orden
   en que el servidor servia el catalogo. Las reglas no cambian; sus comentarios viajan con ellas.

   LAS CONFIGURACIONES DE PUERTOS SON ALTERNATIVAS, NO ACUMULABLES, y UN CHASIS MODULAR NO TIENE
   DENSIDAD PUBLICADA: se aparta con su motivo cuando se pide una densidad concreta (ver la cabecera
   de la pagina). */
(function (root, factory) {
  let PQC = root && root.PQC;
  if (!PQC && typeof require === 'function') PQC = require('./pqc.js');
  const api = factory(PQC);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NokiaSrMotor = api;
})(typeof window !== 'undefined' ? window : globalThis, function (PQC) {
  // Sube cuando una misma entrada puede dar otra recomendacion; viaja a «Supuestos».
  const VERSION_MOTOR = '1.0.0';

  function enPlataforma(m, familia) {
    return !familia || familia === 'all' || m.plat === familia;
  }

  // ¿Alguna configuración del modelo da al menos `qty` puertos a `veloc`? Devuelve la
  // configuración que cumple, o null. No suma entre configuraciones: son alternativas.
  function configQueCumple(m, qty, veloc) {
    if (!qty) return null;
    if (!m.configs) return null;
    for (const c of m.configs) {
      const total = c.puertos
        .filter((p) => p.veloc === veloc)
        .reduce((s, p) => s + p.cantidad, 0);
      if (total >= qty) return { config: c, total };
    }
    return null;
  }

  // Un modelo sin `configs` no es un modelo sin puertos: es un chasis modular o una entrada
  // que publica velocidades sin densidad. No se puede comprobar, y decirlo es la respuesta.
  function sinDensidad(m) {
    return !m.configs;
  }

  // `pqc` (2026-10-27): el nivel de criptografía post-cuántica exigido. Lo que no lo documenta
  // se aparta con su motivo (la regla única de pqc.js) y se dice, sin mezclarlo con los chasis
  // que no se pudieron comprobar por puertos.
  function filtrar({ models, need, portQty, portVel, familia: plataforma, pqc }) {
    const familia = models.filter((m) => enPlataforma(m, plataforma));
    const cumplenCaudal = familia.filter((m) => m.cap >= need);

    const candidatos = [];
    const apartados = [];
    const outByPqc = [];
    for (const m of cumplenCaudal) {
      const mot = PQC.motivo(m, pqc);
      if (mot) { outByPqc.push({ m, motivo: mot }); continue; }
      if (!portQty) { candidatos.push(m); continue; }
      if (sinDensidad(m)) {
        apartados.push({ m, motivo: m.notaPuertos });
        continue;
      }
      const ok = configQueCumple(m, portQty, portVel);
      if (ok) candidatos.push(Object.assign({}, m, { __config: ok }));
    }
    return { familia, candidatos, apartados, outByPqc };
  }

  // Requerimiento de diseno, en Gbps: el caudal con el margen. Un caudal negativo cuenta como
  // ninguno: si no, la ficha decia «Requerimiento -6 Gbps». La misma cuenta que hacia la pagina.
  function demanda(p) {
    const bw = Math.max(0, Number(p && p.bw) || 0);
    return { need: Math.round(bw * (1 + (Number(p && p.head) || 0))) };
  }

  const porId = (a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true });

  // Ciclo de vida (FICHA.rango, que pasa quien llama), capacidad y, en empate, el id en orden
  // natural: el SR-1x-48D antes que el SR-1x-92S, como en los demas motores.
  function ordenar(lista, rango) {
    const r = typeof rango === 'function' ? rango : () => 0;
    return [...(lista || [])].sort((a, b) => r(a) - r(b) || a.cap - b.cap || porId(a, b));
  }

  /* evaluar(escenario, catalogo, opciones): el sobre del contrato comun.
       escenario   { need, portQty, portVel, familia, pqc } (need en Gbps; o bw y head, y se calcula)
       catalogo    { models }: los catorce modelos como los sirve la ruta
       opciones    { rango, recomendar } de FICHA (sin ellos, todo vigente y el primero)
     Devuelve { version, need, familia, candidatos (ordenados), recomendado, apartados (los chasis
     que no se pudieron comprobar por puertos, con su motivo), outByPqc }. */
  function evaluar(escenario, catalogo, opciones) {
    const e = escenario || {};
    const o = opciones || {};
    const need = e.need != null ? e.need : demanda(e).need;
    const r = filtrar({ models: (catalogo && catalogo.models) || [], need, portQty: e.portQty, portVel: e.portVel,
      familia: e.familia, pqc: e.pqc });
    const candidatos = ordenar(r.candidatos, o.rango);
    const recomendar = typeof o.recomendar === 'function' ? o.recomendar : (l) => l[0] || null;
    return { version: VERSION_MOTOR, need, familia: r.familia, candidatos, recomendado: recomendar(candidatos),
      apartados: r.apartados, outByPqc: r.outByPqc };
  }

  return { VERSION_MOTOR, enPlataforma, configQueCumple, sinDensidad, filtrar, demanda, ordenar, evaluar };
});
