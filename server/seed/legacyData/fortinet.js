// Verificado contra Fortinet Product Matrix, julio 2026 (fuente oficial):
// https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/Fortinet_Product_Matrix.pdf
// Las 5 cifras publicadas, en orden de profundidad de inspección creciente y throughput
// decreciente. Entender qué mide cada una es el 80% del dimensionamiento correcto:
//   fw   Firewall Throughput (1518 byte UDP) — sesión completamente descargada al ASIC de red
//        (NP7/SP5). Sin inspección de contenido. Es la cifra de portada y la que más se
//        malinterpreta: NO aplica en cuanto se habilita cualquier perfil UTM.
//   vpn  IPsec VPN Throughput (512 byte) — cripto descargada al ASIC.
//   ips  IPS Throughput (Enterprise Mix) — sale del offload de red, asistido por el content
//        processor (CP9/CP10) para pattern matching.
//   ngfw NGFW Throughput (Enterprise Mix) = IPS + Application Control.
//   tp   Threat Protection Throughput (Enterprise Mix) = NGFW + antivirus + logging. Es el
//        número realista de una sucursal con el stack de seguridad completo activo, y el que
//        se debe usar para dimensionar de verdad. (Antes esta clave se llamaba `ssl`, lo que
//        inducía a tratarla como "SSL Inspection Throughput" — un número distinto que
//        Fortinet ya no publica por modelo en el Product Matrix.)
//   sess Concurrent Sessions (valor base, sin licencia Hyperscale).
//   cps  New Sessions/Sec (TCP) — sesiones NUEVAS por segundo. Es el eje de CPU, distinto del
//        de memoria que mide `sess`: una sesion establecida cuesta memoria, abrirla cuesta
//        ciclos. Cifra de modo flow; con inspeccion proxy cae, y Fortinet no publica cuanto.
//
// PROCEDENCIA DE `cps` — leer antes de completar los que faltan.
// El Product Matrix no es accesible desde el entorno donde se edita este catalogo: el proxy
// de egreso responde 403 a fortinet.com y a los espejos del PDF (politica de la organizacion,
// no un fallo de red). Los 21 modelos que llevan cifra se reconstruyeron por busqueda web y
// solo se aceptaron con dos filtros simultaneos:
//   1. la misma cifra repetida en dos consultas formuladas de forma independiente, y
//   2. que la fila trajera ademas un valor de Concurrent Sessions coincidente con el `sess`
//      ya verificado de este catalogo — que es lo que demuestra que la fuente esta leyendo la
//      fila correcta y no desplazada.
// Ese segundo filtro descarto varias respuestas: un 70G con 35.000 cps venia con 700.000
// sesiones concurrentes (las del 60F), y un 80F con 85.000 venia con 720.000 (las del 50G).
// Los 37 modelos restantes quedan en null porque no superaron los dos filtros — entre ellos
// 100F/200F/400F/600F y toda la gama de datacenter. null no es "no tiene limite": la pagina
// lo declara como dato ausente y no lo usa para filtrar. Completarlos requiere abrir el
// Product Matrix desde una maquina con salida a fortinet.com, igual que `npm run datasheets`
// para los PDF de Aruba.
// RAM por modelo NO existe en el Product Matrix: ese documento publica throughput por capa,
// sesiones, cps, interfaces y consumo, no memoria. Fortinet no publica la RAM como
// especificacion de dimensionamiento — el proxy de la capacidad de memoria es `sess`.
// El salto fw -> tp es de un orden de magnitud (ej. 90G: 28 Gbps -> 2.2 Gbps). Ahí está el
// error de preventa más común con FortiGate.
// Corrige varios valores que no coincidían con el datasheet oficial (incl. 3000F y 7081F, que tenían ips/ngfw/ssl/vpn de otro modelo — 3200F y 7121F respectivamente — copiados por error) y agrega los modelos del datasheet que faltaban en el catálogo (700G, 3000G, 3500G, 3800G, 70F, 3200F, 3700F, 4200F).
// 100F/200F/400F/600F no aparecen en este datasheet ("Top Selling Models") pero siguen siendo SKUs vigentes — se dejan sin tocar.
// Su existencia está confirmada además por la guía Hardware Acceleration de FortiOS, que sí les dedica página de fast path.
//
// SKUs, precios de licencias FortiGuard (UTP/Enterprise/ATP), soporte FortiCare y hardware, verificados contra
// "2026Q3 Main Price list_AMER_FINAL_EFF 080326.xlsx" (price list oficial Fortinet AMER, vigente desde 03-ago-2026,
// hojas "FortiGate" y "FortiGate Chassis Platforms"). hwSku = SKU de hardware base; lic = SKUs y precios de lista
// (USD, término 1/3/5 años) de los 3 bundles de protección FortiGuard + los 3 niveles de soporte FortiCare + el
// servicio de migración FortiConverter, todos con el código de modelo embebido en el SKU real de Fortinet.
// 70F/100F/200F/600F: descontinuados — el price list ya no lista SKU de hardware nuevo (hwSku=null) ni bundle
// Enterprise, solo renovación de servicios UTP/ATP a término de 1 año (confirma el estado EOL más allá de la hoja "Changes").
// "FortiGate 2000F": ELIMINADO del catálogo — no es un producto que exista. Estaba registrado como EOL, pero
// tres fuentes oficiales independientes lo desmienten: (1) no aparece en el Product Matrix, donde las únicas
// coincidencias de "2000F" son FML-2000F (FortiMail) y FWB-2000F (FortiWeb); (2) no tiene página de fast path
// architecture en la guía Hardware Acceleration, que sí cubre toda la línea F de datacenter; (3) está ausente
// por completo del price list, incluso de renovaciones de servicio. Además sus specs (fw/ips/ngfw/tp) eran copia
// literal del 3200F. La línea F de datacenter va 1800F -> 2600F, sin 2000F intermedio.
// FortiGate 71F: sucesor vigente del 70F (mismo NP7/SoC + 128 GB SSD onboard) — SKU de hardware FG-71F, bundles
// completos a 1/3/5 años, confirmado además por la hoja "Changes" (entradas 08/03/2026 solo para servicios de 70F,
// ninguna para hardware). Specs de throughput heredadas del 70F verificado en el Product Matrix — Fortinet no publicó
// un datasheet de rendimiento separado para el 71F al momento de este sync; mismo ASIC, por eso se asume equivalente.
//
// Variantes con SSD onboard (31G/51G/71G/91G/121G/201G/401G/701G/901G/3001G/3501G/3801G/61F/81F/401F/1001F/1801F/
// 2601F/3001F/3201F/3501F/3701F/4201F/4401F/4801F): el Product Matrix solo cubre los "Top Selling Models" (variante
// sin SSD); estas 25 variantes hermanas existen como SKU de hardware activo y propio en el price list vigente, mismo
// ASIC/throughput que su modelo base — solo agregan almacenamiento local (útil para retención de logs sin
// FortiAnalyzer, cache de WAN opt, etc.). Specs heredadas 1:1 del modelo base por ser el mismo silicio; el storage
// exacto (ej. 128GB, 2x 960GB, 2x 1.92TB) queda documentado en el campo ifaces de cada modelo.
const MODELS=[
  // ─── Serie G (nueva generación SP5 ASIC) ───────────────────────
  {id:'FortiGate 30G', seg:'SOHO / Teletrabajo', fw:4000, ips:800, ngfw:570, tp:500, vpn:3500, sess:600000, cps:30000, ifaces:'4 GE RJ45'},
  {id:'FortiGate 31G', seg:'SOHO / Teletrabajo', fw:4000, ips:800, ngfw:570, tp:500, vpn:3500, sess:600000, cps:30000, ifaces:'4 GE RJ45 + 30GB SSD onboard'},
  {id:'FortiGate 50G', seg:'SOHO / Sucursal peq', fw:5000, ips:2250, ngfw:1250, tp:1100, vpn:4500, sess:720000, cps:85000, ifaces:'5 GE + variantes SFP/5G'},
  {id:'FortiGate 51G', seg:'SOHO / Sucursal peq', fw:5000, ips:2250, ngfw:1250, tp:1100, vpn:4500, sess:720000, cps:85000, ifaces:'5 GE + variantes SFP/5G + 64GB SSD onboard'},
  {id:'FortiGate 70G', seg:'Sucursal peq', fw:10000, ips:2500, ngfw:1500, tp:1300, vpn:7100, sess:1400000, cps:100000, ifaces:'8 GE + variantes Wi-Fi/5G'},
  {id:'FortiGate 71G', seg:'Sucursal peq', fw:10000, ips:2500, ngfw:1500, tp:1300, vpn:7100, sess:1400000, cps:100000, ifaces:'8 GE + variantes Wi-Fi/5G + 64GB SSD onboard'},
  {id:'FortiGate 90G', seg:'Sucursal med', fw:28000, ips:4500, ngfw:2500, tp:2200, vpn:25000, sess:3000000, cps:124000, ifaces:'8 GE + 2x10GE SFP+'},
  {id:'FortiGate 91G', seg:'Sucursal med', fw:28000, ips:4500, ngfw:2500, tp:2200, vpn:25000, sess:3000000, cps:124000, ifaces:'8 GE + 2x10GE SFP+ + 120GB SSD onboard'},
  {id:'FortiGate 120G', seg:'Sucursal gde', fw:39000, ips:5300, ngfw:3100, tp:2800, vpn:35000, sess:3000000, cps:140000, ifaces:'GE + SFP/SFP+ (alta densidad)'},
  {id:'FortiGate 121G', seg:'Sucursal gde', fw:39000, ips:5300, ngfw:3100, tp:2800, vpn:35000, sess:3000000, cps:140000, ifaces:'GE + SFP/SFP+ (alta densidad) + 480GB SSD onboard'},
  {id:'FortiGate 200G', seg:'Campus / Agr', fw:39000, ips:9000, ngfw:7000, tp:6000, vpn:36000, sess:11000000, cps:400000, ifaces:'10GE SFP+ + GE SFP + GE RJ45'},
  {id:'FortiGate 201G', seg:'Campus / Agr', fw:39000, ips:9000, ngfw:7000, tp:6000, vpn:36000, sess:11000000, cps:400000, ifaces:'10GE SFP+ + GE SFP + GE RJ45 + 480GB SSD onboard'},
  // ─── Serie G — Alta gama / Datacenter / Carrier ────────────────
  {id:'FortiGate 400G', seg:'Campus / DC edge', fw:164000, ips:25000, ngfw:14000, tp:13000, vpn:55000, sess:28000000, cps:null, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45'},
  {id:'FortiGate 401G', seg:'Campus / DC edge', fw:164000, ips:25000, ngfw:14000, tp:13000, vpn:55000, sess:28000000, cps:null, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45 + 960GB SSD onboard'},
  {id:'FortiGate 700G', seg:'DC edge / Enterprise', fw:164000, ips:38000, ngfw:29000, tp:26000, vpn:55000, sess:28000000, cps:null, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45'},
  {id:'FortiGate 701G', seg:'DC edge / Enterprise', fw:164000, ips:38000, ngfw:29000, tp:26000, vpn:55000, sess:28000000, cps:null, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45 + 960GB SSD onboard'},
  {id:'FortiGate 900G', seg:'DC Edge / Enterprise', fw:164000, ips:42000, ngfw:31000, tp:30000, vpn:55000, sess:28000000, cps:null, ifaces:'4x25GE SFP28 + 8 GE SFP + 17 GE RJ45'},
  {id:'FortiGate 901G', seg:'DC Edge / Enterprise', fw:164000, ips:42000, ngfw:31000, tp:30000, vpn:55000, sess:28000000, cps:null, ifaces:'4x25GE SFP28 + 8 GE SFP + 17 GE RJ45 + 2x 480GB SSD onboard'},
  {id:'FortiGate 3000G', seg:'Carrier grade / DC core', fw:397000, ips:90000, ngfw:85000, tp:80000, vpn:105000, sess:88000000, cps:null, ifaces:'6x100GE QSFP28/40GE + 16x25GE SFP28 + 18x10GE RJ45'},
  {id:'FortiGate 3001G', seg:'Carrier grade / DC core', fw:397000, ips:90000, ngfw:85000, tp:80000, vpn:105000, sess:88000000, cps:null, ifaces:'6x100GE QSFP28/40GE + 16x25GE SFP28 + 18x10GE RJ45 + 2TB SSD onboard'},
  {id:'FortiGate 3500G', seg:'DC core', fw:595000, ips:125000, ngfw:115000, tp:105000, vpn:163000, sess:179000000, cps:null, ifaces:'2x400GE QSFP-DD + 4x100GE QSFP28 + 30x25GE SFP28'},
  {id:'FortiGate 3501G', seg:'DC core', fw:595000, ips:125000, ngfw:115000, tp:105000, vpn:163000, sess:179000000, cps:null, ifaces:'2x400GE QSFP-DD + 4x100GE QSFP28 + 30x25GE SFP28 + 2x 1.92TB SSD onboard'},
  {id:'FortiGate 3800G', seg:'DC core / Carrier', fw:795000, ips:250000, ngfw:210000, tp:200000, vpn:210000, sess:210000000, cps:null, ifaces:'4x400GE + 6x200GE QSFP56 + 18x10GE SFP56'},
  {id:'FortiGate 3801G', seg:'DC core / Carrier', fw:795000, ips:250000, ngfw:210000, tp:200000, vpn:210000, sess:210000000, cps:null, ifaces:'4x400GE + 6x200GE QSFP56 + 18x10GE SFP56 + 2x 1.92TB SSD onboard'},
  // ─── Serie F (generación actual) ───────────────────────────────
  {id:'FortiGate 40F', seg:'SOHO', fw:5000, ips:1000, ngfw:800, tp:600, vpn:4400, sess:700000, cps:35000, ifaces:'5 GE'},
  {id:'FortiGate 60F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:700, vpn:6500, sess:700000, cps:35000, ifaces:'10 GE + Wi-Fi opcional'},
  {id:'FortiGate 61F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:700, vpn:6500, sess:700000, cps:35000, ifaces:'10 GE + Wi-Fi opcional + 128GB SSD onboard'},
  {id:'FortiGate 70F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:800, vpn:6100, sess:1500000, cps:null, ifaces:'10 GE RJ45'},
  {id:'FortiGate 71F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:800, vpn:6100, sess:1500000, cps:null, ifaces:'10 GE RJ45 + 128GB SSD onboard'},
  {id:'FortiGate 80F', seg:'Sucursal + PoE', fw:10000, ips:1400, ngfw:1000, tp:900, vpn:6500, sess:1500000, cps:45000, ifaces:'8 GE + 2 SFP'},
  {id:'FortiGate 81F', seg:'Sucursal + PoE', fw:10000, ips:1400, ngfw:1000, tp:900, vpn:6500, sess:1500000, cps:45000, ifaces:'8 GE + 2 SFP + 128GB SSD onboard'},
  {id:'FortiGate 100F', seg:'Sucursal med', fw:20000, ips:2600, ngfw:1600, tp:1000, vpn:11500, sess:1500000, cps:null, ifaces:'22 GE + 2x10GE SFP+'},
  {id:'FortiGate 200F', seg:'Sucursal gde', fw:27000, ips:5000, ngfw:3500, tp:3000, vpn:13000, sess:3000000, cps:null, ifaces:'16 GE + 4x10GE + 4 SFP'},
  {id:'FortiGate 400F', seg:'Campus / Agr', fw:80000, ips:12000, ngfw:10000, tp:9000, vpn:55000, sess:7800000, cps:null, ifaces:'8 GE + 8 SFP + 8x10GE'},
  {id:'FortiGate 401F', seg:'Campus / Agr', fw:80000, ips:12000, ngfw:10000, tp:9000, vpn:55000, sess:7800000, cps:null, ifaces:'8 GE + 8 SFP + 8x10GE + 960GB SSD onboard'},
  {id:'FortiGate 600F', seg:'Campus / DC edge', fw:139000, ips:14000, ngfw:11500, tp:10500, vpn:55000, sess:8000000, cps:null, ifaces:'4x25GE + 16x10GE'},
  {id:'FortiGate 1000F', seg:'DC edge', fw:198000, ips:19000, ngfw:15000, tp:13000, vpn:55000, sess:7500000, cps:650000, ifaces:'4x100GE + 16x25GE + 16x10GE'},
  {id:'FortiGate 1001F', seg:'DC edge', fw:198000, ips:19000, ngfw:15000, tp:13000, vpn:55000, sess:7500000, cps:650000, ifaces:'4x100GE + 16x25GE + 16x10GE + 960GB SSD onboard'},
  // ─── Serie F — Alta gama / Datacenter / Carrier ────────────────
  {id:'FortiGate 1800F', seg:'DC / Enterprise', fw:198000, ips:22000, ngfw:17000, tp:15000, vpn:55000, sess:12000000, cps:750000, ifaces:'2x100GE QSFP28 + 12x25GE SFP28 + 8x10GE RJ45'},
  {id:'FortiGate 1801F', seg:'DC / Enterprise', fw:198000, ips:22000, ngfw:17000, tp:15000, vpn:55000, sess:12000000, cps:750000, ifaces:'2x100GE QSFP28 + 12x25GE SFP28 + 8x10GE RJ45 + 2x 960GB SSD onboard'},
  {id:'FortiGate 2600F', seg:'DC / Carrier', fw:198000, ips:31000, ngfw:27000, tp:25000, vpn:55000, sess:24000000, cps:null, ifaces:'4x100GE QSFP28/40GE + 16x25GE SFP28 + 16x10GE SFP+'},
  {id:'FortiGate 2601F', seg:'DC / Carrier', fw:198000, ips:31000, ngfw:27000, tp:25000, vpn:55000, sess:24000000, cps:null, ifaces:'4x100GE QSFP28/40GE + 16x25GE SFP28 + 16x10GE SFP+ + 2x 960GB SSD onboard'},
  {id:'FortiGate 3000F', seg:'Carrier grade', fw:397000, ips:36000, ngfw:34000, tp:33000, vpn:105000, sess:70000000, cps:null, ifaces:'6x100GE QSFP28/40GE + 18x10GE RJ45'},
  {id:'FortiGate 3001F', seg:'Carrier grade', fw:397000, ips:36000, ngfw:34000, tp:33000, vpn:105000, sess:70000000, cps:null, ifaces:'6x100GE QSFP28/40GE + 18x10GE RJ45 + 2x 960GB SSD onboard'},
  {id:'FortiGate 3200F', seg:'Carrier grade', fw:387000, ips:63000, ngfw:47000, tp:45000, vpn:105000, sess:70000000, cps:null, ifaces:'4x400GE QSFP-DD + 12x50GE SFP28 + 4x25GE SFP28'},
  {id:'FortiGate 3201F', seg:'Carrier grade', fw:387000, ips:63000, ngfw:47000, tp:45000, vpn:105000, sess:70000000, cps:null, ifaces:'4x400GE QSFP-DD + 12x50GE SFP28 + 4x25GE SFP28 + 2x 960GB SSD onboard'},
  {id:'FortiGate 3500F', seg:'DC core', fw:595000, ips:72000, ngfw:65000, tp:63000, vpn:165000, sess:140000000, cps:null, ifaces:'6x100GE QSFP28/40GE + 32x25GE SFP28'},
  {id:'FortiGate 3501F', seg:'DC core', fw:595000, ips:72000, ngfw:65000, tp:63000, vpn:165000, sess:140000000, cps:null, ifaces:'6x100GE QSFP28/40GE + 32x25GE SFP28 + 2x 1.92TB SSD onboard'},
  {id:'FortiGate 3700F', seg:'DC core', fw:589000, ips:86000, ngfw:80000, tp:75000, vpn:160000, sess:140000000, cps:null, ifaces:'4x400GE QSFP-DD + 4x25GE SFP28 ULL + 20x50GE SFP56'},
  {id:'FortiGate 3701F', seg:'DC core', fw:589000, ips:86000, ngfw:80000, tp:75000, vpn:160000, sess:140000000, cps:null, ifaces:'4x400GE QSFP-DD + 4x25GE SFP28 ULL + 20x50GE SFP56 + 2x 1.92TB SSD onboard'},
  {id:'FortiGate 4200F', seg:'DC core', fw:800000, ips:52000, ngfw:47000, tp:45000, vpn:210000, sess:210000000, cps:null, ifaces:'8x100GE QSFP28/40GE + 18x25GE SFP28'},
  {id:'FortiGate 4201F', seg:'DC core', fw:800000, ips:52000, ngfw:47000, tp:45000, vpn:210000, sess:210000000, cps:null, ifaces:'8x100GE QSFP28/40GE + 18x25GE SFP28 + 2x 1.92TB SSD onboard'},
  {id:'FortiGate 4400F', seg:'DC core', fw:1150000, ips:94000, ngfw:82000, tp:75000, vpn:310000, sess:210000000, cps:null, ifaces:'12x100GE QSFP28/40GE + 20x25GE SFP28'},
  {id:'FortiGate 4401F', seg:'DC core', fw:1150000, ips:94000, ngfw:82000, tp:75000, vpn:310000, sess:210000000, cps:null, ifaces:'12x100GE QSFP28/40GE + 20x25GE SFP28 + 2x 1.92TB SSD onboard'},
  {id:'FortiGate 4800F', seg:'Hyperscale DC', fw:3100000, ips:87000, ngfw:77000, tp:75000, vpn:800000, sess:280000000, cps:null, ifaces:'8x400GE + 12x50GE SFP56'},
  {id:'FortiGate 4801F', seg:'Hyperscale DC', fw:3100000, ips:87000, ngfw:77000, tp:75000, vpn:800000, sess:280000000, cps:null, ifaces:'8x400GE + 12x50GE SFP56 + 2x 1.92TB SSD onboard'},
  {id:'FortiGate 7081F', seg:'Carrier / ISP', fw:1890000, ips:405000, ngfw:330000, tp:312000, vpn:378000, sess:600000000, cps:null, ifaces:'Chasis modular FPM (interfaces variables)'},
  {id:'FortiGate 7121F', seg:'Carrier / National', fw:1890000, ips:675000, ngfw:550000, tp:520000, vpn:630000, sess:1000000000, cps:null, ifaces:'Chasis modular FPM (interfaces variables)'},
];

// SKU de hardware base (columna UNIT/SKU de la hoja "FortiGate"/"FortiGate Chassis Platforms").
// null = sin SKU de hardware nuevo vigente en el price list (equipo descontinuado, solo renovación de servicios).
const HW_SKU={
  '30G':'FG-30G', '50G':'FG-50G', '70G':'FG-70G', '90G':'FG-90G', '120G':'FG-120G', '200G':'FG-200G',
  '400G':'FG-400G', '700G':'FG-700G', '900G':'FG-900G', '3000G':'FG-3000G', '3500G':'FG-3500G', '3800G':'FG-3800G',
  '40F':'FG-40F', '60F':'FG-60F', '70F':null, '71F':'FG-71F', '80F':'FG-80F', '100F':null, '200F':null, '400F':'FG-400F', '600F':null,
  '1000F':'FG-1000F', '1800F':'FG-1800F', '2600F':'FG-2600F', '3000F':'FG-3000F', '3200F':'FG-3200F',
  '3500F':'FG-3500F', '3700F':'FG-3700F', '4200F':'FG-4200F', '4400F':'FG-4400F', '4800F':'FG-4800F',
  '7081F':'FG-7081F', '7121F':'FG-7121F',
  '31G':'FG-31G', '51G':'FG-51G', '71G':'FG-71G', '91G':'FG-91G', '121G':'FG-121G', '201G':'FG-201G', '401G':'FG-401G', '701G':'FG-701G', '901G':'FG-901G', '3001G':'FG-3001G', '3501G':'FG-3501G', '3801G':'FG-3801G', '61F':'FG-61F', '81F':'FG-81F', '401F':'FG-401F', '1001F':'FG-1001F', '1801F':'FG-1801F', '2601F':'FG-2601F', '3001F':'FG-3001F', '3201F':'FG-3201F', '3501F':'FG-3501F', '3701F':'FG-3701F', '4201F':'FG-4201F', '4401F':'FG-4401F', '4801F':'FG-4801F',
};

// Licencias FortiGuard (ent/utp/atp) + soporte FortiCare (essential/premium/elite) + FortiConverter por modelo.
// sku = SKU real de Fortinet con el código de modelo embebido · y1/y3/y5 = precio de lista USD por término.
// entBdl/utpBdl = SKU combinado hardware + primera licencia (no existe combo de fábrica para ATP).
// null en un tier = ese SKU no existe para ese modelo en el price list vigente (p.ej. Essential no se ofrece
// en equipos de gama alta; Enterprise no se ofrece en modelos descontinuados).
const LICENSES={
  '30G': {ent:{sku:'FC-10-FG30G-809-02-DD',y1:425,y3:1147.5,y5:1806.25}, utp:{sku:'FC-10-FG30G-950-02-DD',y1:350,y3:945,y5:1487.5}, atp:{sku:'FC-10-FG30G-928-02-DD',y1:225,y3:607.5,y5:956.25}, entBdl:{sku:'FG-30G-BDL-809-DD',y1:1059,y3:1781.5,y5:2440.25}, utpBdl:{sku:'FG-30G-BDL-950-DD',y1:984,y3:1579,y5:2121.5}, care:{essential:{sku:'FC-10-FG30G-314-02-DD',y1:75,y3:225,y5:375},premium:{sku:'FC-10-FG30G-247-02-DD',y1:100,y3:300,y5:500},elite:{sku:'FC-10-FG30G-284-02-DD',y1:125,y3:375,y5:625}}, converter:{sku:'FC-10-FG30G-189-02-DD',fee:50}},
  '50G': {ent:{sku:'FC-10-GT50G-809-02-DD',y1:612.85,y3:1654.7,y5:2604.61}, utp:{sku:'FC-10-GT50G-950-02-DD',y1:504.7,y3:1362.69,y5:2144.98}, atp:{sku:'FC-10-GT50G-928-02-DD',y1:324.45,y3:876.02,y5:1378.91}, entBdl:{sku:'FG-50G-BDL-809-DD',y1:1606.85,y3:2648.7,y5:3598.61}, utpBdl:{sku:'FG-50G-BDL-950-DD',y1:1498.7,y3:2356.69,y5:3138.98}, care:{essential:{sku:'FC-10-GT50G-314-02-DD',y1:108.15,y3:324.45,y5:540.75},premium:{sku:'FC-10-GT50G-247-02-DD',y1:144.2,y3:432.6,y5:721},elite:{sku:'FC-10-GT50G-284-02-DD',y1:180.25,y3:540.75,y5:901.25}}, converter:{sku:'FC-10-GT50G-189-02-DD',fee:50}},
  '70G': {ent:{sku:'FC-10-GT70G-809-02-DD',y1:936.7,y3:2529.09,y5:3980.98}, utp:{sku:'FC-10-GT70G-950-02-DD',y1:771.4,y3:2082.78,y5:3278.45}, atp:{sku:'FC-10-GT70G-928-02-DD',y1:495.9,y3:1338.93,y5:2107.58}, entBdl:{sku:'FG-70G-BDL-809-DD',y1:2356.7,y3:3949.09,y5:5400.98}, utpBdl:{sku:'FG-70G-BDL-950-DD',y1:2191.4,y3:3502.78,y5:4698.45}, care:{essential:{sku:'FC-10-GT70G-314-02-DD',y1:165.3,y3:495.9,y5:826.5},premium:{sku:'FC-10-GT70G-247-02-DD',y1:220.4,y3:661.2,y5:1102},elite:{sku:'FC-10-GT70G-284-02-DD',y1:275.5,y3:826.5,y5:1377.5}}, converter:{sku:'FC-10-GT70G-189-02-DD',fee:55.1}},
  '90G': {ent:{sku:'FC-10-0090G-809-02-DD',y1:2322.2,y3:6966.6,y5:11611}, utp:{sku:'FC-10-0090G-950-02-DD',y1:1912.4,y3:5737.2,y5:9562}, atp:{sku:'FC-10-0090G-928-02-DD',y1:1229.4,y3:3688.2,y5:6147}, entBdl:{sku:'FG-90G-BDL-809-DD',y1:5629.2,y3:10273.6,y5:14918}, utpBdl:{sku:'FG-90G-BDL-950-DD',y1:5219.4,y3:9044.2,y5:12869}, care:{essential:{sku:'FC-10-0090G-314-02-DD',y1:409.8,y3:1229.4,y5:2049},premium:{sku:'FC-10-0090G-247-02-DD',y1:546.4,y3:1639.2,y5:2732},elite:{sku:'FC-10-0090G-284-02-DD',y1:683,y3:2049,y5:3415}}, converter:{sku:'FC-10-0090G-189-02-DD',fee:136.6}},
  '120G': {ent:{sku:'FC-10-F120G-809-02-DD',y1:3366,y3:10098,y5:16830}, utp:{sku:'FC-10-F120G-950-02-DD',y1:2772,y3:8316,y5:13860}, atp:{sku:'FC-10-F120G-928-02-DD',y1:1782,y3:5346,y5:8910}, entBdl:{sku:'FG-120G-BDL-809-DD',y1:8158,y3:14890,y5:21622}, utpBdl:{sku:'FG-120G-BDL-950-DD',y1:7564,y3:13108,y5:18652}, care:{essential:null,premium:{sku:'FC-10-F120G-247-02-DD',y1:792,y3:2376,y5:3960},elite:{sku:'FC-10-F120G-284-02-DD',y1:990,y3:2970,y5:4950}}, converter:{sku:'FC-10-F120G-189-02-DD',fee:198}},
  '200G': {ent:{sku:'FC-10-FG2HG-809-02-DD',y1:7068.6,y3:21205.8,y5:35343}, utp:{sku:'FC-10-FG2HG-950-02-DD',y1:5821.2,y3:17463.6,y5:29106}, atp:{sku:'FC-10-FG2HG-928-02-DD',y1:3742.2,y3:11226.6,y5:18711}, entBdl:{sku:'FG-200G-BDL-809-DD',y1:18545.6,y3:32682.8,y5:46820}, utpBdl:{sku:'FG-200G-BDL-950-DD',y1:17298.2,y3:28940.6,y5:40583}, care:{essential:null,premium:{sku:'FC-10-FG2HG-247-02-DD',y1:1663.2,y3:4989.6,y5:8316},elite:{sku:'FC-10-FG2HG-284-02-DD',y1:2079,y3:6237,y5:10395}}, converter:{sku:'FC-10-FG2HG-189-02-DD',fee:415.8}},
  '400G': {ent:{sku:'FC-10-FG4H0-809-02-DD',y1:18742.5,y3:56227.5,y5:93712.5}, utp:{sku:'FC-10-FG4H0-950-02-DD',y1:15435,y3:46305,y5:77175}, atp:{sku:'FC-10-FG4H0-928-02-DD',y1:9922.5,y3:29767.5,y5:49612.5}, entBdl:{sku:'FG-400G-BDL-809-DD',y1:43438.5,y3:80923.5,y5:118408.5}, utpBdl:{sku:'FG-400G-BDL-950-DD',y1:40131,y3:71001,y5:101871}, care:{essential:null,premium:{sku:'FC-10-FG4H0-247-02-DD',y1:4410,y3:13230,y5:22050},elite:{sku:'FC-10-FG4H0-284-02-DD',y1:5512.5,y3:16537.5,y5:27562.5}}, converter:{sku:'FC-10-FG4H0-189-02-DD',fee:1102.5}},
  '700G': {ent:{sku:'FC-10-G7H0G-809-02-DD',y1:23562,y3:70686,y5:117810}, utp:{sku:'FC-10-G7H0G-950-02-DD',y1:19404,y3:58212,y5:97020}, atp:{sku:'FC-10-G7H0G-928-02-DD',y1:12474,y3:37422,y5:62370}, entBdl:{sku:'FG-700G-BDL-809-DD',y1:58628,y3:105752,y5:152876}, utpBdl:{sku:'FG-700G-BDL-950-DD',y1:54470,y3:93278,y5:132086}, care:{essential:null,premium:{sku:'FC-10-G7H0G-247-02-DD',y1:5544,y3:16632,y5:27720},elite:{sku:'FC-10-G7H0G-284-02-DD',y1:6930,y3:20790,y5:34650}}, converter:{sku:'FC-10-G7H0G-189-02-DD',fee:1386}},
  '900G': {ent:{sku:'FC-10-FG9H0-809-02-DD',y1:32130,y3:96390,y5:160650}, utp:{sku:'FC-10-FG9H0-950-02-DD',y1:26460,y3:79380,y5:132300}, atp:{sku:'FC-10-FG9H0-928-02-DD',y1:17010,y3:51030,y5:85050}, entBdl:{sku:'FG-900G-BDL-809-DD',y1:73710,y3:137970,y5:202230}, utpBdl:{sku:'FG-900G-BDL-950-DD',y1:68040,y3:120960,y5:173880}, care:{essential:null,premium:{sku:'FC-10-FG9H0-247-02-DD',y1:7560,y3:22680,y5:37800},elite:{sku:'FC-10-FG9H0-284-02-DD',y1:9450,y3:28350,y5:47250}}, converter:{sku:'FC-10-FG9H0-189-02-DD',fee:1890}},
  '3000G': {ent:{sku:'FC-10-G3K0G-809-02-DD',y1:139230,y3:417690,y5:696150}, utp:{sku:'FC-10-G3K0G-950-02-DD',y1:114660,y3:343980,y5:573300}, atp:{sku:'FC-10-G3K0G-928-02-DD',y1:73710,y3:221130,y5:368550}, entBdl:{sku:'FG-3000G-BDL-809-DD',y1:337019,y3:615479,y5:893939}, utpBdl:{sku:'FG-3000G-BDL-950-DD',y1:312449,y3:541769,y5:771089}, care:{essential:null,premium:{sku:'FC-10-G3K0G-247-02-DD',y1:32760,y3:98280,y5:163800},elite:{sku:'FC-10-G3K0G-284-02-DD',y1:40950,y3:122850,y5:204750}}, converter:{sku:'FC-10-G3K0G-189-02-DD',fee:5000}},
  '3500G': {ent:{sku:'FC-10-G3K5G-809-02-DD',y1:245044.8,y3:735134.4,y5:1225224}, utp:{sku:'FC-10-G3K5G-950-02-DD',y1:201801.6,y3:605404.8,y5:1009008}, atp:{sku:'FC-10-G3K5G-928-02-DD',y1:129729.6,y3:389188.8,y5:648648}, entBdl:{sku:'FG-3500G-BDL-809-DD',y1:547746.8,y3:1037836.4,y5:1527926}, utpBdl:{sku:'FG-3500G-BDL-950-DD',y1:504503.6,y3:908106.8,y5:1311710}, care:{essential:null,premium:{sku:'FC-10-G3K5G-247-02-DD',y1:57657.6,y3:172972.8,y5:288288},elite:{sku:'FC-10-G3K5G-284-02-DD',y1:72072,y3:216216,y5:360360}}, converter:{sku:'FC-10-G3K5G-189-02-DD',fee:5000}},
  '3800G': {ent:{sku:'FC-10-3K80G-809-02-DD',y1:348075,y3:1044225,y5:1740375}, utp:{sku:'FC-10-3K80G-950-02-DD',y1:286650,y3:859950,y5:1433250}, atp:{sku:'FC-10-3K80G-928-02-DD',y1:184275,y3:552825,y5:921375}, entBdl:{sku:'FG-3800G-BDL-809-DD',y1:842546,y3:1538696,y5:2234846}, utpBdl:{sku:'FG-3800G-BDL-950-DD',y1:781121,y3:1354421,y5:1927721}, care:{essential:null,premium:{sku:'FC-10-3K80G-247-02-DD',y1:81900,y3:245700,y5:409500},elite:{sku:'FC-10-3K80G-284-02-DD',y1:102375,y3:307125,y5:511875}}, converter:{sku:'FC-10-3K80G-189-02-DD',fee:5000}},
  '40F': {ent:{sku:'FC-10-0040F-809-02-DD',y1:510,y3:1377,y5:2167.5}, utp:{sku:'FC-10-0040F-950-02-DD',y1:420,y3:1134,y5:1785}, atp:{sku:'FC-10-0040F-928-02-DD',y1:270,y3:729,y5:1147.5}, entBdl:{sku:'FG-40F-BDL-809-DD',y1:1269,y3:2136,y5:2926.5}, utpBdl:{sku:'FG-40F-BDL-950-DD',y1:1179,y3:1893,y5:2544}, care:{essential:{sku:'FC-10-0040F-314-02-DD',y1:90,y3:270,y5:450},premium:{sku:'FC-10-0040F-247-02-DD',y1:120,y3:360,y5:600},elite:{sku:'FC-10-0040F-284-02-DD',y1:150,y3:450,y5:750}}, converter:{sku:'FC-10-0040F-189-02-DD',fee:50}},
  '60F': {ent:{sku:'FC-10-0060F-809-02-DD',y1:682.55,y3:1842.89,y5:2900.84}, utp:{sku:'FC-10-0060F-950-02-DD',y1:562.1,y3:1517.67,y5:2388.93}, atp:{sku:'FC-10-0060F-928-02-DD',y1:361.35,y3:975.65,y5:1535.74}, entBdl:{sku:'FG-60F-BDL-809-DD',y1:1672.55,y3:2832.89,y5:3890.84}, utpBdl:{sku:'FG-60F-BDL-950-DD',y1:1552.1,y3:2507.67,y5:3378.93}, care:{essential:{sku:'FC-10-0060F-314-02-DD',y1:120.45,y3:361.35,y5:602.25},premium:{sku:'FC-10-0060F-247-02-DD',y1:160.6,y3:481.8,y5:803},elite:{sku:'FC-10-0060F-284-02-DD',y1:200.75,y3:602.25,y5:1003.75}}, converter:{sku:'FC-10-0060F-189-02-DD',fee:50}},
  '70F': {ent:null, utp:{sku:'FC-10-0070F-950-02-DD',y1:735.35,y3:null,y5:null}, atp:{sku:'FC-10-0070F-928-02-DD',y1:472.73,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:{sku:'FC-10-0070F-314-02-DD',y1:157.58,y3:null,y5:null},premium:{sku:'FC-10-0070F-247-02-DD',y1:210.1,y3:null,y5:null},elite:{sku:'FC-10-0070F-284-02-DD',y1:262.63,y3:null,y5:null}}, converter:{sku:'FC-10-0070F-189-02-DD',fee:55}},
  '71F': {ent:{sku:'FC-10-0071F-809-02-DD',y1:1041.25,y3:2811.38,y5:4425.31}, utp:{sku:'FC-10-0071F-950-02-DD',y1:857.5,y3:2315.25,y5:3644.38}, atp:{sku:'FC-10-0071F-928-02-DD',y1:551.25,y3:1488.38,y5:2342.81}, entBdl:{sku:'FG-71F-BDL-809-DD',y1:2389.25,y3:4159.38,y5:5773.31}, utpBdl:{sku:'FG-71F-BDL-950-DD',y1:2205.5,y3:3663.25,y5:4992.38}, care:{essential:{sku:'FC-10-0071F-314-02-DD',y1:183.75,y3:551.25,y5:918.75},premium:{sku:'FC-10-0071F-247-02-DD',y1:245,y3:735,y5:1225},elite:{sku:'FC-10-0071F-284-02-DD',y1:306.25,y3:918.75,y5:1531.25}}, converter:{sku:'FC-10-0071F-189-02-DD',fee:61.25}},
  '80F': {ent:{sku:'FC-10-0080F-809-02-DD',y1:1430.55,y3:3862.49,y5:6079.84}, utp:{sku:'FC-10-0080F-950-02-DD',y1:1178.1,y3:3180.87,y5:5006.93}, atp:{sku:'FC-10-0080F-928-02-DD',y1:757.35,y3:2044.85,y5:3218.74}, entBdl:{sku:'FG-80F-BDL-809-DD',y1:3282.55,y3:5714.49,y5:7931.84}, utpBdl:{sku:'FG-80F-BDL-950-DD',y1:3030.1,y3:5032.87,y5:6858.93}, care:{essential:{sku:'FC-10-0080F-314-02-DD',y1:252.45,y3:757.35,y5:1262.25},premium:{sku:'FC-10-0080F-247-02-DD',y1:336.6,y3:1009.8,y5:1683},elite:{sku:'FC-10-0080F-284-02-DD',y1:420.75,y3:1262.25,y5:2103.75}}, converter:{sku:'FC-10-0080F-189-02-DD',fee:84.15}},
  '100F': {ent:null, utp:{sku:'FC-10-F100F-950-02-DD',y1:2494.8,y3:null,y5:null}, atp:{sku:'FC-10-F100F-928-02-DD',y1:1603.8,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:null,premium:{sku:'FC-10-F100F-247-02-DD',y1:712.8,y3:null,y5:null},elite:{sku:'FC-10-F100F-284-02-DD',y1:891,y3:null,y5:null}}, converter:{sku:'FC-10-F100F-189-02-DD',fee:178.2}},
  '200F': {ent:null, utp:{sku:'FC-10-F200F-950-02-DD',y1:5122.81,y3:null,y5:null}, atp:{sku:'FC-10-F200F-928-02-DD',y1:3293.24,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:null,premium:{sku:'FC-10-F200F-247-02-DD',y1:1463.66,y3:null,y5:null},elite:{sku:'FC-10-F200F-284-02-DD',y1:1829.58,y3:null,y5:null}}, converter:{sku:'FC-10-F200F-189-02-DD',fee:365.92}},
  '400F': {ent:{sku:'FC-10-0400F-809-02-DD',y1:12929.35,y3:38788.05,y5:64646.75}, utp:{sku:'FC-10-0400F-950-02-DD',y1:10647.7,y3:31943.1,y5:53238.5}, atp:{sku:'FC-10-0400F-928-02-DD',y1:6844.95,y3:20534.85,y5:34224.75}, entBdl:{sku:'FG-400F-BDL-809-DD',y1:30499.35,y3:56358.05,y5:82216.75}, utpBdl:{sku:'FG-400F-BDL-950-DD',y1:28217.7,y3:49513.1,y5:70808.5}, care:{essential:null,premium:{sku:'FC-10-0400F-247-02-DD',y1:3042.2,y3:9126.6,y5:15211},elite:{sku:'FC-10-0400F-284-02-DD',y1:3802.75,y3:11408.25,y5:19013.75}}, converter:{sku:'FC-10-0400F-189-02-DD',fee:760.55}},
  '600F': {ent:null, utp:{sku:'FC-10-0600F-950-02-DD',y1:17023.16,y3:null,y5:null}, atp:{sku:'FC-10-0600F-928-02-DD',y1:10943.46,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:null,premium:{sku:'FC-10-0600F-247-02-DD',y1:4863.76,y3:null,y5:null},elite:{sku:'FC-10-0600F-284-02-DD',y1:6079.7,y3:null,y5:null}}, converter:{sku:'FC-10-0600F-189-02-DD',fee:1215.94}},
  '1000F': {ent:{sku:'FC-10-F1K0F-809-02-DD',y1:45125.65,y3:135376.95,y5:225628.25}, utp:{sku:'FC-10-F1K0F-950-02-DD',y1:37162.3,y3:111486.9,y5:185811.5}, atp:{sku:'FC-10-F1K0F-928-02-DD',y1:23890.05,y3:71670.15,y5:119450.25}, entBdl:{sku:'FG-1000F-BDL-809-DD',y1:106443.65,y3:196694.95,y5:286946.25}, utpBdl:{sku:'FG-1000F-BDL-950-DD',y1:98480.3,y3:172804.9,y5:247129.5}, care:{essential:null,premium:{sku:'FC-10-F1K0F-247-02-DD',y1:10617.8,y3:31853.4,y5:53089},elite:{sku:'FC-10-F1K0F-284-02-DD',y1:13272.25,y3:39816.75,y5:66361.25}}, converter:{sku:'FC-10-F1K0F-189-02-DD',fee:2654.45}},
  '1800F': {ent:{sku:'FC-10-F18HF-809-02-DD',y1:47109.55,y3:141328.65,y5:235547.75}, utp:{sku:'FC-10-F18HF-950-02-DD',y1:38796.1,y3:116388.3,y5:193980.5}, atp:{sku:'FC-10-F18HF-928-02-DD',y1:24940.35,y3:74821.05,y5:124701.75}, entBdl:{sku:'FG-1800F-BDL-809-DD',y1:112952.55,y3:207171.65,y5:301390.75}, utpBdl:{sku:'FG-1800F-BDL-950-DD',y1:104639.1,y3:182231.3,y5:259823.5}, care:{essential:null,premium:{sku:'FC-10-F18HF-247-02-DD',y1:11084.6,y3:33253.8,y5:55423},elite:{sku:'FC-10-F18HF-284-02-DD',y1:13855.75,y3:41567.25,y5:69278.75}}, converter:{sku:'FC-10-F18HF-189-02-DD',fee:2771.15}},
  '2600F': {ent:{sku:'FC-10-F26HF-809-02-DD',y1:63598.7,y3:190796.1,y5:317993.5}, utp:{sku:'FC-10-F26HF-950-02-DD',y1:52375.4,y3:157126.2,y5:261877}, atp:{sku:'FC-10-F26HF-928-02-DD',y1:33669.9,y3:101009.7,y5:168349.5}, entBdl:{sku:'FG-2600F-BDL-809-DD',y1:150018.7,y3:277216.1,y5:404413.5}, utpBdl:{sku:'FG-2600F-BDL-950-DD',y1:138795.4,y3:243546.2,y5:348297}, care:{essential:null,premium:{sku:'FC-10-F26HF-247-02-DD',y1:14964.4,y3:44893.2,y5:74822},elite:{sku:'FC-10-F26HF-284-02-DD',y1:18705.5,y3:56116.5,y5:93527.5}}, converter:{sku:'FC-10-F26HF-189-02-DD',fee:3741.1}},
  '3000F': {ent:{sku:'FC-10-F3K0F-809-02-DD',y1:95373.4,y3:286120.2,y5:476867}, utp:{sku:'FC-10-F3K0F-950-02-DD',y1:78542.8,y3:235628.4,y5:392714}, atp:{sku:'FC-10-F3K0F-928-02-DD',y1:50491.8,y3:151475.4,y5:252459}, entBdl:{sku:'FG-3000F-BDL-809-DD',y1:224969.4,y3:415716.2,y5:606463}, utpBdl:{sku:'FG-3000F-BDL-950-DD',y1:208138.8,y3:365224.4,y5:522310}, care:{essential:null,premium:{sku:'FC-10-F3K0F-247-02-DD',y1:22440.8,y3:67322.4,y5:112204},elite:{sku:'FC-10-F3K0F-284-02-DD',y1:28051,y3:84153,y5:140255}}, converter:{sku:'FC-10-F3K0F-189-02-DD',fee:5000}},
  '3200F': {ent:{sku:'FC-10-F3K2F-809-02-DD',y1:127500,y3:382500,y5:637500}, utp:{sku:'FC-10-F3K2F-950-02-DD',y1:105000,y3:315000,y5:525000}, atp:{sku:'FC-10-F3K2F-928-02-DD',y1:67500,y3:202500,y5:337500}, entBdl:{sku:'FG-3200F-BDL-809-DD',y1:300750,y3:555750,y5:810750}, utpBdl:{sku:'FG-3200F-BDL-950-DD',y1:278250,y3:488250,y5:698250}, care:{essential:null,premium:{sku:'FC-10-F3K2F-247-02-DD',y1:30000,y3:90000,y5:150000},elite:{sku:'FC-10-F3K2F-284-02-DD',y1:37500,y3:112500,y5:187500}}, converter:{sku:'FC-10-F3K2F-189-02-DD',fee:5000}},
  '3500F': {ent:{sku:'FC-10-F3K5F-809-02-DD',y1:209100,y3:627300,y5:1045500}, utp:{sku:'FC-10-F3K5F-950-02-DD',y1:172200,y3:516600,y5:861000}, atp:{sku:'FC-10-F3K5F-928-02-DD',y1:110700,y3:332100,y5:553500}, entBdl:{sku:'FG-3500F-BDL-809-DD',y1:493230,y3:911430,y5:1329630}, utpBdl:{sku:'FG-3500F-BDL-950-DD',y1:456330,y3:800730,y5:1145130}, care:{essential:null,premium:{sku:'FC-10-F3K5F-247-02-DD',y1:49200,y3:147600,y5:246000},elite:{sku:'FC-10-F3K5F-284-02-DD',y1:61500,y3:184500,y5:307500}}, converter:{sku:'FC-10-F3K5F-189-02-DD',fee:5000}},
  '3700F': {ent:{sku:'FC-10-F3K7F-809-02-DD',y1:234549,y3:703647,y5:1172745}, utp:{sku:'FC-10-F3K7F-950-02-DD',y1:193158,y3:579474,y5:965790}, atp:{sku:'FC-10-F3K7F-928-02-DD',y1:124173,y3:372519,y5:620865}, entBdl:{sku:'FG-3700F-BDL-809-DD',y1:538083,y3:1007181,y5:1476279}, utpBdl:{sku:'FG-3700F-BDL-950-DD',y1:496692,y3:883008,y5:1269324}, care:{essential:null,premium:{sku:'FC-10-F3K7F-247-02-DD',y1:55188,y3:165564,y5:275940},elite:{sku:'FC-10-F3K7F-284-02-DD',y1:68985,y3:206955,y5:344925}}, converter:{sku:'FC-10-F3K7F-189-02-DD',fee:5000}},
  '4200F': {ent:{sku:'FC-10-F42HF-809-02-DD',y1:221860.2,y3:665580.6,y5:1109301}, utp:{sku:'FC-10-F42HF-950-02-DD',y1:182708.4,y3:548125.2,y5:913542}, atp:{sku:'FC-10-F42HF-928-02-DD',y1:117455.4,y3:352366.2,y5:587277}, entBdl:{sku:'FG-4200F-BDL-809-DD',y1:543428.2,y3:987148.6,y5:1430869}, utpBdl:{sku:'FG-4200F-BDL-950-DD',y1:504276.4,y3:869693.2,y5:1235110}, care:{essential:null,premium:{sku:'FC-10-F42HF-247-02-DD',y1:52202.4,y3:156607.2,y5:261012},elite:{sku:'FC-10-F42HF-284-02-DD',y1:65253,y3:195759,y5:326265}}, converter:{sku:'FC-10-F42HF-189-02-DD',fee:5000}},
  '4400F': {ent:{sku:'FC-10-F44HF-809-02-DD',y1:298860,y3:896580,y5:1494300}, utp:{sku:'FC-10-F44HF-950-02-DD',y1:246120,y3:738360,y5:1230600}, atp:{sku:'FC-10-F44HF-928-02-DD',y1:158220,y3:474660,y5:791100}, entBdl:{sku:'FG-4400F-BDL-809-DD',y1:716561,y3:1314281,y5:1912001}, utpBdl:{sku:'FG-4400F-BDL-950-DD',y1:663821,y3:1156061,y5:1648301}, care:{essential:null,premium:{sku:'FC-10-F44HF-247-02-DD',y1:70320,y3:210960,y5:351600},elite:{sku:'FC-10-F44HF-284-02-DD',y1:87900,y3:263700,y5:439500}}, converter:{sku:'FC-10-F44HF-189-02-DD',fee:5000}},
  '4800F': {ent:{sku:'FC-10-F48HF-809-02-DD',y1:348840,y3:1046520,y5:1744200}, utp:{sku:'FC-10-F48HF-950-02-DD',y1:287280,y3:861840,y5:1436400}, atp:{sku:'FC-10-F48HF-928-02-DD',y1:184680,y3:554040,y5:923400}, entBdl:{sku:'FG-4800F-BDL-809-DD',y1:800280,y3:1497960,y5:2195640}, utpBdl:{sku:'FG-4800F-BDL-950-DD',y1:738720,y3:1313280,y5:1887840}, care:{essential:null,premium:{sku:'FC-10-F48HF-247-02-DD',y1:82080,y3:246240,y5:410400},elite:{sku:'FC-10-F48HF-284-02-DD',y1:102600,y3:307800,y5:513000}}, converter:{sku:'FC-10-F48HF-189-02-DD',fee:5000}},
  '7081F': {ent:{sku:'FC-10-F78F1-809-02-DD',y1:260100,y3:780300,y5:1300500}, utp:{sku:'FC-10-F78F1-950-02-DD',y1:214200,y3:642600,y5:1071000}, atp:{sku:'FC-10-F78F1-928-02-DD',y1:137700,y3:413100,y5:688500}, entBdl:{sku:'FG-7081F-BDL-809-DD',y1:647190,y3:1167390,y5:1687590}, utpBdl:{sku:'FG-7081F-BDL-950-DD',y1:601290,y3:1029690,y5:1458090}, care:{essential:null,premium:{sku:'FC-10-F78F1-247-02-DD',y1:61200,y3:183600,y5:306000},elite:{sku:'FC-10-F78F1-284-02-DD',y1:76500,y3:229500,y5:382500}}, converter:{sku:'FC-10-F78F1-189-02-DD',fee:5000}},
  '7121F': {ent:{sku:'FC-10-F7CF1-809-02-DD',y1:487305,y3:1461915,y5:2436525}, utp:{sku:'FC-10-F7CF1-950-02-DD',y1:401310,y3:1203930,y5:2006550}, atp:{sku:'FC-10-F7CF1-928-02-DD',y1:257985,y3:773955,y5:1289925}, entBdl:{sku:'FG-7121F-BDL-809-DD',y1:1117935,y3:2092545,y5:3067155}, utpBdl:{sku:'FG-7121F-BDL-950-DD',y1:1031940,y3:1834560,y5:2637180}, care:{essential:null,premium:{sku:'FC-10-F7CF1-247-02-DD',y1:114660,y3:343980,y5:573300},elite:{sku:'FC-10-F7CF1-284-02-DD',y1:143325,y3:429975,y5:716625}}, converter:{sku:'FC-10-F7CF1-189-02-DD',fee:5000}},
  '31G': {ent:{sku:'FC-10-GT31G-809-02-DD',y1:489.6,y3:1321.92,y5:2080.8}, utp:{sku:'FC-10-GT31G-950-02-DD',y1:403.2,y3:1088.64,y5:1713.6}, atp:{sku:'FC-10-GT31G-928-02-DD',y1:259.2,y3:699.84,y5:1101.6}, entBdl:{sku:'FG-31G-BDL-809-DD',y1:1285.6,y3:2117.92,y5:2876.8}, utpBdl:{sku:'FG-31G-BDL-950-DD',y1:1199.2,y3:1884.64,y5:2509.6}, care:{essential:{sku:'FC-10-GT31G-314-02-DD',y1:86.4,y3:259.2,y5:432},premium:{sku:'FC-10-GT31G-247-02-DD',y1:115.2,y3:345.6,y5:576},elite:{sku:'FC-10-GT31G-284-02-DD',y1:144,y3:432,y5:720}}, converter:{sku:'FC-10-GT31G-189-02-DD',fee:50}},
  '51G': {ent:{sku:'FC-10-GT51G-809-02-DD',y1:668.95,y3:1806.17,y5:2843.04}, utp:{sku:'FC-10-GT51G-950-02-DD',y1:550.9,y3:1487.43,y5:2341.33}, atp:{sku:'FC-10-GT51G-928-02-DD',y1:354.15,y3:956.21,y5:1505.14}, entBdl:{sku:'FG-51G-BDL-809-DD',y1:1801.95,y3:2939.17,y5:3976.04}, utpBdl:{sku:'FG-51G-BDL-950-DD',y1:1683.9,y3:2620.43,y5:3474.33}, care:{essential:{sku:'FC-10-GT51G-314-02-DD',y1:118.05,y3:354.15,y5:590.25},premium:{sku:'FC-10-GT51G-247-02-DD',y1:157.4,y3:472.2,y5:787},elite:{sku:'FC-10-GT51G-284-02-DD',y1:196.75,y3:590.25,y5:983.75}}, converter:{sku:'FC-10-GT51G-189-02-DD',fee:50}},
  '71G': {ent:{sku:'FC-10-GT71G-809-02-DD',y1:1093.1,y3:2951.37,y5:4645.68}, utp:{sku:'FC-10-GT71G-950-02-DD',y1:900.2,y3:2430.54,y5:3825.85}, atp:{sku:'FC-10-GT71G-928-02-DD',y1:578.7,y3:1562.49,y5:2459.48}, entBdl:{sku:'FG-71G-BDL-809-DD',y1:2750.1,y3:4608.37,y5:6302.68}, utpBdl:{sku:'FG-71G-BDL-950-DD',y1:2557.2,y3:4087.54,y5:5482.85}, care:{essential:{sku:'FC-10-GT71G-314-02-DD',y1:192.9,y3:578.7,y5:964.5},premium:{sku:'FC-10-GT71G-247-02-DD',y1:257.2,y3:771.6,y5:1286},elite:{sku:'FC-10-GT71G-284-02-DD',y1:321.5,y3:964.5,y5:1607.5}}, converter:{sku:'FC-10-GT71G-189-02-DD',fee:64.3}},
  '91G': {ent:{sku:'FC-10-0091G-809-02-DD',y1:2754.85,y3:8264.55,y5:13774.25}, utp:{sku:'FC-10-0091G-950-02-DD',y1:2268.7,y3:6806.1,y5:11343.5}, atp:{sku:'FC-10-0091G-928-02-DD',y1:1458.45,y3:4375.35,y5:7292.25}, entBdl:{sku:'FG-91G-BDL-809-DD',y1:6676.85,y3:12186.55,y5:17696.25}, utpBdl:{sku:'FG-91G-BDL-950-DD',y1:6190.7,y3:10728.1,y5:15265.5}, care:{essential:{sku:'FC-10-0091G-314-02-DD',y1:486.15,y3:1458.45,y5:2430.75},premium:{sku:'FC-10-0091G-247-02-DD',y1:648.2,y3:1944.6,y5:3241},elite:{sku:'FC-10-0091G-284-02-DD',y1:810.25,y3:2430.75,y5:4051.25}}, converter:{sku:'FC-10-0091G-189-02-DD',fee:162.05}},
  '121G': {ent:{sku:'FC-10-F121G-809-02-DD',y1:3702.6,y3:11107.8,y5:18513}, utp:{sku:'FC-10-F121G-950-02-DD',y1:3049.2,y3:9147.6,y5:15246}, atp:{sku:'FC-10-F121G-928-02-DD',y1:1960.2,y3:5880.6,y5:9801}, entBdl:{sku:'FG-121G-BDL-809-DD',y1:9212.6,y3:16617.8,y5:24023}, utpBdl:{sku:'FG-121G-BDL-950-DD',y1:8559.2,y3:14657.6,y5:20756}, care:{essential:null,premium:{sku:'FC-10-F121G-247-02-DD',y1:871.2,y3:2613.6,y5:4356},elite:{sku:'FC-10-F121G-284-02-DD',y1:1089,y3:3267,y5:5445}}, converter:{sku:'FC-10-F121G-189-02-DD',fee:217.8}},
  '201G': {ent:{sku:'FC-10-F2H1G-809-02-DD',y1:7818.3,y3:23454.9,y5:39091.5}, utp:{sku:'FC-10-F2H1G-950-02-DD',y1:6438.6,y3:19315.8,y5:32193}, atp:{sku:'FC-10-F2H1G-928-02-DD',y1:4139.1,y3:12417.3,y5:20695.5}, entBdl:{sku:'FG-201G-BDL-809-DD',y1:20511.3,y3:36147.9,y5:51784.5}, utpBdl:{sku:'FG-201G-BDL-950-DD',y1:19131.6,y3:32008.8,y5:44886}, care:{essential:null,premium:{sku:'FC-10-F2H1G-247-02-DD',y1:1839.6,y3:5518.8,y5:9198},elite:{sku:'FC-10-F2H1G-284-02-DD',y1:2299.5,y3:6898.5,y5:11497.5}}, converter:{sku:'FC-10-F2H1G-189-02-DD',fee:459.9}},
  '401G': {ent:{sku:'FC-10-FG4H1-809-02-DD',y1:20527.5,y3:61582.5,y5:102637.5}, utp:{sku:'FC-10-FG4H1-950-02-DD',y1:16905,y3:50715,y5:84525}, atp:{sku:'FC-10-FG4H1-928-02-DD',y1:10867.5,y3:32602.5,y5:54337.5}, entBdl:{sku:'FG-401G-BDL-809-DD',y1:48300.5,y3:89355.5,y5:130410.5}, utpBdl:{sku:'FG-401G-BDL-950-DD',y1:44678,y3:78488,y5:112298}, care:{essential:null,premium:{sku:'FC-10-FG4H1-247-02-DD',y1:4830,y3:14490,y5:24150},elite:{sku:'FC-10-FG4H1-284-02-DD',y1:6037.5,y3:18112.5,y5:30187.5}}, converter:{sku:'FC-10-FG4H1-189-02-DD',fee:1207.5}},
  '701G': {ent:{sku:'FC-10-G7H1G-809-02-DD',y1:25704,y3:77112,y5:128520}, utp:{sku:'FC-10-G7H1G-950-02-DD',y1:21168,y3:63504,y5:105840}, atp:{sku:'FC-10-G7H1G-928-02-DD',y1:13608,y3:40824,y5:68040}, entBdl:{sku:'FG-701G-BDL-809-DD',y1:63958,y3:115366,y5:166774}, utpBdl:{sku:'FG-701G-BDL-950-DD',y1:59422,y3:101758,y5:144094}, care:{essential:null,premium:{sku:'FC-10-G7H1G-247-02-DD',y1:6048,y3:18144,y5:30240},elite:{sku:'FC-10-G7H1G-284-02-DD',y1:7560,y3:22680,y5:37800}}, converter:{sku:'FC-10-G7H1G-189-02-DD',fee:1512}},
  '901G': {ent:{sku:'FC-10-FG9H1-809-02-DD',y1:33201,y3:99603,y5:166005}, utp:{sku:'FC-10-FG9H1-950-02-DD',y1:27342,y3:82026,y5:136710}, atp:{sku:'FC-10-FG9H1-928-02-DD',y1:17577,y3:52731,y5:87885}, entBdl:{sku:'FG-901G-BDL-809-DD',y1:82612,y3:149014,y5:215416}, utpBdl:{sku:'FG-901G-BDL-950-DD',y1:76753,y3:131437,y5:186121}, care:{essential:null,premium:{sku:'FC-10-FG9H1-247-02-DD',y1:7812,y3:23436,y5:39060},elite:{sku:'FC-10-FG9H1-284-02-DD',y1:9765,y3:29295,y5:48825}}, converter:{sku:'FC-10-FG9H1-189-02-DD',fee:1953}},
  '3001G': {ent:{sku:'FC-10-G3K1G-809-02-DD',y1:145628.8,y3:436886.4,y5:728144}, utp:{sku:'FC-10-G3K1G-950-02-DD',y1:119929.6,y3:359788.8,y5:599648}, atp:{sku:'FC-10-G3K1G-928-02-DD',y1:77097.6,y3:231292.8,y5:385488}, entBdl:{sku:'FG-3001G-BDL-809-DD',y1:358417.8,y3:649675.4,y5:940933}, utpBdl:{sku:'FG-3001G-BDL-950-DD',y1:332718.6,y3:572577.8,y5:812437}, care:{essential:null,premium:{sku:'FC-10-G3K1G-247-02-DD',y1:34265.6,y3:102796.8,y5:171328},elite:{sku:'FC-10-G3K1G-284-02-DD',y1:42832,y3:128496,y5:214160}}, converter:{sku:'FC-10-G3K1G-189-02-DD',fee:5000}},
  '3501G': {ent:{sku:'FC-10-G35G1-809-02-DD',y1:250043.65,y3:750130.95,y5:1250218.25}, utp:{sku:'FC-10-G35G1-950-02-DD',y1:205918.3,y3:617754.9,y5:1029591.5}, atp:{sku:'FC-10-G35G1-928-02-DD',y1:132376.05,y3:397128.15,y5:661880.25}, entBdl:{sku:'FG-3501G-BDL-809-DD',y1:567745.65,y3:1067832.95,y5:1567920.25}, utpBdl:{sku:'FG-3501G-BDL-950-DD',y1:523620.3,y3:935456.9,y5:1347293.5}, care:{essential:null,premium:{sku:'FC-10-G35G1-247-02-DD',y1:58833.8,y3:176501.4,y5:294169},elite:{sku:'FC-10-G35G1-284-02-DD',y1:73542.25,y3:220626.75,y5:367711.25}}, converter:{sku:'FC-10-G35G1-189-02-DD',fee:5000}},
  '3801G': {ent:{sku:'FC-10-3K81G-809-02-DD',y1:358633.7,y3:1075901.1,y5:1793168.5}, utp:{sku:'FC-10-3K81G-950-02-DD',y1:295345.4,y3:886036.2,y5:1476727}, atp:{sku:'FC-10-3K81G-928-02-DD',y1:189864.9,y3:569594.7,y5:949324.5}, entBdl:{sku:'FG-3801G-BDL-809-DD',y1:868104.7,y3:1585372.1,y5:2302639.5}, utpBdl:{sku:'FG-3801G-BDL-950-DD',y1:804816.4,y3:1395507.2,y5:1986198}, care:{essential:null,premium:{sku:'FC-10-3K81G-247-02-DD',y1:84384.4,y3:253153.2,y5:421922},elite:{sku:'FC-10-3K81G-284-02-DD',y1:105480.5,y3:316441.5,y5:527402.5}}, converter:{sku:'FC-10-3K81G-189-02-DD',fee:5000}},
  '61F': {ent:{sku:'FC-10-0061F-809-02-DD',y1:878.9,y3:2373.03,y5:3735.33}, utp:{sku:'FC-10-0061F-950-02-DD',y1:723.8,y3:1954.26,y5:3076.15}, atp:{sku:'FC-10-0061F-928-02-DD',y1:465.3,y3:1256.31,y5:1977.53}, entBdl:{sku:'FG-61F-BDL-809-DD',y1:2187.9,y3:3682.03,y5:5044.33}, utpBdl:{sku:'FG-61F-BDL-950-DD',y1:2032.8,y3:3263.26,y5:4385.15}, care:{essential:{sku:'FC-10-0061F-314-02-DD',y1:155.1,y3:465.3,y5:775.5},premium:{sku:'FC-10-0061F-247-02-DD',y1:206.8,y3:620.4,y5:1034},elite:{sku:'FC-10-0061F-284-02-DD',y1:258.5,y3:775.5,y5:1292.5}}, converter:{sku:'FC-10-0061F-189-02-DD',fee:51.7}},
  '81F': {ent:{sku:'FC-10-0081F-809-02-DD',y1:1848.75,y3:4991.63,y5:7857.19}, utp:{sku:'FC-10-0081F-950-02-DD',y1:1522.5,y3:4110.75,y5:6470.63}, atp:{sku:'FC-10-0081F-928-02-DD',y1:978.75,y3:2642.63,y5:4159.69}, entBdl:{sku:'FG-81F-BDL-809-DD',y1:4241.75,y3:7384.63,y5:10250.19}, utpBdl:{sku:'FG-81F-BDL-950-DD',y1:3915.5,y3:6503.75,y5:8863.63}, care:{essential:{sku:'FC-10-0081F-314-02-DD',y1:326.25,y3:978.75,y5:1631.25},premium:{sku:'FC-10-0081F-247-02-DD',y1:435,y3:1305,y5:2175},elite:{sku:'FC-10-0081F-284-02-DD',y1:543.75,y3:1631.25,y5:2718.75}}, converter:{sku:'FC-10-0081F-189-02-DD',fee:108.75}},
  '401F': {ent:{sku:'FC-10-0401F-809-02-DD',y1:14982.1,y3:44946.3,y5:74910.5}, utp:{sku:'FC-10-0401F-950-02-DD',y1:12338.2,y3:37014.6,y5:61691}, atp:{sku:'FC-10-0401F-928-02-DD',y1:7931.7,y3:23795.1,y5:39658.5}, entBdl:{sku:'FG-401F-BDL-809-DD',y1:36698.1,y3:66662.3,y5:96626.5}, utpBdl:{sku:'FG-401F-BDL-950-DD',y1:34054.2,y3:58730.6,y5:83407}, care:{essential:null,premium:{sku:'FC-10-0401F-247-02-DD',y1:3525.2,y3:10575.6,y5:17626},elite:{sku:'FC-10-0401F-284-02-DD',y1:4406.5,y3:13219.5,y5:22032.5}}, converter:{sku:'FC-10-0401F-189-02-DD',fee:881.3}},
  '1001F': {ent:{sku:'FC-10-F1K1F-809-02-DD',y1:48185.65,y3:144556.95,y5:240928.25}, utp:{sku:'FC-10-F1K1F-950-02-DD',y1:39682.3,y3:119046.9,y5:198411.5}, atp:{sku:'FC-10-F1K1F-928-02-DD',y1:25510.05,y3:76530.15,y5:127550.25}, entBdl:{sku:'FG-1001F-BDL-809-DD',y1:113661.65,y3:210032.95,y5:306404.25}, utpBdl:{sku:'FG-1001F-BDL-950-DD',y1:105158.3,y3:184522.9,y5:263887.5}, care:{essential:null,premium:{sku:'FC-10-F1K1F-247-02-DD',y1:11337.8,y3:34013.4,y5:56689},elite:{sku:'FC-10-F1K1F-284-02-DD',y1:14172.25,y3:42516.75,y5:70861.25}}, converter:{sku:'FC-10-F1K1F-189-02-DD',fee:2834.45}},
  '1801F': {ent:{sku:'FC-10-F18F1-809-02-DD',y1:51035.7,y3:153107.1,y5:255178.5}, utp:{sku:'FC-10-F18F1-950-02-DD',y1:42029.4,y3:126088.2,y5:210147}, atp:{sku:'FC-10-F18F1-928-02-DD',y1:27018.9,y3:81056.7,y5:135094.5}, entBdl:{sku:'FG-1801F-BDL-809-DD',y1:122366.7,y3:224438.1,y5:326509.5}, utpBdl:{sku:'FG-1801F-BDL-950-DD',y1:113360.4,y3:197419.2,y5:281478}, care:{essential:null,premium:{sku:'FC-10-F18F1-247-02-DD',y1:12008.4,y3:36025.2,y5:60042},elite:{sku:'FC-10-F18F1-284-02-DD',y1:15010.5,y3:45031.5,y5:75052.5}}, converter:{sku:'FC-10-F18F1-189-02-DD',fee:3002.1}},
  '2601F': {ent:{sku:'FC-10-F26F1-809-02-DD',y1:67132.15,y3:201396.45,y5:335660.75}, utp:{sku:'FC-10-F26F1-950-02-DD',y1:55285.3,y3:165855.9,y5:276426.5}, atp:{sku:'FC-10-F26F1-928-02-DD',y1:35540.55,y3:106621.65,y5:177702.75}, entBdl:{sku:'FG-2601F-BDL-809-DD',y1:160959.15,y3:295223.45,y5:429487.75}, utpBdl:{sku:'FG-2601F-BDL-950-DD',y1:149112.3,y3:259682.9,y5:370253.5}, care:{essential:null,premium:{sku:'FC-10-F26F1-247-02-DD',y1:15795.8,y3:47387.4,y5:78979},elite:{sku:'FC-10-F26F1-284-02-DD',y1:19744.75,y3:59234.25,y5:98723.75}}, converter:{sku:'FC-10-F26F1-189-02-DD',fee:3948.95}},
  '3001F': {ent:{sku:'FC-10-F3K1F-809-02-DD',y1:100728.4,y3:302185.2,y5:503642}, utp:{sku:'FC-10-F3K1F-950-02-DD',y1:82952.8,y3:248858.4,y5:414764}, atp:{sku:'FC-10-F3K1F-928-02-DD',y1:53326.8,y3:159980.4,y5:266634}, entBdl:{sku:'FG-3001F-BDL-809-DD',y1:237601.4,y3:439058.2,y5:640515}, utpBdl:{sku:'FG-3001F-BDL-950-DD',y1:219825.8,y3:385731.4,y5:551637}, care:{essential:null,premium:{sku:'FC-10-F3K1F-247-02-DD',y1:23700.8,y3:71102.4,y5:118504},elite:{sku:'FC-10-F3K1F-284-02-DD',y1:29626,y3:88878,y5:148130}}, converter:{sku:'FC-10-F3K1F-189-02-DD',fee:5000}},
  '3201F': {ent:{sku:'FC-10-F32F1-809-02-DD',y1:132600,y3:397800,y5:663000}, utp:{sku:'FC-10-F32F1-950-02-DD',y1:109200,y3:327600,y5:546000}, atp:{sku:'FC-10-F32F1-928-02-DD',y1:70200,y3:210600,y5:351000}, entBdl:{sku:'FG-3201F-BDL-809-DD',y1:312780,y3:577980,y5:843180}, utpBdl:{sku:'FG-3201F-BDL-950-DD',y1:289380,y3:507780,y5:726180}, care:{essential:null,premium:{sku:'FC-10-F32F1-247-02-DD',y1:31200,y3:93600,y5:156000},elite:{sku:'FC-10-F32F1-284-02-DD',y1:39000,y3:117000,y5:195000}}, converter:{sku:'FC-10-F32F1-189-02-DD',fee:5000}},
  '3501F': {ent:{sku:'FC-10-F35F1-809-02-DD',y1:214200,y3:642600,y5:1071000}, utp:{sku:'FC-10-F35F1-950-02-DD',y1:176400,y3:529200,y5:882000}, atp:{sku:'FC-10-F35F1-928-02-DD',y1:113400,y3:340200,y5:567000}, entBdl:{sku:'FG-3501F-BDL-809-DD',y1:505260,y3:933660,y5:1362060}, utpBdl:{sku:'FG-3501F-BDL-950-DD',y1:467460,y3:820260,y5:1173060}, care:{essential:null,premium:{sku:'FC-10-F35F1-247-02-DD',y1:50400,y3:151200,y5:252000},elite:{sku:'FC-10-F35F1-284-02-DD',y1:63000,y3:189000,y5:315000}}, converter:{sku:'FC-10-F35F1-189-02-DD',fee:5000}},
  '3701F': {ent:{sku:'FC-10-F37F1-809-02-DD',y1:239904,y3:719712,y5:1199520}, utp:{sku:'FC-10-F37F1-950-02-DD',y1:197568,y3:592704,y5:987840}, atp:{sku:'FC-10-F37F1-928-02-DD',y1:127008,y3:381024,y5:635040}, entBdl:{sku:'FG-3701F-BDL-809-DD',y1:550368,y3:1030176,y5:1509984}, utpBdl:{sku:'FG-3701F-BDL-950-DD',y1:508032,y3:903168,y5:1298304}, care:{essential:null,premium:{sku:'FC-10-F37F1-247-02-DD',y1:56448,y3:169344,y5:282240},elite:{sku:'FC-10-F37F1-284-02-DD',y1:70560,y3:211680,y5:352800}}, converter:{sku:'FC-10-F37F1-189-02-DD',fee:5000}},
  '4201F': {ent:{sku:'FC-10-F421F-809-02-DD',y1:229256.05,y3:687768.15,y5:1146280.25}, utp:{sku:'FC-10-F421F-950-02-DD',y1:188799.1,y3:566397.3,y5:943995.5}, atp:{sku:'FC-10-F421F-928-02-DD',y1:121370.85,y3:364112.55,y5:606854.25}, entBdl:{sku:'FG-4201F-BDL-809-DD',y1:561543.05,y3:1020055.15,y5:1478567.25}, utpBdl:{sku:'FG-4201F-BDL-950-DD',y1:521086.1,y3:898684.3,y5:1276282.5}, care:{essential:null,premium:{sku:'FC-10-F421F-247-02-DD',y1:53942.6,y3:161827.8,y5:269713},elite:{sku:'FC-10-F421F-284-02-DD',y1:67428.25,y3:202284.75,y5:337141.25}}, converter:{sku:'FC-10-F421F-189-02-DD',fee:5000}},
  '4401F': {ent:{sku:'FC-10-F441F-809-02-DD',y1:303960,y3:911880,y5:1519800}, utp:{sku:'FC-10-F441F-950-02-DD',y1:250320,y3:750960,y5:1251600}, atp:{sku:'FC-10-F441F-928-02-DD',y1:160920,y3:482760,y5:804600}, entBdl:{sku:'FG-4401F-BDL-809-DD',y1:728789,y3:1336709,y5:1944629}, utpBdl:{sku:'FG-4401F-BDL-950-DD',y1:675149,y3:1175789,y5:1676429}, care:{essential:null,premium:{sku:'FC-10-F441F-247-02-DD',y1:71520,y3:214560,y5:357600},elite:{sku:'FC-10-F441F-284-02-DD',y1:89400,y3:268200,y5:447000}}, converter:{sku:'FC-10-F441F-189-02-DD',fee:5000}},
  '4801F': {ent:{sku:'FC-10-F481F-809-02-DD',y1:353940,y3:1061820,y5:1769700}, utp:{sku:'FC-10-F481F-950-02-DD',y1:291480,y3:874440,y5:1457400}, atp:{sku:'FC-10-F481F-928-02-DD',y1:187380,y3:562140,y5:936900}, entBdl:{sku:'FG-4801F-BDL-809-DD',y1:811980,y3:1519860,y5:2227740}, utpBdl:{sku:'FG-4801F-BDL-950-DD',y1:749520,y3:1332480,y5:1915440}, care:{essential:null,premium:{sku:'FC-10-F481F-247-02-DD',y1:83280,y3:249840,y5:416400},elite:{sku:'FC-10-F481F-284-02-DD',y1:104100,y3:312300,y5:520500}}, converter:{sku:'FC-10-F481F-189-02-DD',fee:5000}},
};

// Datasheet PDF oficial: Fortinet publica un único "Product Matrix" que cubre todos los modelos F/G vigentes
// (mismo documento ya usado como fuente de specs en este archivo) — no hay un PDF dedicado por modelo/serie
// individual como en Cisco/Huawei, así que se usa como referencia universal para toda la línea FortiGate.
const DATASHEET_URL = 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/Fortinet_Product_Matrix.pdf';

const bareId=id=>id.replace('FortiGate ','');
for (const m of MODELS) {
  m.hwSku=HW_SKU[bareId(m.id)]||null;
  m.lic=LICENSES[bareId(m.id)]||null;
  m.datasheetUrl=DATASHEET_URL;
}

// Bundles de protección FortiGuard reales y vigentes (sufijos de SKU -809/-950/-928 en el price list AMER).
// Los 3 ya incluyen FortiCare Premium. "Elite" no es un bundle de protección Fortinet — se reemplaza por
// ATP (Advanced Threat Protection), el nombre y alcance oficiales del tercer bundle.
// ── Procesadores de seguridad (ASIC) ─────────────────────────────────────────
// Verificado contra las páginas "fast path architecture" de la guía Hardware Acceleration
// de FortiOS (docs.fortinet.com) — el lugar donde Fortinet documenta qué silicio lleva cada
// equipo. Cada grupo indica su fuente. Los modelos que no aparecen en esa guía se dejan
// explícitamente sin dato en lugar de inferirlos por nomenclatura.
//
// POR QUÉ IMPORTA PARA DIMENSIONAR: el procesador de red (NP) descarga la sesión completa
// —firewall, NAT, IPsec— sin que toque la CPU, y de ahí salen las cifras de Firewall
// Throughput e IPsec VPN del datasheet. En cuanto se aplica cualquier perfil de inspección,
// la sesión abandona el fast path y pasa a CPU con asistencia del content processor (CP),
// que acelera el pattern matching de IPS y antivirus. Esa transición es exactamente el salto
// de un orden de magnitud entre `fw` y `tp`.
//
// SP5/SoC5 y SoC4 son system-on-chip: integran CPU + NP + CP y el switch fabric en un solo
// chip, lo que permite descargar tráfico entre cualquier par de puertos frontales.
const ASIC_GROUPS = [
  { asic: 'SP5 — SoC5 (CPU + NP7Lite + CP10)', np: 'NP7Lite', cp: 'CP10', soc: true,
    src: 'docs.fortinet.com · fast path architecture de cada modelo',
    models: ['50G','51G','70G','71G','90G','91G','120G','121G','200G','201G'] },

  // El 30G/31G es de la serie G pero NO lleva el SP5: su datasheet trae una sección
  // "Secure SD-WAN ASIC SP4" y la tabla de hardware de FG-30G/31G y FWF-30G/31G dice SoC4.
  // Es el caso que justifica verificar en vez de deducir por nomenclatura: asumir
  // "serie G = SP5" habría puesto el silicio equivocado en el modelo de entrada.
  { asic: 'SP4 — SoC4 (CPU + NP6XLite + CP9XLite)', np: 'NP6XLite', cp: 'CP9XLite', soc: true,
    src: 'fortinet.com · datasheet FortiGate/FortiWiFi 30G Series (tabla de hardware)',
    models: ['30G','31G'] },

  { asic: 'SoC4 (CPU + NP6XLite + CP9XLite)', np: 'NP6XLite', cp: 'CP9XLite', soc: true,
    src: 'docs.fortinet.com · fast path architecture de 40F y 60F/61F',
    models: ['40F','60F','61F'] },

  { asic: 'NP6XLite', np: 'NP6XLite', cp: null, soc: false,
    src: 'docs.fortinet.com · índice "NP6XLite architectures" (familia verificada; empaquetado SoC no confirmado por modelo)',
    models: ['70F','71F','80F','81F','100F','200F'] },

  { asic: '1x NP7 + 1x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (NP7 de 200 Gbps)',
    models: ['400G','401G','700G','701G'] },

  { asic: '1x NP7', np: 'NP7', cp: null, soc: false,
    src: 'docs.fortinet.com · fast path architecture (NP7 de 200 Gbps; CP no indicado en la página)',
    models: ['900G','901G'] },

  { asic: '2x NP7 + 6x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (400 Gbps de NP)',
    models: ['3000G','3001G'] },

  { asic: '3x NP7 + 8x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (600 Gbps de NP)',
    models: ['3500G','3501G'] },

  { asic: '4x NP7 + 12x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (800 Gbps de NP)',
    models: ['3800G','3801G'] },

  { asic: 'NP7', np: 'NP7', cp: null, soc: false,
    src: 'docs.fortinet.com · índice "NP7 architectures" (familia verificada; cantidad de NP/CP no abierta por modelo)',
    models: ['400F','401F','600F','1000F','1001F','1800F','1801F','2600F','2601F',
             '3000F','3001F','3200F','3201F','3500F','3501F','3700F','3701F',
             '4200F','4201F','4400F','4401F','4800F','4801F','7081F','7121F'] },
];

// Los 58 modelos del catálogo tienen ASIC verificado contra fuente oficial. Si en el futuro
// se agrega un modelo sin página de fast path ni tabla de hardware publicada, quedará sin
// dato y la UI lo mostrará como no documentado en vez de inferirlo por nomenclatura.
const ASIC_BY_MODEL = {};
for (const g of ASIC_GROUPS) {
  for (const m of g.models) {
    ASIC_BY_MODEL[m] = { asic: g.asic, np: g.np, cp: g.cp, soc: g.soc, asicSrc: g.src };
  }
}
for (const m of MODELS) {
  const a = ASIC_BY_MODEL[m.id.replace('FortiGate ', '')];
  if (a) Object.assign(m, a);
}

const BUNDLES={
  utp:  {n:'UTP — Unified Threat Protection', svcs:'IPS, Advanced Malware Protection, Application Control, URL/DNS/Video Filtering, Antispam Service, FortiCare Premium'},
  ent:  {n:'Enterprise Protection',           svcs:'IPS, DLP, AMP, Antispam, AI-Based Malware Prevention, Application Control, URL/DNS/Video Filtering, FortiConverter, IoT Security, Security Rating, FortiCare Premium'},
  atp:  {n:'ATP — Advanced Threat Protection', svcs:'IPS, Advanced Malware Protection Service, Application Control, FortiCare Premium'},
};

// Niveles de soporte FortiCare tal como aparecen en el price list AMER (SKUs -314/-247/-284 por modelo, ver LICENSES).
// Essential no incluye TAC 24x7 ni reemplazo de hardware — confirmar alcance exacto y SLA de RMA con Fortinet,
// ya que el price list solo trae SKU y precio, no el texto de nivel de servicio completo.
const CARE={
  fc247:  {n:'FortiCare Essential',  sla:'Actualizaciones de firmware y portal self-service — sin TAC 24x7 ni reemplazo de hardware'},
  fcpre:  {n:'FortiCare Premium',    sla:'TAC 24x7, reemplazo avanzado de hardware (NBD), firmware y upgrades generales'},
  fcelite:{n:'FortiCare Elite',      sla:'FortiCare Premium + atención de tickets con prioridad Elite'},
};

module.exports = { MODELS, BUNDLES, CARE, LICENSES, HW_SKU };
