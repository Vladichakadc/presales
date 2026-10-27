# Traspaso: pqc-version-supuestos

- **Tema:** La versión mínima de software de la PQC en la hoja «Supuestos» del Excel, y los equipos que siguen en «no consta» de PQC con documento que se pueda traer
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 17:40
- **Archivos que toca:** public/js/bom.js, test/bom-supuestos.test.js, test/e2e/, server/seed/legacyData/cisco.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/nokia.js, server/seed/legacyData/aruba.js, server/seed/legacyData/fuentes.js, .github/workflows/traer-cisco-huawei.yml, test/pqc.test.js
- **Siguiente paso:** leer `matrizSupuestos` en `bom.js` y añadir la fila de PQC (mecanismo, versión mínima y fuente) cuando el escenario exige `reqPqc`

## Encargo del dueño

«Ejecuta pendientes que puedas solucionar y mejora propuesta» (2026-10-27, tras la entrega 66). La
mejora propuesta: la versión mínima de software en la hoja «Supuestos» cuando se exige PQC. Los
pendientes que una sesión puede cerrar: la PQC que sigue en «no consta» donde haya documento que
traer por Actions (ASR 1000, siete MikroTik, 7250 IXR, gateways AOS de Aruba).

## Hecho

- (nada todavía)

## Falta

- La fila de PQC en «Supuestos» (`bom.js`), con su prueba y su e2e.
- Buscar y traer los documentos de los PQC pendientes; marcar solo con documento.
- Verificar, fusionar, PENDIENTES, RELEVO, borrar este traspaso.

## Decisiones y hallazgos

- La PPK de un sistema operativo solo se marca en el modelo con documento de que corre esa versión.

## Verificación

- (pendiente)
