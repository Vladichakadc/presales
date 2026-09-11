# Datasheets oficiales de HPE Aruba Networking

**18 de los 24 documentos ya están aquí** (2026-09-11); el resto sigue enlazando la URL de
HPE. Para traer más o refrescar versiones:

```
npm run datasheets
```

desde una máquina con salida a internet.

## Por qué 18 y no 24

De los 6 que faltan, **4 nunca fueron PDFs** (`ecOverview`, `gw7000`, `gwSoportados` y
`orchDocs` son páginas de documentación en vivo, tal como las describe el manifiesto), **1
URL murió** (`ecSpecSheet`, 404 genuino: hay que buscar el reemplazo) y **1 exige cuenta de
soporte HPE** (`gw9000Spec`: `support.hpe.com/hpesc/public/docDisplay?docId=a00099295en_us`
se abre en el navegador pero no ofrece descarga sin login).

## Cómo se bajaron los difíciles (2026-09-10 y 2026-09-11)

HPE no se comporta igual en todos sus dominios, y eso decide qué se puede bajar sin un
navegador detrás:

| Dominio | `curl` / script | Chrome real |
|---|---|---|
| `arubanetworking.hpe.com` | responde | responde |
| `www.arubanetworks.com` | 403 de Akamai | **responde** |
| `www.hpe.com` | agota el tiempo | **responde** |
| `support.hpe.com` | sin probar | pide cuenta |

Las dos tandas que faltaban se hicieron con un Chrome real (2026-09-10, 9 documentos;
2026-09-11, los 6 que quedaban). La lección de método, para la próxima refrescada:

- **Akamai distingue la página de la petición.** `curl`, el `ctx.request` de Playwright y
  hasta un `fetch` cross-origin reciben 403 o timeout; la navegación de página pasa el
  reto JavaScript y hereda las cookies. Todo PDF hay que pedirlo *desde* la página.
- **Los QuickSpecs de HPE no se descargan: se ven.** `psnow/doc/<id>.pdf` sirve una carcasa
  HTML con el visor Adobe, y es el visor quien pide el PDF de verdad a
  `psnow/downloadDoc/<titulo>-<id>.pdf?id=<id>...`. El método que funciona: abrir la
  carcasa, escuchar la respuesta `application/pdf` a `downloadDoc` y repetir esa misma URL
  con un `fetch` desde la página (mismo origen, mismas cookies).
- **`psnow/downloadDoc` limita por sesión/IP.** En la tanda del 2026-09-10 respondió 503
  tras 9 descargas y ni 2 minutos de espera lo levantaron; al día siguiente, en sesión
  nueva, respondió 200 a la primera. Si vuelve a pasar: esperar horas, no insistir.
- **`www.arubanetworks.com/assets/ds/DS_9000Series.pdf` ya no es un PDF**: redirige al
  visor `psnow/doc/a00067608enw` («HPE Aruba Networking 9000 Series Gateway»). Ojo, es un
  documento distinto del `a00067607enw` que ya estaba (`serie-9000-psnow.pdf`).

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
de fabricante y engordan el repositorio de forma permanente. La tanda del 2026-09-11 suma
~21 MB, de los cuales 17,6 MB son el *SD-Branch Design VSG* (132 páginas): si el peso
molesta, ese es el primero a retirar — es un documento de arquitectura, no de cotización,
y el método de arriba lo vuelve a bajar en minutos.

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
