const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

class TripController {
  // 创建新行程
  async createTrip(req, res) {
    try {
      const { userId, userInput, preferences } = req.body;
      
      console.log('创建行程请求:', { userId, userInput, preferences });
      
      // 检查必需字段
      if (!userId) {
        return res.status(400).json({ error: '用户ID不能为空' });
      }
      
      if (!userInput) {
        return res.status(400).json({ error: '用户输入不能为空' });
      }
      
      let tripPlan;
      try {
        // 调用AI生成行程计划
        tripPlan = await aiService.generateTripPlan(userInput);
        console.log('AI生成的行程计划:', tripPlan);
      } catch (aiError) {
        console.error('AI服务调用失败:', aiError);
        // AI服务失败时使用默认行程内容
        tripPlan = {
          title: `${preferences.destination} 旅行计划`,
          itinerary: [
            {
              day: 1,
              date: preferences.startDate,
              activities: [
                {
                  time: '上午',
                  description: '抵达目的地，入住酒店'
                },
                {
                  time: '下午', 
                  description: '自由活动，熟悉周边环境'
                },
                {
                  time: '晚上',
                  description: '品尝当地美食'
                }
              ]
            }
          ],
          budget: {
            total: 2000,
            categories: {
              accommodation: 800,
              food: 600,
              transportation: 400,
              activities: 200
            }
          }
        };
      }
      
      // 准备插入数据
      const tripData = {
        user_id: userId,
        destination: preferences.destination,
        start_date: preferences.startDate,
        end_date: preferences.endDate,
        travelers: preferences.travelers || 1,
        theme: preferences.theme || 'general',
        special_requests: preferences.specialRequests || '',
        plan_content: tripPlan,
        preferences: preferences,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log('准备保存的行程数据:', tripData);
      
      // 保存行程到数据库
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select();
      
      if (error) {
        console.error('数据库保存错误:', error);
        throw error;
      }
      
      console.log('行程保存成功:', data[0]);
      
      res.status(201).json(data[0]);
    } catch (error) {
      console.error('创建行程失败:', error);
      res.status(500).json({ error: error.message });
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