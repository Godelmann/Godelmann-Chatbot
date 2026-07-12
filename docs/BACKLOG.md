# Godelmann-Chatbot — BACKLOG

> Stand: 2026-07-12 (Paket-Version **0.0.1**)
> Maintainer: Dietmar Scharf
>
> KI-Chat-Widget für godelmann.de — Web Component `<godelmann-chatbot>` (Vanilla TS, Shadow DOM). Eingebettet via versioniertem ES-Modul (Floating-Bubble, kein iFrame).
> Kontext + Sprint-Plan: GoCreate-Websites-Backlog, Sub-App 3
> ([`../../godelmann-gocreate/docs/BACKLOG.md`](../../godelmann-gocreate/docs/BACKLOG.md) → „Websites").
>
> Infrastruktur-BACKLOG: [`../../../docs/BACKLOG.md`](../../../docs/BACKLOG.md)


## Audit 2026-07-02 (Multi-Agent, verifiziert)

> Multi-Agent-Audit (Repo + Live Test/Prod, 2 Pässe). **Detail je Finding: eigene `docs/FINDING-<ID>.md`** (verlinkt).
> Ergebnis: **7 Findings** — P1: 0 · P2: 3 · P3: 4. Erledigt: **5/7** (Stand 2026-07-12, Widget-Release 0.0.1).

### 🟠 P2

| ID | Finding | Status |
|---|---|---|
| [CHATBOT-P2-01](FINDING-CHATBOT-P2-01.md) | Dev-Port-Konflikt: 5008 doppelt (Frahcs), Chatbot fehlt in PORTS.md, vite.config ohne Port | ✅ resolved (Repo-Teil 0.0.1: Port 5008 explizit + strictPort in vite.config; PORTS.md-Registry-Eintrag = platform-control, offen) |
| [CHATBOT-P2-02](FINDING-CHATBOT-P2-02.md) | CLAUDE.md-Tech-Stack (React18/Tailwind/shadcn/SPASS/Supabase) weicht vom Ist-Stand (React 19, Vite-Scaffold) ab | ✅ resolved (0.0.1: CLAUDE.md = Vanilla-TS-Web-Component, Ist-Stand) |
| [CHATBOT-P2-03](FINDING-CHATBOT-P2-03.md) | npm audit fix: 1 high (vite 8.0.1, Dev-Server) + 4 weitere, alle via npm audit fix behebbar | ✅ resolved (0.0.1: npm audit fix → 0 vulnerabilities; React-Deps komplett entfernt) |

### 🟢 P3

| ID | Finding | Status |
|---|---|---|
| [CHATBOT-P3-01](FINDING-CHATBOT-P3-01.md) | README.md ist unveränderter Vite-Template-Text statt projektspezifisch | ✅ resolved (0.0.1: projektspezifisches README) |
| [CHATBOT-P3-02](FINDING-CHATBOT-P3-02.md) | index.html: lang="de" + deutscher Brand-Titel statt lang="en"/Platzhalter | ✅ resolved (0.0.1: lang="de" + Titel „GODELMANN Chatbot — Widget-Preview") |
| [CHATBOT-P3-03](FINDING-CHATBOT-P3-03.md) | /projects/CLAUDE.md Submodule-Liste um godelmann-chatbot + frahcs-mobilien ergaenzen | ⬚ offen (ausserhalb dieses Repos: platform-control) |
| [CHATBOT-P3-04](FINDING-CHATBOT-P3-04.md) | dgx-Proxy user_id-Spoofing nur durch ENV SPASS_JWT_VERIFY=enforce verhindert — Fail-open-Default (JwtVerifyMode::Off) | ⬚ offen (ausserhalb dieses Repos: spass) |

---

---

## Release-Historie

### 0.0.1 — 2026-07-12 · `<godelmann-chatbot>` Web Component (Erstrelease)

- **Repo-Umbau:** React/Vite-Scaffold → Vanilla-TypeScript-Widget-Repo (React/react-dom/@vitejs/plugin-react entfernt, `npm audit` 0 vulnerabilities).
- **`src/chatbot-widget.ts`:** Custom Element `<godelmann-chatbot>` (Shadow DOM open, WHATWG-Standard); reaktive Attribute `lang`/`position`/`api-base`/`greeting`; Floating-Bubble + Chat-Panel (Header „Godelmann-Assistent", Nachrichtenliste, Eingabezeile, „Neue Unterhaltung", Datenschutz-Hinweis mit Link).
- **API:** `POST {apiBase}/api/chat` (`{message, conversation_id?, altcha?, hp_website:""}`) → SSE-Stream (OpenAI-Delta, fetch+ReadableStream, `[DONE]`); Header `x-conversation-id` → localStorage `gdm-chat-conversation-id` (Folge-Nachrichten senden mit; „Neue Unterhaltung" löscht).
- **ALTCHA clientseitig:** `GET /altcha/challenge` → SHA-256-PoW via `crypto.subtle`, Payload Base64-JSON exakt im spass-captcha-Format; Vorlösen beim Panel-Öffnen + frische Lösung je Nachricht (Server-Replay-Schutz), 1 Auto-Retry bei 400 `captcha_required`.
- **Rendering/Sicherheit:** Streaming-Rendering, Markdown sanitized (HTML-escape zuerst; fett/Listen/http(s)-Links `target=_blank rel=noopener noreferrer`, Absätze).
- **Fehler:** 429 deutsche Rate-Limit-Meldung, Netzfehler + Retry-Button, Timeout 120 s.
- **A11y:** `role=dialog aria-modal`, Fokus-Trap, ESC, `aria-live=polite`, Bubble-`aria-label`.
- **Theming:** `--gdm-chat-accent` (#E52D12) / `--gdm-chat-z-index` (2147483000) / `--gdm-chat-font` (inherit); mobil vollflächig. Events `gdm-chat:opened/closed/message-sent/response-received/error` (bubbles+composed).
- **Build:** Vite lib-mode → `dist/chatbot-widget.v1.js` (ES, ein File, minified) — **7,4 kB gzip** (Gate < 80 kB); `npm run build` = `tsc --noEmit` + Vite; Dev-Port 5008.
- **Doku:** `docs/EINBINDUNG.md` (Snippet, Attribute, CSS-Props, Events, CSP inkl. SSE, Datenschutz-Baustein, Versionierungs-Politik, Ansprechpartner); README + CLAUDE.md auf Ist-Stand; `index.html` = Standalone-Preview.
- **Verifiziert:** Headless-E2E (Playwright/Chromium) gegen Mock-Server mit crate-identischer ALTCHA-Verifikation — 30/30 Checks grün (Streaming, Markdown/XSS, Conversation-Verlauf, Replay-frisches ALTCHA, 429, Events, Theming, A11y).
- Findings CHATBOT-P2-01 (Repo-Teil), P2-02, P2-03, P3-01, P3-02 resolved (siehe Audit-Tabelle oben).

---

## Offen

| Status | Aufgabe | Details |
|---|---|---|
| ✅ | Widget (Web Component) | 0.0.1 — `<godelmann-chatbot>` inkl. SSE, ALTCHA, EINBINDUNG.md (siehe Release-Historie). |
| ⬚ | Deploy auf `chatbot-test.godelmann.net` | Caddy-vhost + `dist/chatbot-widget.v1.js` ausliefern; Server `godelmann-chatbot-server` (spass, PORT 9008) auf platform-test. |
| ⬚ | E2E-Abnahme laut ANFORDERUNGEN.md | Grounded-Antwort mit Quelle ueber den vhost, Rate-Limit-Negativtest (11. Nachricht → 429), CORS-Negativtest, Browser-E2E auf Test-Einbettungsseite. |
| ⬚ | Restliche Ausbaustufen | Siehe Sprint-Plan im GoCreate-Websites-Backlog (Sub-App 3: Reviews, Cost-Tracking). |

---

## Doku-Pflege (Pflicht)

Der `> Stand:`-Kopf MUSS die aktuelle `package.json`-Version nennen; jedes gelieferte Release wird hier
nachgetragen (vom `/do-everything`-Frontend-Release-Sync-Check erzwungen — Memory `feedback_frontend_backlog_version_sync`).


## Security-Audit (2026-07-12) — FINDINGS hinterlegt, Remediation offen

**Status:** KEINE FINDINGS. Teil des Fleet-Audits (AUDIT-FLEET-2026-07-12). **0 Findings** (0).

- Belege: `docs/FINDINGS-2026-07-12.md` · Ticket/Tracker: `docs/AUDIT-2026-07-12.md` · Org-Register: `BLUEITS-GmbH/.xoder/FINDINGS.md`

**Naechster Schritt:** User-Review → Priorisierung → Fix; Jira erst nach Review. Erledigtes als „resolved" markieren.
