const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const aiRoutes = require('./routes/aiRoutes');
const mapRoutes = require('./routes/mapRoutes');
const speechRoutes = require('./routes/speechRoutes');
const config = require('./config/config');
const supabase = require('./config/supabase'); // 导入Supabase

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true
}));

// 路由
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/speech', speechRoutes);

// 健康检查端点，添加数据库连接状态
app.get('/api/health', async (req, res) => {
  const dbConnected = await supabase.testConnection();
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'Connected' : 'Disconnected',
      ai: process.env.AI_API_KEY ? 'Configured' : 'Not Configured',
      speech: process.env.SPEECH_API_KEY ? 'Configured' : 'Not Configured',
      map: process.env.MAP_API_KEY ? 'Configured' : 'Not Configured'
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const PORT = config.port || 5000;

// 启动服务器并测试连接
const startServer = async () => {
  try {
    // 测试Supabase连接
    const dbConnected = await supabase.testConnection();
    
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
      console.log(`语音识别服务: ${process.env.SPEECH_API_KEY ? '已配置' : '未配置'}`);
      console.log(`地图服务: ${process.env.MAP_API_KEY ? '已配置' : '未配置'}`);
      console.log(`AI服务: ${process.env.AI_API_KEY ? '已配置' : '未配置'}`);
      console.log(`数据库连接: ${dbConnected ? '成功' : '失败'}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();