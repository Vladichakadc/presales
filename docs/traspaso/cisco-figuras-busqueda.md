# Traspaso: cisco-figuras-busqueda

- **Tema:** Figuras de Cisco: leyendas donde la guía numera la figura y figuras mejores (resolución, trasera que falta) desde las guías oficiales
- **Rama:** claude/cisco-figuras-busqueda
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-27 17:10
- **Archivos que toca:** public/data/cisco-vistas-equipos.json, public/img/equipos/cs-*, test/cisco-leyendas.test.js, test/cisco-vistas-equipos.test.js
- **Siguiente paso:** extraer con pdfimages las figuras numeradas de las guías de hardware ya traídas (fuente/cisco-secure-*) y casarlas con las caras sin leyenda o de baja resolución

## Encargo del dueño

«Realiza una búsqueda avanzada lo los gráficos de los equipos cisco e incluye la tabla en los equipos que faltan y mejora las gráficas de los equipos que consideres necesario utiliza las Skills instaladas».
Entendido: buscar en los documentos oficiales figuras numeradas con su tabla para las caras que no la tienen, y sustituir figuras de baja resolución o sin trasera por la del documento, sin inventar nada.

## Hecho

- Inventario: 33 caras sin leyenda (Meraki y fotos sin números), 6 traseras que faltan, 5 equipos sin entrada, ~20 figuras de menos de 950 px.

## Falta

- Casar figuras de las guías con las caras del inventario; JSON, imágenes, pruebas; CI; fusionar.

## Decisiones y hallazgos

- Solo entra una tabla donde la figura del documento lleva los números; una foto sin números no lleva tabla.

## Verificación

- Pendiente.
