require('dotenv').config();

const supabase = require('../config/supabase');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 检查表是否已存在
    console.log('检查数据库表状态...');
    
    const tables = ['users', 'trips', 'budgets', 'expenses', 'api_keys'];
    
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          // 表不存在错误
          console.log('[ERROR] 表 "' + tableName + '" 不存在');
        } else {
          console.log('[ERROR] 检查表 "' + tableName + '" 时出错:', error.message);
        }
      } else {
        console.log('[SUCCESS] 表 "' + tableName + '" 已存在');
      }
    }
    
    console.log('\n数据库初始化检查完成');
    console.log('请参考backend/db/init.sql文件中的SQL语句，在Supabase控制台中手动创建表。');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

initDatabase();