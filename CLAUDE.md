# Godelmann-Chatbot

KI-Chat-Widget für godelmann.de — Web Component `<godelmann-chatbot>` in
Vanilla TypeScript (WHATWG Custom Element + Shadow DOM, KEINE
Framework-Dependency). Verbindliche Spezifikation: `docs/ANFORDERUNGEN.md`;
Integrations-Doku für die Agentur: `docs/EINBINDUNG.md`.

## Common Commands
```bash
npm run dev          # Standalone-Preview (index.html) auf http://localhost:5011
npm run build        # tsc --noEmit + Vite lib-mode -> dist/chatbot-widget.v1.js
npm run lint         # ESLint
```

## Tech Stack
- Vanilla TypeScript + Vite (lib-mode, EIN ES-Modul `dist/chatbot-widget.v1.js`, Gate < 80 kB gzip)
- Kein React/Tailwind/shadcn — Styling im Shadow DOM, Theming über CSS-Custom-Properties
- Backend: `godelmann-chatbot-server` (spass `examples/`, test-PORT 3011) — `POST /api/chat` (SSE) + `GET /altcha/challenge`
- Dev-Port: 5011 (explizit in `vite.config.ts`)
- Domain: Test `https://chatbot-test.godelmann.net` (LIVE seit 2026-07-12, LE-Cert); Prod-DNS `chatbot.godelmann.net` -> godelmann-prod angelegt (Serving-Setup dort noch offen)
- GitHub: Godelmann/Godelmann-Chatbot
## Doku-Pflege (PFLICHT)

`docs/BACKLOG.md` ist der Release-/Feature-Log dieses Frontends. **Regel:** Der `> Stand:`-Kopf MUSS die aktuelle `package.json`-Version nennen, und jedes gelieferte Release wird dort nachgetragen — nicht nur CR-Status. Der `/do-everything`-Lauf erzwingt das via **Frontend-Release-Sync-Check** (Audit `package.json` ↔ BACKLOG-Kopf; warnt auch, wenn ein Frontend gar kein BACKLOG hat). Memory: `feedback_frontend_backlog_version_sync`.

## Security-Audit (2026-07-12)

Teil des BLUEITS/REDITS Fleet-Audits. **0 Findings** (0). Belege: `docs/FINDINGS-2026-07-12.md` · Tracker: `docs/AUDIT-2026-07-12.md` · Register: `BLUEITS-GmbH/.xoder/FINDINGS.md`.
Vor Änderungen an Sicherheits-Code die Findings prüfen; Erledigtes als „resolved" markieren.

## Git-Konventionen (XODER-Standard)

Verbindlich fuer Commits/PRs in diesem Repo: siehe org-weites `.xoder/GITHUB.md`.
Kurz: **KEIN AI-/Co-Authored-By-Footer** (flottenweite Pflicht), Conventional Commits
(`type(scope): subject`, Imperativ), ASCII. Protected Branches nur ueber PR.
