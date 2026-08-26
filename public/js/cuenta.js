'use strict';
const $ = (id) => document.getElementById(id);
const aviso = (t, s) => { $('aviso').innerHTML = `<div class="msg ${t}">${s}</div>`; window.scrollTo(0, 0); };

fetch('/api/cuenta/estado').then(r => r.json()).then(d => {
  if (!d) return;
  $('miUsuario').textContent = d.usuario || '—';
  $('miRol').textContent = d.rolNombre || d.rol || '—';
  // El enlace se muestra segun el permiso que informa el servidor. Ocultarlo es comodidad:
  // quien lo teclee sin permiso se topa igualmente con el 403 de la ruta.
  if (d.puedeUsuarios) $('enlaceAdmin').style.display = '';
  if (d.usandoSemilla) {
    aviso('info', 'Sigues usando la contraseña inicial que se configuró al desplegar. La conoce cualquiera con acceso a las variables del despliegue: conviene cambiarla ahora.');
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
