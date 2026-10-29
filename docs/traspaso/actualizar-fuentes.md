# Traspaso: actualizar-fuentes

- **Tema:** El botón «Actualizar fuentes» de la pestaña «Fuentes y Referencias» comprueba en vivo cada documento oficial
- **Rama:** claude/actualizar-fuentes
- **Cuenta:** servicioiptv2025@gmail.com, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-29 15:10
- **Archivos que toca:** server/vigiaEnVivo.js, server/server.js (solo la ruta `/api/fuentes/:vendor/salud`), scripts/vigia-fuentes.js (`revisar` acepta un tiempo límite), public/js/procedencia.js, test/vigia-en-vivo.test.js
- **Siguiente paso:** `server/vigiaEnVivo.js` con la regla del vigía, la ruta y el botón

## Encargo del dueño

«Autorizo conectar el repositorio presales con escritura y publicar el botón Actualizar en
producción» (2026-10-29). Preguntado a qué botón se refería (no había ninguno pendiente), eligió
«Actualizar fuentes»: en «Fuentes y Referencias», comprobar las fuentes oficiales a demanda.

## Hecho

- (nada todavía)

## Falta

- Servidor, ruta, botón, pruebas, CI y cierre.

## Decisiones y hallazgos

- El botón «↻ Actualizar» que ya existía solo volvía a leer la tabla del propio servidor; la ruta
  `/api/fuentes/:vendor/salud` (que sí lee cada URL) solo la usaba un botón de Aruba y no comparaba
  con lo verificado. Ahora la ruta aplica `clasificar` del vigía contra `fuentes.lock.json`, y el
  botón de las siete pestañas la llama y pinta «Comprobado ahora» por documento.
- Solo lee: no escribe el lock (vive en el repositorio; `--revisado` sigue siendo humano) ni el
  catálogo. Un resultado por fabricante cada 10 minutos (caché y una sola corrida a la vez) y cuatro
  descargas en paralelo: cada comprobación pega contra los servidores del fabricante.
- Sin SSRF: solo se piden las URL de `legacyData/fuentes.js`, que vienen del repositorio.

## Verificación

- (pendiente)
