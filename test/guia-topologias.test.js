'use strict';
// LA GUIA PINTA CADA ROL QUE RECOMIENDA, Y CADA NODO TIENE QUE RECOMENDAR (2026-10-02).
//
// La guia de diseno junta dos archivos que nadie cruzaba: `legacyData/guiaRoles.js` dice que
// equipos se recomiendan en cada rol, y las topologias de `public/js/guia-diseno-interactiva.js`
// dicen que nodo pinta cada rol (`eqRole`). Medido ese dia: el rol `internet_gw` llevaba cinco
// recomendaciones —Catalyst 8500, 7750 SR-1s, MX204, NE8000 F1A, CCR2116— que el servidor servia
// y ningun nodo pintaba, y `servidor-produccion.test.js` las protegia sin que nadie las viera. Es
// el mismo vicio que los textos de la guia que nadie veia: un dato que no se ve no se corrige.
//
// Se lee el archivo en vez de ejecutarlo, como hace `npm run catalogo` con las pantallas: el
// script es de navegador y pinta al cargar. Un `eqRole` que no se sepa leer no se salta: si la
// lectura no encuentra ninguno, la prueba falla.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const guia = require('../server/seed/legacyData/guiaRoles');
const fuente = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'guia-diseno-interactiva.js'), 'utf8');

function rolesDeNodos(texto) {
  const roles = new Set();
  for (const m of texto.matchAll(/eqRole\s*:\s*(?:'([^']*)'|"([^"]*)"|(null))/g)) {
    if (!m[3]) roles.add(m[1] !== undefined ? m[1] : m[2]);
  }
  return roles;
}

test('cada rol que la guia recomienda lo pinta algun nodo de las topologias', () => {
  const pintados = rolesDeNodos(fuente);
  assert.ok(pintados.size > 5, `solo se leyeron ${pintados.size} roles en las topologias: la lectura dejo de entender el archivo`);
  const sinNodo = Object.keys(guia).filter((rol) => !pintados.has(rol));
  assert.deepStrictEqual(sinNodo, [], 'rol con recomendaciones que ninguna topologia pinta: dale un nodo o quitalo de guiaRoles.js');
});

test('cada nodo con equipo tiene recomendaciones que pintar', () => {
  const sinRecomendacion = [...rolesDeNodos(fuente)].filter((rol) => !(guia[rol] && guia[rol].length));
  assert.deepStrictEqual(sinRecomendacion, [], 'nodo cuyo rol no tiene recomendaciones: el panel saldria vacio');
});

test('la lectura de los nodos distingue un rol, uno sin equipo y uno que no existe', () => {
  const roles = rolesDeNodos(`{id:'a', eqRole:'hub_router'}, {id:'b', eqRole:null}, {id:"c", eqRole: "core_router"}`);
  assert.deepStrictEqual([...roles].sort(), ['core_router', 'hub_router']);
});
