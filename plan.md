# Plan — Importador de lista de precios + cierre de pendientes de accesorios (2026-09-13)

## Etapa A — Investigación web (subagentes, en paralelo)
- A1: matriz oficial de transceptores EdgeConnect (VSG SD-Branch / QuickSpecs /
  Hardware Reference) para EC-10104/10106/10108/10150 y EC-XS/S/M/L/XL; 9240 SFP28.
  Objetivo: confirmar o refutar las inferencias 1G/10G/25G del pendiente #20 y la
  matriz de la línea anterior (#21).
- A2: almacenamiento Boost en EC-10106/10108 (#23: ¿slot NM/SSD? ¿Boost lo exige?) y
  accesorios propios del EC-XS (#21: mount, PSU, kit).
- Regla: solo fuentes oficiales HPE/Aruba citables; lo no confirmado queda marcado.

## Etapa B — Cruce experto lista ∩ compatibilidad (orquestador)
- Con los resultados de A, cruzar: compatibilidad oficial ∩ SKUs existentes en la
  lista de precios (ya parseada) → actualizar ARUBA_ACCESSORY_CATALOG / ACCESSORY_COMPAT.

## Etapa C — Importador gobernado (mejora propuesta)
- `scripts/importar-lista-aruba.js`: lee el txt del distribuidor, extrae SOLO las 5
  columnas permitidas, regenera el CSV del cotizador desde la declaración del repo
  (modelos, licencias, Boost, Central, accesorios) y emite el diff contra el catálogo
  maestro (precios cambiados, nuevos, PLC→ES) para aprobación humana.
- Dry-run por defecto; `--aplicar` escribe el CSV. Nunca escribe el original ni
  columnas prohibidas. Tests del importador.

## Etapa D — Verificación y entrega
- node --check + npm run verificar → commit → push → bundle → E2E → PENDIENTES →
  informe final con tabla de pendientes + mejora propuesta.
