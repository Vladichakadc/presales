# Traspaso: transporte-y-fuentes

- **Tema:** La lista del transporte de documentos fuera del YAML (mejora propuesta en el PR #45) y los pendientes que esperan documento oficial
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-28 18:05
- **Archivos que toca:** scripts/transporte/, .github/workflows/traer-cisco-huawei.yml (el paso de descarga y la cabecera; ver *Decisiones* por claude/fotos-modelo-cisco), test/transporte-documentos.test.js, test/traer-exploracion.test.js, test/traer-pantalla-login.test.js, test/workflows-node-e.test.js, public/js/fortinet-reglas.js, public/js/fortinet-motor.js, test/fortinet-reglas.test.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/fuentes.js
- **Siguiente paso:** cuando se fusione el PR #51 (página de Fortinet): corregir en `dimensionador-fortinet-fortigate.js` «la licencia no se comparte en HA» (F3), verificación con navegador, PR y cierre

## Encargo del dueño

«Ejecuta estos pendientes: esperan documento oficial (la PQC de Huawei, los gateways AOS, los
Meraki, los SRX de sucursal y el SRX4100, y los Nokia 7250/7220 IXR; además los de Cisco, Juniper,
Aruba, MikroTik, Huawei y Fortinet de RELEVO.md). Ejecuta la mejora propuesta.» La mejora es la del
PR #45: la lista del transporte fuera del YAML.

## Hecho

- `scripts/transporte/documentos.js` (la lista, 392 entradas) y `traer.js` (la lógica), generados del
  programa exacto que bash entrega hoy a Node: recompuestos, casan línea a línea con él (salvo dos
  `catch (e)` sin usar que pasan a `catch`), y con `SOLO=no-existe` los dos fallan igual. Al moverlo
  salió un archivo repetido (`huawei-a800-producto.html`, misma URL dos veces): se queda la entrada
  con `debeContener`.
- Pruebas: `test/transporte-documentos.test.js` (nueva, por `require()`), y `traer-exploracion`,
  `traer-pantalla-login` y `workflows-node-e` leen el módulo. Dos siguen en rojo hasta cambiar el
  workflow (esperan a que se fusione el PR #49, que declara `traer-cisco-huawei.yml`).

- El workflow ejecuta `node scripts/transporte/traer.js` (con `SOLO` en el entorno); la corrida real
  `fuente/transporte-1-2026-10-28` lo probó en Actions. Fusionado `main` con el PR #52: sus entradas
  de los ASR, regeneradas al módulo (402 entradas).
- **Fortinet F3 cerrado**: `haLicenciaUnica` en 8 FortiGate (40F, 60F, 61F, 70F, 71F, 80F, 81F, 100F)
  desde «Single FortiGuard license for FortiGate A-P HA cluster» (FortiOS 7.6.6), con el SKU de HA
  de la lista firmada donde lo trae y el heartbeat de la serie; aviso informativo en A-P.
- Leído sin cerrar: la ficha N1 Business Mode (V100R019, vieja); la página del AR6700V-L (las nubes,
  sin regiones ni «flavors»); la matriz de MikroTik de hoy (sigue sin el CCR2004-16G-2S+PC).

- **Encargo del dueño (2026-10-28 17:50): «revisar y cerrar estos temas, busca por internet»** (los
  tres leídos sin cerrar). Corrida `fuente/transporte-2-2026-10-28`:
  - **N1 Advanced frente a Foundation: cerrado del todo.** Ya estaba cerrado el 2026-10-14 (leído en
    el navegador del dueño) y RELEVO lo seguía dando por abierto. La ficha de la solución SD-WAN
    R25C00, traída, son los mismos 1.105.535 bytes con la huella que el vigía tiene verificada, y
    su tabla (pp. 13-14) casa con `N1_SOLO_ADVANCED` y con la nota de `fuentes.js` (que ahora lo
    dice, con la fecha de generación del PDF, 2025-10-15).
  - **Regiones y «flavors» del AR6700V-L: localizado, no leído.** Las guías de despliegue por nube
    tienen una sección «Supported Flavors» (Azure V600R025C00 EDOC1100591294, Azure V600R025C10
    EDOC1100592603, GCP V600R025C10 EDOC1100592600, Huawei Cloud V600R023C10 EDOC1100368764). Al
    ejecutor le llega el cascarón de JavaScript (3.800 bytes) y Huawei niega el navegador
    automatizado: lo cierra una persona con navegador. El buscador indexa su texto, así que no
    parecen pedir cuenta (no se pudo comprobar).
  - **CCR2004-16G-2S+PC: sigue sin fuente.** Su manual (help.mikrotik.com, 25-08-2022) no dice qué
    módulos admiten sus SFP+, y la matriz de hoy no lo lista. Atribuirle la fila del
    CCR2004-16G-2S+ sería inferir: sigue «a consultar».
- Main fusionado otra vez con el PR #54: se toman sus `scripts/transporte/` y sus pruebas; mis
  entradas, al final de su lista.

## Falta

- Verificación con navegador, PR, cierre y despliegue.

## Decisiones y hallazgos

- 2026-10-28 17:45 UTC: **el PR #54 (claude/fotos-modelo-cisco) hizo también la mejora del
  transporte** (412 entradas, con la exploración del A800 renombrada en vez de borrada y la
  posición de `huawei-img` corregida, y una corrida real que dio lo mismo que la de los ASR). Es la
  misma mejora y está verificada: **se queda la suya**. Esta rama no vuelve a proponer la suya; al
  fusionar main toma sus archivos y solo añade las tres entradas propias. Lo que queda de este tema
  es Fortinet F3 y lo leído.
- `dimensionador-fortinet-fortigate.js` lo declara el PR #51: el texto «la licencia no se comparte
  en HA» (resumen y memoria) se corrige después de que se fusione, no antes.

- 2026-10-28 17:30 UTC: `claude/fotos-modelo-cisco` (otra sesión, traspaso de las 09:55, después
  del de este tema) añade entradas al YAML de `traer-cisco-huawei.yml`. **Quien fusione segundo
  adapta**: si esta rama llega antes, sus entradas pasan tal cual al final de
  `scripts/transporte/documentos.js` (mismo formato, sin la sangría del YAML) y
  `test/transporte-documentos.test.js` frena una entrada que vuelva al YAML.

- 2026-10-28 14:03 UTC: `claude/figuras-cisco-isr-mx` (otra sesión) declaró también
  `traer-cisco-huawei.yml` y le añadió 14 líneas de entradas (figuras de los ASR). Para no
  romperle el rebase, **esta rama se fusiona después de la suya**: al rebasar se regenera
  `scripts/transporte/documentos.js` desde su YAML fusionado (generador en el scratchpad de la
  sesión; si se perdiera: el programa que bash entrega del heredoc, partido en `DOCS` y la lógica),
  y sus entradas quedan en el módulo sin que tenga que tocar nada.

- 2026-10-28 13:37 UTC: la rama claude/documentos-pendientes (cuenta servicioiptv2025) declaró
  traer-cisco-huawei.yml, fuentes.js, fuentes.lock.json, aruba.js, juniper.js y pqc.test.js doce
  segundos antes que este traspaso, y su tema cubre la PQC de los gateways AOS-8 y las fichas
  inglesas de Juniper MX y SSR100. Se le cede: esos pendientes y esos archivos son suyos hasta que
  fusione.

- El PR #46 (otra sesión, sin traspaso) declara public/js/bom.js y cinco dimensionadores: no se tocan.

## Verificación

- (pendiente)
