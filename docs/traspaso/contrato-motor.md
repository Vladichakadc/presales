# Traspaso: contrato-motor

- **Tema:** Auditoría fase 2, paso 1: contrato común de motor (VERSION_MOTOR en los seis, en «Supuestos», y un lock que frena un cambio de motor sin subir su versión)
- **Rama:** claude/contrato-motor
- **Cuenta:** (no consta)
- **Estado:** cerrado sin fusionar: el dueño deja la fase 2 a la sesión dedicada (2026-11-10); lo avanzado queda en esta rama por si sirve
- **Actualizado:** 2026-11-10 05:25
- **Archivos que toca:** public/js/cisco-motor.js, public/js/huawei-motor.js, public/js/juniper-motor.js, public/js/mikrotik-motor.js, public/js/motor-ingenieria.js, public/js/fortinet-motor.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-aruba-edgeconnect.js, scripts/motores-lock.js, scripts/motores.lock.json, test/motores-version.test.js
- **Siguiente paso:** ninguno en esta rama. La sesión de la fase 2 puede tomar de aquí `scripts/motores-lock.js`, `scripts/motores.lock.json`, `test/motores-version.test.js` y `VERSION_MOTOR` en los cinco motores (5/5 pruebas; quitar o añadir una línea a un motor sin subir versión la pone en rojo); falta pasar `npm run verificar` completo

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos


- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
