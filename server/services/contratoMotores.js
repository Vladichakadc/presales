'use strict';
/* EL CONTRATO COMUN DE LOS OCHO MOTORES (ADR-1 de la auditoria del 2026-11-09; 2026-11-12).

   Cada fabricante tiene su motor en public/js/, y cada uno nacio con su firma: Cisco es
   `evaluar(models, p)`, Huawei y MikroTik `evaluar(esc, modelos, opciones)`, Fortinet devuelve
   `elegibles` y `recomendacion`, y el fabric de Nokia no elige entre candidatos: calcula un diseno.
   Aqui hay UNA firma y UN sobre para los ocho, sin tocar la firma de ninguno:

     MOTORES[fabricante].evaluar(escenario, catalogo, opciones)
       escenario   el del motor, tal cual lo arma su pagina
       catalogo    la proyeccion que sirve GET /api/dimensionador/<fabricante> ({ models, ... })
       opciones    lo que da FICHA (rango, recomendar, recomendable) y lo propio de cada motor
                   (Fortinet `hoy`; MikroTik `licencias` y `bgpRam`; Aruba `pagina`)
     -> { fabricante, version, candidatos, recomendado, apartados, nativo }
       version      la VERSION_MOTOR del motor
       candidatos   los MODELOS que cumplen, en el orden en que el motor los propone
       recomendado  uno de `candidatos`, o null
       apartados    lo que no cumple, con la forma y los motivos de cada motor (no se reescriben)
       nativo       lo que devolvio el motor, entero: quien necesite una cifra la lee de ahi

   UNA ENVOLTURA NO DECIDE. No filtra y no cambia el recomendado: lee lo que el motor ya decidio. La
   unica que ordena es la de Cisco, y lo hace con la regla que tiene su pagina (vigente antes que
   fuera de venta sobre el orden del motor, y FICHA.recomendar): test/contrato-motores.test.js
   sujeta esas dos lineas de la pagina, para que no haya dos reglas sin que nadie lo vea.

   Lo usa la prueba de contrato, que recorre los ocho con una sola bateria. */
const path = require('path');

const motor = (archivo) => require(path.join(__dirname, '..', '..', 'public', 'js', archivo));
const Fortinet = motor('fortinet-motor.js');
const Cisco = motor('cisco-motor.js');
const Huawei = motor('huawei-motor.js');
const Mikrotik = motor('mikrotik-motor.js');
const Juniper = motor('juniper-motor.js');
const NokiaSr = motor('nokia-sr-motor.js');
const NokiaFabric = motor('nokia-fabric-motor.js');
const Aruba = motor('aruba-reglas.js');

const modelos = (catalogo) => (catalogo && catalogo.models) || [];
const primero = (lista) => lista[0] || null;

const MOTORES = {
  fortinet: {
    motor: Fortinet,
    // `elegibles` ya va ordenado por el motor (vigente, lo que soporta e id) y `recomendacion`
    // aplica el segmento del sitio.
    evaluar(escenario, catalogo, opciones) {
      const nativo = Fortinet.evaluar(escenario, catalogo, opciones);
      return { candidatos: nativo.elegibles.map((c) => c.modelo), recomendado: nativo.recomendacion ? nativo.recomendacion.modelo : null,
        apartados: nativo.descartados, nativo };
    },
  },
  cisco: {
    motor: Cisco,
    // El motor ordena por capacidad equivalente e id; el ciclo de vida lo pone la pagina con
    // FICHA.ordenar, que es un orden estable sobre el del motor. Aqui, la misma regla.
    evaluar(escenario, catalogo, opciones) {
      const o = opciones || {};
      const nativo = Cisco.evaluar(modelos(catalogo), escenario);
      const rango = typeof o.rango === 'function' ? o.rango : () => 0;
      const candidatos = nativo.candidatos.map((f) => f.m).sort((a, b) => rango(a) - rango(b));
      const recomendar = typeof o.recomendar === 'function' ? o.recomendar : primero;
      return { candidatos, recomendado: recomendar(candidatos), apartados: nativo.apartados, nativo };
    },
  },
  huawei: {
    motor: Huawei,
    evaluar(escenario, catalogo, opciones) {
      const nativo = Huawei.evaluar(escenario, modelos(catalogo), opciones);
      return { candidatos: nativo.fit.map((r) => r.m), recomendado: nativo.pick ? nativo.pick.m : null,
        apartados: nativo.rows.filter((r) => r.miss.length), nativo };
    },
  },
  mikrotik: {
    motor: Mikrotik,
    evaluar(escenario, catalogo, opciones) {
      const nativo = Mikrotik.evaluar(escenario, modelos(catalogo), opciones);
      return { candidatos: nativo.fit.map((r) => r.m), recomendado: nativo.pick ? nativo.pick.m : null,
        apartados: nativo.rows.filter((r) => r.miss.length), nativo };
    },
  },
  juniper: {
    motor: Juniper,
    // La ruta sirve los SRX en `models` y los Session Smart en `sdwan`; el motor los llama srx y ssr.
    evaluar(escenario, catalogo, opciones) {
      const c = catalogo || {};
      const nativo = Juniper.evaluar(escenario, { srx: c.srx || c.models || [], ssr: c.ssr || c.sdwan || [] }, opciones);
      return { candidatos: nativo.candidatos, recomendado: nativo.recomendado, apartados: nativo.apartados, nativo };
    },
  },
  'nokia-sr': {
    motor: NokiaSr,
    evaluar(escenario, catalogo, opciones) {
      const nativo = NokiaSr.evaluar(escenario, catalogo, opciones);
      return { candidatos: nativo.candidatos, recomendado: nativo.recomendado,
        apartados: { puertos: nativo.apartados, outByPqc: nativo.outByPqc }, nativo };
    },
  },
  'nokia-fabric': {
    motor: NokiaFabric,
    // El fabric no elige entre candidatos: el leaf es el primero de su rol que sirve la velocidad,
    // y el diseno (cuantos leaf y spine, el spine) va en `nativo`. Sin diseno, su motivo.
    evaluar(escenario, catalogo) {
      const nativo = NokiaFabric.evaluar(escenario, catalogo);
      return { candidatos: nativo.ok ? [nativo.leaf] : [], recomendado: nativo.ok ? nativo.leaf : null,
        apartados: nativo.ok ? [] : [{ motivo: nativo.motivo }], nativo };
    },
  },
  aruba: {
    motor: Aruba,
    evaluar(escenario, catalogo, opciones) {
      const nativo = Aruba.evaluar(escenario, catalogo, opciones);
      return { candidatos: nativo.candidatos, recomendado: nativo.recomendado, apartados: nativo.apartados, nativo };
    },
  },
};

// El sobre: el fabricante y la version del motor delante de lo que arma cada envoltura.
function evaluar(fabricante, escenario, catalogo, opciones) {
  const def = MOTORES[fabricante];
  if (!def) throw new Error(`No hay motor de «${fabricante}». Los que hay: ${Object.keys(MOTORES).join(', ')}.`);
  return { fabricante, version: def.motor.VERSION_MOTOR, ...def.evaluar(escenario, catalogo, opciones) };
}

module.exports = { MOTORES, FABRICANTES: Object.keys(MOTORES), evaluar };
