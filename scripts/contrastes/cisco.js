'use strict';
/* CASO: el dimensionador Cisco reparte el tráfico entre el overlay y la salida local, y mide
 * cada parte con la cifra de su capa (rediseño del 2026-10-20).
 *
 * DE DONDE SALE. El dueño trajo una herramienta externa de Cisco y pidió actualizar este
 * dimensionador con ella. Lo que entró es su método, corregido (ver la cabecera de
 * `public/js/cisco-motor.js`): la salida local a Internet entra en la cuenta en su propia capa
 * (reenvío, Threat Protection o IPsec hacia un SSE), las dos fracciones se suman, el descifrado
 * TLS en el router no se deriva de otra cifra y los requisitos de hardware apartan con su
 * motivo. Las pruebas del motor lo fijan en Node; este caso fija lo que DECIDE LA PANTALLA,
 * conducida por sus controles, para que un refactor de la página no lo cambie en silencio.
 *
 * Cada fila dice qué controla:
 *   · 800 Mbps por sentido en SD-WAN: 2.080 Mbps con el margen. El C8211-G2 hace 2.000 y se
 *     aparta por utilización (104 %); entra el primero de 4 Gbps.
 *   · 500 Mbps con el 30 % a Internet inspeccionado en el equipo: 910 Mbps de SD-WAN contra
 *     2 Gbps y 390 de Threat Protection contra 1 Gbps suman el 85 % del C8211-G2. Con la
 *     salida local en la etiqueta y no en la cuenta (el fallo del adjunto) daba otro equipo.
 *   · Lo mismo con descifrado TLS: ninguna ficha lo publica, así que no hay candidato.
 *   · Meraki con 100 dispositivos: el MX67/68 recomiendan 50 y se apartan. Cumplen 10 desde el
 *     cierre de pendientes del 2026-10-20 (eran 8): entran el C8355-G2-MX y el C8455-G2-MX.
 *   · Hub de 20 Gbps: 52 Gbps de SD-WAN; solo el C8650-G2 y el Catalyst 8500-20X6C llegan (este,
 *     con su fin de venta anunciado: recomendable hasta el 31-jul-2027).
 *   · Doble fuente, celular y 2.000 túneles: el más pequeño que confirma los tres es un
 *     Catalyst 8300 con su fin de venta anunciado, que sigue siendo recomendable hasta su fecha.
 *   · Sucursal de 100 Mbps en una malla de 200 sedes con dos transportes (2026-10-21, túneles por
 *     topología): 199 × 4 + 1 × 4 = 800 túneles. Los cinco C81xx-G2 publican 250 y se apartan:
 *     cumplen 25 de los 30 que cumplen sin topología.
 *   · La misma sucursal con dos enlaces entregados en fibra de 10G (2026-10-21, enlaces a puertos
 *     reales): los modelos sin jaula de 10G libre ni ranura para un módulo se apartan; el 8200L
 *     sigue, con un C-NIM-4X de su guía de pedido para los dos enlaces. Cumplían 22; desde el
 *     cierre de pendientes del mismo día cumplen 23: el módulo propuesto es el que lleva más
 *     enlaces, y el 8300-1N1S-6T entra con un C-NIM-4X donde antes pedía dos C-NIM-1X y no tenía
 *     segunda ranura NIM.
 *   · Un ISR de 50 Mbps con su enlace entregado por DSL (2026-10-21, cierre de los pendientes de
 *     puertos): solo el ISR 1116-4P tiene puerto DSL (ficha del ISR 1000, tabla 20); los otros
 *     cuatro ISR se apartan. Sin el enlace cumplían los cinco.
 *   · Una sede de 200 Mbps con optimización TCP (DRE) para 3.000 conexiones (2026-10-21, propuesta
 *     2.3): cumplen 15 de 30, los que la guía de AppQoE da como nodo con un perfil que llega o como
 *     controlador de servicio; el 8200 (perfil S, 750 conexiones) y los que no constan se apartan.
 *   · Una sede de 100 Mbps en SD-WAN con su enlace por DSL (2026-10-26, variantes de la 8100): solo
 *     las cuatro con DSL integrado (C8130-VAI/VAP-G2 y C8151-CVAI/CVAP-G2, tablas 10 y 15 de su
 *     ficha) lo reciben; las demás no tienen puerto DSL y los NIM DSL están fuera de venta. Hasta
 *     ese día ningún equipo de IOS XE SD-WAN lo recibía. 260 Mbps de SD-WAN contra 900: 29 %.
 *     Las seis variantes no cambian las demás filas.
 *   · La misma sede con su enlace por XGS-PON (2026-10-27): solo la jaula XGSPON/10GBASE-T de esas
 *     cuatro admite la ONT SFP-10G-ONT20-I (guía de hardware de la serie 8100, tabla 10); las demás
 *     se apartan. Hasta ese día un enlace PON no se podía declarar.
 */
const BASE_LINEA = [
  { n: 'Sede 800 Mbps por sentido, SD-WAN', esc: { bw: '800' },
    recomendado: 'Cisco Secure Router C8221-G2', utilizacion: '52 %', cumplen: '20' },
  { n: 'Sede 500 Mbps, 30 % a Internet inspeccionado en el router', esc: { bw: '500', dia: '30', seguridad: 'onbox' },
    recomendado: 'Cisco Secure Router C8211-G2', utilizacion: '85 %', cumplen: '17' },
  { n: 'La misma sede con descifrado TLS en el router', esc: { bw: '500', dia: '30', seguridad: 'onbox', tls: true },
    recomendado: '(sin candidato)', utilizacion: '(sin fila)', cumplen: '0' },
  { n: 'Meraki 300 Mbps con 100 dispositivos', esc: { bw: '300', plataforma: 'meraki', dispositivos: '100' },
    recomendado: 'Meraki MX75', utilizacion: '78 %', cumplen: '10' },
  { n: 'Hub de datacenter, 20 Gbps', esc: { bw: '20', unit: '1000', modo: 'hub' },
    recomendado: 'Cisco Secure Router C8650-G2', utilizacion: '65 %', cumplen: '2' },
  { n: 'Doble fuente, celular y 2.000 túneles', esc: { bw: '500', dual: true, celular: true, tuneles: '2000' },
    recomendado: 'Catalyst 8300-1N1S-6T', utilizacion: '76 %', cumplen: '7' },
  { n: 'Sucursal de 100 Mbps en malla de 200 sedes con dos transportes', esc: { bw: '100', topologia: 'malla', topoSedes: '200', topoColores: '2' },
    recomendado: 'Catalyst 8200L', utilizacion: '87 %', cumplen: '25' },
  { n: 'Sucursal de 100 Mbps con dos enlaces en fibra de 10G', esc: { bw: '100', enlaces: ['fibra-10g', 'fibra-10g'] },
    recomendado: 'Catalyst 8200L', utilizacion: '87 %', cumplen: '23' },
  { n: 'ISR de 50 Mbps con su enlace por DSL', esc: { bw: '50', plataforma: 'isr', enlaces: ['dsl'] },
    recomendado: 'ISR 1116-4P', utilizacion: '65 %', cumplen: '1' },
  { n: 'Sede de 200 Mbps con DRE para 3.000 conexiones', esc: { bw: '200', appqoe: '3000' },
    recomendado: 'Catalyst 8300-1N1S-6T', utilizacion: '31 %', cumplen: '15' },
  { n: 'Sede de 100 Mbps en SD-WAN con su enlace por DSL', esc: { bw: '100', enlaces: ['dsl'] },
    recomendado: 'Cisco Secure Router C8130-VAI-G2', utilizacion: '29 %', cumplen: '4' },
  { n: 'Sede de 100 Mbps en SD-WAN con su enlace por XGS-PON', esc: { bw: '100', enlaces: ['xgspon'] },
    recomendado: 'Cisco Secure Router C8130-VAI-G2', utilizacion: '29 %', cumplen: '4' },
];

module.exports = {
  medidoEn: { commit: 'cisco-rediseno-2026-10-20', fecha: '2026-10-20' },
  nombre: 'Cisco — overlay y salida local, cada uno con la cifra de su capa',
  pagina: 'dimensionador-cisco-catalyst8k.html',
  claves: ['recomendado', 'utilizacion', 'cumplen'],
  baseLinea: BASE_LINEA,

  async preparar(p, e, { pausa }) {
    const x = e.esc;
    await p.waitForSelector('#verdict');
    if (x.modo) await p.click(`#modeSeg button[data-v="${x.modo}"]`);
    if (x.plataforma) await p.selectOption('#plataforma', x.plataforma);
    if (x.unit) await p.selectOption('#unit', x.unit);
    if (x.dia) {
      await p.$eval('#diaPct', (el, v) => { el.value = v; }, x.dia);
      await p.dispatchEvent('#diaPct', 'input');
    }
    if (x.seguridad) await p.selectOption('#seguridad', x.seguridad);
    if (x.tls) await p.check('#chkTls');
    if (x.dual) await p.check('#chkRedund');
    if (x.celular) await p.check('#chk4g');
    if (x.tuneles) await p.fill('#tuneles', x.tuneles);
    if (x.dispositivos) await p.fill('#dispositivos', x.dispositivos);
    if (x.appqoe) {
      await p.check('#chkAppqoe');
      await p.fill('#appqoeCon', x.appqoe);
    }
    if (x.enlaces) {
      for (let i = 0; i < x.enlaces.length; i++) {
        await p.click('#btnAddEnlace');
        await p.selectOption(`.enlace-fila[data-i="${i}"] [data-k="entrega"]`, x.enlaces[i]);
      }
    }
    if (x.topologia) {
      await p.selectOption('#topologia', x.topologia);
      await p.fill('#topoSedes', x.topoSedes);
      if (x.topoColores) await p.fill('#topoColores', x.topoColores);
    }
    await p.fill('#bw', x.bw);
    await p.dispatchEvent('#bw', 'input');
    await pausa(p, 600);
  },

  async leer(p) {
    const recomendado = await p.$eval('#verdict-sel', (s) => s.value).catch(() => '(sin candidato)');
    const utilizacion = await p.$eval('#tbody tr.sel td:nth-child(4)', (td) => td.textContent.trim()).catch(() => '(sin fila)');
    const cumplen = await p.$eval('#apartados p b:nth-of-type(2)', (b) => b.textContent.trim()).catch(() => null);
    return { recomendado: recomendado || '(sin candidato)', utilizacion, cumplen };
  },
};
