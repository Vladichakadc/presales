'use strict';
// Reglas del recorrido de valores límite (test/e2e/limites-reglas.js): qué cuenta como hallazgo,
// qué no, y que cada excepción lleve su motivo. Los fragmentos «deben cazarse» son textos
// literales de los seis errores encontrados el 2026-10-01; los «no deben cazarse», textos reales
// de las pantallas que un patrón descuidado confundiría con un error.
const test = require('node:test');
const assert = require('node:assert');
const R = require('./e2e/limites-reglas.js');

const clases = (texto) => R.hallazgosDeTexto(texto).map((h) => h.clase);

test('los errores del 2026-10-01 se cazan, cada uno con su clase', () => {
  const casos = [
    ['OUGHPUT PUBLICADO VS. REQUERIMIENTO (LOGARÍTMICA) Requiere -13 Mbps AR5710-S8T2S', 'negativo'],
    ['Requerimiento con margen: -13000 Mbps | Capacidad del equipo', 'negativo'],
    ['SD-WAN típico (IPsec+QoS+SA+AppFlow, IMIX) -2 % de 620 Mbps', 'negativo'],
    ['Caudal del enlace -6 Gbps / 300 Gbps', 'negativo'],
    ['Hub con -5 sedes: se piden -5 túneles IPsec terminando en el equipo', 'negativo'],
    ['AR6700-H Casa matriz / campus grande 13 Gbps 10 Gbps null 2 x 25GE SFP28', 'texto-codigo'],
    ['no entran en la suma: HPE Aruba SSE (precio null — suscripción por usuario a cotizar)', 'texto-codigo'],
    ['Capacidad 1e+21 Mbps', 'exponente'],
    ['TOTAL DE REFERENCIA -$1,200.00', 'negativo'],
    ['Utilización NaN %', 'texto-codigo'],
    ['Modelo: undefined', 'texto-codigo'],
    ['Detalle: [object Object]', 'texto-codigo'],
  ];
  for (const [texto, clase] of casos) {
    assert.ok(clases(texto).includes(clase), `«${texto}» debía dar ${clase} y dio ${JSON.stringify(clases(texto))}`);
  }
});

test('lo que no es un error no se caza: fichas, fechas, modelos, rangos, hashes y la validación de Fortinet', () => {
  const limpios = [
    'IP69K conectado · -40 a 60 °C · AC/DC',
    'huella 3fba0e6c · lista de precios vigente',
    'AR5710-S8T2S — serie AR5710-S · 620 Mbps',
    'AR8140-T-12G10XG · FG-100F · EC-XS',
    'medida el 2026-09-24 sobre f6f1952',
    'De 10-20 Mbps por sede',
    'escala.usuarios: -5 fuera de [0, 100000000]',
    'Wi-Fi 6 · 4G/5G · PoE+',
    'Fuera de venta: nulo para diseños nuevos',
  ];
  for (const texto of limpios) assert.deepStrictEqual(clases(texto), [], `«${texto}» no debía cazarse`);
});

test('una cantidad del BOM es un entero mayor que cero, o va vacía', () => {
  for (const v of ['1', '12', '250', '', '—', null]) assert.ok(R.cantidadBomValida(v), `«${v}» es válida`);
  for (const v of ['0', '-5', '0.5', '1,5', 'NaN', 'abc', 'Infinity']) assert.ok(!R.cantidadBomValida(v), `«${v}» no es válida`);
});

test('la pestaña «Fuentes» queda fuera con su motivo, y la lista de materiales no', () => {
  assert.ok(R.pestanaFuera('Fuentes y Referencias'));
  assert.strictEqual(R.pestanaFuera('Lista de materiales'), null);
  assert.strictEqual(R.pestanaFuera('Dimensionar'), null);
});

test('toda excepción y toda pestaña fuera declara su motivo', () => {
  for (const x of R.PESTANAS_FUERA.concat(R.EXCEPCIONES)) {
    assert.ok(x.patron instanceof RegExp, 'cada una lleva su patrón');
    assert.ok(typeof x.porQue === 'string' && x.porQue.trim().length >= 20, `${x.patron}: el motivo tiene que decir algo`);
  }
});

test('depurar quita duplicados, aparta lo exceptuado y denuncia la excepción que ya no casa', () => {
  const h = (pagina, clase, fragmento, donde = 'x') => ({ pagina, clase, fragmento, donde });
  const crudos = [
    h('a.html', 'negativo', 'Requiere -13 Mbps', 'primero'),
    h('a.html', 'negativo', 'Requiere -13 Mbps', 'segundo'),
    h('a.html', 'texto-codigo', 'valor null aceptado'),
    h('b.html', 'negativo', 'Requiere -13 Mbps'),
  ];
  const excepciones = [
    { pagina: 'a.html', clase: 'texto-codigo', patron: /valor null aceptado/, porQue: 'sintético: se acepta en esta prueba' },
    { pagina: 'c.html', clase: 'negativo', patron: /nunca casa/, porQue: 'sintético: no casa con ningún hallazgo' },
  ];
  const r = R.depurar(crudos, excepciones);
  assert.strictEqual(r.exceptuados, 1);
  const vistos = r.hallazgos.map((x) => `${x.pagina}|${x.clase}|${x.donde}`);
  assert.deepStrictEqual(vistos, ['a.html|negativo|primero', 'b.html|negativo|x', 'c.html|excepcion-caducada|EXCEPCIONES']);
  // El duplicado no se pierde del todo: cuenta cuántos sitios dieron el mismo hallazgo.
  assert.strictEqual(r.hallazgos[0].veces, 2);
  assert.strictEqual(r.hallazgos[1].veces, 1);
});

test('sin excepciones declaradas no hay ninguna caducada', () => {
  const r = R.depurar([], []);
  assert.deepStrictEqual(r, { hallazgos: [], exceptuados: 0 });
});

test('el cuerpo del issue agrupa por página, nombra la clase y recorta las listas largas', () => {
  const hallazgos = [];
  for (let i = 0; i < 27; i++) hallazgos.push({ pagina: 'dimensionador-a.html', clase: 'negativo', donde: `#bw=-${i}`, fragmento: `Requiere -${i} Mbps` });
  hallazgos.push({ pagina: 'dimensionador-b.html', clase: 'excepcion', donde: 'enlace ?platSeg=ar', veces: 7, fragmento: "Cannot read properties of undefined (reading 'id') `x`" });
  const cuerpo = R.cuerpoIssue({ fecha: '2026-10-02', commit: 'abc1234', paginas: ['a', 'b'], acciones: 900, controles: 60, hallazgos }, 'https://ejemplo/corrida');
  assert.match(cuerpo, /encontró \*\*28 hallazgos\*\*/);
  assert.match(cuerpo, /### dimensionador-a\.html/);
  assert.match(cuerpo, /### dimensionador-b\.html/);
  assert.match(cuerpo, /\*\*Cantidad negativa con unidad\*\*/);
  assert.match(cuerpo, /…y 2 más/);
  assert.match(cuerpo, /`enlace \?platSeg=ar` \(y en 6 sitios más\) — `Cannot read/);
  assert.match(cuerpo, /Corrida: https:\/\/ejemplo\/corrida/);
  assert.ok(!/`x`/.test(cuerpo), 'las comillas invertidas del fragmento no rompen el Markdown');
  assert.match(cuerpo, /_Generado por \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/);
});

// Lo de abajo salió de la revisión diferencial del 2026-10-02: el resultado viaja de un job que
// ejecuta dependencias y un navegador a otro que tiene permiso para escribir issues.
const resultadoValido = (hallazgos) => ({
  fecha: '2026-10-02', commit: 'abc1234', duracionS: 290, paginas: ['dimensionador-a.html', 'dimensionador-b.html'],
  controles: 104, acciones: 1320, exceptuados: 0, pestanasFuera: [], hallazgos,
});
const sinCodigo = (texto) => texto.replace(/`[^`]*`/g, '');

test('el texto de la pantalla va en código en línea: no menciona a nadie, no enlaza issues ni abre Markdown', () => {
  assert.strictEqual(R.codigo('Corriente 1,0 A @100 V'), '`Corriente 1,0 A @100 V`');
  assert.strictEqual(R.codigo('a `b`\n\n c'), "`a 'b' c`", 'sin comillas invertidas y en una sola línea');
  assert.strictEqual(R.codigo(''), '`(vacío)`');
  assert.strictEqual(R.codigo('x'.repeat(500)).length, 302, 'recortado a 300 con la elipsis, más las dos comillas');
  const cuerpo = R.cuerpoIssue(resultadoValido([
    { pagina: 'dimensionador-a.html', clase: 'texto-codigo', donde: 'enlace ?x=@y', fragmento: 'Corriente 1,0 A @100 V · ver #1 **null**' },
  ]), 'https://ejemplo/corrida');
  const fuera = sinCodigo(cuerpo);
  assert.ok(!fuera.includes('@'), `ninguna @ fuera de un bloque de código: ${fuera}`);
  assert.ok(!/#1\b/.test(fuera) && !fuera.includes('**null**'), 'ni referencias a issues ni Markdown del fragmento');
});

test('el cuerpo del issue cabe siempre en lo que GitHub acepta, y dice dónde está el resto', () => {
  const hallazgos = [];
  for (let p = 0; p < 10; p++) {
    for (let i = 0; i < 25; i++) {
      hallazgos.push({ pagina: `dimensionador-p${p}.html`, clase: 'consola', donde: 'd'.repeat(200), fragmento: `${i} ` + 'e'.repeat(600) });
    }
  }
  const cuerpo = R.cuerpoIssue(resultadoValido(hallazgos), 'https://ejemplo/corrida');
  assert.ok(cuerpo.length <= R.MAX_CUERPO + 10 && cuerpo.length < 65536, `largo ${cuerpo.length}`);
  assert.match(cuerpo, /se cortó aquí para caber en un issue/);
  assert.match(cuerpo, /_Generado por \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/);
  // Lo que cabe no se recorta: un informe corto sale entero y sin el aviso.
  const corto = R.cuerpoIssue(resultadoValido(hallazgos.slice(0, 3)), 'https://ejemplo/corrida');
  assert.ok(!/se cortó aquí/.test(corto));
});

test('la forma del resultado se comprueba antes de escribir nada', () => {
  // Lo que producen `depurar` y el recorrido pasa, incluida una excepción caducada.
  const { hallazgos } = R.depurar([
    { pagina: 'dimensionador-a.html', clase: 'negativo', donde: '#bw="-5"', fragmento: 'Requiere -13 Mbps' },
  ], [{ clase: 'texto-codigo', patron: /nunca casa/, porQue: 'sintético: no casa con ningún hallazgo' }]);
  assert.strictEqual(hallazgos.length, 2);
  assert.strictEqual(R.validarResultado(resultadoValido(hallazgos)), null);
  assert.strictEqual(R.validarResultado({ ...resultadoValido([]), commit: null }), null, 'sin commit también vale');
  const malos = [
    [null, 'no es un objeto'],
    [{ ...resultadoValido([]), fecha: 'ayer' }, 'fecha'],
    [{ ...resultadoValido([]), commit: 'abc`; x' }, 'commit'],
    [{ ...resultadoValido([]), paginas: ['### intruso'] }, 'paginas'],
    [{ ...resultadoValido([]), acciones: -1 }, 'acciones'],
    [{ ...resultadoValido([]), hallazgos: 'ninguno' }, 'hallazgos'],
    [resultadoValido([{ pagina: '### intruso', clase: 'negativo', donde: 'x', fragmento: 'y' }]), 'página'],
    [resultadoValido([{ pagina: 'dimensionador-a.html', clase: 'inventada', donde: 'x', fragmento: 'y' }]), 'clase'],
    [resultadoValido([{ pagina: 'dimensionador-a.html', clase: 'negativo', donde: 'x' }]), 'fragmento'],
    [resultadoValido([{ pagina: 'dimensionador-a.html', clase: 'negativo', donde: 'x', fragmento: 'y', veces: 0 }]), 'veces'],
  ];
  for (const [r, motivo] of malos) {
    const dice = R.validarResultado(r);
    assert.ok(dice && dice.includes(motivo), `${JSON.stringify(r)} debía rechazarse por «${motivo}» y dio «${dice}»`);
  }
});

test('título y comentario de cierre', () => {
  assert.strictEqual(R.tituloIssue(resultadoValido([{}])), 'Recorrido de valores límite: 1 hallazgo');
  assert.strictEqual(R.tituloIssue(resultadoValido([{}, {}])), 'Recorrido de valores límite: 2 hallazgos');
  const c = R.comentarioLimpio(resultadoValido([]), 'https://ejemplo/corrida');
  assert.match(c, /^La corrida del 2026-10-02 \(`abc1234`\) no encontró hallazgos en 2 dimensionadores \(1320 acciones\): se cierra\./);
  assert.match(c, /Corrida: https:\/\/ejemplo\/corrida/);
  assert.match(c, /_Generado por \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/);
});
