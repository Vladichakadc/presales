'use strict';
// Las tipografías dejan de bloquear el render.
//
// EL PROBLEMA, MEDIDO. Al cronometrar la navegación entre herramientas salieron 12,5
// SEGUNDOS por página. La sospecha razonable era el servidor o la base de datos; la medición
// dijo otra cosa: la API respondía en 7 ms. Lo que costaba los 12,5 s era la hoja de estilos
// de Google Fonts, que el navegador trata como recurso bloqueante y esperaba hasta agotar el
// tiempo de espera. Con esa petición fuera de juego, una navegación completa cuesta entre
// 25 y 95 ms.
//
// POR QUÉ NO ES SOLO UN ARTEFACTO DE ESTE ENTORNO. Aquí lo bloquea la política de egreso,
// pero esto es una herramienta interna que se abre desde redes corporativas, y un proxy que
// bloquee o ralentice dominios de Google es un escenario normal, no exótico. Una página que
// se queda en blanco doce segundos porque no alcanza a un tercero es un fallo de diseño
// aunque el tercero suela responder.
//
// LA SOLUCIÓN, Y POR QUÉ ESTA. El truco habitual —`media="print"` más un `onload` que lo
// cambia a `all`— necesita un manejador en línea, y la CSP de este sitio es `script-src
// 'self'`: no ejecutaría. Así que el mismo efecto se consigue desde aquí, en un script
// externo: se marcan las hojas de fuentes con `media="print"` en el HTML (el navegador las
// descarga sin bloquear el render) y este módulo las devuelve a `all` cuando llegan.
//
// EL TEXTO NUNCA SE QUEDA INVISIBLE. Todas las declaraciones de este sitio llevan ya una
// pila de reserva real —'Barlow', system-ui, sans-serif— así que mientras la fuente web no
// llega se lee con la del sistema y luego cambia. Sin esa pila, esto convertiría un bloqueo
// de render en texto invisible, que es peor.
//
// NO SE PUEDE SERVIR LA FUENTE DESDE AQUÍ, y conviene saber por qué: alojarla en el propio
// servidor sería mejor todavía —una dependencia externa menos— pero descargar los archivos
// exige salida a los dominios de Google, bloqueada en el entorno donde se edita este
// repositorio. Queda anotado en PENDIENTES.md.

(function () {
  const hojas = document.querySelectorAll('link[rel="stylesheet"][data-fuente]');
  hojas.forEach((l) => {
    if (l.media !== 'print') return;
    const activar = () => { l.media = 'all'; };
    // Si ya está cargada (caché), `load` no vuelve a dispararse: se comprueba antes.
    if (l.sheet) activar();
    else {
      l.addEventListener('load', activar, { once: true });
      // Si nunca llega, no pasa nada: la pila de reserva ya está en uso y el atributo se
      // queda en `print`, que es exactamente el estado en que no molesta.
      l.addEventListener('error', () => {}, { once: true });
    }
  });
}());
