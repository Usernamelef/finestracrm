import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
          crm: [
            './src/components/crm/dashboardtab',
            './src/components/crm/reservationstab',
            './src/components/crm/salletab',
            './src/components/crm/clientstab',
            './src/components/crm/historiquetab'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['lucide-react']
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
