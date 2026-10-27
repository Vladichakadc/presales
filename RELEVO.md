# Relevo

Última actualización: 2026-10-27 · sexagesimoséptima entrega

Informe para continuar el trabajo. Lo pidió el dueño del repositorio el 2026-10-27: «de aquí en
adelante, un informe de pendientes y mejoras para que la cuenta **servicioiptv2025@gmail.com**
continúe ejecutando los cambios; van a trabajar en el proyecto juntos». Se reescribe en el commit
que fusiona cada entrega en `main` (instrucción permanente en `CLAUDE.md`). El detalle de cada
punto está en `PENDIENTES.md`; aquí va lo que hace falta para retomar sin leerlo entero. Lo que
está en curso no va aquí: lo dice `npm run traspasos` (protocolo en `docs/traspaso/README.md`).

## Cómo retomar

1. **Accesos** (los da el dueño; esta sesión no puede): colaborador en GitHub de
   `Vladichakadc/presales` (*Settings → Collaborators*) y, si vas a mirar despliegues, miembro del
   proyecto `Presales` de Railway. Con Claude Code, abre una sesión sobre el repositorio:
   `CLAUDE.md` se carga solo y dice cómo se trabaja aquí.
2. **Antes de tocar nada**: trae `main` y corre `npm run traspasos`: lista cada rama con su
   `docs/traspaso/<tema>.md` y los archivos que declara, y los PR abiertos sin traspaso con los suyos. No se toma un tema ni un archivo ajeno.
3. **Mientras trabajas**: un tema, una rama y su traspaso (de `docs/traspaso/PLANTILLA.md`) al día en
   cada commit, y empuja a menudo: lo no empujado se pierde si la sesión se corta. Antes de fusionar
   en `main`: `npm run verificar`, `npm run auditar`, el servidor con `NODE_ENV=production`, la
   pantalla conducida en el navegador (`npm run pantallas`, los casos de `npm run contraste`,
   `npm run e2e`, `npm run puerta`). Railway despliega `main` cuando CI pasa.
4. **Al fusionar**: rebase sobre `main`; `PENDIENTES.md` (lo cerrado a *Cerrado recientemente*),
   este archivo y `CLAUDE.md` si cambió una regla; el traspaso del tema se borra en ese commit.
5. **Lo que no se negocia**: nunca se inventa un dato (sin documento oficial, `null` y «sin dato»);
   un 403 del proxy de egreso se reporta, no se rodea; los documentos de los fabricantes se traen con
   `traer-cisco-huawei.yml` a una rama `fuente/*` nueva por corrida; las decisiones del dueño no se
   toman por silencio; todo el texto visible, en español.

## Estado al cerrar esta entrega

- **Sexagesimoséptima entrega**: **retirado el piloto de IA «del pliego al escenario»** del
  dimensionador Cisco, por decisión del dueño (gastaba tokens y no servía): panel, ruta
  `/api/escenario/desde-documento`, servicio, módulo del navegador y sus pruebas. La IA que queda es
  la sincronización del catálogo.
- **Sexagesimosexta entrega** (PR #31): la criptografía post-cuántica, con documento oficial en
  43 equipos más. PPK (RFC 8784) en los 10 Catalyst 8000 y los 5 ISR 1000 (capítulo de PPK de la
  guía de IOS XE 17: 17.11.1a, y 17.12.1a en el ISR y el 8500), en los 10 EdgeConnect (technical
  brief de cifrados de ECOS) y en 16 MikroTik (RouterOS 7.21, donde la ficha dice «RouterOS v7», y
  CHR); MACsec/ANYsec quantum-safe en el 7750 SR-1x. Los documentos, en `fuente/pqc-2-2026-10-27`.
  **Criterio que conviene conservar**: la PPK de un sistema operativo solo se marca en el modelo
  que tiene documento de que corre esa versión (por eso los ASR, fuera de venta, y siete MikroTik
  siguen en «no consta»).
- **Sexagesimoquinta entrega**: `npm run traspasos` (y el arranque) enseña también los PR abiertos
  sin traspaso, con sus archivos, y ya no confunde las ramas `fuente/*` con temas. **Antes de tomar
  un tema, míralo entero**: dos veces el 27-oct se duplicó trabajo por no ver la rama de otra sesión.
- **Sexagesimocuarta entrega**: las figuras de Juniper, con la tabla de sus números, van en la
  hoja «Fotos del equipo» del Excel del BOM (PR #32), como ya hacían Aruba, Fortinet, Huawei y Cisco.
- **Sexagesimotercera entrega**: las figuras de Juniper (36) y del Aruba 7010 (2) dicen qué es
  cada número en la lupa, con su tabla literal y traducida (PR #29); la interconexión EdgeHA va
  por el puerto que cubre el agregado del sitio, no por el primer RJ-45 libre (PR #30).
- **Retoque tras la sexagesimosegunda** (PR #28): el número de la leyenda de Cisco sin
  `aria-label` (prohibido en un `span` sin rol). El PR #23 se cerró, superado por el #24.
- **Sexagesimosegunda entrega**: las tres mejoras propuestas, hechas (cita mínima del piloto del
  pliego, la interconexión EdgeHA por el puerto que le toca y las figuras de Cisco con su leyenda en
  el Excel), y la leyenda de las figuras de Cisco fusionada (PR #24). **Los fallos del e2e se leen
  ahora desde una sesión**: `gh api repos/Vladichakadc/presales/check-runs/<id>/annotations`
  (los logs y artefactos de Actions están en un dominio que el proxy deniega).
  Por el camino se arregló que **el Excel de Cisco no se descargaba** (la hoja «Supuestos» recibía
  un texto donde espera pares).
- **Producción**: `main` lleva esta entrega (ver `git log`); Railway despliega cuando CI pasa y la
  sonda (`sonda-produccion.yml`) abre un issue con la etiqueta `despliegue` si algo falla.
- **Sexagesimoprimera entrega**: las figuras del dimensionador Cisco dicen qué es cada número. 67 caras de 38
  modelos traen la leyenda de su ficha o guía de hardware (número, rótulo literal y traducción);
  la lupa la pinta bajo la figura y la cambia con la cara, y la tarjeta la ofrece plegada
  (`frontLeyenda`/`rearLeyenda` en `cisco-vistas-equipos.json`, opt-in de `ficha.js`).
- **Sexagésima entrega**: el arranque de cada sesión remota lista los temas en curso (`npm run
  traspasos`) antes de instalar nada. **Aviso**: esta sesión y la de la entrega 59 hicieron a la vez
  el mismo piloto de IA porque aquella empujó a `main` sin rama de traspaso; el duplicado se cerró
  (PR #22). Antes de empezar un tema, rama y traspaso empujados: es lo que lo hace visible.
- **Entregado**: el requisito «Exigir criptografía post-cuántica» en los siete dimensionadores
  (`public/js/pqc.js`); el piloto de IA «del pliego al escenario» en el dimensionador Cisco
  (`POST /api/escenario/desde-documento`, `public/js/pliego.js`); la skill `accessibility` de ECC;
  y cerrados con documento oficial: la PQC de los diez FortiGate que faltaban (los 58 la
  documentan), la bahía 0 del C8570-G2 con la bahía 1 en 100G, el puerto de la interconexión
  EdgeHA de Aruba y el PoE a 48 V del MikroTik L009.

## En curso

Lo dice `npm run traspasos`, no este archivo (una tabla común chocaría en cada fusión). Al cerrar
esta entrega, ninguna rama remota llevaba un traspaso abierto.

## Pendientes, por prioridad

### Solo los puede hacer el dueño

0. **Borrar las ramas** `claude/leyendas-figuras-cisco`, `claude/leyendas-retoques` y
   `claude/ia-pliego-cisco` (el PR #23 ya está cerrado): el control de permisos de la sesión no deja
   borrar ramas remotas. Sus commits están en `main` o en sus PR cerrados; es solo limpieza.

1. **Proteger `main`**: *Settings → Rules → Rulesets* (o *Branches*): exigir las comprobaciones
   `verificar` y `pantallas` y «Require branches to be up to date before merging», **con el
   administrador en la lista de omisión** (las sesiones empujan directo a `main`). Aprobado, sin
   configurar: el 27-oct una sesión con acceso de administrador lo intentó por la API y el control
   de permisos de la sesión lo denegó; se hace a mano.
2. **Invitar a la cuenta colaboradora** en GitHub y, si hace falta, en Railway.
3. **Incidente de seguridad de Railway (20 al 22-oct), leído el 27-oct**: descifraron variables de
   entorno de hasta un 1,85 % de los espacios de trabajo y buscaban claves de IA. Rotar
   `ANTHROPIC_API_KEY` (crear una nueva en la consola de Anthropic, ponerla en Railway y revocar la
   vieja; mirar si hubo consumo raro) y `SESSION_SECRET` (cierra las sesiones); `AUTH_PASSWORD` solo
   crea el primer administrador, así que la contraseña se cambia en «Mi cuenta». Revisar el *Security
   log* y las apps de GitHub. Detalle en *Decisiones* de `PENDIENTES.md`.
4. **`ANTHROPIC_API_KEY` en Railway**: sin ella, la sincronización del catálogo responde 503
   (lo dicen en pantalla). `/api/sync/estado` dice si está puesta.
5. **Cuenta de Huawei** (Info-Finder pide sesión): sin ella no hay ciclo de vida de Huawei, ni el
   tope de túneles y rutas por modelo AR.

### Se pueden hacer desde una sesión, sin acceso especial

1. **Mejoras propuestas**: ninguna abierta al cerrar la sexagesimocuarta entrega (abajo).

### Esperan un documento oficial (se cierran trayéndolo por Actions)

- **Criptografía post-cuántica sin documento**: Huawei (pide la cuenta), los gateways AOS de
  Aruba, siete MikroTik cuya ficha dice solo «RouterOS» (lo cerraría un documento con la versión
  que corre cada uno), los ASR 1000 (su boletín de fin de venta con la última versión), los G2-MX
  (MX OS), el SRX4100 y los SRX de sucursal, y los Nokia 7250 IXR y 7220 IXR. Dicen «no consta» y
  el requisito los aparta con ese motivo.
- **Cisco**: ficha del Secure Firewall dedicado (y decidir si entra al portal), precio de Secure
  Access por usuario (CCW), velocidad mínima de los mGig de los C8111/C8121-G2-MX, 10GBASE-T en
  SFP+ fuera de la serie 8300 y de las 8100 VAI/VAP, módulos del ASR (fuera de venta), breakout
  4x10G (pide su cable u óptica en el catálogo).
- **Juniper**: ficha de la serie MX en inglés, cifra de inspección del SSR, foto del SSR120 base,
  FEC del SSR; no hay lista de precios ni SKU de chasis.
- **Aruba**: ranuras de expansión del 9114 y el 9240 (QuickSpecs con SKU y precio), EC-XL S3N77A, y
  las dos fuentes que solo devuelven el cascarón de la página (la URL del PDF se copia desde el
  Chrome del dueño en `hpe.com`; una sesión puede hacerlo con Claude en Chrome si el Chrome del
  dueño está abierto con la extensión: el 27-oct no lo estaba).
- **MikroTik**: si la cifra IPsec es por sentido o la suma (respuesta escrita de soporte), figuras
  traseras que la galería no publica, el CCR2004-16G-2S+PC en la matriz de compatibilidad.
- **Huawei**: ficha de iMaster NCE-Campus, nubes del vCPE, funciones de N1 Advanced frente a
  Foundation.
- **Fortinet**: F3 (FortiGuard en HA activo-pasivo), el resto de F4, F5 (derates), 17 renovaciones
  sin precio en la lista firmada, co-term y heartbeat de HA.

### Bloqueado por acceso (se reporta, no se rodea)

El proxy de egreso de los entornos de Claude Code en la nube rechaza los dominios de los
fabricantes (y `presales.up.railway.app`); los ejecutores de GitHub Actions sí llegan, y por eso
existen los workflows de transporte. Huawei y HPE niegan además el navegador automatizado (Akamai).

## Mejoras propuestas sin decidir

- **La versión mínima de software en la propuesta cuando se exige PQC** (propuesta al cerrar la
  sexagesimosexta entrega). Con «Exigir PQC», el equipo recomendado lo cumple **desde una versión**
  (IOS XE 17.12.1a en el ISR, RouterOS 7.21 en MikroTik, Junos 24.4R1-S2 en el SRX4700…), pero la
  hoja «Supuestos» del Excel solo dice el nivel exigido. Añadir en `matrizSupuestos` (`bom.js`) una
  fila «Criptografía post-cuántica: <mecanismo> desde <versión> (fuente)» cuando el escenario la
  exige, leída de `m.pqc`. Evita entregar una propuesta que exige PQC a un cliente con el equipo en
  una versión anterior (un ISR en 17.9 no la trae). Cuesta una fila en `bom.js` (compartido por los
  siete) y su prueba en `bom-supuestos.test.js`; si se hace mal, la hoja «Supuestos» de los siete
  descuadra o el Excel no se descarga (le pasó a Cisco), y lo vería el e2e. Se decide por el dueño.
- (Al cerrar la sexagesimocuarta y la sexagesimoquinta: ninguna nueva.)

## Decisiones del dueño abiertas

- La protección de `main` (aprobada, falta configurarla) y el aviso de Railway (ver arriba).
- Nada más: las dos de la IA y la de las variantes fuera del catálogo se tomaron el 2026-10-27 por
  la opción recomendada (ver *Decisiones* en `PENDIENTES.md`).
