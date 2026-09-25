# Lo que solo puede hacer una persona (2026-09-24)

Versión para compartir, con el mismo contenido: <https://claude.ai/artifact/Sw97q5rDmJ5KJCYbB2PWXJ>
(privada hasta que su dueño la comparta).

Cuatro cosas quedan fuera del alcance de una sesión de Claude Code: tres porque son juicio
humano, y una porque la sesión no pudo tocar ese ajuste. Este documento prepara cada una para
que se resuelva en minutos. **Ninguna se da por hecha aquí**: lo que se afirma como comprobado
lleva al lado cómo se comprobó.

| # | Decisión | Quién | Tiempo | Qué cierra |
|---|---|---|---|---|
| 1 | Activar «Wait for CI» en Railway | Dueño del repositorio | 2 min | Pendiente 33 y condición 4 del GO |
| 2 | Aprobar o no el GO CONDICIONADO de Fortinet | Arquitecto Fortinet | 30-45 min | Condición 1 del GO |
| 3 | Regla 70/30 de Aruba (M4) | Dueño del producto | 5 min | M4 |
| 4 | Prueba con un lector de pantalla real | Cualquier persona con NVDA o VoiceOver | 45 min | Última parte de la condición 3 del GO |

---

## 1. Activar «Wait for CI» en Railway

**Estado medido el 2026-09-24**: el servicio `presales-web` tiene `source.checkSuites: false`
(`describe-service` del conector de Railway). Railway despliega cada push a `main` sin esperar
a ninguna comprobación: una prueba o una pantalla rota **sí** llega a producción.

**Por qué no se activó desde la sesión.** El conector de Railway no expone ese ajuste:
`update-service` no toca la fuente y `connect-service-source` no tiene el campo. La única vía
era su agente, que respondió dos veces «Agent usage limit reached». En el contenedor no hay CLI
de Railway ni token. No se buscó otra vía.

**Pasos** (los de la documentación de Railway, *Controlling GitHub Autodeploys → Wait for CI*):

1. En GitHub, *Settings → Applications → Installed GitHub Apps → Railway*: aceptar los permisos
   actualizados si aparece el aviso (<https://github.com/settings/installations>). Railway lo pide
   como requisito del ajuste.
2. En Railway, proyecto **Presales** → servicio **presales-web** → *Settings* → *Source*:
   activar **Wait for CI**.

**Comprobado antes de recomendarlo, para que funcione a la primera:**

- Solo dos workflows corren en un push a `main`: `verificar.yml` y `pantallas.yml`. Los dos
  declaran `on: push: branches: [main]`, que es el requisito para que Railway muestre el
  interruptor.
- Ninguno usa `concurrency`. Según la documentación de Railway, una corrida cancelada solo
  bloquea si ninguna otra del mismo commit pasó.
- La sonda de producción (`sonda-produccion.yml`) es manual (`workflow_dispatch`), así que no
  puede bloquear su propio despliegue.
- **Caso límite**: `vigia-fuentes.yml` corre los lunes a las 06:00 UTC, y su corrida se asocia
  al commit que esté en la cabeza de `main`. Si ese commit estuviera todavía esperando su
  despliegue y la vigía fallara, el despliegue se saltaría. La vigía sale con código 0 salvo un
  error inesperado del script, así que es improbable. Si pasa, el remedio es volver a desplegar
  ese commit.

**Coste**: cada despliegue espera al job de `pantallas` (pantallas, contraste y batería e2e),
que tarda entre 6 y 7,5 minutos según las corridas medidas. Si las comprobaciones no terminan en
dos horas, Railway salta el despliegue.

**Cómo comprobar que quedó activo**: en el siguiente push a `main`, el despliegue aparece en
estado `WAITING` hasta que terminan `verificar` y `pantallas`. También se puede ver con
`describe-service`, que debe dar `checkSuites: true`.

---

## 2. GO CONDICIONADO de Fortinet: lista para aprobar

El veredicto de la auditoría del 23-sep es **GO CONDICIONADO**, con cinco condiciones
(`docs/auditoria-fortinet-2026-09-23/LEEME.md`). Así están hoy:

| Condición | Estado a 2026-09-24 |
|---|---|
| 1 · Aprobación explícita de arquitectura Fortinet | **Abierta: es esta decisión.** |
| 2 · Una fuente crítica citada y no leída (SSL-VPN en 7.6.3+) | **Cerrada.** Las Release Notes de 7.6.3 se trajeron desde Actions y dicen lo mismo: «This applies to all FortiGate models». Las de 7.6.0 dan la lista cerrada de modelos de 2 GB de RAM (40F, 60F, 61F), que antes dejaba la compatibilidad en «desconocida». |
| 3 · Accesibilidad no ejecutada | **Casi cerrada.** Auditoría axe (WCAG 2.1 A/AA) y reflujo a 640 px automatizados desde el 24-sep. Falta el lector de pantalla real (decisión 4). |
| 4 · Tres pruebas no frenan el despliegue | **Abierta hasta la decisión 1.** |
| 5 · Datos que el catálogo no trae | **Reducida.** Ver abajo. |

**Condición 5, detalle.**

Cerrado desde el 23-sep:
- F6: el 100F y el 200F tienen `cps`, sus siete límites y su figura, y los chasis 7081F y 7121F tienen figura.
- F2: el SD-WAN Service lleva SKU y precio de la lista firmada en 54 de 58 modelos. La familia se contrasta con el Ordering Guide.
- SKU exactos de FortiClient EMS (en packs) y de FortiSASE (por edición y banda).

Sigue abierto:
- Precio de EMS y FortiSASE. **No está en el catálogo**: de la lista solo se extraen las filas que nombran un FortiGate, y estas licencias no nombran ninguno. Esas líneas siguen en borrador.
- FortiAnalyzer y FortiSandbox dedicado son otro dimensionamiento.
- Licencia de VDOM adicional: sin SKU publicado.
- 17 líneas de renovación de 70F, 100F, 200F y 600F, sin precio. Desde tu regla del 24-sep ya no llevan el de agosto, y la lista de septiembre no los trae en lo extraído.
- El configurador de chasis no existe.
- F4-resto: la *Maximum Values Table*.

**Lista para quien aprueba**, sobre `docs/auditoria-fortinet-2026-09-23/motor-y-bom.md`:

- [ ] **Ejes y selección.** Ocho ejes independientes, y cada uno se compara con su cifra oficial. Las funciones fijan un piso de capa, no un recargo. La inspección SSL es un eje propio, sin derate.
- [ ] **Multiplicador y escenarios.** El multiplicador es crecimiento ÷ techo de utilización. Los escenarios son la operación normal, la falla de cada enlace activo y el failover de HA.
- [ ] **Overlay.** Aplica `min(capa, IPsec / fracción del overlay)`, con un 6 % de encapsulación ESP. Ese 6 % es un **supuesto de la herramienta**, no una cifra de Fortinet.
- [ ] **Sesiones y CPS.** Se derivan de los usuarios, con una vida media de sesión de 30 s. También es un **supuesto**, y es editable.
- [ ] **Límites de plataforma.** Túneles, SSL-VPN, políticas y VDOM son ejes duros **sin** techo de utilización, porque son topes de plataforma y no cifras de laboratorio.
- [ ] **FortiOS.** Tres ramas: 7.4, 7.6.0–7.6.2 y 7.6.3+. Las tres reglas de SSL-VPN están leídas del fabricante.
- [ ] **BOM.**
  - SKU combinado (BDL) en compra nueva.
  - El soporte que ya trae el bundle no se cobra otra vez, y Elite se cotiza como mejora.
  - Un solo SD-WAN Service add-on (1387/1389).
  - EMS en packs de 25/500/2.000/10.000 y FortiSASE por banda de usuarios.
- [ ] **Puerta de cotización.** Cuatro estados (READY, WARNING, DRAFT y BLOCKED), y el servidor confirma la huella antes de cualquier salida comercial.
- [ ] **Recorrido en producción.** Hacer el CU-01 y el CU-02 en <https://presales.up.railway.app>.

**Cómo registrar la decisión.** Añadir en la sección *Resultado* del LEEME de la auditoría una
de estas líneas, con nombre y fecha:
- «Aprobado»;
- «Aprobado con cambios: …»;
- «Rechazado: …».

Solo esa línea convierte el GO CONDICIONADO en GO. Un despliegue no lo hace.

---

## 3. M4 de Aruba: ¿la descarga del Local Breakout se limita a la capacidad de Internet?

**La regla actual** es la del brief: con Local Breakout, el 70 % del caudal **total, MPLS
incluido**, sale en local y el 30 % va por túnel al datacenter (`motor-ingenieria.js`). Cuando
el MPLS es grande y el Internet pequeño, esa regla hace salir en local más tráfico del que caben
los enlaces de Internet. Hoy la revisión del diseño **avisa** de ello, pero no cambia la cuenta.

**Qué mueve la decisión.** Mueve **solo el Boost**, que se licencia como el 30 % del tráfico
que va por túnel. La suscripción se tasa por el ancho de banda físico agregado y el throughput
del appliance se calcula sobre el total, así que ninguno de los dos cambia.

Medido con el motor del repositorio (bloques de 100 Mbps):

| Sede | Regla actual (A) | Limitada a Internet (B) |
|---|---|---|
| MPLS 1.000 + DIA 100 | local 770, túnel 330 → Boost 99 Mbps, **1 bloque** | local 100, túnel 1.000 → Boost 300 Mbps, **3 bloques** |
| MPLS 500 + DIA 500 | local 700, túnel 300 → **1 bloque** | local 500, túnel 500 → **2 bloques** |
| MPLS 100 + DIA 200 | local 210, túnel 90 → **1 bloque** | local 200, túnel 100 → **1 bloque** |

**Opciones.**

- **A. Mantener** la regla del brief, con el aviso que ya existe.
- **B. Limitar**: la descarga local es `min(70 % del total, capacidad de Internet)`, y lo que no
  cabe sigue por el túnel.
- **C. Otra regla**, que habría que especificar.

**Recomendación: B.** El tráfico que sale en local solo puede salir por los enlaces de Internet.
Lo que no cabe viaja por el túnel, y ese tráfico es justo el que Boost optimiza. Con A, una sede
donde manda el MPLS lleva un tercio del Boost que necesita, y la cotización sale corta sin que
nadie lo note.

**Coste de B**:
- Una línea en `motor-ingenieria.js` y sus pruebas.
- Volver a medir la línea base del contraste `aruba-underlay` en los escenarios con breakout y
  más MPLS que Internet.
- Retirar el aviso, que deja de hacer falta.

**Riesgo de B**: en los enlaces ya compartidos de sedes con mucho MPLS, el Boost sube al
abrirlos. Eso es el arreglo, pero conviene avisarlo a quien los tenga guardados.

**Cómo decidir.** Responder «A», «B» o «C» con el motivo. Si es B, el cambio lo hace cualquier
sesión siguiendo este apartado.

---

## 4. Prueba con un lector de pantalla real

axe comprueba la semántica que un lector necesita, pero no si lo que anuncia se entiende. Esta
prueba la hace una persona. El entorno es uno de estos dos:
- NVDA con Firefox o Chrome (Windows);
- VoiceOver con Safari (macOS).

Se prueba en producción, <https://presales.up.railway.app>, con credenciales propias. Las
credenciales no se escriben en ningún chat ni documento.

La columna «Automatizado» dice qué parte ya comprueba la batería e2e: lo que falta es oírlo.

| # | Tarea | Qué debería oírse | Automatizado |
|---|---|---|---|
| T1 | Iniciar sesión con una clave mal escrita y luego con la buena | Cada campo anuncia su etiqueta. El error se anuncia sin mover el foco a ciegas. | Etiquetas (axe) |
| T2 | En el portal, recorrer por encabezados (tecla H) y cambiar de fabricante con Alt + flechas | Encabezados en orden lógico. La barra anuncia el fabricante y el paso («3 / 7»). | Estructura (axe) |
| T3 | Dimensionador Fortinet: recorrer los cuatro pasos con Tab y cambiar el caudal del primer enlace | Cada control anuncia su etiqueta. Al cambiar el caudal, la región viva anuncia la recomendación nueva sin robar el foco. | `aria-live` presente (e2e) |
| T4 | Pestañas del resultado: moverse con las flechas | Anuncia «pestaña, N de M» y el panel que abre. | Roving tabindex (e2e) |
| T5 | Gráfico de utilización | Tiene nombre y descripción, y la tabla equivalente se puede leer celda a celda. | Nombre y tabla (e2e) |
| T6 | Con SSL-VPN y FortiOS 7.6.3+, llegar al bloqueo y usar «Cambiar a IPsec» | El bloqueo se anuncia con su causa y su fuente. El botón dice lo que hace. Tras usarlo, se anuncia el equipo nuevo. | Texto del bloqueo (e2e) |
| T7 | Pestaña de BOM: leer la tabla e intentar exportar con la puerta cerrada | La tabla tiene encabezados de columna. Un botón deshabilitado dice por qué. | Tabla (axe) |
| T8 | Aruba: añadir un enlace en el Multi-Underlay Builder | La fila nueva se anuncia, y sus campos tienen etiqueta. | Etiquetas (axe) |
| T9 | Cotizador: añadir un equipo y leer el total | La línea añadida y el total nuevo se pueden encontrar sin perderse. | No |
| T10 | Repetir T3 con el navegador al 200 % de zoom | Nada queda fuera de la vista ni oculta el foco. | Reflujo a 640 px (e2e) |

**Cómo registrar el resultado.** Anotar por cada tarea el lector y el navegador, el resultado
(«bien», «confuso» o «falla») y **la frase literal que se oyó**. Cada falla se convierte en un
pendiente con esa frase. Lo que se pueda comprobar sin oído (un nombre accesible que falta, un
orden de foco) pasa además a `test/e2e/e2e-accesibilidad.js`, para que no vuelva.
