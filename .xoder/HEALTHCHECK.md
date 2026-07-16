# HEALTHCHECK.md — Godelmann-Chatbot

Verifizieren, dass das Widget end-to-end gesund ist. Topologie: [`NETWORK.md`](NETWORK.md).

## Widget-Modul erreichbar (Ingress / Caddy)
```bash
# ES-Modul laedt (200 + JS-Content-Type):
curl -s -o /dev/null -w "test  %{http_code}  %{content_type}\n" https://chatbot-test.godelmann.net/chatbot-widget.v1.js
curl -s -o /dev/null -w "prod  %{http_code}  %{content_type}\n" https://chatbot.godelmann.net/chatbot-widget.v1.js
```
- Erwartet: `200` + `application/javascript` (o. ae.). Modul ist self-contained (keine externen Ressourcen).

## ALTCHA-Challenge
```bash
curl -s https://chatbot-test.godelmann.net/altcha/challenge   # JSON-Challenge (algorithm/challenge/salt/signature)
```
- Erwartet: gueltige ALTCHA-Challenge (SHA-256-PoW-Format). Leere/500-Antwort → chatbot-server-Unit pruefen.

## Chat-API (SSE) — im Browser (Einbettungsseite oder index.html-Preview)
- `<godelmann-chatbot>` einbetten → Bubble klicken → Frage stellen → **gestreamte** deutsche Antwort mit
  **anklickbarer godelmann.de-Quelle** (grounded via `knowledge_search`). Folgefrage bleibt im selben Verlauf
  (`x-conversation-id` / localStorage `gdm-chat-conversation-id`).
- Netzwerk-Sicht (DevTools): `POST /api/chat` → `200`, `content-type: text/event-stream`, Delta-Chunks bis `[DONE]`,
  Response-Header `x-conversation-id` gesetzt.

## CORS (Boundary)
- Von einer **godelmann.de**-Origin: `POST /api/chat` erlaubt (Preflight ok, `x-conversation-id` exposed).
- Von einer **fremden** Origin: Preflight/Response ohne `Access-Control-Allow-Origin` → Browser blockt
  (CORS-Negativtest, Abnahme-Kriterium).

## Rate-Limit / ALTCHA (Schutz)
- 11. Nachricht innerhalb 10 min je IP → `429` + freundliche deutsche Rate-Limit-Meldung im Widget.
- Manipuliertes/fehlendes ALTCHA-Payload → `400 captcha_required` (Client macht 1 Auto-Retry mit frischer Loesung).

## Backend-Service (chatbot-server, auf dem App-Server)
```bash
# test:  ssh -i /root/.ssh/platform      root@10.0.0.4    'systemctl status godelmann-chatbot; ss -ltnp | grep 3011'
# prod:  ssh -i /root/.ssh/godelmann-prod root@49.12.77.51 'systemctl status godelmann-chatbot; ss -ltnp | grep 3011'
```
- Unit `active (running)`, Port 3011 gebunden. Logs: `journalctl -u godelmann-chatbot -n 50 --no-hostname`.

## Bundle-Gate (lokal, vor Release)
```bash
npm run build                                        # tsc --noEmit + Vite lib-mode -> dist/chatbot-widget.v1.js
gzip -c dist/chatbot-widget.v1.js | wc -c            # < 80*1024 Bytes (Gate; aktuell ~7,4 kB)
```

## TLS-Cert
- LE-Cert der `chatbot[-test].godelmann.net`-vhosts nicht abgelaufen (Caddy erneuert automatisch;
  Ablauf beobachten s. `.xoder/MONITORING.md`).

## Fehlerbilder
- **Script laedt, Chat blockt:** fehlende `connect-src`-CSP-Freigabe auf godelmann.de (SSE!) — `docs/EINBINDUNG.md` § CSP.
- **`altcha/challenge` 500 / `/api/chat` 502:** `godelmann-chatbot.service` down oder DGX-Bearer ungueltig → `journalctl`.
- **Keine Quelle / generische Antwort:** `knowledge_search`/RAG-KB nicht injiziert — dgx-Seite pruefen (dgx-llm-stack).
