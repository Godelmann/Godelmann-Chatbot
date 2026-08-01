# AGENTS.md — Godelmann-Chatbot (`<godelmann-chatbot>` Widget)

Agent-agnostischer Einstieg (Codex, Cursor, Grok, OpenCode, Copilot, ...). Claude Code liest
zusaetzlich `CLAUDE.md`. **Nichts hier duplizieren — dies ist ein duenner Zeiger.**

## Zuerst lesen

1. **[`.xoder/XODER.md`](.xoder/XODER.md)** — Meta-Einstieg + XODER-Prinzip (Hierarchie, Regeln,
   Standalone-Autarkie, PARENT-Promotion) + Datei-Inventar + Rolle/Befunde. **PFLICHT-Erststation.**
2. **[`CLAUDE.md`](CLAUDE.md)** — Arbeitswissen: Tech-Stack (Vanilla TS + Vite lib-mode, Web Component,
   Shadow DOM, KEINE Framework-Dependency), Commands/Gates, Backend-Bezug, Doku-/Git-Konventionen.
3. **Verbindliche Spezifikation:** [`docs/ANFORDERUNGEN.md`](docs/ANFORDERUNGEN.md) ·
   **Agentur-Integrations-Vertrag:** [`docs/EINBINDUNG.md`](docs/EINBINDUNG.md).

## Betrieb (SSoT in `.xoder/`)

- **[`.xoder/NETWORK.md`](.xoder/NETWORK.md)** — Topologie: Widget-ES-Modul, Einbettung godelmann.de,
  `godelmann-chatbot-server` (SPASS :3011, Repo `Ramteid-GmbH/spass`), DGX-RAG, Ingress/Egress, SSH-2-Hop.
- **[`.xoder/BACKLOG.md`](.xoder/BACKLOG.md)** — Projekt-Backlog (Betriebs-Sicht) + `PARENT`-Sektion;
  Fach-Backlog (Release-Historie) = [`docs/BACKLOG.md`](docs/BACKLOG.md).
- **[`.xoder/HEALTHCHECK.md`](.xoder/HEALTHCHECK.md)** · **[`.xoder/MONITORING.md`](.xoder/MONITORING.md)**
  · **[`.xoder/TESTING.md`](.xoder/TESTING.md)**.

## Kern-Konventionen

- **Gates vor Commit:** `npm run build` (= `tsc --noEmit` + Vite lib-Build, 0 Fehler) + `npm run lint`
  (0 Errors). Bundle-Gate `dist/chatbot-widget.v1.js` < 80 kB gzip. **Kein `npm run test` im Repo** (s. TESTING.md).
- **Versionierte Datei-URL** = Vertrag zur Agentur: innerhalb `v1` bleiben Snippet/Attribute/CSS-Props/Events
  stabil; Breaking Changes nur als neue `chatbot-widget.v2.js`.
- **Commits/PRs:** Conventional Commits, ASCII, **KEIN AI-/Co-Authored-By-Footer** (flottenweite
  XODER-Pflicht). Details: org-weites `Godelmann/.xoder/GITHUB.md` (falls ausgecheckt).
- **CI:** Akzentfarbe nur Godelmann-Rot `#E52D12` (`--gdm-chat-accent`). Keine Secrets in Dateien/Commits.

## Tests (PFLICHT vor Chat-/Prompt-/Modell-Aenderungen)

- **Gates dieses Repos:** [`.xoder/TESTING.md`](.xoder/TESTING.md)
- **Regressionstest der KI-Berater** — prueft BEIDE Chatbots + die Stufen-Gates in EINEM Lauf.
  Nur auf `platform-test` ausfuehren (auf control meldet er faelschlich „Connection refused"):
  ```sh
  scp -i /root/.ssh/platform /projects/spass/scripts/verify-ai-channels.py root@10.0.0.4:/tmp/
  ssh -i /root/.ssh/platform root@10.0.0.4 'cd /tmp && python3 verify-ai-channels.py'
  ```
  Erwartet: **„alle Pflicht-Checks gruen"**.
- **Gesamtkontext (Org):** `Godelmann/.xoder/TESTING.md` — Pruefebenen, SPA-Falle
  (HTTP 200 beweist keinen Endpunkt), Fassungsvergleich ueber Commits statt Nummern.
- **Regelwerk:** `Godelmann/.xoder/docs/WEBCHAT.md`.
