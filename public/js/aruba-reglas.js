'use strict';
/* global module */
/* ══ REGLAS PURAS DEL DIMENSIONADOR ARUBA (fase 1 de la auditoria 2026-09-17) ══
   La auditoria tecnica del 2026-09-17 (documento «Auditoria tecnica — Dimensionador
   Aruba») encontro cinco fallos criticos que cambiaban el equipo o el precio de la
   propuesta. Cuatro de ellos eran reglas de calculo enterradas en la pagina, sin prueba
   posible porque la pagina necesita DOM. Se extraen aqui, sin DOM ni estado, con el mismo
   patron UMD que motor-ingenieria.js: global `ArubaReglas` en el navegador y require()
   en los tests de Node (test/aruba-auditoria-fase1.test.js).

   C1 · tierParaCaudal   — el tier automatico solo elige entre los tiers que EXISTEN para
                           el nivel deducido. Foundation se vende en 100 Mbps, 1 Gbps e
                           ilimitado; proponer «Foundation 200 Mbps» dejaba la suscripcion
                           en «consultar» y fuera del total.
   C2/C3 · capacidadSo   — gateways: las cifras de APs, clientes y licencia de capacidad
                           dependen del sistema operativo (AOS 10 / AOS 8). El catalogo
                           mezclaba cifras AOS 8 con SKU de licencia AOS 10.
   C4 · boostMbpsSitio   — Boost = 30 % del trafico WAN PRIVADO que viaja por el tunel
                           (regla de preventa declarada), no del requerimiento inflado con
                           margen, penalizaciones y una cuota de breakout invertida.
        boostRecMbps     — el Boost recomendado por HPE de cada appliance, como numero,
                           para descartar el modelo que no lo sostiene.
   A1 · admiteDtd        — Dynamic Threat Defense no corre en EC-XS (doc oficial): filtro
                           duro, no solo un aviso rojo debajo de la recomendacion.
   R11/M9 · escenariosUnderlay (2026-09-24) — un enlace de respaldo no suma en operacion
                           normal: un 4G de backup inflaba el caudal, el tier y a veces el
                           appliance. Misma regla que Fortinet (etapa 7). */
(function(root, factory){
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ArubaReglas = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){

  // Porcentaje del trafico WAN privado que se licencia como Boost. Regla de preventa del
  // dueño (2026-09-13), SIN FUENTE oficial: HPE no publica porcentaje guia; la unica regla
  // de campo localizada sugiere 40 % (discrepancia documentada en aruba.js/fuentes.js).
  const BOOST_CUOTA = 0.30;

  // C1. `tiers` = SIZING.bwTiers (ordenados de menor a mayor, el ilimitado con mbps null al
  // final); `licenses` = LICENSES del API ({bw100:{foundation:{…},advanced:{…}}, …}).
  // Un tier sin datos de licencia en absoluto se conserva (misma semantica que el filtro
  // del selector manual: `!lic || lic[nivel]`); uno que tiene datos pero no para el nivel
  // pedido NO existe para ese nivel y se salta.
  function tierParaCaudal(tiers, licenses, mbps, nivel) {
    const lista = (tiers || []).filter((t) => {
      if (!nivel) return true;
      const lic = licenses && licenses[t.code];
      return !lic || !!lic[nivel];
    });
    for (const t of lista) {
      if (t.mbps != null && t.mbps >= mbps) return t;
    }
    // Por encima del ultimo tier con cifra: el ilimitado, si existe para el nivel.
    const ilimitado = lista.find((t) => t.mbps == null);
    return ilimitado || lista[lista.length - 1] || null;
  }

  // C2/C3. Capacidad del gateway para el sistema operativo elegido.
  //   `m.porSo` ausente           → las cifras base del modelo valen para ambos SO.
  //   `m.porSo[so]` es un objeto  → se superpone a las cifras base (aps, clients, licCap…).
  //   `m.porSo[so] === null`      → el catalogo NO tiene cifras de ese modelo para ese SO
  //                                  (o el modelo no lo soporta): no se puede afirmar que
  //                                  cumpla, y el dimensionador lo descarta explicandolo.
  // Devuelve {sinCifra:true, motivo} o el objeto a superponer ({} si no hay cambio).
  function capacidadSo(m, so) {
    if (!m || !m.porSo || !so) return {};
    if (!(so in m.porSo)) return {};
    const ov = m.porSo[so];
    if (ov === null) {
      const motivo = (m.porSoMotivo && m.porSoMotivo[so]) || 'sin cifras de capacidad para este sistema operativo en el catalogo';
      return { sinCifra: true, motivo };
    }
    return ov;
  }

  // C4. Mbps de Boost que necesita la sede.
  //   · Con enlaces declarados: el 30 % del trafico que el motor de ingenieria deja en los
  //     tuneles privados (`bwTunelesPrivados`: todo el underlay sin breakout; con breakout,
  //     la cuota interna de la regla 70/30 del brief). Es trafico ACTUAL: Boost se reasigna
  //     del pool en minutos sin tocar hardware, asi que no se le aplica margen de
  //     crecimiento, penalizacion de funcion ni paridad FEC (que se añade DESPUES de
  //     optimizar, en el lado WAN).
  //   · Sin enlaces: el 30 % de la demanda estimada actual (usuarios × Mbps/usuario).
  function boostMbpsSitio({ bwTunelesPrivados = 0, caudalTotal = 0, users = 0, perUser = 0 } = {}) {
    const privado = caudalTotal > 0 ? bwTunelesPrivados : users * perUser;
    return Math.round(BOOST_CUOTA * Math.max(0, privado || 0));
  }

  // Boost recomendado por HPE (spec.boostRec: «200 Mbps», «1 Gbps», «8 Gbps»), en Mbps.
  // null = el catalogo no lo publica para ese modelo (EC-V): no descarta, se declara.
  function boostRecMbps(m) {
    const s = m && m.spec && m.spec.boostRec;
    if (!s) return null;
    const x = /([\d.,]+)\s*(G|M)bps/i.exec(String(s));
    if (!x) return null;
    const n = parseFloat(x[1].replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    return /g/i.test(x[2]) ? Math.round(n * 1000) : Math.round(n);
  }

  // A1. ¿Admite Dynamic Threat Defense (IDS/IPS en el chasis)? Solo EdgeConnect, y no el
  // modelo que el catalogo marca `dtd:false` (EC-XS, doc oficial de IDS/IPS).
  function admiteDtd(m) {
    return !!m && m.fam === 'ec' && m.dtd !== false;
  }

  // R11/M9 (2026-09-24). Escenarios de trafico del underlay, con la MISMA regla que
  // `FortinetMotor.escenariosTrafico` (etapa 7 de Fortinet): un enlace de respaldo no suma en
  // operacion normal; cuando cae un activo, su carga migra a los respaldos hasta su caudal, y
  // lo que no cabe es `perdida`. El trafico que un respaldo recoge cuenta en la familia del
  // RESPALDO: si cae el MPLS y lo cubre un 4G, ese caudal viaja por Internet.
  //   · Sin ningun respaldo declarado devuelve solo la operacion normal, con las mismas sumas
  //     de siempre: por eso los enlaces ya compartidos (que no traen `rol`) no cambian.
  //   · Ninguna falla supera a la operacion normal (se quita un activo y entra como mucho su
  //     mismo caudal), asi que el appliance, el tier y el Boost se dimensionan con `normal`;
  //     las fallas sirven para decir cuanto se pierde si el respaldo no alcanza.
  function escenariosUnderlay(wanLinks) {
    const todos = wanLinks || [];
    const enl = todos.filter((l) => l.down > 0);
    const esMpls = (l) => /^MPLS/.test(l.tipo);
    const act = enl.filter((l) => l.rol !== 'respaldo');
    const resp = enl.filter((l) => l.rol === 'respaldo');
    const suma = (arr) => arr.reduce((a, l) => a + l.down, 0);
    const normal = { id: 'normal', n: 'Operación normal', mpls: suma(act.filter(esMpls)),
      inet: suma(act.filter((l) => !esMpls(l))), respaldo: suma(resp), perdida: 0 };
    normal.total = normal.mpls + normal.inet;
    const out = [normal];
    if (resp.length) {
      act.forEach((L) => {
        let pendiente = L.down;
        let mpls = normal.mpls - (esMpls(L) ? L.down : 0);
        let inet = normal.inet - (esMpls(L) ? 0 : L.down);
        for (const Bk of resp) {
          const mover = Math.min(pendiente, Bk.down);
          if (esMpls(Bk)) mpls += mover; else inet += mover;
          pendiente -= mover;
        }
        const i = todos.indexOf(L) + 1;
        out.push({ id: `falla:${L.id}`, n: `Falla del enlace ${i} (${L.tipo})`, mpls, inet,
          total: mpls + inet, perdida: pendiente, enlace: i, caidoMbps: L.down });
      });
    }
    return out;
  }

  return { BOOST_CUOTA, tierParaCaudal, capacidadSo, boostMbpsSitio, boostRecMbps, admiteDtd, escenariosUnderlay };
});
