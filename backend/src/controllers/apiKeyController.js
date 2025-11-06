const supabase = require('../config/supabase');

class ApiKeyController {
  // 获取用户的API密钥
  async getUserApiKeys(req, res) {
    try {
      const { userId } = req.params;
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // 不返回实际的API密钥，只返回名称和状态
      const sanitizedData = data.map(item => ({
        id: item.id,
        service: item.service,
        name: item.name,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      res.status(200).json(sanitizedData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 更新API密钥
  async updateApiKeys(req, res) {
    try {
      const { userId } = req.params;
      const { apiKeys } = req.body; // 格式: [{ service: 'ai', key: 'xxx' }, { service: 'speech', key: 'yyy' }]
      
      // 为每个API密钥创建或更新记录
      for (const apiKeyData of apiKeys) {
        const { service, key } = apiKeyData;
        
        // 检查是否已存在该服务的API密钥
        const { data: existingKey } = await supabase
          .from('api_keys')
          .select('id')
          .eq('user_id', userId)
          .eq('service', service)
          .single();
        
        if (existingKey) {
          // 更新现有密钥
          await supabase
            .from('api_keys')
            .update({
              key,
              is_active: true,
              updated_at: new Date()
            })
            .eq('id', existingKey.id);
        } else {
          // 创建新密钥
          await supabase
            .from('api_keys')
            .insert({
              user_id: userId,
              service,
              key,
              name: `${service} API Key`,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            });
        }
      }
      
      res.status(200).json({ message: 'API密钥更新成功' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ApiKeyController();