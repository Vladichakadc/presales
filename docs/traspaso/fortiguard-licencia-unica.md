# Traspaso: fortiguard-licencia-unica

- **Tema:** La licencia FortiGuard única del par activo-pasivo, como alternativa elegible en el BOM de Fortinet
- **Rama:** claude/fortiguard-licencia-unica
- **Cuenta:** servicioiptv2025@gmail.com, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-28 21:20
- **Archivos que toca:** public/js/fortinet-motor.js, public/js/fortinet-reglas.js, server/seed/legacyData/fortinet.js, public/dimensionador-fortinet-fortigate.html, test/fortinet-licencia-unica.test.js, test/fortinet-ha-licencia.test.js, test/e2e/e2e-fortinet-ha-licencia.js, public/js/dimensionador-fortinet-fortigate.js (solo después de que se fusione el PR #58, que lo declara)
- **Siguiente paso:** cuando se fusione el PR #58, rebase sobre `main` y conectar `chkLicUnica` en `dimensionador-fortinet-fortigate.js` (`UI`/`leerEscenario`, `licenciaHa()` con el ahorro), y la batería e2e

## Encargo del dueño

«ejecuta la mejora propuesta como un arquitecto senior con las Skills instaladas». La mejora vigente
en `RELEVO.md` es la del cierre del PR #56: una casilla «Licencia única del par» en el paso de alta
disponibilidad que cambia las líneas del BOM (dos SKU de HA y un bundle en vez de dos).

## Hecho

- `haLicenciaUnica.precioHa`/`descHa` de la lista firmada; `disponibilidad.licenciaUnica` en el
  esquema del motor, visible solo en activo-pasivo de compra nueva; rama de `lineasComerciales`
  (dos SKU de HA, un bundle, sin BDL, a la carta bloquea, Elite y sin SKU de HA en borrador, el
  ahorro); la casilla `chkLicUnica` en el HTML; `test/fortinet-licencia-unica.test.js`.

## Falta

- La página (archivo del PR #58): leer la casilla, decirla en la cantidad, el resumen, la ficha y el
  aviso del BOM, con el ahorro; su prueba en `fortinet-ha-licencia.test.js` y la batería e2e.
- Cierre: PR, PENDIENTES, RELEVO, CLAUDE.md.

## Decisiones y hallazgos

- Texto de la guía leído de la rama `fuente/transporte-1-2026-10-28`
  (`fuente-cisco-huawei/fortinet-ha-licencia-unica-7.6.6.html`): «When a customer purchases two
  units with the HA SKU (such as 2 x FG-40F-HA), they can further purchase a single order of the
  following subscriptions: Enterprise Protection, UTP, ATP […] A la carte SKUs are not supported, and
  cannot be registered to the vSN.» Consecuencias: solo con bundle, solo con dos unidades en
  activo-pasivo, sin el SKU combinado BDL (lleva el equipo normal, no el de HA) y sin servicios a la
  carta en la misma cotización.
- La guía no dice si la mejora a FortiCare Elite ni la renovación de un par ya registrado al vSN
  van con una sola unidad: no se deduce, se deja en borrador con su motivo.

## Verificación

- `node --test`: los mismos 63 fallos que `main` (entorno sin SQLite ni dependencias completas); 0 nuevos. Las 100 de Fortinet (reglas, motor y licencia única) en verde.
