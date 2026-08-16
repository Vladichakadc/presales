// Copiado tal cual de dimensionador-fortinet-fortigate.html (lineas 339-362)
const MODELS=[
  {id:'FortiGate 40F',  seg:'SOHO',        fw:5000,  ips:1000,  ngfw:800,  ssl:null, vpn:4400,  sess:700000,  ifaces:'5 GE'},
  {id:'FortiGate 60F',  seg:'Sucursal peq',fw:10000, ips:1400,  ngfw:1000, ssl:900,  vpn:6500,  sess:700000,  ifaces:'10 GE + Wi-Fi opcional'},
  {id:'FortiGate 80F',  seg:'Sucursal + PoE',fw:10000,ips:1400, ngfw:1000, ssl:900,  vpn:6500,  sess:700000,  ifaces:'8 GE + 2 SFP'},
  {id:'FortiGate 100F', seg:'Sucursal med', fw:20000, ips:2600,  ngfw:1600, ssl:1000, vpn:11500, sess:1500000, ifaces:'22 GE + 2x10GE SFP+'},
  {id:'FortiGate 200F', seg:'Sucursal gde', fw:27000, ips:4200,  ngfw:3000, ssl:2200, vpn:13000, sess:3000000, ifaces:'16 GE + 4x10GE + 4 SFP'},
  {id:'FortiGate 400F', seg:'Campus / Agr', fw:40000, ips:7200,  ngfw:5300, ssl:4200, vpn:32000, sess:4000000, ifaces:'8 GE + 8 SFP + 8x10GE'},
  {id:'FortiGate 600F', seg:'Campus / DC edge',fw:60000,ips:11000,ngfw:9000,ssl:6400,vpn:38000, sess:6000000, ifaces:'4x25GE + 16x10GE'},
  {id:'FortiGate 1000F',seg:'DC edge',      fw:198000,ips:26000, ngfw:19500,ssl:14000,vpn:55000, sess:14000000,ifaces:'4x100GE + 16x25GE + 16x10GE'},
  {id:'FortiGate 2000F',seg:'DC / Carrier', fw:310000,ips:45000, ngfw:30000,ssl:23000,vpn:100000,sess:20000000,ifaces:'6x100GE + 16x25GE'},
  {id:'FortiGate 3000F',seg:'Carrier grade',fw:600000,ips:62000, ngfw:50000,ssl:40000,vpn:190000,sess:30000000,ifaces:'4x400GE + 4x100GE + 16x25GE'},
  {id:'FortiGate 4400F',seg:'DC core',      fw:800000,ips:120000,ngfw:70000,ssl:55000,vpn:300000,sess:50000000,ifaces:'Chasis modular hasta 400GE'},
];

const BUNDLES={
  utp: {n:'UTP — Unified Threat Protection', svcs:'IPS, App Control, Web Filter, Antivirus, AntiSpam, FortiSandbox Cloud básico'},
  ent: {n:'ENT — Enterprise Bundle',         svcs:'UTP + SD-WAN, CASB, NOC, FortiConverter, FortiManager Cloud'},
  elite:{n:'Elite Bundle',                   svcs:'ENT + FortiSandbox Cloud Premium, FortiConverter completo, soporte extendido'},
};

const CARE={
  fc247: {n:'FortiCare 24x7',     sla:'24x7 / 4H RMA NBD'},
  fcpre: {n:'FortiCare Premium',  sla:'24x7 / 2H RMA 4H'},
  fcelite:{n:'FortiCare Elite',   sla:'24x7 / 15min RMA inmediato'},
};

module.exports = { MODELS, BUNDLES, CARE };
