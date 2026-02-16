import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: process.env.PORT || 3000, // استخدام PORT من Render أو 3000 كبديل
    host: '0.0.0.0', // السماح بالاتصالات من جميع العناوين
    strictPort: true // التأكد من استخدام المنفذ المحدد
  },
  preview: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    strictPort: true
  }
})
