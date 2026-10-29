# Traspaso: panel-perfiles-modulo

- **Tema:** el panel de perfiles multi-sede de las siete páginas, un solo módulo (`BOM.montarPerfiles`)
- **Rama:** claude/panel-perfiles-modulo
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude)
- **Estado:** en curso
- **Actualizado:** 2026-10-28 23:30
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-aruba-edgeconnect.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-fortinet-fortigate.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-nokia-7750sr.js, test/bom-perfiles.test.js, test/bom-panel-perfiles.test.js
- **Siguiente paso:** esperar CI del PR (e2e-ciclo-excel, e2e-perfiles-juniper-nokia, e2e-aruba-fases23 conducen el panel); cierre y fusión.

## Encargo del dueño

«Ejecuta las mejoras propuestas como un arquitecto senior con las Skills instaladas» (2026-10-28). Esta es la propuesta al cerrar el PR #55.

## Hecho

- `BOM.montarPerfiles(opciones)` en bom.js: lista, guardar, cargar, eliminar, consolidar y la ventana; `BOM.pintarPerfiles()` repinta el panel montado. Lo propio de cada fabricante entra por opciones (reglas, notas, aviso y nota multi-fabricante, `extra`, contexto, descuento, `antes`, `envolver`, `alPintar`).
- Las siete páginas montan el módulo y declaran solo lo suyo; su copia del bloque se quitó.
- Lo que había divergido, igualado a la mejor variante: `role="dialog"`/`aria-modal`/`aria-labelledby` en las siete, Escape y clic fuera cierran en las siete, el foco vuelve al botón, línea de mensajes (`#perfilMsg`, `role="status"`) también en Aruba, aviso al cargar.

## Falta

- CI y cierre.

## Decisiones y hallazgos

- El marcado HTML no se regenera: los ids son el contrato y ya eran los mismos en las siete. Lo que faltaba (rol de la ventana, `#perfilMsg`) lo pone el módulo al montar. Menos riesgo que reescribir siete HTML.
- graphify no se pudo usar: PyPI bloqueado por el proxy de egreso en esta sesión.

## Verificación

- `test/bom-panel-perfiles.test.js` (7): conduce el módulo con un DOM mínimo y comprueba que ninguna página conserva su copia. `test/bom-perfiles.test.js`: las reglas del ciclo, ahora en el módulo. Batería completa: las mismas fallas que main.
