# Código archivado

Lo que se retiró del árbol porque nada lo cargaba. **No se borró la historia**: cada archivo sigue en
git y se recupera con `git show <commit>:<ruta>` desde el commit indicado, el último de `main` que
lo tenía. Retirarlo del árbol evita que una sesión (de Claude o de Gemini) lo lea como si fuera código
vivo, que el lint y las pruebas lo mantengan, y que el lock de cobertura del contraste lo cuente.

## 2026-11-09 · Auditoría de los dimensionadores, fase 1 («archivar el código muerto»)

Último commit con los archivos: `175e965afe68b0630c5893192ba266be155e3b78`.

| Archivo | Qué era | Por qué estaba muerto |
|---|---|---|
| `public/js/sizing_engine.js` | Propuesta de Gemini: motor unificado Huawei/Aruba, BOM Health Check, rollout multi-sede y simulador financiero, con catálogos y precios (`list_price_usd`) propios. | Ninguna página lo cargaba (decisión del dueño del 2026-10-20: se conservaba como propuesta, y sus catálogos no eran fuente de nada). En el lock de cobertura figuraba «sin conducir». |
| `server/presales_api_controller.js` | Las rutas `/api/presales/*` de esa misma propuesta. | `server.js` nunca lo montaba. |
| `test/presales-api-controller.test.js` | Su prueba. | Probaba un módulo que no estaba en producción. |
| `plan18-fase1-auditoria-aruba.patch` | Parche del 2026-09-17 («Plan 18: fase 1 de la auditoría técnica del dimensionador Aruba»). | Ya aplicado o superado; nadie lo citaba. |
| `server/models/SyncLog.js` | Modelo Sequelize del registro de sincronizaciones. | Se exportaba en `server/models/index.js` y ningún código lo leía ni escribía. La base de producción se resiembra en cada despliegue, así que no hace falta migración; una base local antigua conserva su tabla sin uso. |

Si alguna idea de la propuesta de Gemini vuelve a hacer falta, entra por la vía de siempre: en los
motores de `public/js/` que cargan las páginas, con sus datos en `server/seed/legacyData/` y su
documento en `fuentes.js`, nunca copiando sus catálogos.
