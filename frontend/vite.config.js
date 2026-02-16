import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['garage2-r68a.onrender.com'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['garage2-r68a.onrender.com']
  }
})
