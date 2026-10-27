# Traspaso: pqc-version-supuestos

- **Tema:** La versión mínima de software de la PQC en la hoja «Supuestos» del Excel, y los equipos que siguen en «no consta» de PQC con documento que se pueda traer
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 18:00
- **Archivos que toca:** public/js/bom.js, test/bom-supuestos.test.js, test/e2e/, server/seed/legacyData/cisco.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/nokia.js, server/seed/legacyData/aruba.js, server/seed/legacyData/fuentes.js, .github/workflows/traer-cisco-huawei.yml, test/pqc.test.js
- **Siguiente paso:** leer `matrizSupuestos` en `bom.js` y añadir la fila de PQC (mecanismo, versión mínima y fuente) cuando el escenario exige `reqPqc`

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
- Entradas nuevas en `traer-cisco-huawei.yml`: boletines de fin de venta de los tres ASR y la ficha
  de los 7250 IXR-e/e2 (asset 206825), a `fuente/pqc-3-2026-10-27`.

## Falta

- La fila de PQC en «Supuestos» (`bom.js`), con su prueba y su e2e.
- Buscar y traer los documentos de los PQC pendientes; marcar solo con documento.
- Verificar, fusionar, PENDIENTES, RELEVO, borrar este traspaso.

## Decisiones y hallazgos

- La PPK de un sistema operativo solo se marca en el modelo con documento de que corre esa versión.

## Verificación

- (pendiente)
