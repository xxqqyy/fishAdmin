import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('antd') || id.includes('@ant-design/icons')) {
            return 'antd';
          }

          if (id.includes('react-router-dom')) {
            return 'router';
          }
        }
      }
    }
  }
});
