const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

// 格式化AI服务返回的行程计划内容（独立函数）
function formatTripPlanContent(tripPlan) {
  try {
    let content = '';

    // 处理每日行程
    if (tripPlan.dailyItinerary && Array.isArray(tripPlan.dailyItinerary)) {
      content += '📅 每日行程安排：\n\n';
      tripPlan.dailyItinerary.forEach(day => {
        content += `第${day.day}天（${day.date || '日期待定'}）\n`;
        content += `🌅 上午：${day.morning || '暂无安排'}\n`;
        content += `☀️ 下午：${day.afternoon || '暂无安排'}\n`;
        content += `🌙 晚上：${day.evening || '暂无安排'}\n`;
        
        if (day.attractions && day.attractions.length > 0) {
          content += `🏛️ 景点：${day.attractions.join('、')}\n`;
        }
        
        if (day.restaurants && day.restaurants.length > 0) {
          content += `🍽️ 餐厅：${day.restaurants.join('、')}\n`;
        }
        
        content += `🏨 住宿：${day.accommodation || '待定'}\n`;
        content += `🚗 交通：${day.transportation || '待定'}\n\n`;
      });
    }

    // 处理预算信息
    if (tripPlan.budgetEstimation) {
      content += '💰 预算估算：\n';
      content += `总计：${tripPlan.budgetEstimation.total || 0}元\n`;
      
      if (tripPlan.budgetEstimation.categories) {
        const categories = tripPlan.budgetEstimation.categories;
        content += `交通：${categories.transportation || 0}元\n`;
        content += `住宿：${categories.accommodation || 0}元\n`;
        content += `餐饮：${categories.food || 0}元\n`;
        content += `活动：${categories.activities || 0}元\n`;
        content += `购物：${categories.shopping || 0}元\n\n`;
      }
    }

    // 处理推荐信息
    if (tripPlan.recommendations) {
      content += '🌟 推荐信息：\n';
      
      if (tripPlan.recommendations.attractions) {
        content += `推荐景点：${tripPlan.recommendations.attractions.join('、')}\n`;
      }
      
      if (tripPlan.recommendations.restaurants) {
        content += `推荐餐厅：${tripPlan.recommendations.restaurants.join('、')}\n`;
      }
      
      if (tripPlan.recommendations.tips) {
        content += `旅行贴士：${tripPlan.recommendations.tips.join('、')}\n`;
      }
    }

    return content || '暂无详细的行程安排信息';
  } catch (error) {
    console.error('格式化行程计划内容失败:', error);
    return JSON.stringify(tripPlan, null, 2);
  }
}

class TripController {
  // 创建新行程
  async createTrip(req, res) {
    try {
      const { destination, start_date, end_date, travelers, theme, special_requests, preferences } = req.body;
      const user_id = req.user?.id;

      console.log('开始创建行程:', { destination, user_id });

      if (!user_id) {
        console.error('用户ID为空');
        return res.status(400).json({ error: '用户id不能为空' });
      }

      // 验证destination字段
      if (!destination) {
        console.error('目的地为空');
        return res.status(400).json({ error: '目的地不能为空' });
      }

      // 生成行程计划
      console.log('调用AI服务生成行程计划...');
      let tripPlan = await aiService.generateTripPlan({
        destination,
        start_date,
        end_date,
        travelers,
        theme,
        special_requests,
        preferences
      });

      if (!tripPlan) {
        console.error('AI服务生成行程失败，使用模拟数据');
        // 使用模拟数据回退
        tripPlan = {
          plan_content: `这是${destination}的模拟行程内容，用于测试。实际使用时请配置AI服务。`,
          estimated_budget: 5000
        };
      }

      console.log('AI服务返回的数据:', JSON.stringify(tripPlan, null, 2));

      // 处理AI服务返回的数据结构
      let planContent;
      let estimatedBudget = 0;

      if (typeof tripPlan === 'string') {
        // 如果返回的是字符串，直接使用
        planContent = tripPlan;
      } else if (tripPlan.plan_content) {
        // 如果包含plan_content字段，使用该字段
        planContent = tripPlan.plan_content;
        estimatedBudget = tripPlan.estimated_budget || 0;
      } else if (tripPlan.dailyItinerary) {
        // 如果包含dailyItinerary字段，转换为格式化的行程内容
        planContent = formatTripPlanContent(tripPlan); // 改为直接调用函数
        estimatedBudget = tripPlan.budgetEstimation?.total || tripPlan.estimated_budget || 0;
      } else {
        // 其他情况，将整个对象转换为JSON字符串
        planContent = JSON.stringify(tripPlan, null, 2);
        estimatedBudget = tripPlan.estimated_budget || 0;
      }

      // 准备保存数据
      const tripData = {
        user_id,
        destination: destination || '未知目的地',
        start_date,
        end_date,
        travelers: travelers || 1,
        theme,
        special_requests,
        plan_content: planContent,
        preferences: preferences || {},
        estimated_budget: estimatedBudget
      };

      console.log('准备保存行程数据到Supabase...');
      
      // 保存到数据库
      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select();

      if (error) {
        console.error('Supabase保存失败:', error);
        return res.status(500).json({ 
          error: '保存行程失败', 
          details: error.message,
          suggestion: '请检查数据库连接和表结构'
        });
      }

      console.log('行程保存成功，ID:', data[0].id);
      res.status(201).json({
        message: '行程创建成功',
        trip: data[0]
      });

    } catch (error) {
      console.error('创建行程异常:', error);
      res.status(500).json({ 
        error: '创建行程失败', 
        message: error.message 
      });
    }
  }

  // 获取用户的所有行程
  async getUserTrips(req, res) {
    try {
      const { userId } = req.params;
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取单个行程详情
  async getTripById(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 更新行程
  async updateTrip(req, res) {
    try {
      const { id } = req.params;
      const { planContent, preferences } = req.body;
      
      const { data, error } = await supabase
        .from('trips')
        .update({
          plan_content: planContent,
          preferences: preferences,
          updated_at: new Date()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      res.status(200).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 删除行程
  async deleteTrip(req, res) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TripController();