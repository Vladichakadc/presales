# Traspaso: estilos-consolidado

- **Tema:** los estilos de la ventana del consolidado multi-sede, en la hoja común `controles.css`
- **Rama:** claude/estilos-consolidado
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 07:45
- **Archivos que toca:** public/controles.css, public/dimensionador-aruba-edgeconnect.html, public/dimensionador-cisco-catalyst8k.html, public/dimensionador-fortinet-fortigate.html, public/dimensionador-huawei-netengine.html, public/dimensionador-juniper-srx.html, public/dimensionador-mikrotik-routeros.html, public/dimensionador-nokia-7750sr.html, test/consolidado-estilos.test.js
- **Siguiente paso:** mover las reglas de `#modalConsolidado` y su `.acc-caja` de las siete hojas a la sección 6 de `controles.css`, con su prueba

## Encargo del dueño

«Aprobado» (2026-10-31), sobre el plan de mejora de los dimensionadores: fase 1.2, la mejora
propuesta al cerrar el PR #67 («Los estilos de la ventana del consolidado, en la hoja común»).

## Hecho

- Rama y traspaso empujados.

## Falta

- El cambio de CSS y su prueba, el PR, CI en verde y la fusión.

## Decisiones y hallazgos

- El velo era `rgba(28,25,23,.45)` en Aruba, Fortinet y Huawei y `rgba(14,26,43,.45)` en las otras
  cuatro; las siete declaran `--ink:#0E1A2B`, que es el segundo. El común sale de la tinta.
- La `.acc-caja` de Aruba también viste `#accModal` (ópticas y accesorios): esa regla se queda en
  su hoja; la común va acotada a `#modalConsolidado .acc-caja`.
- Esta sesión no alcanza `registry.npmjs.org` (el proxy de egreso lo rechaza): `npm ci` no corre
  aquí, y la verificación es la de CI en el PR (`verificar` y `pantallas`, con contraste y e2e).

## Verificación

- Pendiente.
