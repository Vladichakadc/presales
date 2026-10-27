# Traspaso: ia-pliego-cisco

- **Tema:** Piloto «del pliego al escenario» en el dimensionador Cisco (decisión de IA ejecutada con la opción recomendada)
- **Rama:** claude/ia-pliego-cisco
- **Cuenta:** vladichakadc (gmail), sesión 01V8T7S92WvujFK1KCusavSu
- **Estado:** en curso
- **Actualizado:** 2026-10-27 12:35
- **Archivos que toca:** server/services/escenarioDesdeTexto.js, server/services/aiSync.js, server/server.js, public/js/escenario-ia.js, public/dimensionador-cisco-catalyst8k.html, test/escenario-ia.test.js, test/servidor-produccion.test.js, docs/ia-en-el-dimensionador-2026-10-27.md, CLAUDE.md, PENDIENTES.md
- **Siguiente paso:** PR a main y ver CI (lint, pruebas con SDK, pantallas, e2e/axe en la página de Cisco); si algo falla, corregir aquí

## Encargo del dueño

«Hazla y ejecuta todos los pendientes» (2026-10-27). Las dos decisiones de IA tenían opción
recomendada: (1) sí se manda el pliego a la API, con aviso y sin guardarlo; (2) piloto en Cisco,
primero con texto pegado (cita verificada por programa), el PDF después.

## Hecho

- `escenarioDesdeTexto.js`: 28 campos de la página; rango y opciones leídos del HTML; esquema con
  `enum` de campos; cita literal comprobada (espacios y comillas tipográficas normalizados, mínimo
  3 caracteres); valor contra rango/opciones/entero; duplicados fuera; `sinDato` con lo no dicho.
  El texto no se guarda ni va al log (solo tokens).
- Ruta `POST /api/escenario/desde-texto` tras `exige('herramientas')`: 400 texto/página, 503 sin
  clave, 429, 422 rechazo, 502 corte. Mensajes propios del pliego, no los de la sincronización.
- `aiSync.js` exporta `clienteIA` (un solo cliente y una sola clave).
- `escenario-ia.js` + bloque plegable en la página de Cisco: aviso de envío a Anthropic, textarea,
  tabla «Ahora / Propuesto / Cita» con «Aceptar» por campo (escribe el control y dispara su evento;
  `bw` pone la unidad en Mbps; los segmentos se pulsan), rechazadas con motivo y lista de lo no dicho.
- Pruebas: `test/escenario-ia.test.js` (6 sin SDK pasan aquí; 2 con SDK, en CI) y una en
  `servidor-produccion.test.js` (401 sin sesión, 400, 503 sin clave).

## Falta

- CI completo (aquí no hay `node_modules`: el proxy da 403 al registro de npm).
- Probarlo con la clave real en producción con un pliego de verdad (lo hace el dueño).
- Después del piloto: enlaces WAN (`enlacesData`, JSON) y PDF; luego los otros seis dimensionadores.

## Decisiones y hallazgos

- Enlaces WAN fuera del piloto: son una lista JSON con su propio editor; meterlos pide otro esquema.
- `module.exports` fuera del archivo del navegador: el lint de `public/js/` no declara `module`.

## Verificación

- `node --test --test-skip-pattern="con el modelo" test/escenario-ia.test.js`: 6/6.
