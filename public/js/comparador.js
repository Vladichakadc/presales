'use strict';
/* Comparador de equipos del portal — la definición de QUÉ se compara y CÓMO se resuelve
   cada casilla. El pintado vive en js/index.js; aquí no se toca el DOM, para que las reglas
   se puedan probar sin navegador (mismo patrón que BOM, FICHA y ESTADO).

   POR QUÉ ESTE MÓDULO EXISTE
   El comparador mostraba SEIS filas —serie, segmento, throughput, IPsec, SD-WAN y puertos—
   mientras `/api/catalog` entrega entre 15 y 29 campos por fabricante. No faltaba el dato:
   `buildAll()` lo tiraba al normalizar los ocho catálogos a una forma común mínima. Los
   usuarios dijeron que la información era muy poca y tenían razón.

   TRES ESTADOS POR CASILLA, NO DOS. Es la regla que gobierna todo lo demás:
     · `dato`     — el catálogo lo publica.
     · `sinDato`  — el catálogo NO trae esa cifra para ese modelo. Es el estado por defecto
                    de todo hueco, y dice algo del catálogo, no del equipo.
     · `noAplica` — el concepto no existe para esa CLASE de equipo, y se explica por qué.
                    Las «sesiones nuevas por segundo» no le faltan a un router de transporte
                    Nokia: es que no es un cortafuegos con estado.

   `noAplica` SE DECLARA A MANO, MODELO DE NEGOCIO A MODELO DE NEGOCIO, y nunca se deduce de
   que a un fabricante le falte el campo. La primera versión de este módulo hacía justo eso y
   producía mentiras: decía «IPS: no aplica» de un Catalyst 8300, que hace IPS con Snort desde
   IOS XE — lo que ocurre es que este catálogo no publica esa cifra para Cisco. Confundir «no
   lo tiene» con «no lo tenemos apuntado» es el mismo error que `redund` evita al no leer un
   `undefined` como `false`, y en un comparador es peor, porque descarta un equipo por algo
   que sí sabe hacer.

   LAS CIFRAS DE PORTADA DE DOS FABRICANTES NO SE MIDEN IGUAL, y ponerlas una al lado de la
   otra sin decirlo es el error que este catálogo existe para evitar. El firewall de un
   FortiGate con paquetes grandes, el `fw` de un SRX —que el propio dimensionador Juniper
   deja FUERA de su escala de inspección— y el forwarding de un Cisco son tres mediciones
   distintas. Por eso la fila de portada se rotula como lo que es, las capas honestas van
   debajo, y `avisoBases()` lo advierte en cuanto la comparación mezcla fabricantes. */

(function (global) {
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

  // Mbps a texto. El catálogo mezcla tipos a propósito: un mismo campo llega como número
  // (viene del dimensionador) o como texto ya formateado (viene del catálogo del portal),
  // segun el modelo. Se respeta el texto tal cual en vez de intentar reparsearlo.
  function mbps(v) {
    const n = num(v);
    if (n === null) return null;
    if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} Tbps`;
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 ? 1 : 0)} Gbps`;
    return `${Math.round(n)} Mbps`;
  }
  const miles = (v) => (num(v) === null ? null : Number(v).toLocaleString('es-ES'));

  // Campo que puede venir como número (en Mbps) o como texto ya formateado.
  function capacidad(v) {
    if (typeof v === 'string') return v.trim() || null;
    return mbps(v);
  }

  // Los cinco estados de `redund`, con las mismas palabras que usa la ficha del
  // dimensionador — si dos pantallas del mismo portal dicen lo mismo de dos maneras, la
  // gente deja de fiarse de las dos.
  function redundancia(v) {
    if (v === 'no-aplica') return { estado: 'noAplica', txt: 'Software: la alimentación es la del anfitrión' };
    if (v === 'opcional') return { estado: 'dato', txt: 'Opcional — admite una segunda, no de serie' };
    if (v === true) return { estado: 'dato', txt: 'Sí — de serie' };
    if (v === false) return { estado: 'dato', txt: 'No — fuente única' };
    return { estado: 'sinDato' };
  }

  // Las UNICAS inaplicabilidades que este modulo afirma, cada una con su motivo. Todo lo
  // demas que falte es `sinDato`. Se listan por CLASE de equipo, no por fabricante: un
  // router de transporte no tiene sesiones porque no es un cortafuegos con estado, y eso
  // vale igual para Nokia que para la linea WAN de Huawei.
  const TRANSPORTE = 'Es un router de transporte, no un cortafuegos con estado.';
  const NA = {
    sess: { nokia: TRANSPORTE, hw_wan: TRANSPORTE },
    cps: { nokia: TRANSPORTE, hw_wan: TRANSPORTE },
    tuns: { nokia: TRANSPORTE },
    aps: { nokia: 'No es un controlador de red inalambrica.', hw_wan: 'No es un controlador de red inalambrica.' },
    clients: { nokia: 'No termina clientes: conmuta trafico entre equipos.', hw_wan: 'No termina clientes: conmuta trafico entre equipos.' },
    lvl: { hw_ar: 'Es un nivel de licencia propio de RouterOS.', hw_wan: 'Es un nivel de licencia propio de RouterOS.',
      cisco: 'Es un nivel de licencia propio de RouterOS.', nokia: 'Es un nivel de licencia propio de RouterOS.',
      fortinet: 'Es un nivel de licencia propio de RouterOS.', juniper: 'Es un nivel de licencia propio de RouterOS.',
      aruba: 'Es un nivel de licencia propio de RouterOS.' },
  };

  // Cada fila: `k` clave, `n` etiqueta, `v` como se lee, `mejor` si un valor mayor es
  // preferible, `mismaBase` si esa cifra SOLO es comparable entre equipos del mismo
  // fabricante, `sd` el texto del hueco cuando «sin dato» a secas se leeria mal, y `nota` la
  // letra pequenya que evita que la fila se interprete torcida.
  const SECCIONES = [
    { titulo: 'Identidad', filas: [
      { k: 'ser', n: 'Serie / familia', v: (d) => d.ser || d.fam || d.serie || null },
      { k: 'seg', n: 'Segmento', v: (d) => d.seg || null },
      { k: 'hwSku', n: 'SKU de hardware', v: (d) => d.hwSku || null },
      { k: 'plat', n: 'Plataforma', v: (d) => d.plat || null },
    ] },

    { titulo: 'Rendimiento', nota: 'Cada fabricante mide en una base distinta. La primera fila es la cifra de portada; las de abajo son las que aguanta el equipo con inspección activa.', filas: [
      { k: 'portada', n: 'Firewall / forwarding', mejor: true, mismaBase: true,
        nota: 'Cifra de portada, con paquetes grandes. No sirve para dimensionar con inspección activa.',
        v: (d) => capacidad(d.fw != null ? d.fw : (d.fwd != null ? d.fwd : d.cap)) },
      { k: 'imix', n: 'Tráfico real (IMIX / típico)', mejor: true, mismaBase: true,
        sd: 'este fabricante no publica esa segunda base',
        nota: 'La misma capa medida con una mezcla de tamaños de paquete parecida al tráfico de verdad.',
        v: (d) => capacidad(d.fwImix != null ? d.fwImix : d.typ) },
      { k: 'ipsec', n: 'IPsec VPN', mejor: true, mismaBase: true,
        v: (d) => capacidad(d.vpn != null ? d.vpn : d.ipsec) },
      { k: 'ips', n: 'IPS', mejor: true, mismaBase: true, v: (d) => capacidad(d.ips) },
      { k: 'ngfw', n: 'NGFW', mejor: true, mismaBase: true, v: (d) => capacidad(d.ngfw) },
      { k: 'inspeccion', n: 'Inspección completa', mejor: true, mismaBase: true,
        nota: 'Threat Protection en Fortinet, ATP en Juniper: el stack completo. Es la cifra realista de una sede con seguridad avanzada.',
        v: (d) => capacidad(d.tp != null ? d.tp : d.atp) },
      { k: 'sdwan', n: 'SD-WAN', mejor: true, mismaBase: true,
        v: (d) => (typeof d.sdwan === 'string' ? d.sdwan : capacidad(d.sdwan)) },
      { k: 'mpps', n: 'Reenvío en paquetes', mejor: true, mismaBase: true,
        v: (d) => (num(d.mpps) === null ? null : `${d.mpps} Mpps`) },
    ] },

    { titulo: 'Escala', filas: [
      { k: 'sess', n: 'Sesiones concurrentes', mejor: true,
        v: (d) => miles(d.sess != null ? d.sess : d.fwSess) },
      { k: 'cps', n: 'Sesiones nuevas por segundo', mejor: true,
        nota: 'Mide CPU, no memoria. Es el eje que aprieta antes de lo que parece en perfiles con muchas conexiones cortas.',
        v: (d) => miles(d.cps) },
      { k: 'tuns', n: 'Túneles', mejor: true,
        v: (d) => miles(d.greTuns != null ? d.greTuns : d.ipsecSess) },
      { k: 'aps', n: 'Puntos de acceso gestionados', mejor: true,
        v: (d) => miles(d.aps != null ? d.aps : d.apsMax) },
      { k: 'clients', n: 'Clientes concurrentes', mejor: true, v: (d) => miles(d.clients) },
    ] },

    { titulo: 'Interfaces y expansión', filas: [
      { k: 'ports', n: 'Interfaces', v: (d) => d.ports || d.ifaces || null },
      { k: 'slots', n: 'Ranuras de expansión', v: (d) => {
        if (d.slots) return `${d.slots.cantidad} × ${d.slots.tipo}`;
        const partes = [];
        if (num(d.nim)) partes.push(`${d.nim} NIM`);
        if (num(d.sm)) partes.push(`${d.sm} SM`);
        return partes.length ? partes.join(' + ') : null;
      } },
      { k: 'ru', n: 'Formato', v: (d) => (num(d.ru) === null ? null : `${d.ru}U`) },
      { k: 'poe', n: 'PoE', v: (d) => (d.poe ? 'Sí' : (d.poe === 0 || d.poe === false ? 'No' : null)) },
      { k: 'lte', n: 'LTE integrado', v: (d) => (d.lte === true ? 'Sí' : (d.lte === false ? 'No' : null)) },
    ] },

    { titulo: 'Plataforma', filas: [
      { k: 'cpu', n: 'CPU', v: (d) => d.cpu || null },
      { k: 'cores', n: 'Núcleos', mejor: true, v: (d) => (num(d.cores) === null ? null : String(d.cores)) },
      { k: 'ram', n: 'Memoria', mejor: true, v: (d) => (num(d.ram) === null ? null : `${d.ram} MB`) },
      { k: 'lvl', n: 'Nivel de licencia RouterOS', v: (d) => (d.lvl != null ? `Level ${d.lvl}` : null) },
      { k: 'asic', n: 'Aceleración por hardware', v: (d) => d.asic || null },
      { k: 'protos', n: 'Protocolos', v: (d) => d.protos || null },
    ] },

    { titulo: 'Alimentación eléctrica', filas: [
      { k: 'redund', n: 'Fuente redundante', v: (d) => d.redund, especial: redundancia },
      { k: 'watts', n: 'Consumo típico',
        nota: 'Solo donde el fabricante publica un consumo medio o típico. Una potencia de fuente no es un consumo.',
        v: (d) => (d.psu && num(d.psu.watts) !== null ? `${d.psu.watts} W` : null) },
      { k: 'psuTipo', n: 'Tipo de fuente', v: (d) => (d.psu && d.psu.tipo) || null },
    ] },

    { titulo: 'Ciclo de vida y comercial', filas: [
      { k: 'eol', n: 'Fin de venta', v: (d) => {
        if (!d.eolAnnounced) return null;
        const f = d.eolAnnounced.lastOrder;
        const vencido = f && f <= new Date().toISOString().slice(0, 10);
        return `Último pedido ${f}${vencido ? ' — ya vencido' : ''}`;
      } },
      { k: 'elp', n: 'Precio de lista de referencia', v: (d) => d.elp || null },
    ] },
  ];

  // Resuelve una casilla. `grupo` es el catálogo del que salió el equipo, y es lo que
  // decide si un hueco es «sin dato» o «no aplica».
  function celda(fila, dev) {
    const motivo = NA[fila.k] && NA[fila.k][dev.grupo];
    if (motivo) return { estado: 'noAplica', txt: motivo };
    if (fila.especial) return fila.especial(fila.v(dev.raw));
    const v = fila.v(dev.raw);
    if (v === null || v === undefined || v === '') return { estado: 'sinDato', txt: fila.sd || null };
    return { estado: 'dato', txt: String(v) };
  }

  // Para marcar diferencias hace falta el valor CRUDO, no el texto: «1 Gbps» y «1000 Mbps»
  // son el mismo número escrito de dos formas.
  function crudo(fila, dev) {
    if (NA[fila.k] && NA[fila.k][dev.grupo]) return null;
    const r = dev.raw;
    const cand = {
      portada: r.fw != null ? r.fw : (r.fwd != null ? r.fwd : r.cap),
      imix: r.fwImix != null ? r.fwImix : r.typ,
      ipsec: r.vpn != null ? r.vpn : r.ipsec,
      ips: r.ips, ngfw: r.ngfw,
      inspeccion: r.tp != null ? r.tp : r.atp,
      sdwan: r.sdwan, mpps: r.mpps,
      sess: r.sess != null ? r.sess : r.fwSess,
      cps: r.cps, tuns: r.greTuns != null ? r.greTuns : r.ipsecSess,
      aps: r.aps != null ? r.aps : r.apsMax,
      clients: r.clients, cores: r.cores, ram: r.ram,
    }[fila.k];
    return num(cand);
  }

  // ¿Qué filas tienen algo que decir? Una fila donde ningún equipo trae dato es ruido; con
  // `soloDiferencias` además se ocultan las que dicen lo mismo en todas las columnas.
  function filasVisibles(devs, soloDiferencias) {
    return SECCIONES.map((sec) => {
      const filas = sec.filas.filter((f) => {
        const celdas = devs.map((d) => celda(f, d));
        if (!celdas.some((c) => c.estado === 'dato')) return false;
        if (!soloDiferencias) return true;
        const textos = celdas.map((c) => `${c.estado}:${c.txt || ''}`);
        return new Set(textos).size > 1;
      });
      return { titulo: sec.titulo, nota: sec.nota, filas };
    }).filter((s) => s.filas.length);
  }

  // Índices de las columnas con el valor más alto de la fila, para resaltarlas. Solo cuando
  // hay más de un valor distinto: marcar «el mejor» en un empate no informa de nada.
  function mejores(fila, devs) {
    if (!fila.mejor) return [];
    // Marcar «el mejor» en una fila cuya cifra cada fabricante mide a su manera contradiria
    // el aviso que sale justo encima de la tabla: 24 Gbps de firewall Juniper y 5 Gbps de
    // forwarding Cisco no compiten por lo mismo. Ahi solo se marca dentro de un fabricante.
    if (fila.mismaBase && new Set(devs.map((d) => d.grupo)).size > 1) return [];
    const vals = devs.map((d) => crudo(fila, d));
    const validos = vals.filter((v) => v !== null);
    if (validos.length < 2 || new Set(validos).size < 2) return [];
    const max = Math.max.apply(null, validos);
    return vals.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
  }

  // El aviso que impide leer la tabla como si todas las cifras fueran comparables.
  function avisoBases(devs) {
    const grupos = [...new Set(devs.map((d) => (d.grupo === 'hw_wan' ? 'hw_ar' : d.grupo)))];
    if (grupos.length < 2) return null;
    return 'Estás comparando equipos de fabricantes distintos, y **la cifra de portada de cada uno no se mide igual**: '
      + 'con paquetes grandes en unos, con forwarding puro en otros. Compara por la fila que corresponda al trabajo '
      + 'que va a hacer el equipo —inspección completa si va a inspeccionar— y no por la primera.';
  }

  global.COMPARADOR = { SECCIONES, NA, celda, crudo, filasVisibles, mejores, avisoBases, mbps, capacidad, redundancia };
}(window));
