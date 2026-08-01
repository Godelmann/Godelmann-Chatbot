# .xoder/BACKLOG.md — Godelmann-Chatbot (Projekt-Backlog, XODER-verwaltbar)

## Webchat (Stand 01.08., SSoT `Godelmann/.xoder/docs/WEBCHAT.md`)

- [ ] **PLZ→Ansprechpartner-Liste fehlt auf prod** — `webchat_contacts` ist dort leer, der
  Fachkunde-Knopf antwortet daher „kein Ansprechpartner hinterlegt". Liste kommt von
  GODELMANN (Vertrieb).
- [ ] **Turn-Logging auf prod nicht konfiguriert** (`ai_logs.db` bleibt leer) — damit fehlt
  der Nachweis, welches Modell dort tatsaechlich antwortet.
- [ ] **Widget-Auslieferung cacht 1 h** (`max-age=3600`): Updates erreichen Besucher
  verzoegert. Versionierten Dateinamen erwaegen.

> XODER-Prinzip: Eintraege gehoeren ins Backlog der passenden Ebene (Landschaft/Meta →
> `~/Projects/.xoder/BACKLOG.md`, Org → `Godelmann/.xoder/`, Projekt → HIER).
> **Standalone-Autarkie:** Fehlen die Parent-Ebenen lokal, kommt ALLES hierher; Parent-Themen in die
> Sektion **„PARENT (zur Promotion)"** unten. **Fach-Backlog (SSoT, Release-Historie):**
> [`../docs/BACKLOG.md`](../docs/BACKLOG.md). Diese Datei ist die **XODER-Betriebs-Sicht** — Verweise
> + offene Betriebs-/Hygiene-Punkte, keine Duplikate.

**Stand:** 2026-07-29 · Paket-Version **v0.0.4** (test LIVE; prod = v0.0.1, Rollout offen).

## 1. Aktive Straenge

- **Widget `<godelmann-chatbot>` v0.0.4 — LIVE test (prod = v0.0.1).** Web Component (Vanilla TS, Shadow DOM),
  SSE-Streaming, clientseitiges ALTCHA, sanitized Markdown, A11y. Bundle < 80 kB gzip (Gate).
  Einbettungs-Vertrag: [`../docs/EINBINDUNG.md`](../docs/EINBINDUNG.md). Backend `godelmann-chatbot-server`
  (SPASS :3011, `Ramteid-GmbH/spass` `examples/`) auf beiden Stages live.
  - **v0.0.2-0.0.4 (29.07., LIVE test):** Reasoning-Strip (kein `<think>`-Leak) · **Zielgruppen-Weiche**
    (Fachkunde/Endkunde) + Guided Selling nach `../docs/ABLAUFPLAN-HEIKE-2026-07-20.md` · **PLZ-Ansprechpartner**
    (`GET /api/contact`) · **administrierbare Link-Ziele** (`GET /api/webchat-config`) · Markdown-Bilder/Tabellen.
  - [ ] **⚠️ Dependency:** echte Vertriebs-Adressliste (PLZ→Ansprechpartner, Dietmar) + echte Link-Ziel-URLs
    (Heike) in die GoCreate-Kontakt-Admin (`webchat_contacts`/`webchat_links`) einpflegen → Test-Daten ersetzen.
  - [ ] **Prod-Rollout v0.0.4:** Widget-/Server-Deploy prod + `CHATBOT_MODEL=gpt-5.6` + `CONTACT_SUPABASE_*`-Env
    + prod-caddy-CORS — separat mit Freigabe (heute laeuft die Kontakt-/Weiche-Kette nur test).
  - [ ] **E2E-Abnahme formal abschliessen** (laut [`../docs/ANFORDERUNGEN.md`](../docs/ANFORDERUNGEN.md) § Abnahme):
    grounded Antwort mit godelmann.de-Quelle ueber den vhost + Folgefrage im selben Verlauf ·
    Rate-Limit-Negativtest (11. Nachricht → 429) · ALTCHA-Flow · **CORS-Negativtest** · Browser-E2E
    (Chrome) auf einer Test-Einbettungsseite.
  - [ ] **Restliche Ausbaustufen** (GoCreate-Websites-Backlog, Sub-App 3): Chat-Reviews/Kuratierung,
    Cost-Tracking. Sprint-Plan im GoCreate `docs/BACKLOG.md` § Websites.

## 2. Offene Doku-/Hygiene-Punkte

- [ ] **Doku-Drift `docs/EINBINDUNG.md` (Prod):** nennt Prod „folgt nach DNS-Freigabe", waehrend
  BACKLOG/CLAUDE Prod als **LIVE** (`chatbot.godelmann.net`) fuehren → EINBINDUNG.md auf Prod-LIVE nachziehen.
- [ ] **Doku-Drift conversation_id (`docs/ANFORDERUNGEN.md`):** beschreibt First-Party-Cookie (SameSite=Lax);
  Ist-Stand = `localStorage` (`gdm-chat-conversation-id`, s. Release-Historie + `EINBINDUNG.md`) →
  ANFORDERUNGEN.md an den umgesetzten Mechanismus angleichen.
- [ ] **Release-Sync:** `> Stand:`-Kopf in `docs/BACKLOG.md` == aktuelle `package.json`-Version halten
  (aktuell beide `0.0.1`; vom `/do-everything`-Frontend-Release-Sync-Check erzwungen).

## 3. Offene Sicherheits-/Audit-Punkte

- **Security-Audit 2026-07-12: 0 Findings** (kleines TS-Widget) — Belege `docs/FINDINGS-2026-07-12.md`,
  Tracker `docs/AUDIT-2026-07-12.md`, Register `Godelmann/.xoder/FINDINGS.md` (🟢 clean). Kein offener Fix.
- [ ] **CHATBOT-P3-03** (offen, **ausserhalb dieses Repos**): `/projects/CLAUDE.md`-Submodule-Liste um
  `godelmann-chatbot` ergaenzen (platform-control). → PARENT.
- [ ] **CHATBOT-P3-04** (offen, **ausserhalb dieses Repos**): dgx-Proxy `user_id`-Spoofing nur via
  `SPASS_JWT_VERIFY=enforce` verhindert — Fail-open-Default (`spass`). → PARENT.

## PARENT (zur Promotion)

> Eintraege, die inhaltlich auf eine Parent-Ebene gehoeren (Org-`.xoder`-Repo `Godelmann/.xoder` /
> `~/Projects`-Meta) bzw. in Nachbar-Repos, hier sammeln, wenn die Parent-Ebene lokal fehlt — beim
> naechsten Kontakt dorthin promoten.

- **[Nachbar-Repo / platform-control]** CHATBOT-P3-03: `godelmann-chatbot` (+ `frahcs-mobilien`) in die
  `/projects/CLAUDE.md`-Submodule-Liste aufnehmen. Beleg `docs/FINDING-CHATBOT-P3-03.md`.
- **[Nachbar-Repo / spass]** CHATBOT-P3-04: dgx-Proxy Fail-open-Default `JwtVerifyMode::Off` → in der
  Chatbot-/GoCreate-Deployment-Umgebung `SPASS_JWT_VERIFY=enforce` sicherstellen. Beleg `docs/FINDING-CHATBOT-P3-04.md`.
- **[Org / Godelmann]** Standardausstattungs-Policy: jedes Godelmann-Frontend braucht `docs/`-Doku +
  adaptierten `do-everything`-Skill (Memory `projekt-standardausstattung-policy`) — Ausrollstand fuer
  Godelmann-Chatbot pruefen (do-everything-Skill fuer dieses Repo noch nicht belegt), gehoert in `Godelmann/.xoder/`.
