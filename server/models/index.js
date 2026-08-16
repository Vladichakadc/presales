const sequelize = require('../config/database');
const Vendor = require('./Vendor');
const Product = require('./Product');
const OpticCategory = require('./OpticCategory');
const Optic = require('./Optic');
const Part = require('./Part');
const ProductOptic = require('./ProductOptic');
const ProductPart = require('./ProductPart');
const SupportTier = require('./SupportTier');
const LicenseBundle = require('./LicenseBundle');
const RoleRecommendation = require('./RoleRecommendation');
const SyncLog = require('./SyncLog');

Vendor.hasMany(Product, { foreignKey: 'vendorId' });
Product.belongsTo(Vendor, { foreignKey: 'vendorId' });

Vendor.hasMany(OpticCategory, { foreignKey: 'vendorId' });
OpticCategory.belongsTo(Vendor, { foreignKey: 'vendorId' });
OpticCategory.hasMany(Optic, { foreignKey: 'opticCategoryId' });
Optic.belongsTo(OpticCategory, { foreignKey: 'opticCategoryId' });

Vendor.hasMany(Part, { foreignKey: 'vendorId' });
Part.belongsTo(Vendor, { foreignKey: 'vendorId' });

Product.belongsToMany(OpticCategory, { through: ProductOptic, foreignKey: 'productId' });
OpticCategory.belongsToMany(Product, { through: ProductOptic, foreignKey: 'opticCategoryId' });

Product.belongsToMany(Part, { through: ProductPart, foreignKey: 'productId' });
Part.belongsToMany(Product, { through: ProductPart, foreignKey: 'partId' });

Vendor.hasMany(SupportTier, { foreignKey: 'vendorId' });
SupportTier.belongsTo(Vendor, { foreignKey: 'vendorId' });

Vendor.hasMany(LicenseBundle, { foreignKey: 'vendorId' });
LicenseBundle.belongsTo(Vendor, { foreignKey: 'vendorId' });

Product.hasMany(RoleRecommendation, { foreignKey: 'productId' });
RoleRecommendation.belongsTo(Product, { foreignKey: 'productId' });

module.exports = {
  sequelize,
  Vendor,
  Product,
  OpticCategory,
  Optic,
  Part,
  ProductOptic,
  ProductPart,
  SupportTier,
  LicenseBundle,
  RoleRecommendation,
  SyncLog,
};
