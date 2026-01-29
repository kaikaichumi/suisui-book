require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');

async function initSuperAdmin() {
  try {
    // 連接資料庫
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // 檢查是否已存在
    const existing = await SuperAdmin.findOne({ username: process.env.ADMIN_USERNAME });

    if (existing) {
      console.log('SuperAdmin already exists, updating password...');
      existing.passwordHash = process.env.ADMIN_PASSWORD;
      await existing.save();
      console.log('Password updated!');
    } else {
      // 建立新的 SuperAdmin
      const admin = new SuperAdmin({
        username: process.env.ADMIN_USERNAME,
        passwordHash: process.env.ADMIN_PASSWORD
      });
      await admin.save();
      console.log('SuperAdmin created successfully!');
    }

    console.log('Username:', process.env.ADMIN_USERNAME);
    console.log('Password:', process.env.ADMIN_PASSWORD);

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initSuperAdmin();
