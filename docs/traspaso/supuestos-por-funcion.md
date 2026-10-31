# Traspaso: supuestos-por-funcion

- **Tema:** «Líneas por función» en la hoja «Supuestos» del Excel (fase 2.1 del plan de mejora de los dimensionadores)
- **Rama:** claude/supuestos-por-funcion
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 16:55
- **Archivos que toca:** public/js/bom.js, test/bom-supuestos.test.js, test/e2e/e2e-por-funcion.js
- **Siguiente paso:** esperar `verificar` y `pantallas` en el PR; en verde, commit de cierre y fusionar

## Encargo del dueño

«Ejecuta lo pendiente del plan aprobado […] utiliza las Skills instaladas para cerrar pendientes»
(2026-10-31). Es la 2.1 del plan aprobado el mismo día, la mejora propuesta al cerrar el PR #70.

## Hecho

- Rama y traspaso.
- `BOM.lineasPorFuncion(filas, POR_FUNCION)` y la sección «LÍNEAS POR FUNCIÓN» de `matrizSupuestos` (antes de los parámetros); `exportarExcel` la alimenta con sus `filasBase`. Tres pruebas en `bom-supuestos.test.js` y el Excel descargado en `e2e-por-funcion.js` (MikroTik, capacitación).

## Falta

- El cambio, sus pruebas, el PR, CI y la fusión.

## Decisiones y hallazgos

- La propuesta original pasaba las filas con `por` por `meta.supuestos` de cinco páginas. No hace
  falta: `exportarExcel(filasBase, meta)` ya recibe las filas que pinta la tabla, con su `por`. La
  sección sale de `bom.js` con la misma regla que la etiqueta en pantalla (`POR_FUNCION.atributo`:
  solo casillas que existen y están marcadas), sin tocar ninguna página.
- La marca va solo en «Supuestos»; la hoja «BOM», la que lee el cliente, no cambia.

## Verificación

- `node --test` de `bom-supuestos` y `por-funcion`: 21 en verde.
- La batería e2e (Excel real de MikroTik): en CI, porque aquí no se instalan dependencias.
