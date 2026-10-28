# Traspaso: figuras de los ISR, los ASR, los Meraki MX y fotos de los IOS XE SD-WAN

- **Tema:** figuras que faltan (ISR 1116-4P, ISR 1161X-8P, los tres ASR) y fotos de producto a color para Meraki MX y Secure Router
- **Rama:** claude/figuras-cisco-isr-mx
- **Cuenta:** sesión de Claude del 2026-10-28 (cuenta del dueño)
- **Estado:** en curso
- **Actualizado:** 2026-10-28 10:00
- **Archivos que toca:** .github/workflows/traer-cisco-huawei.yml, public/data/cisco-vistas-equipos.json, public/img/equipos/cs-*, public/js/ficha.js, test/cisco-vistas-equipos.test.js, test/cisco-leyendas.test.js
- **Siguiente paso:** traer con `traer-cisco-huawei.yml` (solo `cisco-asr1000-ds.html,cisco-asr1006x-producto.html,cisco-asr1002hx-producto.html,cisco-asr-img`) a `fuente/cisco-asr-2026-10-28` y extraer las figuras de los ASR

## Encargo del dueño

«Incluye las gráficas de los equipos Cisco, por qué no estás incluyendo la ISR; mejora los gráficos de
los equipos MX. Mejora la calidad de las imágenes de todos los equipos IOS XE SD-WAN.»

## Hecho

- Entradas de transporte de los ASR en `traer-cisco-huawei.yml`.

## Falta

- Figuras del ISR 1116-4P y 1161X-8P (guía del ISR 1000, figuras 1 y 29; ficha, figura 3).
- Figuras de los ASR 1001-X, 1002-HX y 1006-X.
- Foto de producto en los Meraki MX y en los Secure Router con foto oficial.

## Decisiones y hallazgos

- La figura 29 de la guía del ISR 1000 se rotula «Cisco 11x1(X)-8P/ C11x1(X)-8PLTEP», que nombra al C1161X-8P.

## Verificación

- Pendiente.
