'use strict';
/* global module */
/* ══ MOTOR PURO DEL DIMENSIONADOR HUAWEI ═════════════════════════════════════
   Salio de `dimensionador-huawei-netengine.js` (revision de arquitectura del 2026-09-29,
   `docs/revision-huawei-2026-09-29.md`, hallazgos H-08 y H-09): `render()` decidia el equipo
   leyendo el formulario y `renderBom()` volvia a leerlo y recalculaba las licencias con otro
   contexto, asi que el BOM perdia la licencia de rendimiento que el calculo exigia.

   AHORA HAY UNA SOLA VERDAD: `evaluar(escenario, modelos)` devuelve todo lo que la pagina
   pinta y todo lo que el BOM necesita (necesidad, filas evaluadas, elegido, licencias).
   Sin DOM ni estado, mismo patron UMD que `aruba-reglas.js` y `fortinet-reglas.js`: global
   `HuaweiMotor` en el navegador, require() en Node (`test/huawei-motor.test.js`).

   NO DIVIDE POR IMIX. Huawei ya publica fwd/ipsec/typ en IMIX; el motor de ingenieria de
   Aruba (÷ 0,70) penalizaria dos veces. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.HuaweiMotor = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {

  /* PLATAFORMA ANTES QUE EL CAUDAL (H-04, etapa H3). Tres lineas que no son intercambiables
     aunque coincidan en Gbps: la serie AR es CPE/SD-WAN empresarial y se mide por throughput de
     servicio IMIX; A800 E es acceso de operador (CPE, cell site) y NE8000 es agregacion y nucleo
     IP/MPLS, las dos medidas por capacidad de conmutacion y Mpps. Antes la familia se DEDUCIA de
     siete casillas (`wanOk`), y con reenvio puro un AR y un NE8000 competian en la misma lista
     ordenada por cifras que no se miden igual. Es la regla que Cisco (`PLATAFORMAS`) y Nokia (dos
     paginas) ya aplican. */
  const PLATAFORMAS = {
    ar: { n: 'NetEngine AR', d: 'SD-WAN y router de sucursal o hub', de: (m) => m.cls === 'AR' },
    a800: { n: 'NetEngine A800 E', d: 'acceso de operador (CPE y cell site)', de: (m) => m.ser === 'A800 E' },
    ne8000: { n: 'NetEngine 8000', d: 'agregación y núcleo IP/MPLS', de: (m) => /^NE8000/.test(m.ser || '') },
  };

  const CAPAS = ['fwd', 'ipsec', 'typ'];
  const PROFUNDIDAD = { fwd: 0, ipsec: 1, typ: 2 };
  const PROFILE = { fwd: 'Forwarding (NAT+ACL+QoS, IMIX)', ipsec: 'IPsec (IMIX)', typ: 'SD-WAN típico (IPsec+QoS+SA+AppFlow, IMIX)' };

  /* PISO DE CAPA POR FUNCION (H-01). Una funcion activa fija la capa MINIMA contra la que se
     dimensiona; el perfil elegido solo puede ir mas hondo, nunca mas superficial. Antes, con
     perfil `fwd` y SD-WAN marcado se cobraba la licencia de SD-WAN pero se dimensionaba contra
     el reenvio: 1.300 frente a 620 Mbps en la serie AR5710-S, 2,1x por debajo. */
  const PISO_POR_FUNCION = { sdwan: 'typ', utm: 'typ' };

  function capaEfectiva(perfil, svc) {
    let capa = CAPAS.includes(perfil) ? perfil : 'typ';
    const motivos = [];
    for (const f of Object.keys(PISO_POR_FUNCION)) {
      if (svc && svc[f] && PROFUNDIDAD[PISO_POR_FUNCION[f]] > PROFUNDIDAD[capa]) {
        capa = PISO_POR_FUNCION[f]; motivos.push(f);
      }
    }
    return { capa, motivos, subida: motivos.length > 0 };
  }

  function evaluar(esc, modelos, opciones) {
    const o = opciones || {};
    const rango = o.rango || (() => 0);
    const recomendable = o.recomendable || ((m) => rango(m) < 2);
    const mode = esc.mode || 'link';
    // Un caudal negativo no es un escenario: se lee como «sin caudal», que la página ya trata
    // como «ingrese valores». Sin el tope, -5 Mbps dimensionaba contra -13 Mbps y recomendaba.
    const raw = Math.max(0, (Number(esc.bw) || 0) * (Number(esc.unit) || 1));
    // Menos de una sede no es un hub: con -5 el requerimiento salía negativo y el aviso pedía «-5 túneles».
    const sites = Math.max(1, parseInt(esc.sites, 10) || 1);
    const conc = Number(esc.conc); const head = Number(esc.head);
    const dirMult = Number(esc.dirMult) || 2;
    const frame = Number(esc.frame) || 340;
    const base = mode === 'agg' ? raw * sites * conc / 100 : raw;
    const need = base * dirMult * (1 + head / 100);
    const needMpps = need / (frame * 8);
    const perfil = CAPAS.includes(esc.profile) ? esc.profile : 'typ';
    const svc = { sdwan: !!(esc.svc && esc.svc.sdwan), utm: !!(esc.svc && esc.svc.utm), slice: !!(esc.svc && esc.svc.slice) };
    const want = { poe: !!(esc.want && esc.want.poe), wan: !!(esc.want && esc.want.wan), wifi: !!(esc.want && esc.want.wifi) };
    // `legado: true` reproduce el comportamiento anterior a la revision (linea base del contraste).
    const legado = !!o.legado;
    // Sin plataforma declarada: el modo «core» de los enlaces viejos era el nodo de nucleo.
    const plataforma = legado ? null : (PLATAFORMAS[esc.plataforma] ? esc.plataforma : (mode === 'core' ? 'ne8000' : 'ar'));
    const transporte = plataforma === 'a800' || plataforma === 'ne8000';
    const minLan = transporte ? 0 : (parseInt(esc.lan, 10) || 0);
    const aps = transporte ? 0 : (parseInt(esc.aps, 10) || 0);
    // Lo que no aplica a la plataforma sale del calculo (la pagina lo marca `data-inactivo` y
    // conserva el valor): SD-WAN, UTM, WAC, PoE, 4G/5G, Wi-Fi, LAN y perfil son de la serie AR;
    // el slicing FlexE es de la red de transporte.
    if (!legado && transporte) { svc.sdwan = false; svc.utm = false; want.poe = false; want.wan = false; want.wifi = false; }
    if (!legado && !transporte) svc.slice = false;
    const ef = legado ? { capa: perfil, motivos: [], subida: false } : transporte ? { capa: 'fwd', motivos: [], subida: false } : capaEfectiva(perfil, svc);
    const pk = ef.capa;
    const wanOk = !legado ? transporte
      : (pk === 'fwd') && !svc.sdwan && !svc.utm && aps === 0 && !want.poe && !want.wan && !want.wifi;
    const avisos = [];
    if (ef.subida) avisos.push(`La capa dimensionada sube de «${PROFILE[perfil]}» a «${PROFILE[pk]}» porque ${ef.motivos.map((f) => ({ sdwan: 'SD-WAN', utm: 'UTM' }[f])).join(' y ')} está activo: una función activa fija la capa mínima, nunca se dimensiona con una más superficial.`);
    // EJE DE HUB (H-11). En modo agregado cada sede termina un tunel IPsec en el equipo, y el
    // caudal no lo dice: 100 sedes de 50 Mbps caben en un AR6710-H por caudal y nadie ha
    // comprobado que aguante 100 tuneles. El catalogo NO trae el tope de tuneles de ningun
    // modelo, asi que hoy se DECLARA (cuantos se piden y que falta el tope) y no se filtra;
    // el dia que un modelo traiga `tuneles` numerico, el filtro de abajo lo aplica solo.
    // `null` es «el catalogo no lo dice», nunca «sin limite». Las sesiones concurrentes y las
    // nuevas por segundo no se piden aqui: exigirian usuarios por sede, que esta pantalla no
    // pregunta, y derivarlas seria inventar un dato.
    const tuneles = !legado && mode === 'agg' && plataforma === 'ar' ? sites : 0;
    const modelosConTope = tuneles ? modelos.filter((m) => m.cls !== 'WAN' && m.tuneles != null).length : 0;
    if (tuneles) {
      avisos.push(`Hub con ${tuneles} sede${tuneles === 1 ? '' : 's'}: se piden ${tuneles} túneles IPsec terminando en el equipo. `
        + (modelosConTope ? `${modelosConTope} modelos publican su tope de túneles y se comprueba; el resto no lo trae este catálogo.`
          : 'Este catálogo no trae el tope de túneles (ni el de sesiones) de ningún modelo: el equipo propuesto cumple por caudal y hay que confirmar el tope con su datasheet o el configurador de Huawei antes de cotizar.'));
    }
    // ALTA DISPONIBILIDAD 1+1 (H-12). Regla de Aruba, aqui igual: el par suma DISPONIBILIDAD,
    // no caudal. Un equipo lleva el trafico y el otro toma el relevo en fallo, asi que CADA
    // uno se dimensiona al requerimiento completo (no a la mitad) y el BOM cotiza los dos.
    // No sustituye a la fuente doble del chasis: son dos niveles de redundancia distintos.
    const ha = !legado && !!esc.ha;
    const unidades = ha ? 2 : 1;
    const crit = parseInt(esc.crit, 10) || 0;
    if (ha) avisos.push('Alta disponibilidad 1+1: se cotizan 2 equipos por sitio y cada uno se dimensiona al caudal completo, porque el par suma disponibilidad y no capacidad. Reserva un puerto para el enlace entre los dos equipos. No sustituye a la fuente de alimentación doble del chasis: son dos niveles de redundancia distintos.');
    else if (!legado && crit >= 4) avisos.push('Criticidad «misión crítica» sin alta disponibilidad: con un solo equipo por sitio, una falla del chasis deja el sitio sin servicio hasta que llegue el repuesto. Marca «Alta disponibilidad 1+1» para cotizar el par.');
    if (svc.utm && !legado) avisos.push('UTM (IPS, filtrado URL, antivirus): este catálogo no trae cifra de inspección para ningún modelo AR. Se dimensiona contra SD-WAN típico y el resultado hay que confirmarlo con una prueba de concepto antes de cotizar.');

    const enPlataforma = legado ? modelos : modelos.filter(PLATAFORMAS[plataforma].de);
    const rows = enPlataforma.map((m) => {
      const isWan = m.cls === 'WAN', cap = isWan ? m.cap : m[pk], miss = [];
      if (isWan && !wanOk) miss.push('serie de transporte: no hace SD-WAN, UTM ni WAC');
      if (cap == null) miss.push('sin cifra publicada para este perfil');
      else if (cap < need) miss.push('capacidad insuficiente');
      if (isWan && m.mpps != null && m.mpps < needMpps) miss.push(`límite de paquetes: ${m.mpps} Mpps`);
      if (want.poe && !m.poe) miss.push('sin PoE');
      if (want.wan && !m.wan) miss.push('sin 4G/5G integrado');
      if (want.wifi && !m.wifi) miss.push('sin Wi-Fi');
      // `lan: null` es «el catalogo no lo dice» (puertos configurables en los hubs): no descarta.
      if (legado || m.lan != null) { if ((m.lan || 0) < minLan) miss.push(`${m.lan || 0} puertos LAN`); }
      if (!isWan && aps > (m.apsMax || 0)) miss.push(`gestiona ${m.apsMax || 0} APs`);
      if (tuneles && !isWan && m.tuneles != null && m.tuneles < tuneles) miss.push(`soporta ${m.tuneles} túneles`);
      return { m, cap, miss, isWan };
    });
    // Se ordena por el rango del MODELO (no de la fila) y despues por capacidad.
    // Empate de capacidad (la serie AR5710-S publica la misma cifra en ocho variantes): sin un
    // desempate el elegido dependia del ORDEN en que la API sirve el catalogo. Gana el que trae
    // menos extras que nadie pidio (PoE, 4G/5G, Wi-Fi, puertos) y despues el id en orden natural (S8… antes que S10…).
    const extras = (m) => (m.poe ? 1 : 0) + (m.wan ? 1 : 0) + (m.wifi ? 1 : 0) + (m.lan || 0) / 100;
    // Con slicing pedido, lo CONFIRMADO va antes que lo que no consta: no se aparta a nadie, pero
    // no se recomienda un equipo sin FlexE declarado habiendo uno que si lo declara.
    const flexeAntes = (a, b) => (!legado && transporte && svc.slice ? (b.m.flexe === true) - (a.m.flexe === true) : 0);
    const fit = rows.filter((r) => !r.miss.length).sort((a, b) => rango(a.m) - rango(b.m) || flexeAntes(a, b) || a.cap - b.cap
      || extras(a.m) - extras(b.m) || a.m.id.localeCompare(b.m.id, 'en', { numeric: true }));
    const pick = fit.find((r) => recomendable(r.m)) || null;
    const next = fit.filter((r) => recomendable(r.m))[1] || null;
    // FLEXE: solo se afirma donde el catalogo lo dice (`flexe: true`); `undefined` es «no consta»,
    // no «no lo soporta», asi que no aparta a nadie: lo declara.
    if (!legado && transporte && svc.slice) {
      const con = enPlataforma.filter((x) => x.flexe === true).map((x) => x.id);
      avisos.push(con.length
        ? `Slicing FlexE: en esta plataforma el catálogo lo declara en ${con.join(', ')}; en el resto no consta, así que confírmalo en su datasheet antes de proponerlo.`
        : 'Slicing FlexE: ningún modelo de esta plataforma lo declara en el catálogo. No se aparta a nadie por eso; confírmalo en el datasheet del equipo propuesto.');
    }
    // Un equipo que el catalogo declara con doble fuente (`redund: true`) ya cubre esa falla:
    // el par protege ante la perdida del chasis completo. Solo se dice si el dato existe.
    if (ha && pick && pick.m.redund === true) {
      avisos.push(`El ${pick.m.id} ya declara fuentes redundantes en el catálogo: el par 1+1 protege ante la pérdida del equipo completo, no solo de una fuente.`);
    }
    return { raw, base, need, needMpps, mode, sites, conc, head, dirMult, frame, perfil, pk, ef, svc, want, aps, minLan, wanOk, plataforma, transporte, tuneles, ha, unidades, avisos, rows, fit, pick, next };
  }

  /* LICENCIAS. Una sola funcion para el calculo y el BOM: recibe la NECESIDAD del escenario,
     porque la de rendimiento depende de ella (H-08: el BOM la pasaba en 0 y la perdia). */
  function licencias(pick, c) {
    const m = pick.m, L = [];
    // Plazo de las suscripciones (1, 3 o 5 anos): el texto de cada linea dice el termino real.
    const T = `${12 * (parseInt(c.anios, 10) || 1)} meses`;
    if (m.boost && c.need > m.boost) L.push({ on: 1, t: 'Licencia de rendimiento (Boost)', d: `Sin ella el ${m.id} entrega ${fmt(m.boost)}. La licencia lo lleva a ${fmt(m.fwd)}.` });
    if (!pick.isWan) {
      if (c.pk !== 'fwd' || c.svc.sdwan) {
        L.push({ on: 1, t: 'Licencia de función SD-WAN por equipo', d: 'Habilita identificación de aplicaciones, selección inteligente de ruta y túneles gestionados.' });
        L.push({ on: 1, t: `Suscripción iMaster NCE-WAN — ${T}`, d: 'Controlador y gestión del overlay. Se licencia por nodo administrado.' });
      }
      if (c.svc.utm) {
        L.push({ on: 1, t: 'Licencia de seguridad: IPS, filtrado URL y antivirus', d: 'Funciones licenciadas aparte en la serie AR, no vienen activas.' });
        L.push({ on: 1, t: `Suscripción de bases de firmas — ${T}`, d: 'Sin firmas vigentes el IPS y el antivirus quedan sin actualizar.' });
      }
      if (c.aps > 0) {
        const extra = Math.max(0, c.aps - (m.apsFree || 0));
        L.push({ on: extra > 0 ? 1 : 0, t: extra > 0 ? `Licencia de recursos AP — ${extra} APs adicionales` : 'Licencia de recursos AP no requerida',
          d: extra > 0 ? `El ${m.id} gestiona ${m.apsFree} APs sin costo y llega a ${m.apsMax}.` : `Los ${c.aps} APs caben en los ${m.apsFree} gratuitos.` });
      }
    } else {
      L.push({ on: 1, t: 'Licencia base del sistema VRP por chasis', d: 'Habilita el conjunto de funciones de la plataforma.' });
      L.push({ on: 1, t: 'Licencias de función de transporte: L3VPN, EVPN, SRv6', d: 'Se licencian por funcionalidad activada.' });
      if (c.svc.slice) L.push({ on: 1, t: 'Licencia de slicing FlexE / SRv6', d: 'Aislamiento duro de red y ajuste de ancho de banda por rebanada.' });
      L.push({ on: 1, t: 'Licencia de capacidad por puerto y tarjeta', d: 'La capacidad se habilita por incrementos. Cotiza la densidad del año 1 y crece por licencia.' });
      L.push({ on: 1, t: `Suscripción iMaster NCE — ${T}`, d: 'Gestión, automatización y O&M proactiva del nodo.' });
    }
    L.push({ on: 1, t: `SnS — Software Subscription and Support, ${T}`, d: 'Vía para actualizaciones y parches de VRP. Va separada del paquete de hardware.' });
    L.push({ on: 0, t: 'Registro de ESN', d: 'Todas las licencias se emiten contra el ESN del equipo y se descargan del portal ESDP de Huawei.' });
    return L;
  }

  /* PIEZAS DEL BOM (H-06). `parts` del catalogo dice que es COMPATIBLE con el chasis, no que se
     pida: el BOM metia todas como obligatorias (en el AR8700-8, dos MPU y tres tipos de fuente;
     en el AR6710, las dos WSIC y la tarjeta 5G sin haberla pedido). Cada codigo declara aqui su
     papel; lo que depende de una eleccion se agrupa en UNA linea «elegir una», nunca se decide
     por el usuario. El papel NO viene de la base: es una regla de pedido, no un dato del equipo.
     LO QUE DICE LA SECCION «ORDERING INFORMATION» DE CADA FICHA (2026-10-06). El AR8700-8 se pide
     como «assembly chassis» y la SPU-700H es la que lleva TODOS los puertos de servicio: el BOM
     cotizaba un chasis sin puertos. La placa de control del AR6710-H (SRU-700S) es un paso de
     pedido aparte, y el BOM no la pedia. Y las dos fichas dejan elegir UNA o DOS placas de
     control: se dice en la linea, con lo que cambia (`nota`), en vez de fijarlo sin explicarlo. */
  const ROL_PIEZA = {
    PAC350: { grupo: 'fuente' }, PAC1000: { grupo: 'fuente' },
    PAC600: { grupo: 'fuente' }, PDC1000: { grupo: 'fuente' }, PSU6710H: { grupo: 'fuente' },
    MPU100: { grupo: 'mpu' }, MPU100T: { grupo: 'mpu' },
    SPU700H: { nota: 'obligatoria: el AR8700-8 se pide como chasis sin puertos («assembly chassis») y la SPU lleva todos los de servicio (ficha AR8000 R25C10)' },
    SRU700S: { nota: 'la ficha hace de la placa de control un paso de pedido aparte y deja elegir una o dos («Select a single or dual main control boards»); con dos, 145 W típicos en vez de 83 (ficha AR6710-H R25C10)' },
    FAN240: { incluida: true }, RACK: { incluida: true }, CONSOLE: { incluida: true },
    WSIC4GE: { opcional: 'ampliación WAN por tarjeta WSIC' }, WSIC8GE: { opcional: 'ampliación WAN por tarjeta WSIC' },
    SICNR: { condicional: 'wan', motivo: 'solo si se pide 4G/5G integrado' },
    RU5G: { condicional: 'wan', motivo: 'solo si se pide 4G/5G (unidad remota externa)' },
  };
  const NOMBRE_GRUPO = { fuente: 'Fuente de alimentación', mpu: 'Unidad de procesamiento (MPU)' };
  const NOTA_GRUPO = {
    mpu: 'la ficha deja pedir una o dos MPU; se cotizan dos, que son las que dan la conmutación sin corte, y con SD-WAN las dos exigen la versión 25.1 o posterior (ficha AR8000 R25C10)',
  };

  function piezasBom(m, partsCat, ev) {
    const codigos = (m.parts || []).filter((k) => partsCat[k]);
    const pedir = [], elegir = [], opcionales = [], noAplican = [];
    const grupos = {};
    for (const k of codigos) {
      const r = ROL_PIEZA[k] || {};
      if (r.grupo) (grupos[r.grupo] = grupos[r.grupo] || []).push(k);
      else if (r.condicional) (ev.want[r.condicional] ? pedir : noAplican).push({ codigo: k, motivo: r.motivo });
      else if (r.opcional) opcionales.push({ codigo: k, motivo: r.opcional });
      else pedir.push(r.nota ? { codigo: k, qty: 1, nota: r.nota } : { codigo: k, qty: 1 });
    }
    for (const [g, ks] of Object.entries(grupos)) {
      // Un solo codigo en el grupo: no hay nada que elegir. Doble fuente declarada: se piden 2.
      const qty = g === 'mpu' ? 2 : (m.redund === true ? 2 : 1);
      const nota = NOTA_GRUPO[g] ? { nota: NOTA_GRUPO[g] } : {};
      if (ks.length === 1) pedir.push({ codigo: ks[0], qty, ...nota });
      else elegir.push({ grupo: g, nombre: NOMBRE_GRUPO[g] || g, opciones: ks, qty, ...nota });
    }
    return { pedir, elegir, opcionales, noAplican };
  }

  /* OPTICAS POR ENLACE (H-07). Antes el BOM tomaba una optica arbitraria de cada familia y la
     multiplicaba por un contador suelto: el medio y el alcance los decidia el orden del catalogo.
     Ahora cada fila DECLARA familia, modelo de optica y cantidad por equipo. Lo unico que el
     catalogo respalda es a nivel de FAMILIA (`optics` del modelo: «este chasis admite 10GE
     SFP+»); no hay matriz por chasis y por version de VRP, y eso se dice en pantalla. Una fila
     que ya no encaja (cambio de equipo) NO se descarta en silencio: sale como invalida. */
  function opticasBom(m, declaradas, opticas) {
    const validas = [], invalidas = [];
    (declaradas || []).forEach((d) => {
      const qty = Math.max(0, parseInt(d.qty, 10) || 0);
      if (!qty) return;
      const o = ((opticas || {})[d.fam] || []).find((x) => x.sku === d.sku);
      if (!(m.optics || []).includes(d.fam)) invalidas.push({ ...d, qty, motivo: `el ${m.id} no lista la familia «${d.fam}» como compatible` });
      else if (!o) invalidas.push({ ...d, qty, motivo: 'la óptica elegida no está en el catálogo' });
      else validas.push({ fam: d.fam, o, qty });
    });
    return { validas, invalidas };
  }

  /* H-03 (cerrado el 2026-10-06). ¿Con qué se respalda dimensionar contra la SUMA de las dos
     direcciones? Las seis fichas de la línea AR (AR610 y AR6710-L de R26C00; AR5710-S, AR6710-H
     y AR8000 de R25C10; AR650 de 20250810) lo dicen literal en la nota al pie de su tabla, de
     sus tres cifras SD-WAN —IPsec, IPsec + QoS y la típica—: «This specification applies to the
     combined total of traffic in inbound and outbound directions». Del reenvío (NAT + ACL + QoS)
     no dicen nada, y la conmutación de las NE8000 es la convención del sector. Devuelve si hay
     documento y el texto que la traza pinta: el ×2 por defecto sigue igual, ahora con su porqué. */
  function respaldoBidireccional(capa, esConmutacion) {
    if (esConmutacion) return { documento: false, texto: 'la capacidad de conmutación se publica como suma de las dos direcciones, que es la convención del sector' };
    if (capa === 'ipsec' || capa === 'typ') {
      return { documento: true, texto: 'las fichas de la línea AR lo dicen de esta cifra: «combined total of traffic in inbound and outbound directions» (nota al pie de su tabla de rendimiento)' };
    }
    return { documento: false, texto: 'la ficha no dice si el reenvío (NAT + ACL + QoS) se mide por dirección o sumado: el ×2 es la convención de la página, y «Total agregado» lo quita' };
  }

  function fmt(m) {
    if (m == null) return '—';
    if (m >= 1000000) return (m / 1000000).toFixed(m % 1000000 ? 2 : 0).replace(/\.00$/, '') + ' Tbps';
    if (m >= 1000) return (m / 1000).toFixed(m % 1000 ? 1 : 0) + ' Gbps';
    return Math.round(m) + ' Mbps';
  }

  return { PLATAFORMAS, CAPAS, PROFILE, PISO_POR_FUNCION, capaEfectiva, evaluar, licencias, piezasBom, opticasBom, ROL_PIEZA, respaldoBidireccional, fmt };
});
