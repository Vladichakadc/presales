'use strict';
/* global module */
/* ══ MOTOR DEL DIMENSIONADOR NOKIA 7220 IXR, EL FABRIC LEAF-SPINE (fase 2 de la auditoria del 2026-11-09, ADR-1, corte 4) ══
   Modulo puro, sin DOM ni estado, con el patron UMD de los demas motores: `NokiaFabricMotor` en el
   navegador, require() en las pruebas. Hasta este corte vivia dentro de la pagina
   (dimensionador-nokia-7220ixr.js). Es el unico dimensionador que no elige UN equipo: dice cuantos
   leafs y cuantos spines, y de que modelo. El leaf y el spine eran el primero de su rol en el orden
   en que llegaba el catalogo; ahora el orden es explicito (el id en orden natural), el mismo que
   sirve la ruta hoy, asi que el resultado no cambia. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NokiaFabricMotor = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  // Sube cuando una misma entrada puede dar otro fabric; viaja a «Supuestos».
  const VERSION_MOTOR = '1.0.0';

  const porId = (a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true });

  function puertosDe(modelo, veloc, usos) {
    return (modelo.puertos || [])
      .filter((p) => usos.includes(p.uso) && p.veloc === veloc)
      .reduce((s, p) => s + p.cantidad, 0);
  }

  function velocidadesFabric(modelo) {
    return [...new Set((modelo.puertos || [])
      .filter((p) => p.uso === 'fabric' || p.uso === 'ambos')
      .map((p) => p.veloc))];
  }

  // Cuando acceso y fabric comparten el mismo pool de puertos a la misma velocidad (D3L usado
  // como leaf), hay que repartir: más puertos de acceso deja menos para subir, y viceversa.
  // Se busca el reparto que sirve a MÁS servidores por leaf sin dejar de cumplir la
  // sobresuscripción pedida — menos leafs es siempre mejor con el mismo hardware.
  function repartoCompartido(totalPuertos, oversub) {
    for (let acceso = totalPuertos; acceso >= 1; acceso--) {
      const uplinks = Math.ceil(acceso / oversub);
      if (acceso + uplinks <= totalPuertos) return { acceso, uplinks };
    }
    return { acceso: 0, uplinks: 0 };
  }

  // Las velocidades de acceso que algun leaf del catalogo publica: las que la pagina puede ofrecer.
  // test/nokia-motores.test.js exige que su desplegable sean exactamente estas (2026-11-12: ofrecia
  // «1 GbE», que ningun modelo trae, y elegirlo daba «sin diseno posible»).
  function velocidadesAcceso(models) {
    return [...new Set((models || []).filter((m) => (m.rol || []).includes('leaf'))
      .flatMap((m) => (m.puertos || []).filter((p) => p.uso === 'acceso' || p.uso === 'ambos').map((p) => p.veloc)))]
      .sort((a, b) => a - b);
  }

  function calcularFabric({ models: servidos, servers, accesoVel, dual, oversub }) {
    // El leaf y el spine son el primero de su rol que sirve la velocidad: en el orden natural del id
    // (D2L antes que D3L), no en el que llegue el catalogo (fase 2 de la auditoria del 2026-11-09).
    const models = [...(servidos || [])].sort(porId);
    const totalAcceso = Math.max(1, Math.round(servers)) * (dual ? 2 : 1);

    const leaf = models.find((m) => (m.rol || []).includes('leaf')
      && puertosDe(m, accesoVel, ['acceso', 'ambos']) > 0);
    if (!leaf) {
      return { ok: false, motivo: `Ningún modelo de la línea 7220 IXR ofrece puertos de acceso a ${accesoVel} GbE.` };
    }

    const esCompartido = !(leaf.puertos || []).some((p) => p.uso === 'acceso' && p.veloc === accesoVel)
      || (leaf.puertos || []).some((p) => p.uso === 'ambos' && p.veloc === accesoVel);

    let accesoPorLeaf; let uplinksPorLeaf; let velocUplink; let uplinksDisponiblesLeaf;

    if (esCompartido) {
      // Pool único (D3L): acceso y subida salen del mismo grupo de puertos, a la misma
      // velocidad — se resuelve el reparto en vez de sumar dos grupos separados.
      const totalPool = puertosDe(leaf, accesoVel, ['ambos']);
      const reparto = repartoCompartido(totalPool, oversub);
      accesoPorLeaf = reparto.acceso;
      uplinksPorLeaf = reparto.uplinks;
      velocUplink = accesoVel;
      uplinksDisponiblesLeaf = totalPool - accesoPorLeaf;
    } else {
      accesoPorLeaf = puertosDe(leaf, accesoVel, ['acceso']);
      const velsFabric = velocidadesFabric(leaf);
      velocUplink = velsFabric[0];
      const puertosFabricLeaf = puertosDe(leaf, velocUplink, ['fabric']);
      const capacidadAccesoGbps = accesoPorLeaf * accesoVel;
      const capacidadUplinkNecesaria = capacidadAccesoGbps / oversub;
      uplinksPorLeaf = Math.min(
        Math.max(1, Math.ceil(capacidadUplinkNecesaria / velocUplink)),
        puertosFabricLeaf,
      );
      uplinksDisponiblesLeaf = puertosFabricLeaf;
    }

    if (accesoPorLeaf <= 0) {
      return { ok: false, motivo: `El ${leaf.id} no tiene margen para servir puertos de acceso a ${accesoVel} GbE con esa sobresuscripción.` };
    }

    const numLeafs = Math.ceil(totalAcceso / accesoPorLeaf);
    const oversubReal = (accesoPorLeaf * accesoVel) / (uplinksPorLeaf * velocUplink);
    const uplinkInsuficiente = uplinksPorLeaf > uplinksDisponiblesLeaf;

    const spine = models.find((m) => (m.rol || []).includes('spine')
      && puertosDe(m, velocUplink, ['fabric', 'ambos']) > 0);
    if (!spine) {
      return {
        ok: false,
        motivo: `Los uplinks del ${leaf.id} son de ${velocUplink} GbE y ningún modelo de la línea 7220 IXR tiene puertos de spine a esa velocidad — hace falta un modelo intermedio de agregación que este catálogo todavía no cubre.`,
      };
    }
    const puertosPorSpine = puertosDe(spine, velocUplink, ['fabric', 'ambos']);
    const numSpines = uplinksPorLeaf;
    const spineInsuficiente = puertosPorSpine < numLeafs;

    return {
      ok: true,
      totalAcceso, accesoVel, oversub, dual,
      leaf, numLeafs, accesoPorLeaf, uplinksPorLeaf, velocUplink, oversubReal, uplinkInsuficiente,
      spine, numSpines, puertosPorSpine, spineInsuficiente,
    };
  }

  // El sobre del contrato comun: el fabric de calcularFabric con la version del motor.
  //   escenario { servers, accesoVel, dual, oversub } · catalogo { models }
  function evaluar(escenario, catalogo) {
    const e = escenario || {};
    return { version: VERSION_MOTOR, ...calcularFabric({ ...e, models: (catalogo && catalogo.models) || [] }) };
  }

  return { VERSION_MOTOR, puertosDe, velocidadesFabric, velocidadesAcceso, repartoCompartido, calcularFabric, evaluar };
});
