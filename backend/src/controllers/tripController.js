const supabase = require('../config/supabase');
const aiService = require('../services/aiService');

// 格式化AI服务返回的行程计划内容（纯格式化函数）
function formatTripPlanContent(tripPlan) {
  try {
    if (!tripPlan) return '暂无详细的行程安排信息';

    // 如果传入的是字符串，直接返回
    if (typeof tripPlan === 'string') return tripPlan;

    let content = '';

    // 处理日程（如果存在 dailyItinerary）
    if (tripPlan.dailyItinerary && Array.isArray(tripPlan.dailyItinerary)) {
      content += '📅 日程安排：\n';
      for (const day of tripPlan.dailyItinerary) {
        const date = day.date || day.day || '日期未知';
        content += `- ${date}: ${day.activities?.join('；') || day.summary || ''}\n`;
      }
      content += '\n';
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

    // 如果上面都没有内容，尝试返回 plan_content 或整个对象的 JSON
    if (!content.trim()) {
      if (tripPlan.plan_content) return tripPlan.plan_content;
      return JSON.stringify(tripPlan, null, 2);
    }

    return content;
  } catch (error) {
    console.error('格式化行程计划内容失败:', error);
    try {
      return JSON.stringify(tripPlan, null, 2);
    } catch (e) {
      return '无法格式化行程计划内容';
    }
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

      // 调用 AI 服务生成行程计划，并在失败时返回 502（不再使用 mock 回退）
      console.log('调用AI服务生成行程计划...');
      let tripPlan;
      try {
        tripPlan = await aiService.generateTripPlan({
          destination,
          start_date,
          end_date,
          travelers,
          theme,
          special_requests,
          preferences
        });
      } catch (aiError) {
        console.error('调用 AI 服务失败:', aiError);
        // 返回 502 并在响应中包含错误信息，方便前端和日志排查
        return res.status(502).json({
          error: 'AI 服务不可用，生成行程失败',
          details: aiError?.message || String(aiError)
        });
      }

      // 如果 AI 返回为空或结构不合理，则报错（不使用 mock）
      if (!tripPlan) {
        console.error('AI 服务未返回有效的行程计划');
        return res.status(502).json({ error: 'AI 服务未返回有效的行程计划，请稍后重试' });
      }

      console.log('AI服务返回的数据:', JSON.stringify(tripPlan, null, 2));

      // 处理AI服务返回的数据结构
      // 我们对 plan_content 做统一封装：
      // - 若 AI 返回字符串，则存为 { structured: null, text: string }
      // - 若 AI 返回对象，则存为 { structured: <object>, text: <human_readable_text> }
      // 这样前端只需优先读取 plan_content.text（human readable），并可在需要时使用 plan_content.structured
      let storedPlanContent;
      let estimatedBudget = 0;
      let planText = '';

      if (typeof tripPlan === 'string') {
        // 如果返回字符串，作为纯文本保留
        planText = tripPlan;
        storedPlanContent = {
          structured: null,
          text: planText,
          ai_raw: tripPlan
        };
      } else if (tripPlan.plan_content && typeof tripPlan.plan_content === 'object') {
        // 如果 provider 已携带 plan_content（可能是结构化），使用该结构
        const structured = tripPlan.plan_content;
        planText = formatTripPlanContent(structured);
        storedPlanContent = {
          structured,
          text: planText,
          ai_raw: tripPlan
        };
        estimatedBudget = tripPlan.estimated_budget || tripPlan.budgetEstimation?.total || 0;
      } else if (tripPlan && typeof tripPlan === 'object') {
        // 如果返回的是一个对象（例如包含 dailyItinerary），把它当作结构化数据保存，并生成文本摘要
        const structured = tripPlan;
        planText = formatTripPlanContent(structured);
        storedPlanContent = {
          structured,
          text: planText,
          ai_raw: tripPlan
        };
        estimatedBudget = tripPlan.budgetEstimation?.total || tripPlan.estimated_budget || 0;
      } else {
        // 兜底：序列化保存并生成文本
        const asText = String(tripPlan || '');
        planText = asText;
        storedPlanContent = {
          structured: null,
          text: planText,
          ai_raw: tripPlan
        };
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
        plan_content: storedPlanContent,
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
      // 返回给前端：既保留数据库记录，又显式返回可直接展示的纯文本摘要（plan_text），以便兼容不同前端实现
      const created = data[0];
      const tripResponse = Object.assign({}, created, { plan_text: planText });
      res.status(201).json({
        message: '行程创建成功',
        trip: tripResponse
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