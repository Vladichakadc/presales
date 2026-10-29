# Traspaso: perfiles-un-modulo

- **Tema:** el panel de perfiles multi-sede de las siete páginas, en un solo módulo (`BOM.montarPerfiles`)
- **Rama:** claude/perfiles-un-modulo
- **Cuenta:** vladichakadc@gmail.com (sesión 016ruRWCH48mtdRjcg83pvKa)
- **Estado:** cerrado sin fusionar: duplicado del PR #62 (claude/panel-perfiles-modulo), declarado antes
- **Actualizado:** 2026-10-28 21:45
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-aruba-edgeconnect.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-fortinet-fortigate.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-nokia-7750sr.js, public/dimensionador-aruba-edgeconnect.html, test/bom-perfiles.test.js, test/e2e/
- **Siguiente paso:** ninguno en esta rama. Si el dueño lo quiere, `test/e2e/e2e-perfiles-modulo.js` (Huawei, MikroTik, Cisco y Aruba en Chromium) se puede llevar al PR #62 tras su fusión

## Encargo del dueño

«Ejecuta Mejoras propuestas como un arquitecto senior con los Skills instalados»: la segunda de
RELEVO.md, «el panel de perfiles, un solo módulo».

## Hecho

- `BOM.montarPerfiles(cfg)` en bom.js: lista, guardar (con mensaje), cargar, borrar, consolidar,
  ventana con `role="dialog"`, `aria-modal`, título, Escape y cerrar pinchando fuera.
- Las siete páginas lo montan y solo declaran lo suyo (Aruba: reglas del pool y Orchestrator,
  VPNC, cliente; Fortinet: su puerta `confirmar`, huella, estado de «Consolidar»).
- Aruba gana el `#perfilMsg` que las otras seis ya tenían.
- `test/bom-perfiles.test.js`: las pruebas textuales miran el módulo y exigen que ninguna página
  lleve su copia; tres pruebas conducen el módulo con un DOM mínimo.

## Falta

- verificar (1221/1221) y auditar en verde; faltan, auditar, pantallas, contraste, e2e, puerta; PR y cierre.

## Decisiones y hallazgos

- El marcado sigue en cada página (mismos ids): mover el HTML habría tocado siete páginas sin
  ganar nada que el módulo no ponga solo.

## Verificación

- `node --test test/bom-perfiles.test.js`: 18/18. Lint limpio en lo tocado.

## Cierre

- El mismo tema lo declaró antes otra sesión (rama `claude/panel-perfiles-modulo`, PR #62, commit de
  las 21:22 contra el primero de esta rama a las 21:25). Por la regla de traspaso no se toma un tema
  ajeno: esta rama no se fusiona. Lo que esta tiene y la otra no, por si se quiere llevar: la batería
  `e2e-perfiles-modulo.js` y la prueba que rechaza en una página cualquier oyente propio de la
  ventana (`'modalConsolidado').hidden = …`, `$('consolidadoCerrar')`).
