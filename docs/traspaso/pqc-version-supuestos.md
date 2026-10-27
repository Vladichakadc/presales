# Traspaso: pqc-version-supuestos

- **Tema:** La versión mínima de software de la PQC en la hoja «Supuestos» del Excel, y los equipos que siguen en «no consta» de PQC con documento que se pueda traer
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 18:45
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-aruba-edgeconnect.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-fortinet-fortigate.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-nokia-7750sr.js, test/bom-supuestos.test.js, test/e2e/, server/seed/legacyData/cisco.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/nokia.js, server/seed/legacyData/aruba.js, server/seed/legacyData/fuentes.js, .github/workflows/traer-cisco-huawei.yml, test/pqc.test.js, public/dimensionador-mikrotik-routeros.html
- **Siguiente paso:** pantallas, contraste, e2e y puerta contra un servidor en producción; después rebase, PENDIENTES, RELEVO, CLAUDE.md (la línea de PQC de `ficha.js`), borrar este traspaso, PR y fusionar

## Encargo del dueño

«Ejecuta pendientes que puedas solucionar y mejora propuesta» (2026-10-27, tras la entrega 66). La
mejora propuesta: la versión mínima de software en la hoja «Supuestos» cuando se exige PQC. Los
pendientes que una sesión puede cerrar: la PQC que sigue en «no consta» donde haya documento que
traer por Actions (ASR 1000, siete MikroTik, 7250 IXR, gateways AOS de Aruba).

## Hecho

- Hallado (manuales de usuario de MikroTik ya traídos, rama `fuente/pendientes-2026-10-13`): el
  hEX lite (RB750r2), el hEX (RB750Gr3), el hEX PoE (RB960PGS) y el hEX S (RB760iGS) dicen «The device
  supports RouterOS v7 and above»; el hEX PoE lite, la PowerBox Pro y el RB1100AHx4 dicen solo «la
  versión de /system resource o superior».
- **Mejora hecha**: `matrizSupuestos` (`bom.js`) escribe «CRIPTOGRAFÍA POST-CUÁNTICA EXIGIDA» cuando
  `#reqPqc` pide algo: requisito, si el equipo lo cumple (con el motivo de `pqc.js` si no), mecanismo,
  versión mínima («la fuente no da la versión» si falta), dónde, alcance y fuente. Las siete páginas
  pasan `pqc: m.pqc || null`. Pruebas en `bom-supuestos.test.js` y batería `e2e-pqc-supuestos.js`
  (Excel real del ISR: «IOS XE 17.12.1a o superior»).
- Entradas nuevas en `traer-cisco-huawei.yml`: boletines de fin de venta de los tres ASR y la ficha
  de los 7250 IXR-e/e2 (asset 206825), a `fuente/pqc-3-2026-10-27`.

- **PQC con documento** (rama `fuente/pqc-3-2026-10-27`): los boletines de fin de venta dan la
  última versión de cada ASR: 1002-HX la 17.15 y 1006-X la 17.18 (PPK desde la 17.11.1a, con su
  alcance), 1001-X la 17.9 (sin PPK). Cuatro MikroTik más por su manual («RouterOS v7 and above»).
  La ficha Release 26 de los 7250 IXR-e/e2 solo da «MACsec (only on IXR-e 14 x SFP+ + 4 x RJ45)», sin
  llamarlo quantum-safe: siguen en «no consta». Aruba AOS: ningún documento encontrado.
- `npm run verificar` (1163) y `npm run auditar` en verde.

## Falta

- La fila de PQC en «Supuestos» (`bom.js`), con su prueba y su e2e.
- Buscar y traer los documentos de los PQC pendientes; marcar solo con documento.
- Verificar, fusionar, PENDIENTES, RELEVO, borrar este traspaso.

## Decisiones y hallazgos

- La PPK de un sistema operativo solo se marca en el modelo con documento de que corre esa versión.

## Verificación

- (pendiente)
