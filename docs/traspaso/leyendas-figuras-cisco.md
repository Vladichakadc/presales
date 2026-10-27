# Traspaso: leyendas-figuras-cisco

- **Tema:** Leyendas de los números de las figuras de Cisco en la lupa (retomado de la sesión 01V8T7S6ACDK2…)
- **Rama:** claude/leyendas-cisco-fusion (la anterior, claude/leyendas-figuras-cisco con el PR #23, queda intacta)
- **Cuenta:** servicioiptv2025, sesión 01V8T7S92WvujFK1KCusavSu (retoma)
- **Estado:** en curso
- **Actualizado:** 2026-10-27 13:12
- **Archivos que toca:** public/data/cisco-vistas-equipos.json, public/js/ficha.js, test/cisco-leyendas.test.js, test/e2e/e2e-cisco-leyendas.js, .github/workflows/pantallas.yml, PENDIENTES.md, RELEVO.md
- **Siguiente paso:** leer las anotaciones `e2e` de la comprobación `pantallas` de esta rama (`gh api repos/Vladichakadc/presales/check-runs/<id>/annotations`), corregir y fusionar

## Encargo del dueño

«Al ampliar la imagen deberá mostrar la tabla donde se indica a qué hace referencia cada puerto con
su número». Y el 27-oct, 12:58: «valida si ya ejecutaste la mejora de los gráficos con la condición
indicada y ejecuta las mejoras propuestas».

## Hecho

- Lo de la sesión anterior (67 caras de 38 modelos con leyenda; lupa y tarjeta la pintan),
  rebasado sobre main en una rama nueva: reescribir la rama ajena con un push forzado se denegó.
- Las dos sesiones llamaron «sexagésima» a su entrega: esta pasa a sexagesimoprimera.
- `pantallas.yml`: cada fallo del e2e sale también como anotación `::error title=e2e::`.

## Falta

- `pantallas` estaba en rojo en el paso del e2e (dos corridas) y no se podía leer por qué desde una
  sesión (logs y artefactos en un dominio denegado). Corregir lo que digan las anotaciones.
- Fusionar, cerrar el PR #23; después, las mejoras propuestas.

## Decisiones y hallazgos

- El PR #23 no tenía CI en su último commit: con conflictos, GitHub no crea la ref de fusión.

## Verificación

- `node --test test/workflows-*.test.js`: 17/17; la anotación se simuló con y sin fallos.
