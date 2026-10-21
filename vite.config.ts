import path from "path"
import react from "@vitejs/plugin-react"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  // the inspect plugin is a dev-time review tool: skip it in production builds
  // so the shipped DOM/JS carries no instrumentation overhead
  plugins: [...(mode === 'development' ? [inspectAttr()] : []), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['react', 'react-dom', 'react-router'],
        },
      },
    },
  },
}));
