// LA GUIA DE DISENO: que equipo se recomienda en cada rol de cada topologia.
//
// Se transcribio de guia-diseno-interactiva.html (const EQ, lineas 129-201) en la migracion, y
// desde el 2026-10-02 este archivo solo guarda lo que la guia no puede sacar del catalogo:
//
//   - Un equipo que esta en el catalogo (cotizador, portal o dimensionador) se pinta con SU
//     texto comercial y SU precio. Por eso esas entradas no llevan `spec` ni `elp`: eran copias
//     que nadie veia y que ya decian otra cosa —el Catalyst 8300-2N2S-6T con 10 Gbps de
//     forwarding frente a los 5 de su ficha, el FortiGate 400F a 7.500 frente a los 17.570 de la
//     lista firmada— y que se habrian vuelto a pintar el dia que el equipo saliera del catalogo.
//     Ahora ese dia la entrada sale en blanco y `test/servidor-produccion.test.js` lo frena.
//   - Un equipo que SOLO vive aqui (QFX, CloudEngine, USG6000E y los controladores SD-WAN) lleva
//     su texto, que ninguna pantalla puede contrastar: la guia lo marca y `npm run catalogo` lo
//     lista. Su precio es «Consultar», porque ninguno tenia documento detras.
//   - La alternativa (`alt`) se contrasta: si nombra un equipo del catalogo, su cifra tiene que
//     coincidir con la del dimensionador —si no, la guia la pinta «en revision»— y si ese equipo
//     esta fuera de venta no se pinta (`cifrasCotizador.proyectarGuia`).
//   - El color es el del fabricante en la base; aqui no se guarda.
//
// SUSTITUCIONES DEL 2026-10-02. Cuando un equipo recomendado sale de venta, la guia lo retira sola
// (la regla de `ficha.js`); lo que no puede hacer sola es elegir el sustituto, que es una decision
// de diseno. Las cinco que dejaron un rol sin fabricante se resolvieron con datos del catalogo, sin
// afirmar una sucesion oficial que ningun documento del repositorio respalda:
//   - EC-XL -> EC-10150: es el `sucesor` que `aruba.js` declara POR CAPACIDAD, marcado como
//     inferencia porque la politica de ciclo de vida de HPE no nombra reemplazo. Su alternativa
//     es el EC-M y no el EC-L, que arrastra senales de fin de venta sin confirmar (pendiente 16).
//   - SRX 1500 -> SRX1600 y SRX 4100 -> SRX2300: la generacion 2024 que Juniper posiciona en su
//     lugar (anuncio citado en `indexPR.js`); el SRX2300 es el de firewall mas parecido al 4100
//     (39 frente a 40 Gbps).
//   - FortiGate 100F -> 90G y 600F -> 400G: el modelo vigente del MISMO segmento en el catalogo
//     («Sucursal med» y «Campus / DC edge»); el 400G es ademas el de NGFW mas cercano (14 frente
//     a 11,5 Gbps).
//   - Las alternativas que nombraban el ASR 1006-X (fin de venta el 31-jul-2026) pasan al Cisco
//     Secure Router C8455-G2, la generacion G2 que los boletines de la serie 8000 dan como sucesora.
module.exports = {
  hub_router: [
    { v: 'Huawei', model: 'NetEngine AR8700-10', alt: 'AR6300 (5 Gbps)' },
    { v: 'Cisco', model: 'Catalyst 8300-2N2S-6T', alt: 'Catalyst 8500-12X4QC (96 Gbps FWD)' },
    { v: 'Fortinet', model: 'FortiGate 400F', alt: 'FortiGate 400G (164 Gbps FW)' },
    { v: 'Juniper', model: 'SRX1600', alt: 'SRX2300 (39 Gbps FW)' },
    { v: 'Aruba', model: 'EC-10150', alt: 'EC-M (5 Gbps WAN) si el hub no pasa de esa cifra' },
  ],
  branch_router: [
    { v: 'Huawei', model: 'NetEngine AR5710-S8T2XE', alt: 'AR5710-S8T2X (1.3 Gbps)' },
    { v: 'Cisco', model: 'Catalyst 8200', alt: 'Catalyst 8200L (500 Mbps FWD)' },
    { v: 'Fortinet', model: 'FortiGate 90G', alt: 'FortiGate 120G (39 Gbps FW)' },
    { v: 'Juniper', model: 'SRX 345', alt: 'SRX 320 (1.9 Gbps FW)' },
    { v: 'Aruba', model: 'EC-M', alt: 'Gateway 9012 si la sucursal necesita LAN/WLAN integrados' },
    { v: 'MikroTik', model: 'RB5009UG+S+IN', alt: 'RB4011iGS+ (5.6 Gbps) o RB5009UPr+ con PoE-out' },
  ],
  branch_small: [
    { v: 'Huawei', model: 'NetEngine AR5710-S8T2X', alt: 'AR651W-8P (2 Gbps FWD)' },
    { v: 'Cisco', model: 'Catalyst 8200L', alt: 'ISR 1111-8P (300 Mbps)' },
    { v: 'Fortinet', model: 'FortiGate 60F', alt: 'FortiGate 80F' },
    { v: 'Juniper', model: 'SRX 320', alt: 'SRX 345 (5 Gbps)' },
    { v: 'MikroTik', model: 'hEX RB750Gr3', alt: 'L009UiGS-2HaxD (2 Gbps + Wi-Fi 6)' },
  ],
  core_router: [
    { v: 'Huawei', model: 'NetEngine NE8000 M8', alt: 'NE8000 M14 (7.2 Tbps)' },
    { v: 'Nokia', model: '7750 SR-7s', alt: '7750 SR-14s (216 Tbps)' },
    { v: 'Juniper', model: 'MX480', alt: 'MX960 (19.2 Tbps)' },
    { v: 'Cisco', model: 'Catalyst 8500-12X4QC', alt: 'Cisco Secure Router C8455-G2 (67 Gbps FWD)' },
  ],
  pe_router: [
    { v: 'Huawei', model: 'NetEngine A821 E', alt: 'NE8000 M6 (320 Gbps)' },
    { v: 'Nokia', model: '7750 SR-1s', alt: '7750 SR-2s (9.6 Tbps)' },
    { v: 'Juniper', model: 'MX204', alt: 'MX304 (4.8 Tbps)' },
    { v: 'Cisco', model: 'Catalyst 8500-12X4QC', alt: 'Cisco Secure Router C8455-G2 (67 Gbps FWD)' },
  ],
  dc_switch_leaf: [
    { v: 'Nokia', model: '7250 IXR-6e', alt: '7250 IXR-10e (12.8 Tbps)' },
    { v: 'Juniper', model: 'QFX 5100-48S-6Q', spec: '1.44 Tbps · 48x10GE + 6x40GE · EVPN, VXLAN', alt: 'QFX 5120-32C (12.8 Tbps)', elp: 'Consultar' },
    { v: 'Huawei', model: 'CloudEngine 6870', spec: '12.8 Tbps · 48x100GE + 6x400GE · EVPN-VXLAN, MPLS', alt: 'CE8850 (6.4 Tbps)', elp: 'Consultar' },
  ],
  dc_switch_spine: [
    { v: 'Nokia', model: '7250 IXR-10e', alt: '7250 IXR-6e (6.4 Tbps)' },
    { v: 'Juniper', model: 'QFX 10002-36Q', spec: '4 Tbps · 36x40GE o 9x100GE · spine no bloqueante', alt: 'QFX 10008 (160 Tbps)', elp: 'Consultar' },
    { v: 'Huawei', model: 'CloudEngine 9860', spec: '48 Tbps · 48x400GE · EVPN-VXLAN, CloudFabric DC', alt: 'CE9800 (19.2 Tbps)', elp: 'Consultar' },
  ],
  fw_ngfw: [
    { v: 'Fortinet', model: 'FortiGate 400G', alt: 'FortiGate 700G (29 Gbps NGFW)' },
    { v: 'Cisco', model: 'Catalyst 8300-1N1S-6T', alt: 'Catalyst 8500 para mayor throughput' },
    { v: 'Juniper', model: 'SRX2300', alt: 'SRX4300 (98 Gbps FW)' },
    { v: 'Huawei', model: 'USG6000E', spec: 'NGFW serie USG · inspección SSL, IPS, anti-APT', alt: 'Verificar serie activa en Huawei.com', elp: 'Consultar' },
  ],
  aggregation: [
    { v: 'Huawei', model: 'NetEngine NE8000 M4', alt: 'NE8000 M6 (320 Gbps compacto)' },
    { v: 'Nokia', model: '7750 SR-2s', alt: '7750 SR-1s (4.8 Tbps)' },
    { v: 'Juniper', model: 'MX304', alt: 'MX480 (7.7 Tbps)' },
    { v: 'MikroTik', model: 'CCR2216-1G-12XS-2XQ', alt: 'CCR2004-1G-12S+2XS (12 Gbps, 12x SFP+)' },
  ],
  internet_gw: [
    { v: 'Cisco', model: 'Catalyst 8500-12X4QC', alt: 'Cisco Secure Router C8455-G2 (67 Gbps FWD)' },
    { v: 'Nokia', model: '7750 SR-1s', alt: '7750 SR-2s (9.6 Tbps)' },
    { v: 'Juniper', model: 'MX204', alt: 'MX304 (4.8 Tbps)' },
    { v: 'Huawei', model: 'NetEngine NE8000 F1A', alt: 'NE8000 M4 (2.4 Tbps modular)' },
    { v: 'MikroTik', model: 'CCR2116-12G-4S+', alt: 'CCR2004-16G-2S+ (12 Gbps) para caudales menores' },
  ],
  sdwan_controller: [
    { v: 'Huawei', model: 'iMaster NCE (VM/Appliance)', spec: 'Orquestador SD-WAN · gestión centralizada · APIs abiertas · intent-based', alt: 'NCE-WAN Enterprise Edition', elp: 'Licencia por nodo' },
    { v: 'Cisco', model: 'Cisco vManage (SD-WAN)', spec: 'Controlador SD-WAN Viptela nativo en Catalyst 8000 · cloud o on-prem', alt: 'Cisco Umbrella SASE (cloud)', elp: 'Licencia DNA Advantage' },
    { v: 'Fortinet', model: 'FortiManager', spec: 'Orquestador SD-WAN y NGFW · gestión centralizada de políticas · VM o appliance', alt: 'FortiSASE cloud', elp: 'Licencia por dispositivo' },
    { v: 'Juniper', model: 'Mist AI (Session Smart)', spec: 'SD-WAN basado en AI · session smart router · 5G ready', alt: 'Apstra para intent-based DC', elp: 'Suscripción cloud' },
    { v: 'Aruba', model: 'EdgeConnect Orchestrator', spec: 'Orquestador del fabric · Business Intent Overlays · ZTP · reparte el pool de Boost entre sedes', alt: 'Aruba Central para la serie 9000 SD-Branch', elp: 'Sin licencia por dispositivo gestionado' },
  ],
};
