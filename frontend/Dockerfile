# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 服务阶段
FROM nginx:alpine

# 复制构建产物到Nginx静态文件目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制Nginx配置文件（如果需要自定义）
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3000

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]