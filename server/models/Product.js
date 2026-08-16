const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  vendorId: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  series: { type: DataTypes.STRING, allowNull: true },
  specs: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  specSummary: { type: DataTypes.TEXT, allowNull: true },
  priceDisplay: { type: DataTypes.STRING, allowNull: true },
  priceNumeric: { type: DataTypes.FLOAT, allowNull: true },
  eol: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sourceUrl: { type: DataTypes.STRING, allowNull: true },
  lastVerifiedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  indexes: [{ unique: true, fields: ['vendorId', 'model'] }],
});

module.exports = Product;
