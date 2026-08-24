// Copiado tal cual de guia-diseno-interactiva.html const EQ={...} (lineas 129-201)
module.exports = {
  hub_router: [
    {v:'Huawei',  color:'#C7000B', model:'NetEngine AR8700-10',  spec:'Forwarding 20 Gbps · IPsec 12 Gbps · 10 slots FIC/SIC', alt:'AR6300 (5 Gbps)', elp:'~ $42,000'},
    {v:'Cisco',   color:'#049FD9', model:'Catalyst 8300-2N2S-6T', spec:'Forwarding 10 Gbps · IPsec 4 Gbps · SD-WAN nativo', alt:'Catalyst 8500-12X4QC (20 Gbps)', elp:'~ $16,500'},
    {v:'Fortinet', color:'#EE3124',model:'FortiGate 400F',        spec:'FW 40 Gbps · NGFW 5.3 Gbps · SD-WAN integrado', alt:'FortiGate 600F (60 Gbps FW)', elp:'~ $7,500'},
    {v:'Juniper', color:'#84B135', model:'SRX 1500',              spec:'FW 9 Gbps · 16 GE + 4x10GE', alt:'SRX 4100 (40 Gbps)', elp:'~ $12,000'},
    {v:'Aruba',   color:'#01A982', model:'EC-XL',                  spec:'SD-WAN 5 Gbps · IPsec 5 Gbps · 2000 túneles de fabric · Boost hasta 1 Gbps', alt:'EC-2XL (10 Gbps, 4000 túneles)', elp:'Consultar'},
  ],
  branch_router: [
    {v:'Huawei',  color:'#C7000B', model:'NetEngine AR5710-S8T2XE', spec:'Forwarding 1.5 Gbps · IPsec 800 Mbps · SD-WAN 720 Mbps', alt:'AR5710-S8T2X (1.3 Gbps)', elp:'~ $4,200'},
    {v:'Cisco',   color:'#049FD9', model:'Catalyst 8200',          spec:'Forwarding 1.5 Gbps · IPsec 1 Gbps · SD-WAN nativo · 2 NIM', alt:'Catalyst 8200L (0.8 Gbps)', elp:'~ $4,500'},
    {v:'Fortinet', color:'#EE3124',model:'FortiGate 100F',         spec:'FW 20 Gbps · NGFW 1.6 Gbps · IPsec 11.5 Gbps', alt:'FortiGate 200F (27 Gbps FW)', elp:'~ $1,900'},
    {v:'Juniper', color:'#84B135', model:'SRX 345',                spec:'FW 5 Gbps · 16 GE + 4 MPIM · NGFW, SD-WAN, IPsec', alt:'SRX 320 (1 Gbps)', elp:'~ $3,500'},
    {v:'Aruba',   color:'#01A982', model:'EC-M',                    spec:'SD-WAN 1 Gbps · IPsec 1 Gbps · 500 túneles · Boost hasta 200 Mbps', alt:'Gateway 9012 si la sucursal necesita LAN/WLAN integrados', elp:'Consultar'},
  ],
  branch_small: [
    {v:'Huawei',  color:'#C7000B', model:'NetEngine AR5710-S8T2X', spec:'Forwarding 1.3 Gbps · IPsec 800 Mbps · SD-WAN 620 Mbps · 8 GE LAN', alt:'AR651W-8P (2 Gbps FWD)', elp:'~ $2,800'},
    {v:'Cisco',   color:'#049FD9', model:'Catalyst 8200L',         spec:'Forwarding 800 Mbps · IPsec 600 Mbps · 4 GE + 1 NIM', alt:'ISR 1111-8P (300 Mbps)', elp:'~ $2,200'},
    {v:'Fortinet', color:'#EE3124',model:'FortiGate 60F',          spec:'FW 10 Gbps · NGFW 1 Gbps · IPsec 6.5 Gbps · 10 GE', alt:'FortiGate 80F', elp:'~ $650'},
    {v:'Juniper', color:'#84B135', model:'SRX 320',                spec:'FW 1 Gbps · 8 GE · SD-WAN, UTM, branch routing', alt:'SRX 345 (5 Gbps)', elp:'~ $1,800'},
  ],
  core_router: [
    {v:'Huawei',  color:'#C7000B', model:'NetEngine NE8000 M8',    spec:'4.8 Tbps · 1086 Mpps · 8 tarjetas 400G', alt:'NE8000 M14 (7.2 Tbps)', elp:'~ $180,000'},
    {v:'Nokia',   color:'#124191', model:'7750 SR-7s',             spec:'19.2 Tbps · 7 slots IOM · SR-MPLS, SRv6, FlexE', alt:'7750 SR-14s (38.4 Tbps)', elp:'~ $220,000'},
    {v:'Juniper', color:'#84B135', model:'MX480',                  spec:'7.7 Tbps · 6 MPC slots · core IP, LSR, peering, BNG', alt:'MX960 (19.2 Tbps)', elp:'~ $95,000'},
    {v:'Cisco',   color:'#049FD9', model:'Catalyst 8500-12X4QC',   spec:'20 Gbps · 12x10GE + 4x40GE · hub DC / edge', alt:'ASR 1006-X (100 Gbps, hasta EoS Jul 2026)', elp:'~ $58,000'},
  ],
  pe_router: [
    {v:'Huawei',  color:'#C7000B', model:'NetEngine A821 E',       spec:'72 Gbps · 108 Mpps · 2x10GE + 8 GE ópticas + SRv6, slicing', alt:'NE8000 M6 (320 Gbps)', elp:'~ $18,000'},
    {v:'Nokia',   color:'#124191', model:'7750 SR-1s',             spec:'1.2 Tbps · 36x100GE o 12x400GE · SR-MPLS, SRv6, FlexE', alt:'7750 SR-2s (4 Tbps)', elp:'~ $85,000'},
    {v:'Juniper', color:'#84B135', model:'MX204',                  spec:'400 Gbps · 4x100GE · 1U · edge routing, peering, DCI', alt:'MX304 (4.8 Tbps)', elp:'~ $32,000'},
    {v:'Cisco',   color:'#049FD9', model:'Catalyst 8500-12X4QC',   spec:'20 Gbps · hub DC / PE compacto · SD-WAN', alt:'ASR 1006-X (100 Gbps)', elp:'~ $58,000'},
  ],
  dc_switch_leaf: [
    {v:'Arista',  color:'#4E5B6E', model:'7050X3-48YC12',         spec:'3.6 Tbps · 48x25GE + 12x100GE · latencia < 450 ns', alt:'7050X3-48YC8 (3.2 Tbps)', elp:'~ $28,000'},
    {v:'Nokia',   color:'#124191', model:'7250 IXR-6e',           spec:'6.4 Tbps · 36x100GE o 12x400GE · SR Linux, EVPN-VXLAN', alt:'7250 IXR-10e (12.8 Tbps)', elp:'~ $48,000'},
    {v:'Juniper', color:'#84B135', model:'QFX 5100-48S-6Q',       spec:'1.44 Tbps · 48x10GE + 6x40GE · EVPN, VXLAN', alt:'QFX 5120-32C (12.8 Tbps)', elp:'~ $22,000'},
    {v:'Huawei',  color:'#C7000B', model:'CloudEngine 6870',      spec:'12.8 Tbps · 48x100GE + 6x400GE · EVPN-VXLAN, MPLS', alt:'CE8850 (6.4 Tbps)', elp:'~ $35,000'},
  ],
  dc_switch_spine: [
    {v:'Arista',  color:'#4E5B6E', model:'7500R3-36CQ',           spec:'57.6 Tbps · 36x400GE por chasis · < 4 µs', alt:'7500R3-72CQ (115 Tbps)', elp:'~ $180,000'},
    {v:'Nokia',   color:'#124191', model:'7250 IXR-10e',          spec:'12.8 Tbps · 36x400GE · SR Linux, EVPN-VXLAN, spine', alt:'7250 IXR-6e (6.4 Tbps)', elp:'~ $85,000'},
    {v:'Juniper', color:'#84B135', model:'QFX 10002-36Q',         spec:'4 Tbps · 36x40GE o 9x100GE · spine no bloqueante', alt:'QFX 10008 (160 Tbps)', elp:'~ $55,000'},
    {v:'Huawei',  color:'#C7000B', model:'CloudEngine 9860',      spec:'48 Tbps · 48x400GE · EVPN-VXLAN, CloudFabric DC', alt:'CE9800 (19.2 Tbps)', elp:'~ $95,000'},
  ],
  fw_ngfw: [
    {v:'Fortinet', color:'#EE3124',model:'FortiGate 600F',         spec:'FW 60 Gbps · NGFW 9 Gbps · SSL 6.4 Gbps · IPsec 38 Gbps', alt:'FortiGate 400F (40 Gbps FW)', elp:'~ $14,000'},
    {v:'Cisco',   color:'#049FD9', model:'Catalyst 8300-1N1S-6T', spec:'FW (ZBF) + SD-WAN nativo · 5 Gbps FWD · 2.5 Gbps IPsec', alt:'Catalyst 8500 para mayor throughput', elp:'~ $9,800'},
    {v:'Juniper', color:'#84B135', model:'SRX 4100',              spec:'FW 40 Gbps · 8x10GE + 2x40GE · NGFW, IPsec concentrador', alt:'SRX 4200 (80 Gbps)', elp:'~ $28,000'},
    {v:'Huawei',  color:'#C7000B', model:'USG6000E',              spec:'NGFW serie USG · inspección SSL, IPS, anti-APT', alt:'Verificar serie activa en Huawei.com', elp:'Consultar'},
  ],
  aggregation: [
    {v:'Huawei',  color:'#C7000B', model:'NetEngine NE8000 M4',   spec:'2.4 Tbps · 405 Mpps · 4 tarjetas 400G · 2U', alt:'NE8000 M6 (320 Gbps compacto)', elp:'~ $95,000'},
    {v:'Nokia',   color:'#124191', model:'7750 SR-2s',            spec:'4 Tbps · 144x100GE o 36x400GE · SR-MPLS, SRv6, EVPN', alt:'7750 SR-1s (1.2 Tbps)', elp:'~ $140,000'},
    {v:'Arista',  color:'#4E5B6E', model:'7280R3-48C6',           spec:'4.8 Tbps · 48x100GE + 6x400GE · edge, agregación', alt:'7280R3-96S2C (6.4 Tbps)', elp:'~ $75,000'},
    {v:'Juniper', color:'#84B135', model:'MX304',                 spec:'4.8 Tbps · MPC slots · 100/400GE · MPLS PE, broadband, 5G', alt:'MX480 (7.7 Tbps)', elp:'~ $65,000'},
  ],
  internet_gw: [
    {v:'Cisco',   color:'#049FD9', model:'Catalyst 8500-12X4QC',  spec:'20 Gbps · 12x10GE + 4x40GE · Internet Gateway / Peering', alt:'ASR 1006-X (100 Gbps, disponible hasta Jul 2026)', elp:'~ $58,000'},
    {v:'Nokia',   color:'#124191', model:'7750 SR-1s',            spec:'1.2 Tbps · 36x100GE · border routing, BNG, peering', alt:'7750 SR-2s (4 Tbps)', elp:'~ $85,000'},
    {v:'Juniper', color:'#84B135', model:'MX204',                 spec:'400 Gbps · 4x100GE · 1U · edge, peering, internet GW', alt:'MX304 (4.8 Tbps)', elp:'~ $32,000'},
    {v:'Huawei',  color:'#C7000B', model:'NetEngine NE8000 F1A',  spec:'2.4 Tbps · 1U · alta densidad · 1200 G/U', alt:'NE8000 M4 (2.4 Tbps modular)', elp:'~ $80,000'},
  ],
  sdwan_controller: [
    {v:'Huawei',  color:'#C7000B', model:'iMaster NCE (VM/Appliance)', spec:'Orquestador SD-WAN · gestión centralizada · APIs abiertas · intent-based', alt:'NCE-WAN Enterprise Edition', elp:'Licencia por nodo'},
    {v:'Cisco',   color:'#049FD9', model:'Cisco vManage (SD-WAN)',     spec:'Controlador SD-WAN Viptela nativo en Catalyst 8000 · cloud o on-prem', alt:'Cisco Umbrella SASE (cloud)', elp:'Licencia DNA Advantage'},
    {v:'Fortinet', color:'#EE3124',model:'FortiManager',               spec:'Orquestador SD-WAN y NGFW · gestión centralizada de políticas · VM o appliance', alt:'FortiSASE cloud', elp:'Licencia por dispositivo'},
    {v:'Juniper', color:'#84B135', model:'Mist AI (Session Smart)',    spec:'SD-WAN basado en AI · session smart router · 5G ready', alt:'Apstra para intent-based DC', elp:'Suscripción cloud'},
    {v:'Aruba',   color:'#01A982', model:'EdgeConnect Orchestrator',   spec:'Orquestador del fabric · Business Intent Overlays · ZTP · reparte el pool de Boost entre sedes', alt:'Aruba Central para la serie 9000 SD-Branch', elp:'Sin licencia por dispositivo gestionado'},
  ],
};
