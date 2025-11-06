const supabase = require('../config/supabase');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 创建用户表
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError) console.error('创建用户表失败:', usersError);
    else console.log('用户表创建成功');
    
    // 创建行程表
    const { error: tripsError } = await supabase.rpc('create_trips_table');
    if (tripsError) console.error('创建行程表失败:', tripsError);
    else console.log('行程表创建成功');
    
    // 创建预算表
    const { error: budgetsError } = await supabase.rpc('create_budgets_table');
    if (budgetsError) console.error('创建预算表失败:', budgetsError);
    else console.log('预算表创建成功');
    
    // 创建支出表
    const { error: expensesError } = await supabase.rpc('create_expenses_table');
    if (expensesError) console.error('创建支出表失败:', expensesError);
    else console.log('支出表创建成功');
    
    // 创建API密钥表
    const { error: apiKeysError } = await supabase.rpc('create_api_keys_table');
    if (apiKeysError) console.error('创建API密钥表失败:', apiKeysError);
    else console.log('API密钥表创建成功');
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

initDatabase();