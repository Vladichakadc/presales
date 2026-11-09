# Traspaso: revision-documentos-2026-11-09

- **Tema:** documentos oficiales de los pendientes que no son de PQC, y las Release Notes de FortiOS 7.6.8 y 8.0.2 para el FortiWiFi 50G-5G-II
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-09 14:04
- **Archivos que toca:** scripts/transporte/documentos.js, RELEVO.md, PENDIENTES.md
- **Siguiente paso:** lanzar el transporte desde esta rama (`solo`: los tres archivos nuevos; `rama`: `fuente/fortios-rn-2026-11-09`), comparar la huella de los PDF y escribir el cierre

## Encargo del dueño

«Ejecuta pendientes y trae los documentos oficiales». Los de PQC los revisó a la vez otra sesión (PR #154). Aquí van los que no son de PQC y las Release Notes más recientes de FortiOS, que el PR #154 daba por no publicadas.

## Hecho

- Transporte de los pendientes que no son de PQC: corrida 42676343633, rama `fuente/pendientes-no-pqc-2026-11-09`. Leídos los cinco documentos que llegaron.
- Tres entradas nuevas en `scripts/transporte/documentos.js`: las Release Notes de FortiOS 7.6.8 y 8.0.2 (PDF) y la página «Supported models» de la 7.6.8.

## Falta

- Traer las tres entradas nuevas por Actions y comparar su huella con la copia leída en la sesión.
- Corregir en `RELEVO.md` y `PENDIENTES.md` «no hay una 7.6.8 publicada», y anotar lo revisado de MikroTik, Meraki y Juniper.
- PR, entrega, CI, fusión y sonda.

## Decisiones y hallazgos

- **FortiOS 7.6.8 sí está publicada** (build 3744, primera edición del 2026-10-22, última del 2026-11-03). Su «Supported models» dice `FWF-50G-5G`, no `FWF-50G-5G-II`. La de 8.0.2 (build 0251), lo mismo. El 50G-5G-II sigue en «no consta».
- La 7.6.8 pasa a su lista principal el 400G, el 3000G y el 3500G (con sus -1), que en la 7.6.6 iban en rama especial. No cambia su PQC, que ya llevan; `fuentes.js` lo tiene tomado otro tema y no se toca.
- MikroTik: la matriz vigente sigue sin nombrar el CCR2004-16G-2S+PC, y la página IPsec del manual no dice si su cifra es por sentido.
- Meraki: la guía de instalación de los C8111/C8121-G2-MX solo dice «2.5 MGig»; la página «WAN Behavior» no los nombra.
- Juniper: las páginas HTML de las fichas SSR responden 200 pero ya no traen la ficha; sus PDF siguen en la lista con otra entrada.

## Verificación

- `node --test test/transporte-documentos.test.js test/traer-exploracion.test.js test/transporte-traer.test.js`: en verde.
