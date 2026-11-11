# Traspaso: fortiwifi-50g-sfp-dsl

- **Tema:** FortiWiFi 50G-SFP y 50G-DSL de la ficha R17, con sus figuras; va encima del PR #172, que toca los mismos archivos y se fusiona antes
- **Rama:** claude/fortiwifi-50g-sfp-dsl
- **Cuenta:** (no consta)
- **Estado:** en revisión (PR abierto; se fusiona después del #172, cuya rama lleva dentro)
- **Actualizado:** 2026-11-10 17:39
- **Archivos que toca:** server/seed/legacyData/fortinetVariantes.js, public/data/fortinet-vistas-equipos.json, scripts/figuras-fortinet.lock.json, test/fortinet-wifi-celular.test.js, test/fortinet-vistas-equipos.test.js
- **Siguiente paso:** CI del PR; fusionar detrás del #172 y escribir el cierre

## Encargo del dueño

«Enfócate a mejorar FortiWiFi y FortiExtender. Que esté todo okey trayendo información actualizada y gráficos actualizados de los equipos» (2026-11-10).

## Hecho

- FortiWiFi 50G-SFP y 50G-DSL (columnas de la R17), con sus cuatro figuras en el lock, sus fuentes y la PQC de FortiOS 7.6.7.
- Corridas 42799828926 (transporte: FortiExtender y fichas 40F/60F/80F IGUAL byte a byte a las del 4-nov) y 42799833175 (vigía: figuras de Fortinet sin avisos).

## Falta

- Las figuras de los cuatro FortiExtender 4G (101G, 201F, 202F, 211G), desde sus QuickStart Guides: propuesta del #172.

## Decisiones y hallazgos

- Reservado pasando por alto los archivos de claude/fortiextender-figuras (`--aunque`): rama parada cuyo tema ya está en main.

- Cajas medidas a 300 ppp con el método que reproduce a <0,5 pt las de la p. 7; la trasera parte del borde del chasis, no de la línea de su leyenda. Sin leyenda, como el resto de FortiWiFi (sus números quedan fuera del recorte).
- El lock se edita como texto: volcar el JSON reescribe `30.0` como `30` en las cajas del #172.

## Verificación

- `npm run figuras-fortinet`: 80 figuras casan. Batería: las mismas fallas que la base (dependencias ausentes) más `catalogo-en-memoria` (sequelize), ninguna del cambio. El motor con Wi-Fi pedido: ninguna recomendación cambia.
