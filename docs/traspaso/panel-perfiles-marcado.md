# Traspaso: panel-perfiles-marcado

- **Tema:** El marcado del panel de perfiles multi-sede y de su ventana, generado por `BOM.montarPerfiles`
- **Rama:** claude/panel-perfiles-marcado
- **Cuenta:** servicioiptv2025@gmail.com, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-29 14:55
- **Archivos que toca:** public/js/bom.js, public/dimensionador-aruba-edgeconnect.html, public/dimensionador-cisco-catalyst8k.html, public/dimensionador-fortinet-fortigate.html, public/dimensionador-huawei-netengine.html, public/dimensionador-juniper-srx.html, public/dimensionador-mikrotik-routeros.html, public/dimensionador-nokia-7750sr.html, test/bom-panel-perfiles.test.js
- **Siguiente paso:** CI del PR (las baterías `e2e-ciclo-excel`, `e2e-perfiles-juniper-nokia`, `e2e-aruba-fases23` y `e2e-accesibilidad` conducen el panel); si verde, cierre y fusión

## Encargo del dueño

«Ejecutando la mejora propuesta» (2026-10-29): la del cierre del PR #62, que el módulo genere el
marcado del panel de perfiles y que cada página solo deje el hueco.

## Hecho

- `construirPanel` en `bom.js`: formulario con `aria-label`, `#perfilMsg` con `role=status`, lista, «Consolidar» y la ventana con la caja como diálogo; no duplica lo que ya existe.
- Los siete HTML dejan `<section id="panelPerfiles">` con su título y explicación (Aruba, `data-ejemplo="Tienda"`); su copia del formulario y de la ventana, fuera (164 líneas menos).
- Pruebas nuevas en `bom-panel-perfiles.test.js`. Banco estático en Chromium: las seis páginas que montan al cargar tienen cada id una vez, un solo diálogo y la ventana oculta; Nokia monta tras su catálogo (lo conduce CI).

## Falta

- Módulo, siete HTML, pruebas, CI y cierre.

## Decisiones y hallazgos

- Cada página conserva su `<section id="panelPerfiles">` con el título y su párrafo explicativo
  (propio de cada fabricante: Aruba habla del pool de Boost, Fortinet de la puerta de cotización);
  el módulo añade lo común debajo. La ventana la crea el módulo al final de `<body>` con la caja como
  diálogo. Los estilos de `#modalConsolidado` y `.acc-caja` siguen en cada hoja, que ya los tiene.
- Si una página ya trae el marcado (o una prueba con un DOM propio), el módulo no lo duplica.

## Verificación

- `node --test`: los mismos fallos de entorno que `main` (más el e2e sin servidor, también de entorno); lint limpio.
