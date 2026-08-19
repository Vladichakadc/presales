require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models');
const seedCatalog = require('./seed/seedCatalog');

const catalogRoutes = require('./routes/catalog');
const cotizadorRoutes = require('./routes/cotizador');
const dimensionadorRoutes = require('./routes/dimensionador');
const guiaRoutes = require('./routes/guia');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 4000;

// Basic Auth para todo el sitio. Es una herramienta interna: publica precios de lista, SKUs
// y márgenes, y expone /api/sync, que acepta subida de archivos y consume la API de
// Anthropic con la clave del proyecto. Nada de eso puede quedar abierto en una URL pública.
//
// Si no hay credenciales configuradas la protección se desactiva, para no estorbar en
// desarrollo local — pero en producción eso se avisa por consola al arrancar.
const AUTH_USER = process.env.BASIC_AUTH_USER;
const AUTH_PASS = process.env.BASIC_AUTH_PASS;

// Se comparan digests en lugar de las cadenas crudas: timingSafeEqual exige buffers del
// mismo tamaño, y compararlas directamente filtraría la longitud de la contraseña.
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function basicAuth(req, res, next) {
  if (!AUTH_USER || !AUTH_PASS) return next();
  const [scheme, encoded] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1); // la contraseña puede contener ':'
    if (sep !== -1 && safeEqual(user, AUTH_USER) && safeEqual(pass, AUTH_PASS)) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Presales", charset="UTF-8"');
  return res.status(401).send('Autenticación requerida');
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(basicAuth);

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
  if (process.env.NODE_ENV === 'production' && !(AUTH_USER && AUTH_PASS)) {
    console.warn('[aviso] BASIC_AUTH_USER/BASIC_AUTH_PASS sin configurar: el sitio queda abierto al publico.');
  }
  app.listen(PORT, () => {
    console.log(`Presales corriendo en http://localhost:${PORT}`);
  });
}

start();
