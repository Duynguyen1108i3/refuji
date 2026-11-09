import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/refuji-system/**',
        '**/dist/**',
        '**/*.sqlite*',
        '**/data/**',
        '**/.git/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res: any) => {
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  message:
                    'Máy chủ Backend (Port 4000) không phản hồi hoặc đang tắt. Vui lòng chạy lệnh: npm run server (hoặc npm run dev).',
                })
              );
            }
          });
        },
      },
    },
  },
});
