# Traspaso: perfiles-un-modulo

- **Tema:** el panel de perfiles multi-sede de las siete páginas, en un solo módulo (`BOM.montarPerfiles`)
- **Rama:** claude/perfiles-un-modulo
- **Cuenta:** vladichakadc@gmail.com (sesión 016ruRWCH48mtdRjcg83pvKa)
- **Estado:** en curso
- **Actualizado:** 2026-10-28 16:30
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-aruba-edgeconnect.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-fortinet-fortigate.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-nokia-7750sr.js, public/dimensionador-aruba-edgeconnect.html, test/bom-perfiles.test.js, test/e2e/
- **Siguiente paso:** batería e2e del panel común (Huawei, MikroTik, Aruba, Cisco) y verificación completa en modo producción

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

- Batería e2e; verificar, auditar, pantallas, contraste, e2e, puerta; PR y cierre.

## Decisiones y hallazgos

- El marcado sigue en cada página (mismos ids): mover el HTML habría tocado siete páginas sin
  ganar nada que el módulo no ponga solo.

## Verificación

- `node --test test/bom-perfiles.test.js`: 18/18. Lint limpio en lo tocado.
