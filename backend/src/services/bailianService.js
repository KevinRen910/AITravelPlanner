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
      // 如果API调用失败，返回模拟数据
      return this.generateMockTripPlan(userInput);
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
      // 如果API调用失败，返回模拟数据
      return this.generateMockBudget(tripDetails);
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
   * 生成模拟旅行计划（API调用失败时的回退方案）
   */
  generateMockTripPlan(userInput) {
    console.log('使用模拟数据生成旅行计划');
    
    // 智能解析用户输入
    const days = this.extractDaysFromInput(userInput) || 3;
    const destination = this.extractDestinationFromInput(userInput) || '目的地';
    
    return {
      dailyItinerary: Array.from({length: days}, (_, i) => ({
        day: i + 1,
        date: `2024-${String(i+1).padStart(2, '0')}-01`,
        morning: `${destination}上午观光活动`,
        afternoon: `${destination}下午休闲活动`,
        evening: `${destination}晚上餐饮体验`,
        attractions: [`${destination}景点${i+1}`, `${destination}景点${i+2}`],
        restaurants: [`${destination}餐厅${i+1}`, `${destination}餐厅${i+2}`],
        accommodation: `${destination}酒店住宿`,
        transportation: `${destination}当地交通`
      })),
      budgetEstimation: {
        total: days * 2000,
        categories: {
          transportation: days * 300,
          accommodation: days * 800,
          food: days * 500,
          activities: days * 300,
          shopping: days * 100
        }
      },
      recommendations: {
        attractions: [`${destination}推荐景点1`, `${destination}推荐景点2`],
        restaurants: [`${destination}推荐餐厅1`, `${destination}推荐餐厅2`],
        tips: ['注意天气变化', '提前预订门票', '携带必要证件']
      }
    };
  }

  /**
   * 生成模拟预算估算（API调用失败时的回退方案）
   */
  generateMockBudget(tripDetails) {
    console.log('使用模拟数据生成预算估算');
    
    const days = tripDetails.days || 3;
    const travelers = tripDetails.travelers || 2;
    
    return {
      totalBudget: days * travelers * 1000,
      currency: "CNY",
      breakdown: {
        transportation: {
          amount: days * travelers * 200,
          description: "往返交通及当地交通费用"
        },
        accommodation: {
          amount: days * travelers * 400,
          description: "酒店住宿费用"
        },
        food: {
          amount: days * travelers * 200,
          description: "餐饮费用"
        },
        activities: {
          amount: days * travelers * 150,
          description: "景点门票及活动费用"
        },
        shopping: {
          amount: days * travelers * 50,
          description: "购物及纪念品费用"
        }
      },
      dailyAverage: travelers * 1000,
      recommendations: [
        "提前预订可享受优惠",
        "选择淡季出行节省费用",
        "关注当地优惠活动"
      ]
    };
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