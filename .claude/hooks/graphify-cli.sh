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
# commits contesta igual de seguro que uno de hoy.
#
# PRIMERO, LO QUE EL GRAFO LEE (desde el 2026-10-15). Comparar commits avisaba en falso: contaba
# archivos que el grafo no lee (PENDIENTES.md, excluido; un .patch, sin extension conocida) y,
# como `graphify update .` no reescribe `built_at_commit` cuando la estructura no cambia, el
# comando que daba no apagaba el aviso. Ahora, si la CLI esta, se pregunta a la propia graphify
# (`detect_incremental`, la misma deteccion de `update`, contra el md5 de cada archivo en
# `graphify-out/manifest.json`): cuenta solo lo que lee, ve tambien lo no commiteado y tarda
# ~0,25 s. Sin CLI, sin manifiesto, o si esa consulta falla, se compara el commit con HEAD
# como antes.
#
# SI FALTA, INSTALA LA FIJADA (desde el 2026-10-15, a peticion del dueno). Antes solo decia el
# comando, y cada sesion en la nube empezaba sin CLI y sin grafo: la skill no se usaba o, peor,
# se instalaba sola sin version. Instala solo con `uv` y solo `graphifyy==<sello>`, nunca
# `--upgrade`; tarda unos 10 s. Si `uv` no esta o la instalacion falla (el proxy de egreso puede
# cortar PyPI), dice el comando y sigue. Con OTRA version instalada no la toca: alguien la puso,
# y solo se avisa. NO CONSTRUYE EL GRAFO (`graphify update .` sigue siendo a mano) y nunca
# bloquea el arranque.
#
# CON LA EXTENSION `pdf` (desde el 2026-10-15): sin ella, cada `graphify update .` avisaba de que
# se saltaba los PDF. Trae `pypdf` y `markdownify`, sin fijar (como el resto de dependencias de
# graphifyy). El texto del PDF solo cuenta en la pasada semantica: el grafo del codigo no cambia.
#
# LA VERSION SALE DEL SELLO que deja la propia instalacion (.claude/skills/graphify/
# .graphify_version), y test/graphify-instalacion.test.js exige que el LEEME de la skill de la
# orden con esa misma version: una sola fuente, no un numero escrito en tres sitios.
set -uo pipefail

raiz="${1:-.}"
fijada=$(tr -d '[:space:]' < "$raiz/.claude/skills/graphify/.graphify_version" 2>/dev/null || true)
[ -n "$fijada" ] || exit 0   # sin skill instalada no hay nada que comprobar

instalada=$(graphify --version 2>/dev/null | awk 'NR==1{print $2}')

# Sin CLI: se instala la fijada. Un PyPI que no responde no puede colgar el arranque.
fallo=""
if [ -z "$instalada" ] && command -v uv >/dev/null 2>&1; then
  echo "[arranque] graphify no esta instalado: instalando la version revisada ($fijada)..."
  limite=""
  command -v timeout >/dev/null 2>&1 && limite="timeout 180"
  if salida=$($limite uv tool install "graphifyy[pdf]==$fijada" 2>&1); then
    instalada=$(graphify --version 2>/dev/null | awk 'NR==1{print $2}')
    [ -n "$instalada" ] || fallo="se instalo, pero graphify no esta en el PATH (ver: uv tool dir --bin)."
  else
    fallo=$(printf '%s\n' "$salida" | tail -n 1)
    [ -n "$fallo" ] || fallo="uv termino con error y sin mensaje."
  fi
fi

if [ "$instalada" = "$fijada" ]; then
  echo "[arranque] graphify: $instalada (la version revisada de la skill)."
elif [ -n "$instalada" ]; then
  echo "[arranque] AVISO: graphify $instalada instalado, y la skill revisada es la $fijada."
  echo "[arranque]         uv tool install --reinstall \"graphifyy[pdf]==$fijada\""
else
  echo "[arranque] graphify no esta instalado. Antes de usar /graphify, con la version revisada:"
  echo "[arranque]   uv tool install \"graphifyy[pdf]==$fijada\""
  echo "[arranque] (si no, la skill se instala sola la ultima version, sin fijar)."
fi

# El grafo, frente a lo que graphify leeria hoy. El interprete sale del shebang de la CLI (como
# el paso 1 de la skill) y solo se acepta si es un python con una ruta sin caracteres raros; la
# raiz va como argumento, nunca dentro del codigo. Imprime cuantos cambiaron y hasta tres.
grafo="$raiz/graphify-out/graph.json"
manifiesto="$raiz/graphify-out/manifest.json"
consultado=""
if [ -f "$grafo" ] && [ -f "$manifiesto" ] && [ -n "$instalada" ]; then
  py=$(head -n 1 "$(command -v graphify)" 2>/dev/null | tr -d '#!')
  case "$py" in
    *[!a-zA-Z0-9/_.@-]*|"") py="" ;;
  esac
  case "${py##*/}" in python*) ;; *) py="" ;; esac
  if [ -n "$py" ]; then
    limite=""
    command -v timeout >/dev/null 2>&1 && limite="timeout 30"
    if salida=$($limite "$py" -I -c '
import sys
from pathlib import Path
from graphify.detect import detect_incremental
raiz = Path(sys.argv[1]).resolve()
r = detect_incremental(raiz, manifest_path=str(raiz / "graphify-out" / "manifest.json"), kind="ast")
cambiados = sorted({f for fl in r["new_files"].values() for f in fl} | set(r.get("deleted_files") or []))
print(len(cambiados))
for f in cambiados[:3]:
    p = Path(f)
    print(p.relative_to(raiz) if p.is_absolute() and p.is_relative_to(raiz) else f)
' "$raiz" 2>/dev/null) && n=$(printf '%s\n' "$salida" | head -n 1) && [[ "$n" =~ ^[0-9]+$ ]]; then
      consultado=1
      if [ "$n" -gt 0 ]; then
        ejemplos=$(printf '%s\n' "$salida" | tail -n +2 | tr '\n' ' ')
        echo "[arranque] AVISO: el grafo de graphify no refleja $n archivo(s) que lee y cambiaron (${ejemplos% })."
        echo "[arranque]         Para rehacerlo (solo AST, sin LLM): graphify update ."
      fi
    fi
  fi
fi

# Sin la consulta: el commit del grafo frente a HEAD. La clave de primer nivel la escribe
# graphify la ultima; una cadena dentro de un nodo llevaria las comillas escapadas y no casa con
# este patron. Lo que no ve: cambios sin commitear, y cuenta tambien lo que el grafo no lee.
if [ -f "$grafo" ] && [ -z "$consultado" ]; then
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
