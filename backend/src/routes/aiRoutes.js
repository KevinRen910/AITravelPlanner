const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

// AI服务状态检查
router.get('/status', async (req, res) => {
  try {
    const status = await aiService.checkStatus();
    res.status(200).json({
      success: true,
      provider: aiService.provider,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI服务测试
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    const testPrompt = message || '请回复"测试成功"';
    
    const response = await aiService.generateTripPlan(testPrompt);
    
    res.status(200).json({
      success: true,
      response: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
