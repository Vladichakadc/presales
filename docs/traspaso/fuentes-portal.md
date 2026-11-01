# Traspaso: fuentes-portal

- **Tema:** comprobar las fuentes de los siete fabricantes desde el portal, de una en una, con la ruta de salud de cada uno
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-01 18:00
- **Archivos que toca:** public/index.html, public/js/fuentes-portal.js, public/js/index.js, test/fuentes-portal.test.js, test/e2e/e2e-fuentes-portal.js, test/e2e/e2e-accesibilidad.js
- **Siguiente paso:** escribir `public/js/fuentes-portal.js` (núcleo puro en serie y su pintado) y la página «Fuentes oficiales» del portal

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto.» Es la mejora «Comprobar las fuentes de los siete
fabricantes desde el portal» (propuesta al cerrar el PR #71, en *Mejoras propuestas sin decidir*).

## Hecho

- Nada todavía.

## Falta

- Módulo, página, prueba en Node que fije la serie, batería e2e con la ruta simulada (no pega a los
  fabricantes), la pantalla en `e2e-accesibilidad.js`, verificación, PR, entrega y relevo.

## Decisiones y hallazgos

- La ruta ya existe (`GET /api/fuentes/:vendor/salud`, `server/vigiaEnVivo.js`): caché de 10 min por
  fabricante, cuatro descargas a la vez dentro de un fabricante. El servidor no cambia.
- De uno en uno: el siguiente fabricante se pide cuando el anterior respondió, para no sumar siete
  corridas contra los fabricantes a la vez (lo exige la propuesta).
- Los siete son los de `NAVFAB.FABRICANTES`, los que tienen pestaña «Fuentes» (`?tab=src`). Starlink
  no la tiene; sus fuentes las vigila el vigía.

## Verificación

- Pendiente.
