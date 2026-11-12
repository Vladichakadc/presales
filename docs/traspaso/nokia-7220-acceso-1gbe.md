# Traspaso: nokia-7220-acceso-1gbe

- **Tema:** Quitar «1 GbE» del acceso del 7220 IXR (mejora propuesta al cerrar el PR #182): ningun modelo lo publica; las opciones de la pagina quedan atadas a los puertos del catalogo por una prueba
- **Rama:** claude/nokia-7220-acceso-1gbe
- **Cuenta:** sesion de Claude Code de la auditoria (session_016ruRWEjxhbmKTGnagDrUvb)
- **Estado:** reservado
- **Actualizado:** 2026-11-12 17:44
- **Archivos que toca:** public/dimensionador-nokia-7220ixr.html, public/js/nokia-fabric-motor.js, test/nokia-motores.test.js, scripts/contrastes/nokia-fabric.js, scripts/contrastes/cobertura.lock.json
- **Siguiente paso:** Quitar la opcion, exportar velocidadesAcceso y atar el HTML al catalogo con una prueba

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos

- La medición de equivalencias vigila `nokia-fabric` (por public/js/nokia-fabric-motor.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
