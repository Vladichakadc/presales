# Traspaso: una-forma-de-ocultar

- **Tema:** una sola forma de ocultar: el atributo `hidden` en vez de la clase `.hidden` y de `style.display`
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-02 21:15
- **Archivos que toca:** public/js/dimensionador-aruba-edgeconnect.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-fortinet-fortigate.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-nokia-7220ixr.js, public/js/dimensionador-nokia-7750sr.js, public/js/index.js, public/js/procedencia.js, public/js/cotizador.js, public/js/cuenta.js, public/js/guia-diseno-interactiva.js, public/js/ficha.js, public/js/funciones-activas.js, public/dimensionador-aruba-edgeconnect.html, public/dimensionador-cisco-catalyst8k.html, public/dimensionador-fortinet-fortigate.html, public/dimensionador-huawei-netengine.html, public/dimensionador-juniper-srx.html, public/dimensionador-mikrotik-routeros.html, public/dimensionador-nokia-7220ixr.html, public/dimensionador-nokia-7750sr.html, public/index.html, public/cotizador.html, public/cuenta.html, public/guia-diseno-interactiva.html, test/oculto-visible.test.js, test/funciones-activas.test.js
- **Siguiente paso:** la clase `.hidden` de los ocho dimensionadores al atributo, y después cada `style.display`, sitio a sitio

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es la mejora «Una sola forma
de ocultar: el atributo `hidden`» (propuesta al cerrar el PR #115).

## Hecho

- Nada todavía.

## Falta

- Clase `.hidden` (8 reglas, ~25 usos en JS, 18 en HTML), `style.display` (35 sitios), la prueba que
  frene la vuelta de los dos, verificación con navegador, PR, entrega y relevo.

## Decisiones y hallazgos

- Solo `test/funciones-activas.test.js` mira la clase `hidden` (una regex sobre el código fuente).
- El `[hidden]{display:none !important}` global (PR #115) cubre cualquier elemento que pase al atributo.

## Verificación

- Pendiente.
