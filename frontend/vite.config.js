import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['garage2-r68a.onrender.com'] // إضافة المضيف المسموح به
  },
  preview: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['garage2-r68a.onrender.com'] // إضافة نفس المضيف للمعاينة
  }
})
