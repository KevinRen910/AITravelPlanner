import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // 不移除 /api 前缀，保持与后端路由挂载一致（后端使用 app.use('/api/speech', ...))
        // 若需要去掉前缀，请确保后端挂载路径与代理规则匹配
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})