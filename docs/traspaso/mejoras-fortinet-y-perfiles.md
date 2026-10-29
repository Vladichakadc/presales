# Traspaso: mejoras-fortinet-y-perfiles

- **Tema:** Tres mejoras propuestas aprobadas por el dueño: licencia FortiGuard única elegible en el BOM de Fortinet, el override por ciclo de vida a ampliación/renovación en un clic, y el panel de perfiles en un solo módulo
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-29 10:40
- **Archivos que toca:** scripts/transporte/documentos.js (entradas al final), public/js/fortinet-reglas.js, public/js/fortinet-motor.js, public/js/dimensionador-fortinet-fortigate.js, public/dimensionador-fortinet-fortigate.html, server/routes/fortinet.js, test/fortinet-reglas.test.js, test/fortinet-motor.test.js, test/fortinet-ha-licencia.test.js, test/e2e/e2e-fortinet-ha-licencia.js, test/e2e/e2e-fortinet-rediseno.js, public/js/bom.js, public/js/dimensionador-aruba-edgeconnect.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-nokia-7750sr.js, public/dimensionador-aruba-edgeconnect.html, public/dimensionador-cisco-catalyst8k.html, public/dimensionador-huawei-netengine.html, public/dimensionador-juniper-srx.html, public/dimensionador-mikrotik-routeros.html, public/dimensionador-nokia-7750sr.html, test/bom-perfiles.test.js, test/e2e/e2e-ciclo-excel.js, test/e2e/e2e-perfiles-juniper-nokia.js, test/e2e/e2e-perfiles-panel.js
- **Siguiente paso:** pendientes con fuente oficial que se puedan cerrar desde una sesión; luego verificación con navegador completa, PR y cierre

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto» (2026-10-29). Las propuestas sin decidir de RELEVO.md
quedan aprobadas. «El transporte, probado sin red» lo lleva otra sesión (PR #57): no se toca.

## Hecho

- Licencia FortiGuard única del par, elegible en el BOM (e53b4f5): casilla en activo-pasivo; dos SKU
  de HA con su precio de la lista firmada y un solo bundle al vSN, sin SKU combinado; si no se puede,
  lo dice y sigue por nodo (activo-activo, otro modelo, sin SKU de HA, sin bundle, o algo a la carta).
- Override por ciclo de vida en un clic (56ff4bd): «Es una ampliación» / «Es una renovación» en la
  caja cuando solo aparta CICLO_VIDA; foco a la justificación; T21 y T02 del e2e.
- Panel de perfiles en un solo módulo: `BOM.montarPerfiles` genera el panel y la ventana (diálogo con
  nombre, Escape, fondo, foco de vuelta) y hace guardar, cargar, borrar y consolidar; las siete
  páginas dan solo lo suyo (ganchos `capturar`/`aplicar`/`migrar`/`consolidado`/`antes`…).

## Falta

1. Licencia FortiGuard única elegible en el BOM (propuesta del PR #56).
2. Override por ciclo de vida: «Es una ampliación/renovación» en la caja (propuesta del PR #51).
3. Panel de perfiles en un solo módulo, `BOM.montarPerfiles` (propuesta del PR #55).
4. Pendientes con fuente oficial que se puedan cerrar desde una sesión.

## Decisiones y hallazgos

- Dentro de bom.js `CSS` es la hoja de estilos del BOM: tapa `CSS.escape` del navegador. El módulo
  busca el botón del grupo por `dataset`, no por selector.
- La casilla de la licencia única iba en un `.checks` con `display:grid`, que anula `hidden`: se
  envolvió en un `.field`, como el modo del clúster.
- `innerText` de una fila de la tabla del BOM pega las celdas sin separador: las pruebas leen celda
  a celda.

## Verificación

- (pendiente)
