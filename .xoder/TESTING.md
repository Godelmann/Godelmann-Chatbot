# TESTING.md — Godelmann-Chatbot

Gates + Abnahme. Konventionen/Details: `CLAUDE.md`, `docs/ANFORDERUNGEN.md`.

## Pflicht-Gates vor Commit
```bash
npm run build     # = tsc --noEmit + Vite lib-mode  -> dist/chatbot-widget.v1.js   (0 Fehler PFLICHT)
npm run lint      # ESLint (typescript-eslint) — 0 Errors
```
- `tsc --noEmit` ist Teil von `npm run build` (Script `"build": "tsc --noEmit && vite build"`) — ein reiner
  Vite-Build wuerde Typfehler verschlucken.
- **Bundle-Gate:** `dist/chatbot-widget.v1.js` < **80 kB gzip** (aktuell ~7,4 kB). Pruefen:
  `gzip -c dist/chatbot-widget.v1.js | wc -c`. Self-contained (keine externen Ressourcen im Modul).

> **Kein In-Repo-Unit-Test-Framework.** `package.json` definiert nur `dev`/`build`/`lint`/`preview` — es gibt
> **kein** `npm run test` (kein Vitest/jsdom in diesem Widget-Repo). Verhaltens-Verifikation lief als **externer
> Headless-E2E** (Playwright/Chromium gegen einen Mock-Server mit crate-identischer ALTCHA-Verifikation,
> 30/30 Checks gruen, s. `docs/BACKLOG.md` § Release-Historie 0.0.1) — dieser Harness liegt **nicht** im Repo.
> [PRUEFEN]/TODO: reproduzierbaren E2E-Harness (oder minimale Vitest-Smoke-Suite fuer Markdown-Sanitizer +
> ALTCHA-Payload-Format) ins Repo aufnehmen, damit die Abnahme wiederholbar wird.

## Standalone-Preview (Referenz-Einbindung)
```bash
npm run dev       # Vite Dev-Server auf http://localhost:5011 (strictPort) — index.html bettet das Widget ein
npm run preview   # Vorschau des Prod-Builds
```
- `index.html` ist die **Referenz-Einbettungsseite** (wie die Agentur einbindet) und dient als manuelle
  Sicht-Pruefung (Bubble/Panel, Theming ueber CSS-Custom-Properties, Events in der Konsole).

## E2E-Abnahme (laut `docs/ANFORDERUNGEN.md` § Abnahme) — gegen den vhost
- **Grounded-Chat:** anonyme Frage ueber `chatbot-test.godelmann.net` → deutsche Antwort mit **godelmann.de-Quelle**
  (`knowledge_search` im Trace), Folgefrage im selben Verlauf (`x-conversation-id`).
- **Rate-Limit-Negativtest:** 11. Nachricht innerhalb 10 min → `429` (freundliche Meldung im Widget).
- **ALTCHA-Flow:** frische Loesung je Nachricht; manipuliertes Payload → `400 captcha_required` + 1 Auto-Retry.
- **CORS-Negativtest:** `POST /api/chat` von fremder Origin wird blockiert; von godelmann.de erlaubt.
- **Browser-E2E (Chrome):** Widget auf einer Test-Einbettungsseite laden, Bubble → Chat durchspielen.
  (SSO/Login nicht noetig — der Chat ist anonym; Claude gibt keine Passwoerter ein.)

## Gefahrlose Stage-Pruefungen
- `GET /chatbot-widget.v1.js` (200) + `GET /altcha/challenge` (JSON) auf beiden Stages (`.xoder/HEALTHCHECK.md`).
- chatbot-server-Status read-only (`systemctl status`/`journalctl`) via 2-Hop ueber control — keine Mutationen.
