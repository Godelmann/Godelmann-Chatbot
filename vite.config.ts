import { defineConfig } from 'vite'

// Vanilla-TS Web Component — lib-mode Build zu EINEM versionierten ES-Modul.
// Dev-Server-Port 5011 laut zentraler Port-Registry (5008 ist anderweitig vergeben, Finding CHATBOT-P2-01).
export default defineConfig({
  server: { port: 5011, strictPort: true },
  build: {
    target: 'es2020',
    minify: true,
    copyPublicDir: false,
    lib: {
      entry: 'src/chatbot-widget.ts',
      formats: ['es'],
      fileName: () => 'chatbot-widget.v1.js',
    },
  },
})
