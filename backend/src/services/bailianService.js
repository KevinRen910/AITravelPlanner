const OpenAI = require("openai");
const config = require('../config/config');

class BailianService {
  constructor() {
    // 创建OpenAI客户端实例，使用阿里云百炼兼容模式
    this.client = new OpenAI({
      apiKey: config.ai.apiKey,
      baseURL: config.ai.baseUrl,
    });
    this.model = config.ai.model;
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
      // 不再静默回退到 mock 数据，改为向上抛出错误，由调用方决定如何处理
      throw error;
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
      // 不再静默回退到 mock 数据，改为向上抛出错误，由调用方决定如何处理
      throw error;
    }
  }

  /**
   * 调用DeepSeek模型核心方法（使用官方OpenAI SDK）
   */
  async callDeepSeekModel(prompt) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "你是一个专业的旅行规划师，能够根据用户需求生成详细的旅行计划和预算估算。请以结构化的JSON格式返回结果。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return completion;
  }

  /**
   * 构建旅行计划提示词
   */
  buildTripPrompt(userInput) {
    // userInput 可能是字符串也可能是对象，优先解析对象字段
    let inputObj = userInput;
    if (typeof userInput === 'string') {
      try {
        inputObj = JSON.parse(userInput);
      } catch (e) {
        // 不是 JSON 字符串，保留为文本描述
        inputObj = { description: userInput };
      }
    }

    const {
      destination,
      start_date,
      end_date,
      travelers,
      theme,
      special_requests,
      preferences,
      description
    } = inputObj || {};

    let userDesc = '';
    if (destination) userDesc += `目的地: ${destination}\n`;
    if (start_date || end_date) userDesc += `日期: ${start_date || ''} - ${end_date || ''}\n`;
    if (travelers) userDesc += `出行人数: ${travelers}\n`;
    if (theme) userDesc += `主题: ${theme}\n`;
    if (special_requests) userDesc += `特殊需求: ${special_requests}\n`;
    if (preferences && typeof preferences === 'object') userDesc += `偏好: ${JSON.stringify(preferences, null, 2)}\n`;
    if (description && !userDesc) userDesc = description;
    if (!userDesc) userDesc = JSON.stringify(inputObj, null, 2);

    return `请根据以下用户需求生成一份详细的旅行计划：\n\n${userDesc}\n\n请以JSON格式返回以下结构，确保返回有效的 JSON：\n{\n  "dailyItinerary": [\n    {\n      "day": 1,\n      "date": "YYYY-MM-DD",\n      "morning": "上午活动安排",\n      "afternoon": "下午活动安排",\n      "evening": "晚上活动安排",\n      "attractions": ["景点1", "景点2"],\n      "restaurants": ["餐厅1", "餐厅2"],\n      "accommodation": "住宿建议",\n      "transportation": "交通建议"\n    }\n  ],\n  "budgetEstimation": {\n    "total": 10000,\n    "categories": {\n      "transportation": 2000,\n      "accommodation": 3000,\n      "food": 2000,\n      "activities": 2000,\n      "shopping": 1000\n    }\n  },\n  "recommendations": {\n    "attractions": ["推荐景点1", "推荐景点2"],\n    "restaurants": ["推荐餐厅1", "推荐餐厅2"],\n    "tips": ["旅行小贴士1", "旅行小贴士2"]\n  }\n}\n`;
  }

  /**
   * 构建预算估算提示词
   */
  buildBudgetPrompt(tripDetails) {
    let details = tripDetails;
    if (typeof tripDetails === 'string') {
      try {
        details = JSON.parse(tripDetails);
      } catch (e) {
        details = { description: tripDetails };
      }
    }

    const summary = JSON.stringify(details, null, 2);
    return `请根据以下旅行详情估算各项费用：\n\n${summary}\n\n请以JSON格式返回详细预算明细，例如：\n{\n  "totalBudget": 10000,\n  "currency": "CNY",\n  "breakdown": {\n    "transportation": { "amount": 2000, "description": "交通费用明细" },\n    "accommodation": { "amount": 3000, "description": "住宿费用明细" },\n    "food": { "amount": 2000, "description": "餐饮费用明细" },\n    "activities": { "amount": 2000, "description": "活动费用明细" },\n    "shopping": { "amount": 1000, "description": "购物费用明细" }\n  },\n  "dailyAverage": 2000,\n  "recommendations": ["预算优化建议1", "预算优化建议2"]\n}\n`;
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(response) {
    try {
      if (response.choices && response.choices.length > 0) {
        const content = response.choices[0].message.content;
        
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
      return response.choices?.[0]?.message?.content || '无法解析AI响应';
    }
  }

  /**
   * 从用户输入中提取天数
   */
  extractDaysFromInput(input) {
    const dayMatch = input.match(/(\d+)\s*天/);
    return dayMatch ? parseInt(dayMatch[1]) : null;
  }

  /**
   * 从用户输入中提取目的地
   */
  extractDestinationFromInput(input) {
    // 简单的目的地提取逻辑
    const destinations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '重庆', '厦门', '青岛'];
    for (const dest of destinations) {
      if (input.includes(dest)) {
        return dest;
      }
    }
    return null;
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