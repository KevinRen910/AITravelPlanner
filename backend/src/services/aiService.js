const axios = require('axios');
const config = require('../config/config');

class AIService {
  constructor() {
    this.apiKey = config.ai.apiKey;
    this.baseUrl = config.ai.baseUrl;
    this.model = config.ai.model || 'gpt-3.5-turbo';
  }

  async generateTripPlan(userInput) {
    try {
      const prompt = this.buildTripPrompt(userInput);
      
      // 支持多种AI服务提供商
      let response;
      if (this.baseUrl.includes('openai')) {
        response = await this.callOpenAI(prompt);
      } else if (this.baseUrl.includes('dashscope')) {
        response = await this.callDashScope(prompt);
      } else {
        response = await this.callGenericAI(prompt);
      }
      
      return response;
    } catch (error) {
      console.error('Error generating trip plan:', error);
      throw new Error('Failed to generate trip plan: ' + error.message);
    }
  }

  async callOpenAI(prompt) {
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

  async callDashScope(prompt) {
    const response = await axios.post(`${this.baseUrl}/v1/services/aigc/text-generation/generation`, {
      model: this.model,
      input: {
        messages: [
          { role: 'system', content: '你是一个专业的旅行规划师，能根据用户需求生成详细的旅行计划。请以结构化的JSON格式返回结果。' },
          { role: 'user', content: prompt }
        ]
      },
      parameters: {
        max_tokens: 2000,
        temperature: 0.7
      }
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return this.parseAIResponse(response.data.output.text);
  }

  async callGenericAI(prompt) {
    const response = await axios.post(this.baseUrl, {
      prompt: prompt,
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return this.parseAIResponse(response.data.choices[0].text);
  }

  buildTripPrompt(userInput) {
    return `请根据用户需求生成一份详细的旅行计划：${userInput}。
    请以JSON格式返回以下内容：
    {
      "dailyItinerary": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "morning": "上午活动安排",
          "afternoon": "下午活动安排", 
          "evening": "晚上活动安排",
          "attractions": ["景点1", "景点2"],
          "restaurants": ["餐厅1", "餐厅2"],
          "accommodation": "住宿建议",
          "transportation": "交通建议"
        }
      ],
      "budgetEstimation": {
        "total": 10000,
        "categories": {
          "transportation": 2000,
          "accommodation": 3000,
          "food": 2000,
          "activities": 2000,
          "shopping": 1000
        }
      },
      "recommendations": {
        "attractions": ["推荐景点1", "推荐景点2"],
        "restaurants": ["推荐餐厅1", "推荐餐厅2"],
        "tips": ["旅行小贴士1", "旅行小贴士2"]
      }
    }`;
  }

  parseAIResponse(responseText) {
    try {
      // 尝试解析JSON格式的响应
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // 如果无法解析为JSON，返回原始文本
      return responseText;
    } catch (error) {
      console.warn('Failed to parse AI response as JSON, returning raw text:', error);
      return responseText;
    }
  }

  async estimateBudget(tripDetails) {
    try {
      const prompt = `请根据以下旅行详情估算各项费用：${JSON.stringify(tripDetails)}。
      请以JSON格式返回详细预算明细，包含交通、住宿、餐饮、活动、购物等分类。`;
      
      let response;
      if (this.baseUrl.includes('openai')) {
        response = await this.callOpenAI(prompt);
      } else {
        response = await this.callGenericAI(prompt);
      }
      
      return response;
    } catch (error) {
      console.error('Error estimating budget:', error);
      throw new Error('Failed to estimate budget: ' + error.message);
    }
  }
}

module.exports = new AIService();