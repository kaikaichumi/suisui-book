/**
 * Phase 1 遷移腳本
 * 為現有資料加上新欄位預設值，並建立初始 ServiceCategory 種子資料
 *
 * 使用方式: node scripts/migrate-phase1.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const fs = require('fs');
const logFile = path.join(__dirname, '..', 'migrate.log');
function log(msg) { console.log(msg); fs.appendFileSync(logFile, msg + '\n'); }

async function migrate() {
  fs.writeFileSync(logFile, 'Script started\n');
  fs.appendFileSync(logFile, `MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'MISSING'}\n`);
  await connectDB();
  log('開始 Phase 1 遷移...\n');

  const Store = require('../models/Store');
  const Staff = require('../models/Staff');
  const ServiceCategory = require('../models/ServiceCategory');

  // 1. 為所有現有 Store 加上 location 欄位
  const storeResult = await Store.updateMany(
    { 'location.type': { $exists: false } },
    {
      $set: {
        location: { type: 'Point', coordinates: [0, 0] },
        coverImage: '',
        categories: [],
        notificationSettings: {
          newBooking: { email: true, line: false },
          cancellation: { email: true, line: false }
        }
      }
    }
  );
  log(`✓ 更新 ${storeResult.modifiedCount} 家店家 (加入 location, notificationSettings)`);

  // 2. 為所有現有 Staff 加上新欄位
  const staffResult = await Staff.updateMany(
    { discoverable: { $exists: false } },
    {
      $set: {
        avatar: '',
        bio: '',
        specialties: [],
        categories: [],
        socialLinks: { instagram: '', facebook: '', line: '' },
        rating: { average: 0, count: 0 },
        featured: false,
        discoverable: true
      }
    }
  );
  log(`✓ 更新 ${staffResult.modifiedCount} 位設計師 (加入個人檔案欄位)`);

  // 3. 建立初始 ServiceCategory 種子資料
  const seedCategories = [
    { name: '美髮', nameEn: 'Hair', slug: 'hair', icon: '💇', description: '剪髮、染髮、燙髮、護髮', sortOrder: 1 },
    { name: '美甲', nameEn: 'Nails', slug: 'nails', icon: '💅', description: '指甲彩繪、凝膠甲、美甲護理', sortOrder: 2 },
    { name: '美睫', nameEn: 'Lashes', slug: 'lashes', icon: '👁️', description: '睫毛嫁接、睫毛燙', sortOrder: 3 },
    { name: '護膚', nameEn: 'Skincare', slug: 'skincare', icon: '✨', description: '臉部保養、清潔、煥膚', sortOrder: 4 },
    { name: '美體按摩', nameEn: 'Massage', slug: 'massage', icon: '💆', description: '全身按摩、精油SPA、舒壓', sortOrder: 5 },
    { name: '紋繡', nameEn: 'Microblading', slug: 'microblading', icon: '✏️', description: '飄眉、霧眉、紋唇', sortOrder: 6 }
  ];

  let createdCount = 0;
  for (const cat of seedCategories) {
    const exists = await ServiceCategory.findOne({ slug: cat.slug });
    if (!exists) {
      await ServiceCategory.create(cat);
      createdCount++;
    }
  }
  log(`✓ 建立 ${createdCount} 個服務分類 (共 ${seedCategories.length} 個)`);

  // 4. 遷移 Service: price → priceMin (向後相容)
  const Service = require('../models/Service');
  const serviceResult = await Service.updateMany(
    { priceMin: { $exists: false }, price: { $exists: true } },
    [{ $set: { priceMin: '$price' } }]
  );
  log(`✓ 遷移 ${serviceResult.modifiedCount} 個服務項目 (price → priceMin)`);

  // 清理舊的 price 欄位（改由 virtual 提供）
  await Service.updateMany(
    { price: { $exists: true } },
    { $unset: { price: '' } }
  );
  log('✓ 清理舊 price 欄位');

  log('\n遷移完成！');
  process.exit(0);
}

migrate().catch(err => {
  console.error('遷移失敗:', err);
  process.exit(1);
});
