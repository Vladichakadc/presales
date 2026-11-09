# Traspaso: figuras-fortinet

- **Tema:** Extractor de las figuras de Fortinet con lock (ficha, página, caja y huella de cada figura), como el de Huawei; mejora propuesta al cerrar el PR #148
- **Rama:** claude/figuras-fortinet
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en revisión
- **Actualizado:** 2026-11-09 11:52
- **Archivos que toca:** scripts/figuras-fortinet.js, scripts/figuras-fortinet.lock.json, test/figuras-fortinet.test.js, package.json
- **Siguiente paso:** abrir el PR (depende del #148, que trae las fwf-*), commit de cierre y fusionar tras el #148.

## Encargo del dueño

«Ejecuta mejora propuesta»: la propuesta al cerrar el PR #148, un extractor de las figuras de Fortinet
con lock, como el de Huawei.

## Hecho

- `scripts/figuras-fortinet.js` (`npm run figuras-fortinet`): comprueba lock, figuras y pies; con
  `--rehacer <carpeta> [--solo] [--aplicar]` rehace cada figura desde su caja (pdftoppm + cwebp o Pillow).
- `scripts/figuras-fortinet.lock.json`: 32 documentos (rama fuente/* y huella) y 73 figuras (documento,
  página, caja en puntos, tamaño, huella, cómo se midió y diferencia de referencia).
- `test/figuras-fortinet.test.js`: 10 casos.

## Falta

- Commit de cierre (entrega, CLAUDE.md, RELEVO) y fusionar después del #148.

## Decisiones y hallazgos

- Las cajas se midieron por correlación de la figura servida en la página que cita su pie, y se
  afinaron a la escala de cada figura (correlación 0,85-0,99). Las 73 se rehacen con el mismo encuadre.
- Las traseras del 7081F y del 7121F salen de la segunda página que cita su pie (12 y 13).
- Un umbral único de diferencia no sirve: el 7121F, muy denso, da 20 estando alineado. Cada figura
  guarda su diferencia de referencia y se admiten 3 puntos más.
- Una lectura a baja resolución hizo creer que cinco figuras eran de otra edición; a resolución
  completa son el mismo dibujo con unos píxeles de desfase.

## Verificación

- 73/73 IGUAL al rehacer sin aplicar; mutaciones: caja movida 8 pt → DISTINTA; PDF de otra edición →
  EDICION; figura tocada → la comprobación frena; `--aplicar` probado y restaurado.
- `node --test test/figuras-fortinet.test.js test/fortinet-vistas-equipos.test.js`: 23/23.
