# Traspaso: leyendas de las figuras de Cisco

- **Tema:** tabla número → qué es en las figuras de Cisco (lupa y tarjeta del dimensionador)
- **Rama:** claude/leyendas-figuras-cisco
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en curso
- **Actualizado:** 2026-10-27 14:10
- **Archivos que toca:** public/data/cisco-vistas-equipos.json, public/js/ficha.js, test/cisco-leyendas.test.js, test/e2e/e2e-cisco-leyendas.js
- **Siguiente paso:** abrir el PR, esperar `verificar` y `pantallas` en verde y fusionar con PENDIENTES y RELEVO

## Encargo del dueño

«Analiza el dimensionador cisco y mejora las imágenes ya que están con la imagen relaciona los
puertos por números pero no muestra la tabla de los números al ampliar la imagen deberá mostrar la
tabla donde se indica a qué hace referencia cada puerto con su número».

Se entendió: las figuras oficiales llevan números (callouts) cuya leyenda está en el documento y no
en la página; al ampliar (lupa) tiene que aparecer la tabla número → qué es.

## Hecho

- Inventario de las 78 figuras: 38 caras de Cisco llevan números; las de Meraki y las fotos de
  producto de las fichas del Catalyst 8500 y del ISR 1111X-8P no llevan ninguno.
- Leyendas leídas de los mismos documentos que cita cada `fuente` (ramas `fuente/cisco-*`).

- 67 caras de 38 modelos con `frontLeyenda`/`rearLeyenda` en `cisco-vistas-equipos.json`
  (`[n, literal, traducción]` y la tabla de origen); `_leyendas` declara la procedencia.
- `ficha.js`: la lupa pinta la tabla bajo la figura y la cambia con la cara (pestañas y flechas);
  la tarjeta la ofrece plegada («Qué es cada número (N)»). Más de 8 números: dos columnas en
  pantalla ancha; en móvil se oculta la columna del literal.
- `test/cisco-leyendas.test.js` y la batería `e2e-cisco-leyendas.js`.

## Falta

- CI (`verificar`, `pantallas` con la e2e nueva) y fusión.

## Decisiones y hallazgos

- Se guarda el rótulo literal del documento y su traducción; la pantalla enseña la traducción y,
  al lado, el literal.
- La trasera compartida de los 8500 de 1RU: la guía del Secure Router 8500 rotula 1-7; la del
  Catalyst 8500 solo 1-6 (su fila 7 es «—»). Cada modelo lleva la de su guía.
- Los PDF a dos columnas de las guías del Catalyst invierten los números de dos cifras al
  extraerlos («21» por 12): se transcribieron por posición, no copiando el número.

## Verificación

- `npm run lint` limpio; `test/cisco-leyendas.test.js` y `test/cisco-vistas-equipos.test.js` en verde.
- `npm install` se corta en este entorno («Exit handler never called», y el registro no resuelve
  para la auditoría): express, sequelize y el SDK quedan sin instalar y las pruebas que arrancan el
  servidor fallan por eso, no por el cambio. Lo completo lo corre CI.
- La interfaz se condujo en Chromium con un banco estático del `ficha.js` real (C8130-G2 a 1280 y
  390 px, Catalyst 8300-2N2S-6T con 19 números): tabla, cambio de cara y sin errores de consola.
