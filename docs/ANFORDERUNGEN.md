# Anforderungen — Godelmann-Chatbot (godelmann.de-Webmodul, Sub-App 3)

> Stand 2026-07-12 · Maintainer Dietmar Scharf · Quelle: GoCreate-Websites-Plan
> (GoCreate `docs/BACKLOG.md` §„Websites" 1065-1149) + RAG Stufe 1 (live).
> Dieses Repo liefert das **öffentliche KI-Chat-Widget**; das Wissen kommt aus
> der produktiven Godelmann-RAG-Wissensbasis (Web + Datenblätter + Bilder).

## Ziel

Anonymer, DSGVO-lokaler KI-Chat für godelmann.de-Besucher (Produkte, Verlegung,
Referenzen, Nachhaltigkeit) — grounded über `knowledge_search` mit Quell-Links,
**eigener Hostname**, Integration als Floating-Bubble per Script-Tag.

## Architektur (entschieden 2026-07-12)

```
godelmann.de ──<script src="https://chatbot-test.godelmann.net/chatbot-widget.v1.js">──▶
  Floating-Bubble-Widget ──POST /api/chat (SSE)──▶
    godelmann-chatbot-server (eigener SPASS-Server, platform-test, PORT 3011)
      ├─ Schutz: ALTCHA (self-hosted, /altcha/challenge) + RateLimiter je IP
      ├─ reuse spass-dgx::DgxClient — Bearer server-side
      │   (GODELMANN_GOCREATE_{STAGE}_BEARER), SPASS-User-Id: web:<sha256(ip)[..12]>
      └─ DGX-Stack /c1/chat: Modell godelmann-gocreate-private-qwen-text (lokal),
         knowledge_search auto-injiziert (Tenant-KBs), SPASS-Augment: memory=off
```

- **Eigener SPASS-Server** `godelmann-chatbot-server` (spass `examples/`),
  systemd `godelmann-chatbot.service`, PORT 3011 (Test-Stage-Konvention 3xxx).
- **Hostname:** Test `chatbot-test.godelmann.net` (Caddy-vhost, CORS nur
  godelmann.de); Prod nach DNS-Freigabe.
- **Konversationen:** `conversation_id` via First-Party-Cookie (SameSite=Lax) →
  c1-Persistenz (Verlauf über Seitenwechsel); Datensparsamkeit: keine
  personenbezogenen Daten erheben, Hinweistext im Widget.

## API-Vertrag (v1)

`POST /api/chat` Body `{ "message": str≤2000, "conversation_id"?: str,
"altcha"?: payload }` → SSE-Stream (OpenAI-Delta-Format wie /api/dgx/chat in
GoCreate, abgespeckt) + Header `x-conversation-id`.
- **Limits:** 10 Nachrichten / 10 min je IP (RateLimiter, Key aus
  `X-Forwarded-For`), ALTCHA-Pflicht für anonyme Sessions (check_spam-Muster),
  message ≤ 2000 Zeichen, Timeout 120 s. 429/400 als JSON.
- Fehler-Mapping nach `spass-dgx::map_dgx_error` (RateLimited→429 etc.).

## Widget-Anforderungen — Web-Components-Standard (PFLICHT)

**Das Modul MUSS dem Web-Components-Standard entsprechen** (Custom Elements +
Shadow DOM + `<template>`; WHATWG HTML/DOM Living Standards, vormals W3C) —
damit die godelmann.de-Agentur es framework-agnostisch einbinden kann:

```html
<script type="module" src="https://chatbot-test.godelmann.net/chatbot-widget.v1.js"></script>
<godelmann-chatbot lang="de" position="bottom-right"></godelmann-chatbot>
```

1. **Custom Element `<godelmann-chatbot>`** (`customElements.define`),
   Konfiguration über HTML-Attribute: `lang` (default `de`), `position`
   (`bottom-right`/`bottom-left`), `api-base` (default = Script-Origin),
   `greeting` (optional). Attribute reaktiv (`observedAttributes`).
2. **Shadow DOM (open)** für CSS-Isolation; Theming NUR über dokumentierte
   CSS-Custom-Properties (`--gdm-chat-accent`, `--gdm-chat-z-index`, …).
3. **Events** als `CustomEvent` (`gdm-chat:opened`, `gdm-chat:message-sent`)
   — keine globalen Callbacks; Verlaufs-Id in `localStorage` des Host-Origins.
4. Darstellungsformen (Attribut `mode`, kein iFrame): **`floating`** (Bubble,
   BACKLOG-Vorgabe, Default), **`drawer`** (rechter Seiten-Drawer, schiebt die
   Seite; Ausloeser via `launcher="none"` + `data-gdm-chat-launcher`-Host-Markup),
   **`page`** (fuellt einen Container). Bundle < 80 kB gzip, self-contained;
   ES-Module + versionierte URL (`chatbot-widget.v1.js`), alle Modi additiv unter
   v1 — Breaking Changes ⇒ `v2`.
5. SSE-Streaming-Rendering (Muster: GoCreate `src/lib/dgx.ts`-Parser,
   abgespeckt); Quell-Links aus knowledge_search anklickbar; Markdown sanitized.
6. DE-Texte, Datenschutz-Hinweis + Link, „Neue Unterhaltung"-Button
   (löscht Verlaufs-Id), Barrierefreiheit (Fokus-Trap im Panel).
7. Graceful Degradation bei API-Fehlern; Rate-Limit-/Captcha-Meldung freundlich.

## Pflicht-Deliverable: `docs/EINBINDUNG.md` (deutsch)

Deutsche Integrations-Doku für die godelmann.de-Agentur in DIESEM Repo:
Snippet (wie oben), alle Attribute mit Defaults, alle CSS-Custom-Properties,
alle Events, CSP-Hinweise (script-src + connect-src auf den Chatbot-Host,
SSE!), Datenschutz-Textbaustein, Versionierungs-/Update-Politik,
Ansprechpartner. Standalone-Preview (`index.html`) = Referenz-Einbindung.

## Abnahme (E2E)

- Anonyme Frage über den vhost → grounded Antwort mit godelmann.de-Quelle
  (`knowledge_search` im Trace), Folgefrage im selben Cookie-Verlauf.
- Rate-Limit-Negativtest (11. Nachricht → 429), ALTCHA-Flow, CORS-Negativtest.
- Browser-E2E (Chrome) auf Test-Einbettungsseite.

## Bezüge

- Wissensbasis: dgx-llm-stack RAG (godelmann-web-v2 + godelmann-docs-v1,
  Hybrid+Reranker ab 0.56.0); Tenant-Prompt v12 (knowledge_search-Präferenz).
- Chat-Kuratierung/Review (GoCreate) + Feintuning-Fernziel: dgx-llm-stack
  `docs/FEINTUNING.md`.
