import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env files based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  
  return {
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
    // Expose VITE_* env vars to the client via globalThis.__VITE_ENV__
    define: {
      'globalThis.__VITE_ENV__': JSON.stringify(env),
    },
  }
})
