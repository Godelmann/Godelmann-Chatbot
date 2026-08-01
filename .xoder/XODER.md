# .xoder/XODER.md — Godelmann-Chatbot (Repo-Meta-Einstieg, XODER-Prinzip)

> **Autark nutzbar:** Alles, was du fuer dieses Repo brauchst, liegt HIER im Repo (`.xoder/` + `docs/`).
> Die uebergeordneten XODER-Ebenen (Org, Meta) sind OPTIONAL — fehlt dein lokaler Checkout davon,
> gilt dieses Verzeichnis allein und vollstaendig. Arbeitswissen steht in `CLAUDE.md` (nicht duplizieren, verlinken).

## 1. Das XODER-Prinzip (Kurzfassung, vollstaendig)

Jede Verzeichnisebene der Projektlandschaft ist self-describing ueber ein **`.xoder/`-Verzeichnis
mit mindestens einer `XODER.md`** (Meta-Einstieg) und optional einer **`BACKLOG.md`** (offene Aufgaben):

1. **Repo-Ebene (DIESES Repo):** `Godelmann/Godelmann-Chatbot/.xoder/` — SSoT fuer Betrieb/Topologie/Backlog
   des Widgets. Agent-Einstiege: `CLAUDE.md` (Claude Code) und `AGENTS.md` (alle AGENTS.md-lesenden Agents:
   Codex, Cursor, Grok, OpenCode, Copilot, ...) — beide verweisen hierher.
2. **Org-Ebene (optional):** `Godelmann/.xoder` = org-weite Konventionen (`GITHUB.md` = Commit-/PR-Regeln,
   `FINDINGS.md` = Security-Register). Lokal erwartbar unter `~/Projects/Godelmann/.xoder/`.
   (Ordner-`Godelmann/CLAUDE.md` traegt zusaetzlich die Infrastruktur-/SSH-Notizen fuer alle Godelmann-Repos.)
3. **Meta-Ebene (optional):** `~/Projects/` mit Meta-Overlay (`XODER.md` = Prinzip + Agent-Matrix,
   `.xoder/XODER.md` = Landschafts-SSoT ueber alle Tenants, `.xoder/BACKLOG.md` = Meta-Backlog).

**Regeln:** SSoT liegt in `.xoder/` (Agent-Dateien sind duenne Zeiger, nichts duplizieren) ·
spezifischere Ebene gewinnt · Backlog-Eintraege gehoeren in die hierarchisch passende `BACKLOG.md` ·
KEINE Secrets in XODER-Dateien (nur Verweise auf Secret-Orte, z. B. `/projects/.env`) ·
Checkout-Konvention `~/Projects/<org>/<repo>`.

**Standalone-Autarkie + Promotion (Kerngarantie):** Die Parent-Ebenen (2+3 oben) sind **Anreicherung,
keine Abhaengigkeit**. Fehlen sie lokal (nur dieses Repo geklont), nutzt und verbessert man das
XODER-Prinzip **vollstaendig hier im Repo**: alle Eintraege ins Repo-`.xoder/BACKLOG.md`; was
inhaltlich auf eine Parent-Ebene gehoert (Org-Konvention, Landschafts-Thema, Schwester-App-Rollout),
dort unter der Sektion **„PARENT (zur Promotion)"** sammeln — es wird beim naechsten Kontakt mit der
Parent-Ebene dorthin promoted (hochgezogen). Nichts geht verloren, nichts blockiert.

## 2. Datei-Inventar dieses Repos (`.xoder/` + zentrale `docs/`)

| Datei | Inhalt |
|---|---|
| `.xoder/XODER.md` | DIESE Datei — Prinzip + Wegweiser + Rolle/Befunde (unten) |
| `.xoder/NETWORK.md` | Topologie-SSoT: Widget-ES-Modul, Einbettung godelmann.de/Ibexa, `godelmann-chatbot-server` (SPASS :3011), DGX-RAG, Ingress/Egress, SSH-2-Hop ueber control |
| `.xoder/BACKLOG.md` | Projekt-Backlog (Betriebs-Sicht) inkl. Pflicht-Sektion `PARENT`; Fach-Backlog = `docs/BACKLOG.md` |
| `.xoder/HEALTHCHECK.md` | Ende-zu-Ende-Sweep (Widget-Modul erreichbar, `/api/chat` SSE, ALTCHA, CORS, Bundle-Gate) |
| `.xoder/MONITORING.md` | Laufende Wachpunkte (chatbot-server-Unit, Rate-Limit-429, ALTCHA-Reject-Quote, Cert-Ablauf) |
| `.xoder/TESTING.md` | Gates (`tsc --noEmit`, ESLint, Vite lib-Build, Bundle < 80 kB) + externe E2E-Abnahme |
| `.xoder/TIME.md` | Zeit/Zeitzonen/NTP — Widget = Browser-lokal, Server = UTC auf geteilten Hosts; Rate-Limit-/Cache-Fenster |
| `docs/ANFORDERUNGEN.md` | **Verbindliche Spezifikation** (Web-Components-Pflicht, API-Vertrag, Abnahme) |
| `docs/ABLAUFPLAN-HEIKE-2026-07-20.md` | **Gespraechs-Ablaufplan (SSoT)** fuer die Zielgruppen-Weiche (Fachkunde/Endkunde) + Guided Selling + PLZ-Ansprechpartner |
| `docs/EINBINDUNG.md` | **Pflicht-Deliverable** — deutsche Integrations-Doku fuer die godelmann.de-Agentur |
| `docs/BACKLOG.md` | Fach-Backlog — Release-Historie, Audit-Findings, offene Ausbaustufen |
| `docs/AUDIT-2026-07-12.md` · `docs/FINDINGS-2026-07-12.md` | Security-Audit (0 Findings) + FINDING-`<ID>`-Detaildateien |
| `CLAUDE.md` | Arbeitswissen (Tech-Stack, Commands, Backend-Bezug, Git-/Doku-Konventionen) |

## 3. Kern-Konventionen (gelten auch ohne Org-Checkout)

- **Gates vor Commit:** `npm run build` (= `tsc --noEmit` + Vite lib-Build, 0 Fehler) + `npm run lint`
  (0 Errors). Bundle-Gate: `dist/chatbot-widget.v1.js` < 80 kB gzip (aktuell ~7,4 kB). Details `.xoder/TESTING.md`.
- Commits/PRs: **Conventional Commits, ASCII, KEIN AI-/Co-Authored-By-Footer** (flottenweit; org `.xoder/GITHUB.md`).
- **Versionierte Datei-URL** ist Vertrag zur Agentur: innerhalb `v1` bleiben Snippet/Attribute/CSS-Props/Events
  stabil; Breaking Changes ausschliesslich als neue `chatbot-widget.v2.js` (`docs/EINBINDUNG.md`).
- Release-Sync-Pflicht: `> Stand:`-Kopf in `docs/BACKLOG.md` == aktuelle `package.json`-Version.
- **CI:** Akzentfarbe ausschliesslich Godelmann-Rot `#E52D12` (CSS-Prop `--gdm-chat-accent`).

---

## Rolle
- **Godelmann-Chatbot** = **oeffentliches KI-Chat-Widget fuer godelmann.de** — Web Component
  `<godelmann-chatbot>` (WHATWG Custom Element + Shadow DOM, **Vanilla TypeScript, keine Framework-Dependency**).
  Floating-Bubble unten rechts (kein iFrame), oeffnet ein Chat-Panel mit SSE-Streaming.
- **Build:** Vite **lib-mode** → EIN versioniertes ES-Modul `dist/chatbot-widget.v1.js` (self-contained,
  laedt keine externen Ressourcen, Gate < 80 kB gzip). Dev-Port **5011** (`vite.config.ts`, zentrale Port-Registry).
- **Kette:** godelmann.de `<script>` → Widget → `POST {host}/api/chat` (SSE) →
  **`godelmann-chatbot-server`** (eigener SPASS-Server, `Ramteid-GmbH/spass` `examples/godelmann-chatbot-server`,
  systemd `godelmann-chatbot.service`, **PORT 3011**) → DGX `/c1/chat` mit auto-injiziertem
  `knowledge_search` (Godelmann-RAG-Wissensbasis).
- **Tenant + Modell:** DGX-Tenant **`godelmann-public`** (`DgxConfig::public_from_env` →
  `GODELMANN_PUBLIC_{TEST,PROD}_BEARER`; **NICHT** `godelmann-gocreate`). Das Live-Bot-Modell ist die
  Server-Env **`CHATBOT_MODEL`** (Default `godelmann-gocreate-private-qwen-text` = lokal, falls ungesetzt).
  **Seit 2026-07-29 auf test `CHATBOT_MODEL=gpt-5.6`** (qwen ruft `knowledge_search` unzuverlaessig auf →
  Halluzinationen; Modellvergleich in GoCreate `docs/WEBCHAT-MODELLVERGLEICH-2026-07-29.md`); prod folgt mit
  separater Freigabe. `gpt-5.6` muss in der Tenant-`defaults.models_allowlist` (`tokens.yaml`) stehen — dort
  eingetragen. Der **`godelmann-gocreate`**-Tenant ist der interne GoCreate-Chat, ein **anderer** Consumer.
- **Schutz:** self-hosted **ALTCHA** (`GET /altcha/challenge`, SHA-256-PoW) + **IP-Rate-Limit**
  (10 Nachrichten / 10 min je IP); Bearer server-side (`GODELMANN_PUBLIC_{STAGE}_BEARER`),
  `SPASS-User-Id: web:<sha256(ip)[..12]>`. Anonym, kein Login, keine PII (Datenschutz-Hinweis im Widget).
- **Hostnames:** Test `https://chatbot-test.godelmann.net` (LIVE 2026-07-12, LE-Cert, platform-test :3011) ·
  Prod `https://chatbot.godelmann.net` (LIVE, godelmann-prod :3011). Caddy-vhost, CORS nur godelmann.de.

## Befunde / Stand (datiert)
- **2026-07-12 — v0.0.1 Erstrelease + test & prod LIVE.** Repo von React/Vite-Scaffold auf
  Vanilla-TS-Widget umgebaut (React-Deps entfernt, `npm audit` 0 vulnerabilities). `<godelmann-chatbot>`
  mit Shadow DOM, reaktiven Attributen (`lang`/`position`/`api-base`/`greeting`), SSE-Streaming,
  clientseitigem ALTCHA (Base64-JSON exakt im spass-captcha-Format, frische Loesung je Nachricht),
  sanitized Markdown, A11y (Fokus-Trap/ESC/aria-live), Events (`gdm-chat:opened/...`). Bundle **7,4 kB gzip**.
  Backend `godelmann-chatbot-server` (SPASS :3011) LIVE auf **beiden** Stages; E2E bestanden (grounded
  Chat via `knowledge_search`, Folgefrage im selben Verlauf, Honeypot, ALTCHA-Negativtest 400,
  Rate-Limit-429). Details `docs/BACKLOG.md` § Release-Historie.
- **2026-07-12 — Security-Audit: 0 Findings** (Teil des BLUEITS/REDITS Fleet-Audits, kleines TS-Widget).
  Belege `docs/FINDINGS-2026-07-12.md` · Tracker `docs/AUDIT-2026-07-12.md` · Register `Godelmann/.xoder/FINDINGS.md`.
- **2026-07-29 — v0.0.4: Zielgruppen-Weiche + Guided Selling + PLZ-Ansprechpartner (LIVE test).**
  Ablaufplan Heike (`docs/ABLAUFPLAN-HEIKE-2026-07-20.md`) umgesetzt — VOR dem KI-Modell fragt die
  Begruessung **Fachkunde/Endkunde** (Chip-Buttons + Freitext-Klassifikation `classifyBranch`), je Branch
  ein Guided-Selling-Menue (`BRANCH_ACTIONS`), dessen Buttons geerdete Fragen an den Bot stellen.
  **PLZ-Ansprechpartner** (Fachkunde): Widget fragt PLZ → `GET {host}/api/contact?plz=&topic=` →
  Ansprechpartner-Karte (`tel:`/`mailto:`), erfindet **nie** Namen. **Administrierbare Link-Ziele**:
  `GET {host}/api/webchat-config` (Buttons oeffnen konfigurierte URLs). Zusaetzlich: `renderMarkdown` mit
  Bildern `![]()` + Tabellen; Quick-Action „Produkte vergleichen". Backend-Endpoints im
  `godelmann-chatbot-server` (spass `620965e`, Daten aus GoCreate-Supabase `webchat_contacts`/`webchat_links`,
  gepflegt in GoCreate Sub-App `/dashboard/websites/godelmann/kontakte`). Vorlaeufer v0.0.2 (Reasoning-Strip,
  kein `<think>`-Leak) + v0.0.3 (Weiche-Erstfassung).

## Roadmap / Offen
- **⚠️ Dependency — echte Vertriebs-Adressliste:** PLZ→Ansprechpartner-Kontaktdaten (Dietmar extrahiert sie
  aus einem Dokument) in die GoCreate-Kontakt-Admin einpflegen; danach Test-Kontakt ersetzen. Ebenso die
  **echten Link-Ziel-URLs** (Heike) in `webchat_links` eintragen.
- **Prod-Rollout: erledigt** (01.08.2026). Widget und Server laufen auf `godelmann-prod`
  (`chatbot.godelmann.net`, Fassung 0.0.7), `CONTACT_SUPABASE_URL` ist gesetzt.
  **Anmerkung zum Modell:** `CHATBOT_MODEL` ist auf prod **nicht** gesetzt — prod laeuft ueber den
  Code-Standard `DEFAULT_CHAT_MODEL = "gpt-5.6"`, test setzt denselben Wert zusaetzlich ausdruecklich.
  Heute funktional identisch, aber fragil: wer den Code-Standard aendert, aendert prod still mit.
  Offen: `CHATBOT_MODEL` auch auf prod explizit setzen (Env-Aenderung braucht Freigabe).
- E2E-Abnahme laut `docs/ANFORDERUNGEN.md` formal abschliessen (grounded-Antwort mit Quelle ueber den
  vhost, Rate-Limit-Negativtest, CORS-Negativtest, Browser-E2E auf Test-Einbettungsseite).
- Restliche Ausbaustufen aus dem GoCreate-Websites-Backlog (Sub-App 3: Chat-Reviews/Kuratierung, Cost-Tracking).
- [PRUEFEN] Doku-Drift: `docs/EINBINDUNG.md` nennt Prod „folgt nach DNS-Freigabe", waehrend BACKLOG/CLAUDE
  Prod als LIVE fuehren — EINBINDUNG.md ggf. auf Prod-LIVE nachziehen.
