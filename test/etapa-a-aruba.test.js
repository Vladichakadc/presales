'use strict';
// ETAPA A del plan 3 (2026-09-14): contratos del rediseño carrier-grade del builder WAN,
// del bloque «Pendiente de cotización con el distribuidor» (pendiente #29), de la línea
// DTD con precio de lista (pendiente #31) y del enlace compartible + contexto MSP
// (pendiente #39) del dimensionador Aruba EdgeConnect.
//
// POR QUE ESTA PRUEBA EXISTE. El rediseño de la etapa A toca la superficie que usan los
// E2E y el estado v2 que viaja en la URL: si un refactor futuro renombra un id, retira un
// data-campo o deja de persistir `simetrico`, los enlaces compartidos se restauran mal y
// nadie se entera hasta que un preventa abre el escenario de un cliente y ve otra cosa.
// Estas afirmaciones fijan el contrato, no la estética: el HTML puede cambiar mientras el
// contrato siga en pie.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cargar } = require('./ayuda/navegador.js');

const raiz = (...p) => path.join(__dirname, '..', ...p);
const html = fs.readFileSync(raiz('public/dimensionador-aruba-edgeconnect.html'), 'utf8');
const js = fs.readFileSync(raiz('public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');

// ── Contrato intocable del builder WAN (lo usan tests y E2E) ─────────────────
test('el builder WAN conserva sus ids de contrato tras el rediseño', () => {
  for (const id of ['id="wanBuilder"', 'id="wanBuilderFilas"', 'id="btnAddWan"', 'id="chkBreakout"',
    'id="bannerMicrobranch"', 'id="ahorroMpls"', 'id="alertaEscalado"', 'id="pickModel"', 'id="wanLinksData"']) {
    assert.ok(html.includes(id), `el HTML ya no tiene ${id} — es contrato de tests y E2E`);
  }
  // La barra agregada viva vive justo bajo el builder.
  assert.ok(html.includes('id="wanResumen"'), 'falta #wanResumen bajo el builder');
});

test('cada tarjeta WAN sigue generando los data-campo del contrato, más el toggle Simétrico', () => {
  for (const campo of ['data-campo="tipo"', 'data-campo="medio"', 'data-campo="down"', 'data-campo="up"', 'data-campo="simetrico"']) {
    assert.ok(js.includes(campo), `wanFilaHtml ya no genera ${campo}`);
  }
  // Cabecera de tarjeta: «Enlace N», badge de familia, duplicar y quitar.
  assert.ok(js.includes('Enlace ${'), 'la tarjeta perdió su cabecera «Enlace N»');
  assert.ok(js.includes('data-wan-badge'), 'la tarjeta perdió el badge de familia');
  assert.ok(js.includes('data-wan-duplicar'), 'la tarjeta perdió el botón de duplicar');
  assert.ok(js.includes('data-wan-quitar'), 'la tarjeta perdió el botón de quitar');
});

test('el estado v2 persiste `simetrico` con compatibilidad hacia atrás', () => {
  assert.ok(js.includes('JSON.stringify({v:2, wanLinks:'), 'la serialización v2 del hidden cambió de forma');
  // Si una fila antigua no declara `simetrico`, se asume por comparación down===up.
  assert.ok(js.includes('l.simetrico=l.down===l.up'),
    'la restauración ya no asume simetrico por comparación down===up — rompe enlaces v2 antiguos');
  // La migración v1→v2 sigue existiendo.
  assert.ok(js.includes('function migrarEstadoV1'), 'se retiró la migración v1→v2');
});

test('el semáforo de #wanResumen y el escalado usan la MISMA regla (evaluarPuertos)', () => {
  // La regla de densidad de puertos se extrae a una sola función: si vuelve a haber dos
  // copias, la barra avisará una cosa y el dimensionador escalará por otra.
  assert.ok(js.includes('function evaluarPuertos('), 'falta evaluarPuertos (regla única de densidad)');
  assert.ok(js.includes('evaluarPuertos(m,D.wanLinks).nivel'),
    'el escalado del EC-10104 ya no usa evaluarPuertos — regla duplicada otra vez');
  assert.ok(js.includes('const ev=evaluarPuertos(m,links)'),
    '#wanResumen ya no usa evaluarPuertos — regla duplicada otra vez');
});

// ── Pendiente #39: enlace compartible y contexto MSP ──────────────────────────
test('el botón «Copiar enlace del escenario» y los campos MSP existen y viajan en el estado', () => {
  assert.ok(html.includes('id="btnCopiarEscenario"'), 'falta #btnCopiarEscenario en la pestaña calc');
  assert.ok(html.includes('id="nombreCliente"'), 'falta #nombreCliente');
  assert.ok(html.includes('id="refProyecto"'), 'falta #refProyecto');
  // Persistidos como campos del escenario: es lo que los mete en la URL y en los perfiles.
  assert.ok(/CAMPOS_ESCENARIO=\[[\s\S]*?'nombreCliente'[\s\S]*?'refProyecto'[\s\S]*?\]/.test(js),
    'nombreCliente/refProyecto ya no están en CAMPOS_ESCENARIO — no viajan en la URL');
  assert.ok(js.includes('navigator.clipboard.writeText(location.href)'), 'el botón ya no copia la URL del escenario');
});

// ── Pendiente #29: líneas sin precio etiquetadas y enumeradas ────────────────
const g = cargar('public/js/bom.js');
const { BOM } = g;

const FILAS_PENDIENTE = [
  { cat: 'Equipo', desc: 'EdgeConnect 10108', sku: 'S0P93A', qty: 1, unit: 2495 },
  { cat: 'Seguridad', desc: 'HPE Aruba SSE — suscripción por usuario', sku: 'R8M36AAE', qty: 50, unit: null },
];

test('la tabla marca «Pendiente de cotización» cualquier línea con unit null, no solo SSE', () => {
  const htmlBom = BOM.renderTabla(FILAS_PENDIENTE, {});
  assert.ok(/consultar/i.test(htmlBom), 'la celda sin precio sigue diciendo «consultar» (contrato previo)');
  assert.ok(htmlBom.includes('Pendiente de cotización'), 'falta el badge «Pendiente de cotización» en la línea null');
  // Nota al pie que enumera las pendientes: con descripción y SKU, lista para el correo.
  assert.ok(htmlBom.includes('Pendiente de cotización con el distribuidor'), 'falta la nota al pie');
  assert.ok(htmlBom.includes('HPE Aruba SSE') && htmlBom.includes('R8M36AAE'),
    'la nota al pie no enumera la línea pendiente con su SKU');
  // Y el total excluye la línea sin precio, como siempre: suma solo los $2.495 del equipo.
  assert.ok(htmlBom.includes('Total parcial') && htmlBom.includes('$2,495'),
    'el total parcial ya no excluye la línea sin precio');
});

test('el texto plano enumera las pendientes para el correo al distribuidor', () => {
  const txt = BOM.comoTexto(FILAS_PENDIENTE, { titulo: 'Prueba' });
  assert.ok(txt.includes('PENDIENTE DE COTIZACION CON EL DISTRIBUIDOR:'), 'falta la sección en el texto plano');
  assert.ok(txt.includes('HPE Aruba SSE — suscripción por usuario (R8M36AAE) x50'), 'la línea pendiente no va enumerada');
});

test('el Excel distingue las pendientes en una sección y encabeza cliente/referencia', () => {
  // El contenido del Excel vive en BOM.matrizExcel (núcleo puro desde el plan 20,
  // 2026-09-18): se afirma sin navegador, sin disco y sin dobles del escritor. El
  // vertido real a .xlsx (ExcelJS) lo cubre el e2e, que descarga el fichero y lo relee
  // con SheetJS — incluida la hoja «Fotos del equipo».
  const { aoa } = BOM.matrizExcel(FILAS_PENDIENTE, {
    titulo: 'Prueba', archivo: 'prueba', cliente: 'Cliente MSP SA', referencia: 'PRY-2026-042',
  });
  const plano = aoa.map((f) => f.join(' | ')).join('\n');
  assert.ok(plano.includes('Cliente: Cliente MSP SA'), 'la primera hoja no encabeza el cliente');
  assert.ok(plano.includes('Referencia del proyecto: PRY-2026-042'), 'la primera hoja no encabeza la referencia');
  assert.ok(plano.includes('PENDIENTE DE COTIZACION CON EL DISTRIBUIDOR'), 'falta la sección de pendientes en el Excel');
  assert.ok(plano.includes('R8M36AAE'), 'la sección de pendientes no enumera el SKU');
});

test('matrizExcel marca la cabecera y el total para que el escritor las destaque', () => {
  // El escritor (plan 20) fija la vista bajo la cabecera y la pone en negrita junto al
  // total: si estos índices se desalinean, el Excel queda con la fila equivocada fija.
  const { aoa, filaCabecera, filaTotal } = BOM.matrizExcel(FILAS_PENDIENTE, { titulo: 'Prueba' });
  assert.strictEqual(aoa[filaCabecera][0], 'Categoría', 'filaCabecera no apunta a la cabecera de columnas');
  assert.ok(String(aoa[filaTotal][4]).startsWith('Total'), 'filaTotal no apunta a la fila de total');
});

// ── Pendiente #31: la línea DTD del BOM lleva precio real de la lista ─────────
test('el BOM declara la línea DTD con su SKU de la escalera cuando hay suscripción', () => {
  // La regla vive en renderBom: secMode==='dtd' + suscripción activa → línea «Seguridad»
  // con SKU y List Price; sin suscripción no se cotiza (add-on de la suscripción).
  assert.ok(js.includes("secMode==='dtd'") && js.includes("DTD[dtdMod]"),
    'renderBom ya no saca la línea DTD de la escalera del catálogo');
  assert.ok(js.includes('Dynamic Threat Defense HA'), 'falta la segunda línea DTD del par HA 1+1');
  // Término de 7 años: la lista lo publica, el dimensionador lo modela a 5 (#28).
  assert.ok(js.includes('termYrs>=7?5:termYrs'), 'el término de 7 años ya no cae al de 5 con nota');
});

test('la proyección del catálogo expone la escalera DTD al dimensionador', () => {
  // toDimensionadorAruba es asíncrona y consulta SQLite: el camino en caliente queda
  // cubierto por el smoke del servidor (GET /api/... lleva `dtd` al dimensionador). Lo
  // que se afirma aquí es el CABLEADO, que es lo que se rompe en silencio: la proyección
  // saca `dtd` de la misma constante del seed que el test de integridad cruza con la lista.
  const fuente = fs.readFileSync(raiz('server/services/catalogProjection.js'), 'utf8');
  assert.ok(fuente.includes('dtd: arubaData.DTD_LICENSES'),
    'toDimensionadorAruba ya no expone `dtd` desde DTD_LICENSES');
  const seed = fs.readFileSync(raiz('server/seed/legacyData/aruba.js'), 'utf8');
  assert.ok(/\bDTD_LICENSES\b/.test(seed) && seed.includes('S0Z37AAS'),
    'el seed ya no exporta DTD_LICENSES con los SKU literales de la lista');
});
