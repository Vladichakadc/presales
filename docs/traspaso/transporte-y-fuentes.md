# Traspaso: transporte-y-fuentes

- **Tema:** La lista del transporte de documentos fuera del YAML (mejora propuesta en el PR #45) y los pendientes que esperan documento oficial
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-28 08:40
- **Archivos que toca:** .github/workflows/traer-cisco-huawei.yml, scripts/transporte/, test/traer-exploracion.test.js, test/traer-pantalla-login.test.js, test/workflows-node-e.test.js, test/transporte-documentos.test.js, server/seed/legacyData/fuentes.js, server/seed/legacyData/cisco.js, server/seed/legacyData/aruba.js, server/seed/legacyData/juniper.js, server/seed/legacyData/nokia.js, server/seed/legacyData/huawei.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/mikrotik.js, test/pqc.test.js
- **Siguiente paso:** mover la lista y el script del transporte a scripts/transporte/ con el programa exacto que bash entrega hoy, y probarlo con una corrida real

## Encargo del dueño

«Ejecuta estos pendientes: esperan documento oficial (la PQC de Huawei, los gateways AOS, los
Meraki, los SRX de sucursal y el SRX4100, y los Nokia 7250/7220 IXR; además los de Cisco, Juniper,
Aruba, MikroTik, Huawei y Fortinet de RELEVO.md). Ejecuta la mejora propuesta.» La mejora es la del
PR #45: la lista del transporte fuera del YAML.

## Hecho

- (nada todavía)

## Falta

- Mejora: scripts/transporte/documentos.js y traer.js; el workflow los ejecuta; pruebas por require().
- Pendientes: buscar el documento oficial de cada uno, traerlo por Actions y cerrar solo lo que diga.

## Decisiones y hallazgos

- El PR #46 (otra sesión, sin traspaso) declara public/js/bom.js y cinco dimensionadores: no se tocan.

## Verificación

- (pendiente)
