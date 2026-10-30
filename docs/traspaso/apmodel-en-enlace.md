# Traspaso: apmodel-en-enlace

- **Tema:** el modelo de AP de MikroTik viaja en el enlace; ESTADO repone los desplegables que se rellenan tarde
- **Rama:** claude/apmodel-en-enlace
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S7ZbQULfHYAyefitrr)
- **Estado:** en curso
- **Actualizado:** 2026-10-30 06:45
- **Archivos que toca:** public/js/estado.js, public/js/dimensionador-mikrotik-routeros.js, test/e2e/e2e-apmodel-enlace.js
- **Siguiente paso:** con CI en verde (la batería e2e nueva solo corre allí), commit de cierre y fusión en main.

## Encargo del dueño

«Ejecuta las mejoras propuestas»: la propuesta al cerrar el PR #75, «el modelo de AP de MikroTik,
también en el enlace».

## Hecho

- `estado.js`: `cfg.opcionesTarde`, desplegables que están en el HTML pero vacíos al vincular. El
  valor del enlace se repone cuando llegan sus opciones (con `input` y `change`), y su valor por
  defecto es la primera opción que llega. Opt-in: Aruba ya repone su `pickModel` por su cuenta.
- MikroTik: `apModel` pasa de `PERFIL_EXTRA` a `CAMPOS_ENLACE` y se declara en `opcionesTarde`.
- `test/e2e/e2e-apmodel-enlace.js`: el enlace aterriza en el AP que trae; uno sin `apModel`, en el
  de siempre; el de por defecto no viaja.

## Decisiones y hallazgos

- La propuesta decía «una línea» y no bastaba: `apModel` llega vacío del HTML, `escribir` rechaza el
  valor y se perdía sin aviso. Y con '' como valor por defecto, el primer AP viajaría siempre.
- Aruba (`pickModel`, `selTier`) y otros desplegables vacíos no cambian: no lo declaran.

## Verificación

- `node --check` de los tres archivos; `test/perfil-campos-enlace.test.js` en verde. La batería e2e
  necesita el servidor (sin `sequelize` en este contenedor): corre en CI.
