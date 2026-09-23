'use strict';
/* CASO: la inspeccion SSL es un EJE con cifra oficial, no un derate sobre Threat Protection.
 *
 * DE DONDE SALE. El «Informe final de validacion tecnica y plan de mejora del modulo Fortinet
 * Presales» (22-sep-2026) marca como su P0 tecnico que esta pagina estimaba la inspeccion SSL
 * como `tp x 0,65`. El Product Matrix publica la cifra por modelo y el cociente ssl/tp va de
 * 0,52 (40F) a 1,18 (50G): un factor unico se equivoca en las dos direcciones.
 *
 * POR QUE ESTE CASO ES DISTINTO DEL DE `fortinet.js`. Aquel prueba que el Multi-Underlay
 * Builder NO cambio el dimensionamiento, y su linea base es de ANTES del builder. Este fija
 * lo contrario: un cambio de decision DELIBERADO, medido el dia que se hizo. Los dos hacen
 * falta — sin el primero, un refactor de entrada de datos podria mover la recomendacion sin
 * que nadie lo notara; sin este, el derate podria volver «simplificando» el motor y solo se
 * notaria en la propuesta de un cliente.
 *
 * LOS DOS CONTROLES SIN SSL NO SON RELLENO. Son los que distinguen «el motor cambio para la
 * inspeccion SSL» de «el motor cambio para todo»: con la casilla apagada, el mismo caudal
 * tiene que seguir compitiendo contra los 58 modelos. Si un refactor rompiera eso, el caso
 * sin SSL saltaria primero y diria exactamente donde mirar.
 *
 * REMEDIDO EL 2026-09-23, Y LA PREMISA DE UN ESCENARIO DEJO DE SER CIERTA. Cuando este caso
 * se escribio, el catalogo traia la cifra de SSL de 9 modelos y por eso 4 Gbps daba CERO
 * candidatos: la mayor era la del 90G, 2,6 Gbps. Al leer la tabla del Product Matrix de
 * septiembre entraron 51 de 58, y ese mismo escenario recomienda ahora un 200G (7 Gbps de
 * inspeccion SSL). La linea base se rehace por eso, no por un refactor: el escenario cambio
 * de respuesta porque LLEGO EL DATO, que es justo el desenlace que el caso anticipaba.
 *
 * UN ESCENARIO QUE YA NO PRUEBA NADA SE SUSTITUYE, NO SE BORRA. Aquel cero era la prueba de
 * que el motor no «arregla» la falta de dato cayendo a Threat Protection. Hoy eso se afirma
 * donde sigue siendo cierto: los 7 modelos que el Matrix de septiembre ya no lista se apartan
 * aunque su Threat Protection sobre. El escenario de 2 Gbps y las dos comprobaciones extra lo
 * fijan con nombre y apellidos -el 600F hace 10,5 Gbps de Threat Protection y NO puede salir
 * entre los candidatos-, que es mas fuerte que el cero de antes: aquel dependia de que el
 * catalogo siguiera incompleto, y este no.
 */
const BASE_LINEA = [
  { n: 'SSL 300 Mbps (AT-01)', bw: 300, ssl: true, techo: '100',
    recomendado: 'FortiGate 30G', need: '390 Mbps', nCandidatos: 50 },
  { n: 'SSL 800 Mbps', bw: 800, ssl: true, techo: '100',
    recomendado: 'FortiGate 50G', need: '1.0 Gbps', nCandidatos: 42 },
  { n: 'SSL 1.500 Mbps', bw: 1500, ssl: true, techo: '100',
    recomendado: 'FortiGate 90G', need: '1.9 Gbps', nCandidatos: 38 },
  // Era «ningun modelo trae la cifra» y daba cero. Hoy el 200G la trae y la respuesta
  // correcta es el 200G: el escenario se conserva con su nueva respuesta en vez de retirarse,
  // porque sigue siendo el que veria un motor que volviera a caer a Threat Protection -ahi
  // recomendaria un 90G, dos gamas por debajo-.
  { n: 'SSL 4.000 Mbps', bw: 4000, ssl: true, techo: '100',
    recomendado: 'FortiGate 200G', need: '5.2 Gbps', nCandidatos: 34 },
  // NUEVO: el escenario que fija «sin dato aparta» sin depender de que el catalogo siga
  // incompleto. A 2 Gbps de requerimiento el 600F sobra por Threat Protection (10,5 Gbps) y
  // aun asi no puede competir, porque su SSL no esta publicado.
  { n: 'SSL 2.000 Mbps — el 600F sobra por TP y aun asi se aparta', bw: 2000, ssl: true, techo: '100',
    recomendado: 'FortiGate 120G', need: '2.6 Gbps', nCandidatos: 36 },
  { n: 'control sin SSL, 800 Mbps', bw: 800, ssl: false, techo: '100',
    recomendado: 'FortiGate 50G', need: '1.0 Gbps', nCandidatos: 48 },
  { n: 'SSL 800 Mbps con techo del 70 %', bw: 800, ssl: true, techo: '70',
    recomendado: 'FortiGate 90G', need: '1.0 Gbps', nCandidatos: 38 },
  { n: 'control sin SSL, 800 Mbps con techo del 70 %', bw: 800, ssl: false, techo: '70',
    recomendado: 'FortiGate 90G', need: '1.0 Gbps', nCandidatos: 44 },
];

module.exports = {
  // Medida en Chromium el dia del cambio, sobre el commit anterior a el. Va con su fecha y
  // su commit porque una linea base sin procedencia sigue pasando en verde cuando ya no
  // quiere decir nada — misma regla que la fecha de cada fuente del catalogo.
  medidoEn: { commit: '15af632', fecha: '2026-09-23' },
  nombre: 'Fortinet — la inspeccion SSL es un eje con cifra oficial',
  pagina: 'dimensionador-fortinet-fortigate.html',
  claves: ['recomendado', 'need', 'nCandidatos'],
  baseLinea: BASE_LINEA,

  // Se escribe por los CONTROLES de la pagina, no inyectando estado: un contraste que evita
  // la interfaz no prueba la interfaz.
  async preparar(p, e, { pausa }) {
    await p.fill('#wanBuilderFilas [data-campo=down] >> nth=0', String(e.bw));
    await p.dispatchEvent('#wanBuilderFilas [data-campo=down] >> nth=0', 'input');
    await pausa(p, 300);
    if (e.ssl) { await p.check('#chkSsl'); await pausa(p, 300); }
    if (e.techo !== '100') { await p.selectOption('#techoUtil', e.techo); await pausa(p, 300); }
  },

  async leer(p) {
    const sel = await p.$('#verdict-sel');
    return {
      recomendado: sel ? await sel.evaluate((e) => e.value) : '(sin candidato)',
      nCandidatos: sel ? await sel.evaluate((e) => e.options.length) : 0,
      need: await p.$eval('#needLbl', (e) => e.textContent),
    };
  },

  // LO QUE UN NUMERO NO DICE: que un modelo SIN la cifra no se cuele por la de otra capa, y
  // que la pantalla lo EXPLIQUE. Un conteo de candidatos no distingue «no cabe» de «no se
  // sabe», y esas dos lecturas mandan a sitios opuestos: una a subir de gama, la otra a
  // completar un documento. Estas dos comprobaciones si las distinguen, y lo hacen con
  // nombre propio en vez de con un total.
  async extra(p, { base, pausa }) {
    const out = [];
    await p.goto(`${base}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1400);
    await p.fill('#wanBuilderFilas [data-campo=down] >> nth=0', '2000');
    await p.dispatchEvent('#wanBuilderFilas [data-campo=down] >> nth=0', 'input');
    await p.check('#chkSsl');
    await pausa(p, 1000);
    // El 600F hace 10,5 Gbps de Threat Protection: con 2,6 Gbps de requerimiento sobraria de
    // largo si el motor cayera a esa capa. No tiene cifra de inspeccion SSL, asi que no puede
    // estar entre los candidatos. Es la version fuerte del cero que este caso tenia antes.
    // NOMBRE EXACTO Y NO SUBCADENA. La primera version comparaba con /600F|200F|400F/ y daba
    // por colados al 2600F, al 3200F y al 4400F: es el mismo tropiezo que el ancla corta de
    // `catalogo-check.js`, donde `${cid}-sel` seguia casando dentro de `${cid}-selector`.
    const SIN_CIFRA = ['FortiGate 100F', 'FortiGate 200F', 'FortiGate 400F', 'FortiGate 401F',
      'FortiGate 600F', 'FortiGate 1000F', 'FortiGate 1001F'];
    const opciones = await p.$eval('#verdict-sel', (e) => [...e.options].map((o) => o.value));
    const colados = opciones.filter((v) => SIN_CIFRA.includes(v));
    out.push({ n: 'un modelo sin cifra de SSL no se cuela por su Threat Protection', ok: !colados.length,
      detalle: colados.length ? `aparece ${colados.join(', ')}`
        : 'ninguno de los 7 sin cifra aparece entre los candidatos' });
    // El aviso vive en el panel de ejes y no en el veredicto: con candidatos, `#verdict` pinta
    // el equipo elegido. Se lee donde esta, en vez de aflojar la afirmacion.
    const txt = await p.$eval('#ejesPanel', (e) => e.textContent || '');
    const distingue = /tarea de datos|no sustituye/i.test(txt);
    out.push({ n: 'la pantalla distingue falta de dato de falta de capacidad', ok: distingue,
      detalle: distingue ? 'lo declara como tarea de datos' : 'se lee como si faltara equipo' });
    return out;
  },
};
