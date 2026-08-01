# DEPLOYMENT.md — Godelmann-Chatbot

> **XODER-Dokument für den Deploy-/Release-Flow dieses Repos.** Alles läuft über Skripte auf
> `control.cockpit.plus` (`/projects/platform-control`) — nie von Hand kopieren.
>
> **Stand: 2026-08-01.** Landkarte der Maschinen: `Godelmann/.xoder/docs/STAGES.md`.

## 1. Frontend und Backend — zwei Teile, zwei Skripte

| Teil | Was | Skript | Name im Skript |
|---|---|---|---|
| **Frontend** — das Widget (dieses Repo) | `dist/chatbot-widget.v1.js` + `version.json` | `deploy-godelmann.sh` | **`chatbot`** |
| **Backend** — der Dienst (liegt im Repo `spass`) | `godelmann-chatbot-server` (Rust, :3011) | `deploy-spass.sh` | **`godelmann-chatbot`** |

> Die Namen sind **nicht** identisch: `chatbot` fuers Frontend, `godelmann-chatbot` fuers Backend.
> Wer den falschen nimmt, bekommt eine Fehlermeldung — schlimmer wäre stilles Nichtstun.

## 2. Frontend ausliefern

```sh
# auf control, /projects/platform-control
./scripts/deploy-godelmann.sh chatbot              # test
./scripts/deploy-godelmann.sh chatbot --prod       # Produktion (nur mit Freigabe)
./scripts/deploy-godelmann.sh chatbot --prod --dry-run
```

Ziel: `/opt/godelmann-chatbot/dist/` auf `platform-test` bzw. `godelmann-prod`, danach
Neustart von `godelmann-chatbot.service`.

Das Skript ist **kein** dünner Wrapper um `rsync` — es fängt drei Fehler ab, die am
01.08.2026 tatsächlich passiert sind:

1. **Veralteter Checkout** → Abbruch statt Auslieferung einer älteren Fassung. Genau hier
   fiel das Widget schon einmal von 0.0.7 auf 0.0.2 zurück.
2. **Kein blindes `--delete`** für Widgets → die serverseitige `index.html` bleibt liegen.
   Ihr versehentliches Löschen hatte den öffentlichen Chat für rund eine Minute auf 404
   gesetzt.
3. **Abnahme** nach jedem Lauf: HTTP-Status **und ausgelieferte Fassung**. Die Byte-Zahl
   allein hatte Fehler 1 gerade verdeckt.

## 3. Fassung prüfen

Jeder Build erzeugt `version.json` neben dem Bundle; zusätzlich trägt das Custom Element die
Fassung als `data-version`.

```sh
curl -s https://chatbot-test.godelmann.net/version.json
curl -s https://chatbot.godelmann.net/version.json
```

Die Fassungsnummer zählt beim Bauen selbst hoch (`package.json`). Ein Deploy ohne
Fassungssprung ist möglich (`--skip-build`), sollte aber die Ausnahme bleiben.

## 4. Reihenfolge bei kombinierten Änderungen

Aendert sich **beides**, zuerst das **Backend**, dann das **Frontend**: Ein neues Frontend,
das eine noch nicht vorhandene Schnittstelle aufruft, bricht sofort sichtbar; ein neues
Backend mit altem Frontend ist in aller Regel abwaertskompatibel.

```sh
./scripts/deploy-spass.sh godelmann-chatbot [--prod]     # 1. Backend
./scripts/deploy-godelmann.sh chatbot [--prod]           # 2. Frontend
```

## 5. Freigaben

- **test:** stehendes Go, keine Rückfrage nötig.
- **Produktion:** nur mit ausdrücklicher Freigabe. Der Chatbot ist auf godelmann.de
  öffentlich sichtbar — ein Fehler dort ist sofort für Kunden sichtbar.

## Verwandt

- Regelwerk beider KI-Berater: `Godelmann/.xoder/docs/WEBCHAT.md`
- Maschinen, Ports, Domains, Fassungen: `Godelmann/.xoder/docs/STAGES.md`
- Deploy-SSoT der Flotte: `Ramteid-GmbH/platform-control/.xoder/DEPLOYMENT.md`
