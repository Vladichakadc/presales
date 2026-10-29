'use strict';
// EL TRANSPORTE DE DOCUMENTOS, PROBADO SIN RED (2026-10-28, mejora propuesta al cerrar el PR #54).
//
// `scripts/transporte/traer.js` baja los documentos oficiales que el proxy de egreso de estos entornos
// no deja pedir; corre en Actions. Hasta hoy sus reglas solo se comprobaban leyendo su texto con
// expresiones regulares, o en una corrida real: un cambio que las rompiera se veía cuando el transporte
// ya no traía un documento o, peor, guardaba una página que no era el documento. Aquí se le pasa un
// `fetch` de mentira y una carpeta temporal, y se mira lo que guarda y lo que dice el informe.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { traer, validar, imprimir } = require('../scripts/transporte/traer.js');
const DOCS = require('../scripts/transporte/documentos.js');

const PNG = Buffer.from('89504e470d0a1a0a0000', 'hex');
const PDF = Buffer.from('%PDF-1.7\n...', 'latin1');
const html = (s) => Buffer.from(`<html><body>${s}</body></html>`, 'utf8');
const LOGIN = Buffer.from('<!DOCTYPE html><html><head><title v-text="loginTitle"></title>'
  + '<script src="/uniportal1/js/authCommons.js?ver=IDAAS_V3R8"></script></head><body>C1111-8P</body></html>', 'utf8');

// Un servidor de mentira: cada URL responde lo que diga el mapa; lo demás, 404. Anota lo pedido.
function servidor(mapa) {
  const pedidas = [];
  const fetch = async (url) => {
    pedidas.push(url);
    const r = mapa[url];
    if (r instanceof Error) throw r;
    if (!r) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
    const [status, cuerpo] = Buffer.isBuffer(r) ? [200, r] : r;
    return { ok: status < 400, status, arrayBuffer: async () => cuerpo.buffer.slice(cuerpo.byteOffset, cuerpo.byteOffset + cuerpo.length) };
  };
  return { fetch, pedidas };
}
const carpeta = () => fs.mkdtempSync(path.join(os.tmpdir(), 'transporte-'));
const porArchivo = (informe) => Object.fromEntries(informe.map((d) => [d.archivo, d]));

test('una lista mal declarada no pide nada: ni un HTML sin firma ni una entrada que no existe', async () => {
  assert.match(validar([{ archivo: 'a.html', tipo: 'html', urls: ['https://x.com/'] }], []), /sin debeContener ni exploracion: a\.html/);
  assert.match(validar(DOCS, ['no-existe.pdf']), /Entradas que no existen: no-existe\.pdf/);
  assert.strictEqual(validar(DOCS, []), null, 'la lista real está bien declarada');
  const { fetch, pedidas } = servidor({});
  await assert.rejects(traer({ docs: DOCS, solo: ['no-existe.pdf'], fetch, dir: carpeta() }), /no existen/);
  assert.strictEqual(pedidas.length, 0);
});

test('un PDF se guarda por su firma, no por el código HTTP; las URL siguientes son respaldo', async () => {
  const dir = carpeta();
  const { fetch, pedidas } = servidor({
    'https://a.cisco.com/1.pdf': [200, html('Documento movido')],
    'https://a.cisco.com/3.pdf': PDF,
    'https://a.cisco.com/4.pdf': PDF,
  });
  const docs = [{ archivo: 'ficha.pdf', tipo: 'pdf', para: 'CISCO', urls: ['https://a.cisco.com/1.pdf', 'https://a.cisco.com/2.pdf', 'https://a.cisco.com/3.pdf', 'https://a.cisco.com/4.pdf'] }];
  const d = porArchivo(await traer({ docs, fetch, dir }))['ficha.pdf'];
  assert.ok(d.guardado);
  assert.deepStrictEqual(d.intentos.map((i) => i.nota || i.status), ['no es un PDF', 404, 200]);
  assert.ok(fs.readFileSync(path.join(dir, 'ficha.pdf')).subarray(0, 4).equals(Buffer.from('%PDF')));
  assert.ok(!pedidas.includes('https://a.cisco.com/4.pdf'), 'con uno guardado no pide más');
});

test('un HTML exige su texto, y la pantalla de inicio de sesión no pasa aunque lo contenga', async () => {
  const dir = carpeta();
  const { fetch } = servidor({
    'https://a.cisco.com/sin.html': html('otra cosa'),
    'https://a.cisco.com/login.html': LOGIN,
    'https://a.cisco.com/bien.html': html('ficha del C1111-8P'),
  });
  const docs = [{ archivo: 'ds.html', tipo: 'html', para: 'CISCO', debeContener: 'C1111-8P',
    urls: ['https://a.cisco.com/sin.html', 'https://a.cisco.com/login.html', 'https://a.cisco.com/bien.html'] }];
  const d = porArchivo(await traer({ docs, fetch, dir }))['ds.html'];
  assert.deepStrictEqual(d.intentos.map((i) => i.nota || 'guardado'),
    ['no contiene el texto esperado', 'pantalla de inicio de sesion (IDaaS), no el documento', 'guardado']);
  assert.strictEqual(d.intentos[2].verificado, true);
  assert.match(fs.readFileSync(path.join(dir, 'ds.html'), 'utf8'), /C1111-8P/);
});

test('lo explorado se guarda sin texto exigido, pero el informe no lo da por verificado', async () => {
  const dir = carpeta();
  const { fetch } = servidor({ 'https://a.cisco.com/indice.html': html('índice') });
  const informe = await traer({ docs: [{ archivo: 'indice.html', tipo: 'html', para: 'CISCO', exploracion: true, urls: ['https://a.cisco.com/indice.html'] }], fetch, dir });
  assert.strictEqual(informe[0].exploracion, true);
  assert.strictEqual(informe[0].intentos[0].verificado, false);
  const lineas = [];
  imprimir(informe, (l) => lineas.push(l));
  assert.match(lineas[0], /^EXPL +CISCO +indice\.html$/, 'el registro dice EXPL, no OK');
});

test('las imágenes de una página: solo del fabricante, sin iconos, por su firma y con tope', async () => {
  const dir = carpeta();
  const pagina = html([
    '<img src="https://www.cisco.com/c/dam/a/uno.png">',
    '<img src="/c/dam/a/dos.jpg">',                          // relativa a la raíz del sitio
    '<img src="https://evil.example.com/c/dam/a/tres.png">', // otro dominio: ni se pide
    '<img src="https://www.cisco.com/c/dam/a/icon-x.png">',  // icono: no es una figura
    '<img src="https://www.cisco.com/otra/cuatro.png">',     // fuera del camino declarado
    '<img src="https://www.cisco.com/c/dam/a/falsa.png">',   // responde HTML: firma mala
    '<img src="https://www.cisco.com/c/dam/a/cinco.png">',   // pasa del tope
  ].join(''));
  const { fetch, pedidas } = servidor({
    'https://www.cisco.com/serie.html': pagina,
    'https://www.cisco.com/c/dam/a/uno.png': PNG,
    'https://www.cisco.com/c/dam/a/dos.jpg': Buffer.from('ffd8ffe000', 'hex'),
    'https://www.cisco.com/c/dam/a/falsa.png': html('no es una imagen'),
    'https://www.cisco.com/c/dam/a/cinco.png': PNG,
  });
  const docs = [
    { archivo: 'serie.html', tipo: 'html', para: 'CISCO', debeContener: 'img', urls: ['https://www.cisco.com/serie.html'] },
    { archivo: 'img', tipo: 'imagenes', para: 'CISCO', urls: [],
      descubrirPiezas: { de: ['serie.html'], base: 'https://www.cisco.com/', dominios: ['cisco.com'], relativas: true, contiene: ['/c/dam/'], max: 2 } },
  ];
  const d = porArchivo(await traer({ docs, fetch, dir })).img;
  assert.ok(d.guardado);
  assert.ok(!pedidas.some((u) => /evil\.example|icon-x|cuatro/.test(u)), `pidió algo que no debía: ${pedidas.join(' ')}`);
  const nota = (u) => (d.intentos.find((i) => i.url === u) || {});
  assert.strictEqual(nota('https://www.cisco.com/c/dam/a/falsa.png').nota, 'la firma no es la esperada');
  // El tope cuenta las guardadas (una firma mala no gasta cupo); las relativas se suman al final.
  assert.strictEqual(d.intentos.filter((i) => i.guardado).length, 2);
  assert.strictEqual(d.intentos.filter((i) => /pasado el tope de 2/.test(i.error || '')).length, 1);
  assert.strictEqual(fs.readdirSync(path.join(dir, 'img')).length, 2);
  assert.ok(fs.readdirSync(path.join(dir, 'img')).includes('dam__a__uno.png'));
});

test('lo que depende de una página que no se guardó no pide nada y lo dice', async () => {
  const { fetch, pedidas } = servidor({});
  const docs = [
    { archivo: 'serie.html', tipo: 'html', para: 'CISCO', debeContener: 'x', urls: ['https://www.cisco.com/serie.html'] },
    { archivo: 'img', tipo: 'imagenes', para: 'CISCO', urls: [],
      descubrirPiezas: { de: ['serie.html'], base: 'https://www.cisco.com/', dominios: ['cisco.com'], contiene: ['/c/dam/'], max: 5 } },
  ];
  const d = porArchivo(await traer({ docs, fetch, dir: carpeta() })).img;
  assert.strictEqual(d.guardado, false);
  assert.deepStrictEqual(d.intentos.map((i) => i.error), ['no se guardo, no se lee', 'no se encontro ninguna pieza']);
  assert.deepStrictEqual(pedidas, ['https://www.cisco.com/serie.html'], 'solo la página, que dio 404');
});

test('los PDF que enlaza una página: del fabricante, primero por https y antes los que están en inglés', async () => {
  const dir = carpeta();
  const { fetch, pedidas } = servidor({
    'https://docs.huawei.com/lista.html': html('<a href="http://docs.huawei.com/g/guia_ES.pdf">es</a>'
      + '<a href="/g/guia_EN.pdf">en</a><a href="https://evil.example.com/g/guia_EN.pdf">x</a>'),
    'https://docs.huawei.com/g/guia_EN.pdf': PDF,
  });
  const docs = [
    { archivo: 'lista.html', tipo: 'html', para: 'HUAWEI', debeContener: 'guia', urls: ['https://docs.huawei.com/lista.html'] },
    { archivo: 'guia.pdf', tipo: 'pdf', para: 'HUAWEI', urls: [],
      descubrirEnlace: { de: 'lista.html', contiene: 'guia', base: 'https://docs.huawei.com/', dominios: ['huawei.com'] } },
  ];
  const d = porArchivo(await traer({ docs, fetch, dir }))['guia.pdf'];
  assert.ok(d.guardado);
  assert.strictEqual(pedidas[1], 'https://docs.huawei.com/g/guia_EN.pdf', 'la inglesa, la primera que se pide');
  assert.ok(d.intentos.some((i) => /fuera de los dominios del fabricante/.test(i.error || '') && /evil\.example/.test(i.url)));
  assert.ok(!pedidas.some((u) => /evil\.example/.test(u)));
});

test('un error de red queda en el informe y la corrida sigue; la lista compartida no se toca', async () => {
  const dir = carpeta();
  const { fetch } = servidor({ 'https://a.cisco.com/1.pdf': new Error('ECONNRESET'), 'https://a.cisco.com/2.pdf': PDF });
  const docs = [{ archivo: 'f.pdf', tipo: 'pdf', para: 'CISCO', urls: ['https://a.cisco.com/1.pdf', 'https://a.cisco.com/2.pdf'] }];
  const informe = await traer({ docs, fetch, dir });
  assert.strictEqual(informe[0].intentos[0].error, 'ECONNRESET');
  assert.ok(informe[0].guardado);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'informe.json'), 'utf8')), informe, 'escribe informe.json');
  // El descubrimiento añade URL a la copia, no a la lista del módulo (que se cargaría distinta en la siguiente llamada).
  const antes = JSON.stringify(DOCS);
  const { fetch: vacio } = servidor({});
  await traer({ docs: DOCS, solo: ['cisco-asr-img'], fetch: vacio, dir: carpeta() });
  assert.strictEqual(JSON.stringify(DOCS), antes);
});

test('cargar el módulo no pide nada; lanzado como el workflow, una entrada desconocida sale en 1 sin red', () => {
  const dir = carpeta();
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'transporte', 'traer.js')],
    { cwd: dir, env: { ...process.env, SOLO: 'no-existe.pdf' }, encoding: 'utf8' });
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /Entradas que no existen: no-existe\.pdf/);
  assert.ok(!fs.existsSync(path.join(dir, 'fuente-cisco-huawei')), 'no crea nada antes de validar');
});
