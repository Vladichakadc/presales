# Traspaso: fortiwifi-figuras

- **Tema:** Figuras frontal y trasera de los ocho FortiWiFi (30G, 31G, 50G, 51G, 50G-5G-II, 70G, 71G, 70G-POE) desde la página «Hardware» de sus fichas FGFWF
- **Rama:** claude/fortiwifi-figuras
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en revisión
- **Actualizado:** 2026-11-09 11:20
- **Archivos que toca:** public/data/fortinet-vistas-equipos.json, public/img/equipos/fwf-, test/fortinet-vistas-equipos.test.js
- **Siguiente paso:** con CI en verde, commit de cierre (entrega, línea en CLAUDE.md, borrar este traspaso) y fusionar.

## Encargo del dueño

«Incluir el gráfico de los equipos Fortiwifi»: las figuras de panel de los FortiWiFi en su ficha del
dimensionador de Fortinet, como ya tienen los FortiGate.

## Hecho

- Diez figuras nuevas en `public/img/equipos/fwf-*.webp` (cinco dibujos, frontal y trasera), de las
  fichas FGFWF-30G-DAT-R07, FGFWF-50G-DAT-R17 y FGFWF-70G-DAT-R09 que `fuente/fortinet-serie` trajo el
  2026-09-03: página 7 (30G/31G, 50G/51G, 70G/71G), 10 (50G-5G-II) y 8 (70G-POE).
- Ocho entradas en `fortinet-vistas-equipos.json`, con pie que cita ficha, edición, página, rótulo
  literal y unidad dibujada; párrafo nuevo en `_procedencia`.
- `test/fortinet-vistas-equipos.test.js`: acepta la página real del dibujo, cuenta `fwf-*` entre las
  huérfanas y comprueba los ocho FortiWiFi (dos caras propias, pares que comparten, páginas 8 y 10).

## Falta

- Commit de cierre: `docs/entregas/2026-11-09-pr-N.md`, una frase en CLAUDE.md (Fortinet, figuras).

## Decisiones y hallazgos

- Los paneles son dibujos vectoriales, no imágenes incrustadas: se rasterizan a 600 ppp, se recortan
  al panel (primera y última fila con tinta en más de la mitad del ancho, para dejar fuera las llamadas
  numeradas) y se escalan a 1.600 px con 6 px de margen, como las fg-*.webp.
- Cara: la trasera es la que lleva la entrada de alimentación (DC+12V o DC+54V), la misma ancla que
  los FortiGate. En la trasera del 50G-5G-II quedan tres trazos de las llamadas que el propio
  documento dibuja hasta las antenas; se dejan porque son parte de la figura.
- La página busca la figura por `VISTAS[m.id]`: no hace falta tocar código, ni `fortinet.js` ni
  `fortinetVariantes.js` (tomados por el PR #146).

## Verificación

- `node --test test/fortinet-vistas-equipos.test.js`: 13/13. Mutación de control: la trasera del
  FortiGate 70G puesta al FortiWiFi 70G da rojo.
- En este contenedor npm no instala (fallo interno de npm), así que no se condujo la ficha en un
  navegador aquí: lo hacen `pantallas` y `visibles` en CI.
