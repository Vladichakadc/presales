# Traspaso: fortinet-figuras-celulares

- **Tema:** Figuras frontal y trasera de los FortiGate 40F-3G4G, 50G-5G y 51G-5G, de la página «Hardware» de FG-40F-DAT-R49 y FGFWF-50G-DAT-R17 (encargo del dueño del 2026-11-11)
- **Rama:** claude/fortinet-figuras-celulares
- **Cuenta:** vladichakadc@gmail.com (sesión 016ruRWEroDXGVigUCdbSEFz)
- **Estado:** en curso
- **Actualizado:** 2026-11-11 15:53
- **Archivos que toca:** public/data/fortinet-vistas-equipos.json, scripts/figuras-fortinet.lock.json, public/img/equipos/fg-40f-3g4g-front.webp, public/img/equipos/fg-40f-3g4g-rear.webp, public/img/equipos/fg-50g-5g-front.webp, public/img/equipos/fg-50g-5g-rear.webp, test/fortinet-vistas-equipos.test.js
- **Siguiente paso:** conducir la ficha en Chromium, PR, entrega y fusión

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- Figuras frontal y trasera de los FortiGate 40F-3G4G (FG-40F-DAT-R48, p. 7) y 50G-5G/51G-5G (FGFWF-50G-DAT-R17, p. 10), con caja, huella y correlación en el lock.
- Corregida la caja de la trasera del FortiWiFi 50G-5G-II: apuntaba a la trasera del FortiGate 50G-5G.

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos

- Reservado pasando por alto los archivos de claude/fortinet-version-motor (`--aunque`): rama parada cuyo tema ya está en main.

- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- `npm run figuras-fortinet`: 92 figuras casan. `npm run verificar`: verde.
