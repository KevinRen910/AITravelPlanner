const axios = require('axios');
const config = require('../config/config');

class SpeechService {
  constructor() {
    this.apiKey = config.speech.apiKey;
    this.appId = config.speech.appId;
    this.apiSecret = config.speech.apiSecret;
  }

  async recognizeSpeech(audioData) {
    try {
      // 检查是否配置了语音识别服务
      if (!this.apiKey || !this.appId) {
        throw new Error('语音识别服务未配置');
      }

      // 科大讯飞语音识别API实现
      const authToken = await this.generateAuthToken();
      
      const response = await axios.post('https://api.xfyun.cn/v1/service/v1/iat', {
        common: {
          app_id: this.appId
        },
        business: {
          language: 'zh_cn',
          domain: 'iat',
          accent: 'mandarin',
          vad_eos: 2000
        },
        data: {
          format: 'wav',
          encoding: 'raw',
          sample_rate: 16000,
          audio: audioData.toString('base64')
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken
        },
        timeout: 10000
      });

      if (response.data.code !== 0) {
        throw new Error(`语音识别API错误: ${response.data.message}`);
      }

      // 解析识别结果
      const result = this.parseRecognitionResult(response.data);
      return result;
    } catch (error) {
      console.error('Error recognizing speech:', error);
      
      // 备用方案：使用浏览器语音识别或返回错误信息
      if (error.message.includes('未配置')) {
        throw new Error('语音识别功能暂不可用，请使用文本输入');
      } else {
        throw new Error('语音识别失败，请重试或使用文本输入');
      }
    }
  }

  async generateAuthToken() {
    try {
      // 生成科大讯飞认证token
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = this.generateSignature(timestamp);
      
      return `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    } catch (error) {
      throw new Error('生成认证token失败');
    }
  }

  generateSignature(timestamp) {
    // 简化的签名生成逻辑，实际使用时需要根据科大讯飞文档实现
    const crypto = require('crypto');
    const host = 'api.xfyun.cn';
    const requestLine = `POST /v1/service/v1/iat HTTP/1.1`;
    
    const signatureOrigin = `host: ${host}\ndate: ${timestamp}\n${requestLine}`;
    const signature = crypto.createHmac('sha256', this.apiSecret)
      .update(signatureOrigin)
      .digest('base64');
    
    return signature;
  }

  parseRecognitionResult(data) {
    if (!data.data || !data.data.result) {
      return '';
    }

    let transcript = '';
    const ws = data.data.result.ws;
    
    for (let i = 0; i < ws.length; i++) {
      const cw = ws[i].cw;
      for (let j = 0; j < cw.length; j++) {
        transcript += cw[j].w;
      }
    }
    
    return transcript;
  }

  // 支持音频格式转换
  async convertAudioFormat(audioBuffer, targetFormat = 'wav') {
    // 简化的音频格式转换，实际使用时需要集成音频处理库
    // 这里返回原始数据，实际项目应该实现格式转换
    return audioBuffer;
  }
}

module.exports = new SpeechService();