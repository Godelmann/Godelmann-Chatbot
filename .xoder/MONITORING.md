# MONITORING.md — Godelmann-Chatbot

Was laufend beobachtet werden muss. Health: [`HEALTHCHECK.md`](HEALTHCHECK.md).

> Das Widget selbst ist eine statische, self-contained Datei ohne Laufzeit-Backend in diesem Repo — die
> laufenden Wachpunkte betreffen den **`godelmann-chatbot-server`** (SPASS :3011, Repo `Ramteid-GmbH/spass`)
> und die Auslieferung. Backend-Interna daher als Bezug; SSoT dort.

## chatbot-server-Verfuegbarkeit (beide Stages)
- Unit gesund: `systemctl is-active godelmann-chatbot` auf `platform-test` (10.0.0.4) **und** `godelmann-prod`
  (49.12.77.51). Port 3011 gebunden. Bei Ausfall: `journalctl -u godelmann-chatbot` (Panics/DGX-Bearer-Fehler).
- Modul erreichbar: `GET /chatbot-widget.v1.js` → 200 (sonst godelmann.de-Einbindung tot).

## Rate-Limit / ALTCHA (Missbrauchs-Signal)
- Erhoehte `429`-Quote auf `/api/chat` = entweder Angriff/Bot-Welle **oder** zu enges Limit (10/10min je IP)
  → Log-Muster in `journalctl -u godelmann-chatbot` (Rate-Limit-Rejects) beobachten.
- Erhoehte `400 captcha_required`-Quote = ALTCHA-Reject-Haeufung (Replay/veraltete Challenge) — Client macht
  1 Auto-Retry; anhaltende Haeufung = mgl. Client-Bug oder Uhr-/Signatur-Drift serverseitig.

## DGX-Backend-Signal (Grounding)
- Antworten sollen **grounded** sein (godelmann.de-Quelle aus `knowledge_search`). Generische/quellenlose
  Antworten = RAG-KB nicht injiziert oder Modell-/dgx-Problem → dgx-llm-stack `.xoder/MONITORING.md`.
- DGX-Bearer (`GODELMANN_GOCREATE_{STAGE}_BEARER`) gueltig — bei `502`/Auth-Fehlern im chatbot-server-Log rotieren.

## TLS-Cert-Ablauf
- LE-Cert der `chatbot[-test].godelmann.net`-vhosts: Caddy erneuert automatisch; bei Renewal-Fehlern
  (Caddy-Log) manuell nachfassen. Ablaufdatum periodisch stichprobenhaft pruefen.

## Deploy-/Versions-Drift
- Ausgeliefertes `chatbot-widget.v1.js` == gebautes Artefakt des aktuellen `main`-HEAD (versionierte URL ist
  Vertrag zur Agentur — **innerhalb `v1` niemals inkompatibel** brechen; Breaking Change ⇒ `chatbot-widget.v2.js`).
- Release-Sync: `> Stand:`-Kopf in `docs/BACKLOG.md` == `package.json`-Version (Frontend-Release-Sync-Check).

## Doku-Aktualitaet (Wachpunkt)
- `docs/EINBINDUNG.md` (Agentur-Vertrag) muss den **realen** Prod-Stand (LIVE) und den umgesetzten
  conversation_id-Mechanismus (localStorage) widerspiegeln — offene Drifts s. `.xoder/BACKLOG.md` § 2.

## [PRUEFEN] / TODO
- **[PRUEFEN]** Existiert serverseitig strukturiertes Request-/Fehler-Logging oder ein Metrik-Endpoint
  am chatbot-server (Repo `spass`)? Falls ja: konkrete Alarm-Schwellen (429-Rate, 5xx-Rate) hier ergaenzen.
- **[PRUEFEN]** Uptime-/Blackbox-Monitoring der `chatbot[-test].godelmann.net`-URLs (extern) — ob bereits an
  ein Statuspage/ntfy angebunden; falls nicht, TODO analog Schwester-Apps.
