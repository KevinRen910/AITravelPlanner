const express = require('express');
const SpeechService = require('../services/speechService');
const router = express.Router();

const speechService = new SpeechService();

/**
 * 语音识别状态检查
 */
router.get('/status', async (req, res) => {
  try {
    const configured = !!(process.env.SPEECH_API_KEY && process.env.SPEECH_APP_ID);
    res.json({
      configured,
      message: configured ? '语音识别服务已配置' : '语音识别服务未配置'
    });
  } catch (error) {
    res.status(500).json({
      configured: false,
      message: '语音识别服务检查失败'
    });
  }
});

/**
 * 语音识别接口
 */
router.post('/recognize', async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({
        success: false,
        error: '请上传音频文件'
      });
    }

    const audioFile = req.files.audio;
    
    // 检查文件类型
    const allowedTypes = ['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.mimetype)) {
      return res.status(400).json({
        success: false,
        error: '不支持的音频格式，请上传WAV、WebM、MP3或OGG格式'
      });
    }

    // 检查文件大小（限制为5MB）
    if (audioFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: '音频文件过大，请上传小于5MB的文件'
      });
    }

    // 进行语音识别
    const transcript = await speechService.recognizeSpeech(audioFile.data);
    
    res.json({
      success: true,
      transcript,
      message: '语音识别成功'
    });
  } catch (error) {
    console.error('语音识别错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '语音识别失败'
    });
  }
});

/**
 * 批量语音识别接口
 */
router.post('/recognize-batch', async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({
        success: false,
        error: '请上传音频文件'
      });
    }

    const audioFiles = Array.isArray(req.files.audio) ? req.files.audio : [req.files.audio];
    const results = [];

    for (const audioFile of audioFiles) {
      try {
        const transcript = await speechService.recognizeSpeech(audioFile.data);
        results.push({
          filename: audioFile.name,
          success: true,
          transcript
        });
      } catch (error) {
        results.push({
          filename: audioFile.name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      message: `批量识别完成，成功${results.filter(r => r.success).length}个，失败${results.filter(r => !r.success).length}个`
    });
  } catch (error) {
    console.error('批量语音识别错误:', error);
    res.status(500).json({
      success: false,
      error: '批量语音识别失败'
    });
  }
});

module.exports = router;