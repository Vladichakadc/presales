'use strict';
/* global document */
/* CASO: el rol activo/respaldo de los enlaces de Aruba no cambia los sitios que no lo usan
 * (2026-09-24, R11 de la auditoria de Fortinet y M9 de la auditoria de Aruba).
 *
 * `estadoDerivado()` sumaba TODOS los enlaces del Multi-Underlay Builder, asi que un 4G de
 * respaldo contaba como caudal de operacion normal: subia el tier de la suscripcion y podia
 * subir el appliance. Fortinet lo resolvio en `escenariosTrafico` (etapa 7) y aqui se porta
 * la misma regla: la fila gana un `rol`, y la demanda es la de la operacion normal (solo los
 * activos) — un respaldo solo entra, hasta su caudal, cuando cae un activo.
 *
 * LO QUE ESTE CASO VIGILA: que un sitio SIN respaldos declarados salga EXACTAMENTE igual que
 * antes del cambio — mismo equipo, mismo requerimiento, mismo tier, misma licencia y el mismo
 * BOM linea a linea. El rol nace en «activo» por defecto y solo viaja en el enlace cuando es
 * «respaldo», asi que todo enlace ya pegado en un chat es un sitio sin respaldos.
 *
 * LINEA BASE MEDIDA EN CHROMIUM SOBRE f6f1952, ANTES DE TOCAR `estadoDerivado()`. Lo que el rol
 * SI cambia (un respaldo que deja de sumar) no se vigila aqui sino en
 * test/aruba-underlay-rol.test.js y en la bateria e2e: esto es la parte que no puede moverse.
 */
const BASE_LINEA = [
  {
    n: "DIA 100 solo",
    filas: [{ tipo: "DIA", down: 100 }],
    recomendado: "EC-10104", need: "214 Mbps",
    tier: "Automático — 100 Mbps (Σ enlaces WAN del módulo 2)",
    licencia: "EdgeConnect Foundation — tier 100 Mbps · término 3 añossin funciones avanzadas marcadas: gestión centralizada, monitorización e interconexión SD-WAN con SLA — Foundation basta",
    bom: ["R9D72A×1","S1C51AAS×1","H46E8E×1"], total: "Total de referencia$4,855",
  },
  {
    n: "MPLS 200 + DIA 300, breakout",
    filas: [{ tipo: "MPLS L3", down: 200 }, { tipo: "DIA", down: 300 }],
    recomendado: "EC-10108", need: "1.1 Gbps",
    tier: "Automático — 1 Gbps (Σ enlaces WAN del módulo 2)",
    licencia: "EdgeConnect Foundation — tier 1 Gbps · término 3 añossin funciones avanzadas marcadas: gestión centralizada, monitorización e interconexión SD-WAN con SLA — Foundation basta",
    bom: ["S0E23A×1","S1A24AAS×1","H46F7E×1"], total: "Total de referencia$12,873",
  },
  {
    n: "MPLS 200 + DIA 300 + 4G 100, todos activos",
    filas: [{ tipo: "MPLS L3", down: 200 }, { tipo: "DIA", down: 300 }, { tipo: "4G/5G", down: 100 }],
    recomendado: "EC-10108", need: "1.3 Gbps",
    tier: "Automático — 1 Gbps (Σ enlaces WAN del módulo 2)",
    licencia: "EdgeConnect Foundation — tier 1 Gbps · término 3 añossin funciones avanzadas marcadas: gestión centralizada, monitorización e interconexión SD-WAN con SLA — Foundation basta",
    bom: ["S0E23A×1","S1A24AAS×1","H46F7E×1"], total: "Total de referencia$12,873",
  },
  {
    n: "Banda ancha 50 + 4G 50 (microbranch)",
    filas: [{ tipo: "Banda Ancha", down: 50 }, { tipo: "4G/5G", down: 50 }],
    recomendado: "EC-10104", need: "214 Mbps",
    tier: "Automático — 100 Mbps (Σ enlaces WAN del módulo 2)",
    licencia: "EdgeConnect Foundation — tier 100 Mbps · término 3 añossin funciones avanzadas marcadas: gestión centralizada, monitorización e interconexión SD-WAN con SLA — Foundation basta",
    bom: ["R9D72A×1","S1C51AAS×1","H46E8E×1"], total: "Total de referencia$4,855",
  },
  {
    n: "MPLS L3 1000 sin breakout", sinBreakout: true,
    filas: [{ tipo: "MPLS L3", down: 1000 }],
    recomendado: "EC-S", need: "2.1 Gbps",
    tier: "Automático — 1 Gbps (Σ enlaces WAN del módulo 2)",
    licencia: "EdgeConnect Foundation — tier 1 Gbps · término 3 añossin funciones avanzadas marcadas: gestión centralizada, monitorización e interconexión SD-WAN con SLA — Foundation basta",
    bom: ["S3N73A×1","S1A24AAS×1","H46D0E×1"], total: "Total de referencia$23,041",
  },
  {
    n: "DIA 1000 + 4G 200 con Boost", boost: true,
    filas: [{ tipo: "DIA", down: 1000 }, { tipo: "4G/5G", down: 200 }],
    recomendado: "EC-S", need: "2.6 Gbps",
    tier: "Automático — Sin límite de caudal (Σ enlaces WAN del módulo 2)",
    licencia: "EdgeConnect Foundation — tier Sin límite de caudal · término 3 añossin funciones avanzadas marcadas: gestión centralizada, monitorización e interconexión SD-WAN con SLA — Foundation bastaBoost: 2 bloque(s) de 100 Mbps = 30 % del tráfico WAN privado por los túneles (108 Mbps)",
    bom: ["S3N73A×1","S1A38AAS×1","S0Z73AAS×2","H46D0E×1"], total: "Total de referencia$80,857",
  },
  {
    // REVISION DELIBERADA EL 2026-09-24, en el mismo cambio y con su motivo — el equipo, el
    // requerimiento y el tier NO se movieron:
    //   · bom: la suscripcion de Central deja de cotizar JZ119AAE, que es el SKU de la lista
    //     con descripcion literal «Aruba 7/90xx Gtwy» y no aplica a un 9114 (serie 9100), y pasa
    //     al SKU oficial de su serie, S0B89AAE («91xx SD-Branch Gateway Foundation 3-year», tabla
    //     11 del documento de suscripciones de Central), sin precio: la lista cargada no lo trae
    //     (A3 de la auditoria de Aruba).
    //   · licencia: `#licAutoTxt` decia «EdgeConnect Foundation — tier 100 Mbps» sobre un
    //     GATEWAY: era el texto que dejaba la pagina vacia al cotizar un EC-XS por defecto
    //     (M6). El campo esta oculto para los gateways y ahora queda vacio.
    n: "2 x DIA 5000 (regla HA)",
    filas: [{ tipo: "DIA", down: 5000 }, { tipo: "DIA", down: 5000 }],
    recomendado: "Gateway 9114", need: "21.4 Gbps",
    tier: "Automático — Sin límite de caudal (Σ enlaces WAN del módulo 2)",
    licencia: "",
    bom: ["R9M45A×2","S0B89AAE×2","—×2"], total: null,
  },
];

module.exports = {
  medidoEn: { commit: 'f6f1952', fecha: '2026-09-24' },
  nombre: 'Aruba — el rol activo/respaldo no mueve los sitios sin respaldo',
  pagina: 'dimensionador-aruba-edgeconnect.html',
  claves: ['recomendado', 'need', 'tier', 'licencia', 'bom', 'total'],
  baseLinea: BASE_LINEA,

  // Se escribe POR EL BUILDER (boton y campos), no inyectando el estado: un contraste que
  // evita la interfaz no prueba la interfaz. Mismo criterio que el caso de Fortinet.
  async preparar(p, e, { pausa }) {
    if (e.boost) { await p.check('#chkBoost'); await pausa(p, 200); }
    if (e.sinBreakout) { await p.uncheck('#chkBreakout'); await pausa(p, 200); }
    for (let i = 1; i < e.filas.length; i++) { await p.click('#btnAddWan'); await pausa(p, 150); }
    for (let i = 0; i < e.filas.length; i++) {
      const f = e.filas[i], sel = `#wanBuilderFilas .wan-fila >> nth=${i}`;
      await p.selectOption(`${sel} >> [data-campo=tipo]`, f.tipo);
      await pausa(p, 120);
      await p.fill(`${sel} >> [data-campo=down]`, String(f.down));
      await p.dispatchEvent(`${sel} >> [data-campo=down]`, 'input');
      await pausa(p, 150);
    }
  },

  async leer(p) {
    return p.evaluate(() => {
      const txt = (id) => { const n = document.getElementById(id); return n ? n.textContent.replace(/\s+/g, ' ').trim() : null; };
      // El BOM se lee como SKU × cantidad: lo que se pide, no como se pinta. La cantidad
      // vive en un campo editable o en la celda, segun la linea.
      const bom = [...document.querySelectorAll('#bomTabla tbody tr')].map((r) => {
        if (r.cells.length < 3) return null;
        const sku = r.cells[1].textContent.replace(/\s+/g, ' ').trim();
        const inp = r.cells[2].querySelector('input');
        const qty = inp ? inp.value : r.cells[2].textContent.replace(/\s+/g, ' ').trim();
        return sku ? `${sku}×${qty || '1'}` : null;
      }).filter(Boolean);
      const totalFila = [...document.querySelectorAll('#bomTabla tbody tr')]
        .map((r) => r.textContent.replace(/\s+/g, ' ').trim()).find((t) => /^Total de referencia/.test(t));
      return {
        recomendado: document.getElementById('pickModel').value,
        need: txt('needLbl'),
        tier: document.getElementById('selTier').options[0].textContent.replace(/\s+/g, ' ').trim(),
        licencia: txt('licAutoTxt'),
        bom,
        total: totalFila || null,
      };
    });
  },
};
