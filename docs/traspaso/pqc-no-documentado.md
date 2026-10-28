# Traspaso: pqc-no-documentado

- **Tema:** Un «no la trae» de PQC con su documento (`pqcNo`), y los pendientes que se pueden cerrar sin acceso especial
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 21:30
- **Archivos que toca:** public/js/pqc.js, public/js/ficha.js, public/js/comparador.js, public/js/bom.js, public/js/dimensionador-aruba-edgeconnect.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-fortinet-fortigate.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-nokia-7750sr.js, server/seed/legacyData/cisco.js, server/seed/legacyData/aruba.js, server/seed/legacyData/indexPR.js, server/seed/legacyData/fuentes.js, test/pqc.test.js, test/pqc-requisito.test.js, test/bom-supuestos.test.js
- **Siguiente paso:** pruebas de `pqcNo` (pqc, requisito, comparador, Supuestos) y de la ranura reservada de Aruba; después verificar, navegador, cierre y fusión

## Encargo del dueño

«Ejecuta los pendientes que puedas y la mejora propuesta» (2026-10-28). La mejora: decir «no la trae,
y por qué» cuando un documento lo prueba (el ASR 1001-X, cuyo boletín lo deja en la 17.9).

## Hecho

- `pqcNo: {motivo, corto, fuente}` en el ASR 1001-X (`cisco.js`); `PQC.motivo` dice «no la trae — …»
  solo con motivo y fuente; la ficha, el Comparador y la hoja «Supuestos» lo pintan con su fuente; las
  siete páginas pasan `pqcNo`; la entrada del boletín declara `pqcNo` y el ASR 1001-X.
- Pendiente de Aruba cerrado: las QuickSpecs 9100 y 9200 dan «Expansion Slot (Reserved for Future
  Use)»; el catálogo lo dice («1 ranura de expansión reservada para uso futuro»).
- Buscados sin resultado: Meraki MX, SRX de sucursal y SRX4100, Nokia 7220 IXR-D, los tres MikroTik
  (el «Upgrading to v7» solo pide 64 MB de RAM: no dice que cada modelo corra la v7).

## Falta

- Pruebas, verificar, navegador; PENDIENTES (también cerrar el pendiente del piloto de IA, retirado
  en el #34), RELEVO, CLAUDE.md; borrar este traspaso; PR y fusionar.

## Decisiones y hallazgos

- Un «no» solo con documento: `pqcNo` sin `fuente` se ignora (sigue «no consta»).

## Verificación

- (pendiente)
