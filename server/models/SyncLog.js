const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SyncLog = sequelize.define('SyncLog', {
  vendor: { type: DataTypes.STRING, allowNull: false },
  startedAt: { type: DataTypes.DATE, allowNull: false },
  finishedAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'running' },
  itemsFound: { type: DataTypes.INTEGER, allowNull: true },
  itemsAccepted: { type: DataTypes.INTEGER, allowNull: true },
  diffSummary: { type: DataTypes.JSON, allowNull: true },
});

module.exports = SyncLog;
