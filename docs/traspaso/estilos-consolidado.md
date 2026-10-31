# Traspaso: estilos-consolidado

- **Tema:** los estilos de la ventana del consolidado multi-sede, en la hoja común `controles.css`
- **Rama:** claude/estilos-consolidado
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 08:05
- **Archivos que toca:** public/controles.css, public/dimensionador-aruba-edgeconnect.html, public/dimensionador-cisco-catalyst8k.html, public/dimensionador-fortinet-fortigate.html, public/dimensionador-huawei-netengine.html, public/dimensionador-juniper-srx.html, public/dimensionador-mikrotik-routeros.html, public/dimensionador-nokia-7750sr.html, test/consolidado-estilos.test.js
- **Siguiente paso:** esperar `verificar` y `pantallas` en el PR; en verde, commit de cierre (`PENDIENTES.md`, `RELEVO.md`, borrar este traspaso) y fusionar

## Encargo del dueño

«Aprobado» (2026-10-31), sobre el plan de mejora de los dimensionadores: fase 1.2, la mejora
propuesta al cerrar el PR #67 («Los estilos de la ventana del consolidado, en la hoja común»).

## Hecho

- Rama y traspaso empujados.
- Sección 6 de `controles.css` con `#modalConsolidado`, su `[hidden]`, su `.acc-caja` y su `h3`; quitadas las copias de las siete hojas (en Aruba se queda la `.acc-caja` de `#accModal`). Prueba `test/consolidado-estilos.test.js`.

## Falta

- CI en verde, el commit de cierre y la fusión.

## Decisiones y hallazgos

- El velo era `rgba(28,25,23,.45)` en Aruba, Fortinet y Huawei y `rgba(14,26,43,.45)` en las otras
  cuatro; las siete declaran `--ink:#0E1A2B`, que es el segundo. El común sale de la tinta.
- La `.acc-caja` de Aruba también viste `#accModal` (ópticas y accesorios): esa regla se queda en
  su hoja; la común va acotada a `#modalConsolidado .acc-caja`.
- Esta sesión no alcanza `registry.npmjs.org` (el proxy de egreso lo rechaza): `npm ci` no corre
  aquí, y la verificación es la de CI en el PR (`verificar` y `pantallas`, con contraste y e2e).

## Verificación

- `node --test` de la prueba nueva, `bom-panel-perfiles`, `funciones-activas` y `actualizar`: 18 en verde. La prueba nueva, devuelta una hoja a `main`, falla con «la regla va en controles.css».
- Chromium (Playwright global) sobre `public/` estático, antes y después, en Huawei, Aruba y Cisco: velo `rgba(14,26,43,.45)` en las tres (antes cálido en Huawei y Aruba), `[hidden]` oculta, `overflow: auto`, `max-height: 86vh`; título en IBM Plex Mono en las tres (antes solo Aruba). Cambio visible a propósito: la caja ocupa hasta sus 860 px en las siete (antes se encogía al contenido en cuatro) y su radio en Aruba pasa de 3 a 6 px.
- `npm run verificar`, `pantallas`, `contraste` y `e2e`: en CI (aquí no hay dependencias).
