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
 * Y EL ESCENARIO DE 4 Gbps ES EL MAS IMPORTANTE DE LOS SIETE: ningun modelo del catalogo
 * trae cifra de SSL suficiente (la mayor es la del 90G, 2,6 Gbps), asi que la respuesta
 * correcta es CERO candidatos. Un motor que «arreglara» ese cero cayendo a Threat Protection
 * daria de pronto 30 candidatos y una propuesta corta por un orden de magnitud — que es
 * exactamente el fallo que este cambio vino a cerrar.
 */
const BASE_LINEA = [
  { n: 'SSL 300 Mbps (AT-01)', bw: 300, ssl: true, techo: '100',
    recomendado: 'FortiGate 30G', need: '390 Mbps', nCandidatos: 8 },
  { n: 'SSL 800 Mbps', bw: 800, ssl: true, techo: '100',
    recomendado: 'FortiGate 50G', need: '1.0 Gbps', nCandidatos: 6 },
  { n: 'SSL 1.500 Mbps', bw: 1500, ssl: true, techo: '100',
    recomendado: 'FortiGate 90G', need: '1.9 Gbps', nCandidatos: 2 },
  { n: 'SSL 4.000 Mbps — ningun modelo trae la cifra', bw: 4000, ssl: true, techo: '100',
    recomendado: '(sin candidato)', need: '5.2 Gbps', nCandidatos: 0 },
  { n: 'control sin SSL, 800 Mbps', bw: 800, ssl: false, techo: '100',
    recomendado: 'FortiGate 50G', need: '1.0 Gbps', nCandidatos: 48 },
  { n: 'SSL 800 Mbps con techo del 70 %', bw: 800, ssl: true, techo: '70',
    recomendado: 'FortiGate 90G', need: '1.0 Gbps', nCandidatos: 2 },
  { n: 'control sin SSL, 800 Mbps con techo del 70 %', bw: 800, ssl: false, techo: '70',
    recomendado: 'FortiGate 90G', need: '1.0 Gbps', nCandidatos: 44 },
];

module.exports = {
  // Medida en Chromium el dia del cambio, sobre el commit anterior a el. Va con su fecha y
  // su commit porque una linea base sin procedencia sigue pasando en verde cuando ya no
  // quiere decir nada — misma regla que la fecha de cada fuente del catalogo.
  medidoEn: { commit: '419b357', fecha: '2026-09-22' },
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

  // LO QUE UN NUMERO NO DICE: que la pantalla EXPLIQUE por que la lista es corta. Cero
  // candidatos con el mensaje «ningun modelo cumple» se lee como «hace falta mas equipo»,
  // cuando lo que falta es el dato — y esa lectura manda a cotizar un chasis que nadie
  // necesita. La cifra sola no distingue las dos cosas; este extra si.
  async extra(p, { base, pausa }) {
    const out = [];
    await p.goto(`${base}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1400);
    await p.fill('#wanBuilderFilas [data-campo=down] >> nth=0', '4000');
    await p.dispatchEvent('#wanBuilderFilas [data-campo=down] >> nth=0', 'input');
    await p.check('#chkSsl');
    await pausa(p, 1000);
    const txt = await p.$eval('#verdict', (e) => e.textContent || '');
    const nombra = /inspecci[oó]n SSL/i.test(txt);
    const distingue = /tarea de datos|no se sustituye/i.test(txt);
    out.push({ n: 'sin candidato por SSL · nombra el motivo', ok: nombra,
      detalle: nombra ? 'el veredicto cita la inspeccion SSL' : 'el veredicto NO cita la inspeccion SSL' });
    out.push({ n: 'sin candidato por SSL · distingue falta de dato de falta de capacidad', ok: distingue,
      detalle: distingue ? 'lo declara como tarea de datos' : 'se lee como si faltara equipo' });
    return out;
  },
};
