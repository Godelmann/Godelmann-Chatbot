# Godelmann-Chatbot

KI-Chat Widget für godelmann.de — React/Vite/TypeScript Frontend.

## Common Commands
```bash
npm run dev          # Dev-Server auf http://localhost:5008
npm run build        # Production Build
npm run lint         # ESLint
```

## Tech Stack
- React 18 + Vite + TypeScript + Tailwind + shadcn/ui + SPASS
- Shared Supabase mit GoCreate (Port 8010)
- Domain: (noch nicht zugewiesen)
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
