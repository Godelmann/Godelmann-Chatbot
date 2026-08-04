# INTERFACES — Godelmann-Chatbot (ausgehende Schnittstellen)

Verzeichnis aller Stellen, an denen Daten aus dem Berater hinausgehen — **beide Seiten**: das Widget
im Browser des Besuchers und der Dienst dahinter.

> **Stand: 2026-08-04** — Widget-Quelltext, Server-Quelltext (`spass/examples/godelmann-chatbot-server`),
> Produktiv-Konfiguration und die Modell-Weiterleitung im DGX-Gateway erhoben.

## ⚠️ Zuerst die eine Sache, die man wissen muss

**Die Chat-Eingaben der Besucher verlassen die eigene Infrastruktur.** Das Produktivmodell ist
`gpt-5.6` (`/opt/godelmann-chatbot/.env`), und das DGX-Gateway leitet es weiter als
`openrouter/openai/gpt-5.6-sol` (`dgx-llm-stack/litellm/config.yaml:435-438`) — also **über
OpenRouter an OpenAI**.

Das ist kein Fehler, sondern eine Modellwahl. Aber es ist der Unterschied zwischen „läuft auf
unserer Hardware" und „geht an einen US-Anbieter", und er ist an keiner Stelle im Widget oder in der
Anwendung sichtbar — er steht in einer Router-Konfiguration zwei Ebenen tiefer. Wer nur dieses Repo
liest, sieht ihn nicht.

Zum Vergleich: Das DGX-Portfolio führt ausdrücklich **force-local**-Modelle
(`godelmann-gocreate-private`, `*-local`: „kein Cloud-Egress by design",
`dgx-llm-stack/.xoder/NETWORK.md:73`). Für den öffentlichen Berater ist bewusst ein anderes gewählt.

## 1. Widget (Browser des Besuchers)

Das Widget spricht **ausschließlich relative Pfade** an. Aufgelöst werden sie gegen die Herkunft des
Skripts selbst (`new URL(import.meta.url).origin`, `chatbot-widget.ts:75`) — also gegen
`chatbot[-test].godelmann.net`, **nicht** gegen die einbettende Seite.

| Pfad | Zweck | Nutzlast |
|---|---|---|
| `POST /api/chat` | die eigentliche Frage | `message`, `lang`, `conversation_id`, `altcha`, `hp_website` (Honigtopf, immer leer) |
| `GET /api/webchat-config` | Anzeigekonfiguration | — |
| `GET /altcha/challenge` | Rechenaufgabe gegen Automaten | — |
| `POST /api/contact` | Kontakt-/Anfrageformular | die eingegebenen Kontaktdaten |
| `POST /api/qs/transcript` | Qualitätssicherung: Gesprächsverlauf | `sitzung_id`, `locale`, **alle Nachrichten** inkl. Sprache und Vorschlägen |
| `POST /api/qs/feedback` | Daumen hoch/runter | Bewertung zur Nachricht |

**Im Browser gespeichert:** der Gesprächsfaden im **`sessionStorage`** — bewusst nicht
`localStorage`, damit er mit dem Tab endet (`chatbot-widget.ts:18-26`). Zusätzlich eine
Gesprächskennung im `localStorage`, die das Gespräch über einen Seitenwechsel hinweg fortsetzt.

## 2. Dienst (`godelmann-chatbot-server`)

| Empfänger | Zweck | Ort |
|---|---|---|
| **`dgx.spass.fun`** → DGX-Gateway → **OpenRouter → OpenAI** | die KI-Antwort (`CHATBOT_MODEL=gpt-5.6`) | Gateway: Hetzner **DE**; Modell: **USA** |
| **`gocreate.godelmann.net`** (Supabase) | Ablage der QS-Gesprächsverläufe und Kontaktanfragen (`CONTACT_SUPABASE_URL`) | Hetzner, **DE** |
| `www.godelmann.de` | Produktdaten/Verweise für Antworten | Hetzner/Fastly |

**Keine weiteren Dritten.** Die Konfiguration führt genau: `CHATBOT_MODEL`, `ALTCHA_HMAC_SECRET`,
`CONTACT_SUPABASE_*`, `GODELMANN_*_BEARER`, `CHATBOT_AILOGS_DB`, `STAGE` — kein Analyse-Werkzeug,
kein Tag Manager, kein externer Captcha-Dienst.

## 3. Zwei Dinge, die **nicht** hinausgehen

- **Die Herkunftsbestimmung läuft örtlich.** `spass-geoip` liest eine **lokale MaxMind-Datei**
  (`Reader::open_readfile`, `spass-geoip/src/lib.rs:84`) und leitet daraus nur das **Land** ab
  (`lookup_country`). Es wird **kein** Geo-Dienst befragt — die IP-Adresse des Besuchers verlässt
  den Server dafür nicht.
- **Der Automaten-Schutz ist selbst gehostet.** ALTCHA rechnet im Browser gegen eine Aufgabe, die
  der eigene Server stellt und mit `ALTCHA_HMAC_SECRET` prüft. Kein reCAPTCHA, kein hCaptcha, keine
  Übermittlung an einen Captcha-Anbieter.

## 4. Wo das Widget läuft — und warum das zählt

Es wird in **fremde** Seiten eingebettet (`godelmann.de` bzw. der Spiegel `test.godelmann.net`).
Für die einbettende Seite ist der Berater damit ein **zusätzlicher Empfänger**, den ihre eigene
Datenschutzerklärung kennen muss. Erfasst ist das in `Godelmann-Proxy/.xoder/PRIVACY.md` §3.2.

Die Herkunft ist bewusst getrennt: Das Skript kommt von `chatbot[-test].godelmann.net`, und der
Spiegel ergänzt dafür die Inhaltsrichtlinie der Zielseite additiv (`amend_csp`) — die Schutz-Header
der echten Seite bleiben erhalten.

## 5. Offen

- [ ] **`[PRUEFEN]` Auftragsverarbeitung OpenRouter/OpenAI.** Wenn Besuchereingaben dorthin gehen,
      braucht es die vertragliche Grundlage und einen Eintrag in der Datenschutzerklärung der
      **einbettenden** Seite. Alternative: auf ein force-local-Modell wechseln — dann entfällt die
      Frage technisch.
- [ ] **`[PRUEFEN]` Aufbewahrung der QS-Gesprächsverläufe.** Sie enthalten die vollständigen
      Besucher-Eingaben. Löschfristen sind von hier aus nicht belegt.
- [ ] **KI-Kennzeichnung nach EU-AI-Act** — Frist für Chatbots **02.12.2026**
      (`Godelmann/.xoder/docs/AI-ACT.md`).

## 6. Wiederholen

```sh
grep -n "import.meta.url" src/chatbot-widget.ts                       # Host-Aufloesung
ssh godelmann-prod 'grep -E "^CHATBOT_MODEL=" /opt/godelmann-chatbot/.env'
ssh control 'grep -n -A3 "model_name: <modell>$" /projects/dgx-llm-stack/litellm/config.yaml'
```

Referenz: [`NETWORK.md`](NETWORK.md) · `Godelmann/.xoder/docs/WEBCHAT.md` (Regelwerk) ·
`Godelmann-Proxy/.xoder/PRIVACY.md` (Sicht der einbettenden Seite) ·
`Godelmann/.xoder/docs/AI-ACT.md`.
