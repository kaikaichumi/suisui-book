const express = require('express');
const router = express.Router();
const { Store, Service, Staff, Booking } = require('../models');
const validate = require('../middleware/validate');
const { createBookingSchema, cancelBookingSchema, queryBookingsSchema } = require('../validations/booking');
const { bookingLimiter } = require('../middleware/rateLimit');
const { optionalCustomerAuth } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../services/notificationService');

// ===== 店家公開資訊 =====

// 取得店家資訊
router.get('/stores/:slug', async (req, res) => {
  try {
    const store = await Store.findOne({
      slug: req.params.slug.toLowerCase(),
      active: true
    }).select('name address phone description businessHours');

    if (!store) {
      return res.status(404).json({ message: '找不到此店家' });
    }

    res.json(store);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取得店家服務列表
router.get('/stores/:slug/services', async (req, res) => {
  try {
    const store = await Store.findOne({
      slug: req.params.slug.toLowerCase(),
      active: true
    });

    if (!store) {
      return res.status(404).json({ message: '找不到此店家' });
    }

    const services = await Service.find({
      storeId: store._id,
      active: true
    }).select('name description price duration').sort({ sortOrder: 1 });

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取得可提供特定服務的人員列表
router.get('/stores/:slug/services/:serviceId/staff', async (req, res) => {
  try {
    const store = await Store.findOne({
      slug: req.params.slug.toLowerCase(),
      active: true
    });

    if (!store) {
      return res.status(404).json({ message: '找不到此店家' });
    }

    const staff = await Staff.find({
      storeId: store._id,
      services: req.params.serviceId,
      active: true
    }).select('name').sort({ sortOrder: 1 });

    res.json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ===== 預約時段查詢 =====

// 取得可用時段
router.get('/stores/:slug/available-slots', async (req, res) => {
  try {
    const { serviceId, staffId, date } = req.query;

    if (!serviceId || !staffId || !date) {
      return res.status(400).json({ message: '請提供 serviceId, staffId, date' });
    }

    const store = await Store.findOne({
      slug: req.params.slug.toLowerCase(),
      active: true
    });

    if (!store) {
      return res.status(404).json({ message: '找不到此店家' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: '找不到此服務' });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: '找不到此服務人員' });
    }

    // 取得該日期的營業時間
    const dateObj = new Date(date);
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()];
    const businessHour = store.businessHours[dayOfWeek];

    if (businessHour.closed) {
      return res.json({ slots: [], message: '該日公休' });
    }

    // 檢查是否為店家公休日
    const isStoreHoliday = store.holidays.some(h =>
      new Date(h).toDateString() === dateObj.toDateString()
    );
    if (isStoreHoliday) {
      return res.json({ slots: [], message: '該日公休' });
    }

    // 檢查是否為員工休假日
    const isStaffHoliday = staff.holidays.some(h =>
      new Date(h).toDateString() === dateObj.toDateString()
    );
    if (isStaffHoliday) {
      return res.json({ slots: [], message: '該服務人員當日休假' });
    }

    // 產生所有可能的時段（30分鐘為單位）
    const slots = generateTimeSlots(businessHour.open, businessHour.close);

    // 取得該日該人員的所有預約
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });

    // 計算已被佔用的時段
    const occupiedSlots = new Set();
    bookings.forEach(booking => {
      const slots = getOccupiedSlots(booking.startTime, booking.endTime);
      slots.forEach(s => occupiedSlots.add(s));
    });

    // 過濾出可用時段（需要連續足夠的時段給服務時長使用）
    const serviceDuration = service.duration;
    const slotsNeeded = serviceDuration / 30;

    const availableSlots = slots.filter((slot, index) => {
      // 檢查從此時段開始，是否有足夠的連續時段
      for (let i = 0; i < slotsNeeded; i++) {
        const checkSlot = slots[index + i];
        if (!checkSlot || occupiedSlots.has(checkSlot)) {
          return false;
        }
      }

      // 檢查結束時間不超過營業時間
      const endSlotIndex = index + slotsNeeded - 1;
      if (endSlotIndex >= slots.length) {
        return false;
      }

      return true;
    });

    // 過濾掉已過去的時段（如果是今天）
    const now = new Date();
    const filteredSlots = availableSlots.filter(slot => {
      if (dateObj.toDateString() === now.toDateString()) {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date(dateObj);
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime > now;
      }
      return true;
    });

    res.json({ slots: filteredSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ===== 預約功能 =====

// 建立預約
router.post('/stores/:slug/bookings', bookingLimiter, optionalCustomerAuth, validate(createBookingSchema), async (req, res) => {
  try {
    const { serviceId, staffId, date, startTime, customerName, customerPhone } = req.body;

    if (!serviceId || !staffId || !date || !startTime || !customerName || !customerPhone) {
      return res.status(400).json({ message: '請填寫所有必要欄位' });
    }

    const store = await Store.findOne({
      slug: req.params.slug.toLowerCase(),
      active: true
    });

    if (!store) {
      return res.status(404).json({ message: '找不到此店家' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.active) {
      return res.status(404).json({ message: '找不到此服務' });
    }

    const staff = await Staff.findById(staffId);
    if (!staff || !staff.active) {
      return res.status(404).json({ message: '找不到此服務人員' });
    }

    // 計算結束時間
    const endTime = calculateEndTime(startTime, service.duration);

    // 檢查時段是否可用
    const dateObj = new Date(date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    });

    // 檢查是否有時段衝突
    const requestedSlots = getOccupiedSlots(startTime, endTime);
    const occupiedSlots = new Set();
    existingBookings.forEach(booking => {
      const slots = getOccupiedSlots(booking.startTime, booking.endTime);
      slots.forEach(s => occupiedSlots.add(s));
    });

    const hasConflict = requestedSlots.some(s => occupiedSlots.has(s));
    if (hasConflict) {
      return res.status(400).json({ message: '此時段已被預約' });
    }

    // 建立預約
    const booking = new Booking({
      storeId: store._id,
      serviceId,
      staffId,
      customerName,
      customerPhone,
      customerEmail: req.body.customerEmail || '',
      customerId: req.customer?._id || null,
      date: dateObj,
      startTime,
      endTime,
      status: 'pending'
    });

    await booking.save();

    // 非同步發送預約確認 Email
    if (booking.customerEmail) {
      sendBookingConfirmation(booking, store, service, staff).catch(err => {
        console.error('Send confirmation email error:', err.message);
      });
    }

    res.status(201).json({
      message: '預約成功',
      booking: {
        id: booking._id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 查詢我的預約
router.get('/stores/:slug/my-bookings', optionalCustomerAuth, async (req, res) => {
  try {
    const { phone } = req.query;

    const store = await Store.findOne({
      slug: req.params.slug.toLowerCase(),
      active: true
    });

    if (!store) {
      return res.status(404).json({ message: '找不到此店家' });
    }

    const query = { storeId: store._id };

    // 已登入顧客可直接查詢，不需手機號碼
    if (req.customer) {
      query.customerId = req.customer._id;
    } else if (phone) {
      query.customerPhone = phone;
    } else {
      return res.status(400).json({ message: '請提供手機號碼' });
    }

    const bookings = await Booking.find(query)
      .populate('serviceId', 'name priceMin priceMax duration')
      .populate('staffId', 'name')
      .sort({ date: -1, startTime: -1 })
      .limit(20);

    res.json(bookings);
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 取消預約
router.post('/stores/:slug/bookings/:id/cancel', validate(cancelBookingSchema), async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: '請提供手機號碼以驗證身分' });
    }

    const store = await Store.findOne({
      slug: req.params.slug.toLowerCase(),
      active: true
    });

    if (!store) {
      return res.status(404).json({ message: '找不到此店家' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      storeId: store._id,
      customerPhone: phone
    });

    if (!booking) {
      return res.status(404).json({ message: '找不到此預約' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: '此預約已取消' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: '預約已取消' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ===== 輔助函數 =====

// 產生時段列表
function generateTimeSlots(open, close) {
  const slots = [];
  const [openHour, openMin] = open.split(':').map(Number);
  const [closeHour, closeMin] = close.split(':').map(Number);

  let currentHour = openHour;
  let currentMin = openMin;

  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
}

// 計算結束時間
function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// 取得佔用的時段列表
function getOccupiedSlots(startTime, endTime) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
}

module.exports = router;
