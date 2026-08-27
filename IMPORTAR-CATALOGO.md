# Alimentar el catálogo desde una máquina con salida a internet

Cuatro fabricantes tienen datos incompletos en el catálogo. No es trabajo de ingeniería
pendiente: **el código está hecho y probado, falta el dato**, porque el entorno donde se
edita este repositorio tiene bloqueados por política de egreso los dominios de los cuatro.

Este documento es el procedimiento para cerrarlos desde una máquina que sí tenga acceso.

Última revisión: 2026-08-27.

---

## Antes que nada: qué viaja de local a producción

La pregunta natural es «¿alimento la base en local y producción consulta de ahí?». La
respuesta es **sí, y ya está diseñado así — pero lo que viaja no es la base de datos, son
los archivos de siembra**. Vale la pena entenderlo antes de tocar nada, porque las dos
formas intuitivas de hacerlo no funcionan.

```
máquina con internet
  |
  |  npm run cps / juniper / datasheets
  v
server/seed/legacyData/*.js          <-- ESTO es lo que viaja
  |
  |  npm run verificar  ->  git push a main
  v
Railway reconstruye el contenedor desde git
  |
  |  seedCatalog.js puebla la base efímera
  v
la base de producción nace ya con el dato nuevo
```

Por qué funciona así, con las líneas que lo sostienen:

| Hecho | Dónde |
|---|---|
| `database.sqlite` está ignorado por git: la base nunca sale de tu máquina | `.gitignore:2` |
| En producción `DATABASE_PATH` está sin definir, así que la base vive dentro del contenedor | `server/config/database.js:5` |
| Railway reconstruye el contenedor desde git en cada despliegue, así que esa base se borra | despliegue automático desde `main` |
| La siembra corre solo si la base está vacía — y en producción **siempre** lo está al arrancar | `server/seed/seedCatalog.js:273` |

La ventaja de este diseño es que **el catálogo no necesita migraciones**: la base de
producción es una función pura de los archivos de siembra, y cualquier cambio de catálogo
se revisa como un diff normal antes de desplegarse.

### Las dos cosas que NO funcionan

1. **Copiar `database.sqlite` a producción.** Está en `.gitignore`, y aunque lo forzaras, el
   siguiente despliegue lo pisa. La base de producción no es un almacén, es un caché
   reconstruible.
2. **Usar el botón de sincronización IA en producción.** Devuelve **503 a propósito**
   (`server/routes/sync.js:42`) exactamente por lo mismo: un cambio aplicado ahí se pierde en
   el siguiente despliegue. Además, sin `ANTHROPIC_API_KEY` el servicio cae a un simulacro
   que devuelve propuestas inventadas, que es lo último que quieres en un catálogo de
   precios. La sincronización IA es una herramienta de análisis **local**: se corre en tu
   máquina, se revisa lo que propone, y lo aprobado se lleva a mano a `legacyData/`.

### La opción que existe y que conviene no tomar

Se podría montar un volumen persistente y apuntar `DATABASE_PATH` ahí — el servicio ya tiene
un volumen, el que guarda `usuarios.json`. La base sobreviviría a los despliegues.

El coste es que **invierte el modelo**: pasarías a necesitar migraciones para cada cambio de
esquema, el catálogo dejaría de ser reproducible desde git, y un cambio hecho a mano en
producción sería invisible en el repositorio. Para un catálogo que cambia por trimestres y se
revisa en un diff, la base efímera es la decisión correcta. Esto se documenta aquí para que
la próxima persona vea que la alternativa se consideró, no que se pasó por alto.

---

## Ruta A: correrlo desde una máquina propia (recomendada)

Sin proxy de política de por medio. Es la ruta rápida.

### Requisitos

- **Node >= 20** (`package.json` lo declara en `engines`). Comprobar con `node -v`.
- git.
- Salida a internet hacia los dominios de la tabla de abajo.

### Cuentas de fabricante

Comprobar al llegar; varía por fabricante y por región.

| Fabricante | Documento | Cuenta |
|---|---|---|
| Fortinet | Product Matrix (PDF) | Suele ser descarga pública desde `fortinet.com`. |
| Juniper | SRX Performance Matrix | Suele ser pública en `juniper.net`; algunas secciones piden cuenta de partner. |
| HPE / Aruba | Datasheets de producto (PDF) | Públicos. |
| Huawei | Info-Finder y documentación de producto | **Requiere Huawei ID (uniportal)**, registro gratuito. Los boletines de fin de vida suelen estar en la zona pública; las tablas de especificaciones detalladas normalmente piden sesión iniciada. |

### Paso 1 — Clonar y preparar

```bash
git clone https://github.com/Vladichakadc/presales.git
cd presales
npm install
cp .env.example .env      # y poner un AUTH_PASSWORD cualquiera para pruebas locales
```

### Paso 2 — Ver qué falta, antes de tocar la red

Cada importador tiene un modo de inventario que no sale a internet:

```bash
npm run cps -- --check          # cuántos FortiGate tienen cps y cuáles no
npm run juniper -- --check      # cobertura por capa del catálogo SRX
npm run datasheets -- --list    # qué PDF de HPE se bajarían
```

Esto te dice exactamente qué ir a buscar, para no leer un documento entero de cien páginas.

### Paso 3 — Traer el dato de cada fabricante

**Fortinet — `cps` en 37 de 58 modelos**

1. Abrir el FortiGate Product Matrix.
2. Copiar a una hoja de cálculo **tres columnas**: modelo, *New Sessions/Sec*, y
   *Concurrent Sessions*. La tercera no es opcional: es el control cruzado.
3. Guardar como `.csv` o `.xlsx`.

```bash
npm run cps -- matrix.xlsx --dry    # enseña qué haría, sin escribir
npm run cps -- matrix.xlsx          # aplica
```

El importador rechaza una fila si su columna de sesiones concurrentes no casa con el valor
ya verificado del catálogo. Eso es lo que detecta la **fila desplazada** al copiar una tabla:
la cifra sola siempre parece plausible, el resto de su fila no. También propaga solo a las
variantes con SSD (91G desde el 90G, etc.), deduciendo el parentesco del propio catálogo.

**Juniper — `ips`, `atp`, `fwImix` y `vpnImix`**

1. Abrir la SRX Performance Matrix.
2. Copiar la tabla completa con sus cabeceras a una hoja. El importador reconoce las columnas
   **por su cabecera, no por su posición**, así que no hace falta ordenarlas.
3. Guardar como `.csv`, `.tsv` o `.xlsx`.

```bash
npm run juniper -- matriz.xlsx --dry
npm run juniper -- matriz.xlsx
```

Solo acepta una fila si **al menos dos de sus columnas casan** con lo ya verificado y ninguna
lo contradice. Los modelos que hoy solo traen la cifra de firewall no alcanzan ese anclaje y
se apartan explicando por qué; `--sin-contraste` los fuerza, pero entonces pierdes la red de
seguridad y conviene revisarlos a ojo uno por uno.

**HPE / Aruba — los PDF de datasheet**

```bash
npm run datasheets                 # baja lo que falte a public/datasheets/
npm run datasheets -- --force      # vuelve a bajar todo, para refrescar versiones
```

La lista de documentos sale de `DATASHEETS` en `server/seed/legacyData/aruba.js`, que es la
misma fuente que consume la aplicación — no hay un segundo listado que se desincronice. El
script comprueba la firma `%PDF` del contenido y reporta aparte las URL que devuelven una
página de aterrizaje, en vez de guardar un HTML con extensión `.pdf`.

**Los PDF hay que commitearlos.** Es lo que hace que producción los sirva, porque el
contenedor se reconstruye desde git en cada despliegue.

**Huawei — todavía no hay importador**

Es el pendiente 14. Lo que falta en el catálogo:

- Ningún modelo marcado como fuera de venta (0 de 40, mientras Cisco tiene 8). **Es el hueco
  más caro**: una propuesta con un equipo descatalogado se cae en la mesa del cliente.
- `ipsec` y `typ` ausentes en las 17 NetEngine.
- `mpps` ausente en los 23 AR.

Fuentes correctas, por orden de utilidad:

1. **Huawei Info-Finder** — el comparador por modelo. Es el equivalente Huawei del Product
   Matrix de Fortinet: una tabla, todos los modelos, todas las columnas.
2. **Documentación de producto, capítulo «Specifications»** — las tablas por tamaño de
   paquete que el portafolio comercial resume.
3. **Boletines de fin de vida** — para el hueco de ciclo de vida.

**El portafolio comercial (`e.huawei.com/es/products/routers`) no sirve para dimensionar.**
Publica la cifra de paquetes grandes: en el AR5710-S son 1300 Mbps frente a los 620 típicos,
un factor 2,1. Es el mismo modo de fallo que en el SRX380 vale un factor 10 y que en el
FortiGate 60F valió 14,3x. Por eso el catálogo guarda `fwd` y `typ` en campos separados.

Mientras no exista `npm run huawei`, el dato se lleva a mano a
`server/seed/legacyData/huawei.js` — y entonces el paso 5 no es opcional, es la única red.

### Paso 4 — Verificar antes de empujar

Esto no es burocracia: es lo que hace que desplegar siempre sea seguro en vez de temerario.

```bash
npm run verificar                  # lint + 59 pruebas
rm -f database.sqlite              # fuerza que se vuelva a sembrar
npm run dev                        # http://localhost:4000
```

Abrir la página del fabricante que tocaste y **conducirla de verdad**: mover el caudal, ver
que el modelo recomendado cambia, ver que el BOM se llena. Todas las regresiones reales que
ha tenido este repositorio eran invisibles a `curl`.

Luego, el arranque en modo producción, que activa tres comportamientos que `npm run dev` no
enseña — se niega a arrancar sin `AUTH_PASSWORD`, la cookie gana el atributo `Secure`, y las
rutas de sincronización devuelven 503:

```bash
NODE_ENV=production AUTH_PASSWORD=loquesea npm start
```

Revisar la consola del servidor: si una entrada de fin de venta no casa con ningún modelo del
catálogo, la siembra **avisa por consola**. Ese aviso es la señal de que escribiste mal un
nombre de modelo.

### Paso 5 — Desplegar

```bash
git add -A
git commit -m "..."      # decir de qué documento salió el dato y de qué fecha es
git push -u origin main
```

Railway despliega solo desde `main`. Confirmar después que el despliegue llega a **SUCCESS**
y que los logs del contenedor muestran la línea `[seed]` y la línea `Presales corriendo en`.
Un build verde no es una aplicación corriendo; llegar a `listen` es además la prueba de que
`AUTH_PASSWORD` está puesta, porque en producción sin ella el servidor lanza.

Por último, abrir `presales.up.railway.app` y mirar la pantalla que tocaste.

---

## Ruta B: abrir los dominios en la política de egreso

Si se prefiere que esto se pueda correr desde el entorno remoto donde se edita el repositorio,
lo que hay que cambiar es la **política de red del entorno**, y eso es una decisión de un
administrador de la organización, no algo que se resuelva desde la sesión.

El 403 lo emite el proxy de política de la organización. La documentación del propio proxy es
explícita: *«no reintentes ni lo rodees — reporta el host bloqueado»*. Rodearlo no es una
opción técnica que esté pasando por alto; es una regla.

Dominios que habría que permitir:

| Fabricante | Dominios |
|---|---|
| Huawei | `e.huawei.com`, `support.huawei.com`, `info.support.huawei.com` |
| Fortinet | `fortinet.com` |
| Juniper | `juniper.net` |
| HPE / Aruba | dominios de HPE (`hpe.com`, `arubanetworks.com` y sus CDN de documentos) |
| El propio sitio | `presales.up.railway.app`, para poder verificar el despliegue |

La configuración del entorno remoto (política de red, variables, scripts de arranque) está
documentada en <https://code.claude.com/docs/en/claude-code-on-the-web>.

Aun abriendo los dominios, **la ruta A sigue siendo mejor para Huawei**, porque Info-Finder
pide sesión iniciada y una sesión de navegador no se traslada a un proceso automatizado.

---

## Resumen de qué cierra cada cosa

| # | Pendiente | Comando | Bloqueo |
|---|---|---|---|
| 2 | `cps` en 37 de 58 FortiGate | `npm run cps -- matrix.xlsx` | `fortinet.com` |
| 3 | PDF de datasheets Aruba | `npm run datasheets` | dominios de HPE |
| 4 | Verificar el sitio en vivo | abrir la URL a mano | `presales.up.railway.app` |
| 5 | Catálogo Juniper | `npm run juniper -- matriz.xlsx` | `juniper.net` |
| 14 | Ciclo de vida y cifras finas de Huawei | **falta escribir el importador** | dominios de Huawei |

Ver `PENDIENTES.md` para el detalle de cada uno.
