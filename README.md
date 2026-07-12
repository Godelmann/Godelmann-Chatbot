# Godelmann-Chatbot

Oeffentliches KI-Chat-Widget fuer godelmann.de — **Web Component**
`<godelmann-chatbot>` (WHATWG Custom Element + Shadow DOM, Vanilla
TypeScript, keine Framework-Dependency). Floating-Bubble, SSE-Streaming
gegen den `godelmann-chatbot-server` (SPASS, test-Port 3011), self-hosted
ALTCHA-Spam-Schutz, IP-Rate-Limit.

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

Vollstaendige Integrations-Doku (Attribute, CSS-Properties, Events, CSP,
Datenschutz, Versionierung): [`docs/EINBINDUNG.md`](docs/EINBINDUNG.md).

## Doku

- Verbindliche Spezifikation: [`docs/ANFORDERUNGEN.md`](docs/ANFORDERUNGEN.md)
- Release-/Feature-Log: [`docs/BACKLOG.md`](docs/BACKLOG.md)
- Backend/API-Vertrag: `Ramteid-GmbH/spass` → `examples/godelmann-chatbot-server`
