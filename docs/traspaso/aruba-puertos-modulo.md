# Traspaso: aruba-puertos-modulo

- **Tema:** fase 3.1, primera entrega: ópticas, interconexión EdgeHA y semáforo de puertos de Aruba, de la página a `aruba-reglas.js`
- **Rama:** claude/aruba-puertos-modulo
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 21:55
- **Archivos que toca:** public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, test/aruba-opticas-puertos.test.js
- **Siguiente paso:** esperar `verificar` y `pantallas` (contraste `aruba-underlay` y las baterías e2e de Aruba); en verde, cierre y fusión

## Encargo del dueño

«Ejecuta la fase # 3» (2026-10-31): 3.1 y 3.2 del plan aprobado. Esta es la primera entrega de la 3.1.

## Hecho

- 13 funciones y 4 constantes de la página pasan a `aruba-reglas.js` con el catálogo de
  accesorios (`{catalogo, compat}`) y las unidades del sitio como parámetros. La página conserva
  los mismos nombres como envoltorios de una línea: ninguna llamada cambia.
- Equivalencia medida antes de borrar: las funciones de `main` contra las del módulo en 30.075
  casos (25 modelos, enlaces al azar, 1 y 2 unidades): 0 diferencias. El comparador detecta un
  cambio de una palabra (136 diferencias) y uno de cálculo (1.115).
- `test/aruba-opticas-puertos.test.js`: casos reales y que la página solo delega.

## Falta

- CI y fusión. Siguientes entregas de la 3.1: el estado derivado (`derivar`, tier, Boost,
  licencia) y la elección del modelo; después, 3.2 (Fortinet).

## Decisiones y hallazgos

- Va en `aruba-reglas.js` y no en un archivo nuevo: ya es el módulo puro de Aruba, ya se carga en
  la página y ya tiene la asignación de puertos de la que dependen estas funciones.
- De las 3.673 líneas de la página, solo ~386 eran cálculo puro, en 53 funciones dispersas; el
  resto toca el DOM. El corte por bloques con envoltorios de igual nombre deja cada entrega
  pequeña y comparable.

## Verificación

- `node --test` de las 10 pruebas de Aruba: 79 en verde. Todas las pruebas sin dependencias: los
  mismos 29 fallos que `main` (son de dependencias que esta sesión no instala).
- `verificar`, `pantallas`, contraste y e2e: en CI.
