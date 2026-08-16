const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// DNA tiers (Cisco) / FortiGuard bundles (Fortinet)
const LicenseBundle = sequelize.define('LicenseBundle', {
  vendorId: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  indexes: [{ unique: true, fields: ['vendorId', 'code'] }],
});

module.exports = LicenseBundle;
