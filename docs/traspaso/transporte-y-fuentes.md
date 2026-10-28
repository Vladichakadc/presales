# Traspaso: transporte-y-fuentes

- **Tema:** La lista del transporte de documentos fuera del YAML (mejora propuesta en el PR #45) y los pendientes que esperan documento oficial
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-28 09:20
- **Archivos que toca:** scripts/transporte/, .github/workflows/traer-cisco-huawei.yml (el paso de descarga; se fusiona DESPUÉS de claude/figuras-cisco-isr-mx, ver *Decisiones*), test/transporte-documentos.test.js, test/traer-exploracion.test.js, test/traer-pantalla-login.test.js, test/workflows-node-e.test.js, public/js/fortinet-reglas.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/huawei.js, server/seed/legacyData/fuentes.js
- **Siguiente paso:** leer la corrida de transporte con las entradas nuevas (Fortinet F3, N1 de Huawei, nubes del AR6700V-L) y cerrar solo lo que digan

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

- 2026-10-28 14:03 UTC: `claude/figuras-cisco-isr-mx` (otra sesión) declaró también
  `traer-cisco-huawei.yml` y le añadió 14 líneas de entradas (figuras de los ASR). Para no
  romperle el rebase, **esta rama se fusiona después de la suya**: al rebasar se regenera
  `scripts/transporte/documentos.js` desde su YAML fusionado (generador en el scratchpad de la
  sesión; si se perdiera: el programa que bash entrega del heredoc, partido en `DOCS` y la lógica),
  y sus entradas quedan en el módulo sin que tenga que tocar nada.

- 2026-10-28 13:37 UTC: la rama claude/documentos-pendientes (cuenta servicioiptv2025) declaró
  traer-cisco-huawei.yml, fuentes.js, fuentes.lock.json, aruba.js, juniper.js y pqc.test.js doce
  segundos antes que este traspaso, y su tema cubre la PQC de los gateways AOS-8 y las fichas
  inglesas de Juniper MX y SSR100. Se le cede: esos pendientes y esos archivos son suyos hasta que
  fusione.

- El PR #46 (otra sesión, sin traspaso) declara public/js/bom.js y cinco dimensionadores: no se tocan.

## Verificación

- (pendiente)
