'use strict';
// Estado de pantalla: enlazable por URL, sin persistencia entre sesiones.
//
// EL PROBLEMA QUE RESUELVE
// Al poner 2.500 Mbps en el dimensionador de Fortinet y copiar la URL, quien la abría veía
// 500 Mbps y otra recomendación — no se podía pasar un dimensionamiento a un compañero, que es
// el gesto más frecuente ("mírate este sizing"). Este módulo escribe cada campo en la URL para
// que un enlace compartido reproduzca el mismo escenario. A petición del dueño del repo
// (2026-09-10) ya no guarda nada en localStorage: cada inicio de sesión arranca en blanco,
// salvo que la URL traiga parámetros.
//
// CAMPOS VACÍOS AL ENTRAR (decisión del dueño, 2026-09-12)
// Los dimensionadores ya no traen valores de ejemplo precargados: los <input type="number">
// del HTML van sin atributo value para que el usuario ingrese sus propias cifras desde cero.
// Los motores ya toleran el vacío (parseFloat(...)||0), así que un campo sin rellenar cuenta
// como 0 y el escenario simplemente no produce candidatos hasta que se teclea algo. Los
// deslizadores (headroom, concurrencia...) sí conservan su posición inicial porque un slider
// no puede estar "vacío". Además, este módulo borra los campos tecleables al cargar cuando la
// URL no trae parámetros: es la red de seguridad contra el navegador, que repone lo último
// tecleado al recargar o al volver con el botón atrás (bfcache) aunque no haya localStorage.
//
// POR QUÉ UN QUERYSTRING CORTO Y NO JSON EN BASE64
// Estos enlaces se pegan en un chat. Un `?bw=2500&head=30` se lee, se edita a mano y no lo
// parte ningún cliente de correo; un blob opaco de 400 caracteres, ninguna de las tres cosas.
//
// CÓMO SE INTEGRA SIN TOCAR EL MOTOR DE CADA PÁGINA
// Las cinco páginas de dimensionamiento ya leen sus controles del DOM en cada `render()`, así
// que basta con reponer los valores ANTES de que corra su script y, para los grupos de
// botones `.seg`, disparar un click sintético DESPUÉS —porque ahí la página guarda la
// elección en una variable suya, no en el DOM, y solo su propio manejador la actualiza. Es
// la diferencia entre integrarse con el código existente y reescribirlo.

(function (global) {
  'use strict';

  // Los nombres de parámetro que se muestran salen de la URL, y una URL la escribe quien
  // manda el enlace: se escapan antes de pintarlos. La CSP de este sitio ya bloquearía un
  // `onerror=` inyectado, pero apoyarse en ella para esto sería confiar la corrección de una
  // pantalla a una cabecera de otra capa.
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // Lee el valor de un control, sea del tipo que sea. Los grupos .seg no son controles de
  // formulario: son botones con aria-pressed, y el "valor" es el data-v del que está activo.
  function leer(nodo) {
    if (!nodo) return null;
    if (nodo.classList && nodo.classList.contains('seg')) {
      const activo = nodo.querySelector('[aria-pressed="true"]');
      return activo ? activo.dataset.v : null;
    }
    if (nodo.type === 'checkbox') return nodo.checked ? '1' : '0';
    return nodo.value;
  }

  function escribir(nodo, valor) {
    if (!nodo || valor == null) return false;
    if (nodo.classList && nodo.classList.contains('seg')) {
      const destino = nodo.querySelector(`[data-v="${CSS.escape(valor)}"]`);
      if (!destino) return false;
      [...nodo.children].forEach((b) => b.setAttribute('aria-pressed', b === destino));
      return true;
    }
    if (nodo.type === 'checkbox') { nodo.checked = valor === '1'; return true; }
    // Un <select> con un valor que ya no existe se quedaría en blanco en silencio.
    if (nodo.tagName === 'SELECT' && ![...nodo.options].some((o) => o.value === valor)) return false;
    nodo.value = valor;
    return true;
  }

  function vincular(cfg) {
    const campos = cfg.campos || [];
    const segs = campos.filter((id) => {
      const n = document.getElementById(id);
      return n && n.classList && n.classList.contains('seg');
    });

    // Valores por defecto, capturados ANTES de restaurar nada. Son la referencia para no
    // escribir en el enlace lo que nadie ha tocado: sin esto, cambiar un campo producía una
    // URL de veinte parámetros, ilegible e imposible de editar a mano — justo lo contrario
    // de por qué se eligió un querystring en vez de un blob codificado.
    const defectos = {};
    for (const id of campos) defectos[id] = leer(document.getElementById(id));

    // ── Restaurar ───────────────────────────────────────────────────────────
    // Solo se repone lo que trae la URL (un enlace que alguien compartió). Ya no se guarda
    // ni se repone nada entre sesiones: cada inicio de sesión arranca en blanco.
    const params = new URLSearchParams(location.search);
    let origen = null;
    let guardado = {};
    if ([...params.keys()].some((k) => campos.includes(k))) {
      origen = 'enlace';
      for (const id of campos) if (params.has(id)) guardado[id] = params.get(id);
    }

    // ── Parámetros que esta página ya no entiende ───────────────────────────
    // UN ENLACE VIEJO NO PUEDE ATERRIZAR EN SILENCIO. Cuando una pantalla renombra o retira
    // un control, los enlaces ya pegados en chats y correos siguen llegando con el parámetro
    // antiguo: el emisor ve su escenario y el receptor ve otro, sin una sola señal de que
    // algo se perdió. Es el mismo modo de fallo que `RENOMBRADAS` en `server.js` evita para
    // el NOMBRE del archivo —«peor que un 404 porque no se nota»— y que nadie cubría para
    // los PARÁMETROS. Ocurrió de verdad el 2026-09-13: el dimensionador Aruba cambió su
    // campo `#bw` por el Multi-Underlay Builder, y solo se salvó porque alguien escribió a
    // mano una migración para esa página. La regla general faltaba.
    //
    // QUÉ NO SE DENUNCIA, y por eso se compara contra una lista declarada y no contra todo
    // lo que venga: lo que la página SÍ sabe migrar (`cfg.migrados`, que es como Aruba
    // declara sus seis parámetros v1) y lo que nunca fue escenario —marcas de campaña y de
    // seguimiento—. Un aviso que salta con un `?utm_source=…` pegado al enlace enseña a
    // ignorarlo, que es exactamente lo contrario de para lo que existe.
    const AJENOS = /^(utm_[a-z_]+|fbclid|gclid|mc_[a-z]+|ref|source|_ga)$/i;
    const migrados = cfg.migrados || [];
    const ignorados = [...params.keys()].filter((k) => !campos.includes(k)
      && !migrados.includes(k) && !AJENOS.test(k));

    // ── Arranque en blanco ──────────────────────────────────────────────────
    // Sin parámetros en la URL no hay nada que restaurar: se vacían los campos tecleables
    // (números y texto) por si el navegador repuso lo último tecleado — lo hace al recargar
    // y al volver con atrás/adelante (bfcache), sin pasar por localStorage. Los deslizadores,
    // casillas, selects y grupos .seg conservan su posición inicial: no son campos "vaciables".
    // El evento input avisa al motor de la página para que repinte con el escenario vacío.
    function limpiarCamposTecleables() {
      for (const id of campos) {
        const nodo = document.getElementById(id);
        if (!nodo || !nodo.tagName) continue;
        if (nodo.tagName !== 'INPUT') continue;
        if (nodo.type !== 'number' && nodo.type !== 'text') continue;
        if (nodo.value === '') continue;
        nodo.value = '';
        nodo.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    if (!origen) {
      limpiarCamposTecleables();
      // Con bfcache la página vuelve tal cual se dejó, sin recargar scripts: hay que limpiar
      // en el pageshow, que es el único evento que sí se dispara al volver.
      window.addEventListener('pageshow', (e) => {
        if (e.persisted && !new URLSearchParams(location.search).toString()) limpiarCamposTecleables();
      });
    }

    const pendientesSeg = [];
    for (const id of campos) {
      if (!(id in guardado)) continue;
      const nodo = document.getElementById(id);
      if (!escribir(nodo, guardado[id])) continue;
      if (segs.includes(id)) pendientesSeg.push({ nodo, valor: guardado[id] });
    }

    // Los grupos .seg necesitan que su propio manejador corra para que la página actualice
    // su variable interna. Se hace en el siguiente tick, cuando el script de la página ya
    // registró sus listeners.
    if (pendientesSeg.length) {
      setTimeout(() => {
        for (const { nodo, valor } of pendientesSeg) {
          const destino = nodo.querySelector(`[data-v="${CSS.escape(valor)}"]`);
          if (destino) destino.click();
        }
      }, 0);
    }

    // CAMPOS QUE APARECEN TARDE. El desplegable de equipo lo pinta ficha.js DESPUÉS del
    // primer render, así que al vincular todavía no existe en el DOM. Sin esto, el enlace no
    // llevaba QUÉ MODELO estabas mirando: quien lo abría veía el escenario correcto pero
    // podía encontrarse otro equipo seleccionado, porque ficha.js conserva la elección manual
    // mientras siga cumpliendo. Detectado al probar el enlace de un 2.500 Mbps en capa IPS:
    // el emisor veía el 200G que traía arrastrado y el receptor el 90G recomendado.
    const tardios = campos.filter((id) => !document.getElementById(id) && id in guardado);
    if (tardios.length) {
      const obs = new MutationObserver(() => {
        for (let i = tardios.length - 1; i >= 0; i -= 1) {
          const nodo = document.getElementById(tardios[i]);
          if (!nodo) continue;
          escribir(nodo, guardado[tardios[i]]);
          // El cambio hay que anunciarlo: ficha.js repinta la ficha desde su propio manejador.
          nodo.dispatchEvent(new Event('change', { bubbles: true }));
          engancharCampo(tardios[i]);
          tardios.splice(i, 1);
        }
        if (!tardios.length) obs.disconnect();
      });
      obs.observe(document.body, { childList: true, subtree: true });
      // Red de seguridad: si el campo nunca aparece (el escenario ya no da candidatos), se
      // deja de escuchar en vez de observar el DOM para siempre.
      setTimeout(() => obs.disconnect(), 8000);
    }

    // ── Guardar ─────────────────────────────────────────────────────────────
    function volcar() {
      const datos = {};
      const qs = new URLSearchParams();
      for (const id of campos) {
        const v = leer(document.getElementById(id));
        if (v == null || v === '') continue;
        // Solo viaja lo que difiere del valor por defecto. El resultado es `?bw=2500` en vez
        // de una tira de veinte pares, y quien recibe el enlace ve de un vistazo qué se
        // cambió respecto al punto de partida.
        if (v === defectos[id]) continue;
        datos[id] = v;
        qs.set(id, v);
      }
      // replaceState y no pushState: cada tecleo no debe crear una entrada en el historial,
      // o el botón "atrás" dejaría de servir para volver al portal.
      history.replaceState(null, '', qs.toString() ? `${location.pathname}?${qs}` : location.pathname);
      if (cfg.alCambiar) cfg.alCambiar(datos);
    }

    function engancharCampo(id) {
      const nodo = document.getElementById(id);
      if (!nodo || nodo.dataset.estadoEnganchado) return;
      nodo.dataset.estadoEnganchado = '1';
      nodo.addEventListener(segs.includes(id) ? 'click' : 'input', () => setTimeout(volcar, 0));
      if (nodo.tagName === 'SELECT') nodo.addEventListener('change', () => setTimeout(volcar, 0));
    }
    for (const id of campos) engancharCampo(id);
    // El desplegable de equipo se repinta entero en cada render, así que su listener se
    // pierde. Delegar en document cubre todas sus reencarnaciones con un solo enganche.
    document.addEventListener('change', (e) => {
      if (e.target && campos.includes(e.target.id)) setTimeout(volcar, 0);
    });
    setTimeout(volcar, 0);

    return { origen, volcar, ignorados };
  }

  // Botón "Copiar enlace". Se inyecta desde JavaScript y no desde el HTML de cada página
  // para que añadirlo a una pantalla nueva sea una línea, no seis.
  function botonEnlace(contenedor, texto) {
    const host = typeof contenedor === 'string' ? document.getElementById(contenedor) : contenedor;
    if (!host) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ghost estado-enlace';
    b.textContent = texto || 'Copiar enlace de este escenario';
    b.addEventListener('click', async () => {
      const previo = b.textContent;
      try {
        await navigator.clipboard.writeText(location.href);
        b.textContent = 'Enlace copiado';
      } catch {
        // clipboard exige contexto seguro; en http local cae aquí y se muestra la URL para
        // copiarla a mano, en vez de fallar sin decir nada.
        b.textContent = 'Copia la URL de la barra';
      }
      setTimeout(() => { b.textContent = previo; }, 1800);
    });
    host.appendChild(b);
  }

  // Aviso discreto de dónde salió lo que se está viendo. Sin esto, restaurar estado es
  // desconcertante: abres la herramienta y los campos no están donde los dejó el compañero.
  //
  // Acepta el estado que devuelve `vincular()` —de donde saca también los parámetros que la
  // página ya no entiende— o, por compatibilidad, solo la cadena de origen.
  function avisoOrigen(contenedor, estado) {
    const info = (estado && typeof estado === 'object') ? estado : { origen: estado, ignorados: [] };
    const ignorados = info.ignorados || [];
    if (!info.origen && !ignorados.length) return;
    const host = typeof contenedor === 'string' ? document.getElementById(contenedor) : contenedor;
    if (!host) return;
    if (info.origen) {
      const p = document.createElement('p');
      p.className = 'hint estado-origen';
      p.style.marginTop = '8px';
      p.innerHTML = info.origen === 'enlace'
        ? 'Estás viendo un escenario <b>recibido por enlace</b>. Cambia cualquier parámetro y el enlace se actualiza solo.'
        : 'Se restauraron <b>los parámetros de tu última visita</b>. Cambia cualquiera y se guardan de nuevo.';
      host.appendChild(p);
    }
    if (!ignorados.length) return;
    // SE DICE CUÁLES, no solo que había alguno: quien recibe el enlace necesita saber qué
    // parte del escenario NO le llegó para poder pedirla. Y se avisa aunque el enlace no
    // traiga ningún campo reconocible —el caso peor, en el que la pantalla sale entera en
    // blanco y sin el aviso no habría absolutamente nada que explicara por qué.
    // Y se acota la lista: un enlace con veinte parámetros sueltos produciría un párrafo que
    // nadie lee, y un aviso que no se lee no avisa.
    const TOPE = 6;
    const nombres = ignorados.slice(0, TOPE).map(esc).join('</b>, <b>');
    const resto = ignorados.length > TOPE ? ` y ${ignorados.length - TOPE} más` : '';
    const av = document.createElement('p');
    av.className = 'hint estado-ignorados';
    av.style.marginTop = '8px';
    av.innerHTML = `Este enlace trae ${ignorados.length === 1 ? 'un parámetro que esta pantalla' : 'parámetros que esta pantalla'} `
      + `ya no usa (<b>${nombres}</b>${resto}), así que esa parte del escenario `
      + '<b>no se ha aplicado</b>. Puede venir de una versión anterior de la herramienta: '
      + 'compruébalo con quien te lo pasó antes de cotizar sobre él.';
    host.appendChild(av);
  }

  global.ESTADO = { vincular, botonEnlace, avisoOrigen };
}(window));
