const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Optic = sequelize.define('Optic', {
  opticCategoryId: { type: DataTypes.INTEGER, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: true },
  bomCodes: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  description: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Optic;
