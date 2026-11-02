import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Порт зашит в redirect URI Яндекса и VK, поэтому не даём Vite взять другой.
    port: 5173,
    strictPort: true,
    // API на том же origin: cookie refresh_token работает во всех браузерах, CORS не нужен.
    proxy: { '/api': 'http://localhost:5087' },
  },
})
