'use strict';
// Calculadora de Throughput del portal (public/js/calculadora.js).
//
// POR QUE ESTA PRUEBA EXISTE. La pantalla elegia equipo con una sola linea:
//     const cap = profile==='ipsec' && d.ipsec>0 ? d.ipsec : d.tp;
// `d.tp` es la cifra de PORTADA de cada catalogo, asi que el perfil «SD-WAN / NGFW» nunca
// llego a mirar la cifra de NGFW, y un equipo sin cifra de IPsec se juzgaba por su
// forwarding. Las dos cosas dan una respuesta con pinta de correcta, que es el unico modo de
// fallo que importa en una herramienta de preventa.
//
// SOBRE LA FORMA DE LOS DATOS. Los equipos de aqui llevan los campos que entrega
// `/api/catalog`, que NO son los de `legacyData/indexPR.js`: `seedCatalog.js` funde en la
// misma fila el catalogo del portal y el del dimensionador de ese fabricante, asi que Cisco
// llega con `sdwan` numerico y los SRX de 2024 con `vpn`, `ips` y `atp`. La primera version
// de este modulo se escribio contra `indexPR.js` y por eso apartaba a Cisco entero del
// perfil SD-WAN por un dato que si estaba. La cobertura real se comprueba contra el servidor
// de verdad en test/servidor-produccion.test.js; aqui se prueban las reglas.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cargar } = require('./ayuda/navegador.js');

const { CALC } = cargar('public/js/calculadora.js');

const dev = (grupo, vendor, raw) => ({
  grupo, vendor, raw, model: raw.model || 'X', series: raw.ser, seg: raw.seg, ports: raw.ports, color: '#000',
});
// Cifras reales de /api/catalog, transcritas para que la prueba no dependa de la siembra.
const FG30G = dev('fortinet', 'Fortinet', { model: 'FortiGate 30G', fw: 4000, vpn: 3500, ngfw: 570, ips: 800, tp: 500 });
const FG120G = dev('fortinet', 'Fortinet', { model: 'FortiGate 120G', fw: 39000, vpn: 35000, ngfw: 3100, ips: 5300, tp: 2800 });
const FG90G = dev('fortinet', 'Fortinet', { model: 'FortiGate 90G', fw: 28000, vpn: 25000, ngfw: 2500, ips: 4500, tp: 2200 });
const IXRD1 = dev('nokia', 'Nokia', { model: '7220 IXR-D1', cap: 88 });
const ECS = dev('aruba', 'Aruba', { model: 'EC-S', fwd: 3000, ipsec: 0, sdwan: 'Foundation/Advanced + Boost', wanMin: 10, wanMax: 3000 });
const ASR = dev('cisco', 'Cisco', { model: 'ASR 1006-X', ser: 'ASR 1000', fwd: 200000, ipsec: 78000, sdwan: 20000 });
const ISR = dev('cisco', 'Cisco', { model: 'ISR 1111-8P', ser: 'ISR 1000', fwd: 300, ipsec: 200 });
const SRX1600 = dev('juniper', 'Juniper', { model: 'SRX1600', ser: 'SRX 1600', cap: '24 Gbps FW', fw: 24000, vpn: 18000, ips: 4500, atp: 2000 });
const SRX345 = dev('juniper', 'Juniper', { model: 'SRX 345', ser: 'SRX 300', cap: '5 Gbps FW' });
const MX204 = dev('juniper', 'Juniper', { model: 'MX204', ser: 'MX', cap: '400 Gbps' });
const SSR1200 = dev('juniper', 'Juniper', { model: 'SSR1200', ser: 'SSR 1000', cap: 10000 });
const AR6300 = dev('hw_ar', 'Huawei', { model: 'AR6300', fwd: 5000, ipsec: 4000, sdwan: '3000 Mbps' });
const AR651 = dev('hw_ar', 'Huawei', { model: 'AR651', fwd: 2000, ipsec: 2000, sdwan: '—' });
const CCR = dev('mikrotik', 'MikroTik', { model: 'CCR2116-12G-4S+', fwd: 24000, ipsec: 6800, sdwan: 'WireGuard / OVPN / CAPsMAN' });
const NE8000 = dev('hw_wan', 'Huawei', { model: 'NE8000 M4', cap: 2400000 });
const TODOS = [FG30G, FG90G, FG120G, IXRD1, ECS, ASR, ISR, SRX1600, SRX345, MX204, SSR1200, AR6300, AR651, CCR, NE8000];

test('con inspección se dimensiona con la cifra de inspección, no con la de firewall', () => {
  // EL FALLO, con los valores por defecto de la pantalla: 1 Gbps bidireccional + 30 % de
  // margen = 2600 Mbps. La version anterior proponia un FortiGate 30G porque su FIREWALL da
  // 4 Gbps; su NGFW son 570 Mbps, factor 4,6x por debajo de lo pedido.
  const r = CALC.evaluar(TODOS, 'ngfw', 2600);
  const nombres = Array.from(r.candidatos).map((f) => f.d.model);
  assert.ok(!nombres.includes('FortiGate 30G'), 'el 30G ya no se propone: hace 570 Mbps de NGFW');
  assert.ok(!nombres.includes('FortiGate 90G'), 'ni el 90G, que hace 2500');
  assert.strictEqual(nombres[0], 'FortiGate 120G', 'el mas pequenyo que cumple de verdad');

  // Cada candidato usa su propia cifra de esa capa y la etiqueta dice cual es.
  for (const f of Array.from(r.candidatos)) {
    assert.ok(['NGFW', 'IPS'].includes(f.capa), `${f.d.model} declara la prueba: ${f.capa}`);
    assert.ok(f.mbps >= 2600);
  }
  // Juniper publica IPS, no NGFW: entra con su cifra y con su nombre.
  assert.ok(nombres.includes('SRX1600'));
  assert.strictEqual(Array.from(r.candidatos).find((f) => f.d.model === 'SRX1600').mbps, 4500);
});

test('sin cifra de esa capa, el equipo se aparta con su motivo: nunca se sustituye', () => {
  // EL SEGUNDO FALLO. Para 2,6 Gbps de IPsec se proponia un Nokia 7220 IXR-D1 —un leaf de
  // fabric de datacenter— porque conmuta 88 Gbps, y un Aruba EC-S cuyo IPsec en el catalogo
  // es 0. Ninguno de los dos trae cifra de IPsec: no se pueden comprobar, y decirlo es la
  // respuesta correcta.
  const r = CALC.evaluar(TODOS, 'ipsec', 2600);
  const cand = Array.from(r.candidatos).map((f) => f.d.model);
  const apart = Array.from(r.apartados).map((a) => a.d.model);
  assert.ok(!cand.includes('7220 IXR-D1') && apart.includes('7220 IXR-D1'));
  assert.ok(!cand.includes('EC-S') && apart.includes('EC-S'), 'ipsec: 0 es «no hay dato»');
  // Un SRX sin cifra propia de IPsec tampoco se dimensiona con su firewall.
  assert.ok(!cand.includes('SRX 345') && apart.includes('SRX 345'));
  assert.ok(cand.includes('SRX1600'), 'el que si la trae, si');

  for (const a of Array.from(r.apartados)) {
    assert.ok(a.motivo && a.motivo.length > 20, `${a.d.model} explica por que no se comprueba`);
  }
});

test('un dato que SI esta no se aparta: Cisco publica SD-WAN por modelo', () => {
  // El primer error de este modulo, y del mismo tipo que el «IPS: no aplica» de un Catalyst
  // 8300 que el comparador llego a mostrar: el mapa se escribio contra `indexPR.js`, donde
  // el campo `sdwan` de Cisco es el texto «Sí», y apartaba los 19 modelos. En `/api/catalog`
  // es un numero, porque la siembra funde ahi el catalogo del dimensionador.
  const r = CALC.evaluar(TODOS, 'sdwan', 2600);
  const cand = Array.from(r.candidatos).map((f) => f.d.model);
  assert.ok(cand.includes('ASR 1006-X'), 'Cisco entra con su cifra de SD-WAN');
  assert.strictEqual(Array.from(r.candidatos).find((f) => f.d.model === 'ASR 1006-X').mbps, 20000);
  // El ISR 1111-8P no trae `sdwan`: ese si se aparta, y por el dato, no por el fabricante.
  assert.ok(Array.from(r.apartados).some((a) => a.d.model === 'ISR 1111-8P'));
  // Y el EdgeConnect entra por el ancho de banda WAN que HPE publica.
  assert.ok(cand.includes('EC-S'));
  assert.match(Array.from(r.candidatos).find((f) => f.d.model === 'EC-S').capa, /WAN/);
});

test('`0` en el catalogo es «no hay dato», nunca «vale cero»', () => {
  // El tercer estado que protege todo este catalogo.
  assert.strictEqual(CALC.mbps(0), null);
  assert.strictEqual(CALC.mbps(null), null);
  assert.strictEqual(CALC.mbps(undefined), null);
  assert.strictEqual(CALC.mbps('—'), null);
  assert.strictEqual(CALC.mbps('N/A'), null);
  assert.strictEqual(CALC.mbps('Consultar'), null, 'sin un digito no hay cifra');
  assert.strictEqual(CALC.mbps(''), null);
  assert.strictEqual(CALC.capaDe(AR651, 'sdwan').mbps, null, 'su SD-WAN es «—»');
  assert.ok(CALC.capaDe(AR651, 'fwd').mbps > 0, 'y su forwarding si esta');
});

test('cada catalogo dice su capacidad en su unidad, y todas acaban en Mbps', () => {
  // Mezclar unidades haria que 4,8 Tbps perdiera contra 300 Gbps al ordenar, el mismo fallo
  // que tabla.js ya tuvo cuando 5.999 dolares valian menos que 29.
  assert.strictEqual(CALC.mbps('4.8 Tbps'), 4800000);
  assert.strictEqual(CALC.mbps('24 Gbps FW'), 24000);
  assert.strictEqual(CALC.mbps('620 Mbps'), 620);
  assert.strictEqual(CALC.mbps(1300), 1300);
  assert.strictEqual(CALC.fmt(4800000), '4.8 Tbps');
  assert.strictEqual(CALC.fmt(2600), '2.6 Gbps');
  assert.strictEqual(CALC.fmt(620), '620 Mbps');
});

test('la base de la cifra se lee del propio catalogo, no se supone por la serie', () => {
  // Juniper mete tres medidas en el mismo campo y las anota: «24 Gbps FW» es firewall en un
  // SRX, «400 Gbps» es conmutacion en un MX, y la de un SSR es su caudal SD-WAN.
  assert.match(CALC.capaDe(SRX345, 'fwd').n, /Firewall/);
  assert.match(CALC.capaDe(MX204, 'fwd').n, /conmutación/);
  assert.match(CALC.capaDe(SSR1200, 'fwd').n, /Session Smart/);
  assert.match(CALC.capaDe(SSR1200, 'sdwan').n, /Session Smart/);
  // Y un SRX no tiene cifra de SD-WAN: se aparta en vez de colarse con la de firewall.
  assert.strictEqual(CALC.capaDe(SRX1600, 'sdwan').mbps, null);
  // Cuando el numerico del dimensionador esta, manda sobre el texto del portal.
  assert.strictEqual(CALC.capaDe(SRX1600, 'fwd').mbps, 24000);
});

test('los cinco perfiles son cinco capas distintas del mismo equipo', () => {
  // El SRX1600 y el FortiGate 120G bajan capa a capa, y ese descenso es justo lo que la
  // pantalla ocultaba al dimensionarlo todo con la cifra de portada.
  const escalera = (d, capas) => capas.map((c) => CALC.capaDe(d, c).mbps);
  const srx = escalera(SRX1600, ['fwd', 'ipsec', 'ngfw', 'tp']);
  assert.deepStrictEqual(srx, [24000, 18000, 4500, 2000]);
  const fg = escalera(FG120G, ['fwd', 'ipsec', 'ngfw', 'tp']);
  assert.deepStrictEqual(fg, [39000, 35000, 3100, 2800]);
  // Doce veces entre la cifra que se cita y la que aguanta con inspeccion completa.
  assert.ok(fg[0] / fg[3] > 10);
  // Y los cinco perfiles se declaran: etiqueta, que miden y como se dice el hueco.
  for (const k of Object.keys(CALC.PERFILES)) {
    const p = CALC.PERFILES[k];
    assert.ok(p.etq && p.mide.length > 60 && p.falta, `${k} se explica`);
    assert.ok(Object.keys(p.capa).length > 0, `${k} lee de algun catalogo`);
  }
});

test('el requerimiento se calcula en un solo sitio', () => {
  assert.strictEqual(CALC.requerimiento({ bw: 1, unit: 1000, dir: 2, margin: 30 }), 2600);
  assert.strictEqual(CALC.requerimiento({ bw: 500, unit: 1, dir: 1, margin: 0 }), 500);
  assert.strictEqual(CALC.requerimiento({ bw: '', unit: 1, dir: 2, margin: 30 }), 0);
});

test('por encima del mayor del catalogo no hay candidato, y se dice cuanto falta', () => {
  const r = CALC.evaluar(TODOS, 'ngfw', 10e6);
  assert.strictEqual(r.candidatos.length, 0);
  assert.ok(r.cortos.length > 0, 'los que si tienen cifra de la capa quedan como cortos');
  // De mayor a menor: lo primero que hay que saber es por cuanto se queda corto el mayor.
  const caps = Array.from(r.cortos).map((f) => f.mbps);
  assert.deepStrictEqual(caps.slice(), caps.slice().sort((a, b) => b - a));
});

test('el aviso de bases sale al mezclar fabricantes y no antes', () => {
  const f = (vendor, capa) => ({ d: { vendor }, capa, mbps: 1 });
  assert.strictEqual(CALC.avisoBases([f('Fortinet', 'NGFW'), f('Fortinet', 'NGFW')]), null);
  assert.match(CALC.avisoBases([f('Fortinet', 'NGFW'), f('Juniper', 'IPS')]), /no miden lo mismo/);
  assert.match(CALC.avisoBases([f('Fortinet', 'IPsec'), f('Cisco', 'IPsec')]), /su propio banco de pruebas/);
});

test('la lista de fabricantes sale del catalogo, no de una lista escrita a mano', () => {
  // La lista fija de los filtros del cotizador se quedo en seis fabricantes y dejo a Aruba y
  // MikroTik sin boton. Aqui habria hecho desaparecer en silencio a un fabricante nuevo.
  const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'index.js'), 'utf8');
  assert.ok(!/\['Huawei','Cisco','Fortinet','Nokia','Juniper','MikroTik','Aruba'\]/.test(src),
    'index.js ya no recorre una lista fija de fabricantes en la calculadora');

  // 50 Mbps: por debajo del mas pequenyo del catalogo de prueba, para que salgan todos.
  const grupos = CALC.porFabricante(CALC.evaluar(TODOS, 'fwd', 50).candidatos);
  // Comparado como JSON: lo que devuelve el modulo vive en el realm del vm de pruebas y
  // deepStrictEqual lo rechaza por identidad de Array.prototype aunque el contenido sea igual
  // (mismo motivo que en test/ficha-alimentacion.test.js).
  const vendors = Array.from(grupos).map((g) => g.vendor).sort();
  assert.strictEqual(JSON.stringify(vendors),
    JSON.stringify(['Aruba', 'Cisco', 'Fortinet', 'Huawei', 'Juniper', 'MikroTik', 'Nokia']));
  // Ordenados por el menor que cumple de cada uno, no por un orden decidido a mano.
  const primeros = Array.from(grupos).map((g) => g.filas[0].mbps);
  assert.deepStrictEqual(primeros.slice(), primeros.slice().sort((a, b) => a - b));
});

test('la exportacion sale de los datos y lleva la capa dimensionada', () => {
  // Antes se armaba rascando el HTML ya pintado, asi que perdia la capa —el dato que da
  // sentido a la cifra— y se rompia al tocar el maquetado.
  const ctx = { perfil: 'Con inspección (NGFW / IPS)', need: 2600, detalle: '1 Gbps × bidireccional' };
  const csv = CALC.csv(CALC.evaluar(TODOS, 'ngfw', 2600), ctx);
  assert.match(csv, /# Calculadora de Throughput — perfil Con inspección/);
  assert.match(csv, /"Capa dimensionada"/);
  assert.match(csv, /"FortiGate 120G","[^"]*","[^"]*","NGFW","3100","3.1 Gbps"/);
  // Los apartados viajan en el CSV con su motivo: si no, quien lo abre cree que el catalogo
  // solo tiene los que cumplen.
  assert.match(csv, /"sin comprobar"/);
  assert.match(csv, /7220 IXR-D1/);
});

test('los apartados se cuentan por fabricante y se dice donde si se dimensionan', () => {
  const grupos = CALC.apartadosPorFabricante(CALC.evaluar(TODOS, 'ngfw', 2600).apartados);
  assert.ok(grupos.length > 0);
  for (const g of Array.from(grupos)) {
    assert.ok(g.n > 0 && g.motivo, `${g.vendor} dice cuantos y por que`);
    assert.ok(g.tool && g.tool.url, `${g.vendor} enlaza a su dimensionador`);
  }
  const n = Array.from(grupos).map((g) => g.n);
  assert.deepStrictEqual(n.slice(), n.slice().sort((a, b) => b - a));
});

test('cada dimensionador enlazado existe de verdad', () => {
  // Un enlace roto en el panel de apartados manda a quien no pudo dimensionar aqui a una
  // pagina que no esta.
  for (const g of Object.keys(CALC.HERRAMIENTA)) {
    const url = CALC.HERRAMIENTA[g].url;
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', url.replace(/^\//, ''))), `${g} → ${url}`);
  }
});

test('el desplegable de la pagina y los perfiles del modulo no se pueden desincronizar', () => {
  // Una opcion en el HTML sin perfil detras no calcula nada, y un perfil sin opcion es codigo
  // muerto. Las dos cosas pasan en silencio.
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const bloque = html.slice(html.indexOf('<select id="calcProfile">'));
  const opciones = Array.from(bloque.slice(0, bloque.indexOf('</select>')).matchAll(/value="([^"]+)"/g)).map((m) => m[1]);
  assert.deepStrictEqual(opciones.sort(), Object.keys(CALC.PERFILES).sort());
});
