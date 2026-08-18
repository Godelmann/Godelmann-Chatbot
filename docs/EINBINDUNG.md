# Einbindung — GODELMANN Chatbot-Widget (`<godelmann-chatbot>`)

> **Offizieller Einbindungs-Host + autorisierte Domains, Doku v1.2 (18.08.2026):**
> Der Chatbot wird fuer die Einbindung auf godelmann.de/.com ueber den eigenen
> Host **`https://chatbot.godelmann.bot`** ausgeliefert (unabhaengig von den
> godelmann.de-/.com-Systemen der Agentur). Auslieferung und Chat-APIs sind auf
> **autorisierte Godelmann-Domains beschraenkt** — Details im neuen Abschnitt
> „Autorisierte Domains". **Snippet, Attribute, Events und CSS-Properties sind
> unverändert (v1-stabil)** — es aendert sich nur die Script-URL.

> **Mehrsprachigkeit 0.0.14 (04.08.2026):** Der Chat-Berater kann jetzt mehrsprachig
> antworten (freigeschaltet: Deutsch, Englisch, Tschechisch; weitere EU-Sprachen folgen
> nach Review). Unter jeder Antwort sitzt rechts neben „Kommentar" eine **farbige
> Miniflagge mit Sprachkürzel** — Klick öffnet das Sprachmenü; ein Wechsel mitten im
> Gespräch stellt sofort die komplette Oberfläche um, und die nächste Bot-Antwort
> bestätigt den Wechsel mit einer kurzen Zusammenfassung des bisherigen Verlaufs in der
> neuen Sprache. Erkennt der Server per lokaler GeoIP-Datenbank ein Land mit anderer
> Sprache als der Einstiegssprache, begrüßt der Berater zweisprachig und bietet
> Sprachwahl-Chips an (ohne GeoIP-Datenbank entfällt das automatisch). **Snippet,
> Attribute, Events und CSS-Properties sind unverändert (v1-stabil)** — das
> `lang`-Attribut bleibt die Einstiegssprache; die Wahl des Besuchers hat Vorrang und
> gilt für die laufende Sitzung (Tab).

> **Optik-Stand 0.0.13 (04.08.2026):** Kopfzeilen-Buttons und Feedback-Leiste zeigen jetzt Icon + Text („Neue Unterhaltung", „Vollbild"/„Verkleinern", „Schließen"; „Hilfreich"/„Nicht hilfreich"/„Kommentar"), Icons in der Formensprache der godelmann.de-Site-Icons; unter 520px wieder icon-only. Akzent-Default Anthrazit. **Snippet, Attribute, Events und CSS-Properties sind unverändert (v1-stabil)** — `--gdm-chat-accent`/`--gdm-chat-accent-hover` erlauben weiterhin eigenes Theming.

> Stand 2026-08-18 (Doku v1.2) · Widget-Version v1 (`chatbot-widget.v1.js`, Fassung 0.0.15) · fuer die godelmann.de-Agentur
> Ansprechpartner: **Dietmar Scharf** (BLUE ITS / Ramteid GmbH), blueits@ramteid.gmbh

Das Widget ist eine **Web Component nach WHATWG-Standard** (Custom Element +
Shadow DOM) ohne Framework-Abhaengigkeit. Es spricht mit dem
Godelmann-Chatbot-Backend (SSE-Streaming, self-hosted ALTCHA-Spam-Schutz,
IP-Rate-Limit) und laedt sonst **keine** externen Ressourcen.

Es kennt seit 0.0.8 **drei Darstellungsformen** (Attribut `mode`), alle mit
demselben Snippet und derselben Unterhaltung:

- **`floating`** (Default) — schwebende Bubble unten rechts (bisheriges Verhalten, unveraendert).
- **`drawer`** — rechter Seiten-Drawer, der die Seite sanft schmaler schiebt (kein
  Abdunkeln, Seite bleibt bedienbar); Ausloeser ist ein eigenes Element in der Seite
  (z. B. das Utility-Rail-Item), Vollbild-Wechsel auf eine eigene Seite.
- **`page`** — der Chat fuellt einen Container als eigene (Unter-)Seite.

**Alles bleibt v1** (additiv): Wer nur das bisherige Snippet nutzt, bekommt
unveraendert die Floating-Bubble. Das **Lieferpaket fuer godelmann.de** (Rail +
Drawer + Seite) steht unten in Abschnitt „Einbindung als Seiten-Drawer".

## Snippet (Floating, unveraendert)

```html
<script type="module" src="https://chatbot.godelmann.bot/chatbot-widget.v1.js"></script>
<godelmann-chatbot lang="de" position="bottom-right"></godelmann-chatbot>
```

Mehr ist nicht noetig: ohne `api-base`-Attribut spricht das Widget automatisch
den Host an, von dem das Script geladen wurde (Origin der Script-URL).
**Offizieller Host fuer godelmann.de/.com: `https://chatbot.godelmann.bot`.**
(`https://chatbot-test.godelmann.net` ist die interne Testumgebung und nicht
Teil der Agentur-Einbindung.) Optionaler Performance-Tipp — Verbindung
vorwaermen, bevor das Modul laedt:

```html
<link rel="preconnect" href="https://chatbot.godelmann.bot">
```

## Autorisierte Domains

Auslieferung des Widgets **und** alle Chat-APIs sind serverseitig auf
autorisierte Godelmann-Domains beschraenkt:

- `https://www.godelmann.de` · `https://godelmann.de`
- `https://www.godelmann.com` · `https://godelmann.com`

Technisch heisst das: Die API-Endpunkte pruefen den `Origin`-Header
(Allowlist am Server) — auf fremden Domains antwortet der Chat mit 403 und
funktioniert nicht. Zusaetzlich initialisiert sich das Widget nur auf
Godelmann-Domains (Laufzeit-Pruefung mit kurzem `console.info`-Hinweis auf
fremden Seiten).

**Staging-/Preview-Umgebungen der Agentur** werden auf Zuruf in die Allowlist
aufgenommen: bitte die exakte(n) Origin(s) nennen (Schema + Host, ohne Pfad —
z. B. `https://preview.example-agentur.dev`), dann wird die Freigabe
eingerichtet und kurz bestaetigt.

**Hinweis Referrer-Policy:** Bitte die Referrer-Policy der einbindenden
Seiten **nicht** auf `no-referrer` stellen — der Browser-Standard
(`strict-origin-when-cross-origin`) genuegt. Auslieferungs-Pruefung und
Seitenkontext (`page-url`) nutzen den Origin-Anteil des Referers.

## Attribute

Alle Attribute sind optional und **reaktiv** (Aenderung zur Laufzeit wirkt sofort).

| Attribut | Werte | Default | Beschreibung |
|---|---|---|---|
| `lang` | `de`, `en` | `de` | Sprache der UI-Texte (Titel, Buttons, Fehlermeldungen, Begruessung). Unbekannte Werte fallen auf `de` zurueck. |
| `position` | `bottom-right`, `bottom-left` | `bottom-right` | Ecke, in der Bubble und Panel verankert sind (nur `mode="floating"`). |
| `api-base` | URL-Origin | Origin der Script-URL | Basis-URL des Chatbot-Backends (`{api-base}/api/chat`, `{api-base}/altcha/challenge`). Nur setzen, wenn Widget-Script und API auf verschiedenen Hosts liegen. |
| `greeting` | Freitext | Deutsche Standard-Begruessung | Eigene erste Assistenten-Nachricht beim Oeffnen des Panels. |
| `mode` | `floating`, `drawer`, `page` | `floating` | Darstellungsform (s. o.). Unbekannte Werte fallen auf `floating` zurueck. |
| `launcher` | `bubble`, `none` | `bubble` | `none` blendet die eigene Bubble aus; der Ausloeser ist dann Host-Markup mit `data-gdm-chat-launcher` (das Widget verdrahtet es automatisch, s. u.). |
| `page-url` | Pfad/URL | `/chat` | Ziel des Vollbild-Wechsels aus dem Drawer (Punchout). |

## CSS-Custom-Properties (Theming)

Das Widget ist per Shadow DOM CSS-isoliert; Theming laeuft ausschliesslich
ueber diese dokumentierten Custom Properties (z. B. am Element oder auf `:root`):

| Property | Default | Beschreibung |
|---|---|---|
| `--gdm-chat-accent` | `#E54F35` (Godelmann Red 100) | Akzentfarbe: Bubble, Header, Nutzer-Nachrichten, Senden-Button, Links. |
| `--gdm-chat-z-index` | `2147483000` | Stapelreihenfolge von Bubble und Panel. |
| `--gdm-chat-font` | `inherit` (Seiten-Font) | Schriftfamilie des Widgets. |
| `--gdm-chat-drawer-width` | `480px` | Breite des Seiten-Drawers (`mode="drawer"`). Muss mit der Breite in der Drawer-Support-CSS-Regel uebereinstimmen (s. u.). |

```css
godelmann-chatbot {
  --gdm-chat-accent: #E54F35;
  --gdm-chat-z-index: 99999;
  --gdm-chat-font: "FF Meta Pro", sans-serif;
  --gdm-chat-drawer-width: 480px;
}
```

## Einbindung als Seiten-Drawer (Lieferpaket godelmann.de)

Fuer godelmann.de wird das Widget als **rechter Seiten-Drawer** eingebunden, mit
einem eigenen Ausloeser in der bestehenden Utility-Rail und einer Vollbild-Seite
`/chat`. Die Einbindung ist **minimalinvasiv** — im Kern drei kleine Bausteine
(Rail-Item, Widget-Tag, eine CSS-Regel) plus optional die CMS-Seite.

### 1. Ausloeser in der Rail (statt eigener Bubble)

Ein zusaetzliches Rail-Item mit dem Attribut `data-gdm-chat-launcher`. Das Widget
verdrahtet es automatisch (Klick oeffnet/schliesst den Drawer, `aria-expanded`
wird gespiegelt) — **kein Inline-JavaScript noetig** (CSP-freundlich).
`href="/chat"` ist der Fallback ohne JavaScript. Icon frei waehlbar (hier
vorlaeufig eine Sprechblase; Godelmanns eigenes Chat-Icon kann es ersetzen):

```html
<a data-gdm-chat-launcher href="/chat" aria-label="Chat-Berater oeffnen"
   class="<gleiche Klassen wie die uebrigen Rail-Items>">
  <!-- Icon (SVG oder Icon-Font wie die anderen Rail-Items) -->
  <span class="hidden md:inline">Chat-Berater</span>
</a>
```

### 2. Das Widget selbst (Drawer-Modus)

```html
<script type="module" src="https://chatbot.godelmann.bot/chatbot-widget.v1.js"></script>
<godelmann-chatbot mode="drawer" launcher="none" page-url="/chat"></godelmann-chatbot>
```

### 3. GENAU EINE CSS-Regel

Der Drawer schiebt den Seiteninhalt ueber einen `margin-right` am `<html>` (setzt
das Widget selbst, inkl. Marker-Klasse `gdm-chat-drawer-open`). **Fest
positionierte** Elemente (Header und Rail) folgen einem html-`margin` nicht —
diese eine Regel zieht sie mit (mit `right`, **nicht** `transform`, sonst bricht
die Rail-Mechanik):

```css
html.gdm-chat-drawer-open [data-header] header,
html.gdm-chat-drawer-open div[data-inject="frm-utility-nav"] {
  right: var(--gdm-chat-drawer-width, 480px);
  transition: right .8s ease;
}
```

Die Selektoren gelten fuer die heutige godelmann.de-Struktur (`[data-header] header`
= Kopf, `div[data-inject="frm-utility-nav"]` = Rail). Aendert sich das Markup, nur
diese eine Regel anpassen.

### 4. Vollbild-Seite `/chat` (CMS, optional aber empfohlen)

Eine eigene Seite (Route `/chat`, im normalen Header/Footer-Stil), die den Berater
in einen **hoehen-gebenden Container** setzt:

```html
<div style="height:min(78vh,780px); min-height:480px;">
  <godelmann-chatbot mode="page" page-url="/chat"
    style="display:block; width:100%; height:100%;"></godelmann-chatbot>
</div>
<script type="module" src="https://chatbot.godelmann.bot/chatbot-widget.v1.js"></script>
```

Drawer und Seite teilen dieselbe Unterhaltung (gleiche Origin, gleicher
`sessionStorage`): Punchout aus dem Drawer oeffnet `/chat`, „Verkleinern" fuehrt
zurueck.

> **Mobil:** Auf kleinen Displays wird der Drawer automatisch zum
> Vollflaechen-Panel (kein Schieben) — nichts weiter zu tun.
>
> **Demo ohne Agentur:** Der Godelmann-Proxy (`test.godelmann.net`) injiziert die
> Bausteine 1+3 bereits selbst und setzt das Widget in den Drawer-Modus — dort ist
> die komplette Einbindung ohne CMS-Aenderung sichtbar (Punchout auf
> `test.godelmann.net/chat`).

## Events

Alle Events sind `CustomEvent`s mit `bubbles: true` und `composed: true` —
sie lassen sich am Element oder auf `document` abonnieren.

| Event | `detail` | Wann |
|---|---|---|
| `gdm-chat:opened` | — | Chat wurde geoeffnet. |
| `gdm-chat:closed` | — | Chat wurde geschlossen (X, ESC oder Ausloeser). |
| `gdm-chat:message-sent` | `{ message }` | Nutzer-Nachricht wurde abgeschickt. |
| `gdm-chat:response-received` | `{ message }` | Assistenten-Antwort vollstaendig empfangen. |
| `gdm-chat:error` | `{ message }` | Fehler (Rate-Limit, Netz, Timeout, Captcha) — `message` ist der angezeigte Text. |

```js
document.addEventListener('gdm-chat:message-sent', (e) => {
  console.log('Chat-Frage:', e.detail.message);
});
```

### Steuern von aussen (optional)

Das Widget laesst sich programmatisch oeffnen/schliessen — entweder ueber die
Element-Referenz oder ueber Ereignisse am `document` (praktisch, wenn man das
Element nicht direkt greifen kann):

| Methode | Ereignis am `document` | Wirkung |
|---|---|---|
| `el.open()` | `gdm-chat:open` | Chat oeffnen. |
| `el.close()` | `gdm-chat:close` | Chat schliessen. |
| `el.toggle()` | `gdm-chat:toggle` | Umschalten. |

```js
document.dispatchEvent(new CustomEvent('gdm-chat:toggle'));
```

## Content-Security-Policy (CSP)

godelmann.de/.com setzen aktuell **keine** CSP — dieser Abschnitt wird erst
relevant, falls die Agentur eine einfuehrt. Dann braucht das Widget diese
Freigaben:

```
script-src  ... https://chatbot.godelmann.bot;   (bzw. script-src-elem)
connect-src ... https://chatbot.godelmann.bot;
```

- `script-src`/`script-src-elem`: laedt das ES-Modul `chatbot-widget.v1.js`.
- `connect-src`: **wichtig auch fuer das SSE-Streaming** — die Antworten
  kommen als `text/event-stream` ueber `fetch` von
  `POST {host}/api/chat`; zusaetzlich `GET {host}/altcha/challenge`
  (Spam-Schutz). Ohne `connect-src`-Freigabe blockt der Browser die
  Chat-Verbindung, obwohl das Script laedt.
- `style-src`: Das Widget setzt seine Styles als `<style>`-Element im
  eigenen Shadow DOM — eine CSP wirkt auch dort. Unter einer strikten CSP
  waere dafuer `style-src 'unsafe-inline'` noetig; auf Wunsch ist
  alternativ eine Fassung mit `adoptedStyleSheets` (ohne diese Freigabe)
  lieferbar.
- **Kein iframe**: Das Widget rendert direkt in der Seite (Custom Element);
  `frame-src`-Freigaben entfallen.
- **Subresource Integrity (SRI)** ist bewusst nicht vorgesehen: unter der
  stabilen v1-URL werden kompatible Verbesserungen fortlaufend ausgeliefert
  (siehe Versionierungs-Politik) — ein fester Hash wuerde jede Auslieferung
  brechen.

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
