'use strict';

/* ══════════════════════════════════════════════
   EQUIPMENT DATABASE (active / non-EOL only)
   ══════════════════════════════════════════════ */
let EQ = {};

/* ══════════════════════════════════════════════
   TOPOLOGY DEFINITIONS
   ══════════════════════════════════════════════ */
const TOPOS = [
  {
    id:'hubspoke', label:'Hub & Spoke', color:'#C7000B',
    desc:'Todo el tráfico pasa por un hub central. Ideal para centralizar seguridad e inspección. Alta disponibilidad en hub, spoke más económico.',
    protocols:['MPLS L3VPN','SD-WAN overlay','IPsec site-to-site'],
    useCase:'Empresas con sede central y muchas sucursales que requieren políticas unificadas.',
    pros:['Control centralizado de seguridad','Gestión simple','Costos bajos en spoke'],
    cons:['Punto único de fallo si hub no es HA','Latencia branch-to-branch alta','Throughput hub dimensionado para tráfico agregado'],
    nodes:[
      {id:'hub',   x:350, y:80,  w:120, h:46, label:'HUB',    role:'Hub Router / GW', color:'#0E1A2B', eqRole:'hub_router'},
      {id:'br1',   x:100, y:280, w:110, h:40, label:'BR 1',   role:'Branch Router',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'br2',   x:270, y:340, w:110, h:40, label:'BR 2',   role:'Branch Router',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'br3',   x:460, y:340, w:110, h:40, label:'BR 3',   role:'Branch Router',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'br4',   x:590, y:280, w:110, h:40, label:'BR 4',   role:'Branch Router',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'fw',    x:300, y:160, w:100, h:40, label:'FW',     role:'NGFW / Perimeter', color:'#A45B00', eqRole:'fw_ngfw'},
      {id:'ctrl',  x:430, y:160, w:130, h:40, label:'SD-WAN', role:'Controller / NCE', color:'#1F6B4A', eqRole:'sdwan_controller'},
    ],
    links:[
      {f:'hub',f:'hub',t:'br1',label:'WAN'},{f:'hub',t:'br2',label:'WAN'},
      {f:'hub',t:'br3',label:'WAN'},{f:'hub',t:'br4',label:'WAN'},
      {f:'hub',t:'fw',label:''},{f:'hub',t:'ctrl',label:'mgmt'},
    ]
  },
  {
    id:'sdwan', label:'SD-WAN Overlay', color:'#1F6B4A',
    desc:'Túneles cifrados sobre Internet y/o MPLS con selección dinámica de path y visibilidad de aplicaciones. ZTP para despliegue masivo.',
    protocols:['IPsec overlay','VXLAN','AppFlow','BFD path monitoring'],
    useCase:'Empresas que buscan reducir costos MPLS, agregar LTE/5G de respaldo y mejorar experiencia SaaS.',
    pros:['Reducción costos MPLS hasta 70%','ZTP — despliegue sin técnico en sitio','Visibilidad de aplicaciones','Failover automático < 1s'],
    cons:['Calidad depende del underlay','Complejidad del controlador','Requiere criptografía robusta en CPE'],
    nodes:[
      {id:'ctrl',  x:290, y:50,  w:140, h:46, label:'CONTROLLER', role:'SD-WAN Orchestrator',color:'#1F6B4A', eqRole:'sdwan_controller'},
      {id:'inet',  x:520, y:50,  w:120, h:46, label:'INTERNET',    role:'Underlay Public',    color:'#5C6E85', eqRole:null},
      {id:'mpls',  x:520, y:130, w:120, h:40, label:'MPLS',        role:'Underlay Private',   color:'#5C6E85', eqRole:null},
      {id:'hub',   x:290, y:190, w:120, h:46, label:'HUB CPE',     role:'Hub Router SD-WAN',  color:'#0E1A2B', eqRole:'hub_router'},
      {id:'cpe1',  x:80,  y:320, w:120, h:40, label:'CPE 1',       role:'Branch SD-WAN',      color:'#5C6E85', eqRole:'branch_router'},
      {id:'cpe2',  x:240, y:340, w:120, h:40, label:'CPE 2',       role:'Branch SD-WAN',      color:'#5C6E85', eqRole:'branch_router'},
      {id:'cpe3',  x:400, y:340, w:120, h:40, label:'CPE 3',       role:'Branch + 5G',        color:'#5C6E85', eqRole:'branch_small'},
      {id:'fw',    x:160, y:210, w:100, h:40, label:'FW',          role:'NGFW Perimeter',     color:'#A45B00', eqRole:'fw_ngfw'},
    ],
    links:[
      {f:'hub',t:'cpe1',label:'IPsec'},{f:'hub',t:'cpe2',label:'IPsec'},
      {f:'hub',t:'cpe3',label:'IPsec'},{f:'hub',t:'ctrl',label:'ctrl'},
      {f:'hub',t:'fw',label:''},{f:'hub',t:'inet',label:'WAN1'},
      {f:'hub',t:'mpls',label:'WAN2'},{f:'cpe1',t:'inet',label:''},
      {f:'cpe2',t:'inet',label:''},{f:'cpe3',t:'inet',label:''},
    ]
  },
  {
    id:'mpls', label:'MPLS L3VPN', color:'#124191',
    desc:'VPN de capa 3 sobre red MPLS del proveedor. Separación por VRF, QoS garantizado, latencia determinística.',
    protocols:['BGP/MPLS L3VPN','LDP / RSVP-TE','MP-BGP','OSPF/IS-IS underlay'],
    useCase:'Operadores y empresas que necesitan SLA garantizado, QoS por clase de servicio y separación de clientes.',
    pros:['QoS garantizado por SLA','Aislamiento multicliente VRF','Latencia predecible','MPLS TE para ingeniería de tráfico'],
    cons:['Costo mensual elevado','Dependencia del ISP','Tiempo de aprovisionamiento mayor','Cobertura geográfica limitada'],
    nodes:[
      {id:'pe1',   x:180, y:80,  w:110, h:46, label:'PE 1',   role:'Provider Edge',   color:'#124191', eqRole:'pe_router'},
      {id:'pe2',   x:420, y:80,  w:110, h:46, label:'PE 2',   role:'Provider Edge',   color:'#124191', eqRole:'pe_router'},
      {id:'p1',    x:300, y:160, w:100, h:46, label:'P Core', role:'Core / LSR',      color:'#0E1A2B', eqRole:'core_router'},
      {id:'ce1',   x:80,  y:240, w:100, h:40, label:'CE 1',   role:'Customer Edge',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'ce2',   x:200, y:320, w:100, h:40, label:'CE 2',   role:'Customer Edge',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'ce3',   x:400, y:240, w:100, h:40, label:'CE 3',   role:'Customer Edge',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'ce4',   x:530, y:320, w:100, h:40, label:'CE 4',   role:'Customer Edge',   color:'#5C6E85', eqRole:'branch_router'},
      {id:'agg',   x:300, y:360, w:100, h:36, label:'AGG',    role:'Aggregation',     color:'#A45B00', eqRole:'aggregation'},
    ],
    links:[
      {f:'pe1',t:'p1',label:'LSP'},{f:'pe2',t:'p1',label:'LSP'},
      {f:'pe1',t:'ce1',label:'VRF A'},{f:'pe1',t:'ce2',label:'VRF B'},
      {f:'pe2',t:'ce3',label:'VRF A'},{f:'pe2',t:'ce4',label:'VRF B'},
      {f:'p1',t:'agg',label:''},{f:'ce2',t:'agg',label:''},{f:'ce4',t:'agg',label:''},
    ]
  },
  {
    id:'leafspine', label:'Leaf-Spine DC', color:'#4E5B6E',
    desc:'Topología no bloqueante para datacenter. Cada leaf conecta a todos los spines. Latencia predecible, escala horizontal.',
    protocols:['EVPN-VXLAN','BGP','ECMP 64-way','BFD for BGP'],
    useCase:'Datacenters modernos que requieren escalabilidad horizontal, EVPN/VXLAN multitenancy y latencia sub-microsegundo.',
    pros:['No bloqueante — ancho de banda garantizado','Escala horizontal sin cambios en topología','Convergencia rápida con BFD','EVPN-VXLAN multitenancy'],
    cons:['Alto costo de cableado (n×m cables)','Requiere automatización (AVD/Apstra/NSP)','Planificación IP detallada','Cambio de modelo operativo'],
    nodes:[
      {id:'sp1',  x:200, y:80,  w:130, h:46, label:'SPINE 1', role:'Spine Switch',  color:'#0E1A2B', eqRole:'dc_switch_spine'},
      {id:'sp2',  x:380, y:80,  w:130, h:46, label:'SPINE 2', role:'Spine Switch',  color:'#0E1A2B', eqRole:'dc_switch_spine'},
      {id:'lf1',  x:80,  y:260, w:110, h:40, label:'LEAF 1', role:'Leaf / ToR',     color:'#4E5B6E', eqRole:'dc_switch_leaf'},
      {id:'lf2',  x:220, y:260, w:110, h:40, label:'LEAF 2', role:'Leaf / ToR',     color:'#4E5B6E', eqRole:'dc_switch_leaf'},
      {id:'lf3',  x:360, y:260, w:110, h:40, label:'LEAF 3', role:'Leaf / ToR',     color:'#4E5B6E', eqRole:'dc_switch_leaf'},
      {id:'lf4',  x:500, y:260, w:110, h:40, label:'LEAF 4', role:'Leaf / ToR',     color:'#4E5B6E', eqRole:'dc_switch_leaf'},
      {id:'gw',   x:590, y:80,  w:100, h:46, label:'BORDER', role:'DC Gateway/DCI', color:'#A45B00', eqRole:'aggregation'},
    ],
    links:[
      {f:'sp1',t:'lf1',label:'100G'},{f:'sp1',t:'lf2',label:'100G'},
      {f:'sp1',t:'lf3',label:'100G'},{f:'sp1',t:'lf4',label:'100G'},
      {f:'sp2',t:'lf1',label:'100G'},{f:'sp2',t:'lf2',label:'100G'},
      {f:'sp2',t:'lf3',label:'100G'},{f:'sp2',t:'lf4',label:'100G'},
      {f:'sp2',t:'gw',label:'DCI'},{f:'sp1',t:'gw',label:''},
    ]
  },
  {
    id:'sase', label:'SASE / SSE', color:'#A45B00',
    desc:'Seguridad como servicio en la nube. Internet breakout local desde sucursal hacia PoP de SASE para inspección cloud.',
    protocols:['IPsec/GRE hacia PoP SASE','ZTNA','CASB','SWG cloud'],
    useCase:'Empresas con usuarios remotos y SaaS masivo (M365, Salesforce) que buscan eliminar el backhauling de Internet.',
    pros:['Experiencia óptima para SaaS','Elimina backhauling innecesario','Escala según usuarios sin hardware','Seguridad consistente usuario-a-nube'],
    cons:['Dependencia de conectividad cloud','Latencia variable según PoP SASE','Visibilidad limitada en tráfico cifrado','Compliance con residencia de datos'],
    nodes:[
      {id:'sase', x:290, y:50,  w:140, h:46, label:'SASE PoP',  role:'Cloud Security / SASE',color:'#A45B00', eqRole:'sdwan_controller'},
      {id:'inet', x:490, y:50,  w:120, h:46, label:'INTERNET',  role:'Underlay',              color:'#5C6E85', eqRole:null},
      {id:'m365', x:560, y:160, w:120, h:40, label:'M365/SaaS', role:'Cloud Apps',            color:'#5C6E85', eqRole:null},
      {id:'cpe1', x:100, y:200, w:120, h:40, label:'CPE 1',     role:'Branch SASE CPE',       color:'#5C6E85', eqRole:'branch_small'},
      {id:'cpe2', x:240, y:280, w:120, h:40, label:'CPE 2',     role:'Branch SASE CPE',       color:'#5C6E85', eqRole:'branch_small'},
      {id:'fw',   x:100, y:310, w:120, h:40, label:'HQ NGFW',   role:'HQ Perimeter NGFW',     color:'#EE3124', eqRole:'fw_ngfw'},
      {id:'hq',   x:100, y:380, w:120, h:36, label:'HQ LAN',    role:'HQ Campus / DC',        color:'#0E1A2B', eqRole:'aggregation'},
    ],
    links:[
      {f:'cpe1',t:'sase',label:'IPsec'},{f:'cpe2',t:'sase',label:'IPsec'},
      {f:'sase',t:'inet',label:''},{f:'inet',t:'m365',label:''},
      {f:'cpe1',t:'inet',label:'breakout'},{f:'cpe2',t:'inet',label:'breakout'},
      {f:'hq',t:'fw',label:''},{f:'fw',t:'inet',label:''},
    ]
  },
  {
    id:'fullmesh', label:'Full Mesh', color:'#84B135',
    desc:'Cada nodo conecta directamente con todos los demás. Máxima resiliencia, mínima latencia entre pares. Costo O(n²).',
    protocols:['BGP full-mesh iBGP','OSPF/IS-IS','RSVP-TE para FRR','BFD'],
    useCase:'Backbone de operadoras, redes financieras con baja latencia crítica, o redes de 3–5 nodos que requieren redundancia total.',
    pros:['Máxima resiliencia — n-1 fallos tolerados','Latencia E2E mínima','Sin punto único de fallo'],
    cons:['Costo O(n²) — escala mal > 6 nodos','Gestión compleja de rutas BGP','Alto costo de circuitos'],
    nodes:[
      {id:'r1', x:300, y:60,  w:100, h:46, label:'R 1', role:'Core Router',  color:'#0E1A2B', eqRole:'core_router'},
      {id:'r2', x:530, y:170, w:100, h:46, label:'R 2', role:'Core Router',  color:'#0E1A2B', eqRole:'core_router'},
      {id:'r3', x:460, y:330, w:100, h:46, label:'R 3', role:'Core Router',  color:'#0E1A2B', eqRole:'core_router'},
      {id:'r4', x:150, y:330, w:100, h:46, label:'R 4', role:'Core Router',  color:'#0E1A2B', eqRole:'core_router'},
      {id:'r5', x:80,  y:170, w:100, h:46, label:'R 5', role:'Core Router',  color:'#0E1A2B', eqRole:'core_router'},
      {id:'agg',x:280, y:200, w:110, h:40, label:'AGG', role:'Aggregation',  color:'#A45B00', eqRole:'aggregation'},
    ],
    links:[
      {f:'r1',t:'r2',label:''},{f:'r1',t:'r3',label:''},{f:'r1',t:'r4',label:''},
      {f:'r1',t:'r5',label:''},{f:'r2',t:'r3',label:''},{f:'r2',t:'r4',label:''},
      {f:'r2',t:'r5',label:''},{f:'r3',t:'r4',label:''},{f:'r3',t:'r5',label:''},
      {f:'r4',t:'r5',label:''},{f:'r1',t:'agg',label:''},{f:'agg',t:'r4',label:''},
    ]
  },
];

/* ══════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════ */
let currentTopo = TOPOS[0];
let selectedNode = null;

/* ══════════════════════════════════════════════
   INIT TABS
   ══════════════════════════════════════════════ */
function initTabs(){
  const tabs = document.getElementById('topoTabs');
  tabs.innerHTML = TOPOS.map(t=>`
    <button class="topo-tab${t.id===currentTopo.id?' active':''}" data-id="${t.id}">
      <span class="dot" style="background:${t.color}"></span>${t.label}
    </button>`).join('');
  tabs.querySelectorAll('.topo-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      currentTopo = TOPOS.find(t=>t.id===btn.dataset.id);
      selectedNode = null;
      tabs.querySelectorAll('.topo-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      drawTopo();
      clearRec();
    });
  });
}

/* ══════════════════════════════════════════════
   DRAW SVG
   ══════════════════════════════════════════════ */
function nodeById(id){ return currentTopo.nodes.find(n=>n.id===id); }
function cx(n){ return n.x + n.w/2; }
function cy(n){ return n.y + n.h/2; }

function drawTopo(){
  const svg = document.getElementById('topoSvg');
  const t = currentTopo;
  document.getElementById('svgTitle').textContent = 'Topología — ' + t.label;
  let out = '';

  // links
  const drawnLinks = new Set();
  t.links.forEach(l=>{
    const key = [l.f,l.t].sort().join('|');
    if(drawnLinks.has(key)) return;
    drawnLinks.add(key);
    const from = nodeById(l.f), to = nodeById(l.t);
    if(!from||!to) return;
    const x1=cx(from),y1=cy(from),x2=cx(to),y2=cy(to);
    const mx=(x1+x2)/2, my=(y1+y2)/2;
    out += `<line class="link-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    if(l.label) out += `<text class="link-label" x="${mx}" y="${my-5}">${l.label}</text>`;
  });

  // nodes
  t.nodes.forEach(n=>{
    const selected = selectedNode && selectedNode.id===n.id;
    const stroke = selected ? '#C7000B' : 'none';
    const sw = selected ? 3 : 0;
    out += `<g class="node-box${selected?' selected':''}" data-id="${n.id}">
      <rect class="node-rect" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}"
        rx="4" fill="${n.color}" stroke="${stroke}" stroke-width="${sw}"/>
      <text class="node-label" x="${cx(n)}" y="${cy(n)-7}">${n.label}</text>
      <text class="node-role" x="${cx(n)}" y="${cy(n)+8}">${n.role}</text>
      ${n.eqRole?`<circle cx="${n.x+n.w-8}" cy="${n.y+8}" r="4" fill="rgba(255,255,255,.35)"/>`:''}
    </g>`;
  });

  svg.innerHTML = out;

  // click handlers
  svg.querySelectorAll('.node-box').forEach(g=>{
    g.addEventListener('click',()=>{
      const node = nodeById(g.dataset.id);
      if(!node) return;
      selectedNode = node;
      drawTopo(); // redraw to update selection highlight
      showRec(node);
    });
  });
}

/* ══════════════════════════════════════════════
   SHOW RECOMMENDATIONS
   ══════════════════════════════════════════════ */
function clearRec(){
  document.getElementById('recTitle').textContent='—';
  document.getElementById('recDesc').textContent='Haz clic en un nodo del diagrama.';
  document.querySelector('.role-tag').textContent='Selecciona un nodo';
  document.getElementById('recEmpty').style.display='block';
  document.getElementById('recVendors').innerHTML='';
}

function showRec(node){
  document.getElementById('recEmpty').style.display='none';
  document.querySelector('.role-tag').textContent='Rol: '+node.role;
  document.getElementById('recTitle').textContent=node.label+' — '+node.role;
  document.getElementById('recDesc').textContent='Equipos activos recomendados (no EOL/EOS) para el rol '+node.role+' en la topología '+currentTopo.label+'.';

  if(!node.eqRole){ 
    document.getElementById('recVendors').innerHTML=`<div class="rec-empty">Este nodo representa infraestructura del proveedor / cloud.<br>No aplica selección de equipo CPE.</div>`;
    return;
  }

  const recs = EQ[node.eqRole]||[];
  if(!recs.length){
    document.getElementById('recVendors').innerHTML=`<div class="rec-empty">No hay recomendaciones configuradas para este rol.</div>`;
    return;
  }

  document.getElementById('recVendors').innerHTML = recs.map(r=>`
    <div class="vendor-rec">
      <div class="vendor-head" style="background:${r.color}">
        <span style="font-size:13px">${r.v}</span>
      </div>
      <div class="vendor-body">
        <div class="rec-model">${r.model}</div>
        <div class="rec-spec">${r.spec}</div>
        <span class="elp-tag">Ref. precio: ${r.elp}</span>
        <div class="rec-alt"><b>Alternativa:</b> ${r.alt}</div>
      </div>
    </div>`).join('');
}

/* ══════════════════════════════════════════════
   TOPOLOGY INFO CARDS (auto-rendered below svg)
   ══════════════════════════════════════════════ */
function updateInfo(){
  // nothing extra needed — info is in the topo desc
}

/* ══════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════ */
(async function initApp(){
  const res = await fetch('/api/guia/roles');
  EQ = await res.json();
  initTabs();
  drawTopo();
  clearRec();
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.open(abrir.dataset.abrir, '_blank'); return; }
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnCsv' && typeof exportCSV === 'function') exportCSV();
  else if (id === 'btnImprimir') window.print();
});
