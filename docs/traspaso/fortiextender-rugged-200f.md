# Traspaso: fortiextender-rugged-200f

- **Tema:** Todos los FortiExtender de la ficha y la guía de pedido en la tabla (200F, Vehicle 211F/212F/511G, Rugged 511G), con su ficha Rugged traída; y el transporte de los documentos de FortiOS 8.0
- **Rama:** claude/fortiextender-rugged-200f
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-11-11 22:40
- **Archivos que toca:** scripts/transporte/documentos.js, server/seed/legacyData/fortinetVariantes.js, server/seed/legacyData/fuentes.js, public/js/fortinet-motor.js, test/fortinet-wifi-celular.test.js, test/fortinet-fortiextender-todos.test.js, server/seed/legacyData/fortinet.js, public/js/fortinet-reglas.js, public/dimensionador-fortinet-fortigate.html, public/js/dimensionador-fortinet-fortigate.js, test/fortinet-fortios-8.test.js, test/e2e/e2e-fortinet-fortios-8.js, test/e2e/e2e-fortinet-wifi-celular.js, public/data/fortinet-vistas-equipos.json, scripts/figuras-fortinet.lock.json, public/img/equipos/
- **Siguiente paso:** esperar `verificar`, `pantallas` y `visibles` en el PR; en verde, commit de cierre y fusionar

## Encargo del dueño

«Ejecuta pendientes y mejora propuesta e incluye equipos fortiExtender WAN 50G,511G y todos los equipos referencia FEX y todos los gráficos correspondientes» (2026-11-11). Se entendió: (1) la mejora propuesta al cerrar el PR #166, traer la guía «New Features» y la Maximum Values Table de FortiOS 8.0 y aplicar lo que digan; (2) todos los FortiExtender de la ficha y de la guía de pedido en la tabla del dimensionador; (3) la figura de cada uno, con su lock.

## Hecho

- 495306d: transporte de la ficha Rugged, la QSG del 200F, la guía New Features y la MVT de 8.0 (rama `fuente/fex-fortios8-2026-11-11`).
- f799675: los doce FortiExtender en la tabla (200F sin módem, Vehicle 211F/212F/511G, Rugged 511G) y el entorno del equipo (`fisico.celularEntorno`) en el motor, 7.4.0.
- 958da19: FortiOS 8.0 con los topes que su MVT da distintos (FortiSwitch de 50G, 200G, 2600F; vecinos BGP de 400G, 3000G, 3500G) y las novedades de su guía.
- Este commit: la página (selector «Dónde va el FortiExtender», novedades de la rama en la ayuda) y sus e2e.
- Figuras de cuatro de los cinco nuevos (200F de su QSG; Vehicle 211F, Vehicle 511G y Rugged 511G de la ficha Rugged), ocho archivos, con lock, correlación medida y leyenda en la cara numerada. El Vehicle 212F no tiene dibujo en la ficha: sin figura, y la página lo dice.
- El PR #187 (figuras del FortiExtender elegido en la página y el Excel), del que parte esta rama, ya está en main.

## Falta

- PR, CI (e2e solo corre allí), cierre.

## Decisiones y hallazgos

- Los de vehículo y exterior solo compiten al pedir su entorno: nada cambia para lo guardado (la huella no lleva el campo si está vacío).
- El 200F no tiene módem: está en la tabla y nunca sirve un enlace 4G/5G.

## Verificación

- `node --test test/fortinet-*.test.js`: 203 de 204; la que falla (`haLicenciaUnica llega al navegador`) es del entorno local, que no tiene las dependencias del servidor.
