import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({ ... })  <--- DELETE OR COMMENT OUT THIS ENTIRE BLOCK
  ],
})