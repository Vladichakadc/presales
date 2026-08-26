'use strict';
// Panel de usuarios. Solo pinta: quien puede verlo lo decide el servidor (`exige('usuarios')`
// en server.js). Ocultar el enlace en el portal es comodidad, no control de acceso — el
// control esta en la ruta, que es lo unico que un navegador no puede saltarse.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const aviso = (t, s) => { $('aviso').innerHTML = `<div class="msg ${t}">${s}</div>`; };

// Fecha corta y legible; si el dato no viene, se dice, no se inventa un guion ambiguo.
function fecha(iso) {
  if (!iso) return '<span style="color:var(--steel)">—</span>';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return esc(iso);
  return d.toLocaleDateString('es', { year: 'numeric', month: 'short', day: '2-digit' });
}

fetch('/api/usuarios')
  .then((r) => {
    if (r.status === 403) throw new Error('Esta sección es solo para administradores.');
    if (!r.ok) throw new Error('No se pudo cargar la lista de usuarios.');
    return r.json();
  })
  .then((d) => {
    const usuarios = d.usuarios || [];
    $('filas').innerHTML = usuarios.map((u) => `<tr>
      <td class="mono">${esc(u.usuario)}${u.id === d.yo ? ' <span class="pill tu">tú</span>' : ''}</td>
      <td>${esc(u.nombre || '—')}</td>
      <td><span class="pill ${u.rol === 'admin' ? '' : 'consulta'}">${esc(u.rolNombre || u.rol)}</span></td>
      <td>${u.activo ? 'Activo' : '<span class="pill off">Inactivo</span>'}</td>
      <td class="mono">${fecha(u.creado)}</td>
      <td class="mono">${u.actualizado ? fecha(u.actualizado) : '<span class="pill off">sin cambiar</span>'}</td>
    </tr>`).join('') || '<tr><td colspan="6">No hay usuarios registrados.</td></tr>';

    const roles = d.roles || {};
    $('roles').innerHTML = Object.keys(roles).map((k) => {
      const r = roles[k];
      const activos = Object.keys(r.permisos || {}).filter((p) => r.permisos[p]);
      const enUso = usuarios.filter((u) => u.rol === k).length;
      return `<div class="rol">
        <b>${esc(r.n)} <span class="pill ${k === 'admin' ? '' : 'consulta'}">${esc(k)}</span></b>
        <span>${esc(r.d)}</span>
        <div class="perm">permisos: ${activos.length ? activos.map(esc).join(' · ') : 'ninguno'} &nbsp;|&nbsp; ${enUso} usuario(s)</div>
      </div>`;
    }).join('');

    // Aviso de contrasena semilla: mientras siga la de AUTH_PASSWORD, la conoce quien haya
    // visto las variables del despliegue.
    const semilla = usuarios.filter((u) => u.desdeSemilla);
    if (semilla.length) {
      aviso('info', `<b>${semilla.map((u) => esc(u.usuario)).join(', ')}</b> sigue usando la contraseña inicial del despliegue, `
        + 'que conoce cualquiera con acceso a las variables de Railway. Cámbiala desde <a href="/cuenta">Cuenta</a>.');
    }
  })
  .catch((e) => {
    $('filas').innerHTML = '<tr><td colspan="6">—</td></tr>';
    aviso('err', esc(e.message || 'No se pudo contactar al servidor.'));
  });
