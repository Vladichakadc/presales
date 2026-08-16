const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// code must match the legacy per-file OPTICS keys exactly (e.g. 'ge', 'sfp10', 'sfp1g')
const OpticCategory = sequelize.define('OpticCategory', {
  vendorId: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  label: { type: DataTypes.STRING, allowNull: false },
}, {
  indexes: [{ unique: true, fields: ['vendorId', 'code'] }],
});

module.exports = OpticCategory;
