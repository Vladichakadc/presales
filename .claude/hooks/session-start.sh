#!/bin/bash
# Deja este repositorio listo al abrir una sesion de Claude Code en la web: instala las
# dependencias y comprueba que la cadena de navegador esta donde los scripts la buscan.
#
# POR QUE EXISTE. Lo que hay que pasar antes de empujar aqui son cuatro comprobaciones
# —`npm run verificar`, `pantallas`, `contraste` y `e2e`— y tres de ellas abren Chromium.
# Sin este arranque, cada sesion nueva descubre eso a los diez minutos, cuando un script
# falla por una dependencia que no se instalo.
#
# QUE NO HACE, Y ES DELIBERADO:
#   · NO instala Playwright. Esta FUERA de package.json a proposito (ver CLAUDE.md, seccion
#     del manual de usuario): es una dependencia pesada para tareas que se corren pocas
#     veces, y `scripts/ayuda/chromium.js` la resuelve del entorno. Aqui solo se COMPRUEBA
#     y se dice que falta, en vez de meterla en el arbol de dependencias por la puerta de
#     atras.
#   · NO inventa `AUTH_PASSWORD`. El servidor se niega a arrancar sin ella en produccion
#     —fallo cerrado, deliberado— y cada corrida de verificacion genera la suya, que vive y
#     muere con esa corrida. Un valor por defecto escrito aqui seria justo el secreto de
#     larga vida que este repositorio ya rechazo al descartar el entorno de staging.
#   · NO siembra la base. `database.sqlite` esta en .gitignore y `seedCatalog.js` la puebla
#     sola en el primer arranque desde `legacyData/`.
set -euo pipefail

# Solo en remoto: en una maquina propia las dependencias ya estan y volver a instalarlas en
# cada sesion es tiempo regalado.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

echo "[arranque] Instalando dependencias de npm..."
# `npm install` y no `npm ci`: el estado del contenedor se cachea despues del hook, asi que
# una instalacion incremental aprovecha esa cache. El fallo cerrado de `npm ci` ante un
# package-lock.json desincronizado sigue donde importa, que es `.github/workflows/verificar.yml`.
#
# PERO ESE MISMO `npm install` REESCRIBE EL LOCK EN SILENCIO si alguien lo desincronizo, y
# ahi esta el riesgo: el 1 de septiembre de 2026 un package.json y un package-lock.json que
# no cuadraban tumbaron el despliegue y nadie se entero hasta el dia siguiente, porque el
# unico que falla cerrado es el `npm ci` de CI — para entonces ya empujaste. Se compara el
# lock antes y despues y se AVISA.
lock_antes=""
if [ -f package-lock.json ]; then
  lock_antes=$(sha256sum package-lock.json | cut -d' ' -f1)
fi

npm install --no-audit --no-fund

if [ -n "$lock_antes" ]; then
  lock_despues=$(sha256sum package-lock.json | cut -d' ' -f1)
  if [ "$lock_antes" != "$lock_despues" ]; then
    echo "[arranque] AVISO: package-lock.json NO cuadraba con package.json y npm lo acaba de"
    echo "[arranque]         reescribir. 'npm ci' habria fallado cerrado, asi que CI va a"
    echo "[arranque]         ponerse rojo si empujas sin este archivo. Revisa el diff"
    echo "[arranque]         ('git diff package-lock.json') y commitealo si es intencionado."
  fi
fi

# La cadena de navegador la aporta la imagen del entorno, no el repositorio. Se comprueba en
# el mismo orden en que la busca `scripts/ayuda/chromium.js`, para que lo que diga este
# arranque y lo que hagan los scripts no puedan discrepar.
falta=0
if node -e "require('playwright')" >/dev/null 2>&1 \
  || node -e "require('/opt/node22/lib/node_modules/playwright')" >/dev/null 2>&1; then
  echo "[arranque] Playwright: disponible."
else
  echo "[arranque] AVISO: Playwright no se resuelve. 'npm run pantallas', 'contraste', 'e2e' y"
  echo "[arranque]         'manual' no podran correr. Instalarlo global (npm i -g playwright)"
  echo "[arranque]         o exportar PLAYWRIGHT_PATH apuntando a una copia existente."
  falta=1
fi

chromium=""
for ruta in "${CHROMIUM_PATH:-}" \
            /opt/pw-browsers/chromium-1194/chrome-linux/chrome \
            /opt/pw-browsers/chromium/chrome-linux/chrome; do
  if [ -n "$ruta" ] && [ -x "$ruta" ]; then chromium="$ruta"; break; fi
done
if [ -n "$chromium" ]; then
  echo "[arranque] Chromium: $chromium"
elif [ "$falta" -eq 0 ]; then
  # Playwright trae el suyo, asi que no tener el de /opt no es un fallo: solo se declara.
  echo "[arranque] Chromium de /opt no encontrado; se usara el que traiga Playwright."
fi

echo "[arranque] Listo. Antes de empujar: npm run verificar (lint + pruebas)."
echo "[arranque] Con navegador, cada uno contra un servidor en modo produccion:"
echo "[arranque]   npm run pantallas -- --base=http://127.0.0.1:4000"
echo "[arranque]   npm run contraste -- --todos --base=http://127.0.0.1:4000"
echo "[arranque]   npm run e2e"
