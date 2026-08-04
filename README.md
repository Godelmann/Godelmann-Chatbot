# Godelmann-Chatbot

Oeffentliches KI-Chat-Widget fuer **godelmann.de** — Web Component `<godelmann-chatbot>`
(WHATWG Custom Element + Shadow DOM, Vanilla TypeScript, **keine Framework-Dependency**).
Floating-Bubble mit SSE-Streaming gegen den `godelmann-chatbot-server` (SPASS), self-hosted
ALTCHA-Spam-Schutz + IP-Rate-Limit, grounded ueber die Godelmann-RAG-Wissensbasis (DGX).

> Dieses Repo folgt dem **XODER-Prinzip**: die Single Source of Truth liegt in
> [`.xoder/`](.xoder/), Meta-Einstieg ist **[`.xoder/XODER.md`](.xoder/XODER.md)**. Dieses README ist
> die menschliche GitHub-Landing und **verlinkt** dorthin (dupliziert nichts).
> Agenten-Einstiege: [`CLAUDE.md`](CLAUDE.md) (Claude Code) · [`AGENTS.md`](AGENTS.md).

## Quickstart

```bash
npm install
npm run dev      # Standalone-Preview auf http://localhost:5011
npm run build    # tsc --noEmit + Vite lib-mode -> dist/chatbot-widget.v1.js (< 80 kB gzip)
npm run lint     # ESLint
```

## Einbindung (godelmann.de)

```html
<script type="module" src="https://chatbot-test.godelmann.net/chatbot-widget.v1.js"></script>
<godelmann-chatbot lang="de" position="bottom-right"></godelmann-chatbot>
```

Vollstaendige Integrations-Doku (Attribute, CSS-Properties, Events, CSP, Datenschutz,
Versionierung): [`docs/EINBINDUNG.md`](docs/EINBINDUNG.md).

## Dokumentation

| Datei | Inhalt |
|---|---|
| [`.xoder/XODER.md`](.xoder/XODER.md) | Prinzip, Datei-Inventar, Rolle/Befunde, Kern-Konventionen (Meta-Einstieg) |
| [`.xoder/NETWORK.md`](.xoder/NETWORK.md) | Topologie-SSoT: Widget-ES-Modul, Embed, `godelmann-chatbot-server` (:3011), DGX-RAG, SSH-2-Hop |
| [`.xoder/HEALTHCHECK.md`](.xoder/HEALTHCHECK.md) · [`MONITORING.md`](.xoder/MONITORING.md) · [`TESTING.md`](.xoder/TESTING.md) · [`TIME.md`](.xoder/TIME.md) | Health-Sweep · Wachpunkte · Gates (tsc/lint/Bundle) · Zeit/NTP |
| [`.xoder/VERSIONING.md`](.xoder/VERSIONING.md) | Fassungs-Logik: erhoeht wird bewusst per `npm run release:patch`, nie durch Build oder Deploy |
| [`.xoder/DEPLOYMENT.md`](.xoder/DEPLOYMENT.md) | Deploy-Flow: Frontend `deploy-godelmann.sh chatbot` · Backend `deploy-spass.sh godelmann-chatbot` (Namen unterscheiden sich!) |
| [`.xoder/BACKLOG.md`](.xoder/BACKLOG.md) | Betriebs-Backlog (inkl. Sektion `PARENT`) |
| [`.xoder/DEPENDENCIES.md`](.xoder/DEPENDENCIES.md) | Abhaengigkeits-Policy: Bot-Konfiguration, Cooldown-Regel, Ausnahmen-Log |
| [`docs/ANFORDERUNGEN.md`](docs/ANFORDERUNGEN.md) | Verbindliche Spezifikation (Web-Components-Pflicht, API-Vertrag, Abnahme) |
| [`docs/ABLAUFPLAN-HEIKE-2026-07-20.md`](docs/ABLAUFPLAN-HEIKE-2026-07-20.md) | Gespraechs-Ablaufplan (SSoT) — Zielgruppen-Weiche (Fachkunde/Endkunde), Guided Selling, PLZ-Ansprechpartner |
| [`docs/EINBINDUNG.md`](docs/EINBINDUNG.md) | Pflicht-Deliverable — Integrations-Doku fuer die godelmann.de-Agentur |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Fach-/Release-Log — Release-Historie, offene Ausbaustufen |
| [`docs/AUDIT-2026-07-12.md`](docs/AUDIT-2026-07-12.md) · [`docs/FINDINGS-2026-07-12.md`](docs/FINDINGS-2026-07-12.md) | Security-Audit-Tracker + Belege (0 Findings; `docs/FINDING-CHATBOT-*.md`) |

Backend/API-Vertrag: `Ramteid-GmbH/spass` -> `examples/godelmann-chatbot-server`.

## Konventionen

- **Commits/PRs:** Conventional Commits, ASCII, **kein AI-/Co-Authored-By-Footer** (flottenweite Pflicht, s. `../.xoder/GITHUB.md`). Default-Branch `main` (Protected nur ueber PR).
- **Gates vor Commit:** `npm run build` (= `tsc --noEmit` + Vite lib-Build, 0 Fehler) + `npm run lint`; Bundle-Gate `dist/chatbot-widget.v1.js` < 80 kB gzip.
- **Versionierte Datei-URL** ist Vertrag zur Agentur: Breaking Changes nur als neue `chatbot-widget.v2.js`.
