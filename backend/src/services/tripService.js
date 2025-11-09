const SupabaseService = require('./supabaseService');
const aiService = require('./aiService');

class TripService {
  // 创建新行程
  static async createTrip(userId, userInput, preferences) {
    try {
      // 调用AI生成行程计划
      const tripPlan = await aiService.generateTripPlan(userInput);
      
      // 保存行程到数据库
      const trip = await SupabaseService.insert('trips', {
        user_id: userId,
        destination: preferences.destination,
        start_date: preferences.startDate,
        end_date: preferences.endDate,
        travelers: preferences.travelers,
        theme: preferences.theme,
        special_requests: preferences.specialRequests,
        plan_content: tripPlan,
        preferences: preferences
      });
      
      return trip;
    } catch (error) {
      throw error;
    }
  }

  // 获取行程详情
  static async getTripById(id) {
    try {
      const trips = await SupabaseService.query('trips', {
        where: { id },
        select: '*'
      });
      
      if (trips.length === 0) {
        throw new Error('行程不存在');
      }
      
      return trips[0];
    } catch (error) {
      throw error;
    }
  }

  // 更新行程
  static async updateTrip(id, tripData) {
    try {
      const updatedTrip = await SupabaseService.update('trips', id, {
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        travelers: tripData.travelers,
        theme: tripData.theme,
        special_requests: tripData.specialRequests,
        preferences: tripData.preferences
      });
      
      return updatedTrip;
    } catch (error) {
      throw error;
    }
  }

  // 删除行程
  static async deleteTrip(id) {
    try {
      await SupabaseService.delete('trips', id);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // 搜索行程
  static async searchTrips(userId, searchParams) {
    try {
      let query = SupabaseService.query('trips', {
        where: { user_id: userId }
      });
      
      // 这里可以添加更复杂的搜索逻辑
      if (searchParams.destination) {
        // 使用模糊搜索
        // Supabase不支持直接模糊搜索，需要自定义逻辑
      }
      
      return await query;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TripService;
