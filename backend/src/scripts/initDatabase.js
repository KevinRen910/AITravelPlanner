const supabase = require('../config/supabase');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 执行SQL脚本来创建表
    const { error: sqlError } = await supabase.rpc('execute_sql', {
      sql_script: `
        -- 用户表
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 行程表
        CREATE TABLE IF NOT EXISTS trips (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          destination VARCHAR(255) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          travelers INTEGER DEFAULT 1,
          theme VARCHAR(50),
          special_requests TEXT,
          plan_content JSONB,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 预算表
        CREATE TABLE IF NOT EXISTS budgets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
          total_amount DECIMAL(10, 2) NOT NULL,
          spent_amount DECIMAL(10, 2) DEFAULT 0,
          categories JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 支出表
        CREATE TABLE IF NOT EXISTS expenses (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL,
          category VARCHAR(50) NOT NULL,
          description TEXT,
          date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- API密钥表
        CREATE TABLE IF NOT EXISTS api_keys (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          service VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          key TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, service)
        );

        -- 创建索引以提高查询性能
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
        CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses(budget_id);
        CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
      `
    });

    if (sqlError) {
      console.error('执行SQL脚本失败:', sqlError);
      // 如果RPC不可用，尝试直接执行SQL
      await createTablesManually();
    } else {
      console.log('数据库表创建成功');
    }
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

async function createTablesManually() {
  console.log('尝试手动创建表...');
  // 这里可以添加手动创建表的逻辑
  // 由于Supabase的限制，可能需要通过SQL编辑器手动执行
}

initDatabase();