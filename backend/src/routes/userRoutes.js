const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 用户注册
router.post('/register', userController.register);

// 用户登录
router.post('/login', userController.login);

// 获取用户信息
router.get('/:id', userController.getUserById);

// 更新用户信息
router.put('/:id', userController.updateUser);

module.exports = router;