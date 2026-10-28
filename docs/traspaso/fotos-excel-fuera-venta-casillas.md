# Traspaso: fotos-excel-fuera-venta-casillas

- **Tema:** Foto de producto en el Excel; rojo en el desplegable para fuera de venta y fin de venta anunciado; casillas de funciones resaltadas al activarse
- **Rama:** claude/fotos-excel-fuera-venta-casillas
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-27 21:50
- **Archivos que toca:** public/js/bom.js, public/js/ficha.js, public/js/dimensionador-*.js (selectores de equipo y meta.fotos), public/dimensionador-*.html (enlace a la hoja común), public/controles.css, test/vistas-leyendas.test.js, test/e2e/e2e-leyendas-juniper.js, test nuevos de ciclo y casillas
- **Siguiente paso:** marcar las opciones de los selectores de equipo con su ciclo de vida (FICHA) y la hoja común de estilos

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas. Ejecuta la mejora propuesta. Quiero que resaltes en rojo en el combo cuando los equipos están o van a estar fuera de venta. Quiero que resaltes cuando se activa una funcionalidad activando el check para que los usuarios diferencien cuando se activa o se desactiva una funcionalidad en los dimensionadores».

## Hecho

- La foto de producto en la hoja «Fotos del equipo» (bom.js) y en `meta.fotos` de Cisco y Juniper; prueba y e2e de Juniper.

## Falta

- Rojo en los desplegables; casillas resaltadas; banco en Chromium; CI; fusionar.

## Decisiones y hallazgos

- `--red` de cada página es el color de marca (Aruba verde, Cisco azul): el rojo del fin de venta es un rojo fijo, no esa variable.

## Verificación

- `node --test test/vistas-leyendas.test.js` en verde.
