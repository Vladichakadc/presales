# Traspaso: figuras-fortinet-solapes

- **Tema:** Que npm run figuras-fortinet frene dos cajas del mismo documento y página que se solapan más de la mitad (la mejora propuesta al cerrar el PR #188), salvo las declaradas con su motivo
- **Rama:** claude/figuras-fortinet-solapes
- **Cuenta:** vladichakadc (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-11-12 03:45
- **Archivos que toca:** scripts/figuras-fortinet.js, test/figuras-fortinet.test.js
- **Siguiente paso:** cuando el PR #188 esté en main, fusionar main en esta rama (trae la caja corregida del frontal del FortiWiFi 50G, sin la cual la prueba del lock real sale en rojo), `npm run verificar`, abrir el PR y cerrar

## Encargo del dueño

«Ejecuta mejora y pendientes como un arquitecto senior de casa fabricante» (2026-11-12): la mejora es la propuesta al cerrar el PR #188.

## Hecho

- `cajasQueSePisan()` en `comprobar()`: dos figuras distintas del mismo documento y página con más del 50 % de la caja menor en común frenan, salvo las de `SOLAPES_DECLARADOS` (con motivo; una declarada que ya no se solapa también avisa).
- Pruebas con los dos casos reales (frontal del FortiWiFi 50G y trasera del FortiWiFi 50G-5G-II, cajas de main antes del #188), los límites (otra página, la mitad justa, figura compartida) y la lista declarada.

## Falta

- Fusionar main tras el #188, verificar, PR, entrega, relevo (quitar la mejora de «sin decidir»), CLAUDE.md, fusión.

## Decisiones y hallazgos

- Medido sobre el lock: de 63 pares de la misma página, solo uno se solapaba (100 %), y era un error real: el frontal del FortiWiFi 50G con la caja del FortiGate 50G. Se corrigió en el PR #188, no aquí (el lock lo declara también `claude/fortiextender-rugged-200f`, en curso).
- Las ramas abiertas que declaran el lock (fortiextender-rugged-200f y las tres de FortiWiFi 50G-SFP/DSL) solo dan ese mismo par: al fusionar main lo heredan corregido.
- `SOLAPES_DECLARADOS` sale vacío: no hay ningún solape legítimo hoy.

## Verificación

- Mutación de control: sin la comprobación, tres pruebas en rojo (los dos casos reales y la lista declarada).
- `node --test test/figuras-fortinet.test.js`: 19 de 20 en verde sobre el main de antes del #188; la que falla es la del lock real, por el par que el #188 corrige.
