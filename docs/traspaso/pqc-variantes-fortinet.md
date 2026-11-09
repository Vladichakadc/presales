# Traspaso: pqc-variantes-fortinet

- **Tema:** PQC de las variantes Wi-Fi y celulares de Fortinet que nombra «Supported models» de FortiOS 7.6.7
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-09 07:30
- **Archivos que toca:** server/seed/legacyData/fortinetVariantes.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/fuentes.js, test/pqc.test.js, test/fortinet-wifi-celular.test.js, test/pqc-requisito.test.js
- **Siguiente paso:** e2e de Fortinet, contraste y equivalencia; PR; cierre con entrega, relevo, PENDIENTES y CLAUDE.md

## Encargo del dueño

«Ejecuta los pendientes…» y «Continuar». Es el pendiente del PR #140 «la PQC de las once variantes Wi-Fi y celulares (la cierra "Supported models" de las Release Notes de FortiOS 7.6.7)».

## Hecho

- `fortinetVariantes.js`: `RN767_SOPORTADOS`, los códigos que «Supported models» de 7.6.7 imprime y casan con una variante, y `codigoRn` (SKU sin `-[RC]`).
- `fortinet.js`: `pqcPorRn`, el mismo constructor del 3800G; las diez nombradas lo llevan, el 50G-5G-II no.
- `fuentes.js`: la entrada de las Release Notes 7.6.7 declara y nombra las diez.
- Pruebas: `fortinet-wifi-celular`, `pqc` y `pqc-requisito` al día.

## Falta

- e2e de Fortinet, contraste, equivalencia; PR y cierre.

## Decisiones y hallazgos

- El 50G-5G-II sigue en «no consta»: la lista dice FWF-50G-5G y su SKU es FWF-50G-5G-II; ningún documento traído los iguala («5G-II» solo sale en copias de nuestra página).
- Las limitaciones de 2 GB de RAM de esas notas (proxy, Security Rating, cp-accel-mode) no tocan IPsec.

## Verificación

- `npm run verificar`: 1.453/1.453. Caen los sabotajes (una variante fuera de la fuente; el 50G-5G-II en la lista).
