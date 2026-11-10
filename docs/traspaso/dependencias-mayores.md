# Traspaso: dependencias-mayores

- **Tema:** Fase 3 de la auditoria: dependencias mayores de una en una (dotenv, ESLint, SDK de Anthropic, pdf-parse)
- **Rama:** claude/dependencias-mayores
- **Cuenta:** sesión de Claude Code de la auditoría (session_016ruRWEjxhbmKTGnagDrUvb)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 13:20
- **Archivos que toca:** package.json, package-lock.json, scripts/contrastar-matrix.js, scripts/comparar-fuente.js, scripts/vigencia-quickspecs.js, test/contrastar-matrix.test.js
- **Siguiente paso:** Abrir el PR, escribir el cierre (entrega, relevo y este traspaso fuera) y fusionar con el CI en verde.

## Encargo del dueño

«Ejecuta fase 2 y fase 3» (2026-11-10): en la fase 3 de la auditoría, las dependencias mayores de
una en una, cada una con `verificar` y `auditar`. Y «Si fusióna las fases» (2026-11-10): fusionar
cada PR de las fases 2 y 3 cuando su CI esté en verde.

## Hecho

- dotenv 17 → 18 (09f53b1).
- ESLint 9 → 10 (6ad47b8).
- SDK de Anthropic 0.137 → 1.8 (4cdcf06).
- pdf-parse 1 → 2, con pdf.js 5.4.296 (el commit que trae este traspaso).

## Falta

- Abrir el PR, el commit de cierre y fusionar.

## Decisiones y hallazgos

- La reserva pasó por alto (`--aunque`) las cinco ramas de la fase 2 (PR #167 a #171): eran la
  cadena propia, apilada, no ramas paradas. Las cinco están fusionadas en main desde el 2026-11-10.
- server/server.js, server/services/aiSync.js y eslint.config.js se declararon en la reserva y no
  hizo falta tocarlos: quedan libres.
- dotenv 18: la línea de arranque pasa de stdout (con un anuncio) a stderr; nadie la lee.
- ESLint 10: los mismos 12 avisos en los mismos 372 archivos. Trae un aviso informativo de minimatch
  (GHSA-g3hv-75wg-m249, moderado, solo de desarrollo) cuyo arreglo está en minimatch 11, que ESLint
  aún no acepta; npm solo propone volver al 9, en fin de vida desde el 2026-08-06. Se acepta.
- SDK 1.x: API 2026-10-21. Sonda sin red (fetch de mentira y la analyzeCatalog real, diez
  escenarios): mismo cuerpo, registros y resultado; cambian la versión, la clave (a
  `Authorization: Bearer`) y la URL (sin `?beta=true`). La llamada real con clave no se pudo hacer
  aquí: la primera sincronización del panel tras desplegar es la prueba.
- pdf-parse 2 no da trozos con posición: `contrastar-matrix` los pide a pdf.js (`pdfjs-dist`,
  fijada a la 5.4.296 que trae pdf-parse 2: una sola copia). pdf.js 1.10 daba en `height` el
  cuadrado del tamaño de letra; los umbrales pasan a sus raíces. Medido en el Product Matrix R178:
  el mismo informe `--json`, byte a byte.
- `comparar-fuente` sobre las 111 ramas `fuente/*`: los mismos veredictos (1.400 líneas); en 6 de
  los 11 PDF con TEXTO cambia el recuento +N −M por el corte de línea. `vigencia`: el mismo JSON.
  209 PDF distintos de las ramas y del repositorio: la 2 lee los 209, como la 1; el texto sin
  espacios es igual en 181 y difiere menos de un 1 % en el resto; la 1 no sacaba nada de la guía
  del Aruba 7024 y la 2 sí.
- El `grep` de este entorno es ugrep 7.8.4 y con la alternancia `(BYTES|TEXTO|SIN-TEXTO)` se salta
  líneas que casan: los recuentos de las salidas se hicieron con Python.

## Verificación

- `npm run verificar` en cada commit: 1532 pruebas en verde, 12 avisos de lint (los de antes).
- `npm run auditar`: 0 que frenan; 1 informativo desde ESLint 10 (minimatch).
- dotenv: arranque con `NODE_ENV=production`, `/salud` 200.
