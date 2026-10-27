# Traspaso: pqc-documentos

- **Tema:** Criptografía post-cuántica de los equipos que dicen «no consta»: buscar su documento oficial y traerlo por Actions
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 19:10
- **Archivos que toca:** server/seed/legacyData/cisco.js, server/seed/legacyData/juniper.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/aruba.js, server/seed/legacyData/nokia.js, server/seed/legacyData/huawei.js, server/seed/legacyData/fuentes.js, .github/workflows/traer-cisco-huawei.yml, test/pqc.test.js
- **Siguiente paso:** leer lo que trae la corrida de `traer-cisco-huawei.yml` a `fuente/pqc-2-2026-10-27` (manual de PPK y changelog 7.21 de RouterOS, ficha del L009 con wifi, capítulo de PPK de IOS XE, cifrados y notas de ECOS, fichas de Nokia 7750 SR-1x y 7250 IXR) y marcar `pqc` solo donde el documento lo diga

## Encargo del dueño

«Ejecuta la mejora y lo pendiente» (2026-10-27, tras la entrega 59). La mejora propuesta (la
interconexión EdgeHA en el BOM) ya la fusionó otra sesión en el PR #26. De lo pendiente, lo que una
sesión puede hacer sin acceso especial y sin tocar los archivos del tema en curso
`cisco-figuras-excel` (`bom.js`, la página Cisco) es buscar los documentos que faltan; se empieza por
la criptografía post-cuántica, que hoy aparta como «no consta» a Huawei, Aruba, MikroTik, Catalyst
8000, ISR, ASR, Meraki G2-MX, SRX4100 y SRX de sucursal, Nokia 7750 SR-1x, 7250 IXR y 7220 IXR.

## Hecho

- Búsqueda por fabricante (2026-10-27). Pistas con documento oficial: MikroTik (página «QKD Integration in
  RouterOS IPsec (PPK)» del manual; el changelog de la 7.21 la anuncia, «CLI only»), Cisco IOS XE 17
  (capítulo de PPK de la guía de VPN con IPsec, desde la 17.11 según una presentación de Cisco: hay
  que leer el capítulo), Nokia 7750 SR-1x (ficha Release 26, asset 212738, «quantum-safe MACsec
  (ANYsec)»). Sin pista: Huawei (support.huawei.com pide sesión), Aruba (se traen los cifrados del
  plano de datos y las notas de ECOS 9.7.1.0 para comprobarlo), Meraki (solo DH 14/15/21).
- Fichas de MikroTik ya traídas (`fuente/mikrotik-listados-2026-10-13`): dicen «RouterOS v7» las de
  los CCR2004/2116/2216, hEX 2024, hEX S 2025, L009 RM, RB4011 y RB5009; solo «RouterOS» las del
  RB1100AHx4, hEX RB750Gr3, hEX lite, hEX PoE lite, hEX PoE, PowerBox Pro y hEX S RB760iGS.
- Entradas nuevas en `traer-cisco-huawei.yml` para todo lo anterior.

## Falta

- Buscar, por fabricante, el documento oficial (notas de versión, guía de configuración, ficha).
- Traerlo por Actions y leerlo; marcar `pqc` solo con documento, con su fuente en `fuentes.js`.
- Verificar, fusionar, actualizar `PENDIENTES.md` y `RELEVO.md`, borrar este traspaso.

## Decisiones y hallazgos

- Un blog o un resumen de buscador no es fuente: solo notas de versión, guías o fichas del fabricante.
- MikroTik: la PPK es de RouterOS, no de un modelo. Se marca solo donde la ficha dice «RouterOS v7» (y
  CHR, que es RouterOS 7) y el changelog da la versión; donde la ficha dice solo «RouterOS», «no
  consta» con ese motivo, sin deducirlo de la arquitectura.

## Verificación

- (pendiente)
