# Pendientes

Registro vivo de lo que falta. **Se lee al empezar y se actualiza al terminar cualquier
tarea**, y su contenido se resume al usuario al cerrar cada entrega — esa es la instrucción
permanente que lo justifica (ver `CLAUDE.md`, sección *Pendientes*).

Última revisión: 2026-08-26.

---

## Bloqueado por acceso — necesita una máquina fuera de este entorno

Nada de esto es trabajo de ingeniería pendiente: el código está hecho y probado, falta el
dato. El proxy de egreso de la organización responde **403** a estos dominios, y un 403 de
política se reporta, no se rodea.

| # | Qué falta | Cómo se cierra | Bloqueo |
|---|---|---|---|
| 1 | **`cps` en 37 de los 58 FortiGate.** El motor ya usa las sesiones nuevas por segundo como tercer eje; los 21 verificados funcionan, los 37 en `null` no se filtran por ese eje y la ficha lo declara. | `npm run cps -- --check`, copiar tres columnas del Product Matrix a CSV/XLSX, `npm run cps -- matrix.xlsx`. El importador rechaza filas cuya columna de sesiones concurrentes no case con el `sess` verificado. | `fortinet.com` |
| 2 | **PDFs de datasheets de Aruba.** `public/datasheets/` va vacío a propósito; la página enlaza la URL de HPE mientras no esté el archivo local. | `npm run datasheets` desde una máquina con salida, y commitear los PDF. | dominios de HPE |
| 3 | **Comprobar el sitio en vivo tras desplegar.** Se verifica que el deploy llegue a SUCCESS y que los logs muestren `[seed]` y `Presales corriendo en`, pero la página en producción solo puede abrirla una persona. | Abrir `presales.up.railway.app` y revisar la página tocada. | `presales.up.railway.app` |

## Fabricantes sin dimensionador

Cobertura actual por herramienta:

| Fabricante | Portal | Cotizador | Guía de diseño | Dimensionador |
|---|:---:|:---:|:---:|:---:|
| Huawei | sí | sí | sí | sí |
| Cisco | sí | sí | sí | sí |
| Fortinet | sí | sí | sí | sí |
| MikroTik | sí | sí | sí | sí |
| Aruba | sí | sí | sí | sí |
| **Juniper** | sí | sí | sí | **no** |
| **Nokia** | sí | sí | sí | **no** |
| **Arista** | sí | sí | sí | **no** |

4. **Dimensionador Juniper (SRX).** Es el más viable de los tres: SRX se dimensiona igual que
   FortiGate — throughput por capa de inspección, IPsec, sesiones — así que reutiliza el
   motor y `ficha.js` casi tal cual. **Lo que falta es el catálogo**: hoy los 10 modelos solo
   traen `cap` como cadena de texto (`"1 Gbps FW"`), sin cifras numéricas por capa, sin SKU,
   sin precios ni niveles de soporte. Hay que construirlo contra los datasheets oficiales,
   con el mismo criterio que Aruba: lo que no se confirme queda en `null` y se declara.

5. **Dimensionador Nokia (7250 IXR / 7750 SR) y Arista (7020/7050/7280/7500).** No es copiar
   el motor: son conmutación de datacenter y agregación de operador, y no se dimensionan por
   «ancho de banda WAN» sino por **densidad de puertos, sobresuscripción leaf-spine y diseño
   de fabric**. Necesitan un motor propio — número de leafs, uplinks por leaf, factor de
   sobresuscripción, puertos de acceso por velocidad — más su catálogo numérico. Es la pieza
   más grande de esta lista y conviene tratarla como un proyecto aparte, no como «un
   dimensionador más».

## Datos por confirmar

6. **Cisco `C8355-G2` tiene `sdwan: null`** y por eso cae a su cifra de IPsec (20 Gbps),
   mientras el `C8455-G2` sí trae cifra SD-WAN propia (15,5 Gbps). Son dos mediciones
   distintas comparándose entre sí: el modelo menor parece mayor. La lista lo marca ahora con
   «(cifra IPsec)», pero hay que confirmar si Cisco publica el número real del 8355.
7. **Precios de Aruba: todos en `null`.** No existe lista de precios en el material
   disponible. El BOM cuenta las líneas sin cotizar y avisa en vez de mostrar un total que
   parece completo.
8. **Nokia, Juniper y Arista sin datos numéricos.** Sus catálogos traen `cap` como texto y no
   tienen `elpN`, así que aparecen en el cotizador sin poder sumar al total. Es la misma
   carencia que bloquea el punto 4.

## Limpieza

9. **`dimensionador-bom-huawei-v3_1.html`** — el sufijo `-v3_1` es un resto del versionado
   informal previo a git. Ya no es funcional; renombrarlo exige tocar el HTML, el JS y los
   enlaces del portal.
10. **`CISCO_EOL_MODELS` en `seedCatalog.js` está inerte** — la Fase 2 retiró la serie ISR
    4000 y ya no coincide con ningún `Product`. Se conserva por si reaparecieran vía
    `cotizadorCatalog`; si se decide que no, se borra.
11. **Sin herramientas de lint ni de test.** Hoy la verificación es manual: arrancar con
    `NODE_ENV=production` y recorrer la página en Chromium. Un juego mínimo de pruebas sobre
    las funciones de dimensionamiento (`capaEfectiva`, `ejesDe`, `FICHA.rango`) atraparía
    regresiones que hoy solo se ven en pantalla.

## Decisiones que necesitan al dueño del producto

12. Ninguna abierta ahora mismo. La última —cómo ordenar los candidatos del dimensionador de
    Cisco— se resolvió con un selector de plataforma (ver más abajo).

---

## Cerrado recientemente

- **Sesiones nuevas por segundo como tercer eje** (`f63dcdf`) — cierra el hallazgo 05 de la
  auditoría FortiGate en el motor; el dato queda a medias, que es el punto 1 de arriba.
- **`npm run cps`** (`2da77c7`) — importador con control cruzado para completar ese dato.
- **Fuera de venta se muestra pero no se recomienda** (`0074dc2`) — regla única en
  `ficha.js` para las cinco páginas, y toda la línea ASR 1000 marcada tras encontrarla
  ofreciéndose como vigente pese a tener boletín oficial de fin de venta desde 2022.
- **Plataforma en el dimensionador de Cisco** — un Catalyst 8000 y un Meraki MX del mismo
  caudal no son intercambiables; se acota la plataforma primero y dentro de ella se aplica el
  más pequeño que cumple.
- **MikroTik en el cotizador y en la guía de diseño** — era el único de los ocho fabricantes
  del portal ausente de ambos, justamente el de mejor dato (15 modelos con precio). De paso,
  los filtros del cotizador ahora salen del catálogo y no de una lista escrita a mano, que es
  lo que había dejado también a Aruba sin botón de filtro.
