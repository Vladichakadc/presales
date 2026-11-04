#!/bin/bash
# Registra las corridas de `npm run ...` en .claude/learning/, que es el archivo del que
# viven las skills `self-learning`, `skill-usage-insights` y `skill-feedback-adaptation`.
# Hasta el 2026-09-23 ese directorio NO EXISTIA: las tres estaban instaladas y mudas, que es
# el mismo defecto que `CISCO_EOL_MODELS` —un conjunto inerte se comporta igual que uno que
# funciona— y el del permiso `sync` que vivio meses sin que ninguna ruta lo exigiera.
#
# POR QUE HACEN FALTA LOS DOS EVENTOS, Y NO SOLO PostToolUse. Se midio antes de escribir
# esto: con un comando que sale con codigo 3, `PostToolUse` NO SE DISPARA — solo llega
# `PreToolUse`. Un registro construido sobre el evento de salida guardaria unicamente los
# aciertos, y `skill-usage-insights` calcularia su `success_rate` sobre ellos: 100 % siempre.
# Un registro que solo ve los verdes es peor que no tenerlo, porque invita a confiar en el.
#
# De ahi el reparto, que es el tercer estado de siempre:
#   · PreToolUse  -> apunta la corrida en `en-curso.jsonl` (empezo).
#   · PostToolUse -> la cierra en `runs.jsonl` con rc=0 y su duracion (termino bien).
#   · Lo que se queda en `en-curso.jsonl` FALLO o se interrumpio, y el hook de arranque lo
#     salda al abrir la sesion siguiente con rc=1. No se deduce del texto de la salida:
#     adivinar el exito leyendo stdout es la heuristica que un corchete suelto rompe.
#
# SOLO SE REGISTRA `npm run ...`. En una sesion medida hubo 815 llamadas a Bash y 34 de
# ellas eran npm; anotar un `grep` no dice nada de nada y pagaria el arranque de node 815
# veces. El `case` de abajo es un CRIBADO BARATO sobre el JSON crudo para no arrancar node en
# las otras 781 — la decision de verdad la toma `lib-comando.js`, que distingue un comando
# que SE EJECUTA de uno que solo se menciona dentro de una cadena. Esa distincion no es
# teorica: la primera version casaba con el `grep` y registro una corrida que nunca ocurrio.
set -euo pipefail

entrada=$(cat)
case "$entrada" in
  *'npm run '*|*'npm test'*) ;;
  *) exit 0 ;;
esac

dir="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/learning"
mkdir -p "$dir"

node -e '
const fs=require("fs"), path=require("path");
let h; try { h=JSON.parse(process.argv[1]); } catch { process.exit(0); }
const dir=process.argv[2];
const {accionNpm,rcEsDeNpm}=require(path.join(dir,"..","hooks","lib-comando.js"));
// Se agrupa por la accion de npm y no por el comando entero: asi un
// `npm run pantallas -- --base=...` cuenta como `pantallas` sin guardar rutas ni claves.
const accion=accionNpm((h.tool_input||{}).command||"");
if(!accion) process.exit(0);
const enCurso=path.join(dir,"en-curso.jsonl");
const runs=path.join(dir,"runs.jsonl");
const id=h.tool_use_id||"";
const ts=new Date().toISOString();

if(h.hook_event_name==="PreToolUse"){
  // ANTES de abrir la nueva, lo que ya paso: si las dos ultimas corridas de esta accion acabaron
  // mal, se recuerda consultar al asesor (lib-fallos.js). Va en `additionalContext`, que la sesion
  // lee junto al resultado; nunca en `permissionDecision`: avisa, no aprueba ni frena nada.
  try{
    const {fallosSeguidos,recordatorio,MINIMO}=require(path.join(dir,"..","hooks","lib-fallos.js"));
    const leer=(f)=>{ try{ return fs.readFileSync(f,"utf8"); }catch{ return ""; } };
    const n=fallosSeguidos(accion, leer(runs), leer(enCurso), id);
    if(n>=MINIMO) process.stdout.write(JSON.stringify({
      hookSpecificOutput:{ hookEventName:"PreToolUse", additionalContext:recordatorio(accion,n) },
    }));
  }catch{}
  fs.appendFileSync(enCurso, JSON.stringify({ts,id,skill:"npm",action:accion})+"\n");
  process.exit(0);
}
if(h.hook_event_name==="PostToolUse"){
  // Llego el cierre: la LINEA termino bien. Si su codigo es el de npm, la corrida tambien (rc=0).
  // Si no lo es —npm seguido de `|`, `;` o `||`, o lanzado en segundo plano, que cierra al
  // arrancar—, no se sabe como acabo npm y se apunta rc=null, nunca 0 (lib-comando.js,
  // `rcEsDeNpm`). Se escribe con el esquema que `skill-usage-insights` sabe leer.
  const ti=h.tool_input||{};
  const fondo=ti.run_in_background===true;
  const fiable=!fondo && rcEsDeNpm(ti.command||"");
  fs.appendFileSync(runs, JSON.stringify({
    ts, skill:"npm", action:accion, rc:fiable?0:null,
    duration:(h.duration_ms||0)/1000, error:"", hint:"",
    note:fiable?"":(fondo?"rc desconocido: en segundo plano":"rc desconocido: npm no es el ultimo programa de la linea"),
  })+"\n");
  // Y se retira de en-curso, para que el saldo del arranque no la cuente como fallida.
  try{
    const quedan=fs.readFileSync(enCurso,"utf8").split("\n")
      .filter(l=>l.trim() && !l.includes(`"id":"${id}"`));
    fs.writeFileSync(enCurso, quedan.length?quedan.join("\n")+"\n":"");
  }catch{}
}
' "$entrada" "$dir" 2>/dev/null || true
exit 0
