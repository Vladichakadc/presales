'use strict';
/* CASO: los limites de configuracion del Product Matrix se COMPRUEBAN, no se declaran.
 *
 * DE DONDE SALE. Hasta el 2026-09-23 esta pantalla pedia el conteo de tuneles y los usuarios
 * de acceso remoto, y a continuacion decia en pantalla que el tope por modelo «no esta en
 * este catalogo». Un control que no se puede contrastar es peor que su ausencia, porque
 * invita a creer que se tuvo en cuenta — asi lo dejaba escrito el pendiente F4. La edicion de
 * septiembre del Product Matrix publica las cifras, entraron al catalogo con doble anclaje y
 * el motor las trata como ejes duros.
 *
 * ES UN CAMBIO DE DECISION DELIBERADO, MEDIDO EL DIA QUE SE HIZO, como `fortinet-ssl.js` y a
 * diferencia de `fortinet.js` -que fija que un refactor NO movio nada-. Los dos hacen falta.
 *
 * LOS CUATRO PARES SON EL CASO: cada escenario va con su control, el mismo diseno una unidad
 * por debajo del tope. Un solo escenario «no cabe» no distingue «el eje funciona» de «el
 * motor se rompio y no pasa nadie»; el par si, porque el control tiene que seguir pasando.
 *
 * Y EL TECHO DE UTILIZACION NO SE APLICA A UN TOPE DE PLATAFORMA. El ultimo par lo fija: 180
 * tuneles sobre 200 publicados caben aunque el techo declarado sea del 70 %, porque `techoUtil`
 * es una politica sobre CIFRAS DE LABORATORIO y un maximo de tuneles no lo es. Si alguien
 * «unificara» el trato de los ejes, ese par salta y ningun otro lo haria.
 */
const BASE_LINEA = [
  // AISLAR EL EJE ES TODO EL DISENO DE ESTE CASO. En rol `hub` el numero de spokes alimenta
  // DOS cosas -el caudal agregado del concentrador y el conteo de tuneles-, asi que subirlo
  // sin mas no prueba nada: la lista se acortaria igual por caudal. Con 1 Mbps por spoke el
  // agregado se queda en 86 y 118 Mbps -trivial para cualquier modelo del catalogo, que
  // empieza en 500 Mbps de Threat Protection- y lo unico que puede mover la recomendacion es
  // el tope de tuneles. No es un escenario de laboratorio: un hub que concentra sedes de muy
  // poco trafico (retail, IoT, cajeros) es exactamente donde el conteo aprieta y el caudal no.
  { n: 'hub con 190 spokes de 1 Mbps — cabe en los 200 tuneles del 30G', rol: 'hub', sites: 190, bw: 1,
    techo: '100', recomendado: 'FortiGate 30G', nCandidatos: 51 },
  { n: 'hub con 260 spokes de 1 Mbps — el tope de 200 tuneles lo saca', rol: 'hub', sites: 260, bw: 1,
    techo: '100', recomendado: 'FortiGate 120G', nCandidatos: 36 },
  // EL TECHO DE UTILIZACION NO RECORTA UN TOPE DE PLATAFORMA. Mismo escenario que el primero
  // con el techo al 70 %: 190 de 200 tuneles es el 95 %, asi que un techo aplicado a ciegas
  // lo habria sacado. Sigue entrando, y el resultado es identico al del 100 %.
  { n: 'hub con 190 spokes y techo del 70 % — el tope no se recorta', rol: 'hub', sites: 190, bw: 1,
    techo: '70', recomendado: 'FortiGate 30G', nCandidatos: 51 },
  // ACCESO REMOTO: el mismo numero de usuarios, el mismo caudal y el mismo requerimiento
  // -130 Mbps en los dos- caben por IPsec dial-up y no por SSL-VPN. Es exactamente lo que la
  // pagina no podia distinguir antes de preguntar el modo, porque sumaba los dos al eje IPsec.
  { n: '400 remotos por IPsec dial-up', rol: 'none', vpnUsers: 400, vpnTipo: 'ipsec', bw: 100,
    techo: '100', recomendado: 'FortiGate 60F', nCandidatos: 46 },
  { n: '400 remotos por SSL-VPN — otro motor, otro tope, otro equipo', rol: 'none', vpnUsers: 400, vpnTipo: 'sslvpn', bw: 100,
    techo: '100', recomendado: 'FortiGate 120G', nCandidatos: 36 },
  // VDOM: un tope de plataforma que este catalogo no tenia y que decide un diseno multi-tenant.
  { n: '20 VDOM', rol: 'none', vdoms: 20, bw: 100, techo: '100',
    recomendado: 'FortiGate 200G', nCandidatos: 34 },
  { n: '120 VDOM', rol: 'none', vdoms: 120, bw: 100, techo: '100',
    recomendado: 'FortiGate 1800F', nCandidatos: 26 },
  // EL CONTROL. Mismo caudal, sin declarar ningun limite: compiten los 58. Sin el, un motor
  // que se rompiera y apartara a todo el mundo daria listas cortas en los seis de arriba y
  // pasaria por «el eje funciona».
  { n: 'control · 100 Mbps sin limites declarados', rol: 'none', bw: 100, techo: '100',
    recomendado: 'FortiGate 30G', nCandidatos: 58 },
];


module.exports = {
  medidoEn: { commit: '15af632', fecha: '2026-09-23' },
  nombre: 'Fortinet — los limites del Product Matrix se comprueban',
  pagina: 'dimensionador-fortinet-fortigate.html',
  claves: ['recomendado', 'nCandidatos'],
  baseLinea: BASE_LINEA,

  // Por los controles de la pagina, no inyectando estado: un contraste que evita la interfaz
  // no prueba la interfaz.
  async preparar(p, e, { pausa }) {
    await p.fill('#wanBuilderFilas [data-campo=down] >> nth=0', String(e.bw));
    await p.dispatchEvent('#wanBuilderFilas [data-campo=down] >> nth=0', 'input');
    await pausa(p, 300);
    if (e.rol !== 'none') { await p.click(`#rolSeg button[data-v="${e.rol}"]`); await pausa(p, 400); }
    if (e.sites) { await p.fill('#sites', String(e.sites)); await p.dispatchEvent('#sites', 'input'); await pausa(p, 300); }
    if (e.vpnTipo) { await p.selectOption('#vpnTipo', e.vpnTipo); await pausa(p, 200); }
    if (e.vpnUsers) { await p.fill('#vpnUsers', String(e.vpnUsers)); await p.dispatchEvent('#vpnUsers', 'input'); await pausa(p, 300); }
    if (e.vdoms) { await p.fill('#vdoms', String(e.vdoms)); await p.dispatchEvent('#vdoms', 'input'); await pausa(p, 300); }
    if (e.techo !== '100') { await p.selectOption('#techoUtil', e.techo); await pausa(p, 300); }
  },

  async leer(p) {
    const sel = await p.$('#verdict-sel');
    return {
      recomendado: sel ? await sel.evaluate((e) => e.value) : '(sin candidato)',
      nCandidatos: sel ? await sel.evaluate((e) => e.options.length) : 0,
    };
  },

  // LO QUE UN NUMERO NO DICE: que la pantalla EXPLIQUE contra que tope se comparo. La cifra
  // sola no distingue «se comprobo y entra» de «no se comprobo»; ese era justo el estado
  // anterior, y sin esta comprobacion volver a el pasaria en verde.
  async extra(p, { base, pausa }) {
    const out = [];
    await p.goto(`${base}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1400);
    await p.fill('#wanBuilderFilas [data-campo=down] >> nth=0', '1');
    await p.dispatchEvent('#wanBuilderFilas [data-campo=down] >> nth=0', 'input');
    await pausa(p, 400);
    await p.click('#rolSeg button[data-v="hub"]');
    await pausa(p, 400);
    await p.fill('#sites', '190');
    await p.dispatchEvent('#sites', 'input');
    await pausa(p, 900);
    const txt = await p.$eval('#verdict', (e) => e.textContent || '');
    const publicados = /200<?\/?b?>? ?t[uú]neles publicados|t[uú]neles publicados/i.test(txt)
      && /tope de plataforma/i.test(txt);
    const yaNoDeclara = !/no est[aá] en este cat[aá]logo/i.test(txt);
    out.push({ n: 'el conteo de tuneles se contrasta contra el tope publicado', ok: publicados,
      detalle: publicados ? 'la pantalla cita la cifra publicada y el porcentaje del tope'
        : 'la pantalla NO cita contra que tope se comparo' });
    out.push({ n: 'ya no queda el aviso «el limite no esta en este catalogo»', ok: yaNoDeclara,
      detalle: yaNoDeclara ? 'el aviso desaparecio porque el dato llego' : 'sigue declarandose sin comprobar' });
    return out;
  },
};
