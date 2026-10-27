# Relevo

Última actualización: 2026-10-27 · sexagesimoprimera entrega

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
   `docs/traspaso/<tema>.md` y los archivos que declara. No se toma un tema ni un archivo ajeno.
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
4. **`ANTHROPIC_API_KEY` en Railway**: sin ella, la sincronización y el piloto de IA responden 503
   (lo dicen en pantalla). `/api/sync/estado` dice si está puesta.
5. **Cuenta de Huawei** (Info-Finder pide sesión): sin ella no hay ciclo de vida de Huawei, ni el
   tope de túneles y rutas por modelo AR.

### Se pueden hacer desde una sesión, sin acceso especial

1. **Probar el piloto de IA con la API de verdad** (cuando la clave esté en producción): un pliego
   sintético con cifras conocidas, comprobar que las citas casan y que no propone lo que el texto
   no dice; después medir `effort: 'medium'` frente a `'high'`.
2. **Llevar el piloto a otra página**, si el de Cisco se usa: declarar sus campos en `PAGINAS` de
   `server/services/aiEscenario.js` y montar el panel con `PLIEGO.montar`.
3. **La mejora propuesta de esta entrega** (abajo), si el dueño la aprueba.

### Esperan un documento oficial (se cierran trayéndolo por Actions)

- **Criptografía post-cuántica sin documento**: Huawei, Aruba, MikroTik, Catalyst 8000, ISR, ASR,
  Meraki G2-MX, SRX4100 y SRX de sucursal, Nokia 7750 SR-1x, 7250 IXR y 7220 IXR. Hoy dicen «no
  consta» y el requisito los aparta con ese motivo.
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

- **Las figuras de Cisco, con su leyenda, en el Excel del BOM** (propuesta al cerrar esta
  entrega). Aruba, Fortinet y Huawei pasan su figura al Excel (`meta.fotos`, hoja «Fotos del
  equipo»); Cisco no, así que la propuesta que se envía no lleva ni la figura ni la tabla de
  números que esta entrega puso en pantalla. Con el dato ya en `cisco-vistas-equipos.json`: pasar
  `fotos` desde el dimensionador Cisco y, bajo cada figura, sus filas (número, qué es, rótulo del
  documento). Evita una propuesta impresa sin figura; cuesta una línea en la página de Cisco y la
  leyenda opt-in en la hoja de fotos de `bom.js` (compartida por los siete) con su prueba; si se
  hace mal, descuadra la hoja de los fabricantes sin leyenda. Se decide por el dueño.
- **La interconexión EdgeHA en el BOM, por el puerto que le toca** (propuesta en la entrega
  anterior, sin decidir). La auditoría de puertos del par ya sabe por qué puerto va la
  interconexión; el BOM sigue pidiendo elegir la óptica o retirar la línea. Se decide por el dueño.

## Decisiones del dueño abiertas

- La protección de `main` (aprobada, falta configurarla) y el aviso de Railway (ver arriba).
- Nada más: las dos de la IA y la de las variantes fuera del catálogo se tomaron el 2026-10-27 por
  la opción recomendada (ver *Decisiones* en `PENDIENTES.md`).
