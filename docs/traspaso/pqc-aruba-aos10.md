# Traspaso: pqc-aruba-aos10

- **Tema:** PQC de los gateways Aruba con AOS-10: traer la CLI-Bank de AOS-10 (ppk-add, ppk-mandatory) y cerrar el pendiente solo con cita literal
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-03 10:14
- **Archivos que toca:** scripts/transporte/documentos.js, server/seed/legacyData/aruba.js, server/seed/legacyData/fuentes.js, server/seed/legacyData/fuentes.lock.json
- **Siguiente paso:** traer por traer-cisco-huawei.yml las páginas de la CLI-Bank de AOS-10 y leerlas

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es el pendiente «PQC de los
gateways Aruba 9004-LTE y 9114», y con él la PPK de todos los gateways con AOS-10.

## Hecho

- Las tres entradas del transporte (`scripts/transporte/documentos.js`): la guía de CLI de AOS-10 en PDF,
  el índice «What's New in AOS-10 CLI» y las notas «What's New» de AOS-10.8.0.0. URL buscadas, no adivinadas.

## Falta

- Lanzar `traer-cisco-huawei.yml` desde esta rama (solo esas tres, rama `fuente/aruba-aos10-ppk-2026-11-03`),
  leerlas y, solo con cita literal que nombre la PPK en el gateway con AOS-10, cerrar el pendiente.

## Decisiones y hallazgos


- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
