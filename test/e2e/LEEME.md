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
(`presales` / `e2e-local`, sobreescribibles con `E2E_USER`/`E2E_PASSWORD`) y base efímera en
/tmp — nunca toca el `datos.sqlite` de desarrollo. Ejecuta los `e2e-*.js` en serie y devuelve
salida 1 si cualquiera falla.

Variables: `E2E_PORT` (puerto), `E2E_SOLO=filtro` (correr un solo script, p. ej.
`E2E_SOLO=sfp npm run e2e`).

## Qué cubre cada script

| Script | Comprobaciones |
|---|---|
| `e2e-regresion.js` | Login, carga del dimensionador, recomendación con enlaces, BOM con equipo + suscripción, término 7 años (#28), un solo botón «Copiar enlace», «Limpiar escenario». |
| `e2e-sticky.js` | El panel «Equipos que cumplen» queda clavado (top:16) de arriba abajo de la página — la regresión v29. |
| `e2e-sfp.js` | Ópticas SFP de los enlaces WAN: chooser con mensaje cuando hay varias, select sin opción por defecto, línea PENDIENTE DE SELECCIÓN hasta elegir, cotización tras elegir, RJ45 no pide nada. |
| `e2e-candidatos.js` | Lista clicable de «Equipos que cumplen · N»: N filas, insignia de recomendado, clic que elige otro equipo (selector único + ficha + BOM + aviso de desvío), «Volver al recomendado». |
| `e2e-auditoria-fase1.js` | Fase 1 de la auditoría del 2026-09-17, por enlace de escenario: tier Foundation que sí existe (C1), 9240 sin Gold en AOS 10 y con SKU AOS 8 en AOS 8 (C2), 40 APs en la serie 9000 en AOS 10 (C3), Boost de 2 bloques en el hub MPLS+DIA (C4), 7005 fuera de venta (C5) y EC-XS fuera con DTD (A1). |
| `e2e-ux.js` | Mejoras UX del 2026-09-15: destino de tráfico con su cálculo declarado, tier «Automático» sincronizado con el módulo 2, unidades por HA sin campo cantidad, orden de la pestaña BOM, BOM editable (retirar/restaurar, omisión en la URL), SSE por usuario con línea PENDIENTE sin usuarios. Plan 19 (2026-09-18): la lupa de las fotos oficiales. Plan 20 (2026-09-18): la foto oficial viaja con la propuesta — el Excel descargado lleva la hoja «Fotos del equipo» (se relee con SheetJS como prueba de interop) y el hueco honesto de los modelos sin foto también se exporta. |

## Por qué NO está en `npm run verificar`

Playwright y el navegador pesan ~300 MB y la verificación rápida es la que Railway espera
en cada push. En CI corre como job aparte (parche `e2e-ci.patch`, entregado con el cambio:
hay que aplicarlo con un token con permiso `workflow` porque el PAT habitual no lo tiene).

## Reglas de la casa

- Los scripts solo leen por selectores estables (`#id`, `data-campo`, `data-tab`) — nunca
  por texto maquillado que cambie con una tilde.
- Cada script deja «ok - …» por comprobación y cierra con el resumen del contador de
  `ayuda.js`; la salida distingue un fallo de aserción (rc 1) de un fallo de arnés (rc 2).
- Nada de credenciales reales: la batería corre siempre contra una base sembrada de cero.
