import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  base: '/dashboard/',
  plugins: [
    react(), 
    tailwindcss(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Performance optimizations
  build: {
    // Enable source maps for debugging in production (can be disabled for even smaller bundles)
    sourcemap: false,
    // Increase chunk size warning limit (we'll optimize to stay under)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI libraries chunk
          ui: ['@heroicons/react', 'recharts'],
          // Data fetching chunk
          data: ['@tanstack/react-query', 'axios'],
          // Utils and smaller libraries
          utils: ['tailwind-merge', 'react-datepicker']
        },
        // Better naming for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        // Remove debugger statements
        drop_debugger: true,
        // Remove unused code
        dead_code: true
      }
    },
    // Enable tree shaking
    target: 'esnext',
    // Optimize CSS
    cssCodeSplit: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'recharts'
    ]
  },
  // Enable module preloading
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  }
})
