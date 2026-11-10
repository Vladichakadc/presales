# Traspaso: fortiextender-figuras

- **Tema:** FortiExtender: el 511G-WiFi que trae la ficha FEXT-DAT-R57 y las figuras de la ficha (WAN 50G, 511G, 511G-WiFi) con su lock
- **Rama:** claude/fortiextender-figuras
- **Cuenta:** (no consta)
- **Estado:** en revisión (PR abierto)
- **Actualizado:** 2026-11-10 12:40
- **Archivos que toca:** server/seed/legacyData/fortinetVariantes.js, public/data/fortinet-vistas-equipos.json, scripts/figuras-fortinet.lock.json, public/img/equipos/fex-50g-front.webp, public/img/equipos/fex-511g-front.webp, public/img/equipos/fex-511g-wifi-front.webp, test/fortinet-vistas-equipos.test.js, test/fortinet-wifi-celular.test.js, test/importar-skus-fortinet.test.js, test/catalogo-fortinet-lista.test.js, test/vistas-leyendas.test.js
- **Siguiente paso:** CI y cierre; después, cuando se fusione el #166 (que tiene la página de Fortinet), enseñar estas figuras junto al FortiExtender elegido y en «Fotos del equipo» del Excel

## Encargo del dueño

«Enfócate a mejorar FortiWiFi y FortiExtender. Que esté todo okey trayendo información actualizada y gráficos actualizados de los equipos» (2026-11-10).

## Hecho

- Traídas de nuevo (corrida 42799828926, rama fuente/fortinet-wifi-extender-2026-11-10) la ficha y la guía de pedido de FortiExtender y las fichas FortiWiFi 40F/60F/80F: idénticas byte a byte a las del 2026-11-04.
- Vigía lanzado a mano (corrida 42799833175): las figuras de los FortiWiFi siguen en la edición publicada.
- FortiExtender 511G-WiFi en `FORTIEXTENDER`; figuras WAN 50G, 511G y 511G-WiFi con leyenda y lock.

## Falta

- Enseñar las figuras en la página (tras el #166).

## Decisiones y hallazgos


- La caja de cada figura nueva es la de su imagen incrustada (pdfplumber) más la fila de números de su leyenda; `--rehacer` la saca igual (diferencia 0).
- 101G, 201F, 202F y 211G: la ficha R57 no los dibuja; no se usa la figura de otro modelo.

## Verificación

- `npm run figuras-fortinet`: 76 figuras casan; pruebas de Fortinet y figuras 65/65 y 12/12; batería completa con los mismos 38 fallos de entorno que main.
