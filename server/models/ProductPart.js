const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductPart = sequelize.define('ProductPart', {
  productId: { type: DataTypes.INTEGER, allowNull: false },
  partId: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = ProductPart;
