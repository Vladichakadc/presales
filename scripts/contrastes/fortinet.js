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
 *
 * REVISION DELIBERADA DE `nCandidatos` EL 2026-09-23, y por que no es aflojar la prueba. Al
 * entrar los limites del Product Matrix, el conteo de tuneles paso de declararse en pantalla
 * a ser un EJE DURO: en los seis escenarios con rol spoke o hub el escenario declara tuneles,
 * y los 7 modelos cuyo «Max G/W to G/W IPsec Tunnels» ese documento ya no publica -100F, 200F,
 * 400F, 401F, 600F, 1000F, 1001F- se apartan con su motivo en vez de darse por buenos. De ahi
 * 55 -> 48 y 39 -> 34, exactamente los 7 y los 5 de ellos que antes competian.
 *
 * LO QUE ESTE CASO EXISTE PARA VIGILAR NO SE TOCO: `recomendado` y `need` son IDENTICOS en los
 * ocho escenarios y en las seis migraciones de enlace v1. Esa es la parte que no puede moverse
 * sin una decision; el conteo de candidatos si se mueve cuando el catalogo gana o pierde una
 * cifra, y por eso la revision va fechada y con su motivo en vez de regenerada en silencio.
 */
/* RE-MEDIDA EL 2026-09-23 (etapa 7), Y SOLO CAMBIA `nCandidatos`. `recomendado` y `need` dan
   exactamente lo mismo en los ocho escenarios que la linea del 2026-09-16 —que es lo que este
   caso existe para vigilar— y el numero de candidatos se mueve por dos cambios DECLARADOS,
   ninguno de ellos del builder:
     · los 4 equipos fuera de venta (70F, 100F, 200F, 600F) ya no son candidatos en compra
       nueva (F14/T21): siguen en el catalogo y en el selector del paso 5, no en la lista de
       los que cumplen. Sin SD-WAN: 55 → 51 y 39 → 38.
     · el tope de tuneles sitio a sitio (eje duro en spoke y hub) paso de 51 a 56 modelos al
       leer las fichas por serie del 400F, 600F y 1000F: los que antes se apartaban por no
       traerlo compiten, salvo los fuera de venta. Con SD-WAN: 48 → 51 y 34 → 38.
   Medido con el motor unico en el arbol de la etapa 7 sobre ec2f803. */
const BASE_LINEA = [
  { n: 'sin sdwan, 500 Mbps',          bw: 500,   rol: 'none',  pct: 100, recomendado: 'FortiGate 60F',  need: '650 Mbps', nCandidatos: 51 },
  { n: 'sin sdwan, 2.5 Gbps',          bw: 2500,  rol: 'none',  pct: 100, recomendado: 'FortiGate 200G', need: '3.3 Gbps', nCandidatos: 38 },
  { n: 'spoke 100% overlay, 500',      bw: 500,   rol: 'spoke', pct: 100, recomendado: 'FortiGate 60F',  need: '689 Mbps', nCandidatos: 51 },
  { n: 'spoke 70% overlay, 500',       bw: 500,   rol: 'spoke', pct: 70,  recomendado: 'FortiGate 60F',  need: '677 Mbps', nCandidatos: 51 },
  { n: 'spoke 30% overlay, 2.5 Gbps',  bw: 2500,  rol: 'spoke', pct: 30,  recomendado: 'FortiGate 200G', need: '3.3 Gbps', nCandidatos: 38 },
  { n: 'spoke 100% overlay, 2.5 Gbps', bw: 2500,  rol: 'spoke', pct: 100, recomendado: 'FortiGate 200G', need: '3.4 Gbps', nCandidatos: 38 },
  { n: 'hub 100% overlay, 10 Gbps',    bw: 10000, rol: 'hub',   pct: 100, recomendado: 'FortiGate 200G', need: '4.8 Gbps', nCandidatos: 38 },
  { n: 'hub 50% overlay, 10 Gbps',     bw: 10000, rol: 'hub',   pct: 50,  recomendado: 'FortiGate 200G', need: '4.7 Gbps', nCandidatos: 38 },
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
  medidoEn: { commit: 'ec2f803+etapa7', fecha: '2026-09-23' },
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
