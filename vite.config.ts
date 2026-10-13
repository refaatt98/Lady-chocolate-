import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // المكتبات الكبيرة بملفات لحالها — المتصفح بيخزّنها وما بتنزل كل ما نعدّل الموقع
        codeSplitting: {
          groups: [
            { name: 'supabase', test: /node_modules[\\/]@supabase/ },
            { name: 'motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
