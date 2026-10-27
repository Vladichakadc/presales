# Traspaso: leyendas de las figuras de Juniper y del Aruba 7010

- **Tema:** tabla número → qué es en las figuras numeradas de Juniper (36) y del Aruba 7010 (2)
- **Rama:** claude/leyendas-juniper-aruba
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en curso
- **Actualizado:** 2026-10-27 15:45
- **Archivos que toca:** public/data/juniper-vistas-equipos.json, public/data/aruba-vistas-equipos.json, public/js/ficha.js, public/js/dimensionador-aruba-edgeconnect.js, test/vistas-leyendas.test.js, test/e2e/e2e-leyendas-juniper.js
- **Siguiente paso:** CI de la rama; luego la mejora de EdgeHA (interconexión por velocidad) en su propia rama

## Encargo del dueño

«Ejecutar mejora propuesta y pendientes». La mejora propuesta al cerrar la entrega de las leyendas
de Cisco: llevar la tabla de números a las figuras de los demás fabricantes que los tengan.

## Hecho

- Inventario de las 228 figuras de Huawei, Fortinet, Aruba, MikroTik y Juniper: llevan números
  las 36 de Juniper (guías de hardware y dos fichas de línea) y las 2 del Aruba 7010. Las demás
  rotulan sobre el dibujo o son fotos.
- Guía del 7010 traída con `traer-cisco-huawei.yml` a `fuente/aruba-7010-leyendas-2026-10-27`.

## Falta

- Datos, interfaz, prueba, CI y fusión.

## Decisiones y hallazgos

- Una fila que agrupa dos números («2, 8 Console ports») se repite en cada número.
- El SSR130 sale de la ficha en japonés: el rótulo literal va en japonés (`lang: 'ja'`).
- La tabla 4 del 7010 numera frontal (1-10) y trasera (11-12) seguidas: la trasera empieza en 11.

## Verificación

- Pendiente.
