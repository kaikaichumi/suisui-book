const Joi = require('joi');

const createServiceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': '請輸入服務名稱',
    'string.max': '服務名稱不得超過 100 字',
    'any.required': '請輸入服務名稱'
  }),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  price: Joi.number().min(0).required().messages({
    'number.base': '價格必須為數字',
    'number.min': '價格不得小於 0',
    'any.required': '請輸入價格'
  }),
  duration: Joi.number().integer().min(30).required().messages({
    'number.base': '時長必須為數字',
    'number.min': '時長不得小於 30 分鐘',
    'any.required': '請輸入服務時長'
  }),
  sortOrder: Joi.number().integer().min(0).optional()
});

const updateServiceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  price: Joi.number().min(0).optional(),
  duration: Joi.number().integer().min(30).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional()
});

module.exports = {
  createServiceSchema,
  updateServiceSchema
};
