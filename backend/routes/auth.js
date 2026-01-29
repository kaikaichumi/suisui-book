const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Customer } = require('../models');
const { generateToken, verifyCustomer } = require('../middleware/auth');

// LINE OAuth callback
router.post('/line/callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ message: '缺少授權碼' });
    }

    // 用 code 換取 access token
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || process.env.LINE_CALLBACK_URL,
      client_id: process.env.LINE_CHANNEL_ID,
      client_secret: process.env.LINE_CHANNEL_SECRET
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    // 取得 LINE 用戶資料
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { userId, displayName, pictureUrl } = profileResponse.data;

    // 建立或更新顧客
    let customer = await Customer.findOne({ lineUserId: userId });
    if (!customer) {
      customer = new Customer({
        lineUserId: userId,
        displayName,
        pictureUrl: pictureUrl || '',
        name: displayName
      });
      await customer.save();
    } else {
      customer.displayName = displayName;
      if (pictureUrl) customer.pictureUrl = pictureUrl;
      await customer.save();
    }

    // 產生 JWT
    const token = generateToken({ id: customer._id, role: 'customer' });

    res.json({
      token,
      customer: {
        id: customer._id,
        name: customer.name || customer.displayName,
        displayName: customer.displayName,
        pictureUrl: customer.pictureUrl,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    console.error('LINE login error:', error.response?.data || error.message);
    res.status(500).json({ message: 'LINE 登入失敗' });
  }
});

// 取得當前顧客資訊
router.get('/me', verifyCustomer, async (req, res) => {
  try {
    res.json({
      id: req.customer._id,
      name: req.customer.name || req.customer.displayName,
      displayName: req.customer.displayName,
      pictureUrl: req.customer.pictureUrl,
      email: req.customer.email,
      phone: req.customer.phone,
      role: 'customer'
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 更新顧客資訊
router.put('/me', verifyCustomer, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (name !== undefined) req.customer.name = name;
    if (email !== undefined) req.customer.email = email;
    if (phone !== undefined) req.customer.phone = phone;

    await req.customer.save();

    res.json({
      id: req.customer._id,
      name: req.customer.name || req.customer.displayName,
      displayName: req.customer.displayName,
      pictureUrl: req.customer.pictureUrl,
      email: req.customer.email,
      phone: req.customer.phone,
      role: 'customer'
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
