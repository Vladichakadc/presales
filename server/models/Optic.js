const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Optic = sequelize.define('Optic', {
  opticCategoryId: { type: DataTypes.INTEGER, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: true },
  bomCodes: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  description: { type: DataTypes.STRING, allowNull: true },
  // Solo MikroTik lo pobla por ahora: su BOM cotiza las ópticas como línea propia (un
  // CCR2216 son 14 jaulas vacías). Huawei/Cisco las listan por SKU sin precio.
  priceNumeric: { type: DataTypes.FLOAT, allowNull: true },
  // Alcance por tipo de fibra (`alcance` de legacyData: tramos {fibra, m, desde, nota, segunda}),
  // de la tabla de cableado de la ficha de la óptica. Solo Cisco y Meraki lo pueblan por ahora:
  // con él, su dimensionador elige la óptica de cada enlace por la fibra y la distancia del tramo.
  reach: { type: DataTypes.JSON, allowNull: true },
});

module.exports = Optic;
