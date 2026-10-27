# Traspaso: figuras de Juniper con su leyenda en el Excel

- **Tema:** las figuras de Juniper y la tabla de sus números en la hoja «Fotos del equipo» del Excel del BOM
- **Rama:** claude/juniper-excel-figuras
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en curso
- **Actualizado:** 2026-10-27 16:20
- **Archivos que toca:** public/js/dimensionador-juniper-srx.js, public/js/bom.js, test/vistas-leyendas.test.js, test/e2e/e2e-leyendas-juniper.js
- **Siguiente paso:** CI (`verificar`, `pantallas` con la e2e ampliada) y fusión con PENDIENTES, RELEVO y CLAUDE.md

## Encargo del dueño

«Si ejecuta la mejora propuesta»: las figuras de Juniper, con su leyenda, en el Excel del BOM.

## Hecho

- `dimensionador-juniper-srx.js`: `meta.fotos` con frontal, trasera, pie y `frontLeyenda`/`rearLeyenda`.
- e2e: descarga el Excel y comprueba las dos imágenes, la tabla bajo cada cara y el orden BOM/Supuestos.

## Falta

- CI y fusión.

## Decisiones y hallazgos

- La foto de producto (tercera pestaña) no va al Excel: la hoja de fotos solo lleva frontal y trasera,
  como en los demás fabricantes.

## Verificación

- Lint y `test/vistas-leyendas.test.js` en verde; el Excel lo comprueba la e2e en CI.
