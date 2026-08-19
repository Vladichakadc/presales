const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Optic = sequelize.define('Optic', {
  opticCategoryId: { type: DataTypes.INTEGER, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: true },
  bomCodes: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  description: { type: DataTypes.STRING, allowNull: true },
  // Solo MikroTik lo pobla por ahora: su BOM cotiza las ópticas como línea propia (un
  // CCR2216 son 14 jaulas vacías). Huawei/Cisco las listan por SKU sin precio.
  priceNumeric: { type: DataTypes.FLOAT, allowNull: true },
});

module.exports = Optic;
