const path = require('path');
const { Sequelize } = require('sequelize');

const storage =
  process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

module.exports = sequelize;
