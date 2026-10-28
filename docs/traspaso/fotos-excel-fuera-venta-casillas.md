# Traspaso: fotos-excel-fuera-venta-casillas

- **Tema:** Foto de producto en el Excel; rojo en el desplegable para fuera de venta y fin de venta anunciado; casillas de funciones resaltadas al activarse
- **Rama:** claude/fotos-excel-fuera-venta-casillas
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-27 23:05
- **Archivos que toca:** public/js/bom.js, public/js/ficha.js, public/js/dimensionador-*.js (selectores de equipo y meta.fotos), public/dimensionador-*.html (enlace a la hoja común), public/controles.css, test/vistas-leyendas.test.js, test/e2e/e2e-leyendas-juniper.js, test nuevos de ciclo y casillas
- **Siguiente paso:** esperar CI del PR (la batería nueva e2e-ciclo-y-casillas conduce Cisco, Fortinet y Nokia 7220); en verde, PENDIENTES, RELEVO, CLAUDE.md y fusionar

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas. Ejecuta la mejora propuesta. Quiero que resaltes en rojo en el combo cuando los equipos están o van a estar fuera de venta. Quiero que resaltes cuando se activa una funcionalidad activando el check para que los usuarios diferencien cuando se activa o se desactiva una funcionalidad en los dimensionadores».

## Hecho

- La foto de producto en la hoja «Fotos del equipo» (bom.js) y en `meta.fotos` de Cisco y Juniper; prueba y e2e de Juniper.

- `FICHA.opcionCiclo` (ficha.js): fuera de venta y fin de venta anunciado, en rojo y con su texto, en el desplegable de la ficha y en el selector de modelo de Aruba, Cisco, Fortinet, Huawei, Juniper y MikroTik.
- `public/controles.css`, enlazada por los ocho dimensionadores con casillas: el rojo del ciclo de vida y el resaltado de la casilla marcada.
- Pruebas: `ciclo-y-casillas.test.js` y la batería `e2e-ciclo-y-casillas.js`.

## Falta

- CI (la primera corrida falló en la batería nueva: esperaba opciones visibles de un combo que vive en la pestaña BOM, oculta al cargar; la segunda, en la misma espera: sin `?bw=` la ficha de Cisco no tiene candidato y no pinta su desplegable; corregido y el error dice ya en qué página falla); PENDIENTES, RELEVO y CLAUDE.md al fusionar.

## Decisiones y hallazgos

- `--red` de cada página es el color de marca (Aruba verde, Cisco azul): el rojo del fin de venta es un rojo fijo (#B42318), no esa variable; el resaltado de la casilla sí usa la marca.
- El rojo nunca va solo: los desplegables nativos de macOS y del móvil no pintan el color de cada opción, así que la opción dice «fuera de venta» o «fin de venta el <fecha>».
- El tinte de la fila marcada es del 6 %: al 10 % el texto gris de la explicación bajaba de 4,5:1 con las marcas rojas (Huawei, MikroTik) y con el azul de Nokia.
- Starlink no enlaza la hoja: sus funciones son interruptores que ya enseñan su estado.
- No se pudo arrancar el servidor aquí: el registro de npm está denegado por el proxy y `node_modules` está incompleto. Se probó en un banco de Chromium con ficha.js y la hoja real; las páginas las conduce CI.

## Verificación

- `node --test test/*.test.js`: 1116 en verde; los 28 en rojo son los de siempre en este entorno (sin `sequelize`, `dotenv`… instalados). Banco en Chromium: opciones y desplegable en rojo (180, 35, 24), casillas marcadas con fondo, barra y seminegrita, sin moverse.
