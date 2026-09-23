'use strict';
/* CASO: la Calculadora de Throughput del portal dimensiona la inspección TLS con SU cifra,
 * no con la de Threat Protection (2026-09-23).
 *
 * DE DONDE SALE. El portal ofrecía cinco perfiles y ninguno era el de inspección TLS, así
 * que quien preguntaba «¿qué equipo para esto con descifrado HTTPS?» recibía la respuesta
 * calculada sobre Threat Protection. Es el mismo defecto P0 que el dimensionador de Fortinet
 * arrastró hasta el 2026-09-22 —un derate único sobre TP—, pero en la pantalla de portada, y
 * no se podía cerrar antes porque el catálogo solo traía `ssl` de 9 modelos. Al leer la tabla
 * del Product Matrix de septiembre pasó a 51 de 58, y el perfil dejó de ser un hueco.
 *
 * EL CASO ES UN PAR, Y LOS DOS ESCENARIOS APUNTAN EN DIRECCIONES OPUESTAS. Ahí está el
 * argumento entero: el cociente ssl/tp de este catálogo va de 0,52 a 1,18, así que sustituir
 * una cifra por la otra NO es «conservador» — se equivoca en los dos sentidos, y medido en
 * esta pantalla da esto:
 *
 *   · 175 Mbps (455 de requerimiento): Threat Protection propone un 30G, que hace 500 Mbps
 *     de TP y solo 400 de inspección TLS. La respuesta de antes se quedaba CORTA. Con su
 *     cifra propia el equipo que cumple es el 60F (630 Mbps).
 *   · 500 Mbps (1,3 Gbps de requerimiento): Threat Protection propone un 70G. El 50G hace
 *     1.100 Mbps de TP pero 1.300 de inspección TLS, así que cumple. La respuesta de antes
 *     SOBREDIMENSIONABA una gama entera.
 *
 * Un caso con un solo escenario no distinguiría «el perfil funciona» de «el perfil siempre
 * sube de gama», que es lo que haría un derate puesto al revés.
 *
 * Y EL CONTROL DE REENVÍO NO ES RELLENO. Es lo que separa «entró el perfil nuevo» de «el
 * evaluador se rompió y ahora aparta a todo el mundo»: en reenvío tienen que seguir
 * compitiendo los siete fabricantes. Si un refactor rompiera el mapa de capas, ese escenario
 * salta primero y dice dónde mirar.
 */
const BASE_LINEA = [
  { n: 'TP 175 Mbps — la respuesta que se quedaba corta', bw: '175', perfil: 'tp',
    recomendado: 'FortiGate 30G', capa: 'Threat Protection', fabricantes: 2 },
  { n: 'TLS 175 Mbps — con su cifra propia sube al 60F', bw: '175', perfil: 'ssl',
    recomendado: 'FortiGate 60F', capa: 'SSL Inspection', fabricantes: 1 },
  { n: 'TP 500 Mbps — la respuesta que sobredimensionaba', bw: '500', perfil: 'tp',
    recomendado: 'FortiGate 70G', capa: 'Threat Protection', fabricantes: 2 },
  { n: 'TLS 500 Mbps — el 50G aguanta MÁS TLS que TP y cumple', bw: '500', perfil: 'ssl',
    recomendado: 'FortiGate 50G', capa: 'SSL Inspection', fabricantes: 1 },
  { n: 'TLS 20 Gbps — la gama alta responde sin caer a otra capa', bw: '20000', perfil: 'ssl',
    recomendado: 'FortiGate 3500F', capa: 'SSL Inspection', fabricantes: 1 },
  { n: 'control · reenvío 2 Gbps — siguen compitiendo los siete', bw: '2000', perfil: 'fwd',
    recomendado: 'RB4011iGS+', capa: 'Forwarding', fabricantes: 7 },
];

module.exports = {
  medidoEn: { commit: 'a26aaad', fecha: '2026-09-23' },
  nombre: 'Portal — la inspección TLS se dimensiona con su propia cifra',
  pagina: 'index.html',
  claves: ['recomendado', 'capa', 'fabricantes'],
  baseLinea: BASE_LINEA,

  // Por los controles de la pantalla, no inyectando estado. El botón hace falta la primera
  // vez —hasta entonces no hay nada que repintar—, y después la calculadora se repinta sola
  // al cambiar cualquier control: una tabla que sigue mostrando el perfil anterior es una
  // respuesta a otra pregunta.
  async preparar(p, e, { pausa }) {
    await p.click('.nav-btn[data-page="calculadora"]');
    await pausa(p, 400);
    await p.fill('#calcBw', e.bw);
    await p.dispatchEvent('#calcBw', 'input');
    await pausa(p, 300);
    await p.selectOption('#calcProfile', e.perfil);
    await pausa(p, 300);
    await p.click('#btnCalcular');
    await pausa(p, 700);
  },

  async leer(p) {
    return p.$eval('#calcOut', (o) => {
      const rec = o.querySelector('tr.calc-rec');
      const capa = rec ? rec.querySelectorAll('td .calc-sub')[0] : null;
      return {
        recomendado: rec ? rec.querySelector('.calc-modelo').textContent.trim() : '(sin candidato)',
        capa: capa ? capa.textContent.trim() : '(sin capa)',
        fabricantes: o.querySelectorAll('.panel h2 .calc-punto').length,
      };
    });
  },

  /* LO QUE UN NÚMERO NO DICE: que la pantalla EXPLIQUE por qué la lista es corta, y que lo
     diga ANTES de la lista. Con inspección TLS compite un fabricante de siete; sin ese
     encabezado, cinco equipos de Fortinet se leen como «el catálogo entero es esto» o como
     «no hay equipo», cuando lo que pasa es que no hay dato — y esas lecturas mandan a sitios
     opuestos: una a subir de gama, la otra a completar un documento. */
  async extra(p, { base, pausa }) {
    const out = [];
    await p.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1600);
    await p.click('.nav-btn[data-page="calculadora"]');
    await pausa(p, 400);
    await p.selectOption('#calcProfile', 'ssl');
    await pausa(p, 300);
    await p.click('#btnCalcular');
    await pausa(p, 800);

    const cob = await p.$eval('#calcOut', (o) => {
      const c = o.querySelector('.calc-cobertura');
      // «Antes de la lista» se afirma por ESTRUCTURA y no con una constante del DOM: el
      // encabezado tiene que vivir dentro del bloque del requerimiento (`.calc-result`), que
      // es lo primero que se pinta, y no dentro del panel de apartados, que va al final. Es
      // lo mismo que se quiere decir y se lee sin `Node.DOCUMENT_POSITION_*`, que además no
      // existe bajo el lint de Node con el que corren estos scripts.
      return {
        texto: c ? c.textContent.replace(/\s+/g, ' ').trim() : '',
        antes: !!(c && c.closest('.calc-result')),
      };
    });
    const declara = /1 de los \d+ fabricantes/.test(cob.texto) && /Fortinet/.test(cob.texto);
    out.push({ n: 'la pantalla declara cuántos fabricantes publican la capa', ok: declara,
      detalle: declara ? cob.texto.slice(0, 90) : `no lo declara (${cob.texto.slice(0, 90) || 'sin línea'})` });
    out.push({ n: 'y lo dice ANTES de la lista, no después', ok: cob.antes,
      detalle: cob.antes ? 'el encabezado precede al primer fabricante' : 'la lista se lee antes de saber que está incompleta' });
    const dato = /falta de dato y no por falta de equipo/.test(cob.texto);
    out.push({ n: 'distingue «falta el dato» de «falta el equipo»', ok: dato,
      detalle: dato ? 'lo dice con esas palabras' : 'una lista corta se lee como que no hay equipo' });

    // El nombre se lee del desplegable, que es lo que ve quien usa la pantalla, y no de
    // `window.CALC`: un rótulo correcto en el módulo y equivocado en el `<option>` seguiría
    // mandando a la gente a elegir la capa por su nombre en pantalla.
    const etq = await p.$eval('#calcProfile', (sel) => sel.options[sel.selectedIndex].textContent.trim());
    out.push({ n: 'el perfil se nombra por su capa y no por una profundidad inventada',
      ok: /TLS|SSL/i.test(etq), detalle: etq || '(sin perfil ssl)' });

    /* LA REGLA, Y ES LA QUE LOS SEIS ESCENARIOS NO VIGILAN. Se descubrió saboteando: hacer
       que el lector caiga a Threat Protection cuando falta `ssl` NO movió ninguna de las seis
       recomendaciones, porque los dos modelos Fortinet sin la cifra —100F y 200F— no son el
       más pequeño que cumple en ninguno de esos escenarios. Un caso que pasa en verde con el
       derate dentro se porta igual que uno que no comprueba nada.

       La señal que sí cambia está en pantalla: FORTINET TIENE QUE APARECER ENTRE LOS
       APARTADOS de su propio perfil, porque dos de sus modelos no traen la cifra. Con la
       sustitución dentro desaparece de esa lista. Se afirma la RELACIÓN —«el fabricante que
       publica la capa también tiene modelos sin ella»— y no el número 2, que cambiaría el día
       que alguien complete esas dos fichas por serie (pendiente F6). */
    const apartados = await p.$eval('#calcOut', (o) => {
      const items = [...o.querySelectorAll('.calc-apartados .calc-lista li')];
      return items.map((li) => (li.querySelector('b') || {}).textContent || '');
    });
    // LA REGLA NECESITA UN SUJETO, y desde el 2026-09-23 el portal puede no tenerlo: las
    // fichas por serie completaron la cifra de TLS del 400F, 401F, 1000F y 1001F, y los dos
    // FortiGate que siguen sin ella (100F y 200F) estan fuera de venta y el portal no los
    // lista. Se cuenta sobre el MISMO catalogo que pinta la pantalla: con sujeto, Fortinet
    // tiene que aparecer entre los apartados; sin el, se DICE que no se pudo comprobar aqui y
    // donde queda vigilada — un comprobador que pasa sin comprobar nada es el que este
    // repositorio no quiere tener.
    const sinCifra = await p.evaluate(async () => {
      const d = await (await fetch('/api/catalog', { credentials: 'same-origin' })).json();
      return (d.fortinet || []).filter((x) => x.ssl == null).map((x) => x.model || x.id);
    });
    const fortiApartado = apartados.some((v) => v.trim() === 'fortinet' || /fortinet/i.test(v));
    out.push({ n: 'un modelo sin cifra de TLS se aparta aunque su fabricante sí publique la capa',
      ok: sinCifra.length ? fortiApartado : true,
      detalle: !sinCifra.length
        ? 'SIN SUJETO en el catálogo de hoy: ningún FortiGate del portal carece de la cifra de TLS. No se comprobó aquí; la regla la fija test/calculadora.test.js con datos sintéticos'
        : fortiApartado
          ? `Fortinet aparece entre los apartados: ${sinCifra.join(', ')} no traen la cifra`
          : `no aparece — se estaría sustituyendo por otra capa (sin cifra: ${sinCifra.join(', ')}; apartados: ${apartados.join(', ') || 'ninguno'})` });
    return out;
  },
};
