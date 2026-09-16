# Revisión del diff — pendientes 34, 35, 38 y la mejora (2026-09-16)

Revisión diferencial con foco de seguridad sobre el cambio sin commitear, antes de empujar.
**Nivel de riesgo: MEDIO**, no bajo, por una razón concreta: `public/js/ficha.js` lo cargan
las **siete** páginas de dimensionamiento, así que un fallo ahí sale en las siete a la vez.
Un refactor no es «bajo riesgo por ser refactor» — rompe invariantes precisamente porque
nadie espera que cambie nada.

## Alcance

| Archivo | Riesgo | Por qué |
|---|---|---|
| `public/js/ficha.js` | **MEDIO** | Compartido por 7 páginas; emite HTML; guarda estado de módulo |
| `server/services/catalogProjection.js` · `server/routes/dimensionador.js` | **MEDIO** | Dato nuevo en una respuesta de API; índice con parámetro de ruta |
| `public/js/dimensionador-*.js` (7) | BAJO | Una línea cada una |
| `scripts/probar-candidatas.js` + su workflow | **MEDIO** | Hace llamadas salientes |
| `scripts/contraste-motor.js` · `contrastes/*` · `contraste.js` | BAJO | Herramienta de verificación, fuera del servidor |
| `test/*` | BAJO | Pruebas |

## Lo que se comprobó, y el resultado

**1. Estado de módulo en código compartido — VERIFICADO.** `FICHA.fijarCicloVida()` guarda
`cicloVidaVendor` a nivel de módulo. Si una pantalla mostrara varios fabricantes a la vez,
el último en cargar decidiría el semáforo de todos. Medido: `grep -l "js/ficha.js"
public/*.html` devuelve **exactamente las 7 páginas de un fabricante cada una**; el portal
(`index.html`), que sí tiene los siete, **no carga `ficha.js`**. El riesgo no se materializa
hoy. Queda anotado como la condición que lo haría aparecer.

**2. Inyección por el parámetro de ruta — SIN HALLAZGO.** `respaldoCicloVida(req.params.vendor)`
recibe entrada del usuario. Pero la ruta rechaza con 404 cualquier vendor que no esté en
`projections` **antes** de llegar ahí, así que el valor queda acotado a 8 claves literales.
`fuentesDe()` sobre una clave desconocida devuelve lista vacía, que degrada al tercer estado.
Falla cerrado.

**3. Escape de HTML — SIN HALLAZGO, con un matiz que conviene dejar escrito.** El contrato de
`seccionHtml` es asimétrico: **escapa la clave** (`esc(k)`) y **emite el valor en crudo**. Se
auditaron las cinco ramas nuevas de `seccionPuertos`: los valores en crudo son solo campos
numéricos del catálogo (`p.cantidad`, `p.veloc`), igual que hacía la versión de Nokia; todo
valor de texto va con `esc()` (`m.slots.tipo`, `m.notaPuertos`, `m.ifaces`/`m.ports`).
`cicloHtml` escapa por dentro su nombre y su detalle, así que quien lo llama no puede
olvidarse — que es el motivo de que escape ahí y no en cada punto de llamada.

**4. Llamadas salientes nuevas — SIN HALLAZGO.** `probar-candidatas.js` hace GET a URL
**declaradas en el propio archivo**, sin credenciales, sin cabeceras propias y sin enviar
nada del repositorio. No corre en el servidor: es `workflow_dispatch`. No escribe en el
catálogo, por diseño.

**5. Filtración de datos por la API — SIN HALLAZGO.** `cicloVida` añade a la respuesta el
título, la fecha y la URL de un documento **público del fabricante**. Nada de la lista de
precios ni del volumen persistente. La ruta sigue detrás del muro de sesión.

**6. Cobertura de pruebas — ELEVADA, no bajada.** +10 casos (9 del semáforo, 1 de los seis
fabricantes sin puertos estructurados). Los del semáforo se **comprobaron saboteando**:
devolviendo el verde a rama por defecto caen 2 de 9 nombrando el motivo. La prueba
`nokia-puertos` pasó **sin tocar una sola aserción** tras mover la regla, que es la mejor
señal de que cambió de domicilio y no de contenido.

**7. Regresión de comportamiento — CAZADA POR EL CONTRASTE, y arreglada.** Al mover la regla
de puertos se perdieron dos tildes en texto visible («Configuracion», «Opcion»). El contraste
de Nokia lo marcó como discrepancia contra la línea base medida. Es exactamente el fallo que
un refactor produce y que una revisión a ojo no ve.

**8. Código inerte — UN HALLAZGO, corregido.** Al sustituir el semáforo local de Aruba, su
CSS (`.sem-dot`, `.sem-verde`, `.sem-naranja`, `.sem-rojo`, `.sem-suc`) quedó sin uso. Es la
misma forma que `CISCO_EOL_MODELS`: no hace nada y parece que sí. Retirado; `.sem-cel` se
queda porque sigue en uso.

## Cambio de comportamiento visible, declarado

**Los 23 modelos de Aruba sin marca dejan de salir «Generación actual» y pasan al tercer
estado.** No es un efecto colateral: es el pendiente 34. Ninguna fuente declarada de Aruba
respalda `eolAnnounced`, así que ese verde se sostenía únicamente en la ausencia de una
marca. Cisco y Juniper sí lo conservan, y ahora dicen contra qué documento y de qué fecha.

## Límites de esta revisión

- **No** cubre si las cifras del catálogo son las del fabricante: eso es la pestaña de
  procedencia y el vigía.
- **No** hay modelado adversarial: no hay cambios de autenticación, de criptografía ni de
  autorización en este diff.
- La comprobación 1 es válida **hoy**. Si alguna vez una pantalla muestra varios fabricantes
  con `ficha.js`, hay que pasar `cicloVida` por contenedor en vez de por módulo.
