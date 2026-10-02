'use strict';
/* REGLAS DEL RECORRIDO DE VALORES LÍMITE (2026-10-02).

   El 2026-10-01, con todas las baterías en verde, recorrer los nueve dimensionadores metiendo
   valores límite en cada control encontró seis errores que ninguna prueba veía: un caudal o
   unas sedes negativos que se dimensionaban («Requiere -13 Mbps», «-13000 Mbps»), «null» en
   una tabla y en una nota para el cliente, el formulario vacío de Nokia 7750 SR recomendando un
   equipo y una excepción al abrir un enlace con un modo en la URL. `e2e-entradas-limite.js`
   fija esos seis casos; este recorrido busca los que todavía no se conocen, en los campos y
   modos que se añadan después, y por eso vive aparte: es exploración repetible, no aserción.

   Aquí está todo lo que se puede probar sin navegador —qué cuenta como hallazgo, qué se
   exceptúa y por qué— para que `npm run verificar` lo guarde (`test/limites-reglas.test.js`).
   El recorrido en sí está en `recorrido-limites.js`. */

// Lo que recibe cada campo numérico. Cada valor salió de un error real o de su vecino:
// -5 dio los requerimientos negativos, 0 y '' el formulario que recomendaba sin datos,
// 0.5 las cantidades que no son enteras, 1e9 la notación exponencial y 'abc' el NaN.
const VALORES = ['-5', '0', '0.5', '1e9', '', 'abc'];

const CLASES = {
  excepcion: 'Excepción de JavaScript',
  consola: 'Error en la consola',
  peticion: 'Petición fallida al propio origen',
  'texto-codigo': 'Texto interno del código en pantalla',
  negativo: 'Cantidad negativa con unidad',
  exponente: 'Número en notación exponencial',
  'cantidad-bom': 'Cantidad del BOM que no es un entero positivo',
  'no-asienta': 'La página no queda quieta',
  'excepcion-caducada': 'Excepción declarada que ya no se usa',
};

// Una cifra negativa solo es un error si dice una magnitud: «-40 a 60 °C» es una ficha,
// «2026-09-24» una fecha y «AR5710-S8T2S» un modelo. El grupo de delante exige que el guion
// no venga pegado a una letra, un número, otro guion, una barra, un punto, dos puntos o un
// grado, que es lo que distingue un signo menos de un guion.
const UNIDADES = ['Kbps', 'Mbps', 'Gbps', 'Tbps', 'Mpps', 'usuarios', 'sedes', 'sesiones', 'equipos',
  'unidades', 'túneles', 'servidores', 'leafs', 'spines', 'puertos', 'APs', 'W', '%'];
const PATRONES = {
  'texto-codigo': /\b(?:null|undefined|NaN|Infinity)\b|\[object Object\]/g,
  negativo: new RegExp(`(?<![\\w\\-/.:°])-\\d[\\d.,]*\\s?(?:${UNIDADES.join('|')})(?![\\wáéíóú])|-\\$\\s?\\d|\\$\\s?-\\d`, 'g'),
  // JavaScript escribe así los números enormes («1e+21»): con signo tras la «e». Un hash
  // («huella 3fba0e6c») no lo lleva, y por eso no hace falta exceptuarlo.
  exponente: /\d(?:\.\d+)?e[+-]\d+/g,
};

// Las pestañas que no se recorren, cada una con su motivo. Una pestaña fuera del recorrido es
// una excepción como las de abajo y se declara igual.
const PESTANAS_FUERA = [
  { patron: /fuentes/i, porQue: 'Las notas de procedencia citan los campos del catálogo tal como están (`sdwan: null`, «49 en null»): ahí «null» es una cita deliberada, no un hueco de la pantalla.' },
];

// Hallazgos que se aceptan, cada uno con su motivo. Hoy no hay ninguno: el primer recorrido
// sobre `main` encontró un error real («Puertos undefined × undefinedGE» en 17 FortiGate) y se
// corrigió en vez de exceptuarse. Una excepción que en una corrida no casa con nada se reporta
// como hallazgo propio (`excepcion-caducada`), para que no se quede tapando el error de mañana.
//   { pagina: 'dimensionador-x.html', clase: 'negativo', patron: /…/, porQue: '…' }
const EXCEPCIONES = [];

function fragmento(texto, i, largo) {
  return texto.slice(Math.max(0, i - 60), i + largo + 30).replace(/\s+/g, ' ').trim();
}

// Todo lo sospechoso de un texto visible, con su contexto: el fragmento es lo que se enseña
// en el informe y contra lo que casa una excepción.
function hallazgosDeTexto(texto) {
  const out = [];
  for (const [clase, re] of Object.entries(PATRONES)) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(texto))) out.push({ clase, fragmento: fragmento(texto, m.index, m[0].length) });
  }
  return out;
}

// Una cantidad del BOM es un entero mayor que cero, o está vacía («—» o nada) cuando la línea
// no la lleva. 0,5 equipos, -5 licencias o «NaN» no se cotizan.
function cantidadBomValida(valor) {
  const v = String(valor == null ? '' : valor).trim();
  if (v === '' || v === '—') return true;
  return /^\d+$/.test(v) && Number(v) >= 1;
}

function pestanaFuera(nombre) {
  return PESTANAS_FUERA.find((p) => p.patron.test(nombre)) || null;
}

const clave = (h) => `${h.pagina}|${h.clase}|${h.fragmento}`;

// Quita duplicados (el mismo texto visto desde diez controles es un solo hallazgo, con el
// primer sitio donde salió y `veces`, cuántos sitios lo dieron) y aparta lo exceptuado.
// Devuelve también las excepciones que no casaron con nada en esta corrida: las caducadas.
function depurar(hallazgos, excepciones = EXCEPCIONES) {
  const vistos = new Map();
  for (const h of hallazgos) {
    const k = clave(h);
    if (vistos.has(k)) vistos.get(k).veces += 1;
    else vistos.set(k, { ...h, veces: 1 });
  }
  const usadas = new Set();
  const quedan = [];
  for (const h of vistos.values()) {
    const ex = excepciones.findIndex((e) => (!e.pagina || e.pagina === h.pagina)
      && (!e.clase || e.clase === h.clase) && e.patron.test(h.fragmento));
    if (ex >= 0) usadas.add(ex);
    else quedan.push(h);
  }
  const caducadas = excepciones.map((e, i) => ({ e, i })).filter(({ i }) => !usadas.has(i))
    .map(({ e }) => ({ pagina: e.pagina || '(todas)', clase: 'excepcion-caducada', donde: 'EXCEPCIONES',
      fragmento: `${e.clase || 'cualquier clase'} · ${e.patron} — ya no casa con ningún hallazgo: hay que retirarla o corregir su patrón` }));
  return { hallazgos: quedan.concat(caducadas), exceptuados: vistos.size - quedan.length };
}

// «y en N sitios más»: la misma excepción en siete enlaces es un hallazgo, pero no da igual
// que salga en uno o en siete.
const veces = (h) => (h.veces > 1 ? ` (y en ${h.veces - 1} sitio${h.veces - 1 === 1 ? '' : 's'} más)` : '');

/* LO QUE VA AL ISSUE (revisión diferencial del 2026-10-02). El resultado viaja de un job a
   otro: el que recorre ejecuta dependencias de npm y un navegador, y el que escribe el issue
   tiene el permiso. Por eso aquí se trata como DATO y no como algo de fiar:
     - `validarResultado` comprueba su forma antes de usarlo;
     - todo texto que sale de la pantalla va en código en línea (`codigo`): la ficha de
       Fortinet dice «1,0 A @100 V», y fuera de un bloque de código ese «@100» mencionaría a
       una persona real de GitHub; un «#1» enlazaría un issue y un «**» abriría negrita;
     - y el cuerpo se corta antes de los 65.536 caracteres que GitHub acepta, porque un issue
       que no se puede crear es un aviso perdido con la corrida en rojo. */
const MAX_CUERPO = 60000;
const PIE = ['---', '_Generado por [Claude Code](https://claude.ai/code)_'];

function codigo(texto, max = 300) {
  let t = String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim().replace(/`/g, "'");
  if (t.length > max) t = t.slice(0, max - 1) + '…';
  return '`' + (t || '(vacío)') + '`';
}

// Devuelve null si el resultado tiene la forma que escribe `recorrido-limites.js`, o qué falla.
function validarResultado(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'no es un objeto';
  if (typeof r.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)) return 'fecha';
  if (r.commit != null && (typeof r.commit !== 'string' || !/^[0-9a-f]{7,40}$/.test(r.commit))) return 'commit';
  if (!Array.isArray(r.paginas) || !r.paginas.every((x) => typeof x === 'string' && /^dimensionador-[\w-]+\.html$/.test(x))) return 'paginas';
  for (const k of ['controles', 'acciones', 'exceptuados']) {
    if (!Number.isInteger(r[k]) || r[k] < 0) return k;
  }
  if (!Array.isArray(r.hallazgos)) return 'hallazgos';
  for (const h of r.hallazgos) {
    if (!h || typeof h !== 'object') return 'un hallazgo no es un objeto';
    for (const k of ['pagina', 'clase', 'donde', 'fragmento']) {
      if (typeof h[k] !== 'string') return `un hallazgo sin ${k}`;
    }
    if (!/^dimensionador-[\w-]+\.html$/.test(h.pagina) && h.pagina !== '(todas)') return `página «${h.pagina}»`;
    if (!Object.prototype.hasOwnProperty.call(CLASES, h.clase)) return `clase «${h.clase}»`;
    if (h.veces != null && !(Number.isInteger(h.veces) && h.veces >= 1)) return 'veces';
  }
  return null;
}

function tituloIssue(resultado) {
  const n = resultado.hallazgos.length;
  return `Recorrido de valores límite: ${n} hallazgo${n === 1 ? '' : 's'}`;
}

// El cuerpo del issue semanal. Vive aquí y no en el YAML para que se pruebe con el resto.
function cuerpoIssue(resultado, enlace) {
  const cab = [];
  const n = resultado.hallazgos.length;
  cab.push(`El recorrido de valores límite del ${resultado.fecha} (\`${resultado.commit || 'sin commit'}\`) encontró **${n} hallazgo${n === 1 ? '' : 's'}**`
    + ` en ${resultado.paginas.length} dimensionadores, tras ${resultado.acciones} acciones sobre ${resultado.controles} controles.`);
  if (enlace) cab.push('', `Corrida: ${enlace}`);
  cab.push('', 'Cada línea es algo que la pantalla no debería mostrar o hacer con ese valor. Se corrige el código y se fija con un caso en `test/e2e/e2e-entradas-limite.js`;'
    + ' solo si es correcto se declara en `EXCEPCIONES` de `test/e2e/limites-reglas.js`, con su motivo.', '');
  const porPagina = new Map();
  for (const h of resultado.hallazgos) {
    if (!porPagina.has(h.pagina)) porPagina.set(h.pagina, []);
    porPagina.get(h.pagina).push(h);
  }
  const lista = [];
  for (const [pagina, hs] of porPagina) {
    lista.push(`### ${pagina}`, '');
    for (const h of hs.slice(0, 25)) {
      lista.push(`- **${CLASES[h.clase] || h.clase}** · ${codigo(h.donde, 120)}${veces(h)} — ${codigo(h.fragmento)}`);
    }
    if (hs.length > 25) lista.push(`- …y ${hs.length - 25} más (están todos en el artefacto de la corrida).`);
    lista.push('');
  }
  const aviso = '_El informe se cortó aquí para caber en un issue: la lista entera está en el artefacto `limites` de la corrida._';
  const largo = (l) => cab.concat(l, PIE).join('\n').length;
  if (largo(lista) > MAX_CUERPO) {
    while (lista.length && largo(lista.concat(aviso)) > MAX_CUERPO) lista.pop();
    lista.push('', aviso, '');
  }
  return cab.concat(lista, PIE).join('\n');
}

// El comentario con el que se cierra el issue abierto cuando una corrida sale limpia.
function comentarioLimpio(resultado, enlace) {
  return [`La corrida del ${resultado.fecha} (\`${resultado.commit || 'sin commit'}\`) no encontró hallazgos en`
    + ` ${resultado.paginas.length} dimensionadores (${resultado.acciones} acciones): se cierra.`, '', `Corrida: ${enlace}`, '']
    .concat(PIE).join('\n');
}

module.exports = {
  VALORES, CLASES, PATRONES, UNIDADES, PESTANAS_FUERA, EXCEPCIONES, MAX_CUERPO,
  hallazgosDeTexto, cantidadBomValida, pestanaFuera, depurar, veces,
  codigo, validarResultado, tituloIssue, cuerpoIssue, comentarioLimpio,
};
