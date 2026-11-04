# Traspaso: fortinet-wifi-celular

- **Tema:** Fortinet: FortiWiFi y celular 4G/5G (variantes integradas y FortiExtender) en el dimensionador, con requisitos para elegir el equipo
- **Rama:** claude/fortinet-wifi-celular
- **Cuenta:** vladichakadc@gmail.com (sesión 016ruRWEroDXGVigUCdbSEFz)
- **Estado:** en curso
- **Actualizado:** 2026-11-04 15:10
- **Archivos que toca:** server/seed/legacyData/fortinet.js, server/seed/legacyData/fortinetVariantes.js, server/seed/legacyData/fuentes.js, server/seed/legacyData/cotizadorCatalog.js, server/services/catalogProjection.js, public/js/fortinet-motor.js, public/js/fortinet-reglas.js, public/js/dimensionador-fortinet-fortigate.js, public/dimensionador-fortinet-fortigate.html, scripts/transporte/documentos.js, test/fortinet-wifi-celular.test.js, test/ficha-alimentacion.test.js, test/fortinet-reglas.test.js, test/pqc-requisito.test.js
- **Siguiente paso:** conducir la página en Chromium (pantallas, e2e, visibles, equivalencia, contraste), leer las fichas FortiWiFi 40F/60F/80F si la corrida de transporte las trajo, y cerrar (entrega, relevo, PR)

## Encargo del dueño

«En el dimensionador de Fortinet revisa ya que no estás trayendo los fortigates que tienen funcionalidades de WIFI y fortiextender para soluciones de 4G/5G e incluye en el dimensionador opciones para calcular el equipo cuando se necesite está funcionalidad».

## Hecho

- Transporte de la ficha de FortiExtender (corrida 41845481466, rama `fuente/fortinet-wifi-celular-2026-11-04`).
- Once variantes en el catálogo (`fortinetVariantes.js`): FortiWiFi 30G/31G/50G/51G/70G/71G/70G-POE, FortiGate 40F-3G4G/50G-5G/51G-5G y FortiWiFi 50G-5G-II, con lo que publica su columna de la ficha por serie.
- Tabla de FortiExtender (101G, 211G, 201F-EA, 202F-AM, 511G, WAN 50G).
- Motor 7.2.0: `fisico.wifi`, `fisico.celular`, `fisico.celularVia` (opcionales, sin cambiar la huella), filtros, bloqueos y elección del FortiExtender; BOM con sus líneas.
- Página: casilla Wi-Fi, WAN celular y «cómo llega», ficha con Wi-Fi y módem.

## Falta

- FortiWiFi 40F, 60F y 80F-2R: ficha propia, no está en el repositorio (segunda corrida de transporte lanzada: `fuente/fortinet-wifi-celular-2-2026-11-04`).
- Precio y licencias de los FortiWiFi y de FortiExtender: la lista firmada no se extrajo para ellos (`npm run skus` solo casa filas que nombran un FortiGate). Lo cierra el dueño con la lista.

## Decisiones y hallazgos

- Una variante solo compite si se pide su función o se elige a mano: así ninguna recomendación ni línea base cambia.
- [RC] (código regional de la radio) se conserva como lo imprime la ficha; no se elige uno.
- La lista extraída sí trae las licencias de las variantes celulares (familias FC-10-F40FG, F50G5, F51G5): se cotizan completas.
- PQC, BGP y fin de venta no se heredan: sus documentos no nombran a las variantes.

## Verificación

- `npm test`: verde (1435). Pendiente lo de navegador.
