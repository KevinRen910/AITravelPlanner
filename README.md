# AI旅行规划师

## 项目介绍
AI旅行规划师是一款基于大语言模型的智能旅行助手，能够根据用户需求自动生成详细的旅行路线和建议，并提供实时旅行辅助。该项目采用前后端分离架构，集成了AI智能规划、语音识别、地图导航等核心功能。



## 后端代码文件职责

### 基础配置文件
1. **backend/package.json**
   - 项目依赖管理文件，定义了Node.js后端项目的所有依赖包、脚本命令和项目信息。

2. **backend/Dockerfile**
   - Docker容器构建配置文件，用于定义如何将后端应用打包成Docker镜像。

3. **backend/src/index.js**
   - 应用程序入口文件，负责启动Express服务器、加载中间件和路由。

### 配置相关文件
4. **backend/src/config/config.js**
   - 项目配置管理文件，负责从环境变量中加载配置项并导出。

5. **backend/src/config/supabase.js**
   - Supabase数据库连接配置文件，创建并导出Supabase客户端实例用于数据库操作。

### 服务层文件
6. **backend/src/services/aiService.js**
   - AI服务模块，封装了与大语言模型交互的逻辑，用于生成智能行程规划建议。

7. **backend/src/services/speechService.js**
   - 语音识别服务模块，封装了语音转文本的功能，支持旅行相关语音指令的处理。

### 控制器和路由
8. **backend/src/controllers/tripController.js**
   - 行程控制器，处理与行程相关的业务逻辑，包括创建、更新、获取行程等功能。

9. **backend/src/routes/tripRoutes.js**
   - 行程路由配置，定义了与行程相关的API端点和对应的控制器方法。

## 前端代码文件职责

### 基础配置文件
1. **frontend/package.json**
   - 前端项目依赖管理文件，定义了React前端项目的所有依赖包、脚本命令和项目信息。

2. **frontend/Dockerfile**
   - 前端Docker容器构建配置文件，用于定义如何将前端应用打包成Docker镜像。

3. **frontend/tsconfig.json** 和 **frontend/tsconfig.node.json**
   - TypeScript配置文件，定义了TypeScript编译选项。

4. **frontend/vite.config.ts**
   - Vite构建工具配置文件，配置开发服务器、构建选项和插件。

### 入口和应用组件
5. **frontend/src/index.tsx**
   - 前端应用入口文件，负责渲染React应用到DOM并配置Redux Provider。

6. **frontend/src/App.tsx**
   - 应用主组件，配置路由和整体布局。

7. **frontend/src/index.css** 和 **frontend/src/App.css**
   - 全局样式和应用组件样式文件。

### Redux状态管理
8. **frontend/src/store/index.ts**
   - Redux存储配置文件，创建和导出Redux store实例。

9. **frontend/src/store/features/tripSlice.ts**
   - 旅行计划状态管理模块，处理旅行计划相关的状态操作。
   - 包含行程列表、当前行程、加载状态和错误信息的管理。

10. **frontend/src/store/features/userSlice.ts**
    - 用户状态管理模块，处理用户认证、用户信息和首选项的状态操作。

11. **frontend/src/store/features/budgetSlice.ts**
    - 预算状态管理模块，处理预算、支出和费用跟踪的状态操作。

## 技术栈

- **前端**: React.js + TypeScript + Ant Design + Redux Toolkit + Vite
- **后端**: Node.js + Express.js
- **数据库**: Supabase (PostgreSQL)
- **AI模型**: 大语言模型API
- **部署**: Docker容器化

## 核心功能
1. **智能行程规划**: 基于用户需求自动生成个性化旅行路线
2. **费用预算与管理**: 估算旅行成本并进行预算规划
3. **语音交互**: 支持语音输入/输出，提升用户体验
4. **用户管理**: 用户注册、登录和个人数据管理

## 后续更新说明
后续项目功能增加或修改时，将及时同步更新此README文件内容。