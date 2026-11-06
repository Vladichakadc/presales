# Traspaso: fortinet-skus-wifi-extender

- **Tema:** el importador de la lista de Fortinet extrae también FortiWiFi y FortiExtender
- **Rama:** claude/fortinet-skus-wifi-extender
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-11-06 06:20
- **Archivos que toca:** scripts/importar-skus-fortinet.js, test/importar-skus-fortinet.test.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/fortinetVariantes.js, public/js/fortinet-motor.js, public/js/fortinet-reglas.js, test/fortinet-wifi-celular.test.js
- **Siguiente paso:** esperar `verificar` y `pantallas` en el PR; en verde, commit de cierre (entrega, `RELEVO.md`, borrar este traspaso) y fusionar

## Encargo del dueño

«Sí, el importador (Recomendado)»: que el importador de la lista de precios de Fortinet saque también los FortiWiFi y FortiExtender, que hoy salen «consultar»; el dueño lo corre después con la lista firmada.

## Hecho

- `extraer()` puro en `scripts/importar-skus-fortinet.js`; bloques de FortiWiFi (nombre + SKU de ficha con [RC]) y FortiExtender (nombre o código de FortiCare + SKU de ficha); `fortinet.js` y el motor los leen si existen.

## Falta

- Correr `npm run skus -- <lista.xlsx>` con la lista firmada (dueño) y declarar `lic`/`bdl` de cada FortiWiFi con lo que sugiere.

## Decisiones y hallazgos


- El código de licencias de un FortiWiFi se sugiere, no se escribe: no hay precio verificado contra el que anclar.
- `casaSku` vive en `fortinetVariantes.js` (donde está el [RC]), no en el script: un dato del seed no depende de `scripts/`.

## Verificación

- `node --test`: mismos fallos que `main` (dependencias sin instalar; el proxy corta npm). Lint, `verificar` y `pantallas`, en CI.
