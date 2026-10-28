# Traspaso: transporte-y-fuentes

- **Tema:** La lista del transporte de documentos fuera del YAML (mejora propuesta en el PR #45) y los pendientes que esperan documento oficial
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** bloqueado (espera la fusión de claude/documentos-pendientes)
- **Actualizado:** 2026-10-28 09:35
- **Archivos que toca:** scripts/transporte/, test/transporte-documentos.test.js, test/traer-exploracion.test.js, test/traer-pantalla-login.test.js, test/workflows-node-e.test.js (y, cuando se fusione el PR #49: .github/workflows/traer-cisco-huawei.yml, server/seed/legacyData/fuentes.js y los legacyData de cada pendiente)
- **Siguiente paso:** cuando se fusione el PR #49, rebasar, regenerar scripts/transporte/ desde el traer-cisco-huawei.yml fusionado (el programa que bash entrega, partido en DOCS y lógica; sin el duplicado de huawei-a800-producto.html) y cambiar el paso del workflow a `run: node scripts/transporte/traer.js`

## Encargo del dueño

«Ejecuta estos pendientes: esperan documento oficial (la PQC de Huawei, los gateways AOS, los
Meraki, los SRX de sucursal y el SRX4100, y los Nokia 7250/7220 IXR; además los de Cisco, Juniper,
Aruba, MikroTik, Huawei y Fortinet de RELEVO.md). Ejecuta la mejora propuesta.» La mejora es la del
PR #45: la lista del transporte fuera del YAML.

## Hecho

- `scripts/transporte/documentos.js` (la lista, 392 entradas) y `traer.js` (la lógica), generados del
  programa exacto que bash entrega hoy a Node: recompuestos, casan línea a línea con él (salvo dos
  `catch (e)` sin usar que pasan a `catch`), y con `SOLO=no-existe` los dos fallan igual. Al moverlo
  salió un archivo repetido (`huawei-a800-producto.html`, misma URL dos veces): se queda la entrada
  con `debeContener`.
- Pruebas: `test/transporte-documentos.test.js` (nueva, por `require()`), y `traer-exploracion`,
  `traer-pantalla-login` y `workflows-node-e` leen el módulo. Dos siguen en rojo hasta cambiar el
  workflow (esperan a que se fusione el PR #49, que declara `traer-cisco-huawei.yml`).

## Falta

- Mejora: scripts/transporte/documentos.js y traer.js; el workflow los ejecuta; pruebas por require().
- Pendientes: buscar el documento oficial de cada uno, traerlo por Actions y cerrar solo lo que diga.

## Decisiones y hallazgos

- 2026-10-28 13:37 UTC: la rama claude/documentos-pendientes (cuenta servicioiptv2025) declaró
  traer-cisco-huawei.yml, fuentes.js, fuentes.lock.json, aruba.js, juniper.js y pqc.test.js doce
  segundos antes que este traspaso, y su tema cubre la PQC de los gateways AOS-8 y las fichas
  inglesas de Juniper MX y SSR100. Se le cede: esos pendientes y esos archivos son suyos hasta que
  fusione.

- El PR #46 (otra sesión, sin traspaso) declara public/js/bom.js y cinco dimensionadores: no se tocan.

## Verificación

- (pendiente)
