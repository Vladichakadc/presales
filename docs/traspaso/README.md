# Traspaso entre sesiones y trabajo en paralelo

Este repositorio lo trabajan varias sesiones de Claude, a veces desde cuentas distintas y a veces
a la vez. Ninguna sesión ve lo que otra tiene en su contenedor: **lo único compartido es GitHub**.
Este protocolo existe para que una sesión que se corta (límite de uso, contenedor reciclado) no se
lleve nada consigo, y para que dos sesiones a la vez no se pisen.

## La regla corta

1. **Un tema, una rama, un archivo de traspaso.** Cada línea de trabajo va en su propia rama y
   lleva `docs/traspaso/<tema>.md`, copiado de [`PLANTILLA.md`](PLANTILLA.md). `<tema>` en
   minúsculas y con guiones (`cisco-xgspon`, `fortinet-skus`).
2. **Al empezar, mirar qué está tomado:** `npm run traspasos`. Lista cada rama remota que lleva un
   traspaso, con su tema, su estado y los archivos que declara tocar, y aparte **los PR abiertos
   cuya rama no lleva traspaso**, con los archivos que tocan: un tema en un PR sin fusionar está
   tomado aunque su traspaso ya se haya borrado. **No se toma un tema que ya
   tiene rama, ni un archivo que otro traspaso declara**: si hace falta, se elige otro tema o se
   espera a que esa rama se fusione.
   **Y se reserva antes de escribir código** (2026-11-01): `npm run reservar -- <tema> --archivos
   "ruta, carpeta/, …" --descripcion "…"` empuja en ese momento `claude/<tema>` con su traspaso
   (estado «reservado») y se niega si otra rama o un PR abierto declara alguno de esos archivos. Así
   el tema se ve en `npm run traspasos` desde el primer minuto y no tras la primera hora de trabajo,
   que es como el 2026-10-28 tres sesiones hicieron la misma mejora (PR #60, #62 y #63).
3. **Commit y push frecuentes** (cada paso que funcione, como mucho cada media hora de trabajo), y
   en cada uno el traspaso al día. Lo que no está empujado se pierde si la sesión se corta.
4. **Retomar un tema** es: `git fetch`, cambiar a su rama, leer su traspaso entero y seguir por su
   «Siguiente paso». No se rehace lo que el traspaso da por hecho sin comprobar primero que falla.
5. **Al terminar**, lo de siempre (`CLAUDE.md` → *Desplegar*): `npm run verificar`, `npm run
   auditar`, abrir el PR (su número nombra la entrega), rebase sobre `main` y fusionar. En el
   commit de cierre, que cita ese `PR #N`, lo cerrado y su estado van a **su entrega**,
   `docs/entregas/AAAA-MM-DD-pr-N.md` (de `docs/entregas/PLANTILLA.md`; desde el 2026-10-31, no a
   una cabecera de `PENDIENTES.md`), lo que queda abierto a su sección, y **el archivo de
   traspaso se borra**: en `main` no vive ninguno salvo este README y la plantilla.

## Por qué así

- **Un archivo por tema, no una tabla común.** Si las dos sesiones apuntaran su trabajo en el
  mismo archivo, cada fusión chocaría ahí. Con un archivo por rama nadie edita el de otro, y
  `npm run traspasos` los lee de las ramas sin cambiar de rama.
- **`PENDIENTES.md` y `CLAUDE.md` solo se tocan al fusionar.** Son los dos archivos que todas las
  sesiones comparten; editarlos a mitad de trabajo en dos ramas es un conflicto seguro. Por lo
  mismo, la entrega va en un archivo propio (`docs/entregas/`) y no arriba de `PENDIENTES.md` o
  `RELEVO.md`, donde dos cierres simultáneos escribían la misma línea.
- **Temas distintos y archivos distintos.** Dos ramas que tocan el mismo motor o el mismo
  `legacyData/` se pueden fusionar sin conflicto de texto y aun así romper el cálculo. Por eso el
  traspaso declara los archivos y el siguiente que llega elige otra cosa.
- **Los archivos compartidos de todos** (`public/js/ficha.js`, `bom.js`, `estado.js`,
  `server/seed/legacyData/fuentes.js`, `package.json`, los workflows): quien los necesite lo dice
  en «Archivos que toca» y el resto los evita hasta que esa rama se fusione.

## Qué hace `npm run traspasos`

Trae las ramas (`git fetch --prune`; con `--sin-fetch` no) y, por cada rama remota que contiene un
`docs/traspaso/<tema>.md`, imprime la rama, su último commit y los campos de cabecera del
traspaso. Las ramas `fuente/*` (transporte de documentos, cortadas desde la rama de un tema) y las
de Dependabot no son temas. Después pide a GitHub (con `gh`) los PR abiertos y enseña los que no
salieron arriba, con sus archivos (`--sin-prs` lo salta); si `gh` no responde, avisa con el enlace
a los PR y sigue. Solo lee: no cambia de rama ni escribe nada.

**Ramas paradas** (2026-11-01, PR #108). Bajo un traspaso sin commits en más de tres días sale
`PARADA`, con los PR que nombra y ya se fusionaron, y cómo cerrarla; bajo uno «cerrado…», `CERRADO`
(ya no bloquea a `reservar`). Solo avisa: borrar la rama es de una persona.

## Qué hace `npm run reservar`

Trae las ramas y lee lo mismo que `npm run traspasos` (traspasos de las ramas y archivos de los PR
abiertos sin traspaso). Si el tema ya tiene rama o algún archivo declarado choca con otro tema en
curso, lo dice (con quién y en qué archivo) y sale con 1 sin crear nada. Dos rutas chocan si son la
misma o si una es carpeta (`test/e2e/`) de la otra; `PENDIENTES.md`, `RELEVO.md`, `CLAUDE.md`,
`docs/entregas/` y `docs/traspaso/` no cuentan, porque todos los tocan al cerrar. Un traspaso en
estado «cerrado…» no choca. Una rama sin commits hace más de tres días se señala como parada, pero
no se descarta sola: si su tema ya está en `main`, `--aunque <rama>` la pasa por alto y el traspaso
nuevo lo deja dicho. Si está libre, arma un commit con el traspaso sobre `origin/main` en un índice
temporal (el árbol de trabajo no se toca) y lo empuja **sin `--force`**: si otra sesión creó la
misma rama a la vez, GitHub rechaza el segundo push y la reserva es de la primera. `--comprobar`
solo mira. Las reglas y la carrera se prueban sin red en `test/reservar.test.js`. Desde el 2026-11-01 (PR #116) dice
también qué caso de `scripts/equivalencias/` vigila los archivos reservados (se mide en cada PR) y cómo
declarar un cambio de comportamiento hecho a propósito; queda escrito en el traspaso.
