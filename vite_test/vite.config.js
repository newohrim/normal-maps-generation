import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/normal-maps-generation/vite_test/",
  plugins: [react()],
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
