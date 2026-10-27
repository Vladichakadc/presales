# Traspaso: aruba-edgeha-bom

- **Tema:** La interconexión EdgeHA en el BOM por el puerto que le toca (mejora propuesta de la entrega 59, aprobada)
- **Rama:** claude/aruba-edgeha-bom
- **Cuenta:** servicioiptv2025, sesión 01V8T7S92WvujFK1KCusavSu
- **Estado:** listo para fusionar si CI pasa
- **Actualizado:** 2026-10-27 13:45
- **Archivos que toca:** public/js/dimensionador-aruba-edgeconnect.js, test/e2e/e2e-aruba-edgeha-cobre.js
- **Siguiente paso:** PR con CI en verde (pantallas corre las baterías e2e de Aruba), borrar este traspaso y fusionar; PENDIENTES y RELEVO en el cierre conjunto

## Encargo del dueño

«Ejecuta las mejoras propuestas» (2026-10-27, 12:58). La de la entrega 59: si la interconexión va
por RJ-45, un latiguillo y ninguna óptica; si va por una jaula, dos ópticas de ese tipo y velocidad.

## Hecho

- `interconexionEdgeHA()`: lee el puerto que elige `ArubaReglas.asignarPuertosPar` y devuelve
  cobre / óptica (velocidad que admite la jaula y cubre el agregado) / sin puerto / sin óptica.
- La usan el builder, el asistente de cableado y el BOM (antes, tres copias de la regla por velocidad).
- Cobre con agregado > 1 GbE: aviso (regla de la casa ≥ agregado).
- `NOMBRE_PUERTO` sube junto a `LAN_RESERVADOS` (lint: uso antes de definir).
- e2e nueva: par de EC-10104 con dos RJ-45 → latiguillo, sin selector, BOM sin pendiente.

## Decisiones y hallazgos

- La auditoría elige el puerto por tipo, no por velocidad: un RJ-45 de 1 GbE puede quedar corto con
  enlaces grandes. No se cambió la auditoría (cambiaría qué chasis caben); se avisa.
- Sin inventario de puertos (virtual) se queda la regla anterior, por velocidad.

## Verificación

- ESLint del repositorio (global de la imagen) limpio en los dos archivos.
- El escenario de e2e-desbordamiento-ec (EC-10150, solo SFP28) sigue con su selector 10G.
