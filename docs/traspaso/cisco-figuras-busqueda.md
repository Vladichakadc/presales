# Traspaso: cisco-figuras-busqueda

- **Tema:** Figuras de Cisco: leyendas donde la guía numera la figura y figuras mejores (resolución, trasera que falta) desde las guías oficiales
- **Rama:** claude/cisco-figuras-busqueda
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-27 17:50
- **Archivos que toca:** public/data/cisco-vistas-equipos.json, public/img/equipos/cs-*, test/cisco-leyendas.test.js, test/cisco-vistas-equipos.test.js
- **Siguiente paso:** esperar CI del PR; en verde, actualizar PENDIENTES.md y RELEVO.md, borrar este traspaso y fusionar

## Encargo del dueño

«Realiza una búsqueda avanzada lo los gráficos de los equipos cisco e incluye la tabla en los equipos que faltan y mejora las gráficas de los equipos que consideres necesario utiliza las Skills instaladas».
Entendido: buscar en los documentos oficiales figuras numeradas con su tabla para las caras que no la tienen, y sustituir figuras de baja resolución o sin trasera por la del documento, sin inventar nada.

## Hecho

- Inventario: 33 caras sin leyenda (Meraki y fotos sin números), 6 traseras que faltan, 5 equipos sin entrada, ~20 figuras de menos de 950 px.
- Catalyst 8500-12X4QC, 8500-12X, 8500-20X6C, 8500L-8S4X e ISR 1111X-8P: la frontal pasa de la foto de la ficha (sin números) al dibujo numerado de su guía, con su tabla; la foto queda como pestaña «Foto» (`foto`, `fotoFuente`). Pruebas de figuras y leyendas al día.

## Falta

- CI del PR; PENDIENTES.md y RELEVO.md al fusionar.

## Decisiones y hallazgos

- Solo entra una tabla donde la figura del documento lleva los números; una foto sin números no lleva tabla.
- Meraki: ninguna de sus figuras lleva números (la ilustración del MX250 rotula puertos sobre el dibujo; su tabla «Item 1-3» es de LED y no remite a números dibujados). Quedan sin tabla.
- Resolución: las guías en PDF traen los mismos ráster que su edición HTML (pdfimages, 9 guías): no hay versión mayor de las figuras de baja resolución. Los dibujos de los PDF son vectoriales solo en las portadas.
- Traseras que faltan (C8130H-G2, C8151H-C-G2, C8211-G2, serie 8400, 8500-20X6C): búsqueda web del 2026-10-27 sin documento nuevo; la nota de cada pestaña sigue valiendo.

## Verificación

- `node --test` de las pruebas de figuras y leyendas en verde; eslint limpio; banco de Chromium: lupa del 12X4QC (17 filas), 20X6C (8 filas, pestañas Frontal/Foto) e ISR 1111X-8P a 390 px (19 filas).
