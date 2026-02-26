import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Mirror the Nginx proxy behaviour so local dev matches production.
    // Requests to /api/* are forwarded to the API and the /api prefix is stripped,
    // exactly as nginx.conf does with its trailing-slash proxy_pass.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
