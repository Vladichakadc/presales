# Traspaso: juniper-motor-orden

- **Tema:** Fase 2 de la auditoria (ADR-1, corte 2): Juniper con motor, orden de candidatos y caso de contraste
- **Rama:** claude/juniper-motor-orden
- **Cuenta:** (no consta)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 05:46
- **Archivos que toca:** public/js/juniper-motor.js, public/js/dimensionador-juniper-srx.js, scripts/contrastes/juniper.js, scripts/equivalencias/juniper-orden.js, test/juniper-motor-orden.test.js, scripts/contrastes/cobertura.lock.json
- **Siguiente paso:** JuniperMotor.ordenar y evaluar con desempate por id; la pagina los usa en SRX, SSR y el SRX desacoplado; caso de contraste juniper

## Encargo del dueño

«Ejecuta fase 2 y fase 3» (2026-11-10): corte 2 de la fase 2 de la auditoría del 2026-11-09 (ADR-1): Juniper con motor, su orden de candidatos y un caso de contraste.

## Hecho

- `JuniperMotor.ordenar` (ciclo de vida, cifra y, en empate, el id en orden natural), `demandaSrx` (la cuenta de la página) y `evaluar(escenario, catalogo, opciones)` con el sobre del contrato, para SRX, SSR y el SRX desacoplado; `VERSION_MOTOR` 1.0.0 a «Supuestos».
- La página usa `evaluar` en sus tres sitios y ya no ordena.
- `scripts/equivalencias/juniper-orden.js` (2.808 casos, 0 diferencias; mutación 2.808), `test/juniper-motor-orden.test.js` (empate, barajado, demanda y sobre), `scripts/contrastes/juniper.js` (8 escenarios medidos en la pantalla de main b54cfa8) y el lock de cobertura regenerado.
- `scripts/ayuda/proyeccion-dimensionador.js`: la proyección de un fabricante en JSON, para los casos de equivalencia.

## Falta

- PR, cierre (tras fusionar el #167) y fusión.

## Decisiones y hallazgos


- Empates reales: SRX380 y SRX1500 a 2.000 Mbps de IPS; SRX300 y SRX320 en casi todo. Hoy no cambian nada: el SRX1500 ya pasó su último pedido y el ciclo de vida decide antes; el desempate protege.
- La línea base del contraste se midió en la pantalla, no se escribió: los valores supuestos fallaron en 6 de 8.

## Verificación

- `npm run verificar` en verde; `equivalencia --todos` sin diferencias; `contraste --todos` (11 casos) sin discrepancias contra la rama, y el caso de Juniper igual contra main.
