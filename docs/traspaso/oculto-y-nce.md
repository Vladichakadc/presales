# Traspaso: oculto-y-nce

- **Tema:** Lo que quedó fuera de main al cerrar la rama duplicada: la casilla de la licencia única y el resumen WAN de Fortinet que `display` muestra aunque lleven `hidden`, y la línea de iMaster NCE-WAN de Huawei, que afirmaba sin fuente cómo se licencia
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-11-01 13:50
- **Archivos que toca:** public/dimensionador-fortinet-fortigate.html (solo el `<style>`), test/oculto-visible.test.js, public/js/huawei-motor.js (la línea de NCE-WAN), test/huawei-nce.test.js, scripts/transporte/documentos.js (entradas al final)
- **Siguiente paso:** regla CSS y prueba del patrón; luego la línea de NCE-WAN con lo que dicen sus documentos

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto.» Las tres mejoras que esta rama llevaba las entregaron
otras sesiones (#58, #60, #62, #67); esto es lo que encontró por el camino y main no tiene.

## Hecho

- (nada aún)

## Falta

1. `.checks[hidden]` y `.wan-resumen[hidden]` en la hoja de Fortinet, y una prueba que recorra las
   páginas: un elemento con `hidden` cuya clase pone `display` necesita su regla `[hidden]`.
2. La línea «Suscripción iMaster NCE-WAN» de Huawei: decir lo que dicen los documentos.

## Decisiones y hallazgos

- Medido en Chromium sobre main (2026-11-01): la casilla «Licencia FortiGuard única del par» se ve sin
  HA y en activo-activo (`hidden` con `display:grid`).

## Verificación

- (pendiente)
