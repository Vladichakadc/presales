const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vendor = sequelize.define('Vendor', {
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  colorHex: { type: DataTypes.STRING, allowNull: true },
  lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
  lastSyncStatus: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Vendor;
