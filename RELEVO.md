# Relevo

Última actualización: 2026-10-27 · quincuagesimonovena entrega

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
   configurar: el conector de GitHub no expone la protección de ramas.
2. **Invitar a la cuenta colaboradora** en GitHub y, si hace falta, en Railway.
3. **Aviso de seguridad de Railway (22-oct)**: leer sus «recommended next steps»; si pide rotar
   variables, las secretas de `presales-web` son `AUTH_PASSWORD`, `SESSION_SECRET` (cerrarla cierra
   todas las sesiones) y `ANTHROPIC_API_KEY`. El conector de Railway pide autorización en los
   ajustes de conectores de claude.ai.
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
  Chrome del dueño en `hpe.com`).
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

- **La interconexión EdgeHA en el BOM, por el puerto que le toca** (propuesta al cerrar esta
  entrega). La auditoría de puertos del par ya sabe por qué puerto va la interconexión (el mismo
  tipo en los dos chasis, primero RJ-45); el BOM, en cambio, sigue pidiendo a la persona que elija
  la óptica o retire la línea. Con el dato: si va por RJ-45, un latiguillo y ninguna óptica; si va
  por una jaula, dos ópticas de ese tipo y velocidad. Evita cotizar dos ópticas que sobran o
  dejarlas fuera; cuesta tocar el BOM de Aruba y su caso de contraste; si se hace mal, el BOM del
  par cambia de total sin que nadie lo pida. Se decide por el dueño.

## Decisiones del dueño abiertas

- La protección de `main` (aprobada, falta configurarla) y el aviso de Railway (ver arriba).
- Nada más: las dos de la IA y la de las variantes fuera del catálogo se tomaron el 2026-10-27 por
  la opción recomendada (ver *Decisiones* en `PENDIENTES.md`).
