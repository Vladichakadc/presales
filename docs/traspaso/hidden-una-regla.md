# Traspaso: hidden-una-regla

- **Tema:** `[hidden]` gana siempre, en una sola regla (`[hidden]{display:none !important}`) alcanzable desde las 15 páginas
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-01 17:15
- **Archivos que toca:** public/controles.css, public/actualizar.css, public/dimensionador-starlink-leo.css, public/dimensionador-aruba-edgeconnect.html, public/dimensionador-cisco-catalyst8k.html, public/dimensionador-fortinet-fortigate.html, public/dimensionador-huawei-netengine.html, public/dimensionador-juniper-srx.html, public/dimensionador-mikrotik-routeros.html, public/dimensionador-nokia-7220ixr.html, public/dimensionador-nokia-7750sr.html, public/index.html, public/cotizador.html, public/cuenta.html, public/guia-diseno-interactiva.html, public/login.html, public/usuarios.html, test/oculto-visible.test.js, test/consolidado-estilos.test.js
- **Siguiente paso:** poner la regla en `controles.css`, en la hoja de Starlink y en el `<style>` de las seis páginas sin hoja común; quitar las reglas por clase; reescribir `test/oculto-visible.test.js`

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto.» Es la mejora propuesta al cerrar el PR #112 («`[hidden]`
gana siempre, en una sola regla», en *Mejoras propuestas sin decidir* de `RELEVO.md`).

## Hecho

- Medido antes de tocar nada (sonda en Chromium sobre `main` con el PR #112): recorriendo pestañas,
  casillas, desplegables y botones segmentados de 12 páginas, ningún elemento con `hidden` se pinta.
  Con el arreglo del #112 quitado, la sonda caza `#fldHaLicUnica`: la regla global no cambia lo que
  hoy se ve, solo cierra la puerta.

## Falta

- La regla, las pruebas, `verificar`, servidor en producción con `pantallas`, `contraste`, `e2e` y `puerta`.

## Decisiones y hallazgos

- `!important` hace falta: `#modalConsolidado{display:flex}` (un id) le gana a un `[hidden]` de autor
  sin él. Lo único que podría ganarle es otro `display` con `!important`; hoy solo existen con `none`.
- Ninguna página muestra con `style.display` un elemento que conserve `hidden` (revisado en el JS).

## Verificación

- Pendiente.
