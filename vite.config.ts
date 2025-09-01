import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import flowbiteReact from "flowbite-react/plugin/vite";
// import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react(), flowbiteReact()],
  server: {
    port: 3001,
    host: "0.0.0.0",
    // open: true,
    // https: {
    //   key: fs.readFileSync('./privkey.pem'),
    //   cert: fs.readFileSync('./fullchain.pem'),
    // },
    hmr: {
      host: '10.10.0.3',
       path: "/",
    },
    allowedHosts:[
      '10.10.0.3',
    ],
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:4001",
    //     changeOrigin: true,
    //     secure: false,
    //     ws: true,
    //     configure: (proxy, options) => {
    //       // Removed invalid property 'withCredentials'
    //       return proxy;
    //     },
    //   },
    // }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname,  'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@services': path.resolve(__dirname, 'src/services')
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Opcional, evita el warning de chunks >500KB
    rollupOptions: {
      output: {
        manualChunks: {
          // UI libs
          ui: ['flowbite-react', 'lucide-react'],
          // Calendario
          calendar: [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/timegrid'
          ],
          // React + routing
          react: ['react', 'react-dom', 'react-router-dom'],
          // Zustand state management
          zustand: ['zustand'],
          // Tables
          table: ['@tanstack/react-table'],
        },
      },
    },
  },
});