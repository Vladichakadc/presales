# Traspaso: un-lanzamiento-chromium

- **Tema:** Un solo lanzamiento de Chromium: los dos cargadores de Playwright envuelven chromium.launch con opcionesDeLanzamiento (decisión del dueño, 2026-11-04)
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-04 08:33
- **Archivos que toca:** scripts/ayuda/chromium.js, test/e2e/ayuda.js, test/chromium-lanzamiento.test.js
- **Siguiente paso:** e2e entera y `npm run visibles` en local; PR; cierre con entrega, relevo y CLAUDE.md

## Encargo del dueño

Preguntado el 2026-11-04 por la mejora «Un solo lanzamiento de Chromium» (propuesta al cerrar el PR #130), el dueño eligió «Hacerla», con la condición de medirla con la e2e entera antes de fusionar.

## Hecho

- `scripts/ayuda/chromium.js`: `conLanzamiento(tipo)` (Proxy: `launch(extra)` pasa por `opcionesDeLanzamiento(extra)`, el resto se llama sobre el objeto real) y `conPlaywright(pw)`; `requerirPlaywright()` devuelve el módulo envuelto.
- `test/e2e/ayuda.js`: `cargarPlaywright()` devuelve el módulo envuelto en sus dos caminos.
- `test/chromium-lanzamiento.test.js`: el envoltorio con un tipo falso (sin Playwright) y el barrido de `scripts/` y `test/`: solo esos dos cargadores, y los dos envuelven.

## Falta

- e2e entera y `visibles` en local, PR, cierre.

## Decisiones y hallazgos

- Por los cargadores y no llamada a llamada: tres archivos en vez de ~45, misma garantía, y la prueba frena un tercer cargador.
- En este entorno el binario no cambia (`executablePath()` de Playwright y `chromiumDisponible()` son el mismo archivo): solo el flag. Comprobado con el Chromium real: el lanzado por `cargarPlaywright()` lleva `--disable-features=RenderDocument`.

## Verificación

- `npm run verificar`: 1.427/1.427. Caen los sabotajes (sin envoltorio en `cargarPlaywright`, y un tercer cargador).
