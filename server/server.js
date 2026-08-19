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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));

// Se retiro `cors()`: no habia ningun consumidor de otro origen, la API es de mismo origen,
// y una politica abierta solo agrega superficie de ataque.

const PUBLICO = new Set(['/login', '/login.html', '/favicon.ico']);

// Muro de autenticacion. Todo lo que no este en PUBLICO exige sesion valida; las peticiones
// de API responden 401 en JSON y la navegacion se redirige al login conservando el destino.
app.use((req, res, next) => {
  if (PUBLICO.has(req.path) || auth.haySesion(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Sesión requerida' });
  const destino = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?m=sesion&r=${destino}`);
});

app.get('/login', (req, res) => {
  if (auth.haySesion(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  if (auth.intentosRestantes(req) <= 0) {
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera 15 minutos antes de volver a probar.' });
  }
  const { usuario, password } = req.body || {};
  if (typeof usuario !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Faltan credenciales.' });
  }
  if (!auth.comprobarCredenciales(usuario, password)) {
    auth.registrarFallo(req);
    const quedan = auth.intentosRestantes(req);
    // Un solo mensaje para usuario y contrasena erroneos: distinguirlos permitiria
    // enumerar cual de los dos es valido.
    return res.status(401).json({
      error: `Usuario o contraseña incorrectos.${quedan <= 3 ? ` Te quedan ${quedan} intento(s).` : ''}`,
    });
  }
  auth.limpiarIntentos(req);
  auth.ponerCookieSesion(res);
  res.json({ ok: true });
});

app.post('/logout', (req, res) => {
  auth.borrarCookieSesion(res);
  res.json({ ok: true });
});

app.get('/cuenta', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'cuenta.html')));

app.get('/api/cuenta/estado', (req, res) => res.json({ usuario: auth.USER, usandoSemilla: auth.usandoSemilla() }));

app.post('/api/cuenta/password', (req, res) => {
  const { actual, nueva } = req.body || {};
  const r = auth.cambiarPassword(actual, nueva);
  if (!r.ok) return res.status(400).json({ error: r.error });
  auth.borrarCookieSesion(res); // cambiar la clave cierra la sesion: obliga a reautenticarse
  res.json({ ok: true });
});

app.use('/api', catalogRoutes);
app.use('/api', cotizadorRoutes);
app.use('/api', dimensionadorRoutes);
app.use('/api', guiaRoutes);
app.use('/api', syncRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

// eslint-disable-next-line no-unused-vars
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
    const msg = 'AUTH_PASSWORD sin configurar: nadie podra iniciar sesion.';
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn(`[aviso] ${msg}`);
  }
  app.listen(PORT, () => {
    console.log(`Presales corriendo en http://localhost:${PORT}`);
  });
}

start();
