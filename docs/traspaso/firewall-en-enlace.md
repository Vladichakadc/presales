# Traspaso: el Secure Firewall elegido a mano, en el enlace y en el perfil

- **Tema:** que el Secure Firewall elegido a mano en su ficha (Cisco) viaje en el enlace y en el perfil multi-sede
- **Rama:** claude/firewall-en-enlace
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S92WvujFK1KCusavSu)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 11:05
- **Archivos que toca:** public/js/dimensionador-cisco-catalyst8k.js, scripts/catalogo-check.js, test/e2e/e2e-secure-firewall-ficha.js
- **Siguiente paso:** CI verde, commit de cierre con el número del PR y fusión (después del PR #90)

## Encargo del dueño

«ejecuta los pendientes que puedas cerrar»: el pendiente que dejó el PR #88.

## Hecho

- `fichaFw-sel` en `CAMPOS_ENLACE` (ESTADO lo repone al aparecer, como `verdict-sel`) y en `TARDIOS`; el perfil guarda `FW_ELEGIDO` (solo lo elegido a mano) y lo repone al cargarse.

## Falta

- CI y fusión.

## Decisiones y hallazgos

- El recomendado no se fija: si el enlace trae el recomendado, `alCambiar` deja `FW_ELEGIDO` en null y sigue al escenario.

## Verificación

- Pruebas de perfil, pantallas, opciones tarde y Secure Firewall en verde; la batería e2e abre el enlace en otro contexto, en CI.
