'use strict';
// UN 200 CON LA PANTALLA DE INICIO DE SESION NO ES EL DOCUMENTO (2026-10-07).
//
// La corrida 37613969445 de `traer-cisco-huawei.yml` dio por «guardadas» cinco paginas de
// Info-Finder que eran los 3417 B del inicio de sesion de Huawei (IDaaS): las entradas de
// exploracion no exigen un texto, y el informe decia OK. El workflow ahora reconoce esa pantalla
// y la reporta como tal. Esta prueba lee la expresion del propio workflow (vive dentro de un
// `node -e`) y la pasa por la pantalla de Huawei y por paginas buenas, para que una edicion que
// la rompa o la vuelva demasiado ancha salga aqui y no en la siguiente corrida.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'traer-cisco-huawei.yml'), 'utf8');

function detector() {
  const m = src.match(/if \(doc\.tipo !== 'pdf' && \/(.+?)\/\.test\(buf\.subarray\(0, 8192\)/);
  assert.ok(m, 'el workflow ya no reconoce la pantalla de inicio de sesion');
  return new RegExp(m[1]);
}

test('la pantalla IDaaS de Huawei se reconoce y no se guarda como el documento', () => {
  const re = detector();
  const login = '<!DOCTYPE html><html lang="zh"><head><title v-text="loginTitle"></title>'
    + '<script src="/uniportal1/js/authCommons.js?ver=IDAAS_V3R8" type="text/javascript"></script>';
  assert.ok(re.test(login));
  assert.match(src, /nota: 'pantalla de inicio de sesion \(IDaaS\), no el documento'/);
});

test('una pagina de producto o de documentos no se confunde con el inicio de sesion', () => {
  const re = detector();
  for (const pagina of [
    '<html><head><title>NetEngine AR6700 Series Enterprise Routers</title></head><body>Login to download</body></html>',
    '<html><body><a href="/marketingcloud/pep/asset/20000001/Material/x.pdf">Datasheet</a> sign in</body></html>',
  ]) assert.ok(!re.test(pagina), pagina.slice(0, 60));
});
