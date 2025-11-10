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

### 使用Docker Compose（推荐）

1. 克隆项目
```bash
git clone https://github.com/your-username/ai-travel-planner.git
cd ai-travel-planner
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入你的API密钥
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:5000
- 健康检查：http://localhost:5000/api/health

### 手动安装

#### 后端

1. 进入后端目录
```bash
cd backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入你的API密钥
```

4. 初始化数据库
```bash
npm run init-db
```

5. 启动服务
```bash
npm run dev
```

#### 前端

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，设置后端API地址
```

4. 启动服务
```bash
npm start
```

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
```

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