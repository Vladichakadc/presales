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

function renderFilas(usuarios, yo) {
  $('filas').innerHTML = usuarios.map((u) => `<tr>
    <td class="mono">${esc(u.usuario)}${u.id === yo ? ' <span class="pill tu">tú</span>' : ''}</td>
    <td>${esc(u.nombre || '—')}</td>
    <td><span class="pill ${u.rol === 'admin' ? '' : 'consulta'}">${esc(u.rolNombre || u.rol)}</span></td>
    <td>${u.activo ? 'Activo' : '<span class="pill off">Inactivo</span>'}</td>
    <td class="mono">${fecha(u.creado)}</td>
    <td class="mono">${u.debeCambiar
      ? '<span class="pill off" title="Aún no completó el primer acceso">cambio pendiente</span>'
      : (u.actualizado ? fecha(u.actualizado) : '<span class="pill off">sin cambiar</span>')}</td>
  </tr>`).join('') || '<tr><td colspan="6">No hay usuarios registrados.</td></tr>';
}

function cargar() {
  return fetch('/api/usuarios')
    .then((r) => {
      if (r.status === 403) throw new Error('Esta sección es solo para administradores.');
      if (!r.ok) throw new Error('No se pudo cargar la lista de usuarios.');
      return r.json();
    })
    .then((d) => {
      const usuarios = d.usuarios || [];
      renderFilas(usuarios, d.yo);

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

      const selectRol = $('altaRol');
      if (selectRol && !selectRol.options.length) {
        // El rol menos privilegiado va primero en el desplegable: dar de alta a un
        // administrador es una eleccion deliberada, nunca la opcion que queda seleccionada
        // por defecto al no tocar nada.
        const orden = Object.keys(roles).sort((a) => (a === 'admin' ? 1 : -1));
        selectRol.innerHTML = orden.map((k) => `<option value="${esc(k)}">${esc(roles[k].n)} (${esc(k)})</option>`).join('');
      }

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
}

cargar();

// Alta de usuarios. La contrasena la genera el servidor y viaja UNA sola vez en esta
// respuesta: se pinta en pantalla con boton de copiar y no se vuelve a poder recuperar, ni
// aqui ni en ningun log. Copiar no se apoya en que el portapapeles funcione — el texto va
// tambien seleccionable en un <code> para transcribirlo a mano si el navegador lo bloquea.
$('formAlta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btnAlta');
  const datos = {
    usuario: $('altaUsuario').value.trim(),
    nombre: $('altaNombre').value.trim(),
    rol: $('altaRol').value,
  };
  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Creando…';
  $('resultadoAlta').innerHTML = '';
  try {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      aviso('err', esc(d.error || 'No se pudo crear el usuario.'));
    } else {
      $('formAlta').reset();
      $('resultadoAlta').innerHTML = `<div class="revelado">
        <b>Usuario <span class="mono">${esc(d.usuario.usuario)}</span> creado.</b>
        <p class="txt" style="margin:6px 0 0">Esta es la única vez que se muestra la contraseña temporal. Cópiala y comunícala por un canal distinto a este panel — la cuenta exigirá cambiarla en el primer acceso.</p>
        <div class="clave">
          <code id="claveTemporal">${esc(d.passwordTemporal)}</code>
          <button class="btn" type="button" id="btnCopiarClave">Copiar</button>
        </div>
      </div>`;
      $('btnCopiarClave').addEventListener('click', async () => {
        const boton = $('btnCopiarClave');
        try {
          await navigator.clipboard.writeText(d.passwordTemporal);
          boton.textContent = 'Copiada';
        } catch {
          boton.textContent = 'Selecciónala arriba';
        }
        setTimeout(() => { boton.textContent = 'Copiar'; }, 2500);
      });
      cargar();
    }
  } catch {
    aviso('err', 'No se pudo contactar al servidor.');
  }
  btn.disabled = false;
  btn.textContent = textoOriginal;
});
