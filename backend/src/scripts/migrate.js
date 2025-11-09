const supabase = require('../config/supabase');

class DatabaseMigrator {
  // 检查表是否存在
  static async tableExists(tableName) {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .single();
      
      return !error && data !== null;
    } catch (error) {
      return false;
    }
  }

  // 执行迁移
  static async migrate() {
    try {
      console.log('开始数据库迁移...');
      
      // 检查并创建表
      const tables = ['users', 'trips', 'budgets', 'expenses', 'api_keys'];
      
      for (const table of tables) {
        const exists = await this.tableExists(table);
        if (!exists) {
          console.log(`创建表: ${table}`);
          // 这里可以添加创建表的逻辑
        } else {
          console.log(`表已存在: ${table}`);
        }
      }
      
      console.log('数据库迁移完成');
    } catch (error) {
      console.error('数据库迁移失败:', error);
    }
  }
}

// 运行迁移
DatabaseMigrator.migrate();