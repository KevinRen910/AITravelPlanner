const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');

// 获取用户的API密钥
router.get('/user/:userId', apiKeyController.getUserApiKeys);

// 更新API密钥
router.put('/user/:userId', apiKeyController.updateApiKeys);

module.exports = router;