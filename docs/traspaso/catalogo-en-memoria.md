# Traspaso: catalogo-en-memoria

- **Tema:** Fase 3 de la auditoria, ADR-3 corte 1: el catalogo en memoria con las mismas filas que la siembra, y cada proyeccion medida contra SQLite sin cambiar lo que se sirve
- **Rama:** claude/catalogo-en-memoria
- **Cuenta:** sesion de Claude Code de la auditoria (session_016ruRWEjxhbmKTGnagDrUvb)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 14:10
- **Archivos que toca:** server/seed/seedCatalog.js, server/services/catalogProjection.js, server/services/catalogoEnMemoria.js, test/catalogo-en-memoria.test.js
- **Siguiente paso:** Abrir el PR del corte 1, escribir su cierre y fusionarlo con el CI en verde; después, reservar el corte 2 (las rutas leen del catalogo en memoria).

## Encargo del dueño

«Ejecuta fase 2 y fase 3» (2026-11-10) y «Si fusióna las fases» (2026-11-10). La fase 3 de la hoja de
ruta de la auditoría es «para decidir»: ADR-3, las dependencias mayores (hechas en el PR #173) y los
precios. El ADR-3 quedó «para decidir después de ADR-1», que está hecho (PR #167 a #171). Por la regla
de CLAUDE.md («cuando el dueño pide ejecutar, la opción recomendada de una decisión pendiente se ejecuta
y se anota»), se ejecuta su opción recomendada, la A: el catálogo en memoria, sin SQLite.

## Hecho

- Corte 1 (este commit): `server/services/catalogoEnMemoria.js` da los diez modelos con el subconjunto
  de Sequelize que usan la siembra y las proyecciones; `seedCatalog(modelos)` y
  `catalogProjection.usarModelos(modelos)` los aceptan sin cambiar lo que hacen por defecto (SQLite).
  Las consultas de las proyecciones llevan escrito el orden que SQLite ya daba.

## Falta

- PR, cierre y fusión del corte 1.
- Corte 2: el servidor siembra el catálogo en memoria al arrancar y las rutas leen de él; SQLite sigue
  para el «aplicar» local. Medir con la misma prueba, `pantallas`, `contraste` y la e2e.
- Corte 3: fuera SQLite, Sequelize y `sqlite3` (y su `allowScripts`); el «aplicar» local pasa a
  `npm run propuesta`; `/salud`, la línea `[db]` del arranque, `pantallas-servidas.js` y CLAUDE.md.

## Decisiones y hallazgos

- Ni la siembra ni las 29 consultas se reescriben: corren tal cual contra los modelos en memoria. Es lo
  que dice el ADR («con las mismas funciones de catalogProjection.js») y lo que deja medir la igualdad.
- Lo que SQLite daba sin `order`: las tablas de un fabricante (piezas, ópticas, soporte, licencias) por
  `code`, el orden de su índice único; lo incluido por `belongsToMany` (categorías y piezas de un
  equipo) por el `id` del hijo, y las ópticas de una categoría por `id`. Ahora está escrito en las
  consultas (`ORDEN_CODIGO`, `[Modelo, 'id', 'ASC']`). Con SQLite, las 16 proyecciones salen idénticas
  byte a byte entre main y la rama (1,46 MB de JSON); invertir el orden de una sola consulta se nota.
- Las tablas intermedias (`ProductOptic`, `ProductPart`) no tienen `id` en SQLite: su clave es el par.
- `deepStrictEqual` no mira el orden de las claves de un objeto; un desplegable que recorre un objeto sí.
  La prueba compara el texto JSON exacto.
- Las proyecciones devuelven objetos de `legacyData/` por referencia (por ejemplo, `FUNCIONES` de
  Fortinet): modificar su salida modifica `legacyData` en el proceso, con SQLite igual. No es de este
  corte, pero el corte 2 no puede cachear una proyección sin congelarla o servirla ya serializada.

## Verificación

- `test/catalogo-en-memoria.test.js` (20 pruebas, 2,7 s): las diez tablas con las mismas filas que
  SQLite; las 16 proyecciones con el mismo texto JSON y la misma igualdad estricta; un precio cambiado
  en el almacén se ve (control); una fila leída y modificada no cambia la siguiente consulta.
- `npm run verificar`: 1.559 pruebas en verde, los 12 avisos de lint de antes.
