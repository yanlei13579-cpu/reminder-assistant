import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/reminder-assistant/',
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
