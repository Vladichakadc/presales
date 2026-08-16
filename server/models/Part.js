const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// code must match the legacy per-file PARTS keys exactly (e.g. 'RACK', 'CONSOLE', 'NIM-4G-LTE')
const Part = sequelize.define('Part', {
  vendorId: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.STRING, allowNull: true },
}, {
  indexes: [{ unique: true, fields: ['vendorId', 'code'] }],
});

module.exports = Part;
