const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Hi-Care (Huawei) / SmartNet (Cisco) / FortiCare (Fortinet) support tiers
const SupportTier = sequelize.define('SupportTier', {
  vendorId: { type: DataTypes.INTEGER, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  sla: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  indexes: [{ unique: true, fields: ['vendorId', 'code'] }],
});

module.exports = SupportTier;
