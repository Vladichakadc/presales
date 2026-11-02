# Traspaso: fuentes-por-fabricante

- **Tema:** fuentes-por-fabricante
- **Rama:** claude/fuentes-por-fabricante
- **Cuenta:** vladichakadc@gmail.com (sesión 016ruRWCH48mtdRjcg83pvKa)
- **Estado:** en curso: código y pruebas hechos; falta la batería e2e completa, el PR y el cierre
- **Actualizado:** 2026-11-01 23:30
- **Archivos que toca:** server/routes/catalog.js, server/services/catalogProjection.js, public/js/procedencia.js, public/js/bom.js, public/js/dimensionador-fortinet-fortigate.js, test/fuentes-por-fabricante.test.js, test/procedencia-perezosa.test.js, test/e2e/e2e-fuentes-perezosas.js
- **Siguiente paso:** con `npm run e2e` en verde, abrir el PR, escribir la entrega y fusionar tras CI

## Encargo del dueño

«Ejecutar pendientes y mejora propuesta» (2026-11-01): la propuesta al cerrar el PR #120, que la
pestaña «Fuentes» pida solo su fabricante.

## Hecho

- `GET /api/fuentes?vendor=<code>`: la misma forma con un solo fabricante; 404 si no existe, 400 si
  el código está mal formado. Sin `vendor`, los siete (el portal y el PR #118 la leen así).
- Lo piden así `procedencia.js`, la hoja «Supuestos» (`bom.js`) y el arranque de Fortinet.

## Falta

- PR, entrega, RELEVO, CLAUDE.md y fusión.

## Decisiones y hallazgos

- Parámetro y no `GET /api/fuentes/:vendor`: no se mezcla con el `POST` de subida de esa ruta.
- Medido con brotli: 57,3 KB los siete; por fabricante, de 1,9 KB (Nokia) a 19,6 KB (Cisco).

## Verificación

- `verificar` (1376), `pantallas` 17/17, `contraste --todos` (10, cobertura sin cambios), `puerta`,
  contra `NODE_ENV=production`. La prueba del servidor, en rojo con la ruta de antes.
