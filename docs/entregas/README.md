# Entregas

Una entrega es un archivo: `AAAA-MM-DD-pr-N.md` (fecha de la fusión y número del PR), copiado de
`PLANTILLA.md` en el commit de cierre. Desde el 2026-10-31 (mejora aprobada por el dueño al cerrar el
PR #92) **lo que antes iba arriba de `PENDIENTES.md` y de `RELEVO.md` va aquí**:

| Antes | Ahora |
|---|---|
| `Última revisión: … · PR #N` en `PENDIENTES.md` | la cabecera del archivo (`# AAAA-MM-DD · PR #N · título`) |
| la entrada de *Cerrado recientemente* | `## Cerrado` |
| `Última actualización: … · PR #N` y la entrada de *Estado al cerrar esta entrega* en `RELEVO.md` | `## Estado` (con su «Criterio que conviene conservar») |

**Por qué.** Dos sesiones que fusionaban a la vez escribían las mismas líneas de esos dos archivos y
cada fusión chocaba: el PR #92 esperó más de una hora entre integrar `main`, repetir CI y volver a
chocar. Un archivo nuevo por entrega no choca con nadie.

**Lo que sigue en los archivos de siempre.** `PENDIENTES.md` guarda los puntos abiertos (y lo que se
cierra se quita o se marca en su sección); `RELEVO.md`, «Cómo retomar», los pendientes por prioridad,
las mejoras sin decidir y las decisiones abiertas, que se reescriben cuando cambian. Lo anterior al
2026-10-31 sigue donde estaba: *Cerrado recientemente* y *Estado al cerrar esta entrega* son historia.

`npm run entregas` resume las más recientes; `test/relevo.test.js` frena una entrega mal formada, un
PR repetido y la vuelta a las cabeceras de antes.
