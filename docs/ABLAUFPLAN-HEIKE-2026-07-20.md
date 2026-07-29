# Chatbot-Ablaufplan (Heike Sturm, GODELMANN)

> Quelle: E-Mail Heike Sturm an Dietmar Scharf, Mo. 20.07.2026 16:06 ("WG: Ablauf ChatBot").
> Zugehoeriges Lastenheft (Maerz): `~/Downloads/Lastenheft ChatBot fuer die Website.docx`.
> **Dies ist die SSoT fuer die Zielgruppen-Weiche + Guided Selling** (Widget-Conversation-Flow,
> vorgeschaltet vor dem KI-Modell). Ist-Stand-Mapping der Anforderungen: `GoCreate` Webchat-Seite
> (`REQUIREMENTS`) + `docs/EINBINDUNG.md`.

## 1. Begruessung (immer zuerst, VOR dem KI-Modell)

Bot:
> Willkommen bei GODELMANN. Sind Sie Fachkunde oder Endkunde?

Buttons: **Fachkunde** · **Endkunde**
Alternativ Freitext moeglich; der Bot erkennt die Zielgruppe automatisch und ordnet zu. Beispiele:
- „Ich suche Ideen fuer meine Terrasse." → Endkunde
- „Ich bin Landschaftsarchitekt." → Fachkunde
- „Ich brauche ein Datenblatt." → Fachkunde
- „Wer ist mein Ansprechpartner?" → (Ansprechpartner-Findung)

## 2. Endkunde

Bot:
> Schoen, dass Sie da sind. Wobei koennen wir Sie unterstuetzen?

Buttons: Produkte entdecken · Inspirationen fuer Garten & Terrasse · Gartenbuch herunterladen ·
Neuheiten herunterladen · Ideengarten besuchen · Haendlersuche · Service-Hotline kontaktieren.
Freitext moeglich (z. B. „Ich moechte meine Terrasse neu gestalten.", „Welcher Belag eignet sich
fuer eine Einfahrt?", „Wo finde ich einen Haendler in meiner Naehe?").

**Empfehlung bei unklarer Anfrage** (keine konkrete Frage):
> Fuer die Planung Ihres Aussenbereichs empfehlen wir unsere Inspirationen, das aktuelle Gartenbuch
> und den Besuch eines Ideengartens in Ihrer Naehe.
Direkte Links: Inspirationen · Gartenbuch · Ideengaerten · Haendlersuche.

**Intelligente Endkunden-Logik** — Begriffe `Terrasse, Garten, Einfahrt, Gestaltung, Ideen, Hausbau,
Aussenanlage` → bevorzugt anzeigen: Inspirationen · passende Produkte · Gartenbuch · Ideengaerten ·
Haendlersuche.

## 3. Fachkunde

Bot:
> Willkommen im Fachkundenbereich. Wobei koennen wir Sie unterstuetzen?

Buttons: Produkte · Themen zur Objektplanung · Mediathek · Referenzen · Ansprechpartner finden.
Freitext moeglich (z. B. „Ich benoetige Ausschreibungstexte.", „Gibt es BIM-Daten?", „Ich suche
Referenzen fuer oeffentliche Plaetze.").

**Ansprechpartner-Findung** (per PLZ):
> Bitte geben Sie Ihre Postleitzahl ein.  → Nutzer: 90402 →
> Ihr zustaendiger Ansprechpartner ist: Max Mustermann, Telefon: XXX, E-Mail: XXX
Zusatzoptionen: Ansprechpartner kontaktieren · Termin vereinbaren · E-Mail schreiben.

**Intelligente Fachkunden-Logik** — Begriffe `Ausschreibung, LV, BIM, CAD, DWG, Architekt, Planer,
Objekt, Projekt, Ingenieur` → bevorzugt: Objektplanung · Mediathek · Referenzen · Downloads ·
zustaendiger Ansprechpartner / Aussendienst.

## Sonderfall: Produktsuche (zielgruppen-unabhaengig)

Nutzer: „Ich suche Pflaster fuer eine Einfahrt." → Bot:
Produktvorschlaege anzeigen · Technische Informationen bereitstellen · Referenzprojekte verlinken ·
Ansprechpartner oder Haendler anbieten.

## Umsetzungs-Hinweise (Technik)

- Die Weiche + Button-Menues laufen **im Widget** (Custom Element, vor/neben dem KI-Chat) — NICHT im
  KI-Modell. Freitext-Klassifikation (Zielgruppe/Intent) kann per Schluesselwort-Match (obige Listen)
  ODER per KI-Klassifikator laufen.
- PLZ-Ansprechpartner braucht die Vertriebs-Adressliste (PLZ → Ansprechpartner) — folgt von GODELMANN.
- Button-Ziele (Inspirationen/Gartenbuch/Ideengaerten/Haendlersuche/Mediathek/Referenzen/Objektplanung)
  = godelmann.de-Links; als konfigurierbare Tabelle im Widget/Backend hinterlegen.
