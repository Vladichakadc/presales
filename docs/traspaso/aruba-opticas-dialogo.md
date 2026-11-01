# Traspaso: aruba-opticas-dialogo

- **Tema:** la ventana de ópticas y accesorios de Aruba, accesible como la del consolidado
- **Rama:** claude/aruba-opticas-dialogo
- **Cuenta:** vladichakadc@gmail.com (sesión 016ruRWCH48mtdRjcg83pvKa)
- **Estado:** en curso
- **Actualizado:** 2026-11-01 12:20
- **Archivos que toca:** public/js/dimensionador-aruba-edgeconnect.js, public/dimensionador-aruba-edgeconnect.html, test/e2e/e2e-accesibilidad.js
- **Siguiente paso:** verificar, auditar, servidor en producción, pantallas, contraste aruba-underlay, e2e completa, puerta; PR y cierre

## Encargo del dueño

«Ejecuta Mejoras propuestas como un arquitecto senior con los Skills instalados»: la mejora de
RELEVO.md «La ventana de ópticas de Aruba, accesible como la del consolidado» (PR #95).

## Hecho

- `role="dialog"`, `aria-modal` y título enlazado en la caja; el foco entra al abrir; Escape (escuchado
  en la ventana, sin subir al documento), «Cerrar» y pinchar fuera cierran y devuelven el foco a
  «Ópticas y accesorios».
- `e2e-accesibilidad.js`: axe con la ventana abierta y seis comprobaciones de comportamiento. Con el
  código de `main` fallan.

## Falta

- Verificación completa, PR, cierre y fusión.

## Decisiones y hallazgos

- Escape se escucha en la ventana con `stopPropagation` para no cerrar a la vez otra ventana que
  escuche en `document` (el riesgo que nombraba la propuesta).

## Verificación

- `E2E_SOLO=accesibilidad npm run e2e`: verde; con el código de `main`, en rojo.
