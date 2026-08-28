require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');

const auth = require('./auth');
const { sequelize } = require('./models');
const seedCatalog = require('./seed/seedCatalog');

const catalogRoutes = require('./routes/catalog');
const cotizadorRoutes = require('./routes/cotizador');
const dimensionadorRoutes = require('./routes/dimensionador');
const guiaRoutes = require('./routes/guia');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 4000;

// Railway va detras de proxy: sin esto, la IP que ve el limitador de intentos es la del
// proxy y todos los clientes comparten cuota.
app.set('trust proxy', 1);

// Content-Security-Policy. Estuvo desactivada mientras las paginas llevaban su JavaScript
// en bloques <script> en linea y manejadores onclick=, que una politica seria bloquea.
// Ese codigo se movio a /js/*.js y los manejadores a delegacion de eventos, asi que ya se
// puede exigir script-src 'self': un <script> inyectado en el HTML deja de ejecutarse.
//
// style-src conserva 'unsafe-inline' a proposito. Las paginas llevan su hoja de estilos en
// un bloque <style> y usan unos 225 atributos style= en linea; extraerlos seria un refactor
// grande a cambio de poco, porque una inyeccion de CSS es mucho menos peligrosa que una de
// script. Si algun dia se extraen, basta con quitar ese 'unsafe-inline' de aqui.
//
// Los dominios de fabricantes que aparecen en las paginas son enlaces <a href>, no recursos
// que el navegador descargue, por eso no figuran: solo Google Fonts se carga de fuera.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:'],
      'connect-src': ["'self'"],   // todas las llamadas son a /api/* del mismo origen
      'form-action': ["'self'"],   // el formulario de acceso solo puede enviarse aqui
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
    },
  },
}));
app.use(express.json({ limit: '1mb' }));

// Se retiro `cors()`: no habia ningun consumidor de otro origen, la API es de mismo origen,
// y una politica abierta solo agrega superficie de ataque.

// /js/login.js entra aqui por necesidad: es el script de la propia pagina de acceso, asi que
// si quedara detras del muro nadie podria iniciar sesion — la peticion se redirigiria al
// login, el navegador recibiria HTML donde espera JavaScript, y el formulario quedaria
// inerte. No expone nada: solo envia el formulario y pinta el mensaje de error.
// /js/fuentes.js tambien: la pagina de acceso usa las mismas tipografias, y si queda detras
// del muro el navegador recibe HTML donde espera JavaScript y lo rechaza por MIME. No expone
// nada — solo devuelve a `all` una hoja de estilos marcada como `print`.
const PUBLICO = new Set(['/login', '/login.html', '/js/login.js', '/js/fuentes.js', '/favicon.ico']);

// Muro de autenticacion. Todo lo que no este en PUBLICO exige sesion valida; las peticiones
// de API responden 401 en JSON y la navegacion se redirige al login conservando el destino.
app.use((req, res, next) => {
  if (PUBLICO.has(req.path)) return next();
  // El usuario se resuelve UNA vez y viaja en req.usuario: si cada ruta volviera a mirar la
  // cookie, tarde o temprano una se olvidaria de hacerlo.
  const usuario = auth.usuarioDeSesion(req);
  if (usuario) { req.usuario = usuario; return next(); }
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Sesión requerida' });
  const destino = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?m=sesion&r=${destino}`);
});

// Autorizacion por permiso, declarada en usuarios.js. Va aqui y no dentro de cada ruta para
// que anadir una pantalla protegida sea anadir una linea, no recordar un patron.
const exige = (permiso) => (req, res, next) => {
  if (auth.permiso(req.usuario, permiso)) return next();
  if (req.path.startsWith('/api/')) return res.status(403).json({ error: 'No tienes permiso para esta operación.' });
  return res.redirect('/?m=sinpermiso');
};

app.get('/login', (req, res) => {
  if (auth.haySesion(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  // El retardo va antes de cualquier comprobacion: es lo que frena al atacante que rota
  // X-Forwarded-For y por tanto se salta el contador por IP.
  await auth.esperarRetardo();
  if (auth.intentosRestantes(req) <= 0) {
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera 15 minutos antes de volver a probar.' });
  }
  const { usuario, password } = req.body || {};
  if (typeof usuario !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Faltan credenciales.' });
  }
  const autenticado = auth.comprobarCredenciales(usuario, password);
  if (!autenticado) {
    auth.registrarFallo(req);
    const quedan = auth.intentosRestantes(req);
    // Un solo mensaje para usuario y contrasena erroneos: distinguirlos permitiria
    // enumerar cual de los dos es valido.
    return res.status(401).json({
      error: `Usuario o contraseña incorrectos.${quedan <= 3 ? ` Te quedan ${quedan} intento(s).` : ''}`,
    });
  }
  auth.limpiarIntentos(req);
  auth.ponerCookieSesion(res, autenticado);
  console.log(`[auth] acceso concedido · usuario=${autenticado.usuario} · rol=${autenticado.rol}`);
  res.json({ ok: true });
});

app.post('/logout', (req, res) => {
  auth.borrarCookieSesion(res);
  res.json({ ok: true });
});

app.get('/cuenta', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cuenta.html')));

app.get('/api/cuenta/estado', (req, res) => res.json({
  usuario: req.usuario.usuario,
  nombre: req.usuario.nombre,
  rol: req.usuario.rol,
  rolNombre: (auth.ROLES[req.usuario.rol] || {}).n || req.usuario.rol,
  puedeUsuarios: auth.permiso(req.usuario, 'usuarios'),
  usandoSemilla: !!req.usuario.desdeSemilla,
}));

app.post('/api/cuenta/password', (req, res) => {
  const { actual, nueva } = req.body || {};
  // Solo la propia: no hay ruta para que un usuario cambie la contrasena de otro, ni
  // siquiera un administrador. Restablecer a otra persona se hace borrando el archivo de
  // estado, que es una accion con acceso al servidor y deja rastro.
  const r = auth.cambiarPassword(req.usuario.id, actual, nueva);
  if (!r.ok) return res.status(400).json({ error: r.error });
  auth.borrarCookieSesion(res); // cambiar la clave cierra la sesion: obliga a reautenticarse
  res.json({ ok: true });
});

/* ── Usuarios (solo administrador) ───────────────────────────────────────────── */

app.get('/usuarios', exige('usuarios'), (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'usuarios.html')));

app.get('/api/usuarios', exige('usuarios'), (req, res) => res.json({
  usuarios: auth.listarUsuarios(),   // sin hashes: usuarios.js nunca los deja salir
  roles: auth.ROLES,
  yo: req.usuario.id,
}));

// Alta de usuarios: pendiente a peticion del dueno del repo — por ahora solo se usa el
// administrador. Responde 501 en vez de 404 para que quede claro que la ruta esta prevista
// y sin implementar, no que se equivocaron de direccion. Lo que falta no es el formulario
// sino decidir el flujo de la primera contrasena: enviarla por fuera, forzar el cambio en
// el primer acceso, o un enlace de alta con caducidad.
app.post('/api/usuarios', exige('usuarios'), (req, res) => res.status(501).json({
  error: 'La creación de usuarios está pendiente. Hoy la herramienta opera con el usuario administrador.',
}));

// SheetJS para el navegador, servido desde la dependencia que ya usa el sync para leer
// Excel. Las paginas lo cargan solo al pulsar "Exportar a Excel", asi que no pesa en la
// carga inicial. Evita duplicar ~900 KB en public/ y que se desincronice de package.json.
app.get('/vendor/xlsx.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(require.resolve('xlsx/dist/xlsx.full.min.js'));
});

// headroom.js: oculta/muestra un encabezado fijo segun el sentido del scroll. Mismo patron
// que xlsx.js — se sirve desde la dependencia instalada en vez de duplicar el archivo en
// public/, asi que la version vive en un solo sitio (package.json).
app.get('/vendor/headroom.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(require.resolve('headroom.js/dist/headroom.js'));
});

app.use('/api', catalogRoutes);
app.use('/api', cotizadorRoutes);
app.use('/api', dimensionadorRoutes);
app.use('/api', guiaRoutes);
app.use('/api', syncRoutes);

// El dimensionador de Huawei se llamaba dimensionador-bom-huawei-v3_1.html: un resto del
// versionado informal anterior a git. Renombrarlo sin mas romperia los enlaces que ya estan
// pegados en chats y guardados en marcadores —y esta herramienta existe justo para pasarse
// escenarios por enlace, asi que romperlos no es un detalle. Se redirige conservando el
// querystring, que es donde viaja el escenario: sin eso, el enlace llegaria a la pagina
// correcta con los parametros por defecto, que es peor que un 404 porque no se nota.
const RENOMBRADAS = new Map([
  ['/dimensionador-bom-huawei-v3_1.html', '/dimensionador-huawei-netengine.html'],
  ['/js/dimensionador-bom-huawei-v3_1.js', '/js/dimensionador-huawei-netengine.js'],
]);
app.get([...RENOMBRADAS.keys()], (req, res) => {
  const destino = RENOMBRADAS.get(req.path);
  const qs = req.originalUrl.slice(req.path.length);
  res.redirect(301, destino + qs);
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function start() {
  await sequelize.sync();
  await seedCatalog();
  // Sin contrasena no se puede autenticar a nadie: se falla cerrado en produccion en lugar
  // de arrancar un sitio con precios abierto al publico.
  if (!auth.hashVigente()) {
    const msg = 'Sin administrador utilizable (falta AUTH_PASSWORD o el archivo de usuarios): nadie podra iniciar sesion.';
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn(`[aviso] ${msg}`);
  }
  app.listen(PORT, () => {
    console.log(`Presales corriendo en http://localhost:${PORT}`);
  });
}

start();
