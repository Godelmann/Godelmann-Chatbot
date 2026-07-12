# CHATBOT-P3-02: index.html: lang="de" + Brand-Titel

| | |
|---|---|
| **Projekt** | CHATBOT |
| **Schweregrad** | P3 |
| **Bereich** | HTML / Branding |
| **Entdeckt** | 2026-07-02 (Multi-Agent-Audit) |
| **Status** | RESOLVED (2026-07-12 · 0.0.1: `index.html` mit `lang="de"` + Titel „GODELMANN Chatbot — Widget-Preview") |

## Symptom
Das ausgelieferte HTML-Dokument des GODELMANN-Chatbot-Widgets deklariert die Dokumentsprache als Englisch (`<html lang="en">`) und traegt den technischen Platzhalter-Titel `godelmann-chatbot` statt eines echten deutschen Brand-Titels.

## Root Cause
Das Projekt wurde aus einem generischen Template/Scaffold uebernommen, bei dem `lang` und `<title>` nicht auf die Zielsprache und das Branding angepasst wurden. Es handelt sich um ein deutsches Widget fuer GODELMANN, die Vorgaben aus dem Scaffold sind unveraendert geblieben.

## Beleg
`index.html`:
- Zeile 2: `<html lang="en">`
- Zeile 7: `<title>godelmann-chatbot</title>`

Verifiziert am 2026-07-02 via `grep -n 'lang=\|<title>' /projects/platform-control/frontends/godelmann-chatbot/index.html`.

## Auswirkung
- Kosmetisch/SEO/A11y: Screenreader und Browser interpretieren die Seite als englischsprachig; deutsche Aussprache/Silbentrennung und `lang`-basierte Uebersetzungshinweise sind falsch.
- Der Platzhalter-Titel `godelmann-chatbot` erscheint als Tab-/Fenstertitel und in Bookmarks/Verlauf statt eines praesentablen Brand-Namens.
- Rein Frontend, betrifft alle Stages (Test/Prod) gleichermassen. Kein Sicherheits- oder Funktionsrisiko (P3).

## Reproduktion
1. `index.html` im Repo oeffnen bzw. das ausgelieferte Widget im Browser laden.
2. `<html lang="en">` und `<title>godelmann-chatbot</title>` beobachten.

## Fix-Vorschlag
In `/projects/platform-control/frontends/godelmann-chatbot/index.html`:
- Zeile 2: `lang="en"` -> `lang="de"`.
- Zeile 7: `<title>godelmann-chatbot</title>` -> deutschen Brand-Titel setzen (z. B. `<title>GODELMANN Chatbot</title>`; finalen Wortlaut mit Godelmann/Branding abstimmen, GODELMANN in Caps schreiben).

Kein Backend/DB-Aenderung, kein Migrationsbedarf. Nach dem Edit normaler Frontend-Build + Deploy des Widgets.

## Referenzen
- [docs/BACKLOG.md](BACKLOG.md)
- `index.html` (Zeilen 2, 7)
