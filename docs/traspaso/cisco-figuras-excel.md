# Traspaso: cisco-figuras-excel

- **Tema:** Las figuras de Cisco, con la tabla de sus números, en el Excel del BOM (mejora aprobada)
- **Rama:** claude/cisco-figuras-excel
- **Cuenta:** servicioiptv2025, sesión 01V8T7S92WvujFK1KCusavSu
- **Estado:** en curso (espera a que el PR #24, con los datos de las leyendas, llegue a main)
- **Actualizado:** 2026-10-27 13:55
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-cisco-catalyst8k.js, test/e2e/e2e-cisco-excel-figuras.js
- **Siguiente paso:** cuando #24 esté en main, rebase, PR y CI; la e2e lee la leyenda del C8130-G2

## Encargo del dueño

«Ejecuta las mejoras propuestas» (2026-10-27, 12:58): la de la sesión de las leyendas, llevar las
figuras de Cisco, con su leyenda, al Excel del BOM.

## Hecho

- `bom.js` (`hojaDeFotos`): opt-in `frontLeyenda`/`rearLeyenda`; bajo cada figura, «Qué es cada
  número de la vista …» y una fila por número («n. traducción — «literal»»). Tabla a medias, fuera.
- Cisco pasa `meta.fotos` (modelo, origen, frontal, trasera, pie = `fuente`, leyendas).
- e2e: descarga el Excel del C8130-G2 y lee la hoja.

## Verificación

- ESLint limpio en los tres archivos.
