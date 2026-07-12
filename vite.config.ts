import { defineConfig } from 'vite'

// Vanilla-TS Web Component — lib-mode Build zu EINEM versionierten ES-Modul.
// Dev-Server-Port 5008 (CLAUDE.md / Finding CHATBOT-P2-01: Port explizit setzen).
export default defineConfig({
  server: { port: 5008, strictPort: true },
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
