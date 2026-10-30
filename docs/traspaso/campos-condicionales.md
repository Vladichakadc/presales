# Traspaso: campos en línea, también en bloques condicionales y filas nuevas

- **Tema:** la batería de campos en línea recorre también los bloques que aparecen al marcar otro campo y las filas que se añaden con un botón
- **Rama:** claude/campos-condicionales
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-30 08:10
- **Archivos que toca:** test/e2e/e2e-campos-en-linea.js
- **Siguiente paso:** leer los avisos `RESUMEN - ` y los fallos `e2e` de la comprobación `pantallas` del PR y enlazar cada campo que salga «se queda atrás»

## Encargo del dueño

«Revisa la mejora propuesta y optimízala» (2026-10-30), sobre la propuesta al cerrar el PR #74.

## Hecho

- Recorrido de bloques condicionales: tras cambiar un campo se prueban los que ese cambio hizo aparecer, hasta 2 niveles, antes de reponerlo. Tope de 160 por página.
- Botones «+ Añadir» de la columna de parámetros: el botón también se mide (debe recalcular en línea) y los campos de la fila nueva se prueban.
- Identidad estable del campo (id o fila + clave): una fila repintada no se vuelve a probar y se repone aunque la página haya rehecho el nodo.
- Starlink en local: 81 campos (22 aparecen al marcar otro); un campo saboteado dentro del bloque de streaming sale en rojo.

## Falta

- La medición en CI de las otras ocho páginas y el arreglo de lo que salga.

## Decisiones y hallazgos

- Optimizaciones sobre la propuesta: solo se prueban los campos que revela ESE cambio (no todos de nuevo), cada uno una vez por página, profundidad 2 y tope por página, y las filas se añaden al final para no alterar el escenario de lo anterior.

## Verificación

- Starlink en local: TODO VERDE; sabotaje en el bloque condicional: 1 FALLO, como debe.
