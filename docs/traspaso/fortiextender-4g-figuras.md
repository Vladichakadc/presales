# Traspaso: fortiextender-4g-figuras

- **Tema:** Figuras de los FortiExtender 101G, 201F, 202F y 211G desde sus QuickStart Guides oficiales (propuesta del #172; encargo del dueño del 2026-11-10)
- **Rama:** claude/fortiextender-4g-figuras
- **Cuenta:** (no consta)
- **Estado:** en revisión
- **Actualizado:** 2026-11-11 08:10
- **Archivos que toca:** scripts/transporte/documentos.js, scripts/figuras-fortinet.lock.json, public/data/fortinet-vistas-equipos.json, public/img/equipos/fex-101g-front.webp, public/img/equipos/fex-101g-rear.webp, public/img/equipos/fex-211g-front.webp, public/img/equipos/fex-211g-rear.webp, public/img/equipos/fex-201f-front.webp, public/img/equipos/fex-201f-rear.webp, public/img/equipos/fex-202f-front.webp, public/img/equipos/fex-202f-rear.webp, test/vistas-leyendas.test.js
- **Siguiente paso:** CI del PR, commit de cierre y fusión

## Encargo del dueño

«Enfócate a mejorar FortiWiFi y FortiExtender. Que esté todo okey trayendo información actualizada y
gráficos actualizados de los equipos» (2026-11-10) y «Vamos si ya están los gráficos de las referencias
de equipos» (2026-11-11). Se entendió: los cuatro FortiExtender 4G, que la ficha R57 no dibuja, salen
con su figura oficial.

## Hecho

- Transporte de las cuatro QuickStart Guides (corrida 43014445156, rama `fuente/fortiextender-qsg-2026-11-11-3`).
- Ocho figuras (frontal y trasera de cada uno), con lock y pie; leyenda numerada en el 101G y el 211G.

## Falta

- CI, cierre y fusión.

## Decisiones y hallazgos

- Las páginas de docs.fortinet.com dieron 503 al ejecutor dos veces; los PDF se bajaron de su URL en
  el almacén de Fortinet (`fortinetweb.s3.amazonaws.com/docs.fortinet.com/...`), hallada por búsqueda.
- 101G y 211G: la guía numera «Right View» (puertos, frontal) y «Top View» (LED y antenas, trasera).
  201F y 202F: «Ports, LEDs, and Buttons» con rótulos sobre el dibujo y sin números, así que no llevan
  leyenda y `CON_NUMEROS` los excluye.
- Cajas medidas a 300 ppp sobre la página; correlación de 0,946 a 0,993 con la figura servida.

## Verificación

- `node scripts/figuras-fortinet.js`: las 88 figuras casan. Pruebas de vistas, leyendas, figuras y fichas: 40/40.
