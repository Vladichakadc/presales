'use strict';
// Sincronizacion entre el dimensionamiento y el BOM (js/bom.js).
//
// POR QUE ESTA PRUEBA EXISTE. Cada dimensionador tenia su propia copia de `llevarABom`, y
// medido en el navegador el 2026-09-03 las copias no hacian lo mismo: Fortinet, MikroTik y
// Aruba seguian al dimensionamiento; Cisco y Huawei se quedaban cotizando el equipo anterior;
// Juniper solo repintaba su BOM al abrir la pestaña. Tres comportamientos para la misma
// pregunta, y el peor de ellos exportable.
//
// LA CAUSA ERA UNA SOLA LINEA: `llevarABom(id)` empezaba con `if(!id) return;`, asi que
// cuando el dimensionamiento se quedaba SIN CANDIDATO el BOM no se enteraba y seguia
// mostrando el ultimo equipo que si cumplia, sin decirlo. Medido en Cisco: a 20 Gbps no hay
// candidato y el BOM seguia cotizando un Catalyst 8200L de 1 Gbps.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cargar } = require('./ayuda/navegador.js');

const g = cargar('public/js/bom.js');
const { BOM } = g;

// Doble minimo de <select>: lo que `BOM.sincronizar` toca de verdad.
function selectFalso(valores, valorActual) {
  const oyentes = {};
  return {
    dataset: {},
    value: valorActual,
    options: valores.map((v) => ({ value: v })),
    addEventListener(ev, fn) { oyentes[ev] = fn; },
    disparar(ev) { if (oyentes[ev]) oyentes[ev](); },
  };
}
const conSelect = (sel, fn) => {
  const antes = g.document.getElementById;
  g.document.getElementById = () => sel;
  try { return fn(); } finally { g.document.getElementById = antes; }
};

test('se repinta aunque el modelo no cambie: el escenario manda mas que el id', () => {
  // El guard antiguo era `if(sel.value===id) return;` — y ahi el BOM dejaba de repintarse
  // aunque el escenario hubiera cambiado por completo. Todo lo que el BOM deriva del
  // escenario (el aviso de desvio, el de sin candidato, las cantidades) se quedaba viejo.
  const sel = selectFalso(['A', 'B'], 'A');
  let veces = 0;
  conSelect(sel, () => BOM.sincronizar({ elegido: 'A', render: () => { veces += 1; } }));
  assert.strictEqual(veces, 1, 'repinta aunque elegido === valor actual');
});

test('sin candidato tambien se avisa al BOM, que es el caso que se perdia', () => {
  const sel = selectFalso(['A', 'B'], 'A');
  let veces = 0;
  conSelect(sel, () => BOM.sincronizar({ elegido: null, render: () => { veces += 1; } }));
  assert.strictEqual(veces, 1, 'elegido null NO puede salir por la puerta de atras');
  assert.strictEqual(sel.value, 'A', 'y no borra lo que hubiera: el aviso explica el desvio');
});

test('lo heredado sigue al dimensionamiento; lo elegido a mano, no', () => {
  // Misma distincion que ficha.js hace con el equipo recomendado, y por el mismo motivo:
  // confundirlas convierte la seleccion en un trinquete.
  const sel = selectFalso(['A', 'B'], 'A');
  conSelect(sel, () => BOM.sincronizar({ elegido: 'B', render: () => {} }));
  assert.strictEqual(sel.value, 'B', 'sin eleccion manual, el BOM sigue al recomendado');

  sel.disparar('change'); // el usuario elige a mano en la pestaña de BOM
  conSelect(sel, () => BOM.sincronizar({ elegido: 'A', render: () => {} }));
  assert.strictEqual(sel.value, 'B', 'una eleccion manual no se pisa al mover un parametro');
});

test('no se apunta a un modelo que no esta en la lista', () => {
  // El desplegable del BOM se reconstruye en algunas paginas (Juniper cambia de catalogo al
  // cambiar de plataforma). Apuntar a un id inexistente dejaria el select en blanco.
  const sel = selectFalso(['A', 'B'], 'A');
  conSelect(sel, () => BOM.sincronizar({ elegido: 'NO-EXISTE', render: () => {} }));
  assert.strictEqual(sel.value, 'A');
});

test('sin select, se repinta igual: las paginas Nokia no tienen desplegable propio', () => {
  let veces = 0;
  const antes = g.document.getElementById;
  g.document.getElementById = () => null;
  try { BOM.sincronizar({ elegido: 'A', render: () => { veces += 1; } }); } finally { g.document.getElementById = antes; }
  assert.strictEqual(veces, 1);
});

test('el aviso distingue «no hay candidato» de «estas cotizando otra cosa»', () => {
  // Son dos desajustes distintos y conviene no confundirlos.
  const sinCand = BOM.avisoDesvio({ hayCandidato: false, elegido: 'A', enBom: 'A' });
  assert.match(sinCand, /ningún modelo cumple/);
  assert.match(sinCand, /no corresponde al dimensionamiento/);

  const desviado = BOM.avisoDesvio({ hayCandidato: true, elegido: 'A', enBom: 'B' });
  assert.match(desviado, /Estás cotizando el <b>B<\/b>/);
  assert.match(desviado, /tienes elegido el <b>A<\/b>/);
  assert.ok(!/ningún modelo cumple/.test(desviado));

  // Cuando coinciden no se dice nada: un aviso que sale siempre deja de leerse.
  assert.strictEqual(BOM.avisoDesvio({ hayCandidato: true, elegido: 'A', enBom: 'A' }), '');
  assert.strictEqual(BOM.avisoDesvio({}), '');
});

test('el aviso escapa el nombre del modelo', () => {
  const html = BOM.avisoDesvio({ hayCandidato: true, elegido: 'A', enBom: '<img src=x>' });
  assert.ok(!html.includes('<img'), 'el id del modelo va escapado');
  assert.match(html, /&lt;img/);
});

test('ningun dimensionador se guarda su propia copia de la regla', () => {
  // Lo que fallaba no era la regla sino que hubiera seis. Si alguien vuelve a escribir el
  // guard antiguo en una pagina, esta prueba lo dice.
  const dir = path.join(__dirname, '..', 'public', 'js');
  const paginas = fs.readdirSync(dir).filter((f) => f.startsWith('dimensionador-'));
  assert.ok(paginas.length >= 8, 'estan las ocho paginas');

  for (const f of paginas) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    // El guard que causaba el fallo, en cualquiera de sus dos formas de espaciado.
    assert.ok(!/if\s*\(\s*!\s*sel\s*\|\|\s*sel\.value\s*===\s*id\s*\)\s*return/.test(src),
      `${f} ya no decide por su cuenta si repintar el BOM`);
    // Y toda pagina con desplegable propio en el BOM usa la regla compartida.
    if (/getElementById\('pickModel'\)|\$\('pickModel'\)/.test(src)) {
      assert.ok(/BOM\.sincronizar\(/.test(src), `${f} usa BOM.sincronizar`);
    }
    // Toda pagina con BOM declara el desvio con las mismas palabras que las demas.
    if (/bomTabla/.test(src)) {
      assert.ok(/BOM\.avisoDesvio\(/.test(src), `${f} usa BOM.avisoDesvio`);
    }
  }
});
