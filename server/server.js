require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models');
const seedCatalog = require('./seed/seedCatalog');

const catalogRoutes = require('./routes/catalog');
const cotizadorRoutes = require('./routes/cotizador');
const dimensionadorRoutes = require('./routes/dimensionador');
const guiaRoutes = require('./routes/guia');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.use('/api', catalogRoutes);
app.use('/api', cotizadorRoutes);
app.use('/api', dimensionadorRoutes);
app.use('/api', guiaRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function start() {
  await sequelize.sync();
  await seedCatalog();
  app.listen(PORT, () => {
    console.log(`Presales corriendo en http://localhost:${PORT}`);
  });
}

start();
