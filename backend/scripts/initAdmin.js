/**
 * 初始化超級管理員帳號
 * 使用方式: node scripts/initAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 檢查是否已存在
    const existing = await SuperAdmin.findOne({ username: ADMIN_USERNAME });
    if (existing) {
      console.log(`Super admin "${ADMIN_USERNAME}" already exists.`);
      process.exit(0);
    }

    // 建立新管理員
    const passwordHash = await SuperAdmin.hashPassword(ADMIN_PASSWORD);
    const admin = new SuperAdmin({
      username: ADMIN_USERNAME,
      passwordHash
    });

    await admin.save();
    console.log(`Super admin created successfully!`);
    console.log(`Username: ${ADMIN_USERNAME}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('\n請立即登入並修改密碼！');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

initAdmin();
