#!/usr/bin/env node
'use strict';
// Aplica al catalogo una propuesta de la sincronizacion con IA, con anclaje.
//
// POR QUE EXISTE
// El boton "Sincronizar" analizaba el catalogo y escribia sus conclusiones en la base SQLite
// LOCAL. Pero la base no es la fuente de verdad: produccion la resiembra desde
// server/seed/legacyData/ en cada despliegue, asi que lo aprobado habia que volver a
// teclearlo a mano en esos archivos. Dos sitios con el mismo dato y un paso manual entre
// ellos es exactamente donde un catalogo se desincroniza de si mismo.
//
// Este script cierra ese hueco por el lado correcto: la IA PROPONE, el importador APLICA
// sobre legacyData, y lo que queda para revisar es un diff de git — que es donde este
// catalogo ya cazo una vez un modelo inexistente que llevaba tiempo dentro.
//
//     npm run propuesta -- propuesta.json            enseña que haria, sin escribir
//     npm run propuesta -- propuesta.json --aplicar  escribe
//
// EL ANCLAJE, Y POR QUE ES DISTINTO AL DE `npm run juniper`
// Alli el riesgo es la fila desplazada al copiar una tabla, y el anclaje es que dos columnas
// de la fila casen con lo ya verificado. Aqui el riesgo es otro: que la propuesta este
// obsoleta o inventada. El anclaje que lo caza es el propio `oldValue` de la propuesta —
// **si la IA dice que el catalogo hoy vale X y el catalogo no vale X, no hay que creerle
// nada mas de esa entrada**. Una cifra suelta siempre parece plausible; una que ademas
// acierta el valor que va a sustituir, mucho menos.
//
// ALTAS: SE REPORTAN, NO SE APLICAN
// Un `type: NEW` nunca se escribe solo. Dar de alta un modelo es justo donde entra un
// producto inventado con specs verosimiles — el fallo que este repositorio ya sufrio con un
// "FortiGate 2000F" —, y eso merece que una persona lo mire y lo escriba. El script los
// lista con su fuente para que se revisen a mano.

const fs = require('fs');
const path = require('path');

const ARCHIVOS = {
  huawei: 'huawei.js', cisco: 'cisco.js', fortinet: 'fortinet.js',
  mikrotik: 'mikrotik.js', aruba: 'aruba.js', juniper: 'juniper.js', nokia: 'nokia.js',
};
const DIR = path.join(__dirname, '..', 'server', 'seed', 'legacyData');

const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const entrada = args.find((a) => !a.startsWith('--'));

// Convierte un valor en el literal JS que se escribe en el archivo de catalogo. Los numeros
// van tal cual; el resto entre comillas simples CON ESCAPADO COMPLETO. El orden importa: la
// barra invertida se escapa PRIMERO, si no, escapar la comilla mete una barra que el paso de
// la barra volveria a duplicar mal. Sin esto, un newValue acabado en `\` (o con un salto de
// linea, o una comilla) rompia el archivo entero y el servidor no arrancaba — y el newValue
// puede venir de un datasheet subido por quien sea, asi que no es una cadena de confianza.
function literalJs(valor) {
  if (typeof valor === 'number') return String(valor);
  const escapado = String(valor)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${escapado}'`;
}

// Mismo mecanismo de escritura que importar-juniper.js: se edita el texto del archivo en el
// sitio, para que el diff sea de una linea y no una reescritura del catalogo entero.
function escribirCampo(texto, id, campo, valor) {
  const inicio = texto.indexOf(`{id:'${id}',`);
  if (inicio < 0) return null;
  const siguiente = texto.indexOf("{id:'", inicio + 1);
  const cierre = texto.indexOf('\n];', inicio);
  const fin = Math.min(...[siguiente, cierre].filter((n) => n > 0));
  const bloque = texto.slice(inicio, fin);
  const re = new RegExp(`((?<![A-Za-z])${campo}:)(null|'[^']*'|[\\d.]+)`);
  if (!re.test(bloque)) return null;
  return texto.slice(0, inicio) + bloque.replace(re, `$1${literalJs(valor)}`) + texto.slice(fin);
}

// Comparacion por valor, no por formato: "20" y "20 Gbps" y 20 son el mismo dato escrito de
// tres formas, y rechazar por la forma seria rechazar propuestas correctas.
function mismoValor(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  const norm = (v) => String(v).toLowerCase().replace(/[\s,]/g, '').replace(/gbps|mbps|\$|~/g, '');
  if (norm(a) === norm(b)) return true;
  const na = Number(norm(a));
  const nb = Number(norm(b));
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}

function cargarModelos(vendor) {
  try {
    const mod = require(path.join(DIR, ARCHIVOS[vendor]));
    return Array.isArray(mod.MODELS) ? mod.MODELS : [];
  } catch {
    return [];
  }
}

// Decide si una propuesta se puede creer. Devuelve {ok} o {ok:false, motivo}.
function anclar(cambio, modelos) {
  if (cambio.type === 'NEW') {
    return { ok: false, motivo: 'alta de registro: se reporta para revisar a mano, nunca se aplica sola' };
  }
  if (cambio.target !== 'product') {
    return { ok: false, motivo: `target "${cambio.target}" todavía no lo aplica este importador` };
  }
  const modelo = modelos.find((m) => m.id === cambio.id);
  if (!modelo) return { ok: false, motivo: `el modelo "${cambio.id}" no está en el catálogo` };
  // LOS TRES NOMBRES DEL PRECIO, y no por gusto. `price` es como lo llama la IA; `elp`/`elpN`
  // es como se llama de verdad en este catalogo, y es lo que emite la ventana de contraste
  // desde que lee listas de precios. Hasta el 2026-09-09 esta guarda solo miraba `price`: un
  // cambio de `elp` se rechazaba igual, pero por accidente —porque `elp` no esta en los MODELS
  // de legacyData, sino que se rellena desde cotizadorCatalog— y con el motivo equivocado. Una
  // proteccion que funciona por un efecto lateral deja de funcionar el dia que ese efecto
  // cambia, en silencio: el mismo modo de fallo que el conjunto inerte CISCO_EOL_MODELS.
  if (['price', 'elp', 'elpN'].includes(cambio.field)) {
    return { ok: false, motivo: 'los precios viven en cotizadorCatalog.js, no en este archivo' };
  }
  if (!(cambio.field in modelo)) {
    return { ok: false, motivo: `el campo "${cambio.field}" no existe en ese modelo` };
  }

  // EL ANCLAJE. Si la propuesta se equivoca sobre lo que el catalogo dice HOY, no hay razon
  // para creerle lo que dice que deberia decir.
  const actual = modelo[cambio.field];
  if (actual === null || actual === undefined) {
    if (cambio.oldValue && !/^(n\/a|null|—|-)$/i.test(String(cambio.oldValue).trim())) {
      return { ok: false, motivo: `el catálogo tiene ese campo vacío, la propuesta dice que vale "${cambio.oldValue}"` };
    }
  } else if (!mismoValor(actual, cambio.oldValue)) {
    return { ok: false, motivo: `desanclada: el catálogo dice "${actual}" y la propuesta dice que dice "${cambio.oldValue}"` };
  }

  if (mismoValor(actual, cambio.newValue)) {
    return { ok: false, motivo: 'sin cambio real: el valor propuesto ya es el que tiene' };
  }
  if (!/^https?:\/\//i.test(cambio.sourceUrl || '')) {
    return { ok: false, motivo: 'sin URL de fuente oficial' };
  }
  return { ok: true, modelo };
}

function aplicar(archivo) {
  const propuesta = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const cambios = Array.isArray(propuesta) ? propuesta : propuesta.cambios;
  const vendor = String(propuesta.vendor || args.find((a) => a.startsWith('--vendor='))?.split('=')[1] || '').toLowerCase();

  if (!Array.isArray(cambios)) {
    console.error('El archivo no trae una lista de cambios (ni array ni {cambios:[...]}).');
    process.exit(1);
  }
  if (!ARCHIVOS[vendor]) {
    console.error(`Falta el fabricante. Ponlo en el JSON como {"vendor":"fortinet",...} o pasa --vendor=fortinet.\nConocidos: ${Object.keys(ARCHIVOS).join(', ')}`);
    process.exit(1);
  }

  const modelos = cargarModelos(vendor);
  const ruta = path.join(DIR, ARCHIVOS[vendor]);
  let texto = fs.readFileSync(ruta, 'utf8');

  const aceptados = [];
  const apartados = [];
  for (const c of cambios) {
    const veredicto = anclar(c, modelos);
    if (!veredicto.ok) { apartados.push({ c, motivo: veredicto.motivo }); continue; }
    const nuevo = escribirCampo(texto, c.id, c.field, c.newValue);
    if (nuevo === null) {
      apartados.push({ c, motivo: `no se pudo localizar ${c.field} en el bloque de ${c.id}` });
      continue;
    }
    texto = nuevo;
    aceptados.push(c);
  }

  console.log(`\nPropuesta para ${vendor}: ${cambios.length} cambio(s).\n`);
  if (aceptados.length) {
    console.log('== SE APLICAN ==');
    for (const c of aceptados) {
      console.log(`  ${c.id} · ${c.field}: ${c.oldValue} -> ${c.newValue}`);
      console.log(`     ${c.reason}`);
      console.log(`     ${c.sourceUrl}`);
    }
  }
  if (apartados.length) {
    console.log('\n== SE APARTAN ==');
    for (const a of apartados) {
      console.log(`  ${a.c.id} · ${a.c.field || 'N/A'} — ${a.motivo}`);
    }
  }

  if (!APLICAR) {
    console.log(`\nSimulacro. ${aceptados.length} se aplicarían y ${apartados.length} no. Repite con --aplicar para escribir.\n`);
    return;
  }
  if (!aceptados.length) {
    console.log('\nNada que escribir.\n');
    return;
  }
  fs.writeFileSync(ruta, texto);
  console.log(`\nEscrito ${ARCHIVOS[vendor]}: ${aceptados.length} campo(s). Revisa el diff antes de commitear, y pasa \`npm run verificar\`.\n`);
}

if (require.main === module) {
  if (!entrada) {
    console.log(`Uso:  npm run propuesta -- propuesta.json [--aplicar] [--vendor=fortinet]

La propuesta es lo que devuelve /api/sync/analyze: un array de cambios, o un objeto
{"vendor":"fortinet","cambios":[...]}.

Se aplica solo lo que ancla: un UPDATE cuyo oldValue coincide de verdad con lo que el
catálogo tiene hoy, sobre un modelo que existe, con una URL de fuente oficial. Las altas se
reportan pero nunca se escriben solas.`);
    process.exit(entrada ? 0 : 1);
  }
  aplicar(entrada);
}

module.exports = { anclar, mismoValor, escribirCampo, literalJs };
