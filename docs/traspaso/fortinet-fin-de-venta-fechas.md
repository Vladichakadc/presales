# Traspaso: fortinet-fin-de-venta-fechas

- **Tema:** fechas de fin de venta y fin de soporte de Fortinet en la ficha del equipo elegido
- **Rama:** claude/fortinet-fin-de-venta-fechas
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude)
- **Estado:** en curso (sin empujar desde esta sesión: sin permiso de escritura en GitHub)
- **Actualizado:** 2026-10-29 15:10
- **Archivos que toca:** server/seed/legacyData/fortinet.js, server/services/catalogProjection.js, public/js/ficha.js, test/fortinet-fin-de-venta-fechas.test.js
- **Siguiente paso:** confirmar las ocho fechas en la herramienta Product Life Cycle del portal de Fortinet (cuenta FortiCloud); `npm run verificar` con las dependencias instaladas; pantalla de Fortinet con 60F, 1000F y 400F; PR, CI y fusión.

## Encargo del dueño

«Incluye esta información en el dimensionador cuando se selecciona el equipo; por otro lado valida si el 400F tiene fecha de fin de venta, así como el de todos los equipos» (2026-10-29).

## Hecho

- `EOL_ANNOUNCED` en fortinet.js: 60F y 61F (último pedido 2027-01-13), 1000F y 1001F (2026-10-13), 70F, 600F, 100F y 200F, con fin de soporte y `confirmar`.
- La proyección del dimensionador Fortinet usa `fueraDeVenta` (el 1000F deja de recomendarse en compra nueva; el 60F caerá solo el 2027-01-13).
- La ficha dice último pedido, fin de soporte y la nota de confirmación también cuando el modelo trae `eol`.
- 400F, 401F y el resto: sin aviso en ningún repertorio el 2026-10-29; 4200F, 7081F y 7121F no se pudieron leer.

## Decisión pendiente del dueño

Las fechas salen de repertorios de terceros (eol.network, fortineteol.com), no del portal oficial: por la regla de «Nunca se inventa un dato» no se declara `eolAnnounced` en `campos` de fuentes.js. Al confirmarlas en el portal se puede quitar `confirmar` y declarar la fuente.
