# Traspaso: fortinet-plc-confirmado

- **Tema:** Fechas de fin de venta de Fortinet confirmadas por el dueño en Product Life Cycle (2026-11-04)
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-04
- **Archivos que toca:** server/seed/legacyData/fortinet.js, server/seed/legacyData/fuentes.js, test/fortinet-fin-de-venta-fechas.test.js
- **Siguiente paso:** abrir el PR y cerrar con su entrega (e2e completa en curso)

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de mejora; no pares hasta no tener resuelto». Preguntado en la sesión, el dueño respondió que las ocho fechas de fin de venta de Fortinet coinciden con Product Life Cycle («coinciden todas»), que el 4200F, el 7081F y el 7121F no tienen fecha, y que se confirmen solo esas («solo las 8 fechas»): el resto de la línea sigue sin afirmar.

## Hecho

- `fortinet.js`: fuera `confirmar` y `CONFIRMAR_CICLO`; el comentario de procedencia dice quién lo confirmó y cuándo.
- `fuentes.js`: la fuente del portal, sin URL (pide sesión), con `campos: null` y su `porQue`, y los once modelos declarados.
- `test/fortinet-fin-de-venta-fechas.test.js`: la fila ya no lleva `confirmar`, la fuente declara a los once, y ninguna fuente de Fortinet respalda `eolAnnounced`.

## Falta

- Abrir el PR, entrega y relevo, fusionar.

## Decisiones y hallazgos

- La fuente del portal va al final de la lista de Fortinet: el banner de la página toma como «Fuente técnica» la primera que no es de precio, y puesta primera decía «Product Life Cycle» (lo cazó `e2e-fortinet-auditoria`). La prueba lo frena ahora sin navegador.
- No se declara `campos: ['eolAnnounced']`: el semáforo es por fabricante (`respaldoCicloVida`) y pintaría de vigentes a los 47 FortiGate que nadie miró en el portal. Mismo precedente que la Lifecycle Policy de EdgeConnect.

## Verificación

- `node --test test/fortinet-fin-de-venta-fechas.test.js`: 7/7.
- `npm run verificar`: 1.416/1.416, lint sin errores (los 9 avisos son de antes). `npm run auditar`: 0 que frenen.
- `E2E_SOLO=ciclo` y `E2E_SOLO=fortinet`: en verde (tras mover la fuente).
