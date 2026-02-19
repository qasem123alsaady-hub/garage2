
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    host: true, // أضف هذا السطر
    allowedHosts: [
      'garage2-1.onrender.com',
      '.onrender.com' // أضف هذا ليشمل جميع نطاقات render.com
    ]
  }
})
