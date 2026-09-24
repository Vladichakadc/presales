# Pruebas E2E del dimensionador (pendiente #40)

Batería de extremo a extremo con navegador real (Playwright + Chromium) sobre el servidor
real. Nació como scripts sueltos fuera del repo; la mejora del 2026-09-15 los promueve al
proyecto para que la regresión visual/UX se corra con una orden y no de memoria.

## Correrla

```bash
npm i -D playwright && npx playwright install chromium   # una vez (o: npm i -g playwright)
npm run e2e
```

El runner (`run-e2e.js`) levanta el servidor en el puerto 4131 con credenciales de corrida
(`presales` / `e2e-local`, sobreescribibles con `E2E_USER`/`E2E_PASSWORD`) y con la base y el
almacén de usuarios en un directorio temporal **propio de esa corrida**, que se borra al
terminar — nunca toca el `datos.sqlite` de desarrollo, y una corrida no hereda nada de la
anterior. Ejecuta los `e2e-*.js` en serie y devuelve salida 1 si cualquiera falla.

Variables: `E2E_PORT` (puerto), `E2E_SOLO=filtro` (correr un solo script, p. ej.
`E2E_SOLO=sfp npm run e2e`) y `E2E_LENTITUD=N` (ralentiza N veces la CPU de cada página; ver
abajo).

## Qué cubre cada script

| Script | Comprobaciones |
|---|---|
| `e2e-regresion.js` | Login, carga del dimensionador, recomendación con enlaces, BOM con equipo + suscripción, término 7 años (#28), un solo botón «Copiar enlace», «Limpiar escenario». |
| `e2e-sticky.js` | El panel «Equipos que cumplen» queda clavado (top:16) de arriba abajo de la página — la regresión v29. |
| `e2e-sfp.js` | Ópticas SFP de los enlaces WAN: chooser con mensaje cuando hay varias, select sin opción por defecto, línea PENDIENTE DE SELECCIÓN hasta elegir, cotización tras elegir, RJ45 no pide nada. |
| `e2e-candidatos.js` | Lista clicable de «Equipos que cumplen · N»: N filas, insignia de recomendado, clic que elige otro equipo (selector único + ficha + BOM + aviso de desvío), «Volver al recomendado». |
| `e2e-auditoria-fase1.js` | Fase 1 de la auditoría del 2026-09-17, por enlace de escenario: tier Foundation que sí existe (C1), 9240 sin Gold en AOS 10 y con SKU AOS 8 en AOS 8 (C2), 40 APs en la serie 9000 en AOS 10 (C3), Boost de 2 bloques en el hub MPLS+DIA (C4), 7005 fuera de venta (C5) y EC-XS fuera con DTD (A1). |
| `e2e-ux.js` | Mejoras UX del 2026-09-15: destino de tráfico con su cálculo declarado, tier «Automático» sincronizado con el módulo 2, unidades por HA sin campo cantidad, orden de la pestaña BOM, BOM editable (retirar/restaurar, omisión en la URL), SSE por usuario con línea PENDIENTE sin usuarios. Plan 19 (2026-09-18): la lupa de las fotos oficiales. Plan 20 (2026-09-18): la foto oficial viaja con la propuesta — el Excel descargado lleva la hoja «Fotos del equipo» (se relee con SheetJS como prueba de interop) y el hueco honesto de los modelos sin foto también se exporta. |
| `e2e-ajustes.js` | Cantidades ajustadas a mano en el BOM: el control, el badge con la cifra del motor, que el ajuste viaje en la URL y sobreviva a la recarga, que el texto plano lo enumere y que volver a la cifra del motor no deje rastro. |
| `e2e-ciclo-vida.js` | El semáforo de ciclo de vida (regla única de `FICHA.cicloHtml`): el EC-XS vigente según las fuentes oficiales y el que sí cumplió su fin de venta, marcado. |
| `e2e-desbordamiento-ec.js` | Un requerimiento por encima del techo oficial de la línea EdgeConnect: el techo y el exceso declarados, y las vías que sí sostiene la fuente oficial. |
| `e2e-aruba-respaldo.js` | El rol activo/respaldo del Multi-Underlay Builder: el tier de la operación normal, la continuidad parcial, el enlace compartido de ida y vuelta y un enlace antiguo leído como todos activos. |
| `e2e-aruba-fases23.js` | Las fases 2 y 3 de la auditoría del dimensionador Aruba (M5, M6, A2, A3, A4, A5, A7, M3, M4, M7, M8, B1), cada una con el escenario en que se encontró. |
| `e2e-fortinet-auditoria.js` | El informe de validación técnica de Fortinet (AT-01…AT-34) conducido en la pantalla: que la página aplica las reglas que el módulo puro ya afirma. |
| `e2e-fortinet-rediseno.js` | La etapa 7 de Fortinet: recomendación, selección, BOM y botones leyendo el mismo resultado, confirmación del servidor, panel anclado, móvil y enlace verificable (T01–T30). |
| `e2e-accesibilidad.js` | axe-core (WCAG 2.1 A/AA) en 19 estados de pantalla —Starlink incluido desde el 2026-09-24— y reflujo a 640 px (200 % de zoom). No sustituye la prueba con un lector de pantalla real. |
| `e2e-asentar.js` | El contrato de `asentar()`, sobre una página sintética: espera a un temporizador corto y a una petición lenta, no a uno largo, no se cuelga con una imagen diferida fuera de la vista y falla si la página no lleva rastreador. Comprobado saboteando el rastreador dos veces. |

## Dónde corre

No está en `npm run verificar`: Playwright y el navegador pesan ~300 MB y esa es la
verificación rápida de cada push. **Desde el 2026-09-24 corre en CI**, como un paso del job de
`.github/workflows/pantallas.yml`, que ya trae Playwright (fijado a la versión con la que se
valida esta batería) y Chromium. El parche `e2e-ci.patch` que se entregó el 2026-09-15 nunca se
aplicó y ya no hace falta.

Un rojo de ese paso **no frena el despliegue** todavía: Railway no espera a ningún workflow
(medido el 2026-09-23). Lo frenará el día que se active «Wait for CI» en el servicio
(pendiente 33 de `PENDIENTES.md`).

## Esperar a una condición, no a un reloj

Hasta el 2026-09-24 los scripts esperaban con 219 pausas fijas (`waitForTimeout(300…3500)`)
calibradas a ojo. Ahora esperan con `asentar(page)` de `ayuda.js`: un rastreador instalado en
cada documento antes que sus scripts cuenta la obra pendiente —peticiones y lecturas de cuerpo
en vuelo, temporizadores cortos, cuadros de animación, transiciones, imágenes cargando,
desplazamiento— y la espera termina cuando todo está a cero dos cuadros seguidos. En una
máquina lenta tarda más y sigue siendo correcta; si no llega, falla diciendo qué quedó
pendiente.

Medido al cambiarlo (2026-09-24): con la CPU a 4x y a 10x pasan **las dos** versiones —las
pausas fijas tenían margen, contra lo que se supuso al proponer el cambio—, pero la batería
tarda **114 s en vez de 336** a velocidad normal (442 s en vez de 630 a 10x). Y la misma batería
con 1,5 s añadidos tras cada espera da las mismas afirmaciones, línea por línea: `asentar` no
lee la página antes de tiempo.

- **Una espera nueva se escribe con `asentar(page)`, nunca con otra pausa fija.** Si la página
  gana una vía asíncrona que el rastreador no ve, se añade al rastreador (un solo sitio).
- **El rastreador lo instala `abrirSesion()`**, que toda página de la batería pasa por el muro
  de acceso. `asentar()` sobre una página sin él falla con un mensaje que lo dice.
- **`E2E_LENTITUD=4 npm run e2e`** ralentiza 4 veces la CPU de cada página. Es como se
  comprueba que la batería no depende de la velocidad de la máquina.
- **Las tipografías de Google se cortan** en la batería: una prueba de maquetación no puede
  depender de si un tercero respondió a tiempo. Las capturas con las tipografías reales son
  las de `npm run pantallas`.

## Reglas de la casa

- Los scripts solo leen por selectores estables (`#id`, `data-campo`, `data-tab`) — nunca
  por texto maquillado que cambie con una tilde.
- Cada script deja «ok - …» por comprobación y cierra con el resumen del contador de
  `ayuda.js`; la salida distingue un fallo de aserción (rc 1) de un fallo de arnés (rc 2).
- Nada de credenciales reales: la batería corre siempre contra una base sembrada de cero.
