# Traspaso: pqc-documentos

- **Tema:** Criptografía post-cuántica de los equipos que dicen «no consta»: buscar su documento oficial y traerlo por Actions
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 13:35
- **Archivos que toca:** server/seed/legacyData/cisco.js, server/seed/legacyData/juniper.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/aruba.js, server/seed/legacyData/nokia.js, server/seed/legacyData/huawei.js, server/seed/legacyData/fuentes.js, .github/workflows/traer-cisco-huawei.yml, test/pqc.test.js
- **Siguiente paso:** buscar en las fuentes oficiales de cada fabricante si un documento nombra ML-KEM, PPK (RFC 8784) o MACsec quantum-safe para los equipos sin `pqc`; traer lo encontrado con `traer-cisco-huawei.yml` a una rama `fuente/pqc-2-*`

## Encargo del dueño

«Ejecuta la mejora y lo pendiente» (2026-10-27, tras la entrega 59). La mejora propuesta (la
interconexión EdgeHA en el BOM) ya la fusionó otra sesión en el PR #26. De lo pendiente, lo que una
sesión puede hacer sin acceso especial y sin tocar los archivos del tema en curso
`cisco-figuras-excel` (`bom.js`, la página Cisco) es buscar los documentos que faltan; se empieza por
la criptografía post-cuántica, que hoy aparta como «no consta» a Huawei, Aruba, MikroTik, Catalyst
8000, ISR, ASR, Meraki G2-MX, SRX4100 y SRX de sucursal, Nokia 7750 SR-1x, 7250 IXR y 7220 IXR.

## Hecho

- (nada todavía)

## Falta

- Buscar, por fabricante, el documento oficial (notas de versión, guía de configuración, ficha).
- Traerlo por Actions y leerlo; marcar `pqc` solo con documento, con su fuente en `fuentes.js`.
- Verificar, fusionar, actualizar `PENDIENTES.md` y `RELEVO.md`, borrar este traspaso.

## Decisiones y hallazgos

- Un blog o un resumen de buscador no es fuente: solo notas de versión, guías o fichas del fabricante.

## Verificación

- (pendiente)
