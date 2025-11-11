# 使用Node.js官方镜像作为基础
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 5000

# 设置启动命令
CMD ["npm", "start"]