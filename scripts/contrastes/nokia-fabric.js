'use strict';
/* CASO: el fabric leaf-spine de Nokia 7220 IXR (mejora del PR #170, aprobada el 2026-11-11).
 *
 * Era el unico dimensionador que ningun caso conducia: `nokia-fabric-motor.js` y su pagina salian
 * «sin conducir» en la cobertura, y un cambio del leaf, el spine o sus cantidades solo lo veia la
 * equivalencia del corte que lo movio. Esta linea base fija, leida en la pantalla de main, que leaf
 * y que spine salen, cuantos de cada uno y la sobresuscripcion lograda, en los escenarios que mueven
 * la decision: cada velocidad de acceso que la pagina ofrece (25 y 100 GbE), el doble homing, una sobresuscripcion
 * sin bloqueo y una grande que obliga a crecer el spine.
 */
// Medida en la pantalla de main (0c6a8d5) el 2026-11-11.
const BASE_LINEA = [
  { n: '48 servidores a 25 GbE, 3:1', esc: { servers: '48', accesoVel: '25', oversub: '3' },
    leaf: '7220 IXR-D2L', leafs: '1', spine: '7220 IXR-D3L', spines: '4', lograda: '3.0:1 — pedida 3:1' },
  { n: '48 servidores a 25 GbE, 3:1, con doble homing', esc: { servers: '48', accesoVel: '25', oversub: '3', dual: true },
    leaf: '7220 IXR-D2L', leafs: '2', spine: '7220 IXR-D3L', spines: '4', lograda: '3.0:1 — pedida 3:1' },
  { n: '300 servidores a 25 GbE, 3:1', esc: { servers: '300', accesoVel: '25', oversub: '3' },
    leaf: '7220 IXR-D2L', leafs: '7', spine: '7220 IXR-D3L', spines: '4', lograda: '3.0:1 — pedida 3:1' },
  // Sin bloqueo no cabe con los uplinks del leaf: la lograda es 1,5:1 y la pagina lo avisa.
  { n: '500 servidores a 25 GbE, sin bloqueo (1:1)', esc: { servers: '500', accesoVel: '25', oversub: '1' },
    leaf: '7220 IXR-D2L', leafs: '11', spine: '7220 IXR-D3L', spines: '8', lograda: '1.5:1 — pedida 1:1' },
  { n: '2.000 servidores a 25 GbE, 6:1', esc: { servers: '2000', accesoVel: '25', oversub: '6' },
    leaf: '7220 IXR-D2L', leafs: '42', spine: '7220 IXR-D3L', spines: '2', lograda: '6.0:1 — pedida 6:1' },
  { n: '100 servidores a 100 GbE, 3:1', esc: { servers: '100', accesoVel: '100', oversub: '3' },
    leaf: '7220 IXR-D3L', leafs: '5', spine: '7220 IXR-D3L', spines: '8', lograda: '3.0:1 — pedida 3:1' },
  { n: '600 servidores a 100 GbE, 2:1, con doble homing', esc: { servers: '600', accesoVel: '100', oversub: '2', dual: true },
    leaf: '7220 IXR-D3L', leafs: '58', spine: '7220 IXR-D3L', spines: '11', lograda: '1.9:1 — pedida 2:1' },
];

module.exports = {
  medidoEn: { commit: '0c6a8d5', fecha: '2026-11-11' },
  nombre: 'Nokia 7220 IXR — el fabric leaf-spine que dimensiona la pagina',
  pagina: 'dimensionador-nokia-7220ixr.html',
  claves: ['leaf', 'leafs', 'spine', 'spines', 'lograda'],
  baseLinea: BASE_LINEA,

  async preparar(p, e, { pausa }) {
    const x = e.esc;
    await p.selectOption('#accesoVel', x.accesoVel);
    await p.dispatchEvent('#accesoVel', 'input');
    await p.selectOption('#oversub', x.oversub);
    await p.dispatchEvent('#oversub', 'input');
    if (Boolean(x.dual) !== await p.isChecked('#chkDual')) await p.click('#chkDual');
    await p.fill('#servers', x.servers);
    await p.dispatchEvent('#servers', 'input');
    await pausa(p, 400);
  },

  async leer(p) {
    const tarjetas = await p.$$eval('#disenoBox .rolCard', (cs) => cs.map((c) => ({
      modelo: (c.querySelector('.modelo') || {}).textContent || null,
      cant: ((c.querySelector('.cant b') || {}).textContent) || null,
    }))).catch(() => []);
    const lograda = await p.$eval('#verdict .cifra', (s) => s.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
    const [leaf = {}, spine = {}] = tarjetas;
    return { leaf: leaf.modelo || null, leafs: leaf.cant || null, spine: spine.modelo || null, spines: spine.cant || null, lograda };
  },
};
