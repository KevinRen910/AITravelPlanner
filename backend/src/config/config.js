const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  ai: {
    apiKey: process.env.AI_API_KEY,
    baseUrl: process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1',
    model: process.env.AI_MODEL || 'qwen3-max',  // 修改为阿里云百炼可用的模型
    workspace: process.env.AI_WORKSPACE || 'default'
  },
  speech: {
    apiKey: process.env.SPEECH_API_KEY,
    appId: process.env.SPEECH_APP_ID,
    apiSecret: process.env.SPEECH_API_SECRET
  },
  map: {
    apiKey: process.env.MAP_API_KEY
  }
};