# NETWORK.md — Godelmann-Chatbot (`<godelmann-chatbot>` Widget)

> **SSoT der Netz-/Topologie-Sicht** dieses Repos. Godelmann-Chatbot ist ein **oeffentliches KI-Chat-Widget**
> (Web Component, Vanilla TS), das als **einzelnes versioniertes ES-Modul** (`chatbot-widget.v1.js`) in
> godelmann.de eingebettet wird und ausschliesslich mit dem **`godelmann-chatbot-server`** (eigener SPASS-Server)
> spricht — kein iFrame, keine direkte DB-/DGX-Anbindung aus dem Browser.
>
> **Stand:** 2026-07-16 (Paket-Version v0.0.1). **Verifikationsbasis:** Repo-Doku (`CLAUDE.md`, `README.md`,
> `docs/ANFORDERUNGEN.md`, `docs/EINBINDUNG.md`, `docs/BACKLOG.md`, `vite.config.ts`, `Godelmann/CLAUDE.md`).
> Keine Live-Erhebung in dieser Session; Punkte ohne Repo-Beleg sind mit **[PRUEFEN]** markiert.
> Das Backend liegt in einem **anderen Repo** (`Ramteid-GmbH/spass` → `examples/godelmann-chatbot-server`) —
> Backend-Interna daher als Vertrag/Bezug, nicht als SSoT dieses Repos.

---

## 1. Nodes

Zwei Stages, geteilte Godelmann-App-Server (dieselbe Infrastruktur wie GoCreate):

| Node | Stage | Host / IP | Was laeuft dort |
|---|---|---|---|
| **Widget (ES-Modul)** | beide | Browser (Client) | `<godelmann-chatbot>` Custom Element + Shadow DOM; laedt sich per `<script type=module src=.../chatbot-widget.v1.js>` in die godelmann.de-Seite; kein Framework, keine externen Ressourcen |
| **godelmann-chatbot-server** | je Stage | `:3011` (SPASS, Rust; `Ramteid-GmbH/spass` `examples/`) | HTTP-API `POST /api/chat` (SSE) + `GET /altcha/challenge`; ALTCHA-Verify + IP-Rate-Limit; reicht an DGX weiter (Bearer server-side) |
| **platform-test** | **test** | `10.0.0.4` (privat, nbg1) / public `162.55.51.254` | `godelmann-chatbot.service` :3011 + Caddy-vhost `chatbot-test.godelmann.net` (LE-Cert). Geteilt mit GoCreate/Gravelli Test |
| **godelmann-prod** | **prod** | `49.12.77.51` (fsn1) | `godelmann-chatbot.service` :3011 + Caddy-vhost `chatbot.godelmann.net` |
| **DGX-Gateway** | shared | `dgx.spass.fun` (Hetzner-LB direkt, **kein Cloudflare**) | `/c1/chat` Modell `godelmann-gocreate-private-qwen-text` (lokal) + auto-injiziertes `knowledge_search` (Godelmann-RAG-KB); Bearer-gated + Pflicht-Header `SPASS-User-Id` (dgx ADR-0016) |
| **control** (Sprungbrett) | ops | `control.cockpit.plus` → `178.104.35.116` | 2-Hop-Jump-Host zu beiden App-Servern; traegt die Server-Keys (`/root/.ssh/{platform,godelmann-prod}`) |

**Deploy-Layout (Widget):** Das gebaute ES-Modul `dist/chatbot-widget.v1.js` wird als statische Datei
**vom `godelmann-chatbot-server`-Host** ausgeliefert (Origin der Script-URL = API-Origin; ohne `api-base`-Attribut
spricht das Widget genau diesen Host an). **[PRUEFEN]** exakter Ausspiel-Pfad/Caddy-`root` auf den App-Servern
(im Repo nicht belegt — Backend/Deploy liegen in `spass` + platform-control). Widget-Build lokal:
`npm run build` → `dist/chatbot-widget.v1.js`.

## 2. Netz-Segmente & Trust-Boundaries

- **Oeffentlich (Ingress):** `chatbot-test.godelmann.net` (Test, LIVE seit 2026-07-12, LE-Cert) /
  `chatbot.godelmann.net` (Prod, LIVE) — TLS via **Caddy** auf dem jeweiligen App-Server, **CORS nur
  godelmann.de** (Expose-Header `x-conversation-id`). **Kein Auth-Gate** — der Chat ist bewusst **anonym**
  (kein Login, keine PII).
- **Einbettungs-Grenze (godelmann.de):** Die godelmann.de-Seite laedt nur das ES-Modul und oeffnet SSE-Verbindungen
  zum Chatbot-Host. Falls godelmann.de eine **CSP** setzt, sind **zwei** Freigaben noetig:
  `script-src <chatbot-host>` (Modul-Load) **und** `connect-src <chatbot-host>` (SSE-`fetch` `POST /api/chat`
  + `GET /altcha/challenge`) — ohne `connect-src` blockt der Browser den Chat trotz geladenem Script
  (`docs/EINBINDUNG.md` § CSP).
- **Spam-/Missbrauchs-Grenze:** self-hosted **ALTCHA** Proof-of-Work (kein Dritt-CAPTCHA-Dienst) +
  **IP-Rate-Limit** (10 Nachrichten / 10 min je IP, Key aus `X-Forwarded-For`) + Honeypot-Feld (`hp_website`).
- **DGX-/Datenschutz-Grenze:** Der DGX-Bearer liegt **ausschliesslich server-seitig**
  (`GODELMANN_GOCREATE_{STAGE}_BEARER`); der Browser sieht ihn nie. Die SPASS-User-Id ist eine gehashte,
  gekuerzte IP (`web:<sha256(ip)[..12]>`) — keine Klartext-IP an DGX. Modell **lokal** (Qwen auf dgx),
  SPASS-Augment `memory=off`.

## 3. Ingress

| Stage | Oeffentliche URL (Modul-Host = API-Host) | API-Endpunkte | Auth-Gate | Ziel |
|---|---|---|---|---|
| **prod** | `https://chatbot.godelmann.net` | `POST /api/chat` (SSE) · `GET /altcha/challenge` · `GET /chatbot-widget.v1.js` | keins (anonym, ALTCHA+Rate-Limit) | `godelmann-prod` `godelmann-chatbot.service` :3011 |
| **test** | `https://chatbot-test.godelmann.net` | wie prod | wie prod | `platform-test` `godelmann-chatbot.service` :3011 |

**Einbettungs-Snippet (Agentur, `docs/EINBINDUNG.md`):**
```html
<script type="module" src="https://chatbot-test.godelmann.net/chatbot-widget.v1.js"></script>
<godelmann-chatbot lang="de" position="bottom-right"></godelmann-chatbot>
```
Prod-Snippet identisch bis auf die URL (`chatbot.godelmann.net`).

## 4. API-Vertrag (v1) — Widget ⇄ chatbot-server

- **`POST /api/chat`** — Body `{ message: str≤2000, conversation_id?: str, altcha?: payload, hp_website: "" }`
  → **SSE-Stream** (OpenAI-Delta-Format, `text/event-stream`, `[DONE]`-Sentinel) + Antwort-Header
  **`x-conversation-id`**. Der Client persistiert die Verlaufs-Id in `localStorage` (`gdm-chat-conversation-id`)
  und sendet sie bei Folge-Nachrichten mit; „Neue Unterhaltung" loescht sie.
  **[PRUEFEN]** Persistenz-Mechanismus: `docs/ANFORDERUNGEN.md` beschreibt einen First-Party-Cookie
  (SameSite=Lax), die Release-Historie/`EINBINDUNG.md` dokumentieren `localStorage` — Ist-Stand = localStorage,
  Doku-Drift in ANFORDERUNGEN.md pruefen.
- **`GET /altcha/challenge`** — liefert die ALTCHA-Challenge; Client loest SHA-256-PoW via `crypto.subtle`,
  sendet die Loesung als Base64-JSON (exakt spass-captcha-Format) im `altcha`-Feld. Vorloesen beim
  Panel-Oeffnen + **frische Loesung je Nachricht** (Server-Replay-Schutz), 1 Auto-Retry bei `400 captcha_required`.
- **Limits/Fehler:** 10 Nachrichten / 10 min je IP → `429` (deutsche Rate-Limit-Meldung im Widget);
  `message ≤ 2000` Zeichen; Timeout 120 s (Netzfehler → Retry-Button). Fehler-Mapping serverseitig nach
  `spass-dgx::map_dgx_error`.

## 5. Egress (externe Abhaengigkeiten)

**Das Widget selbst hat KEINEN Egress ausser zum Chatbot-Host** (keine Fonts, Bilder, CDN, Analytics —
self-contained ES-Modul). Der nachgelagerte **`godelmann-chatbot-server`** (anderes Repo) hat:

| Ziel | Zweck | Anbindung |
|---|---|---|
| **`dgx.spass.fun`** | Chat-LLM `godelmann-gocreate-private-qwen-text` (lokal) + `knowledge_search` (RAG) | chatbot-server → Hetzner-LB direkt (kein CF), Tenant-Bearer + `SPASS-User-Id` |
| **Godelmann-RAG-KB** | Grounding-Quelle (godelmann.de Web + Datenblaetter + Bilder) | via DGX `knowledge_search` auto-injiziert (dgx-llm-stack RAG; Korpus wird vom GoCreate-Harvester gepflegt) |

## 6. Request-/Daten-Fluss

```
godelmann.de (Browser)
  │  <script src="https://chatbot[-test].godelmann.net/chatbot-widget.v1.js">   (self-contained ES-Modul)
  │  POST /api/chat  (fetch, text/event-stream)   +   GET /altcha/challenge
  ▼
Caddy (App-Server, CORS nur godelmann.de)  ── TLS  → localhost:3011
  ▼
godelmann-chatbot-server (:3011, SPASS)  ── ALTCHA-Verify · IP-Rate-Limit · Honeypot
  └─►  dgx.spass.fun /c1/chat   (Modell qwen-lokal · knowledge_search auto-inject;
        Bearer server-side GODELMANN_GOCREATE_{STAGE}_BEARER + SPASS-User-Id web:<sha256(ip)[..12]>)
```

**Datenhaltung:** Der Chat-Verlauf wird DGX-seitig gehalten (c1); im Browser nur die Verlaufs-Id
(`localStorage`, jederzeit ueber „Neue Unterhaltung" loeschbar). **Keine** eigene Supabase/DB in diesem
Widget-Repo — es ist reines Frontend.

## 7. Zugang / SSH-Topologie (2-Hop ueber control)

- **Vom Mac zum Jump-Host:** `ssh -i ~/.ssh/cockpit_plus_ed25519 root@control.cockpit.plus`
  (Host-Alias `platform-control`; Widerruf: Zeile `claude-code@…-cockpit-plus` aus `/root/.ssh/authorized_keys`).
- **2. Hop (Server-Keys liegen auf control):**
  - **test:** `ssh control.cockpit.plus 'ssh -i /root/.ssh/platform root@10.0.0.4'` (Alias `platform-test`)
  - **prod:** `ssh control.cockpit.plus 'ssh -i /root/.ssh/godelmann-prod root@49.12.77.51'` (Alias `godelmann-prod`)
- **Service-Status (chatbot-server):**
  `systemctl status godelmann-chatbot` · `journalctl -u godelmann-chatbot -f` (auf dem jeweiligen App-Server).
- ⚠️ **Headless Claude auf control schlaegt fehl** (`401 Invalid authentication`) — Diagnosen direkt per SSH
  (systemctl/journalctl/curl), nicht ueber die control-seitige Claude-Instanz (`Godelmann/CLAUDE.md`).

## 8. Offene Netz-Punkte (explizit offen — nicht erfunden)

- **[PRUEFEN]** Cloudflare-Fronting der `chatbot[-test].godelmann.net`-Domains (Repo belegt nur Caddy-TLS
  auf dem App-Server; DNS/Proxy-Status nicht erhoben — analog GoCreate offen).
- **[PRUEFEN]** Exakter statischer Ausspiel-Pfad des `chatbot-widget.v1.js` (Caddy-`root`/Deploy-Skript liegen
  in `spass` + platform-control, nicht in diesem Repo).
- **[PRUEFEN]** conversation_id Cookie vs. localStorage (Doku-Drift ANFORDERUNGEN.md ↔ Ist-Stand, s. §4).
- **[PRUEFEN]** Prod-Doku-Drift: `docs/EINBINDUNG.md` fuehrt Prod als „nach DNS-Freigabe", BACKLOG/CLAUDE als LIVE.

---
Siehe `.xoder/HEALTHCHECK.md` (Ende-zu-Ende-Sweep) · `.xoder/MONITORING.md` (laufende Wachpunkte) ·
`.xoder/TESTING.md` (Gates) · `docs/EINBINDUNG.md` (Integrations-Vertrag) · `CLAUDE.md` (App-Spezifika).
Org-Konvention: `Godelmann/.xoder/` (falls ausgecheckt).
