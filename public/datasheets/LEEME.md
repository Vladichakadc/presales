# Datasheets oficiales de HPE Aruba Networking

**3 de los 24 documentos ya están aquí** (2026-09-03); el resto sigue enlazando la URL de
HPE. Para traer más:

```
npm run datasheets
```

desde una máquina con salida a internet.

## Por qué solo 3, y cuáles

HPE no se comporta igual en todos sus dominios, y eso decide qué se puede bajar sin un
navegador humano detrás:

| Dominio | Respuesta | Documentos del manifiesto |
|---|---|---|
| `arubanetworking.hpe.com` | **responde** | 6 |
| `www.arubanetworks.com` | 403 de Akamai | 3 |
| `www.hpe.com` | agota el tiempo | 12 |
| `support.hpe.com` y otros | sin probar | 3 |

De los 6 alcanzables se bajaron 4 y se commitearon **los dos que sirven para cotizar**: el
*EdgeConnect Hardware Reference* (las especificaciones eléctricas y la tabla de fuentes por
modelo) y la guía de licenciamiento de Central. Los otros dos —diseño SD-Branch y despliegue
en Azure— son documentos de arquitectura, no de cotización, y habrían sumado 21 MB más.

El `sd-wan-ordering-guide.pdf` venía de antes: fue el único que sobrevivió a la tanda de 24
peticiones seguidas de agosto.

## Cómo funciona

- La lista de documentos vive en `server/seed/legacyData/aruba.js` (`DATASHEETS`), la misma
  fuente que consume la aplicación. No hay un segundo listado que se desincronice.
- El script guarda cada documento con el nombre declarado en el campo `file`.
- Si el archivo está presente, la página del dimensionador enlaza la **copia local**
  (`/datasheets/<archivo>`), servida detrás del muro de autenticación. Si no está, enlaza
  la URL oficial de HPE. La herramienta funciona igual en ambos casos.

## Antes de commitearlos

Para que producción los sirva **tienen que estar commiteados**: el contenedor de Railway se
reconstruye desde git en cada despliegue y no conserva nada escrito en disco fuera del
volumen. Conviene mirar el tamaño total antes (`du -sh public/datasheets`): son documentos
de fabricante y engordan el repositorio de forma permanente.

Dos cosas a tener en cuenta al hacerlo:

- **Se quedan congelados.** HPE actualiza los datasheets sin avisar. Una copia local vieja
  es peor que un enlace vivo en una herramienta que se usa para cotizar, así que conviene
  volver a ejecutar `npm run datasheets -- --force` cada cierto tiempo y revisar el diff.
- **Son material de fabricante.** Redistribuirlos dentro de una herramienta interna detrás
  de login es un uso razonable; publicarlos abiertamente no.

## Documentos que no se descargan solos

Varias URLs de HPE son páginas de aterrizaje que entregan el PDF tras un redirect con
JavaScript. El script lo detecta comprobando la firma `%PDF` del contenido —no solo el
`Content-Type`, que HPE no siempre envía bien— y las reporta al final en vez de guardar un
HTML con extensión `.pdf`. Esas hay que guardarlas a mano desde el navegador, con el mismo
nombre de archivo que indica el reporte.
