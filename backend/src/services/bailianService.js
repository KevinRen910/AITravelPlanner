const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');

class BailianService {
  constructor() {
    this.apiKey = config.ai.apiKey;
    this.baseUrl = config.ai.baseUrl;
    this.model = config.ai.model;
    this.workspace = config.ai.workspace;
  }

  /**
   * 生成阿里云API签名
   */
  generateSignature(method, path, headers) {
    const canonicalizedHeaders = this.buildCanonicalizedHeaders(headers);
    const canonicalizedResource = path;
    
    const stringToSign = 
      method + '\n' +
      (headers['accept'] || '') + '\n' +
      (headers['content-md5'] || '') + '\n' +
      (headers['content-type'] || '') + '\n' +
      (headers['date'] || '') + '\n' +
      canonicalizedHeaders + '\n' +
      canonicalizedResource;
    
    const signature = crypto
      .createHmac('sha1', this.apiKey)
      .update(stringToSign)
      .digest('base64');
    
    return signature;
  }

  /**
   * 构建规范化头部
   */
  buildCanonicalizedHeaders(headers) {
    const xHeaders = {};
    Object.keys(headers).forEach(key => {
      if (key.startsWith('x-acs-')) {
        xHeaders[key.toLowerCase()] = headers[key];
      }
    });
    
    const sortedKeys = Object.keys(xHeaders).sort();
    return sortedKeys.map(key => `${key}:${xHeaders[key]}`).join('\n');
  }

  /**
   * 调用DeepSeek模型生成旅行计划
   */
  async generateTripPlan(userInput) {
    try {
      const prompt = this.buildTripPrompt(userInput);
      const response = await this.callDeepSeekModel(prompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('阿里云百炼API调用错误:', error);
      throw new Error(`生成旅行计划失败: ${error.message}`);
    }
  }

  /**
   * 调用DeepSeek模型进行预算估算
   */
  async estimateBudget(tripDetails) {
    try {
      const prompt = this.buildBudgetPrompt(tripDetails);
      const response = await this.callDeepSeekModel(prompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('阿里云百炼API调用错误:', error);
      throw new Error(`预算估算失败: ${error.message}`);
    }
  }

  /**
   * 调用DeepSeek模型核心方法
   */
  async callDeepSeekModel(prompt) {
    const currentDate = new Date().toUTCString();
    const path = '/services/aigc/text-generation/generation';
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Date': currentDate,
      'x-acs-version': '2023-06-01',
      'x-acs-signature-nonce': crypto.randomBytes(16).toString('hex'),
      'x-acs-region-id': 'cn-hangzhou',
      'x-acs-workspace': this.workspace
    };

    // 生成签名
    const signature = this.generateSignature('POST', path, headers);
    headers['Authorization'] = `acs ${this.apiKey}:${signature}`;

    const requestBody = {
      model: this.model,
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划师，能够根据用户需求生成详细的旅行计划和预算估算。请以结构化的JSON格式返回结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.8,
        result_format: 'message'
      }
    };

    const response = await axios.post(`${this.baseUrl}${path}`, requestBody, {
      headers: headers,
      timeout: 30000
    });

    return response.data;
  }

  /**
   * 构建旅行计划提示词
   */
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
}

请确保返回的内容是有效的JSON格式。`;
  }

  /**
   * 构建预算估算提示词
   */
  buildBudgetPrompt(tripDetails) {
    return `请根据以下旅行详情估算各项费用：${JSON.stringify(tripDetails, null, 2)}。

请以JSON格式返回详细预算明细：
{
  "totalBudget": 10000,
  "currency": "CNY",
  "breakdown": {
    "transportation": {
      "amount": 2000,
      "description": "交通费用明细"
    },
    "accommodation": {
      "amount": 3000,
      "description": "住宿费用明细"
    },
    "food": {
      "amount": 2000,
      "description": "餐饮费用明细"
    },
    "activities": {
      "amount": 2000,
      "description": "活动费用明细"
    },
    "shopping": {
      "amount": 1000,
      "description": "购物费用明细"
    }
  },
  "dailyAverage": 2000,
  "recommendations": ["预算优化建议1", "预算优化建议2"]
}

请确保返回的内容是有效的JSON格式。`;
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(response) {
    try {
      if (response.output && response.output.choices && response.output.choices.length > 0) {
        const content = response.output.choices[0].message.content;
        
        // 尝试解析JSON格式的响应
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // 如果无法解析为JSON，返回原始文本
        return content;
      } else {
        throw new Error('AI响应格式异常');
      }
    } catch (error) {
      console.warn('解析AI响应失败，返回原始内容:', error);
      return response.output?.choices[0]?.message?.content || '无法解析AI响应';
    }
  }

  /**
   * 检查API连接状态
   */
  async checkConnection() {
    try {
      const testPrompt = '请回复"连接成功"';
      const response = await this.callDeepSeekModel(testPrompt);
      return {
        connected: true,
        model: this.model,
        response: response
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new BailianService();
