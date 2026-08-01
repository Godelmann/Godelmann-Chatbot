import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const APP_NAME = 'godelmann-chatbot'

// Ohne Versionsangabe liess sich von aussen nicht erkennen, WELCHER Stand
// ausgeliefert wird — beim Abgleich test/prod blieb nur die Dateigroesse.
const gitCommit = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'unknown' }
})()
const appVersion = (() => {
  try { return JSON.parse(readFileSync('package.json', 'utf8')).version }
  catch { return '0.0.0' }
})()
const buildTime = new Date().toISOString()

const emitVersionPlugin = {
  name: 'emit-version-json',
  apply: 'build' as const,
  closeBundle() {
    const outFile = path.resolve(__dirname, 'dist', 'version.json')
    mkdirSync(path.dirname(outFile), { recursive: true })
    writeFileSync(outFile, JSON.stringify({
      name: APP_NAME,
      version: appVersion,
      commit: gitCommit,
      built: buildTime,
      full: `${APP_NAME}-${appVersion}-${gitCommit}-${buildTime}`,
    }, null, 2))
  },
}

import { defineConfig } from 'vite'

// Vanilla-TS Web Component — lib-mode Build zu EINEM versionierten ES-Modul.
// Dev-Server-Port 5011 laut zentraler Port-Registry (5008 ist anderweitig vergeben, Finding CHATBOT-P2-01).
export default defineConfig({
  define: { __WIDGET_VERSION__: JSON.stringify(appVersion) },
  plugins: [emitVersionPlugin],
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
