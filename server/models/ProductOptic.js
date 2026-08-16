const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductOptic = sequelize.define('ProductOptic', {
  productId: { type: DataTypes.INTEGER, allowNull: false },
  opticCategoryId: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = ProductOptic;
