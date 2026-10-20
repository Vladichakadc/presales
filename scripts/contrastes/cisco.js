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
