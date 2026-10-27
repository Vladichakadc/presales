# Traspaso: interconexión EdgeHA elegida también por velocidad

- **Tema:** que la auditoría del par EdgeHA elija el puerto de la interconexión por el agregado del sitio
- **Rama:** claude/edgeha-velocidad
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en curso
- **Actualizado:** 2026-10-27 16:00
- **Archivos que toca:** public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, test/aruba-puertos.test.js
- **Siguiente paso:** pasar `haMbps` y `haVel` desde interconexionEdgeHA y auditarPuertos; pruebas

## Encargo del dueño

«Ejecutar mejora propuesta y pendientes». La mejora del relevo: «que la auditoría del par EdgeHA
elija el puerto de la interconexión también por velocidad».

## Hecho

- `asignarPuertosPar(puertos, enlaces, lan, opts)`: con `opts.haMbps`, el tipo común libre más
  barato que cubre el agregado; si ninguno, el más rápido utilizable (`haCubre: false`).

## Falta

- La página, las pruebas, CI y fusión.

## Decisiones y hallazgos

- El riesgo del relevo («un chasis que hoy cabe dejaría de caber») no se da: la interconexión se
  elige tras los enlaces y antes de los LAN, que caben en cualquier tipo; cambia el tipo, no la cuenta.
- Lo que alcanza cada jaula lo dice la página por las ópticas de su catálogo (`haVel`): una jaula
  sin óptica que cubra no se elige por encima de un cobre que sí se puede montar.

## Verificación

- Pendiente.
