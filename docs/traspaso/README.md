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
3. **Commit y push frecuentes** (cada paso que funcione, como mucho cada media hora de trabajo), y
   en cada uno el traspaso al día. Lo que no está empujado se pierde si la sesión se corta.
4. **Retomar un tema** es: `git fetch`, cambiar a su rama, leer su traspaso entero y seguir por su
   «Siguiente paso». No se rehace lo que el traspaso da por hecho sin comprobar primero que falla.
5. **Al terminar**, lo de siempre (`CLAUDE.md` → *Desplegar*): `npm run verificar`, `npm run
   auditar`, rebase sobre `main` y fusionar. En el commit que fusiona, lo cerrado pasa a
   `PENDIENTES.md` (*Cerrado recientemente*), lo que queda abierto a su sección, y **el archivo de
   traspaso se borra**: en `main` no vive ninguno salvo este README y la plantilla.

## Por qué así

- **Un archivo por tema, no una tabla común.** Si las dos sesiones apuntaran su trabajo en el
  mismo archivo, cada fusión chocaría ahí. Con un archivo por rama nadie edita el de otro, y
  `npm run traspasos` los lee de las ramas sin cambiar de rama.
- **`PENDIENTES.md` y `CLAUDE.md` solo se tocan al fusionar.** Son los dos archivos que todas las
  sesiones comparten; editarlos a mitad de trabajo en dos ramas es un conflicto seguro.
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
