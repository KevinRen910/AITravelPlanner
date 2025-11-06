const axios = require('axios');
const config = require('../config/config');

class AIService {
  constructor() {
    this.axios = axios.create({
      baseURL: config.ai.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.ai.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generateTripPlan(userInput) {
    try {
      const prompt = this.buildTripPrompt(userInput);
      const response = await this.axios.post('/chat/completions', {
        model: 'gpt-3.5-turbo', // 可根据实际使用的模型调整
        messages: [
          { role: 'system', content: '你是一个专业的旅行规划师，能根据用户需求生成详细的旅行计划。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating trip plan:', error);
      throw new Error('Failed to generate trip plan');
    }
  }

  buildTripPrompt(userInput) {
    return `请根据用户需求生成一份详细的旅行计划：${userInput}。
    请包含以下内容：
    1. 每日行程安排
    2. 推荐景点及简介
    3. 推荐餐厅及特色美食
    4. 交通建议
    5. 住宿建议
    6. 预算估计
    请以结构化的格式输出，方便前端解析和展示。`;
  }

  async estimateBudget(tripDetails) {
    try {
      const response = await this.axios.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是一个旅行预算专家，能根据旅行详情估算各项费用。' },
          { role: 'user', content: `请根据以下旅行详情估算各项费用：${JSON.stringify(tripDetails)}。请以JSON格式返回详细预算明细。` }
        ],
        max_tokens: 1000
      });
      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error estimating budget:', error);
      throw new Error('Failed to estimate budget');
    }
  }
}

module.exports = new AIService();