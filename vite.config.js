import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: "/",
    server: {
        proxy: {
            '/api': {
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
        host: true
    },
    preview: {
        host: true,
        strictPort: true,
        port: 4173,
        allowedHosts: [
            "frontend-production-95bb.up.railway.app"
        ]
    }
})