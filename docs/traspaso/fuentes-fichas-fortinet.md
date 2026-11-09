# Traspaso: fuentes-fichas-fortinet

- **Tema:** fuentes-fichas-fortinet
- **Rama:** claude/fuentes-fichas-fortinet
- **Cuenta:** (no consta)
- **Estado:** en curso
- **Actualizado:** 2026-11-09 13:34
- **Archivos que toca:** server/seed/legacyData/fuentes.js, server/seed/legacyData/fuentes.lock.json, test/fuentes-fichas-fortinet.test.js
- **Siguiente paso:** fusionar después del #152 (tocan las mismas líneas de RELEVO); abrir PR y cierre

## Encargo del dueño

«Ejecuta pendientes y mejora propuesta» (2026-11-09): la propuesta al cerrar el #152, dar a las fichas por serie de Fortinet su URL en fuentes.js.

## Hecho

- Once entradas, una por documento, con URL (de los informes de las ramas fuente/*) y estables; lock del vigía sembrado con la huella de la copia leída; test/fuentes-fichas-fortinet.test.js.

## Falta

- PR y cierre.

## Decisiones y hallazgos


- Solo dos entradas no tenían URL (variantes 30G/50G/70G/40F y 400F/600F/1000F); otras dos agrupaban dos documentos con una URL (100F/200F, 7081F/7121F). Las demás fichas por serie no tienen entrada: su procedencia es el Product Matrix ('*').
- El vigía da por verificada la primera medición: por eso el lock se siembra con la huella de la copia leída (la 40F, R49, no la R48 de la figura).

## Verificación

- lint sin errores; node --test con las mismas caídas que main (dependencias); validarLock acepta el lock sembrado; mutación: quitar la semilla del 400F pone en rojo la prueba.
