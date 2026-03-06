const express = require('express');
const router = express.Router();
const SuperAdmin = require('../models/SuperAdmin');
const Store = require('../models/Store');
const Staff = require('../models/Staff');
const Booking = require('../models/Booking');
const ServiceCategory = require('../models/ServiceCategory');
const { generateToken, verifySuperAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { superAdminLoginSchema } = require('../validations/auth');

// 登入
router.post('/login', loginLimiter, validate(superAdminLoginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await SuperAdmin.findOne({ username });
    
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    const token = generateToken({ id: admin._id, role: 'superadmin' });
    res.json({
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: 'superadmin'
      }
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取得當前登入的超級管理員資訊
router.get('/me', verifySuperAdmin, async (req, res) => {
  try {
    const admin = await SuperAdmin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: '找不到管理員' });
    }
    res.json({
      id: admin._id,
      username: admin.username,
      role: 'superadmin'
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取得所有店家
router.get('/stores', verifySuperAdmin, async (req, res) => {
  try {
    const stores = await Store.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 新增店家
router.post('/stores', verifySuperAdmin, async (req, res) => {
  try {
    const { slug, name, password, address, phone } = req.body;
    
    const existing = await Store.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: '此網址代碼已被使用' });
    }

    const store = new Store({
      slug,
      name,
      passwordHash: password,
      address,
      phone
    });
    await store.save();

    const result = store.toObject();
    delete result.passwordHash;
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 更新店家
router.put('/stores/:id', verifySuperAdmin, async (req, res) => {
  try {
    const { name, address, phone, active } = req.body;
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, active },
      { new: true }
    ).select('-passwordHash');

    if (!store) {
      return res.status(404).json({ message: '店家不存在' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 重設店家密碼
router.post('/stores/:id/reset-password', verifySuperAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({ message: '店家不存在' });
    }

    store.passwordHash = password;
    await store.save();
    res.json({ message: '密碼已重設' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取得所有預約
router.get('/bookings', verifySuperAdmin, async (req, res) => {
  try {
    const { storeId, date, status } = req.query;
    const query = {};
    
    if (storeId) query.storeId = storeId;
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const bookings = await Booking.find(query)
      .populate('storeId', 'name slug')
      .populate('serviceId', 'name priceMin priceMax duration')
      .populate('staffId', 'name')
      .sort({ date: -1, startTime: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 更新預約狀態
router.put('/bookings/:id', verifySuperAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, note },
      { new: true }
    )
      .populate('storeId', 'name slug')
      .populate('serviceId', 'name priceMin priceMax duration')
      .populate('staffId', 'name');

    if (!booking) {
      return res.status(404).json({ message: '預約不存在' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 刪除預約
router.delete('/bookings/:id', verifySuperAdmin, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: '預約不存在' });
    }
    res.json({ message: '預約已刪除' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 統計資料
router.get('/stats', verifySuperAdmin, async (req, res) => {
  try {
    const totalStores = await Store.countDocuments();
    const activeStores = await Store.countDocuments({ active: true });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayBookings = await Booking.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    res.json({
      totalStores,
      activeStores,
      todayBookings,
      pendingBookings
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ===== 服務分類管理 =====

// 列出所有分類
router.get('/categories', verifySuperAdmin, async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 新增分類
router.post('/categories', verifySuperAdmin, async (req, res) => {
  try {
    const { name, nameEn, slug, icon, description, sortOrder } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: '請提供分類名稱和代碼' });
    }

    const existing = await ServiceCategory.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return res.status(400).json({ message: '此分類名稱或代碼已存在' });
    }

    const category = new ServiceCategory({ name, nameEn, slug, icon, description, sortOrder });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 更新分類
router.put('/categories/:id', verifySuperAdmin, async (req, res) => {
  try {
    const { name, nameEn, slug, icon, description, sortOrder, active } = req.body;
    const category = await ServiceCategory.findByIdAndUpdate(
      req.params.id,
      { name, nameEn, slug, icon, description, sortOrder, active },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: '分類不存在' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 刪除分類
router.delete('/categories/:id', verifySuperAdmin, async (req, res) => {
  try {
    const category = await ServiceCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: '分類不存在' });
    }
    res.json({ message: '分類已刪除' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ===== 設計師推薦管理 =====

// 切換推薦狀態
router.put('/staff/:id/featured', verifySuperAdmin, async (req, res) => {
  try {
    const { featured } = req.body;
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { featured },
      { new: true }
    ).populate('storeId', 'name slug');
    if (!staff) {
      return res.status(404).json({ message: '設計師不存在' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
