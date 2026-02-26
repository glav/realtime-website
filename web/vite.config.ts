import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
  },
  optimizeDeps: {
    // Pre-bundle React dependencies
    include: ['react', 'react-dom'],
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
})
