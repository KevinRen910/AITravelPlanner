# AI旅行规划师

这是一个基于AI的旅行规划应用，可以帮助用户智能规划旅行行程，管理预算，并提供语音输入功能。

## 功能特点

1. **智能行程规划**：通过AI根据用户需求生成个性化的旅行路线
2. **语音输入**：支持语音输入旅行需求和支出记录
3. **预算管理**：记录和管理旅行开销
4. **用户管理**：注册登录系统，保存和管理多份旅行计划
5. **云端同步**：旅行计划、偏好设置、费用记录等数据云端同步
6. **地图集成**：集成地图服务，提供地理位置展示

## 技术栈

- **前端**：React + TypeScript + Ant Design + Redux Toolkit
- **后端**：Node.js + Express + Supabase
- **AI服务**：支持OpenAI GPT、阿里云百炼等大语言模型
- **语音识别**：科大讯飞语音识别API + 浏览器原生语音识别
- **地图服务**：高德地图API
- **数据库**：Supabase (PostgreSQL)
- **部署**：Docker + Docker Compose

## 快速开始

### 使用阿里云Docker镜像（推荐）

1. 确保已安装Docker

2. 拉取Docker镜像
   - 后端镜像：
   ```powershell
   docker pull crpi-ujexkms7mmv36v3z.cn-hangzhou.personal.cr.aliyuncs.com/rkw/ai_travel_planner_backend:latest
   ```
   
   - 前端镜像：
   ```powershell
   docker pull crpi-ujexkms7mmv36v3z.cn-hangzhou.personal.cr.aliyuncs.com/rkw/ai_travel_planner_frontend:latest
   ```

3. 准备环境变量配置文件
   创建一个`.backend.env`文件，包含以下内容：
   
      # 服务器配置
      PORT=5000
      NODE_ENV=development
      JWT_SECRET=your-jwt-secret-key-here

      # Supabase数据库配置
      SUPABASE_URL=https://ffcytowqrvliilubjgkl.supabase.co
      SUPABASE_KEY=YOUR_SUPABASE_KEY

      # 阿里云百炼AI服务配置
      AI_API_KEY=YOUR_AI_API_KEY
      AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
      AI_MODEL=qwen3-max  
      AI_WORKSPACE=YOUR_AI_WORKSPACE

      # 语音识别配置（科大讯飞）
      SPEECH_API_KEY=YOUR_SPEECH_API_KEY
      SPEECH_APP_ID=YOUR_SPEECH_APP_ID
      SPEECH_API_SECRET=YOUR_SPEECH_API_SECRET

      # 地图服务配置（高德地图）
      MAP_API_KEY=YOUR_MAP_API_KEY

      # 前端配置
      REACT_APP_API_URL=http://localhost:5000/api

创建一个`.frontend.env`文件，包含以下内容：
      # 前端环境变量配置
      VITE_API_URL=http://localhost:5000/api

      # AI服务配置
      VITE_AI_SERVICE_URL=http://localhost:5000/api/ai

      # 地图服务配置  
      VITE_MAP_SERVICE_URL=http://localhost:5000/api/map
      VITE_MAP_API_KEY=YOUR_MAP_API_KEY  

      # 语音服务配置
      VITE_SPEECH_SERVICE_URL=http://localhost:5000/api/speech


4. 运行后端容器
   ```powershell
   # Windows PowerShell 单行命令
   docker run -d --name ai-travel-backend -p 5000:5000 --env-file .backend.env crpi-ujexkms7mmv36v3z.cn-hangzhou.personal.cr.aliyuncs.com/rkw/ai_travel_planner_backend:latest
   
   # 或在Linux/Mac终端使用多行命令
   # docker run -d \
   #   --name ai-travel-backend \
   #   -p 5000:5000 \
   #   --env-file .backend.env \
   #   crpi-ujexkms7mmv36v3z.cn-hangzhou.personal.cr.aliyuncs.com/rkw/ai_travel_planner_backend:latest
   ```

5. 运行前端容器
   ```powershell
   # Windows PowerShell 单行命令
   docker run -d --name ai-travel-frontend -p 3000:3000 --env-file .frontend.env crpi-ujexkms7mmv36v3z.cn-hangzhou.personal.cr.aliyuncs.com/rkw/ai_travel_planner_frontend:latest
   
   # 或在Linux/Mac终端使用多行命令
   # docker run -d \
   #   --name ai-travel-frontend \
   #   -p 3000:3000 \
   #   --env-file .frontend.env \
   #   crpi-ujexkms7mmv36v3z.cn-hangzhou.personal.cr.aliyuncs.com/rkw/ai_travel_planner_frontend:latest
   ```

6. 访问应用
   - 前端：http://localhost:3000
   - 后端API：http://localhost:5000
   - 健康检查：http://localhost:5000/api/health

### 使用Docker Compose（备选方案）

1. 克隆项目
```powershell
# 可选，如果需要使用docker-compose方式部署
git clone https://github.com/your-username/ai-travel-planner.git
cd ai-travel-planner
```

2. 配置环境变量
```powershell
cp .env.example .env
# 编辑.env文件，填入你的API密钥
```

3. 启动服务
```powershell
docker-compose up -d
```

4. 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:5000

## API密钥配置

为了使用所有功能，您需要配置以下API密钥：

1. **AI模型API密钥**：用于生成旅行计划和预算分析
   - 支持OpenAI、阿里云百炼等大语言模型API

2. **语音识别API密钥**：用于语音输入功能
   - 支持科大讯飞等语音识别API

3. **地图服务API密钥**：用于地图显示和导航功能
   - 支持高德地图、百度地图等地图API

4. **数据库服务**：Supabase项目URL和密钥

您可以在应用的"API密钥设置"页面中配置这些密钥，或者在环境变量中设置。

### 数据库初始化

项目使用Supabase作为数据库服务。首次运行前需要：

1. 在Supabase创建项目并获取连接信息
2. 运行数据库初始化脚本：
   在SQL Editor界面复制 backend/db/init.sql 的全部内容并粘贴，点击run运行

### 功能测试

项目包含以下主要功能测试点：

1. **用户注册登录**：完整的用户认证流程
2. **行程规划**：AI生成个性化旅行计划
3. **语音输入**：语音识别功能测试
4. **预算管理**：费用记录和统计分析
5. **地图集成**：地理位置展示和导航

### 部署说明

项目支持多种部署方式：

1. **本地开发**：使用Docker Compose或手动安装
2. **云服务器**：使用Docker部署到云服务器
3. **容器平台**：部署到Kubernetes等容器平台

## 注意事项

1. **API密钥安全**：不要将API密钥提交到版本控制系统
2. **语音识别限制**：部分浏览器可能需要HTTPS才能使用语音识别
3. **AI服务费用**：使用AI服务会产生费用，请注意使用量
4. **地图服务配额**：地图API有使用配额限制

## 许可证

MIT License