---
name: feature-planning
description: Planificar un cambio en Presales antes de escribir código — convierte una petición vaga en un plan por archivo con riesgos y verificación. Úsala para cualquier cambio que toque más de uno o dos archivos, el catálogo, un motor de dimensionamiento o el BOM, o que sea ambiguo.
metadata:
  output: un plan breve en markdown, revisado con el dueño antes de programar
---

# Planificación de cambios en Presales

Pasar de «quiero X» a un plan preciso ANTES de editar. Presales es Express 4 + SQLite (Sequelize) sin build: `public/*.html` y `public/js/*.js` se sirven tal cual, y los motores `*-motor.js` corren igual en el navegador y en el servidor. El plan es breve y concreto; no es una especificación.

## Cuándo usarla

- El cambio cruza capas: `legacyData` → `seedCatalog` → SQLite → `catalogProjection` → pantalla.
- Toca un motor de dimensionamiento, el cotizador o el BOM (la salida es una recomendación comercial).
- El requisito admite varias lecturas.

Un cambio trivial de un archivo se hace directamente.

## Pasos

1. **Reformula el objetivo en una frase.** Qué quiere el dueño y quién se beneficia.
2. **Antes de planear, mira lo que ya está tomado.** `npm run traspasos` dice qué temas tienen rama y qué archivos declaran; no se toma un archivo ajeno. Busca en `PENDIENTES.md` solo los puntos abiertos que tocan la tarea (no se lee entero).
3. **Mapea el estado actual leyendo el código**, no suponiéndolo: motor, página `dimensionador-*.js`, ruta en `server/routes/`, proyección en `server/services/catalogProjection.js`, datos en `server/seed/legacyData/`.
4. **Define «hecho»** con resultados observables, incluidos los bordes: demanda 0, campos ausentes, equipos fuera de venta (`eol`), empates de cifra, notas con comillas.
5. **Lista los cambios archivo por archivo**: ruta, qué cambia y por qué. Marca lo compartido (`catalogProjection.js`, `bom.js`, los motores) por su alcance.
6. **Riesgos del dominio.**
   - Nunca se inventa un dato: sin fuente queda `null` y la pantalla dice «sin dato». Un resumen de buscador no es fuente.
   - La recomendación no puede depender del orden del catálogo: todo `sort` de un motor termina en un desempate por id.
   - La base es efímera y se resiembra en cada despliegue: nada que importe vive solo en SQLite (el estado persistente va en `AUTH_STATE_DIR`).
   - Todo el texto visible, en español; sin emoji fuera de `.md`.
7. **Verificación.** `npm run verificar` y `npm run auditar`; arranque con `NODE_ENV=production`; si se toca `public/`, conducir la pantalla en un navegador y correr `npm run pantallas`, `contraste` y `visibles`. Di qué no se puede verificar.
8. **Revisa el plan con el dueño** si no es trivial. Las decisiones del dueño no se toman por silencio.

## Plantilla

```markdown
## Objetivo
<una frase>

## Hecho cuando
- [ ] <resultado observable>
- [ ] <caso borde cubierto>

## Cambios
- `ruta/archivo` — <qué y por qué>

## Riesgos
- <semántica del dominio o acción irreversible>

## Verificación
- <cómo se comprobará>
```

## Notas

- Prefiere editar archivos existentes y reutilizar los helpers del repositorio antes de crear nuevos.
- No amplíes el alcance a mitad del plan: lo adyacente se anota como seguimiento.
- Un cambio que escribe una entrega sigue `docs/entregas/PLANTILLA.md`.
