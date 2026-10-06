#!/bin/bash
# Avisa antes de un `git push` cuando la puerta de verificacion no ha pasado DESPUES del
# ultimo cambio en el codigo.
#
# POR QUE AQUI. En este repositorio empujar a `main` ES el despliegue: Railway construye
# desde ahi y la instruccion permanente del dueño es que el trabajo va a produccion sin
# preguntar. Esa politica es segura por las cuatro comprobaciones que la rodean, y hasta hoy
# NADA comprobaba que se hubieran corrido: el unico que falla cerrado es `verificar` en CI, y
# para entonces ya empujaste. Desde el 2026-10-05 Railway espera a CI y un rojo ya no llega a
# produccion, pero cuesta un ciclo entero: otro push y otros siete minutos de `pantallas`.
#
# DOS SELLOS: `verificar` frente al ultimo cambio del codigo, y desde el 2026-10-06 `auditar`
# frente al lock y frente al reloj (ver HORAS_AUDITORIA). Los guarda test/pre-push-hook.test.js.
#
# AVISA, NO BLOQUEA — y esa es la decision. Un bloqueo rigido se rodea con una variable de
# entorno, y entonces la advertencia se pierde entera: es el mismo razonamiento por el que la
# puerta de exportacion del dimensionador Fortinet tiene un override con motivo obligatorio
# en vez de no tener salida. Se responde `ask` con el motivo dentro, asi que la decision la
# toma una persona con el dato delante y no se puede pasar por alto.
#
# EL SELLO NO SE INVENTA: sale de `.claude/learning/runs.jsonl`, que escribe el hook
# `aprendizaje.sh` cuando un `npm run verificar` TERMINA BIEN. Si ese registro no existe
# todavia, este hook se calla en vez de dar una alarma que nadie puede atender.
set -euo pipefail

entrada=$(cat)
case "$entrada" in
  *'git push'*) ;;
  *) exit 0 ;;
esac

node -e '
const fs=require("fs"), path=require("path"), cp=require("child_process");
let h; try{ h=JSON.parse(process.argv[1]); }catch{ process.exit(0); }
const raiz=h.cwd||process.cwd();
// El `case` de arriba es un cribado barato sobre el JSON crudo; la decision la toma el
// matcher compartido, que exige que `git` ABRA su segmento de shell. Sin eso, un
// `git commit -m "hacer git push luego"` dispararia el aviso.
const {esGitPush}=require(path.join(raiz,".claude","hooks","lib-comando.js"));
if(!esGitPush((h.tool_input||{}).command||"")) process.exit(0);
const runs=path.join(raiz,".claude","learning","runs.jsonl");

// El ultimo verde de cada comprobacion que interesa aqui.
const ultimoVerde={};
try{
  for(const l of fs.readFileSync(runs,"utf8").split("\n")){
    if(!l.trim()) continue;
    let r; try{ r=JSON.parse(l); }catch{ continue; }
    if(r.rc===0 && (r.action==="verificar" || r.action==="auditar")) ultimoVerde[r.action]=Date.parse(r.ts);
  }
}catch{ process.exit(0); }          // sin registro todavia: no hay nada que afirmar
const ultima=ultimoVerde.verificar;
if(!ultima) process.exit(0);

// Lo mas reciente que se toco de lo que la puerta cubre. `git ls-files` en vez de recorrer
// el arbol: node_modules y las capturas no cuentan, y la lista sale del indice de git.
const mtime=(f)=>{ try{ return fs.statSync(path.join(raiz,f)).mtimeMs; }catch{ return 0; } };
const vigilados=["public","server","scripts","test","package.json"];
let masNuevo=0, archivo="";
for(const d of vigilados){
  let lista=[];
  try{ lista=cp.execSync(`git ls-files -z -- ${d}`,{cwd:raiz}).toString().split("\0").filter(Boolean); }catch{ continue; }
  for(const f of lista){ const m=mtime(f); if(m>masNuevo){ masNuevo=m; archivo=f; } }
}
const motivos=[];
if(masNuevo>ultima){
  const min=Math.round((masNuevo-ultima)/60000);
  motivos.push(`La puerta de verificacion no ha pasado desde el ultimo cambio en el codigo. `
    +`El ultimo "npm run verificar" en verde fue ${new Date(ultima).toISOString()} y `
    +`${archivo} se toco ${min} minuto(s) despues. Corre "npm run verificar" (y `
    +`pantallas/contraste/e2e si tocaste una pantalla).`);
}

// LA AUDITORIA DE DEPENDENCIAS (2026-10-06). `npm run auditar` no va dentro de `verificar`
// (necesita el registro de npm), pero CI la corre en el mismo job y falla cerrado. Ese dia un
// aviso critico nuevo de proxy-addr puso `verificar` en rojo despues de empujar, Railway salto
// el despliegue y hubo que empujar otra vez. Su resultado no depende solo del codigo: la base
// de avisos cambia cada dia. Por eso caduca de dos formas: si el lock cambio despues, o si
// tiene mas de HORAS_AUDITORIA. Se calla mientras no haya ninguna en el registro: un aviso
// que nadie ha visto pasar nunca no se puede atender.
const HORAS_AUDITORIA=12;
const auditada=ultimoVerde.auditar;
if(auditada){
  const lock=Math.max(mtime("package-lock.json"), mtime("package.json"));
  const horas=(Date.now()-auditada)/3600000;
  if(lock>auditada) motivos.push(`El lock cambio despues del ultimo "npm run auditar" en verde (${new Date(auditada).toISOString()}).`);
  else if(horas>HORAS_AUDITORIA) motivos.push(`El ultimo "npm run auditar" en verde tiene ${Math.round(horas)} h, y la base de avisos cambia cada dia: CI la corre y falla cerrado.`);
}
if(!motivos.length) process.exit(0);

const motivo=motivos.join(" ")
  +` Empujar a main DESPLIEGA: Railway construye desde ahi. Confirma si ya sabes que este push no lo necesita.`;
process.stdout.write(JSON.stringify({
  hookSpecificOutput:{ hookEventName:"PreToolUse", permissionDecision:"ask", permissionDecisionReason:motivo },
}));
' "$entrada" 2>/dev/null || true
exit 0
