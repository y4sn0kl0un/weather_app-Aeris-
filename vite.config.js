import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
    base: "/",
    server: {
        proxy: {
            '/api': {
                target: 'https://alternately-nonpejorative-maisha.ngrok-free.dev/', // адрес FastAPI
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
})
