# Refactor del dimensionador Aruba (2026-09-13) — registro histórico

Estos dos archivos **vivían en la raíz del repositorio** y se movieron aquí el 2026-09-13.
Son artefactos del proceso con que se construyó el refactor, no documentación vigente:
`SPEC.md` fue el contrato entre los dos frentes de trabajo y `plan.md` su plan de etapas.

**Están cerrados.** `plan.md` describe su etapa 2 como «EN CURSO»; se entregó, y lo entregado
está en el repositorio y resumido en `PENDIENTES.md` («Refactor integral del dimensionador
Aruba en 7 módulos»). No queda trabajo pendiente en ellos.

**Sus rutas no significan nada aquí.** Las referencias a `/mnt/agents/output/`, «el frente
MOTOR», «el orquestador» y los *bundles* describen la máquina en la que se ejecutó el
trabajo, no este repositorio. No se busque ese directorio: no existe.

## Por qué se conservan en vez de borrarse

`SPEC.md` es la única transcripción estructurada de dónde salen los tiers de licencia 20M–2G
—los SKU y sus precios de lista, tier por tier y término por término— y de la invariante «el
precio HA es igual al estándar». Esa procedencia es exactamente el tipo de dato que este
repositorio se obliga a poder rastrear antes de citar una cifra delante de un cliente. La
fuente viva de esas cifras es `server/seed/legacyData/aruba.js`; esto explica cómo llegaron.

## Qué NO son

No son una guía de cómo trabajar en este repositorio. Para eso está `CLAUDE.md`, y donde el
brief que estos documentos recogen contradecía a la fuente oficial del fabricante, **mandó la
fuente oficial**: la segunda PSU del Gateway 9240 es la R7J63A y no la R1C72A (que es un kit
de montaje de APs), el factor de Boost para réplicas y backups es 1,8:1 y no 3,5:1, y Dynamic
Threat Defense no fuerza el nivel Advanced. Esas desviaciones están documentadas una a una en
`PENDIENTES.md` (puntos 18, 19 y 28–32) y en los comentarios del propio código.
