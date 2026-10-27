# Traspaso: aruba-edgeha-velocidad

- **Tema:** La auditoría del par EdgeHA elige el puerto de la interconexión también por velocidad (mejora aprobada)
- **Rama:** claude/aruba-edgeha-velocidad
- **Cuenta:** servicioiptv2025, sesión 01V8T7S92WvujFK1KCusavSu
- **Estado:** listo para fusionar si CI pasa
- **Actualizado:** 2026-10-27 15:55
- **Archivos que toca:** public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, test/aruba-puertos.test.js, test/e2e/e2e-aruba-edgeha-cobre.js, PENDIENTES.md, RELEVO.md, CLAUDE.md
- **Siguiente paso:** PR con CI en verde y fusionar (el cierre de PENDIENTES, RELEVO y CLAUDE.md va en la misma rama)

## Encargo del dueño

«Hazlo» (2026-10-27, 15:42), a la mejora propuesta de la entrega 62.

## Hecho

- `asignarPuertosPar`: entre los tipos libres en los dos chasis, el primero que cubre el agregado
  de los enlaces (empezando por el RJ-45); si ninguno, el más rápido. `VEL_TIPO` exportado.
- Aviso de la página para el cobre corto, reescrito; prueba unitaria y caso e2e (EC-10106, 2×5 Gbps).

## Decisiones y hallazgos

- Lo que cabe no cambia: la interconexión gasta un puerto por chasis igual, y los LAN aceptan
  cualquier tipo. El riesgo que se temía al proponerla no se da.

## Verificación

- `test/aruba-puertos.test.js` 12/12; ESLint limpio en los cuatro archivos.
