import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'antd-vendor',
              test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-.+)[\\/]/,
              priority: 20,
              maxSize: 450 * 1024,
            },
            {
              name: 'chart-vendor',
              test: /node_modules[\\/](recharts|d3-.+|victory-vendor)[\\/]/,
              priority: 15,
            },
            {
              name: 'utils-vendor',
              test: /node_modules[\\/](axios|zustand|jszip|mockjs|@cloudbase|md5)[\\/]/,
              priority: 10,
              maxSize: 450 * 1024,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
