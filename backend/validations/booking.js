const Joi = require('joi');

const createBookingSchema = Joi.object({
  serviceId: Joi.string().hex().length(24).required().messages({
    'string.empty': '請選擇服務',
    'string.hex': '服務 ID 格式錯誤',
    'string.length': '服務 ID 格式錯誤',
    'any.required': '請選擇服務'
  }),
  staffId: Joi.string().hex().length(24).required().messages({
    'string.empty': '請選擇服務人員',
    'string.hex': '人員 ID 格式錯誤',
    'string.length': '人員 ID 格式錯誤',
    'any.required': '請選擇服務人員'
  }),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.empty': '請選擇日期',
    'string.pattern.base': '日期格式錯誤（YYYY-MM-DD）',
    'any.required': '請選擇日期'
  }),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required().messages({
    'string.empty': '請選擇時段',
    'string.pattern.base': '時間格式錯誤（HH:MM）',
    'any.required': '請選擇時段'
  }),
  customerName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': '請輸入姓名',
    'string.max': '姓名不得超過 50 字',
    'any.required': '請輸入姓名'
  }),
  customerPhone: Joi.string().trim().pattern(/^09\d{8}$/).required().messages({
    'string.empty': '請輸入手機號碼',
    'string.pattern.base': '手機號碼格式錯誤（09xxxxxxxx）',
    'any.required': '請輸入手機號碼'
  }),
  customerEmail: Joi.string().trim().email().allow('', null).optional().messages({
    'string.email': 'Email 格式錯誤'
  })
});

const cancelBookingSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^09\d{8}$/).required().messages({
    'string.empty': '請輸入手機號碼',
    'string.pattern.base': '手機號碼格式錯誤',
    'any.required': '請輸入手機號碼以驗證身分'
  })
});

const queryBookingsSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^09\d{8}$/).required().messages({
    'string.empty': '請輸入手機號碼',
    'string.pattern.base': '手機號碼格式錯誤',
    'any.required': '請提供手機號碼'
  })
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
  queryBookingsSchema
};
