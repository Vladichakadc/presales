# SPEC PARTE A — Contrato de datos

(archivos: `server/seed/legacyData/aruba.js`, proyección del catálogo con `toDimensionadorAruba`, CSV vía importador, `test/*.test.js`; NO tocar `public/js` ni `public/*.html`)

Regla de gobierno: solo citas literales de fuentes oficiales; `null` = «la lista no tiene el dato»; comentarios en español con fecha. PRIVACIDAD: nunca nombre del distribuidor, PA Number, Net Price ni PA Discount en el repo.

## A.1 BW_TIERS

De 3 a 8 niveles, orden canónico: bw20, bw50, bw100, bw200, bw500, bw1g, bw2g, bwunl. Cada tier `{ mbps: <num|null>, etiqueta: '20 Mbps'…'2 Gbps'…'Sin límite' }` (bwunl mbps null).

## A.2 LICENSES[nivel][tier]

Forma exacta `{ sku: {y1,y3,y5}, y1, y3, y5 }`.

- foundation: SOLO bw100, bw1g, bwunl (restricción oficial verificada en la lista 2026-09-13 — comentario: «Foundation no tiene tiers intermedios; el motor debe bloquearlos»).
- advanced y onprem: los 8 tiers. Nuevos (verificados en la lista 2026-09-13):

| tier | Advanced y1/y3/y5 (SKU precio) | OnPrem y1/y3/y5 (SKU precio) |
|---|---|---|
| bw20  | S1B06AAS 900 / S1B08AAS 2700 / S1B10AAS 4500 | S1A80AAS 948 / S1A82AAS 2844 / S1A84AAS 4740 |
| bw50  | S1B20AAS 1296 / S1B22AAS 3888 / S1B24AAS 6480 | S1A94AAS 1356 / S1A96AAS 4068 / S1A98AAS 6780 |
| bw200 | S1B48AAS 2604 / S1B50AAS 7812 / S1B52AAS 13020 | S1C13AAS 2736 / S1C15AAS 8208 / S1C17AAS 13680 |
| bw500 | S1B62AAS 4572 / S1B64AAS 13716 / S1B67AAS 22860 | S0X93AAS 4788 / S0X95AAS 14364 / S0X97AAS 23940 |
| bw2g  | S1B91AAS 9384 / S1B93AAS 28152 / S1B95AAS 46920 | S0Y21AAS 9864 / S0Z45AAS 29592 / S0Z47AAS 49320 |

(formato: SKU y1 / SKU y3 / SKU y5, precios en USD de lista)

## A.3 LICENSES_HA[nivel][tier]

Misma forma. foundation: solo sus 3 tiers existentes. advanced: 8 tiers; nuevos:

| tier | HA Advanced y1/y3/y5 (SKU precio) |
|---|---|
| bw20  | S1B13AAS 900 / S1B15AAS 2700 / S1B17AAS 4500 |
| bw50  | S1B27AAS 1296 / S1B29AAS 3888 / S1B31AAS 6480 |
| bw200 | S1B55AAS 2604 / S1B57AAS 7812 / S1B59AAS 13020 |
| bw500 | S1B70AAS 4572 / S1B72AAS 13716 / S1B74AAS 22860 |
| bw2g  | S1C28AAS 9384 / S1C30AAS 28152 / S1C32AAS 46920 |

Comentario: invariante precio HA == precio estándar tier a tier, verificada en la lista y extendida a los 8 tiers.

## A.4 Nuevas declaraciones en aruba.js

```js
const ARUBA_SSE = { sku: 'R8M36AAE', desc: 'HPE Aruba Networking SSE Complete Edition, per-user SaaS', precio: null, nota: 'No figura en la lista de precios vigente: línea «consultar», nunca precio inventado.' };
const MICROBRANCH_UMBRALES = { usuarios: 10, caudalMbps: 50 }; // banner si además MPLS == 0
```

En la proyección `toDimensionadorAruba` (donde se construye la respuesta de `/api/dimensionador/aruba`): exponer `sse: ARUBA_SSE` y `microbranch: MICROBRANCH_UMBRALES`.

## A.5 CSV

Regenerar con `node scripts/importar-lista-aruba.js --aplicar` (el roster crece solo al recorrer LICENSES/LICENSES_HA genéricamente). Esperado: 147 + 45 = 192 filas de datos (193 líneas con cabecera — verificar con `wc -l`). Actualizar `test/importar-lista-aruba.test.js` (147 → 192 con comentario) y cualquier test que cuente tiers. Añadir en `test/aruba-integridad-precios.test.js` estos 3 tests:

1. Foundation (y Foundation HA) solo tienen bw100/bw1g/bwunl; advanced/onprem tienen los 8 tiers.
2. Invariante HA == estándar en los 8 tiers de advanced.
3. `ARUBA_SSE.precio === null` y sku `'R8M36AAE'`.

## Verificación

`node --test test/aruba-integridad-precios.test.js test/importar-lista-aruba.test.js` en verde, luego `npm run verificar` completo en verde. Commit en español en `feature/datos-tiers`: «feat(aruba): tiers de licencias 20M-2G (Advanced/OnPrem/HA), SSE consultar y umbrales Microbranch».

---

## PARTE B — Motor/UI (frente feature/motor-ui)

El contrato íntegro de la PARTE B (estado v2 con wanLinks, Multi-Underlay Builder,
motor 70/30, auditoría de puertos, tiers filtrados, SSE «consultar», inyección
S2N67A/R7J63A, widget de rendimiento, simulador de descuento genérico y perfiles
multi-sede, IDs B.9) se entregó al frente MOTOR por mensaje del orquestador y se
integra desde /mnt/agents/output/feature-motor-ui.bundle. Desviaciones brief vs
oficial documentadas en PARTE A y en los comentarios del código.
