const Joi = require('joi');

const createStaffSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': '請輸入人員姓名',
    'string.max': '姓名不得超過 50 字',
    'any.required': '請輸入人員姓名'
  }),
  services: Joi.array().items(Joi.string().hex().length(24)).optional(),
  sortOrder: Joi.number().integer().min(0).optional()
});

const updateStaffSchema = Joi.object({
  name: Joi.string().trim().min(1).max(50).optional(),
  services: Joi.array().items(Joi.string().hex().length(24)).optional(),
  holidays: Joi.array().items(Joi.date().iso()).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional()
});

module.exports = {
  createStaffSchema,
  updateStaffSchema
};
