const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// 创建Supabase客户端
const supabase = createClient(config.supabase.url, config.supabase.key);

// 添加连接测试方法
supabase.testConnection = async () => {
  try {
    const { data, error } = await supabase.from('trips').select('count').limit(1);
    if (error) {
      console.error('Supabase连接失败:', error.message);
      return false;
    }
    console.log('Supabase连接成功');
    return true;
  } catch (error) {
    console.error('Supabase连接测试异常:', error.message);
    return false;
  }
};

module.exports = supabase;