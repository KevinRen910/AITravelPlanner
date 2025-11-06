const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

class TripController {
  // 创建新行程
  async createTrip(req, res) {
    try {
      const { userId, userInput, preferences } = req.body;
      
      // 调用AI生成行程计划
      const tripPlan = await aiService.generateTripPlan(userInput);
      
      // 保存行程到数据库
      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: userId,
          plan_content: tripPlan,
          preferences: preferences,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select();
      
      if (error) throw error;
      
      res.status(201).json(data[0]);
    } catch (error) {
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