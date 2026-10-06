#!/bin/bash
# Comprueba la CLI de graphify contra la version de la skill revisada (2026-10-06), y si el grafo
# local se construyo sobre el commit actual. Lo llama session-start.sh; va aparte para poder
# probarlo con un `graphify` falso en el PATH y un repositorio temporal
# (test/graphify-cli-hook.test.js), sin correr el `npm install` del arranque.
#
# POR QUE LA VERSION. La CLI vive en la maquina y en una sesion en la nube no persiste. Si la
# skill no la encuentra, su paso 1 la instala SOLA Y SIN FIJAR VERSION (`uv tool install
# --upgrade graphifyy`, o `pip install graphifyy --break-system-packages`), y eso traeria una
# version que nadie ha leido. Aqui se dice el comando fijado ANTES de que la skill llegue a ese
# paso.
#
# POR QUE EL COMMIT. graphify guarda en graph.json el commit sobre el que se hizo
# (`built_at_commit`), y su propio aviso de grafo viejo vive en el modo «siempre activo», que
# aqui no se instalo a proposito (ver el LEEME de la skill). Sin esto, un grafo de hace diez
# commits contesta igual de seguro que uno de hoy. Se compara con HEAD y, si difieren, se dice
# cuantos archivos cambiaron y el comando para rehacerlo. Lo que no ve: cambios sin commitear.
#
# NO INSTALA NI CONSTRUYE NADA, por lo mismo que no instala Playwright: el arranque comprueba y
# dice que falta. Y avisa, no bloquea.
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

# El grafo, frente a HEAD. La clave de primer nivel la escribe graphify la ultima; una cadena
# dentro de un nodo llevaria las comillas escapadas y no casa con este patron.
grafo="$raiz/graphify-out/graph.json"
if [ -f "$grafo" ]; then
  hecho=$(grep -o '"built_at_commit": *"[0-9a-f]\{40\}"' "$grafo" 2>/dev/null | tail -n1 | grep -o '[0-9a-f]\{40\}')
  cabeza=$(git -C "$raiz" rev-parse HEAD 2>/dev/null || true)
  if [ -n "$hecho" ] && [ -n "$cabeza" ] && [ "$hecho" != "$cabeza" ]; then
    if cambiados=$(git -C "$raiz" diff --name-only "$hecho" "$cabeza" 2>/dev/null); then
      n=$(printf '%s' "$cambiados" | grep -c '')
      if [ "$n" -gt 0 ]; then
        echo "[arranque] AVISO: el grafo de graphify es del commit ${hecho:0:7} y HEAD es ${cabeza:0:7}:"
        echo "[arranque]         $n archivo(s) cambiaron desde entonces. Para rehacerlo (solo AST, sin LLM):"
        echo "[arranque]         graphify update ."
      fi
    else
      echo "[arranque] AVISO: el grafo de graphify es de un commit que este clon no tiene (${hecho:0:7}); HEAD es ${cabeza:0:7}."
      echo "[arranque]         graphify update ."
    fi
  fi
fi
exit 0
