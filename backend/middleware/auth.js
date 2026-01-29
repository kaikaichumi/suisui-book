const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const Store = require('../models/Store');
const Customer = require('../models/Customer');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const verifySuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '請先登入' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ message: '權限不足' });
    }

    const admin = await SuperAdmin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: '帳號不存在' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: '登入已過期，請重新登入' });
  }
};

const verifyStore = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '請先登入' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'store') {
      return res.status(403).json({ message: '權限不足' });
    }

    const store = await Store.findById(decoded.id);
    if (!store || !store.active) {
      return res.status(401).json({ message: '店家帳號不存在或已停用' });
    }

    req.store = store;
    next();
  } catch (error) {
    res.status(401).json({ message: '登入已過期，請重新登入' });
  }
};

const verifyAny = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '請先登入' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'superadmin') {
      const admin = await SuperAdmin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ message: '帳號不存在' });
      }
      req.admin = admin;
      req.userRole = 'superadmin';
    } else if (decoded.role === 'store') {
      const store = await Store.findById(decoded.id);
      if (!store || !store.active) {
        return res.status(401).json({ message: '店家帳號不存在或已停用' });
      }
      req.store = store;
      req.userRole = 'store';
    } else {
      return res.status(403).json({ message: '權限不足' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: '登入已過期，請重新登入' });
  }
};

const verifyCustomer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '請先登入' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer') {
      return res.status(403).json({ message: '權限不足' });
    }

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({ message: '帳號不存在' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).json({ message: '登入已過期，請重新登入' });
  }
};

const optionalCustomerAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'customer') {
      const customer = await Customer.findById(decoded.id);
      if (customer) {
        req.customer = customer;
      }
    }
    next();
  } catch (error) {
    // Token 無效時不阻擋，繼續處理
    next();
  }
};

module.exports = {
  generateToken,
  verifySuperAdmin,
  verifyStore,
  verifyAny,
  verifyCustomer,
  optionalCustomerAuth
};
