# Einbindung — GODELMANN Chatbot-Widget (`<godelmann-chatbot>`)

> **Doku v1.3 (18.08.2026):** Die **Ziel-Einbindung fuer godelmann.de** (Seiten-Drawer
> mit Rail-Ausloeser „Chat-Berater") steht jetzt als erster Abschnitt mit 1:1
> kopierbaren Bloecken (Rail-Item, Widget-Tag, Support-Style inkl. Icon-Masken-CSS).
> NEU: Abschnitt **Consent-Verwaltung (Usercentrics)** — alle Script-Snippets tragen
> `data-uc-allowed="true"`; Mehrsprachigkeits-Hinweis (`lang` je Seitensprache,
> `cs` ergaenzt); Akzent-Defaults korrigiert (Anthrazit seit 0.0.13).
> **Snippet, Attribute, Events und CSS-Properties bleiben v1-stabil.**

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

> **Optik-Stand 0.0.20 (06.09.2026):** Layout wie der Gravelli-Chat (Design Sabrina Ansicht 2/3):
> Kopfzeile grau mit G-Avatar, Titel „Ihr KI-Berater" und nur noch Reset (↺) + Schliessen (X) —
> die Knoepfe „Vollbild"/„Verkleinern" gibt es nicht mehr (Drawer und `/chat`-Seite teilen die
> Unterhaltung weiter ueber `sessionStorage`; der Wechsel geschieht ueber die Seiten-Navigation).
> Vor dem ersten Kontakt steht eine Zustimmungskarte „Nutzungsbedingungen" (Chat starten /
> Abbrechen); bis dahin sendet das Widget nichts. Unter dem Eingabefeld zwei Hinweiszeilen mit
> Links auf Kontaktformular und Datenschutz (je Sprache). Akzent = Website-Rot `#E54F35`.
>
> **Optik-Stand 0.0.13 (04.08.2026):** Kopfzeilen-Buttons und Feedback-Leiste zeigen jetzt Icon + Text („Neue Unterhaltung", „Vollbild"/„Verkleinern", „Schließen"; „Hilfreich"/„Nicht hilfreich"/„Kommentar"), Icons in der Formensprache der godelmann.de-Site-Icons; unter 520px wieder icon-only. Akzent-Default Anthrazit. **Snippet, Attribute, Events und CSS-Properties sind unverändert (v1-stabil)** — `--gdm-chat-accent`/`--gdm-chat-accent-hover` erlauben weiterhin eigenes Theming.

> Stand 2026-08-18 (Doku v1.3) · Widget-Version v1 (`chatbot-widget.v1.js`, Fassung 0.0.17) · fuer die godelmann.de-Agentur
> Technischer Ansprechpartner: **Dietmar Scharf** (Godelmann-Chatbot-Betrieb) — Kontakt ueber Godelmann / Frau Sturm

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

**Alles bleibt v1** (additiv): Wer nur das 2-Zeilen-Snippet nutzt, bekommt
die Floating-Bubble (Abschnitt „Alternative: Floating-Bubble"). **Fuer
godelmann.de gilt die Ziel-Einbindung im direkt folgenden Abschnitt.**

## Ziel-Einbindung godelmann.de (Seiten-Drawer) — Lieferpaket

**Das ist die fuer godelmann.de vorgesehene Variante** (identisch zur
Live-Vorschau auf der Testumgebung, s. u.): Ausloeser als viertes Element der
Kontakt-Leiste rechts („Chat-Berater"), Chat als rechter Seiten-Drawer, der die
Seite sanft schmaler schiebt, plus Vollbild-Seite `/chat`. Die Einbindung ist
**minimalinvasiv** — im Kern drei kleine Bausteine (Rail-Item, Widget-Tag, ein
Style-Block) plus optional die CMS-Seite. Alle Bloecke sind 1:1 kopierbar und
entsprechen zeichengenau der Referenz-Einbindung der Testumgebung.

### 1. Ausloeser in der Kontakt-Leiste (Rail-Item)

Ein zusaetzliches Rail-Item mit dem Attribut `data-gdm-chat-launcher`. Das Widget
verdrahtet es automatisch (Klick oeffnet/schliesst den Drawer, `aria-expanded`
wird gespiegelt) — **kein Inline-JavaScript noetig** (CSP-freundlich).
`href="/chat"` ist der Fallback ohne JavaScript. Referenz-Markup der
Testumgebung (der Tailwind-Klassenstring entspricht den heutigen Rail-Items der
Site und darf an deren Stand angepasst werden — funktional noetig sind nur
`data-gdm-chat-launcher`, die ARIA-Attribute und die Icon-Klasse `icon-gdm-chat`):

```html
<a data-gdm-chat-launcher role="button" tabindex="0" aria-expanded="false" aria-label="Chat-Berater oeffnen" href="/chat"
   class="translate-x-48 bg-anthracite-80 text-white transition-all md:translate-x-0 group-focus/utility-nav:translate-x-0 group-focus-within/utility-nav:translate-x-0 group-data-[expanded]/utility-nav:translate-x-0 group-focus/utility-nav:grow md:group-focus/utility-nav:grow-0 flex md:inline-block justify-center group-focus-within/utility-nav:grow group-data-[expanded]/utility-nav:grow md:group-focus-within/utility-nav:grow-0 md:group-data-[expanded]/utility-nav:grow-0 grow-0 md:bg-anthracite-100 md:bg-opacity-80 md:text-white p-12 md:mb-px md:hocus:bg-red-100 cursor-pointer">
    <span class="icon icon-gdm-chat md:mr-12" aria-hidden="true"></span>
    <span class="hidden md:inline">Chat-Berater</span>
</a>
```

### 2. Das Widget selbst (Drawer-Modus)

```html
<script type="module" src="https://chatbot.godelmann.bot/chatbot-widget.v1.js" data-uc-allowed="true"></script>
<godelmann-chatbot mode="drawer" launcher="none" page-url="/chat" lang="de"></godelmann-chatbot>
```

`data-uc-allowed="true"` verhindert, dass die Usercentrics-Consent-Verwaltung
das Script automatisch blockt (Details im Abschnitt „Consent-Verwaltung");
`lang` bitte je Seitensprache setzen (Abschnitt „Attribute", Mehrsprachigkeit).

### 3. Der Support-Style-Block (mitschiebender Header + Chat-Icon)

Der Drawer schiebt den Seiteninhalt ueber einen `margin-right` am `<html>` (setzt
das Widget selbst, inkl. Marker-Klasse `gdm-chat-drawer-open`). **Fest
positionierte** Elemente (Header und Rail) folgen einem html-`margin` nicht —
die erste Regel zieht sie mit (mit `right`, **nicht** `transform`, sonst bricht
die Rail-Mechanik). Die zweite Regel liefert das Chat-Icon als Masken-SVG, das
sich wie die uebrigen Rail-Icons ueber `background-color` einfaerbt. Kompletter
Block zum Kopieren (zeichengleich zur Testumgebung; der Marker
`data-gdm-chat-drawer-support` dient nur der Wiedererkennung):

```html
<style data-gdm-chat-drawer-support>
html.gdm-chat-drawer-open [data-header] header,
html.gdm-chat-drawer-open div[data-inject="frm-utility-nav"] {
  right: var(--gdm-chat-drawer-width, 480px);
  transition: right .8s ease;
}
.icon-gdm-chat::before {
  content: "";
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12.5 6H21.5V19L16 23.5V19H6V12.5' stroke='black' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M6 1L7.6 4.4L11 6L7.6 7.6L6 11L4.4 7.6L1 6L4.4 4.4Z' fill='black'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12.5 6H21.5V19L16 23.5V19H6V12.5' stroke='black' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M6 1L7.6 4.4L11 6L7.6 7.6L6 11L4.4 7.6L1 6L4.4 4.4Z' fill='black'/%3E%3C/svg%3E");
  background-color: #fff;
}
</style>
```

Die Selektoren gelten fuer die heutige godelmann.de-Struktur (`[data-header] header`
= Kopf, `div[data-inject="frm-utility-nav"]` = Rail; beide auf der Live-Site
vorhanden, Stand 18.08.2026). Aendert sich das Markup, nur diese Regel anpassen.
Wer das Icon lieber als Inline-SVG setzt: gleichwertige Variante im Abschnitt
„Chat-Icon (Kontakt-Leiste)".

### 4. Vollbild-Seite `/chat` (CMS, optional aber empfohlen)

Eine eigene Seite (Route `/chat`, im normalen Header/Footer-Stil), die den Berater
in einen **hoehen-gebenden Container** setzt:

```html
<div style="height:min(78vh,780px); min-height:480px;">
  <godelmann-chatbot mode="page" page-url="/chat"
    style="display:block; width:100%; height:100%;"></godelmann-chatbot>
</div>
<script type="module" src="https://chatbot.godelmann.bot/chatbot-widget.v1.js" data-uc-allowed="true"></script>
```

Drawer und Seite teilen dieselbe Unterhaltung (gleiche Origin, gleicher
`sessionStorage`): Punchout aus dem Drawer oeffnet `/chat`, „Verkleinern" fuehrt
zurueck.

> **Seit 0.0.20:** kein Punchout-/Verkleinern-Knopf mehr in der Kopfzeile (Design). Die Seite
> `/chat` bleibt ueber normale Links erreichbar; Drawer und Seite teilen die Unterhaltung wie
> zuvor ueber `sessionStorage`.

> **Mobil:** Auf kleinen Displays wird der Drawer automatisch zum
> Vollflaechen-Panel (kein Schieben) — nichts weiter zu tun.
>
> **Betriebsannahmen:** Genau **eine** `<godelmann-chatbot>`-Instanz je Seite;
> klassische Seitennavigation vorausgesetzt. Sollte spaeter eine Teilnavigation
> (PJAX/Turbo o. ae.) eingefuehrt werden, das Element im persistenten Layout
> belassen, damit die laufende Unterhaltung sichtbar bleibt.
>
> **Demo ohne Agentur:** Der Godelmann-Proxy (`test.godelmann.net`) injiziert die
> Bausteine 1+3 der Ziel-Einbindung bereits selbst — dort ist die komplette
> Einbindung ohne CMS-Aenderung sichtbar (Punchout auf `test.godelmann.net/chat`).


## Alternative: Floating-Bubble (2-Zeilen-Snippet)

Falls statt des Drawers die schwebende Chat-Bubble unten rechts gewuenscht ist:

```html
<script type="module" src="https://chatbot.godelmann.bot/chatbot-widget.v1.js" data-uc-allowed="true"></script>
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

## Live-Vorschau der fertigen Einbindung

Die vollstaendige Ziel-Einbindung (Drawer-Modus, Ausloeser als viertes Element
der Kontakt-Leiste rechts) ist auf der Godelmann-Testumgebung zu sehen:
**https://test.godelmann.net** — die Seite liegt hinter einer Passwortsperre;
die Zugangsdaten stehen in der Begleit-E-Mail. Dort sind Verhalten, Optik und
das Zusammenspiel mit dem Seitenlayout exakt so umgesetzt, wie es fuer
godelmann.de vorgesehen ist (inkl. des mitschiebenden Headers im Drawer-Modus,
s. Abschnitt Drawer).

### Chat-Icon (Kontakt-Leiste)

Das fuer den Ausloeser vorgesehene Icon (Sprechblase + Godelmann-Funke) als
Inline-SVG — 24x24, Strichstaerke folgt der Site-Icon-Sprache, Farbe erbt via
`currentColor`:

```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12.5 6H21.5V19L16 23.5V19H6V12.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 1L7.6 4.4L11 6L7.6 7.6L6 11L4.4 7.6L1 6L4.4 4.4Z" fill="currentColor"/>
</svg>
```

Auf der Testumgebung ist dasselbe Motiv als CSS-Masken-Variante im Einsatz,
damit es sich wie die uebrigen Rail-Icons ueber `background-color` einfaerbt —
der fertige Masken-CSS-Block steht in der Ziel-Einbindung (Baustein 3);
beide Formen sind gleichwertig nutzbar.

## Autorisierte Domains

> **Pruefung SCHARF seit 20.08.2026** (Salient-Domains gemeldet 19.08. via
> Frau Sturm). Die Uebergangs-Offenphase (18.-20.08.) ist beendet — auf
> nicht gelisteten Domains antwortet die Chat-API jetzt mit 403.

Auslieferung des Widgets **und** alle Chat-APIs sind serverseitig auf
autorisierte Domains beschraenkt:

- `https://www.godelmann.de` · `https://godelmann.de`
- `https://www.godelmann.com` · `https://godelmann.com`
- **Salient-Entwicklung:** `https://localhost:8000` ·
  `https://god--ibexa.ddev.site`
- **Salient-Vorschauserver:** `https://<git-branch>-walegqvpxiy74.de-2.platformsh.site`
  — als Muster freigeschaltet (jede Branch-Vorschau des Platformsh-Projekts
  funktioniert automatisch, inkl. `release-stage-…`); keine Einzelmeldung
  je Branch noetig.

Technisch heisst das: Die API-Endpunkte pruefen den `Origin`-Header
(Allowlist am Server) — auf fremden Domains antwortet der Chat mit 403 und
funktioniert nicht. Zusaetzlich initialisiert sich das Widget nur auf
autorisierten Domains (Laufzeit-Pruefung mit kurzem `console.info`-Hinweis
auf fremden Seiten; `localhost`/`127.0.0.1` sind fuer lokale Entwicklung
immer erlaubt).

`chatbot.godelmann.bot` ist dabei ausschliesslich der **Script-/API-Host** —
er ist selbst nie Einbett-Origin und muss nirgends als „Domain" der Website
konfiguriert werden. (`godelmann.de` leitet auf `.com` weiter — beide
bleiben dennoch freigeschaltet, damit auch die Redirect-Quelle sauber ist.)

**Weitere Umgebungen** werden auf Zuruf in die Allowlist aufgenommen:
bitte die exakte(n) Origin(s) nennen (Schema + Host, ohne Pfad), dann wird
die Freigabe eingerichtet und kurz bestaetigt.

**Hinweis Referrer-Policy:** Bitte die Referrer-Policy der einbindenden
Seiten **nicht** auf `no-referrer` stellen — der Browser-Standard
(`strict-origin-when-cross-origin`) genuegt. Auslieferungs-Pruefung und
Seitenkontext (`page-url`) nutzen den Origin-Anteil des Referers.

## Consent-Verwaltung (Usercentrics)

godelmann.de nutzt Usercentrics mit **Smart Data Protector** (Auto-Blocking).
Damit der Berater nicht faelschlich vor der Cookie-Einwilligung geblockt wird:

- Die Script-Snippets dieser Doku tragen **`data-uc-allowed="true"`** — das
  offizielle Usercentrics-Attribut, das das Auto-Blocking fuer dieses Script
  ausnimmt. Ohne Usercentrics ist das Attribut wirkungslos (schadet nie).
- Bitte den Berater in der Consent-Verwaltung **nicht als einwilligungspflichtigen
  Dienst** markieren — sonst erscheint er erst nach Cookie-Einwilligung und waere
  fuer die grosse Mehrheit der Besucher unsichtbar. Der Chat laeuft anonym auf
  Godelmann-Infrastruktur (Details im Datenschutz-Abschnitt); die finale
  Einstufung stimmen Agentur und Godelmann ab.

## Attribute

Alle Attribute sind optional und **reaktiv** (Aenderung zur Laufzeit wirkt sofort).

| Attribut | Werte | Default | Beschreibung |
|---|---|---|---|
| `lang` | `de`, `en`, `cs` | `de` | Einstiegssprache der UI-Texte (Titel, Buttons, Fehlermeldungen, Begruessung). Regionale Zusaetze werden abgeschnitten (`de-DE` -> `de`), `cz` gilt als Alias fuer `cs`; unbekannte/nicht freigeschaltete Werte fallen auf `de` zurueck. Die Sprachwahl des Besuchers im Chat hat Vorrang. |
| `position` | `bottom-right`, `bottom-left` | `bottom-right` | Ecke, in der Bubble und Panel verankert sind (nur `mode="floating"`). |
| `api-base` | URL-Origin | Origin der Script-URL | Basis-URL des Chatbot-Backends (`{api-base}/api/chat`, `{api-base}/altcha/challenge`). Nur setzen, wenn Widget-Script und API auf verschiedenen Hosts liegen. |
| `greeting` | Freitext | Deutsche Standard-Begruessung | Eigene erste Assistenten-Nachricht beim Oeffnen des Panels. |
| `mode` | `floating`, `drawer`, `page` | `floating` | Darstellungsform (s. o.). Unbekannte Werte fallen auf `floating` zurueck. |
| `launcher` | `bubble`, `none` | `bubble` | `none` blendet die eigene Bubble aus; der Ausloeser ist dann Host-Markup mit `data-gdm-chat-launcher` (das Widget verdrahtet es automatisch, s. u.). |
| `page-url` | Pfad/URL | `/chat` | Seit 0.0.20 ohne Funktion (kein Vollbild-Knopf mehr); wird weiter akzeptiert. |

**Mehrsprachigkeit — `lang` je Seitensprache setzen:** godelmann.de ist
zweisprachig (deutsche Seiten + `/en/...`). Das `lang`-Attribut bitte im
Template dynamisch aus der Seitensprache befuellen — deutsche Seiten
`lang="de"`, englische Seiten `lang="en"` —, damit der Berater in der Sprache
der Seite startet. Der Besucher kann die Chat-Sprache danach jederzeit selbst
umstellen (freigeschaltet: Deutsch, Englisch, Tschechisch).

## CSS-Custom-Properties (Theming)

Das Widget ist per Shadow DOM CSS-isoliert; Theming laeuft ausschliesslich
ueber diese dokumentierten Custom Properties (z. B. am Element oder auf `:root`):

| Property | Default | Beschreibung |
|---|---|---|
| `--gdm-chat-accent` | `#3F4549` (Anthrazit, seit 0.0.13) | Akzentfarbe: Bubble, Header, Nutzer-Nachrichten, Senden-Button, Links. |
| `--gdm-chat-accent-hover` | `#2E3336` | Hover-/Aktiv-Ton der Akzentfarbe (Buttons, Launcher). |
| `--gdm-chat-z-index` | `2147483000` | Stapelreihenfolge von Bubble und Panel. |
| `--gdm-chat-font` | `inherit` (Seiten-Font) | Schriftfamilie des Widgets. |
| `--gdm-chat-drawer-width` | `480px` | Breite des Seiten-Drawers (`mode="drawer"`). Muss mit der Breite in der Drawer-Support-CSS-Regel uebereinstimmen (s. u.). |

```css
godelmann-chatbot {
  --gdm-chat-accent: #3F4549;        /* Beispiel = Default; anpassbar */
  --gdm-chat-accent-hover: #2E3336;
  --gdm-chat-z-index: 99999;
  --gdm-chat-font: "FF Meta Pro", sans-serif;
  --gdm-chat-drawer-width: 480px;
}
```

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
<https://www.godelmann.de/de/datenschutz> unterhalb der Eingabezeile (en: `/en/data-protection`),
darueber der Hinweis „KI-Berater – Angaben ohne Gewaehr …“ mit Link auf das Kontaktformular
(`/de/unternehmen/kontakt`, en `/en/company/contact-us`; cs nutzt die englischen Ziele).

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
| **Technik / Betrieb** | Dietmar Scharf (Godelmann-Chatbot-Betrieb) |
| **Kontakt** | ueber Godelmann / Frau Sturm |
