const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');

class SpeechService {
  constructor() {
    this.apiKey = config.speech.apiKey;
    this.appId = config.speech.appId;
    this.apiSecret = config.speech.apiSecret;
    this.baseUrl = 'https://iat-api.xfyun.cn/v2/iat';
  }

  /**
   * 语音识别主方法
   */
  async recognizeSpeech(audioData, options = {}) {
    try {
      // 检查是否配置了语音识别服务
      if (!this.apiKey || !this.appId || !this.apiSecret) {
        throw new Error('语音识别服务未配置，请检查SPEECH_API_KEY、SPEECH_APP_ID和SPEECH_API_SECRET环境变量');
      }

      // 生成认证参数
      const authParams = this.generateAuthParams();
      
      // 准备请求数据
      const requestData = this.prepareRequestData(audioData, options);
      
      // 调用科大讯飞语音识别API
      const response = await axios.post(this.baseUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Appid': this.appId,
          'X-CurTime': authParams.curTime,
          'X-Param': authParams.param,
          'X-CheckSum': authParams.checkSum
        },
        timeout: 30000
      });

      if (response.data.code !== 0) {
        throw new Error(`语音识别API错误: ${response.data.message} (错误码: ${response.data.code})`);
      }

      // 解析识别结果
      const result = this.parseRecognitionResult(response.data);
      return result;
    } catch (error) {
      console.error('语音识别错误:', error);
      
      // 提供更友好的错误信息
      if (error.message.includes('未配置')) {
        throw new Error('语音识别功能暂不可用，请配置科大讯飞API密钥');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('语音识别请求超时，请重试');
      } else if (error.response) {
        throw new Error(`语音识别服务错误: ${error.response.status} ${error.response.statusText}`);
      } else {
        throw new Error(`语音识别失败: ${error.message}`);
      }
    }
  }

  /**
   * 生成认证参数
   */
  generateAuthParams() {
    const curTime = Math.floor(Date.now() / 1000).toString();
    const param = {
      engine_type: 'sms16k', // 16k采样率普通话
      aue: 'raw'
    };
    
    const paramBase64 = Buffer.from(JSON.stringify(param)).toString('base64');
    const checkSum = crypto.createHash('md5')
      .update(this.apiKey + curTime + paramBase64)
      .digest('hex');
    
    return {
      curTime,
      param: paramBase64,
      checkSum
    };
  }

  /**
   * 准备请求数据
   */
  prepareRequestData(audioData, options) {
    const audioBase64 = audioData.toString('base64');
    
    return {
      common: {
        app_id: this.appId
      },
      business: {
        language: options.language || 'zh_cn',
        domain: options.domain || 'iat',
        accent: options.accent || 'mandarin',
        vad_eos: options.vadEos || 2000,
        dwa: options.dwa || 'wpgs'
      },
      data: {
        status: 2, // 2表示最后一块数据
        format: options.format || 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: audioBase64
      }
    };
  }

  /**
   * 解析识别结果
   */
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
    
    return transcript.trim();
  }

  /**
   * 支持多种音频格式转换
   */
  async convertAudioFormat(audioBuffer, targetFormat = 'wav') {
    try {
      // 这里实现音频格式转换逻辑
      // 实际项目中可以集成ffmpeg或使用音频处理库
      switch (targetFormat.toLowerCase()) {
        case 'wav':
          // 转换为WAV格式（16kHz, 16bit, 单声道）
          return this.convertToWav(audioBuffer);
        case 'pcm':
          // 转换为PCM格式
          return this.convertToPcm(audioBuffer);
        default:
          // 默认返回原始数据
          return audioBuffer;
      }
    } catch (error) {
      console.error('音频格式转换错误:', error);
      throw new Error(`音频格式转换失败: ${error.message}`);
    }
  }

  /**
   * 转换为WAV格式
   */
  convertToWav(audioBuffer) {
    // 简化的WAV格式转换
    // 实际项目中应该使用专业的音频处理库
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    // 创建WAV文件头
    const header = this.createWavHeader(audioBuffer.length, sampleRate, numChannels, bitsPerSample);
    
    // 合并头部和音频数据
    const wavBuffer = Buffer.concat([header, audioBuffer]);
    return wavBuffer;
  }

  /**
   * 创建WAV文件头
   */
  createWavHeader(dataLength, sampleRate, numChannels, bitsPerSample) {
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    
    const buffer = Buffer.alloc(44);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // chunk size
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    
    return buffer;
  }

  /**
   * 转换为PCM格式
   */
  convertToPcm(audioBuffer) {
    // 简化的PCM转换
    return audioBuffer;
  }

  /**
   * 检查语音识别服务状态
   */
  async checkServiceStatus() {
    try {
      // 简单的测试调用
      const testAudio = Buffer.from([0]); // 空的测试音频
      
      await this.recognizeSpeech(testAudio);
      return {
        available: true,
        message: '语音识别服务正常'
      };
    } catch (error) {
      return {
        available: false,
        message: `语音识别服务异常: ${error.message}`
      };
    }
  }
}

module.exports = SpeechService;