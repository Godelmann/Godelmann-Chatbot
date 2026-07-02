# CHATBOT-P3-01: README.md projektspezifisch machen

| | |
|---|---|
| **Projekt** | CHATBOT |
| **Schweregrad** | P3 |
| **Bereich** | Dokumentation / README |
| **Entdeckt** | 2026-07-02 (Multi-Agent-Audit) |
| **Status** | OPEN |

## Symptom
Die `README.md` im Repo-Root des Chatbot-Frontends enthält ausschliesslich den unveränderten Vite-Templatetext („React + TypeScript + Vite"). Sie beschreibt weder das Projekt (Godelmann Chatbot), noch Stage/Ports, Dev-Flow, Deploy oder Architektur. Damit widerspricht sie der plattformweiten Konvention aussagekräftiger, projektspezifischer READMEs.

## Root Cause
Das Repo wurde aus dem Standard-Vite-React-TypeScript-Template erzeugt und die generierte `README.md` wurde nie durch projektspezifischen Inhalt ersetzt. Sie ist reiner Boilerplate-Text (Template-Beschreibung, ESLint-Konfigurationshinweise) ohne Bezug zum Chatbot-Frontend.

## Beleg
`README.md`, Zeile 1 ff. — verbatim Vite-Template:
```
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:
- [@vitejs/plugin-react] ...
- [@vitejs/plugin-react-swc] ...
## React Compiler
## Expanding the ESLint configuration
```
Keine Erwähnung von „Chatbot", „Godelmann", „SPASS", Stage-URL, Port oder Deploy. Repo-Root enthält bereits `CLAUDE.md` und `docs/BACKLOG.md`, aus denen projektspezifischer Kontext übernommen werden kann.

## Auswirkung
Rein dokumentarisch, keine Funktions- oder Sicherheitsfolge auf Test oder Prod. Betriebliche Auswirkung: neue Entwickler/Agenten finden im README keinen Einstieg (Dev-Flow, Ports, Deploy, Stage-URL) und müssen auf `CLAUDE.md` ausweichen; die Datei erweckt zudem den Eindruck eines uninitialisierten Templates.

## Reproduktion
1. `cat /projects/platform-control/frontends/godelmann-chatbot/README.md`
2. Erste Zeile ist `# React + TypeScript + Vite` — Boilerplate, kein Projektbezug.

## Fix-Vorschlag
`README.md` durch projektspezifischen Inhalt ersetzen, analog zu den READMEs der anderen Frontends. Mindestinhalt:
- Titel + Kurzbeschreibung (Godelmann Chatbot, Zweck der App)
- Tech-Stack (React 18 + Vite + TypeScript, Tailwind/shadcn, SPASS-Tunnel sofern zutreffend)
- Stage/Ports (Test-Stage-URL, Dev-Port, Supabase-Port) — Werte aus `CLAUDE.md` bzw. `platform-control/docs/PORTS.md` übernehmen, nicht raten
- Dev-First-Flow (`scripts/dev-run.sh` + `npm run dev`) und Verweis auf `docs/BACKLOG.md`
- Deploy-Hinweis (nur via `deploy-frontend.sh`, ADR-0006)

Kein Deploy und keine Migration nötig — reine Doku-Änderung im Repo, Commit genügt.

## Referenzen
- [docs/BACKLOG.md](BACKLOG.md)
- `CLAUDE.md` (Repo-Root) — Quelle für Projektbeschreibung, Stack, Stage/Ports
- `platform-control/docs/PORTS.md` — Port-/Stage-Zuordnung
- `feedback_spass_crate_readme_pflicht` (Memory) — Pflicht aussagekräftiger READMEs pro SPASS-Artefakt
