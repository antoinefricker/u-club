import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Eggplant',
        short_name: 'Eggplant',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
      },
    }),
  ],
  server: {
    port: Number(process.env.PWA_PORT) || 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || 4000}`,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
