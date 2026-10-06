#!/bin/bash
# Comprueba la CLI de graphify contra la version de la skill revisada (2026-10-06). Lo llama
# session-start.sh; va aparte para poder probarlo con un `graphify` falso en el PATH
# (test/graphify-cli-hook.test.js), sin correr el `npm install` del arranque.
#
# POR QUE. La CLI vive en la maquina y en una sesion en la nube no persiste. Si la skill no la
# encuentra, su paso 1 la instala SOLA Y SIN FIJAR VERSION (`uv tool install --upgrade
# graphifyy`, o `pip install graphifyy --break-system-packages`), y eso traeria una version que
# nadie ha leido. Aqui se dice el comando fijado ANTES de que la skill llegue a ese paso.
#
# NO INSTALA NADA, por lo mismo que no instala Playwright: el arranque comprueba y dice que
# falta. Y avisa, no bloquea.
#
# LA VERSION SALE DEL SELLO que deja la propia instalacion (.claude/skills/graphify/
# .graphify_version), y test/graphify-instalacion.test.js exige que el LEEME de la skill de la
# orden con esa misma version: una sola fuente, no un numero escrito en tres sitios.
set -uo pipefail

raiz="${1:-.}"
fijada=$(tr -d '[:space:]' < "$raiz/.claude/skills/graphify/.graphify_version" 2>/dev/null || true)
[ -n "$fijada" ] || exit 0   # sin skill instalada no hay nada que comprobar

instalada=$(graphify --version 2>/dev/null | awk 'NR==1{print $2}')

if [ "$instalada" = "$fijada" ]; then
  echo "[arranque] graphify: $instalada (la version revisada de la skill)."
elif [ -n "$instalada" ]; then
  echo "[arranque] AVISO: graphify $instalada instalado, y la skill revisada es la $fijada."
  echo "[arranque]         uv tool install --reinstall \"graphifyy==$fijada\""
else
  echo "[arranque] graphify no esta instalado. Antes de usar /graphify, con la version revisada:"
  echo "[arranque]   uv tool install \"graphifyy==$fijada\""
  echo "[arranque] (si no, la skill se instala sola la ultima version, sin fijar)."
fi
exit 0
