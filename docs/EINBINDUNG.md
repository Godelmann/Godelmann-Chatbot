# Einbindung — GODELMANN Chatbot-Widget (`<godelmann-chatbot>`)

> Stand 2026-07-12 · Widget-Version v1 (`chatbot-widget.v1.js`) · fuer die godelmann.de-Agentur
> Ansprechpartner: **Dietmar Scharf** (BLUE ITS / Ramteid GmbH), blueits@ramteid.gmbh

Das Widget ist eine **Web Component nach WHATWG-Standard** (Custom Element +
Shadow DOM) ohne Framework-Abhaengigkeit. Es rendert eine Floating-Bubble
unten rechts (kein iFrame) und oeffnet ein Chat-Panel, das mit dem
Godelmann-Chatbot-Backend spricht (SSE-Streaming, self-hosted
ALTCHA-Spam-Schutz, IP-Rate-Limit).

## Snippet

```html
<script type="module" src="https://chatbot-test.godelmann.net/chatbot-widget.v1.js"></script>
<godelmann-chatbot lang="de" position="bottom-right"></godelmann-chatbot>
```

Mehr ist nicht noetig: ohne `api-base`-Attribut spricht das Widget automatisch
den Host an, von dem das Script geladen wurde (Origin der Script-URL).
Test-Host: `https://chatbot-test.godelmann.net` — der Prod-Host folgt nach
DNS-Freigabe; das Snippet bleibt bis auf die URL identisch.

## Attribute

Alle Attribute sind optional und **reaktiv** (Aenderung zur Laufzeit wirkt sofort).

| Attribut | Werte | Default | Beschreibung |
|---|---|---|---|
| `lang` | `de`, `en` | `de` | Sprache der UI-Texte (Titel, Buttons, Fehlermeldungen, Begruessung). Unbekannte Werte fallen auf `de` zurueck. |
| `position` | `bottom-right`, `bottom-left` | `bottom-right` | Ecke, in der Bubble und Panel verankert sind. |
| `api-base` | URL-Origin | Origin der Script-URL | Basis-URL des Chatbot-Backends (`{api-base}/api/chat`, `{api-base}/altcha/challenge`). Nur setzen, wenn Widget-Script und API auf verschiedenen Hosts liegen. |
| `greeting` | Freitext | Deutsche Standard-Begruessung | Eigene erste Assistenten-Nachricht beim Oeffnen des Panels. |

## CSS-Custom-Properties (Theming)

Das Widget ist per Shadow DOM CSS-isoliert; Theming laeuft ausschliesslich
ueber diese dokumentierten Custom Properties (z. B. am Element oder auf `:root`):

| Property | Default | Beschreibung |
|---|---|---|
| `--gdm-chat-accent` | `#E52D12` (Godelmann-Rot) | Akzentfarbe: Bubble, Header, Nutzer-Nachrichten, Senden-Button, Links. |
| `--gdm-chat-z-index` | `2147483000` | Stapelreihenfolge von Bubble und Panel. |
| `--gdm-chat-font` | `inherit` (Seiten-Font) | Schriftfamilie des Widgets. |

```css
godelmann-chatbot {
  --gdm-chat-accent: #E52D12;
  --gdm-chat-z-index: 99999;
  --gdm-chat-font: "FF Meta Pro", sans-serif;
}
```

## Events

Alle Events sind `CustomEvent`s mit `bubbles: true` und `composed: true` —
sie lassen sich am Element oder auf `document` abonnieren.

| Event | `detail` | Wann |
|---|---|---|
| `gdm-chat:opened` | — | Chat-Panel wurde geoeffnet. |
| `gdm-chat:closed` | — | Chat-Panel wurde geschlossen (X, ESC oder Bubble). |
| `gdm-chat:message-sent` | `{ message }` | Nutzer-Nachricht wurde abgeschickt. |
| `gdm-chat:response-received` | `{ message }` | Assistenten-Antwort vollstaendig empfangen. |
| `gdm-chat:error` | `{ message }` | Fehler (Rate-Limit, Netz, Timeout, Captcha) — `message` ist der angezeigte Text. |

```js
document.addEventListener('gdm-chat:message-sent', (e) => {
  console.log('Chat-Frage:', e.detail.message);
});
```

## Content-Security-Policy (CSP)

Falls godelmann.de eine CSP setzt, braucht das Widget zwei Freigaben
(Host = Chatbot-Host, hier Test):

```
script-src  ... https://chatbot-test.godelmann.net;
connect-src ... https://chatbot-test.godelmann.net;
```

- `script-src`: laedt das ES-Modul `chatbot-widget.v1.js`.
- `connect-src`: **wichtig auch fuer das SSE-Streaming** — die Antworten
  kommen als `text/event-stream` ueber `fetch` von
  `POST {host}/api/chat`; zusaetzlich `GET {host}/altcha/challenge`
  (Spam-Schutz). Ohne `connect-src`-Freigabe blockt der Browser die
  Chat-Verbindung, obwohl das Script laedt.

Das Widget selbst laedt **keine** weiteren externen Ressourcen (keine Fonts,
keine Bilder, kein CDN) — es ist ein einzelnes, self-contained ES-Modul.

## Datenschutz-Textbaustein

Fuer die Datenschutzerklaerung / den Widget-Hinweis:

> Der Chat ist **anonym** — es ist kein Login noetig und es werden keine
> personenbezogenen Daten erhoben. Zum Schutz vor automatisiertem Missbrauch
> gilt ein IP-basiertes Rate-Limit (maximal 10 Nachrichten in 10 Minuten);
> dafuer wird die IP-Adresse ausschliesslich in gehashter, gekuerzter Form
> verarbeitet. Die Verlaufs-Id der Unterhaltung wird nur im `localStorage`
> des Browsers gespeichert und laesst sich jederzeit ueber „Neue
> Unterhaltung" loeschen. Bitte geben Sie im Chat keine personenbezogenen
> Daten ein. Es findet keine Datenuebertragung an Dritte statt; auch der
> Spam-Schutz (ALTCHA Proof-of-Work) laeuft vollstaendig self-hosted.

Das Widget zeigt zusaetzlich einen permanenten Hinweis mit Link auf
<https://www.godelmann.de/de/datenschutz> unterhalb der Eingabezeile.

## Versionierungs- und Update-Politik

- Die Datei-URL ist **versioniert**: `chatbot-widget.v1.js`. Innerhalb von
  `v1` bleiben Snippet, Attribute, CSS-Properties und Events **stabil** —
  Bugfixes und kompatible Verbesserungen werden unter derselben URL
  ausgeliefert (kein Handlungsbedarf auf godelmann.de-Seite).
- **Breaking Changes** (entfernte/umbenannte Attribute, Events oder
  CSS-Properties) erscheinen ausschliesslich als neue Datei
  `chatbot-widget.v2.js`; `v1` laeuft parallel weiter, bis die Einbindung
  umgestellt ist. Umstellungen kuendigen wir der Agentur an.

## Ansprechpartner

| | |
|---|---|
| **Technik / Betrieb** | Dietmar Scharf, BLUE ITS (Ramteid GmbH) |
| **E-Mail** | blueits@ramteid.gmbh |
| **Repo** | `Godelmann/Godelmann-Chatbot` (Widget) · Backend: `Ramteid-GmbH/spass` `examples/godelmann-chatbot-server` |
