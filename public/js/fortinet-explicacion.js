'use strict';
/* global module */
/* ══ EXPLICACIÓN DEL RESULTADO DEL DIMENSIONADOR FORTIGATE (2026-10-31) ═══════════════════
   Fase 3.2 del plan de mejora de los dimensionadores, primera entrega: lo que la página dice
   SOBRE el resultado del motor —por qué se apartó cada modelo, qué fuera de venta cumplen, cómo se
   licencia FortiGuard en HA— vivía en dimensionador-fortinet-fortigate.js, junto al DOM, y solo se
   podía probar recortando su código con una expresión regular. Aquí, sin DOM ni estado: reciben el
   resultado de `FortinetMotor.evaluar` (o el modelo y el modo de HA) y devuelven datos o texto.

   NO es parte del motor: `fortinet-motor.js` y `fortinet-reglas.js` (arquitectura aprobada por el
   dueño el 2026-10-07) no se tocan. Esto solo lee lo que el motor ya decidió.

   Mismo patrón UMD que fortinet-reglas.js: global `FortinetExplicacion` en el navegador y
   require() en las pruebas de Node (test/fortinet-explicacion.test.js). La página conserva los
   mismos nombres como envoltorios de una línea. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FortinetExplicacion = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  // Las restricciones del motor, dichas para quien lee la lista de descartados.
  const RESTRICCION_N = {
    CICLO_VIDA: 'fuera de venta en compra nueva', FORTIOS_INCOMPATIBLE: 'FortiOS no admite la función pedida',
    PROXY_LIMITADO: 'soporte proxy limitado', PUERTOS_INSUFICIENTES: 'puertos insuficientes',
    ALMACENAMIENTO_SIN_DATO: 'disco sin dato', ALMACENAMIENTO_INSUFICIENTE: 'disco insuficiente',
    POE_SIN_DATO: 'PoE sin dato', POE_NO_DISPONIBLE: 'sin PoE en el SKU base',
    PSU_SIN_DATO: 'fuente sin dato', PSU_SIN_REDUNDANCIA: 'sin fuente redundante',
  };

  // Los descartados agrupados por motivo: apartados porque el catálogo no trae la cifra de un eje
  // (una tarea de datos, no una falta de capacidad), los que no llegan por el eje que manda y los
  // que bloquea una restricción.
  function resumenDescartes(r) {
    const sinDato = new Map();
    const porCapacidad = new Map();
    const porRestriccion = new Map();
    for (const c of r.descartados) {
      const ev = c.eval;
      if (ev.estado === 'apartado' && ev.apartadoPor) {
        if (!sinDato.has(ev.apartadoPor)) sinDato.set(ev.apartadoPor, { n: ev.apartadoPorN, modelos: [] });
        sinDato.get(ev.apartadoPor).modelos.push(c.id);
      } else if (ev.estado === 'excede' && ev.manda) {
        const k = ev.manda.k;
        if (!porCapacidad.has(k)) porCapacidad.set(k, { n: ev.manda.n, modelos: [] });
        porCapacidad.get(k).modelos.push(c.id);
      } else if (c.bloqueos.length) {
        for (const b of c.bloqueos) {
          if (!porRestriccion.has(b.codigo)) porRestriccion.set(b.codigo, { n: b.codigo, ejemplo: b.mensaje, modelos: [] });
          porRestriccion.get(b.codigo).modelos.push(c.id);
        }
      }
    }
    return { sinDato, porCapacidad, porRestriccion };
  }

  // Los fuera de venta que cumplen el escenario y solo se apartan por su ciclo de vida (compra
  // nueva): van al desplegable de la ficha, detrás de los vigentes. Nunca salen recomendados.
  function fueraDeVentaQueCumplen(r) {
    return r.candidatos
      .filter((c) => !c.elegible && c.eol && c.eval.estado === 'ok' && c.bloqueos.length
        && c.bloqueos.every((b) => b.codigo === 'CICLO_VIDA'))
      .sort((a, b) => a.soporta - b.soporta);
  }

  // Cómo se licencia FortiGuard en HA (F3, guía de FortiOS 7.6.6). `cotizada` dice si el BOM ya
  // trae la licencia única del par; la página lo calcula con su resultado (`unicaCotizada`).
  function licenciaHa(m, modo, cotizada) {
    if (modo === 'standalone') return null;
    const u = m && m.haLicenciaUnica;
    if (u && modo === 'ha-ap' && cotizada) {
      return { unica: true, texto: `una sola suscripción para el par: ${u.skuHa} × 2 y un bundle registrado a su número de `
        + 'serie virtual (licencia única de la guía de FortiOS 7.6.6)' };
    }
    if (u && modo === 'ha-ap') {
      return { unica: true, texto: `este BOM cotiza una suscripción por nodo, pero la serie ${u.serie} admite una sola `
        + `para el par en activo-pasivo, con dos unidades del SKU de HA (${u.skuHa || 'que la lista firmada no trae para '
        + 'este modelo: consultar'}), según la guía de FortiOS 7.6.6` };
    }
    return { unica: false, texto: u
      ? 'una suscripción por nodo: la licencia única de su serie solo vale en activo-pasivo (guía de FortiOS 7.6.6)'
      : 'una suscripción por nodo: la guía de FortiOS 7.6.6 no da licencia única en HA a este modelo' };
  }

  /* EL PORQUÉ DEL RESULTADO (fase 3.2, segunda entrega, 2026-11-01). La lista de motivos cuando ningún
     modelo cumple y la explicación de un candidato, trasladadas sin cambiar una línea desde la página.
     Leían globales de la página (catálogo, rol SD-WAN, nombres de capas y campos, formateadores,
     motor y reglas): ahora los reciben en `ctx`, que arma `contextoExplicacion()` en la página.
     `resumenDescartes` y `RESTRICCION_N` son las de este módulo, como antes vía sus envoltorios.
     Medido con `npm run equivalencia -- scripts/equivalencias/fortinet-porque.js`. */
  function porQueSinCandidato(r, ctx) {
    const { esc, fmt, MODELS, TIER_BY_K, CAMPO_N, R } = ctx;
    const s = r.snapshot;
    const d = r.detalle;
    const why = [];
    if (r.errores.length || r.faltan.length) {
      for (const e of r.errores) why.push(`<li><b>${esc(CAMPO_N[e.campo] || e.campo)}</b>: ${esc(e.mensaje)}.</li>`);
      for (const f of r.faltan) {
        why.push(f === 'topologia.enlaces'
          ? '<li>Declara el <b>caudal</b> de al menos un enlace activo del sitio en el paso 3 (y si aplica, usuarios y sesiones) para que el dimensionador proponga los modelos que cumplen.</li>'
          : `<li>Falta <b>${esc(CAMPO_N[f] || f)}</b>, que el escenario hace obligatorio.</li>`);
      }
      return why.join('');
    }
    if (d) {
      why.push(`<li>Requerimiento de <b>${fmt(d.effectiveNeed)}</b> en la capa <b>${esc(TIER_BY_K[d.capa.k].n)}</b>`
        + `${s.seguridad.funciones.includes('chkSsl') ? ' con inspección SSL profunda' : ''}`
        + `${d.escenario !== 'normal' ? `, en el escenario «${esc((r.escenarios.find((x) => x.id === d.escenario) || {}).n || d.escenario)}»` : ''}.</li>`);
      if (d.capa.elevada) why.push(`<li>La capa se elevó de <b>${esc(TIER_BY_K[s.seguridad.capa].n)}</b> a <b>${esc(TIER_BY_K[d.capa.k].n)}</b> por ${d.capa.elevan.map((f) => esc(f.n)).join(', ')}.</li>`);
    }
    const { sinDato, porCapacidad, porRestriccion } = resumenDescartes(r);
    for (const [, g] of porCapacidad) why.push(`<li><b>${g.modelos.length}</b> modelo(s) no llegan por <b>${esc(g.n)}</b>.</li>`);
    for (const [k, g] of sinDato) {
      const con = MODELS.filter((m) => m[R.EJE_POR_K[k].campo] != null).length;
      why.push(`<li><b class="warn">${g.modelos.length} modelo(s) apartados porque el catálogo no trae su cifra de ${esc(g.n)}</b> — no por capacidad. `
        + `Los ${con} que sí la traen son los que compiten. Es una <b>tarea de datos, no una falta de capacidad</b>: la pantalla no sustituye esa cifra por la de otro eje; para comprometer uno de esos modelos hace falta una <b>PoC</b>.</li>`);
    }
    for (const [k, g] of porRestriccion) {
      why.push(`<li><b>${g.modelos.length}</b> modelo(s) descartados por <b>${esc(RESTRICCION_N[k] || k)}</b> (p. ej. ${esc(g.ejemplo)})</li>`);
    }
    if (s.politica.techoPct < 100) why.push(`<li>Se aplica un <b>techo de utilización del ${s.politica.techoPct} %</b>: subirlo ensancha la lista a costa de diseñar más cerca del máximo de laboratorio.</li>`);
    if ((d && d.capa.k === 'tp') || s.seguridad.funciones.includes('chkSsl')) why.push('<li>Estás dimensionando contra la capa más exigente: segmentar por política qué tráfico se inspecciona a fondo es la palanca que más capacidad libera en FortiGate.</li>');
    why.push('<li>Por encima del catálogo: chasis FortiGate 7000F con diseño especializado, o repartir la carga en varias unidades.</li>');
    return why.join('');
  }

  function porQueDe(r, c, ctx) {
    if (!c) return '';
    const { esc, fmt, cifra, nMil, rolSdwan, TIER_BY_K, R, M, licenciaHa } = ctx;
    const s = r.snapshot;
    const m = c.modelo;
    const ev = c.eval;
    const d = r.detalle;
    const eje = (k) => ev.ejes.find((e) => e.k === k);
    const flags = [];
    const contraste = (e, que) => (e
      ? (e.estado === 'sinDato'
        ? `<b class="warn">El catálogo no trae ${que} del ${esc(m.id)}</b>, así que ese tope no se comprobó.`
        : `Entra en <b>${cifra(e.cap)}</b> ${esc(e.unidad)} publicados — <b${e.estado === 'excede' ? ' class="warn"' : ''}>${R.pct(e.u)}</b> del tope de plataforma.`)
      : '');
    if (s.seguridad.funciones.includes('chkSsl')) {
      const ssl = eje('ssl');
      flags.push(ssl && ssl.cap != null
        ? `<b>Inspección SSL profunda:</b> se dimensiona contra los <b>${fmt(ssl.cap)}</b> de <b>SSL Inspection Throughput</b> del ${esc(m.id)}, una medición propia y no una fracción de sus ${fmt(m.tp)} de Threat Protection (aquí el cociente es ${(m.ssl / m.tp).toFixed(2)}). Carga: tráfico × ${s.seguridad.tlsCifradoPct} % cifrado × ${100 - s.seguridad.tlsExentoPct} % no exento. Queda al ${R.pct(ssl.u)}.`
        : `<b class="warn">Inspección SSL sin cifra oficial para el ${esc(m.id)}:</b> no debería recomendarse contra ese eje sin PoC.`);
      if (s.seguridad.tlsExentoPct > 0) flags.push(`<b>Excepciones TLS:</b> se descuenta el <b>${s.seguridad.tlsExentoPct} %</b> del eje de inspección SSL. <b class="warn">Es un supuesto declarado en el paso 2, no una cifra de Fortinet</b>: si la política de exclusión cambia, este eje sube.`);
    }
    if (s.seguridad.funciones.includes('chkAv')) flags.push('El antivirus en línea fija el piso en Threat Protection: esa cifra ya lo incluye, junto con el logging.');
    if (s.seguridad.funciones.includes('chkSandbox')) flags.push(`FortiSandbox analiza <b>fuera de banda</b>: no consume throughput del FortiGate. Cobertura elegida: <b>${esc({ incluido: 'incluida en el bundle', ai: 'servicio de sandbox del FortiGate', dedicado: 'FortiSandbox dedicado' }[s.comercial.sandbox] || s.comercial.sandbox)}</b>.`);
    if (s.seguridad.funciones.includes('chkIotDlp')) flags.push('IoT Security y DLP <b>fijan el bundle mínimo en Enterprise Protection</b> y elevan el piso a Threat Protection.');
    if (s.disponibilidad.modo !== 'standalone') flags.push(`<b>HA ${s.disponibilidad.modo === 'ha-aa' ? 'activo-activo' : 'activo-pasivo'}:</b> se cotizan 2 nodos; FortiGuard: ${esc(licenciaHa(m, s.disponibilidad.modo).texto)}. El clúster <b>no suma capacidad</b>: en el failover un nodo carga con todo, y ese es el escenario contra el que se dimensiona.`);
    if (rolSdwan !== 'none' && d) {
      const ipsec = eje('vpn');
      const insp = eje(d.capa.k);
      if (ipsec && insp) {
        flags.push(ev.manda && ev.manda.k === 'vpn'
          ? `<b class="warn">Manda el overlay:</b> con ${Math.round(d.frac * 100)} % del tráfico cifrado, el motor IPsec (${fmt(ipsec.cap)}) va al ${R.pct(ipsec.u)} mientras la capa de inspección va al ${R.pct(insp.u)}.`
          : `El eje que aprieta es la capa de inspección (${R.pct(insp.u)}); el motor IPsec queda al ${R.pct(ipsec.u)} para el ${Math.round(d.frac * 100)} % que va cifrado.`);
      }
      flags.push(`Se suma un ${Math.round(M.OVERHEAD_ESP * 100)} % de encapsulación ESP sobre la fracción del overlay — supuesto de esta herramienta, no una cifra de Fortinet.`);
      flags.push('<b>SD-WAN sin costo de licencia:</b> el balanceo por SLA y ADVPN vienen en FortiOS; se licencian aparte solo los servicios avanzados, y solo si el diseño los usa.');
    }
    const tun = eje('tunGw');
    if (tun) flags.push(`<b>Escala del overlay:</b> ${cifra(tun.req)} túnel(es) IPsec sitio a sitio — ${rolSdwan === 'hub' ? 'uno por cada spoke que concentra' : 'uno por cada hub al que cifra'}. ${contraste(tun, 'el máximo de túneles sitio a sitio')}${rolSdwan === 'hub' ? ' Con <b>ADVPN</b> los atajos spoke-a-spoke no cuentan contra el hub.' : ''}`);
    if (s.remoto.activo && s.remoto.usuarios > 0) {
      const sslMode = s.remoto.metodo === 'sslvpn';
      flags.push(`<b>Acceso remoto por ${sslMode ? 'SSL-VPN' : 'IPsec dial-up'}:</b> ${cifra(s.remoto.usuarios)} usuario(s) concurrente(s). `
        + contraste(eje(sslMode ? 'sslVpnUsers' : 'tunCli'), sslMode ? 'el máximo de usuarios SSL-VPN concurrentes' : 'el máximo de túneles de cliente')
        + (sslMode ? ` Su caudal <b>no carga el eje IPsec</b>: compite contra el <i>SSL VPN Throughput</i> del modelo.${eje('sslVpn') ? ` ${contraste(eje('sslVpn'), 'el caudal SSL-VPN')}` : ''}`
          : ' Su caudal entra en el eje IPsec junto al overlay, y sus sesiones en la tabla de sesiones.')
        + (s.remoto.mfa ? ` Doble factor: ${contraste(eje('tokens'), 'el máximo de FortiToken')}` : ''));
    }
    const vd = eje('vdom');
    if (vd) flags.push(`<b>Segmentación:</b> ${cifra(vd.req)} VDOM declarados. ${contraste(vd, 'el máximo de dominios virtuales')} Es un tope de plataforma: el techo de utilización no se le aplica.${m.vdomDef != null && vd.req > m.vdomDef ? ` El modelo incluye ${m.vdomDef}: los ${vd.req - m.vdomDef} de más se cotizan como licencia de VDOM adicionales.` : ''}`);
    const bgp = eje('bgpPeers');
    if (bgp) flags.push(`<b>Plano de control:</b> ${cifra(bgp.req)} vecino(s) BGP${rolSdwan === 'hub' ? ' (uno por spoke si el overlay lleva BGP)' : ''}. ${contraste(bgp, 'el máximo de vecinos BGP')} Es un tope de configuración de FortiOS 7.6.7, no una medición: no se le aplica el techo de utilización.`);
    for (const k of ['aps', 'switches']) { const e = eje(k); if (e) flags.push(`<b>${esc(e.n)}:</b> ${cifra(e.req)} declarados. ${contraste(e, `el máximo de ${e.unidad}`)}`); }
    // Restricciones fisicas: el modelo es elegible, asi que las cumple; se dice contra que dato.
    if (M.TIPOS_PUERTO.some((t) => s.fisico.puertos[t.k] > 0)) {
      flags.push(m.puertos
        ? `<b>Puertos:</b> cubre lo pedido por cantidad, velocidad y medio (${esc(m.puertosFuente || 'catálogo')}).`
        : `<b class="warn">Puertos sin estructurar:</b> el catálogo solo trae «${esc(m.ifaces)}», así que el requerimiento de puertos no se comprobó.`);
    }
    if (s.fisico.registro === 'local') {
      const reqGb = r.requisitos.find((x) => x.eje === 'almacenamiento');
      flags.push(`<b>Registro local:</b> la retención pide ${reqGb ? cifra(Math.ceil(reqGb.requerido)) : '—'} GB y el ${esc(m.id)} publica ${cifra(m.almacenamientoGB)} GB brutos.`);
    }
    if (s.fisico.poeW > 0) flags.push(`<b>PoE:</b> ${cifra(s.fisico.poeW)} W pedidos.`);
    if (s.fisico.psuRedundante) flags.push(`<b>Fuente redundante:</b> ${m.redund === 'opcional' ? 'el equipo admite la segunda fuente como opción, y la línea entra en la cotización.' : 'el equipo trae fuente doble.'}`);
    for (const a of c.avisos) flags.push(`<b class="warn">${esc(a.mensaje)}</b>`);
    // QUE EJE MANDA Y A QUE DISTANCIA QUEDA EL SIGUIENTE.
    const conDato = ev.ejes.filter((e) => e.u != null && !e.configuracion);
    if (ev.manda && conDato.length > 1) {
      const otros = conDato.filter((e) => e.k !== ev.manda.k);
      flags.push(`<b>Manda ${esc(ev.manda.frase)}</b>: ${R.pct(ev.manda.u)} de lo que da el modelo. Los demás ejes de rendimiento van en ${otros.map((e) => `${esc(e.frase)} ${R.pct(e.u)}`).join(', ')}. Subir de gama por un eje que no es el que limita no compra nada.`);
    }
    for (const nombre of ev.sinComprobar) flags.push(`<b class="warn">${esc(nombre)} sin dato:</b> el catálogo no trae esa cifra del ${esc(m.id)}, así que ese eje <b>no se comprobó</b>.`);
    if (s.software.inspeccion === 'proxy') flags.push('<b class="warn">Modo proxy:</b> las cifras publicadas son de flow y Fortinet no publica cuánto caen; validar con PoC.');
    if (s.politica.techoPct < 100) flags.push(`Los ejes de rendimiento se comparan contra un <b>techo del ${s.politica.techoPct} %</b> de la cifra publicada: una política, no una cifra de Fortinet.`);
    const headroom = d && c.soporta ? Math.round((1 - d.effectiveNeed / c.soporta) * 100) : null;
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">`
      + (d ? `<li>Requerimiento <b>${fmt(d.effectiveNeed)}</b> en capa <b>${esc(TIER_BY_K[d.capa.k].n)}</b>${d.escenario !== 'normal' ? ` (escenario «${esc((r.escenarios.find((x) => x.id === d.escenario) || {}).n || d.escenario)}»)` : ''}; este modelo soporta hasta <b>${fmt(c.soporta)}</b> en este escenario${headroom != null ? ` — holgura ${headroom} %` : ''}.</li>` : '')
      + (d && d.capa.elevada ? `<li><b class="warn">Capa elevada:</b> elegiste <b>${esc(TIER_BY_K[s.seguridad.capa].n)}</b>, pero ${d.capa.elevan.map((f) => esc(f.n)).join(' y ')} obliga${d.capa.elevan.length > 1 ? 'n' : ''} a dimensionar contra <b>${esc(TIER_BY_K[d.capa.k].n)}</b>.</li>` : '')
      + `<li>Sesiones concurrentes: <b>${nMil(m.sess)}</b> | Sesiones nuevas/s: <b>${m.cps != null ? cifra(m.cps) : '<span class="warn">sin dato</span>'}</b> | Inspección SSL: <b>${m.ssl != null ? fmt(m.ssl) : '<span class="warn">sin dato</span>'}</b> | Interfaces: ${esc(m.ifaces)}</li>`
      + flags.map((f) => `<li>${f}</li>`).join('')
      + '</ul>';
  }

  return { RESTRICCION_N, resumenDescartes, fueraDeVentaQueCumplen, licenciaHa, porQueSinCandidato, porQueDe };
});
