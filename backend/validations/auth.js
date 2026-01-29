const Joi = require('joi');

const storeLoginSchema = Joi.object({
  slug: Joi.string().trim().lowercase().required().messages({
    'string.empty': '請輸入店家代碼',
    'any.required': '請輸入店家代碼'
  }),
  password: Joi.string().required().messages({
    'string.empty': '請輸入密碼',
    'any.required': '請輸入密碼'
  })
});

const superAdminLoginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'string.empty': '請輸入帳號',
    'any.required': '請輸入帳號'
  }),
  password: Joi.string().required().messages({
    'string.empty': '請輸入密碼',
    'any.required': '請輸入密碼'
  })
});

module.exports = {
  storeLoginSchema,
  superAdminLoginSchema
};
