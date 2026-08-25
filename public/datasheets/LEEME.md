# Datasheets oficiales de HPE Aruba Networking

Los PDF de esta carpeta **no están en el repositorio todavía**: hay que descargarlos con

```
npm run datasheets
```

desde una máquina con salida a internet. El entorno donde se construyó el catálogo de
Aruba tiene bloqueado el egreso hacia los dominios de HPE por política de la organización,
así que la descarga quedó pendiente de ejecutarse fuera.

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
