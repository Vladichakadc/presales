'use strict';
/* LO QUE HACE EL JOB QUE PUBLICA LA VIGIA (2026-10-02).

   `vigia-fuentes.yml` corre en dos jobs. `medir` pide los documentos a los fabricantes y no
   tiene permiso de escritura; `publicar` si lo tiene (empujar la rama del lock y escribir el
   issue) y no ejecuta nada que venga de fuera. Este archivo es todo lo que `publicar` ejecuta
   del repositorio, y solo usa modulos de Node y datos del propio repositorio: el job no
   instala dependencias, asi que un `require` de un paquete aqui lo dejaria en rojo (lo vigila
   `test/vigia-publicar.test.js`).

   EL RESULTADO DE `medir` SE TRATA COMO DATO, NO COMO ALGO DE FIAR. Antes de copiar el lock
   al repositorio se comprueba contra el de `main` que la corrida solo hizo lo que la vigia
   puede hacer sola, que es justo el tercer estado del lock:
     - el lock solo crece: ninguna entrada desaparece, y no aparece ninguna de una fuente que
       `FUENTES` no declare;
     - en una fuente estable, `hashVerificado` no se mueve: lo mueve una persona con
       `npm run vigia -- --revisado`, nunca la corrida semanal. Sin esta regla, una corrida
       manipulada podria dar por verificado un documento que cambio y apagar la alarma, que es
       el defecto mas caro que este repositorio ha tenido;
     - `pendienteDesde` no se reinicia mientras siga pendiente;
     - una fuente que ya no esta en `FUENTES` no se toca.
   Las dos excepciones son las que `aplicarAlLock` ya tiene: una pagina dinamica
   (`estable: false`) avanza su hash, y un cambio de clase (bytes a texto) abre una linea base
   nueva. Lo que no pasa estas reglas deja el job en rojo y no escribe nada.

   Del informe (`vigia.json`) solo se usa lo que se puede comprobar: cada fuente que cita tiene
   que estar en `FUENTES`, y el fabricante, el documento y la URL se toman de `FUENTES`, no del
   informe. El detalle de un error de red va en codigo en linea y recortado. */
const fs = require('fs');
const path = require('path');
const { FUENTES } = require('../server/seed/legacyData/fuentes');
const { normalizarEntrada, claveDe, LOCK } = require('./vigia-fuentes');

const HEX64 = /^[0-9a-f]{64}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
const CAMPOS_ENTRADA = new Set(['documento', 'hashVerificado', 'hash', 'clase', 'bytes', 'medido', 'visto', 'pendienteDesde']);
const RAMA = 'vigia/fuentes';

// Las fuentes vigilables, por la misma clave que usa el lock.
function fuentesPorClave(fuentes = FUENTES) {
  const m = new Map();
  for (const [vendor, lista] of Object.entries(fuentes)) {
    for (const f of lista) {
      if (f.url) m.set(claveDe(vendor, f), { vendor, documento: f.documento, url: f.url, estable: f.estable !== false });
    }
  }
  return m;
}

const esEntero = (x) => Number.isInteger(x) && x >= 0;
const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function entradaMal(e) {
  if (!esObjeto(e)) return 'no es un objeto';
  for (const k of Object.keys(e)) if (!CAMPOS_ENTRADA.has(k)) return `campo desconocido «${k}»`;
  if (typeof e.documento !== 'string' || e.documento.length > 300) return 'documento';
  const n = normalizarEntrada(e);
  if (!HEX64.test(n.hashVerificado || '')) return 'hashVerificado';
  if (e.clase != null && e.clase !== 'bytes' && e.clase !== 'texto') return 'clase';
  if (e.bytes != null && !esEntero(e.bytes)) return 'bytes';
  if (e.medido != null && !ISO.test(e.medido)) return 'medido';
  if (e.visto != null) {
    if (!esObjeto(e.visto) || Object.keys(e.visto).some((k) => !['hash', 'bytes', 'medido'].includes(k))
      || !HEX64.test(e.visto.hash || '') || !esEntero(e.visto.bytes) || !ISO.test(e.visto.medido || '')) return 'visto';
  }
  if (e.pendienteDesde != null && !ISO.test(e.pendienteDesde)) return 'pendienteDesde';
  return null;
}

// null si el lock nuevo es algo que la corrida semanal pudo producir a partir del viejo, o qué
// lo impide.
function validarLock(viejo, nuevo, fuentes = fuentesPorClave()) {
  if (!esObjeto(nuevo) || !esObjeto(nuevo.documentos)) return 'el lock nuevo no tiene `documentos`';
  if (nuevo.revisado != null && !ISO.test(nuevo.revisado)) return 'revisado';
  const antes = (viejo && viejo.documentos) || {};
  for (const clave of Object.keys(antes)) {
    if (!(clave in nuevo.documentos)) return `desapareció la entrada «${clave}»`;
  }
  for (const [clave, e] of Object.entries(nuevo.documentos)) {
    const mal = entradaMal(e);
    if (mal) return `«${clave}»: ${mal}`;
    const f = fuentes.get(clave);
    if (!(clave in antes)) {
      if (!f) return `entrada nueva de una fuente que FUENTES no declara: «${clave}»`;
      if (e.documento !== f.documento) return `«${clave}»: el documento no es el que declara FUENTES`;
      if (e.visto || e.pendienteDesde) return `«${clave}»: una primera medición no puede quedar pendiente`;
      continue;
    }
    if (!f) {
      if (!igual(e, antes[clave])) return `«${clave}» ya no está en FUENTES y la corrida la cambió`;
      continue;
    }
    const v = normalizarEntrada(antes[clave]);
    // La corrida escribe el nombre que hay hoy en FUENTES, o deja el que ya había.
    if (e.documento !== f.documento && e.documento !== v.documento) return `«${clave}»: el documento no es el que declara FUENTES`;
    // EL UNICO CAMBIO DE CLASE QUE LA CORRIDA HACE SOLA es la migracion de las entradas de antes
    // del 2026-09-14, que no llevan `clase` y se leian en bytes, a vigilar el texto. Cualquier
    // otro abriria una linea base nueva con un hash cualquiera, y por ahi una corrida
    // manipulada podria apagar una alarma pendiente: se rechaza y lo mira una persona.
    const claseAntes = antes[clave].clase;
    const claseAhora = e.clase || 'bytes';
    if (claseAntes != null && claseAntes !== claseAhora) return `«${clave}»: cambio de clase ${claseAntes} → ${claseAhora}; eso lo decide una persona`;
    if (claseAntes == null && claseAhora !== 'bytes' && claseAhora !== 'texto') return `«${clave}»: clase`;
    const mismaClase = (claseAntes || 'bytes') === claseAhora;
    if (f.estable && mismaClase) {
      if (normalizarEntrada(e).hashVerificado !== v.hashVerificado) {
        return `«${clave}»: la corrida movió hashVerificado de una fuente estable; eso solo lo hace una persona con --revisado`;
      }
      if (v.pendienteDesde && e.visto && e.pendienteDesde !== v.pendienteDesde) {
        return `«${clave}»: la corrida reinició pendienteDesde`;
      }
    }
  }
  return null;
}

// El informe para el issue, reconstruido con lo que se puede comprobar. Devuelve
// {error} o {informe}.
function informeDe(d, fuentes = fuentesPorClave()) {
  if (!esObjeto(d)) return { error: 'vigia.json no es un objeto' };
  for (const k of ['cambiados', 'inalcanzables']) {
    if (!Array.isArray(d[k])) return { error: `vigia.json sin la lista ${k}` };
  }
  const fuente = (r) => (esObjeto(r) && typeof r.vendor === 'string' && typeof r.url === 'string'
    ? fuentes.get(`${r.vendor}::${r.url}`) : null);
  const cambiados = [];
  for (const r of d.cambiados) {
    const f = fuente(r);
    if (!f) return { error: 'un cambio cita una fuente que FUENTES no declara' };
    const ahora = r.hashVigilado || r.hash;
    if (!HEX64.test(ahora || '') || (r.hashPrevio != null && !HEX64.test(r.hashPrevio)) || !esEntero(r.bytes)) {
      return { error: `el cambio de «${f.documento}» no trae hashes o bytes válidos` };
    }
    if (r.medidoAntes != null && !ISO.test(r.medidoAntes)) return { error: `medidoAntes de «${f.documento}»` };
    cambiados.push({ ...f, antes: (r.hashPrevio || '').slice(0, 16), medidoAntes: r.medidoAntes || null, ahora: ahora.slice(0, 16), bytes: r.bytes });
  }
  const inalcanzables = [];
  for (const r of d.inalcanzables) {
    const f = fuente(r);
    if (!f) return { error: 'una fuente inalcanzable no está en FUENTES' };
    const detalle = String(r.detalle == null ? '' : r.detalle).replace(/\s+/g, ' ').replace(/`/g, "'").trim().slice(0, 200) || 'sin detalle';
    inalcanzables.push({ ...f, detalle });
  }
  return { informe: { cambiados, inalcanzables } };
}

function tituloIssue(inf) {
  if (inf.cambiados.length) return `Fuentes del catálogo: ${inf.cambiados.length} cambiaron`;
  if (inf.inalcanzables.length) return `Fuentes del catálogo: ${inf.inalcanzables.length} no se pudieron leer`;
  return 'Vigía de fuentes: no se pudo guardar lo medido';
}

// Si hay que escribir en el issue. Además de un cambio o una fuente sin leer, un push que falló:
// una corrida en rojo que no deja rastro donde se mira es como la vigía pasó tres semanas sin
// avisar (2026-09-21 y 2026-09-28).
const hayQueAvisar = (inf, lock) => inf.cambiados.length > 0 || inf.inalcanzables.length > 0 || (lock && lock.estado === 'fallida');

// Cuando la corrida no llega a publicarse: la medición no terminó, no se pudo bajar o no pasó la
// validación. El motivo puede citar una clave del artefacto, así que va en código en línea.
const TITULO_FALLO = 'Vigía de fuentes: la corrida no se publicó';
function cuerpoFallo(motivo, corrida) {
  const m = String(motivo == null ? '' : motivo).replace(/\s+/g, ' ').replace(/`/g, "'").trim().slice(0, 300) || 'sin detalle';
  return ['## La corrida de la vigía no se publicó', '',
    `Motivo: \`${m}\``, '',
    'No se copió nada al repositorio ni se empujó la rama. Si el motivo es la validación, lo medido',
    'no respeta lo que la vigía puede hacer sola (el lock solo crece y un hash verificado no se mueve',
    'sin `--revisado`): hay que mirarlo antes de volver a lanzarla.', '',
    `Corrida: ${corrida}`, '',
    '---', '_Generado por [Claude Code](https://claude.ai/code)_'].join('\n');
}

// `lock` dice qué pasó con la medición de esta semana: {estado, enlace}. `estado` es el que
// deja el paso de la rama (empujada, sin-cambios, retenida o fallida) y `enlace`, el PR
// abierto o el enlace para abrirlo.
function cuerpoIssue(inf, lock) {
  const l = [];
  if (inf.cambiados.length) {
    l.push('## Fuentes que cambiaron', '');
    l.push('El documento oficial ya no es el mismo que se usó para verificar el catálogo.');
    l.push('Abrirlo, leerlo y aplicar el dato con el importador que corresponda');
    l.push('(`npm run cps`, `npm run juniper`, `npm run huawei`), que contrasta antes de escribir.', '');
    for (const r of inf.cambiados) {
      l.push(`- **${r.vendor}** — ${r.documento}`);
      l.push(`  - ${r.url}`);
      l.push(`  - medido antes: \`${r.antes}\` el ${r.medidoAntes || 'desconocido'}`);
      l.push(`  - ahora: \`${r.ahora}\` (${r.bytes} bytes)`);
    }
    l.push('');
  }
  if (inf.inalcanzables.length) {
    l.push('## Fuentes que no se pudieron leer', '');
    l.push('Esto **no** es «sin cambios»: es que no se pudo comprobar. Un 403 es política de');
    l.push('egreso y se reporta, no se rodea; en ese caso el pendiente vuelve a la ruta A de');
    l.push('`IMPORTAR-CATALOGO.md`, correrlo desde una máquina propia.', '');
    for (const r of inf.inalcanzables) {
      l.push(`- **${r.vendor}** — ${r.documento}: \`${r.detalle}\``);
      l.push(`  - ${r.url}`);
    }
    l.push('');
  }
  if (lock && lock.estado === 'empujada') {
    l.push('## El lock de esta corrida', '');
    l.push(`Lo medido está en la rama \`${RAMA}\`. Para que el vigía lo recuerde la semana que viene hay que fusionarlo: ${lock.enlace}`);
    l.push('');
  } else if (lock && lock.estado === 'retenida') {
    l.push('## El lock de esta corrida', '');
    l.push(`La rama \`${RAMA}\` tiene encima un commit que no es del vigía y no se pisó: lo medido esta semana está solo en el artefacto de la corrida.`);
    l.push('');
  } else if (lock && lock.estado === 'fallida') {
    l.push('## El lock de esta corrida', '');
    l.push(`No se pudo empujar la rama \`${RAMA}\` (el motivo está en la corrida): lo medido esta semana está solo en el artefacto.`);
    l.push('');
  }
  l.push('---', '_Generado por [Claude Code](https://claude.ai/code)_');
  return l.join('\n');
}

// CLI del job `publicar`: `node scripts/vigia-publicar.js <carpeta del artefacto>`. Valida,
// copia el lock al repositorio y deja `informe.json` en la misma carpeta para el paso del
// issue. Sale con 1 si algo no pasa la validación, sin escribir nada.
function principal(dir, lockRepo = LOCK) {
  const leer = (rel) => JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
  const fuentes = fuentesPorClave();
  const nuevo = leer('server/seed/legacyData/fuentes.lock.json');
  let viejo = { documentos: {} };
  if (fs.existsSync(lockRepo)) viejo = JSON.parse(fs.readFileSync(lockRepo, 'utf8'));
  const malLock = validarLock(viejo, nuevo, fuentes);
  if (malLock) throw new Error(`el lock de la corrida no pasa la validación: ${malLock}`);
  const { error, informe } = informeDe(leer('vigia.json'), fuentes);
  if (error) throw new Error(`vigia.json no pasa la validación: ${error}`);
  fs.writeFileSync(lockRepo, `${JSON.stringify(nuevo, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'informe.json'), `${JSON.stringify(informe, null, 2)}\n`);
  return informe;
}

if (require.main === module) {
  const dir = process.argv[2] || '.';
  try {
    const inf = principal(dir);
    console.log(`[vigia] lock validado y copiado · ${inf.cambiados.length} cambio(s) · ${inf.inalcanzables.length} inalcanzable(s)`);
  } catch (e) {
    console.error(`[vigia] ${e.message}`);
    // Para que el paso del issue diga por qué no se publicó.
    try { fs.writeFileSync(path.join(dir, 'rechazo.json'), JSON.stringify({ motivo: e.message })); } catch { /* sin carpeta */ }
    process.exit(1);
  }
}

module.exports = {
  RAMA, TITULO_FALLO, fuentesPorClave, validarLock, informeDe, tituloIssue, hayQueAvisar, cuerpoIssue, cuerpoFallo, principal,
};
