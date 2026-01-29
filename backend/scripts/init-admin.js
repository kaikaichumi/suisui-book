require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await SuperAdmin.findOne({ username: ADMIN_USERNAME });
    if (existing) {
      console.log(`SuperAdmin "${ADMIN_USERNAME}" already exists.`);
      process.exit(0);
    }

    const admin = new SuperAdmin({
      username: ADMIN_USERNAME,
      passwordHash: ADMIN_PASSWORD
    });
    await admin.save();

    console.log(`SuperAdmin created successfully!`);
    console.log(`Username: ${ADMIN_USERNAME}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`\nPlease change the password after first login.`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

initAdmin();
