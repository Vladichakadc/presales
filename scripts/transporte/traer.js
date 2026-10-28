'use strict';
// EL TRANSPORTE DE DOCUMENTOS (2026-10-28). Lo ejecuta `traer-cisco-huawei.yml` con
// `node scripts/transporte/traer.js` desde la raíz del repositorio y `SOLO` en el entorno (los
// archivos de `documentos.js` que se piden, separados por comas; vacío, todos). Baja cada
// documento a `fuente-cisco-huawei/` y deja allí `informe.json`; el paso siguiente del workflow
// lo empuja a la rama de transporte. Hasta hoy era un `node -e` dentro del YAML: este programa es
// el mismo que bash le entregaba a Node, partido en la lista y la lógica.
const fs = require('fs');
const { DOCS } = require('./documentos');

// Una pagina HTML se valida por un texto que solo puede estar en el documento correcto
// (debeContener). La que se pide para ver que hay —un indice del archivo, una pagina de
// control— se declara exploracion, y el informe la dice EXPL, no OK: el 2026-10-07 cinco
// pantallas de inicio de sesion salieron OK porque nada distinguia una cosa de la otra.
const sinFirma = DOCS.filter((d) => d.tipo === 'html' && !d.debeContener && !d.exploracion).map((d) => d.archivo);
if (sinFirma.length) { console.error('Entradas html sin debeContener ni exploracion: ' + sinFirma.join(', ')); process.exit(1); }
const SOLO = (process.env.SOLO || '').split(',').map((x) => x.trim()).filter(Boolean);
const faltan = SOLO.filter((x) => !DOCS.some((d) => d.archivo === x));
if (faltan.length) { console.error('Entradas que no existen: ' + faltan.join(', ')); process.exit(1); }
const ELEGIDOS = SOLO.length ? DOCS.filter((d) => SOLO.includes(d.archivo)) : DOCS;
const informe = [];
(async () => {
  fs.mkdirSync('fuente-cisco-huawei', { recursive: true });
  for (const doc of ELEGIDOS) {
    const intentos = [];
    let guardado = false;
    if (doc.descubrir) {
      const origen = 'fuente-cisco-huawei/' + doc.descubrir.de;
      if (!fs.existsSync(origen)) {
        intentos.push({ url: doc.descubrir.de, error: 'la pagina donde descubrir la URL no se guardo' });
      } else {
        const BS = String.fromCharCode(92);
        const pagina = fs.readFileSync(origen, 'utf8').split(BS + 'u002F').join('/').split(BS + '/').join('/');
        const vistos = new Set();
        let i = pagina.indexOf(doc.descubrir.material);
        while (i >= 0) {
          let fin = i;
          while (fin < pagina.length && !'\x22\x27<>\n'.includes(pagina[fin])) fin++;
          let ruta = pagina.slice(i, fin);
          try { ruta = encodeURI(decodeURI(ruta)); } catch { ruta = encodeURI(ruta); }
          if (ruta.toLowerCase().endsWith('.pdf') && !vistos.has(ruta)) {
            vistos.add(ruta);
            doc.urls.push('https://e-file.huawei.com/marketingcloud/pep/asset/20000001/' + ruta);
            doc.urls.push('https://e.huawei.com/marketingcloud/pep/asset/20000001/' + ruta);
          }
          i = pagina.indexOf(doc.descubrir.material, i + 1);
        }
        if (!doc.urls.length) intentos.push({ url: doc.descubrir.de, error: 'la pagina no enlaza ningun PDF de ese material' });
      }
    }
    if (doc.descubrirEnlace) {
      // Generico: los PDF que ENLAZA una pagina ya guardada, cuya ruta contiene el texto
      // pedido; relativos a la URL de esa pagina, y primero los que estan en ingles.
      const de = doc.descubrirEnlace;
      const origen = 'fuente-cisco-huawei/' + de.de;
      if (!fs.existsSync(origen)) {
        intentos.push({ url: de.de, error: 'la pagina donde descubrir la URL no se guardo' });
      } else {
        const pagina = fs.readFileSync(origen, 'utf8');
        const vistos = new Set();
        for (const m of pagina.matchAll(/href=['\x22]([^'\x22<>]+?[.]pdf)['\x22]/gi)) {
          if (!m[1].includes(de.contiene)) continue;
          const abs = new URL(m[1], de.base);
          // Solo del fabricante: la pagina es contenido de fuera y no elige a que
          // dominio va el ejecutor (que tiene permiso de escritura).
          const h = abs.hostname;
          if (!de.dominios.some((d) => h === d || h.endsWith('.' + d))) {
            intentos.push({ url: abs.href, error: 'fuera de los dominios del fabricante, no se pide' });
            continue;
          }
          // El portal enlaza las guias por http; se pide antes por https, y http
          // queda de respaldo, porque el PDF solo se valida por su firma.
          if (abs.protocol !== 'http:' && abs.protocol !== 'https:') continue;
          const seguro = new URL(abs.href);
          seguro.protocol = 'https:';
          for (const u of [seguro.href, abs.href]) {
            if (!vistos.has(u)) { vistos.add(u); doc.urls.push(u); }
          }
        }
        doc.urls.sort((x, y) => (y.includes('_EN') ? 1 : 0) - (x.includes('_EN') ? 1 : 0));
        if (!doc.urls.length) intentos.push({ url: de.de, error: 'la pagina no enlaza ningun PDF con ' + de.contiene });
      }
    }
    if (doc.descubrirPiezas) {
      // Varias piezas por entrada, cada una a su archivo dentro de la carpeta de la
      // entrada: las paginas de serie que enlaza un listado (tipo paginas) o las
      // imagenes de producto de esas paginas (tipo imagenes). La lista sale de
      // contenido de fuera: solo se piden dominios del fabricante, por https, con tope
      // de piezas y de tamano, y cada pieza se valida por su firma, no por la extension.
      const cfg = doc.descubrirPiezas;
      const esImg = doc.tipo === 'imagenes';
      // Los scripts (2026-10-07) se piden para LEER de donde saca sus datos una pagina
      // que llega como cascaron; no se ejecutan en ningun momento.
      const esJs = doc.tipo === 'scripts';
      const carpeta = 'fuente-cisco-huawei/' + doc.archivo;
      fs.mkdirSync(carpeta, { recursive: true });
      const paginas = [];
      for (const de of cfg.de) {
        const ruta = 'fuente-cisco-huawei/' + de;
        if (!fs.existsSync(ruta)) { intentos.push({ url: de, error: 'no se guardo, no se lee' }); continue; }
        if (fs.statSync(ruta).isDirectory()) for (const f of fs.readdirSync(ruta)) paginas.push(ruta + '/' + f);
        else paginas.push(ruta);
      }
      const piezas = new Map();
      const usados = new Set();
      for (const ruta of paginas) {
        const texto = fs.readFileSync(ruta, 'utf8');
        const re = esJs ? /src=[\x22']([^\x22'<>\s]+?[.]js(?:[?][^\x22'<>\s]*)?)[\x22']/gi
          : esImg ? /(?:https?:)?[/][/][^\x22'\s()<>]+?[.](?:png|jpe?g|webp)/gi
          : new RegExp('(?:https?:[/][/][A-Za-z0-9.-]+)?[/]' + cfg.prefijo.join('[/]') + '[/][A-Za-z0-9][A-Za-z0-9_/-]*', 'g');
        const halladas = [...texto.matchAll(re)].map((m) => (esJs ? m[1] : m[0]));
        // Opt-in (Cisco, 2026-10-20): imagenes con ruta relativa a la raiz del sitio, que
        // la expresion de arriba no ve porque exige el doble barra de una URL completa.
        if (esImg && cfg.relativas) {
          for (const m of texto.matchAll(/(?:src|href|data-src)=[\x22']([/][^/\x22'<>\s][^\x22'<>\s]*?[.](?:png|jpe?g|webp))/gi)) halladas.push(m[1]);
        }
        for (const hallada of halladas) {
          let u;
          try { u = new URL(hallada, cfg.base); } catch { continue; }
          if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
          u.protocol = 'https:';
          if (!cfg.dominios.some((d) => u.hostname === d || u.hostname.endsWith('.' + d))) continue;
          const camino = u.pathname.toLowerCase();
          const seg = u.pathname.split('/').filter(Boolean);
          if (esJs) {
            // sin filtro de camino: el dominio ya esta acotado y hay tope de piezas
          } else if (esImg) {
            if (!cfg.contiene.some((c) => camino.includes(c))) continue;
            if (/icon|logo|opacity|background|banner|[/]bg[.]/.test(camino)) continue;
          } else {
            const largo = cfg.prefijo.length;
            if (seg.length < largo + 1 || seg.length > largo + 2 || cfg.prefijo.some((p, i) => seg[i] !== p)) continue;
            if (cfg.solo && !cfg.solo.includes(seg[largo])) continue;
          }
          if (piezas.has(u.href)) continue;
          const base = (esJs ? seg.slice(-3).join('__') : esImg ? seg.slice(-3).join('__') : seg.slice(cfg.prefijo.length).join('__') + '.html')
            .replace(/[^A-Za-z0-9._-]/g, '_').slice(-150);
          let nombre = base;
          for (let k = 2; usados.has(nombre); k++) nombre = k + '_' + base;
          usados.add(nombre);
          piezas.set(u.href, nombre);
        }
      }
      let n = 0;
      for (const [url, nombre] of piezas) {
        if (n >= cfg.max) { intentos.push({ url, error: 'pasado el tope de ' + cfg.max + ', no se pide' }); continue; }
        let res;
        try {
          // Con Referer de su propio sitio: el CDN de carrier.huawei.com niega con 403
          // la imagen pedida sin el (corrida 37514205499).
          res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (presales-traer-fuente/1.0)',
            'Referer': new URL(url).origin + '/' } });
        } catch (e) { intentos.push({ url, error: String(e.message || e) }); continue; }
        if (!res.ok) { intentos.push({ url, status: res.status }); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        const hex = buf.subarray(0, 4).toString('hex');
        const firma = esJs
          ? !/^[\s\uFEFF]*</.test(buf.subarray(0, 512).toString('utf8'))
          : esImg
          ? hex === '89504e47' || hex.startsWith('ffd8ff')
            || (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP')
          : /<html/i.test(buf.subarray(0, 4096).toString('utf8'));
        if (!firma || buf.length > 15 * 1024 * 1024) {
          intentos.push({ url, status: res.status, bytes: buf.length, nota: firma ? 'mas de 15 MB' : 'la firma no es la esperada' });
          continue;
        }
        fs.writeFileSync(carpeta + '/' + nombre, buf);
        intentos.push({ url, status: res.status, bytes: buf.length, guardado: true, como: doc.archivo + '/' + nombre });
        n++;
      }
      guardado = n > 0;
      if (!piezas.size) intentos.push({ url: cfg.de.join(', '), error: 'no se encontro ninguna pieza' });
    }
    for (const url of doc.urls) {
      let res;
      try {
        res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (presales-traer-fuente/1.0)' } });
      } catch (e) { intentos.push({ url, error: String(e.message || e) }); continue; }
      if (!res.ok) { intentos.push({ url, status: res.status }); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (doc.tipo === 'pdf' && buf.subarray(0, 4).toString() !== '%PDF') {
        intentos.push({ url, status: res.status, firma: buf.subarray(0, 8).toString('hex'), nota: 'no es un PDF' });
        continue;
      }
      // Un 200 con la pantalla de inicio de sesion no es el documento: el 2026-10-07 cinco
      // entradas de Info-Finder sin texto exigido salieron como guardadas con los 3417 B del
      // IDaaS de Huawei. Se dice lo que es, y no se guarda como si fuera el boletin.
      if (doc.tipo !== 'pdf' && /uniportal1[/]js[/]authCommons|IDAAS_V[0-9]|loginTitle/.test(buf.subarray(0, 8192).toString('utf8'))) {
        intentos.push({ url, status: res.status, bytes: buf.length, nota: 'pantalla de inicio de sesion (IDaaS), no el documento' });
        continue;
      }
      if (doc.debeContener && !buf.toString('utf8').includes(doc.debeContener)) {
        intentos.push({ url, status: res.status, bytes: buf.length, nota: 'no contiene el texto esperado' });
        continue;
      }
      fs.writeFileSync('fuente-cisco-huawei/' + doc.archivo, buf);
      intentos.push({ url, status: res.status, bytes: buf.length, guardado: true, verificado: !doc.exploracion });
      guardado = true;
      break;
    }
    informe.push({ archivo: doc.archivo, para: doc.para, guardado, exploracion: !!doc.exploracion, intentos });
  }
  fs.writeFileSync('fuente-cisco-huawei/informe.json', JSON.stringify(informe, null, 2));
  for (const d of informe) {
    console.log((d.guardado ? (d.exploracion ? 'EXPL ' : 'OK   ') : 'FALLA') + '  ' + d.para + '  ' + d.archivo);
    for (const i of d.intentos) console.log('        ' + (i.status || i.error) + '  ' + i.url + (i.nota ? '  <- ' + i.nota : ''));
  }
})().catch((e) => { console.error(e); process.exit(1); });
