import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr : true,
    host: '0.0.0.0',  // Isso permite acesso de qualquer dispositivo na rede
    port: 5173,       // Você pode escolher outra porta se preferir
    open: false        // Isso abrirá automaticamente o navegador
  }
})
