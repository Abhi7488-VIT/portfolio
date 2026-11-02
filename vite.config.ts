import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { seoPlugin } from './seo.plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Long-cached library chunks. React has its own group (highest priority) so it is never merged
        // into a library that depends on it: Framer Motion must stay in the lazy features chunk's
        // dependency graph and off the first paint.
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: 'gsap', test: /node_modules[\\/]gsap[\\/]/, priority: 20 },
            { name: 'lenis', test: /node_modules[\\/]lenis[\\/]/, priority: 20 },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
