# Godelmann-Chatbot — BACKLOG

> Stand: 2026-08-03 (Paket-Version **0.0.9**, test)
> Maintainer: Dietmar Scharf

## Releases

- **0.0.9 (2026-08-03, test)** — **Gespraech als echte KI-Konversation** (Paritaet zum
  Gravelli-Berater, Heike-Ablauf strikt): Begruessung + kuratierte Antworten als echte
  Bot-Bubbles mit simulierter Denkzeit (1,0-1,5 s Typing); Zielgruppen-Wahl als
  Nutzer-Echo ("Ich bin Fachkunde/Endkunde"); Button-Klicks erscheinen als ausformulierte
  natuerliche Frage (neues `frage`-Feld je Aktion); verbose Fliesstext-Intros;
  **Fortsetzungsfragen-Chips nach jeder Modell-Antwort** (Server-Zusatz-Event
  `spass_followups`, aufgefuellt mit dem Zweig-Menue, max 6, dedupliziert); Slot-Filling:
  einmalige, freundliche Zielgruppen-Nachfrage, wenn per Freitext uebersprungen (persistiertes
  Flag `zielgruppeGefragt`; der stumme endkunde-Default entfaellt); busy-Haertung fuer
  Chips/Zweig-Klicks waehrend laufender Antworten. PLZ-Ansprechpartner-Flow unveraendert.
- **0.0.8 (2026-08-02, test)** — **Drawer- und Seiten-Modus (Einbindung als Teil der
  Seite).** Bisher nur schwebende Bubble; jetzt drei Darstellungsformen ueber das neue
  Attribut `mode`: `floating` (unveraendert), **`drawer`** (rechter Seiten-Drawer, der die
  Seite via `margin-right` am `<html>` sanft schmaler schiebt — kein Abdunkeln, Seite
  bleibt bedienbar; Slide-in ~0,8 s; auf kleinen Displays automatisch Vollflaechen-Panel)
  und **`page`** (in-flow, fuellt einen Container als eigene Seite). Neu ausserdem:
  `launcher="none"` blendet die eigene Bubble aus und verdrahtet Host-Elemente mit
  `data-gdm-chat-launcher` automatisch (Klick -> Toggle, `aria-expanded` gespiegelt, kein
  Inline-JS -> CSP-freundlich); `page-url` (Default `/chat`) + Punchout aus dem Drawer;
  „Verkleinern" von der Seite zurueck in den Drawer (dieselbe Unterhaltung ueber gemeinsamen
  `sessionStorage`); oeffentliche API `open()/close()/toggle()` + Dokument-Ereignisse
  `gdm-chat:open|close|toggle`; `disconnectedCallback` nimmt alle Wirt-Mutationen sauber
  zurueck (html-Klasse/margin/overflow, Listener, Rail-Verdrahtung). CSS-Property
  `--gdm-chat-drawer-width` (Default 480px). aria-modal/Fokus-Trap bleiben auf `floating`
  beschraenkt (Drawer/Seite lassen den Wirt bedienbar). Alles **additiv unter v1**. Fuer
  godelmann.de bereitet der Godelmann-Proxy die volle Einbindung vor (Rail-Item + die eine
  CSS-Regel injiziert, Widget im Drawer-Modus, `/chat`-Vollseite). Agentur-Vertrag:
  `docs/EINBINDUNG.md` v1.1. Bundle 13,9 kB gzip (Gate < 80 kB).
- **0.0.7 (2026-08-01, LIVE test+PROD)** — 17 Befunde aus einem adversarialen Review
  behoben, davon zwei KRITISCHE, die das Sitzungs-Gedaechtnis ins Gegenteil verkehrt
  haetten: (1) fertige Bot-Antworten wurden nie gesichert — beim Seitenwechsel blieb die
  Frage OHNE Antwort stehen; (2) der rohe Modell-Text samt `<think>` wurde gespeichert und
  beim Wiederherstellen ungefiltert gerendert — der serverseitig abgestellte Reasoning-Leak
  waere im Kundenfenster zurueckgewesen. Ausserdem: Ansprechpartner-Ergebnis wurde nicht
  gesichert; „Neue Unterhaltung" liess den Entwurf stehen; ein abgebrochener Lauf schrieb
  seine Fehlermeldung in die FRISCHE Unterhaltung; `connectedCallback` war nicht idempotent;
  `aria-modal` wurde ohne Fokus behauptet (Screenreader sahen die Seite ausgeblendet); jede
  Folgeseite loeste ungefragt Rechenarbeit aus; Fehlermeldungen verloren ihren
  Wiederholen-Knopf. **Damit ist prod erstmals seit 0.0.1 (12.07.) wieder aktuell** —
  inklusive Reasoning-Strip, Zielgruppen-Weiche, PLZ-Ansprechpartner und Vorschau-Kette.
  ⚠ Der PLZ-Ansprechpartner antwortet auf prod noch „kein Ansprechpartner hinterlegt",
  solange `/api/contact` dort keine Datenquelle hat (Vertriebsliste steht aus).
- **0.0.6 (2026-08-01)** — **Chat ueberlebt Seitenwechsel und Neuladen.** godelmann.de
  laedt bei jedem Seitenwechsel komplett neu; ein Beratungsgespraech fing dadurch auf
  jeder Unterseite wieder bei der Begruessung an. Panel-Zustand, Verlauf, Stand der
  Zielgruppen-Weiche, PLZ-Erwartung und die angefangene Eingabe liegen jetzt im
  `sessionStorage` (Eingabe nach JEDEM Zeichen, samt Cursorposition). Der Schreibfokus
  kehrt nur zurueck, wenn er vorher im Feld lag — sonst wuerde der Chat ihn jemandem
  klauen, der gerade woanders tippt. Beim Wiederherstellen kommen die passenden
  Auswahl-Schaltflaechen zurueck; eine leere Bot-Blase (Neuladen mitten in der Antwort)
  wird verworfen. Zwei Fallen dabei: `ShadowRoot.activeElement` zeigt beim blur noch aufs
  Feld (eigener Merker), und `open()` fokussierte grundsaetzlich (jetzt steuerbar).
  ⚠ **Widget-Auslieferung cacht 1 h** (`cache-control: public, max-age=3600`) — Updates
  erreichen Besucher entsprechend verzoegert; fuer dringende Korrekturen einplanen.
- **0.0.5** — Umlaut-/Modell-Angleich (siehe spass `godelmann-chatbot-server`).
- **0.0.4 (2026-07-29)** — Ansprechpartner-PLZ-Flow (deterministisch): „Ansprechpartner finden"
  fragt die PLZ ab und ruft `GET {apiBase}/api/contact?plz=` → Ansprechpartner-Karte (Name/Region +
  `tel:`/`mailto:`); Fallback wenn kein Treffer. Administrierbare Guided-Selling-Link-Ziele: laedt
  `GET /api/webchat-config` beim Oeffnen, Buttons oeffnen die hinterlegten godelmann.de-URLs (Fallback =
  geerdete AI-Frage). Renderer: Bilder `![](…)` inline + Markdown-Tabellen (Produktvergleich). Neue
  Quick-Action „Produkte vergleichen". Grundlage: Lastenheft + Ablaufplan Heike.

- **0.0.3 (2026-07-29)** — Zielgruppen-Weiche + Guided Selling (Ablaufplan Heike, 20.07.,
  `docs/ABLAUFPLAN-HEIKE-2026-07-20.md`). Begruessung fragt jetzt „Fachkunde oder Endkunde?"
  (Buttons + Freitext-Erkennung nach Heikes Stichwortlisten). Je Zielgruppe ein Guided-Selling-
  Menue (Endkunde: Produkte/Inspirationen/Gartenbuch/Neuheiten/Ideengarten/Haendlersuche/Hotline ·
  Fachkunde: Produkte/Objektplanung/Mediathek/Referenzen/Ansprechpartner). Die meisten Buttons
  stellen eine geerdete Frage an den Bot (echte godelmann.de-Quellen, keine hartkodierten Links);
  „Ansprechpartner finden" fragt die PLZ ab — Zuordnung **Platzhalter bis zur Vertriebs-Adressliste**.
  Rein im Widget (vor dem KI-Modell), Chip-Buttons im CI-Rot. Erste Praesentations-Version.

- **0.0.2 (2026-07-28)** — Reasoning-Leak behoben: DGX-Streaming liefert das
  Chain-of-Thought der Thinking-Modelle im `delta.content` (`<think>...</think>`),
  der abgespeckte Widget-Parser strippte es nicht → der interne Denk-Block
  erschien im Kundenfenster. `visibleAnswer()` + Suppression bis `</think>`
  (GoCreate-`dgx.ts`-Muster) rendern jetzt nur die fertige Antwort. Begleitend
  im Server (`spass/examples/godelmann-chatbot-server`) der Web-Chat-System-Prompt
  gegen Halluzination geschaerft (kein Raten von Produkt-/Oberflaechennamen/Normen,
  ehrlicher Wissensluecken-Ausweg statt Synthese).
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
| [CHATBOT-P2-01](FINDING-CHATBOT-P2-01.md) | Dev-Port-Konflikt: 5008 doppelt (Frahcs), Chatbot fehlt in PORTS.md, vite.config ohne Port | ✅ resolved (0.0.1: Dev-Port 5011 explizit + strictPort; zentrale Port-Registry aktualisiert) |
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
- **Build:** Vite lib-mode → `dist/chatbot-widget.v1.js` (ES, ein File, minified) — **7,4 kB gzip** (Gate < 80 kB); `npm run build` = `tsc --noEmit` + Vite; Dev-Port 5011.
- **Doku:** `docs/EINBINDUNG.md` (Snippet, Attribute, CSS-Props, Events, CSP inkl. SSE, Datenschutz-Baustein, Versionierungs-Politik, Ansprechpartner); README + CLAUDE.md auf Ist-Stand; `index.html` = Standalone-Preview.
- **Verifiziert:** Headless-E2E (Playwright/Chromium) gegen Mock-Server mit crate-identischer ALTCHA-Verifikation — 30/30 Checks grün (Streaming, Markdown/XSS, Conversation-Verlauf, Replay-frisches ALTCHA, 429, Events, Theming, A11y).
- Findings CHATBOT-P2-01 (Repo-Teil), P2-02, P2-03, P3-01, P3-02 resolved (siehe Audit-Tabelle oben).

---

## Offen

| Status | Aufgabe | Details |
|---|---|---|
| ✅ | Widget (Web Component) | 0.0.1 — `<godelmann-chatbot>` inkl. SSE, ALTCHA, EINBINDUNG.md (siehe Release-Historie). |
| ✅ | Deploy auf `chatbot-test.godelmann.net` (2026-07-12) | LIVE: `godelmann-chatbot-server` (SPASS :3011, systemd, ALTCHA+RateLimit), Caddy-vhost mit LE-Cert, SSE-flush, CORS nur godelmann.de inkl. Expose `x-conversation-id`. E2E bestanden: grounded Chat via knowledge_search (deutsch, Modell godelmann-gocreate-private-qwen-text), Folgefrage im selben Verlauf, Honeypot-FakeOk, ALTCHA-Negativtest 400. **Prod ebenfalls LIVE** (`https://chatbot.godelmann.net`, godelmann-prod :3011; eigener Web-Chat-System-Prompt deutsch + knowledge_search, Tenant-Inject via SPASS-Augment aus — dgx CR-0018; Rate-Limit-429 + RLS-Gegenprobe bestanden). |
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
