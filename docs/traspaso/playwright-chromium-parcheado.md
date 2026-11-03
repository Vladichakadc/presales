# Traspaso: playwright-chromium-parcheado

- **Tema:** Subir Playwright 1.61.1 -> 1.64.1 (Chromium 156, parche CVE-2026-87491) desactivando RenderDocument para conservar la cobertura del contraste
- **Rama:** claude/playwright-chromium-parcheado
- **Cuenta:** vladichakadc (claude.ai, sesión remota)
- **Estado:** en curso
- **Actualizado:** 2026-11-03 07:55
- **Archivos que toca:** scripts/ayuda/chromium.js, scripts/contraste.js, .github/workflows/pantallas.yml, .github/workflows/limites.yml, test/chromium-lanzamiento.test.js
- **Siguiente paso:** Mirar la comprobación `pantallas` del PR: el paso de contraste debe escribir la cobertura (8 «sin conducir», ninguna incoherencia) y la batería e2e pasar con Chromium 156. Si pasa, entrega y fusión; si no, leer las anotaciones `contraste`/`e2e`.

## Encargo del dueño

«Revisa en la web si hay algún problema con playwright y si es necesario actualiza a la última versión o parchea chromium» → «revísalo» en el repo de Presales → «Si hazlo». Se entendió: sacar a CI del Chromium vulnerable sin romper lo que el fijado protegía.

## Hecho

- `opcionesDeLanzamiento()` añade `--disable-features=RenderDocument` (sin pisar los `args` del que llama).
- `pantallas.yml` y `limites.yml` pasan de Playwright 1.61.1 (Chromium 149) a 1.64.1 (Chromium 156.0.8078.4).
- `test/chromium-lanzamiento.test.js`: el flag está, no muta al que llama, y una versión 1.62+ en un workflow exige el flag.

## Falta

- Confirmar en CI (`pantallas` del PR) y fusionar con su entrega.

## Decisiones y hallazgos

- Chromium 149 de la 1.61.1 es anterior a varios zero-days de V8 de 2026; el último explotado, CVE-2026-87491, se corrigió en 153.0.8010.36 (9-sep-2026). Riesgo bajo en CI (solo abre la app en localhost; el transporte usa `fetch`), pero el fijado dejaba al repositorio atado a un navegador sin parches.
- Medido en local con Playwright 1.63.0 y Chromium 153 (`npm run contraste -- --todos`): **sin el flag**, seis módulos «sin conducir» que la corrida condujo y la cobertura no se escribe (la firma del 2026-10-02); **con el flag**, 8 «sin conducir», 2 rozados y ningún módulo cambia de estado frente al lock de main.
- Este contenedor no puede bajar el Chromium de la 1.64.1 (`cdn.playwright.dev` denegado por el proxy de egreso): la medición con 1.64.1 es la de CI.
- El lock de cobertura medido en local no se versiona en este PR (se versiona aparte, y lo reescribe CI).

## Verificación

- `npm run verificar`: 1389 pruebas en verde. `npm run auditar`: 0 avisos que frenen.
- `npm run contraste -- --todos` en local, con y sin el flag (arriba).
