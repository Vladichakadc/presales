'use strict';
/* CASO: el dimensionador Juniper elige equipo con el orden del motor (fase 2 de la auditoria del
 * 2026-11-09, ADR-1, corte 2: `JuniperMotor.evaluar`).
 *
 * Hasta ese corte la pagina filtraba con el motor y ordenaba ella, en tres sitios y sin desempate,
 * y ningun caso de contraste conducia la pagina: la cobertura de `juniper-motor.js` salia «sin
 * conducir». Esta linea base fija, leida en la pantalla el dia del cambio, que equipo se recomienda y
 * con que requerimiento en los escenarios que mueven la decision:
 *   · la plataforma SRX en cada capa (firewall IMIX, IPsec, IPS y Threat Prevention);
 *   · el empate de IPS del SRX380 y el SRX1500 (2.000 Mbps): manda el ciclo de vida, el SRX1500 ya
 *     paso su ultimo pedido;
 *   · las sesiones de los usuarios, que suben el equipo aunque el caudal quepa;
 *   · el Session Smart Router como sucursal (con cifrado y HMAC) y como hub de 40 sucursales;
 *   · el SRX desacoplado que inspecciona por el hub.
 * Un refactor que cambie una de estas respuestas sin querer se ve aqui.
 */
// Medida en la pantalla de main (b54cfa8) el 2026-11-10, antes del corte; el corte da lo mismo.
const BASE_LINEA = [
  { n: 'SRX: sucursal de 300 Mbps con IPS', esc: { bw: '300' },
    recomendado: 'SRX340', requerimiento: '390 Mbps', companero: null },
  { n: 'SRX: 1 Gbps de firewall IMIX', esc: { bw: '1', unit: '1000', capa: 'fwImix' },
    recomendado: 'SRX345', requerimiento: '1.3 Gbps', companero: null },
  // 1.950 Mbps de IPS: el SRX380 y el SRX1500 publican 2.000. El SRX1500 ya paso su ultimo pedido
  // (2026-04-15), asi que el ciclo de vida lo deja detras antes de que llegue el desempate.
  { n: 'SRX: empate de IPS a 2.000 Mbps (SRX380 y SRX1500), 1,5 Gbps', esc: { bw: '1500' },
    recomendado: 'SRX380', requerimiento: '1.9 Gbps', companero: null },
  { n: 'SRX: 5 Gbps con Threat Prevention', esc: { bw: '5', unit: '1000', capa: 'atp' },
    recomendado: 'SRX4200', requerimiento: '6.5 Gbps', companero: null },
  { n: 'SRX: IPsec de 2 Gbps', esc: { bw: '2', unit: '1000', capa: 'vpn' },
    recomendado: 'SRX380', requerimiento: '2.6 Gbps', companero: null },
  // 5.000 × 100 sesiones con el 30 % son 650.000: el SRX380 publica 380.000 y se aparta.
  { n: 'SRX: 200 Mbps de IPS con 5.000 usuarios de 100 sesiones', esc: { bw: '200', users: '5000', sesUser: '100' },
    recomendado: 'SRX1600', requerimiento: '260 Mbps', companero: null },
  { n: 'SSR: sucursal de 500 Mbps con cifrado y HMAC', esc: { bw: '500', plat: 'ssr', cifrado: 'hmac' },
    recomendado: 'SSR130', requerimiento: '650 Mbps', companero: null },
  // 40 × 100 Mbps × 30 % por el overlay × 60 % simultaneas × 1,3 = 936 Mbps.
  { n: 'SSR: hub de 40 sucursales de 100 Mbps, con un SRX desacoplado para IPS', esc: { bw: '100', plat: 'ssr', rol: 'hub',
    spokes: '40', simult: '60', breakout: '70', seg: 'srx', capaSrx: 'ips' },
    recomendado: 'SSR130', requerimiento: '936 Mbps', companero: 'SRX380' },
];

module.exports = {
  medidoEn: { commit: 'b54cfa8', fecha: '2026-11-10' },
  nombre: 'Juniper — el equipo que recomienda el motor, en SRX y Session Smart',
  pagina: 'dimensionador-juniper-srx.html',
  claves: ['recomendado', 'requerimiento', 'companero'],
  baseLinea: BASE_LINEA,

  async preparar(p, e, { pausa }) {
    const x = e.esc;
    if (x.plat) await p.click(`#platSeg button[data-v="${x.plat}"]`);
    if (x.capa) await p.click(`#capaSeg button[data-v="${x.capa}"]`);
    if (x.unit) await p.selectOption('#unit', x.unit);
    // Los desplegables antes que los campos: las sucursales del hub solo se ven con el rol «hub».
    for (const [campo, id] of [['rol', '#ssrRol'], ['cifrado', '#ssrCifrado'], ['seg', '#ssrSeg'], ['capaSrx', '#ssrCapa']]) {
      if (x[campo] != null) { await p.selectOption(id, x[campo]); await p.dispatchEvent(id, 'change'); }
    }
    for (const [campo, id] of [['users', '#users'], ['sesUser', '#sesUser'], ['spokes', '#ssrSpokes'], ['simult', '#ssrSimult'],
      ['breakout', '#ssrBreakout']]) {
      if (x[campo] != null) { await p.fill(id, x[campo]); await p.dispatchEvent(id, 'input'); }
    }
    await p.fill('#bw', x.bw);
    await p.dispatchEvent('#bw', 'input');
    await pausa(p, 500);
  },

  async leer(p) {
    const recomendado = await p.$eval('#verdict-sel', (s) => s.value).catch(() => null);
    const requerimiento = await p.$eval('#needLbl', (s) => s.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
    const companero = await p.$eval('#companero p.model', (s) => s.textContent.trim()).catch(() => null);
    return { recomendado, requerimiento, companero };
  },
};
