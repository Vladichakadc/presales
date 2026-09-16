'use strict';
/* CASO: el Multi-Underlay Builder de FortiGate no cambia el dimensionamiento (2026-09-16).
 *
 * El builder sustituyo el par «caudal unico + deslizador de % por el overlay» por filas de
 * enlaces declarados. Es un cambio de ENTRADA DE DATOS, no de dimensionamiento: el motor
 * sigue leyendo #bw y #pctOverlay, que ahora son espejos ocultos que el builder calcula.
 *
 * Los ocho escenarios cubren los dos techos que el motor puede aplicar —capa de inspeccion e
 * IPsec/fraccion— por los tres roles, porque el rol es lo que activa el segundo.
 *
 * LINEA BASE MEDIDA EN CHROMIUM SOBRE EL COMMIT 2147588, con el deslizador todavia puesto.
 */
const BASE_LINEA = [
  { n: 'sin sdwan, 500 Mbps',          bw: 500,   rol: 'none',  pct: 100, recomendado: 'FortiGate 60F',  need: '650 Mbps', nCandidatos: 55 },
  { n: 'sin sdwan, 2.5 Gbps',          bw: 2500,  rol: 'none',  pct: 100, recomendado: 'FortiGate 200G', need: '3.3 Gbps', nCandidatos: 39 },
  { n: 'spoke 100% overlay, 500',      bw: 500,   rol: 'spoke', pct: 100, recomendado: 'FortiGate 60F',  need: '689 Mbps', nCandidatos: 55 },
  { n: 'spoke 70% overlay, 500',       bw: 500,   rol: 'spoke', pct: 70,  recomendado: 'FortiGate 60F',  need: '677 Mbps', nCandidatos: 55 },
  { n: 'spoke 30% overlay, 2.5 Gbps',  bw: 2500,  rol: 'spoke', pct: 30,  recomendado: 'FortiGate 200G', need: '3.3 Gbps', nCandidatos: 39 },
  { n: 'spoke 100% overlay, 2.5 Gbps', bw: 2500,  rol: 'spoke', pct: 100, recomendado: 'FortiGate 200G', need: '3.4 Gbps', nCandidatos: 39 },
  { n: 'hub 100% overlay, 10 Gbps',    bw: 10000, rol: 'hub',   pct: 100, recomendado: 'FortiGate 200G', need: '4.8 Gbps', nCandidatos: 39 },
  { n: 'hub 50% overlay, 10 Gbps',     bw: 10000, rol: 'hub',   pct: 50,  recomendado: 'FortiGate 200G', need: '4.7 Gbps', nCandidatos: 39 },
];

// La fraccion cifrada deja de declararse como porcentaje y pasa a ser un enlace de overlay
// mas otro de breakout local. Es la traduccion del escenario v1 al builder.
function filasDe(e) {
  const ovl = Math.round(e.bw * e.pct / 100), resto = e.bw - ovl;
  const f = [];
  if (ovl > 0) f.push({ tipo: 'MPLS L3', down: ovl, overlay: e.rol !== 'none' });
  if (resto > 0) f.push({ tipo: 'DIA', down: resto, overlay: false });
  return f;
}

module.exports = {
  // Medida en Chromium sobre el commit ANTERIOR al builder, con el deslizador todavia
  // puesto. Va con su fecha y su commit porque una linea base sin procedencia sigue pasando
  // en verde cuando ya no quiere decir nada — el mismo motivo por el que cada fuente del
  // catalogo declara de que fecha es.
  medidoEn: { commit: '2147588', fecha: '2026-09-16' },
  nombre: 'Fortinet — Multi-Underlay Builder contra el caudal unico',
  pagina: 'dimensionador-fortinet-fortigate.html',
  claves: ['recomendado', 'need', 'nCandidatos'],
  baseLinea: BASE_LINEA,

  // Se escribe POR EL BUILDER (boton y campos), no inyectando el estado: un contraste que
  // evita la interfaz no prueba la interfaz.
  async preparar(p, e, { pausa }) {
    if (e.rol !== 'none') { await p.click(`#rolSeg button[data-v="${e.rol}"]`); await pausa(p, 300); }
    const filas = filasDe(e);
    for (let i = 1; i < filas.length; i++) { await p.click('#btnAddWan'); await pausa(p, 150); }
    for (let i = 0; i < filas.length; i++) {
      const f = filas[i], sel = `#wanBuilderFilas .wan-fila >> nth=${i}`;
      await p.selectOption(`${sel} >> [data-campo=tipo]`, f.tipo);
      await pausa(p, 120);
      await p.fill(`${sel} >> [data-campo=down]`, String(f.down));
      await p.dispatchEvent(`${sel} >> [data-campo=down]`, 'input');
      await pausa(p, 120);
      const ov = await p.$(`${sel} >> [data-campo=overlay]`);
      if (ov && !(await ov.isDisabled()) && (await ov.isChecked()) !== f.overlay) { await ov.click(); await pausa(p, 120); }
    }
  },

  async leer(p) {
    const sel = await p.$('#verdict-sel');
    return {
      recomendado: sel ? await sel.evaluate((e) => e.value) : '(sin selector)',
      nCandidatos: sel ? await sel.evaluate((e) => e.options.length) : 0,
      need: await p.$eval('#needLbl', (e) => e.textContent),
    };
  },

  // MIGRACION v1. Un enlace ya pegado en un chat trae ?bw=…&unit=…&pctOverlay=…; si
  // aterrizara con los valores por defecto seria peor que un 404, porque no se nota.
  async extra(p, { base, pausa }) {
    const out = [];
    for (const e of BASE_LINEA.filter((x) => x.rol !== 'none')) {
      await p.goto(`${base}/dimensionador-fortinet-fortigate.html?bw=${e.bw}&unit=1&pctOverlay=${e.pct}`,
        { waitUntil: 'domcontentloaded' });
      await pausa(p, 1400);
      await p.click(`#rolSeg button[data-v="${e.rol}"]`);
      await pausa(p, 900);
      const bw = await p.$eval('#bw', (x) => x.value);
      const pct = await p.$eval('#pctOverlay', (x) => x.value);
      const eq = await p.$eval('#verdict-sel', (x) => x.value);
      const ok = eq === e.recomendado && String(bw) === String(e.bw) && Number(pct) === e.pct;
      out.push({ n: `enlace v1 · ${e.n}`, ok, detalle: `bw=${bw} pct=${pct} -> ${eq}` });
    }
    return out;
  },
};
