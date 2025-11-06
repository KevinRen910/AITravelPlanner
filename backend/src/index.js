const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const speechRoutes = require('./routes/speechRoutes'); // 新增语音识别路由

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/speech', speechRoutes); // 新增语音识别路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    services: {
      database: 'Supabase',
      ai: process.env.AI_API_KEY ? 'Configured' : 'Not configured',
      speech: process.env.SPEECH_API_KEY ? 'Configured' : 'Not configured',
      map: process.env.MAP_API_KEY ? 'Configured' : 'Not configured'
    }
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`AI旅行规划师后端服务运行在端口 ${PORT}`);
  console.log(`健康检查地址: http://localhost:${PORT}/api/health`);
});