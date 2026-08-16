const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// role matches guia-diseno-interactiva.html's EQ keys (hub_router, branch_router, dc_switch_leaf, ...)
const RoleRecommendation = sequelize.define('RoleRecommendation', {
  role: { type: DataTypes.STRING, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  altText: { type: DataTypes.STRING, allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = RoleRecommendation;
