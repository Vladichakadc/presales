# Traspaso: fuentes-perezosas

- **Tema:** fuentes-perezosas
- **Rama:** claude/fuentes-perezosas
- **Cuenta:** vladichakadc@gmail.com (sesión 016ruRWCH48mtdRjcg83pvKa)
- **Estado:** en curso: código y pruebas hechos; falta la batería e2e completa, el PR y el cierre
- **Actualizado:** 2026-11-01 19:40
- **Archivos que toca:** public/js/procedencia.js, test/procedencia-perezosa.test.js, test/e2e/e2e-fuentes-perezosas.js
- **Siguiente paso:** con `npm run e2e` en verde, abrir el PR, escribir la entrega y fusionar tras CI

## Encargo del dueño

«Crea el reloj de la vigilia y avanza para que optimizar la página» (2026-11-01). Tras la compresión
(PR #119), lo siguiente que más pesa al abrir un dimensionador sin hacer falta: `/api/fuentes`.

## Hecho

- `procedencia.js` pide `/api/fuentes` cuando la pestaña «Fuentes» se ve (IntersectionObserver),
  no al abrir la página; sin IntersectionObserver, en el acto. Con permiso `sync`, ya no la pide
  dos veces.
- `test/procedencia-perezosa.test.js` (unidad, sin red) y `test/e2e/e2e-fuentes-perezosas.js`
  (siete páginas en Chromium).

## Falta

- PR, entrega, RELEVO, CLAUDE.md y fusión.

## Decisiones y hallazgos

- Medido: `/api/fuentes` son 253 KB sin comprimir y 57 KB comprimidos; se ahorra por cada
  apertura de un dimensionador (114 KB a un administrador, que la pedía dos veces).
- Fortinet la sigue pidiendo al arrancar por su cuenta (banner, vigencia de la lista, puerta): no
  se toca.
- `test/e2e/e2e-fortinet-rediseno.js` (T24) no hizo falta cambiarlo: `asentar` espera la petición.

## Verificación

- `npm run verificar` (1372 pruebas), `auditar`, `pantallas` 17/17, `contraste --todos` 10 casos,
  `puerta` cerrada, contra un servidor con `NODE_ENV=production`. Las dos pruebas nuevas, en rojo
  contra el código de antes.
