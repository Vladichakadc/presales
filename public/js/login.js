'use strict';
const $ = (id) => document.getElementById(id);

function aviso(tipo, texto) {
  $('aviso').innerHTML = `<div class="msg ${tipo}">${texto}</div>`;
}

// Mensajes que llegan por query string tras un redirect del servidor.
const params = new URLSearchParams(location.search);
if (params.get('m') === 'sesion') aviso('info', 'Tu sesión expiró. Vuelve a entrar.');
if (params.get('m') === 'salir') aviso('ok', 'Cerraste sesión correctamente.');
if (params.get('m') === 'cambiada') aviso('ok', 'Contraseña actualizada. Entra con la nueva.');

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('btn').disabled = true;
  $('btn').textContent = 'Verificando…';
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: $('usuario').value, password: $('password').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { location.href = params.get('r') || '/'; return; }
    aviso('err', data.error || 'No fue posible iniciar sesión.');
  } catch {
    aviso('err', 'No se pudo contactar al servidor. Revisa tu conexión.');
  }
  $('password').value = '';
  $('btn').disabled = false;
  $('btn').textContent = 'Entrar';
});
