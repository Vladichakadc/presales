# Traspaso: fortiextender-figura-pagina

- **Tema:** Enseñar en la página de Fortinet la figura del FortiExtender elegido, con su leyenda (sigue al PR #172)
- **Rama:** claude/fortiextender-figura-pagina
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube; retoma la rama parada desde el 2026-11-10)
- **Estado:** en curso
- **Actualizado:** 2026-11-11 16:40
- **Archivos que toca:** public/js/dimensionador-fortinet-fortigate.js, public/js/ficha.js, public/js/bom.js, test/e2e/e2e-fortinet-wifi-celular.js, test/bom-fotos-acompanan.test.js
- **Siguiente paso:** esperar CI del PR; en verde, cierre y fusión

## Encargo del dueño

«Enfócate a mejorar FortiWiFi y FortiExtender […] gráficos actualizados de los equipos» (2026-11-10) y «incluye equipos fortiExtender WAN 50G, 511G y todos los equipos referencia FEX y todos los gráficos correspondientes» (2026-11-11): que las figuras de los FortiExtender se vean en la página y viajen al Excel.

## Hecho

- `figuraExtender` en la página, con las dos caras y sus leyendas; `FICHA.tablaLeyenda` expuesta.
- `fotos.acompanan` en `bom.js` (`equiposDeFotos`): el FortiExtender del BOM va a «Fotos del equipo» detrás del FortiGate.
- e2e de Wi-Fi y celular al día con las figuras del #185; prueba unitaria `test/bom-fotos-acompanan.test.js`.

## Falta

- CI, cierre y fusión.

## Decisiones y hallazgos

- La rama llevaba parada desde el 2026-11-10 13:09 esperando al #172, ya fusionado; se retoma en la misma rama, sin duplicarla.
- El 211G ya tiene figura (#185): la e2e que afirmaba «sin figura» se cambió por las dos caras con leyenda.

## Verificación

- `node --test test/bom-*.test.js` en local. La e2e corre en CI.
