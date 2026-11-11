# Traspaso: mikrotik-subcampos-enlace

- **Tema:** Los bloques de BGP, PPPoE y CAPsMAN se ven al abrir un enlace o un perfil
- **Rama:** claude/mikrotik-subcampos-enlace
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S7ZbQULfHYAyefitrr)
- **Estado:** en curso
- **Actualizado:** 2026-11-11 06:20
- **Archivos que toca:** public/js/dimensionador-mikrotik-routeros.js, test/e2e/e2e-mikrotik-subcampos-enlace.js
- **Siguiente paso:** con CI en verde (la e2e solo corre allí), entrega en docs/entregas/ y fusión en main.

## Encargo del dueño

«Ejecuta pendiente y ciérralo»: el pendiente anotado al cerrar el PR #77 (un enlace con CAPsMAN,
BGP o PPPoE marcados deja la casilla marcada y su bloque oculto).

## Hecho

- `mostrarSubcampos()`: los tres bloques se sincronizan en el `change` de su casilla y al principio
  de cada `render()`, que corre al abrir un enlace, al reponer el almacenamiento y al cargar un perfil.
- `test/e2e/e2e-mikrotik-subcampos-enlace.js`.

## Falta

- CI, entrega y fusión.

## Decisiones y hallazgos

- Solo MikroTik tiene este patrón (`change` → `hidden`) entre los nueve dimensionadores.
