/**
 * 建立 Super Admin 帳號的腳本
 *
 * 使用方式：
 *   node scripts/seed-superadmin.js
 *
 * 或指定帳密：
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=mypassword node scripts/seed-superadmin.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('錯誤：請設定 MONGODB_URI 環境變數')
  process.exit(1)
}

// Super Admin Schema (簡化版)
const superAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema)

async function seed() {
  try {
    console.log('連接到 MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('連接成功！')

    // 預設帳密
    const email = process.env.ADMIN_EMAIL || 'admin@suisui.com'
    const password = process.env.ADMIN_PASSWORD || 'Admin123!'
    const name = process.env.ADMIN_NAME || '系統管理員'

    // 檢查是否已存在
    const existing = await SuperAdmin.findOne({ email })
    if (existing) {
      console.log(`\n⚠️  Super Admin 已存在：${email}`)
      console.log('如需重設密碼，請直接在資料庫修改或刪除後重新執行此腳本')
      process.exit(0)
    }

    // 建立帳號
    const hashedPassword = await bcrypt.hash(password, 10)
    const admin = await SuperAdmin.create({
      email,
      password: hashedPassword,
      name
    })

    console.log('\n✅ Super Admin 建立成功！')
    console.log('─'.repeat(40))
    console.log(`📧 Email:    ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👤 Name:     ${name}`)
    console.log('─'.repeat(40))
    console.log('\n請立即登入並修改密碼！')
    console.log('登入網址：https://你的網域/superadmin/login')

  } catch (error) {
    console.error('錯誤：', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n已斷開 MongoDB 連線')
  }
}

seed()
