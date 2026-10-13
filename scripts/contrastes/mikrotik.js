'use strict';
/* CASO: el dimensionador MikroTik elige la celda de la matriz oficial de pruebas (revision del
 * 2026-10-13, `public/js/mikrotik-motor.js`).
 *
 * Hasta esa revision la pagina multiplicaba una cifra de reenvio por un «factor FastTrack» y
 * estimaba WireGuard al 45 % del IPsec, sin fuente. Esta linea base fija, leida en la pantalla
 * el dia del cambio, que equipo se recomienda y CON QUE CELDA de la ficha en los cuatro
 * escenarios que mueven la decision de un arquitecto:
 *   · un sitio de Internet con FastTrack a trama mixta (el caso mas comun: el hEX refresh);
 *   · el mismo con firewall completo (cambia la fila y por tanto el equipo);
 *   · un hub IPsec de 40 sedes (la fila de 256 tuneles, no la de un tunel);
 *   · un core de 40 Gbps con L3HW (solo el CCR2216 publica la fila).
 * Un refactor que cambie una de estas cuatro respuestas sin querer se ve aqui.
 */
const BASE_LINEA = [
  { n: 'Sitio 500 Mbps, FastTrack, 512 B', esc: { bw: '500' },
    recomendado: 'hEX E50UG', celda: 'Ruteo fast path (sin firewall ni colas) · 512 B' },
  { n: 'Sitio 500 Mbps, firewall completo, 512 B', esc: { bw: '500', firewall: 'completo' },
    recomendado: 'RB5009UG+S+IN', celda: 'Ruteo con 25 reglas de filtro (firewall sin FastTrack) · 512 B' },
  // A 512 B ningun MikroTik llega (3,1 Gbps pedidos, 2,7 el CCR2116): el caso fija la columna
  // de paquetes grandes, donde la fila de 256 tuneles (4,1 Gbps) si cumple y la de uno no.
  { n: 'Hub IPsec 40 sedes x 50 Mbps al 60 %, paquetes grandes', esc: { bw: '50', perfil: 'ipsec', hub: '40', conc: '60', trama: '1518' },
    recomendado: 'CCR2116-12G-4S+', celda: '256 túneles · AES-128-CBC + SHA1 · 1400 B' },
  { n: 'Core 40 Gbps con L3HW y FastTrack', esc: { bw: '40', unit: '1000', l3hw: true },
    recomendado: 'CCR2216-1G-12XS-2XQ', celda: 'Ruteo con 25 reglas de filtro y FastTrack L3HW · 512 B' },
  // Segundo enlace (2026-10-13): MPLS principal en fibra monomodo y respaldo de Internet en cobre.
  // El hEX del primer caso no tiene jaula SFP y los que la tienen no cifran los 400 Mbps del
  // respaldo (IPsec de un túnel a 512 B): sube al RB5009, con su jaula SFP+ para la MPLS.
  { n: 'Sitio con MPLS en fibra y respaldo de Internet cifrado', esc: { bw: '300', enlaces: [
      { tipo: 'mpls', rol: 'principal', mbps: '300', medio: 'fibra-sm' },
      { tipo: 'internet', rol: 'respaldo', mbps: '200', medio: 'cobre' }] },
    recomendado: 'RB5009UG+S+IN', celda: 'Ruteo fast path (sin firewall ni colas) · 512 B' },
];

module.exports = {
  medidoEn: { commit: 'revision-mikrotik-2026-10-13', fecha: '2026-10-13' },
  nombre: 'MikroTik — la celda de la ficha oficial que dimensiona',
  pagina: 'dimensionador-mikrotik-routeros.html',
  claves: ['recomendado', 'celda'],
  baseLinea: BASE_LINEA,

  async preparar(p, e, { pausa }) {
    const x = e.esc;
    if (x.perfil) await p.click(`#profileSeg button[data-v="${x.perfil}"]`);
    if (x.trama) await p.click(`#tramaSeg button[data-v="${x.trama}"]`);
    if (x.hub) { await p.click('#modoSeg button[data-v="hub"]'); await p.fill('#sedes', x.hub); await p.dispatchEvent('#sedes', 'input'); }
    if (x.conc) { await p.fill('#conc', x.conc); await p.dispatchEvent('#conc', 'input'); }
    if (x.firewall) await p.selectOption('#firewall', x.firewall);
    if (x.unit) await p.selectOption('#unit', x.unit);
    if (x.l3hw) await p.check('#chkL3hw');
    if (x.enlaces) {
      // El campo oculto es lo que viaja en el enlace compartido; la página repinta sus filas desde él.
      await p.$eval('#enlacesData', (el, v) => { el.value = v; }, JSON.stringify(x.enlaces));
      await p.evaluate('pintarEnlaces()');
    }
    await p.fill('#bw', x.bw);
    await p.dispatchEvent('#bw', 'input');
    await pausa(p, 500);
  },

  async leer(p) {
    const recomendado = await p.$eval('#verdict-sel', (s) => s.value).catch(() => null);
    const celda = await p.$$eval('#sizingBox tr', (filas) => {
      const f = filas.find((r) => /^Celda de la ficha/.test(r.textContent.trim()));
      return f ? f.querySelector('td:last-child').textContent.replace(/\s+/g, ' ').trim() : null;
    });
    return { recomendado, celda };
  },
};
