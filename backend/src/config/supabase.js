const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// 创建Supabase客户端
const supabase = createClient(config.supabase.url, config.supabase.key);

module.exports = supabase;