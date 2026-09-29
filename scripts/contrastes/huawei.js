'use strict';
/* CASO: el dimensionador Huawei pasa a un motor unico sin mover lo que no debe moverse
 * (revision de arquitectura del 2026-09-29, etapa H1 de `docs/revision-huawei-2026-09-29.md`).
 *
 * LINEA BASE: seis escenarios que NINGUNA de las correcciones H-01..H-06 toca a proposito —
 * sin funcion activa que fije un piso de capa, sin slicing ni nodo de nucleo, sin LAN minimos.
 * Reproducen render() de f2a939d con `HuaweiMotor.evaluar(..., {legado:true})`. Lo que la
 * revision SI cambia (SD-WAN con perfil `fwd`, hubs con `lan: null`) se prueba en
 * `test/huawei-motor.test.js`, donde el cambio es la afirmacion; aqui lo que se afirma es que
 * el resto sigue igual, y de paso es el primer caso que CONDUCE esta pantalla, que figuraba
 * «sin conducir» en la cobertura del contraste.
 */
const BASE_LINEA = [
  { n: '500 Mbps SD-WAN típico', bw: 500, perfil: 'typ', sdwan: true, poe: false, wifi: false, wan: false,
    recomendado: 'AR6710-L14T2X4', need: '1.3 Gbps', nCandidatos: 5 },
  { n: '2 Gbps reenvío sin SD-WAN', bw: 2000, perfil: 'fwd', sdwan: false, poe: false, wifi: false, wan: false,
    recomendado: 'AR6710-H4T4X2Y7', need: '5.2 Gbps', nCandidatos: 21 },
  { n: '6 Gbps reenvío sin SD-WAN (entra NetEngine)', bw: 6000, perfil: 'fwd', sdwan: false, poe: false, wifi: false, wan: false,
    recomendado: 'AR8140-12G10XG', need: '15.6 Gbps', nCandidatos: 17 },
  { n: '450 Mbps con PoE y Wi-Fi', bw: 450, perfil: 'fwd', sdwan: false, poe: true, wifi: true, wan: false,
    recomendado: 'AR651W-8P', need: '1.2 Gbps', nCandidatos: 1 },
  { n: '300 Mbps IPsec sin SD-WAN', bw: 300, perfil: 'ipsec', sdwan: false, poe: false, wifi: false, wan: false,
    recomendado: 'AR5710-S8T2S', need: '780 Mbps', nCandidatos: 21 },
  { n: '300 Mbps con 4G/5G integrado', bw: 300, perfil: 'fwd', sdwan: false, poe: false, wifi: false, wan: true,
    recomendado: 'AR5710-S8T2X-LTE4EA', need: '780 Mbps', nCandidatos: 4 },
];

module.exports = {
  medidoEn: { commit: 'f2a939d', fecha: '2026-09-29' },
  nombre: 'Huawei — el motor unico no mueve lo que las correcciones no tocan',
  pagina: 'dimensionador-huawei-netengine.html',
  claves: ['recomendado', 'need', 'nCandidatos'],
  baseLinea: BASE_LINEA,

  async preparar(p, e, { pausa }) {
    await p.fill('#bw', String(e.bw));
    await p.selectOption('#profile', e.perfil);
    for (const [id, on] of [['#sSdwan', e.sdwan], ['#rPoe', e.poe], ['#rWifi', e.wifi], ['#rWan', e.wan]]) {
      if (on) await p.check(id); else await p.uncheck(id);
    }
    await p.dispatchEvent('#bw', 'input');
    await pausa(p, 500);
  },

  async leer(p) {
    const sel = await p.$('#verdict-sel');
    return {
      recomendado: sel ? await sel.evaluate((e) => e.value) : '(sin candidato)',
      nCandidatos: sel ? await sel.evaluate((e) => e.options.length) : 0,
      need: await p.$eval('#needLbl', (e) => e.textContent.replace(/^Requiere\s*/, '')),
    };
  },

  // Lo que la revision SI corrige, conducido en pantalla (H-01 y H-08). Aqui el cambio ES la
  // afirmacion; el resto del caso prueba que nada mas se movio.
  async extra(p, { base, pausa }) {
    const out = [];
    await p.goto(`${base}/dimensionador-huawei-netengine.html`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1400);
    await p.fill('#bw', '500');
    await p.selectOption('#profile', 'fwd');
    await p.check('#sSdwan');
    await p.dispatchEvent('#bw', 'input');
    await pausa(p, 600);
    const rec = await p.$eval('#verdict-sel', (e) => e.value).catch(() => null);
    const aviso = await p.$eval('#avisosMotor', (e) => e.textContent).catch(() => '');
    out.push({ n: 'H-01 · SD-WAN marcado con perfil de reenvío ya no dimensiona contra el reenvío',
      ok: rec && rec !== 'AR5710-S8T2S' && /sube de/.test(aviso),
      detalle: `recomendado ${rec}; aviso: ${aviso ? 'presente' : 'ausente'}` });

    await p.fill('#bw', '450');
    await p.uncheck('#sSdwan');
    await p.check('#rPoe'); await p.check('#rWifi');
    await p.dispatchEvent('#bw', 'input');
    await pausa(p, 600);
    await p.click('.tabs button[data-tab="bom"]');
    await pausa(p, 400);
    const bom = await p.$eval('#bomTabla', (e) => e.textContent).catch(() => '');
    const pick = await p.$eval('#pickModel', (e) => e.value).catch(() => null);
    out.push({ n: 'H-08 · la licencia de rendimiento que exige el cálculo llega al BOM',
      ok: pick === 'AR651W-8P' && /rendimiento/i.test(bom),
      detalle: `equipo ${pick}; línea de rendimiento ${/rendimiento/i.test(bom) ? 'presente' : 'AUSENTE'}` });

    await p.goto(`${base}/dimensionador-huawei-netengine.html`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1400);
    await p.click('#modeSeg button[data-v="agg"]');
    await p.fill('#bw', '50');
    await p.fill('#sites', '100');
    await p.dispatchEvent('#sites', 'input');
    await pausa(p, 600);
    const hub = await p.$eval('#avisosMotor', (e) => e.textContent).catch(() => '');
    const recHub = await p.$eval('#verdict-sel', (e) => e.value).catch(() => null);
    out.push({ n: 'H-11 · un hub de 100 sedes declara los 100 túneles y que falta el tope, sin apartar a nadie',
      ok: /100 túneles IPsec/.test(hub) && /no trae el tope/.test(hub) && recHub === 'AR6710-H4T4X2Y7',
      detalle: `recomendado ${recHub}; aviso ${/100 túneles/.test(hub) ? 'presente' : 'AUSENTE'}` });

    await p.goto(`${base}/dimensionador-huawei-netengine.html`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1400);
    await p.fill('#bw', '500');
    await p.dispatchEvent('#bw', 'input');
    await pausa(p, 500);
    await p.click('.tabs button[data-tab="bom"]');
    await pausa(p, 300);
    const sinHa = await p.$eval('#bomOut', (e) => e.value);
    await p.click('.tabs button[data-tab="calc"]');
    await p.check('#chkHa');
    await pausa(p, 600);
    await p.click('.tabs button[data-tab="bom"]');
    await pausa(p, 300);
    const conHa = await p.$eval('#bomOut', (e) => e.value);
    const cant = (t) => (t.match(/^\s+(\d+) x\s+AR\S+/m) || [])[1];
    const sns = (t) => (t.match(/^\s+\d+ x\s+SnS/gm) || []).length;
    out.push({ n: 'H-12 · la alta disponibilidad 1+1 cotiza dos equipos por sitio, al mismo modelo',
      ok: cant(sinHa) === '1' && cant(conHa) === '2',
      detalle: `sin HA x${cant(sinHa)}, con HA x${cant(conHa)}` });
    out.push({ n: 'BOM · SnS se cotiza una sola vez (antes salía como licencia y como soporte)',
      ok: sns(conHa) === 1, detalle: `${sns(conHa)} línea(s) de SnS` });
    return out;
  },
};
