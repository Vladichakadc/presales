'use strict';
const $ = (id) => document.getElementById(id);
const aviso = (t, s) => { $('aviso').innerHTML = `<div class="msg ${t}">${s}</div>`; window.scrollTo(0, 0); };

fetch('/api/cuenta/estado').then(r => r.json()).then(d => {
  if (d && d.usandoSemilla) {
    aviso('info', 'Sigues usando la contraseña inicial que se configuró al desplegar. Conviene cambiarla ahora.');
  }
}).catch(() => {});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if ($('nueva').value !== $('repetir').value) { aviso('err', 'La nueva contraseña y su repetición no coinciden.'); return; }
  $('btn').disabled = true; $('btn').textContent = 'Guardando…';
  try {
    const res = await fetch('/api/cuenta/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actual: $('actual').value, nueva: $('nueva').value }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { location.href = '/login?m=cambiada'; return; }
    aviso('err', d.error || 'No se pudo cambiar la contraseña.');
  } catch {
    aviso('err', 'No se pudo contactar al servidor.');
  }
  $('btn').disabled = false; $('btn').textContent = 'Guardar';
});

$('salir').addEventListener('click', async () => {
  await fetch('/logout', { method: 'POST' }).catch(() => {});
  location.href = '/login?m=salir';
});
