const bailianService = require('./bailianService');
const config = require('../config/config');

class AIService {
  constructor() {
    this.provider = this.detectProvider();
  }

  /**
   * 检测使用的AI服务提供商
   */
  detectProvider() {
    const baseUrl = config.ai.baseUrl || '';
    
    if (baseUrl.includes('dashscope') || baseUrl.includes('aliyun')) {
      return 'bailian';
    } else if (baseUrl.includes('openai')) {
      return 'openai';
    } else {
      return 'bailian'; // 默认使用阿里云百炼
    }
  }

  /**
   * 生成旅行计划
   */
  async generateTripPlan(userInput) {
    try {
      switch (this.provider) {
        case 'bailian':
          return await bailianService.generateTripPlan(userInput);
        case 'openai':
          // 原有的OpenAI调用逻辑
          return await this.callOpenAI(userInput);
        default:
          return await bailianService.generateTripPlan(userInput);
      }
    } catch (error) {
      console.error('AI服务调用失败:', error);
      throw new Error(`生成旅行计划失败: ${error.message}`);
    }
  }

  /**
   * 估算预算
   */
  async estimateBudget(tripDetails) {
    try {
      switch (this.provider) {
        case 'bailian':
          return await bailianService.estimateBudget(tripDetails);
        case 'openai':
          // 原有的OpenAI调用逻辑
          return await this.estimateBudgetWithOpenAI(tripDetails);
        default:
          return await bailianService.estimateBudget(tripDetails);
      }
    } catch (error) {
      console.error('预算估算失败:', error);
      throw new Error(`预算估算失败: ${error.message}`);
    }
  }

  /**
   * 检查AI服务状态
   */
  async checkStatus() {
    try {
      switch (this.provider) {
        case 'bailian':
          return await bailianService.checkConnection();
        default:
          return { connected: false, error: '未知的AI服务提供商' };
      }
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  // 原有的OpenAI调用方法（保持兼容性）
  async callOpenAI(userInput) {
    // 原有的OpenAI实现逻辑
    const axios = require('axios');
    const response = await axios.post(`${this.baseUrl}/chat/completions`, {
      model: this.model,
      messages: [
        { role: 'system', content: '你是一个专业的旅行规划师，能根据用户需求生成详细的旅行计划。请以结构化的JSON格式返回结果。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return this.parseAIResponse(response.data.choices[0].message.content);
  }

  async estimateBudgetWithOpenAI(tripDetails) {
    // 原有的OpenAI预算估算逻辑
    const response = await axios.post(`${this.baseUrl}/chat/completions`, {
      model: this.model,
      messages: [
        { role: 'system', content: '你是一个专业的旅行规划师，能根据用户需求生成详细的旅行计划。请以结构化的JSON格式返回结果。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return this.parseAIResponse(response.data.choices[0].message.content);
  }
}

module.exports = new AIService();