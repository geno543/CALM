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
    proxy: {
      // SSE streaming endpoint — configured separately to prevent buffering
      '/api/chat/stream': {
        target:        'http://localhost:8000',
        changeOrigin:  true,
        rewrite:       (path) => path.replace(/^\/api/, ''),
        timeout:       0,          // no proxy timeout for long-running SSE
        proxyTimeout:  0,          // no upstream timeout
        configure:    (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Cache-Control', 'no-cache');
            proxyReq.setHeader('Connection', 'keep-alive');
          });
          proxy.on('proxyRes', (proxyRes) => {
            // Disable nginx/proxy buffering for SSE
            proxyRes.headers['x-accel-buffering'] = 'no';
            proxyRes.headers['cache-control']     = 'no-cache';
          });
        },
      },
      // All other API routes
      '/api': {
        target:       'http://localhost:8000',
        changeOrigin: true,
        rewrite:      (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
