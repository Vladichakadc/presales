# Traspaso: playwright-chromium-parcheado

- **Tema:** Subir Playwright 1.61.1 -> 1.64.1 (Chromium 156, parche CVE-2026-87491) desactivando RenderDocument para conservar la cobertura del contraste
- **Rama:** claude/playwright-chromium-parcheado
- **Cuenta:** vladichakadc (claude.ai, sesión remota)
- **Estado:** reservado
- **Actualizado:** 2026-11-03 07:30
- **Archivos que toca:** scripts/ayuda/chromium.js, scripts/contraste.js, scripts/ayuda/cobertura.js, .github/workflows/pantallas.yml, .github/workflows/limites.yml, test/workflows-imagen.test.js, test/chromium-lanzamiento.test.js
- **Siguiente paso:** Añadir --disable-features=RenderDocument en opcionesDeLanzamiento, medir contraste en local y subir la versión en los workflows

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos


- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
