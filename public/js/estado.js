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

    return { origen, volcar };
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
  function avisoOrigen(contenedor, origen) {
    if (!origen) return;
    const host = typeof contenedor === 'string' ? document.getElementById(contenedor) : contenedor;
    if (!host) return;
    const p = document.createElement('p');
    p.className = 'hint estado-origen';
    p.style.marginTop = '8px';
    p.innerHTML = origen === 'enlace'
      ? 'Estás viendo un escenario <b>recibido por enlace</b>. Cambia cualquier parámetro y el enlace se actualiza solo.'
      : 'Se restauraron <b>los parámetros de tu última visita</b>. Cambia cualquiera y se guardan de nuevo.';
    host.appendChild(p);
  }

  global.ESTADO = { vincular, botonEnlace, avisoOrigen };
}(window));
