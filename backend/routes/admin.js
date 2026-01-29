const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Booking = require('../models/Booking');
const { generateToken, verifyStore } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { storeLoginSchema } = require('../validations/auth');
const { createServiceSchema, updateServiceSchema } = require('../validations/service');
const { createStaffSchema, updateStaffSchema } = require('../validations/staff');
const { sendBookingCancellation } = require('../services/notificationService');

// 店家登入
router.post('/login', loginLimiter, validate(storeLoginSchema), async (req, res) => {
  try {
    const { slug, password } = req.body;
    const store = await Store.findOne({ slug, active: true });
    
    if (!store || !(await store.comparePassword(password))) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    const token = generateToken({ id: store._id, role: 'store' });
    res.json({ 
      token, 
      store: {
        id: store._id,
        slug: store.slug,
        name: store.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取得當前登入的店家資訊
router.get('/me', verifyStore, async (req, res) => {
  try {
    const store = req.store.toObject();
    delete store.passwordHash;
    res.json({
      id: store._id,
      slug: store.slug,
      name: store.name,
      role: 'store'
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取得店家資訊
router.get('/store', verifyStore, async (req, res) => {
  try {
    const store = req.store.toObject();
    delete store.passwordHash;
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 更新店家資訊
router.put('/store', verifyStore, async (req, res) => {
  try {
    const { name, address, phone, description, businessHours, holidays } = req.body;
    const store = await Store.findByIdAndUpdate(
      req.store._id,
      { name, address, phone, description, businessHours, holidays },
      { new: true }
    ).select('-passwordHash');
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 服務項目 CRUD
router.get('/services', verifyStore, async (req, res) => {
  try {
    const services = await Service.find({ storeId: req.store._id })
      .sort({ sortOrder: 1, createdAt: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.post('/services', verifyStore, validate(createServiceSchema), async (req, res) => {
  try {
    const { name, description, price, duration, sortOrder } = req.body;
    const service = new Service({
      storeId: req.store._id,
      name,
      description,
      price,
      duration,
      sortOrder
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.put('/services/:id', verifyStore, validate(updateServiceSchema), async (req, res) => {
  try {
    const { name, description, price, duration, sortOrder, active } = req.body;
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, storeId: req.store._id },
      { name, description, price, duration, sortOrder, active },
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ message: '服務不存在' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.delete('/services/:id', verifyStore, async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      storeId: req.store._id
    });
    if (!service) {
      return res.status(404).json({ message: '服務不存在' });
    }
    // 移除人員的此服務關聯
    await Staff.updateMany(
      { storeId: req.store._id },
      { $pull: { services: req.params.id } }
    );
    res.json({ message: '服務已刪除' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 服務人員 CRUD
router.get('/staff', verifyStore, async (req, res) => {
  try {
    const staff = await Staff.find({ storeId: req.store._id })
      .populate('services', 'name')
      .sort({ sortOrder: 1, createdAt: 1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.post('/staff', verifyStore, validate(createStaffSchema), async (req, res) => {
  try {
    const { name, services, sortOrder } = req.body;
    const staff = new Staff({
      storeId: req.store._id,
      name,
      services,
      sortOrder
    });
    await staff.save();
    await staff.populate('services', 'name');
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.put('/staff/:id', verifyStore, validate(updateStaffSchema), async (req, res) => {
  try {
    const { name, services, holidays, sortOrder, active } = req.body;
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, storeId: req.store._id },
      { name, services, holidays, sortOrder, active },
      { new: true }
    ).populate('services', 'name');
    if (!staff) {
      return res.status(404).json({ message: '人員不存在' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.delete('/staff/:id', verifyStore, async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({
      _id: req.params.id,
      storeId: req.store._id
    });
    if (!staff) {
      return res.status(404).json({ message: '人員不存在' });
    }
    res.json({ message: '人員已刪除' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 預約管理
router.get('/bookings', verifyStore, async (req, res) => {
  try {
    const { date, startDate, endDate, status } = req.query;
    const query = { storeId: req.store._id };

    if (status) query.status = status;

    // 支援日期範圍查詢（週檢視、月檢視）
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (date) {
      // 單日查詢
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const bookings = await Booking.find(query)
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name')
      .sort({ date: 1, startTime: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.put('/bookings/:id', verifyStore, async (req, res) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, storeId: req.store._id },
      { status, note },
      { new: true }
    )
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name');

    if (!booking) {
      return res.status(404).json({ message: '預約不存在' });
    }

    // 取消時發送 Email 通知
    if (status === 'cancelled' && booking.customerEmail) {
      sendBookingCancellation(booking, req.store, booking.serviceId, booking.staffId).catch(err => {
        console.error('Send cancellation email error:', err.message);
      });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 統計
router.get('/stats', verifyStore, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.countDocuments({
      storeId: req.store._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const pendingBookings = await Booking.countDocuments({
      storeId: req.store._id,
      status: 'pending'
    });
    const totalServices = await Service.countDocuments({
      storeId: req.store._id,
      active: true
    });
    const totalStaff = await Staff.countDocuments({
      storeId: req.store._id,
      active: true
    });

    res.json({
      todayBookings,
      pendingBookings,
      totalServices,
      totalStaff
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
