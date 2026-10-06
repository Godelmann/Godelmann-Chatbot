# Godelmann-Chatbot — BACKLOG

> Stand: 2026-10-06 (Paket-Version **0.0.29 — nur im Repo, NICHT ausgerollt**: QS-Ereignisse an `POST /api/qs/event`, s. Release 0.0.29; ausgerollt bleibt **0.0.28 test + PROD** seit 02.10. 11:26 Uhr mit Vollsicherung, Go Dietmar — Postleitzahl im Freitext, Zwischenstatus, Drawer-Hoehe 100dvh, Overlay `dim`; Server spass `5b874a7` test + PROD: keine Preise, Ablehnungstext, lokalisierte Quellen; prod `CHATBOT_RATE_MAX=60`, `EVAL_READ_TOKEN` gesetzt, Origin-Gate auch auf chatbot.godelmann.net; Livegang www.godelmann.de durch Salient: von uns freigegeben 02.10.)

## Release 0.0.29 (2026-10-06) — QS-Ereignisse an `POST /api/qs/event` (nur Code, nicht ausgerollt)

- **Neu:** Das Widget meldet drei Ereignisse an `POST /api/qs/event` (Server-Endpunkt wird parallel gebaut,
  ist noch NICHT ausgerollt — bis dahin laufen die Requests ins Leere und werden still geschluckt).
  Wire-Format: `{ sitzung_id, locale, hp_website, ereignisse: [{ typ, wert, ts_client }] }`, ein Ereignis je
  Request, `wert` auf 300 Zeichen gekappt, kein Ereignis vor der Zustimmung (`this.consent`).
  - `zielgruppe_erkannt` (`fachkunde`|`endkunde`): nur bei Erkennung aus dem Freitext, einmal je Sitzung;
    der Knopf-Klick bleibt wie bisher eine user-Nachricht der Art `zielgruppe`.
  - `menue_klick` (Knopf-Label): in `runQuickAction`.
  - `link_klick`: ein delegierter Klick-Listener im Shadow-Root auf `a[href]` in `.msg.assistant`; Wert =
    Origin + Pfad ohne Query-String und ohne Fragment, nur http/https (`bereinigeLinkZiel`). Versand sofort
    per `navigator.sendBeacon` (text/plain-Blob), ersatzweise `fetch` mit `keepalive`; Navigation unveraendert.
- **Gates:** `npm run build` (tsc + Vite) und `npm run lint` gruen; es gibt keine Testsuite im Repo.
- **Offen:** Ausrollen erst zusammen mit dem Server-Endpunkt; Browser-Abnahme (Playwright) steht aus.
  Mittel-/Rechtsklick auf Links („in neuem Tab oeffnen") wird nicht erfasst (nur `click`).

## Betrieb 02.10.2026 (Abschluss) — Server + Widget 0.0.28 auf PROD, Betriebspunkte erledigt

- **PROD 11:26 Uhr:** Widget 0.0.28 (`ca6d1c8`) und Chat-Server spass `5b874a7` (Vollsicherungen `backups/20261002-092637`
  und `-092647`). Regression auf godelmann-prod **2/2 gruen**; auf test mit der Endfassung **4/4 gruen**.
- **Im Browser auf der Salient-Vorschau (prod-Widget):** Preisfrage ohne Betrag, mit Angebot „Postleitzahl in den Chat";
  Postleitzahl → Innendienst; „2026" geht ans Modell (nicht an die PLZ-Suche); Manipulationsversuch → „Dabei kann ich
  Ihnen nicht helfen …"; Zwischenstatus nach 5 s / 14 s sichtbar; Englisch mit „Sources:".
- **Protokoll:** `webchat_messages.modell` wird jetzt gefuellt (Caddy `.bot`: `x-model-used` in Expose-Headers);
  abgewiesene Eingaben stehen als `blocked` in `ai_logs.db`.
- **Caddy prod (Sicherung `/etc/caddy/Caddyfile.bak-20261002`):** `chatbot.godelmann.net` hat jetzt dasselbe
  `@apifremd`-Gate wie `.bot` (fremder Origin → 403; erlaubt godelmann.de/.com/.net/.bot + Salient-Vorschau, ohne Origin
  frei). Reload nur per `caddy reload --config … --adapter caddyfile` (die Unit hat kein ExecReload).
- **`EVAL_READ_TOKEN`** auf prod gesetzt (Wert nur auf dem Server: `grep ^EVAL_READ_TOKEN /opt/godelmann-chatbot/.env`).
- **Tempo:** Antworten ~900 Zeichen, Zwischenstatus. Eine Suchrunden-Begrenzung wurde getestet und **zurueckgenommen**
  (Regression „Mehrsteinsysteme mit Versickerung" ohne KLIMASTEIN in 2 von 6 Laeufen). Messung: ~8 s je Suchrunde;
  prod nach der Aenderung 10–30 s. Offen: fliessende Ausgabe bis zum Besucher (1–2 Tage), Modellvergleich auf Tempo.
- **Offen fuer 0.0.29:** Zwischenstatus fuer Screenreader (`role=status`), ESC am Dokument + Scroll-Sperre bei `dim`,
  Sprachwechsel mitten im Gespraech, `calc(100dvh - 120px)` im schwebenden Modus, Fehler-Protokollzeile mit
  Fallback-Fehler, Stream-Zweig bei `content_blocked` angleichen.

## Release 0.0.28 (2026-10-02) — Postleitzahl im Freitext fuehrt zum Ansprechpartner (alle Zielgruppen)

- `submitInput`: eine nackte 4-/5-stellige Postleitzahl (optional mit Land-Praefix) loest die deterministische
  Ansprechpartner-Suche (`/api/contact`) aus — bisher nur nach dem Fachkunden-Knopf „Ansprechpartner finden".
  Nur wenn die letzte Antwort des Beraters die Postleitzahl angeboten hat (sonst wuerde jede vierstellige Zahl
  wie „2026" oder ein Verlegemuster „1613" abgefangen — Befund der Gegenprobe).
- Anlass (Livegang-Test 02.10.): der Berater verwies Privatkunden auf eben diese Schaltflaeche, die sie nicht
  sehen. Server-Prompt gleichzeitig umgestellt (spass): „Postleitzahl in den Chat schreiben", **keine Preise**
  mehr nennen (Entscheidung Dietmar 02.10.: bei GODELMANN nie Preise, stattdessen Kontakt zum Vertrieb anbieten —
  im Unterschied zum Gravelli-Shop), klare Ablehnung statt „gleich noch einmal" bei abgewiesener Eingabe,
  Quellen-Ueberschrift je Sprache.
- **Zwischenstatus in der wartenden Blase** (nach 4 s „Ich suche in den Produktunterlagen …", nach 13 s „Ich stelle die
  Antwort zusammen …", de/en/cs; rein clientseitig). Messung 02.10.: jede Suchrunde ~8 s, Produktfragen 24–36 s; der
  Server kuerzt gleichzeitig die Antworten (~900 Zeichen); eine Suchrunden-Begrenzung wurde nach der Regression wieder zurueckgenommen.

## Release 0.0.27 (2026-10-02) — Drawer-Hoehe folgt der sichtbaren Hoehe (iPhone)

- `.root.mode-drawer .panel`: `height: 100dvh` (Rueckfall `100vh`). Die Drawer-Regel schlaegt die
  Kompakt-Media-Query per Spezifitaet; mit `100vh` konnte die Eingabezeile auf iOS Safari unter der
  Browserleiste liegen. Befund der Gegenprobe vor dem Livegang (aus dem Code abgeleitet, vorsorglich
  behoben — Entscheidung Dietmar 02.10.). Besteht seit dem Drawer-Modus, nicht neu in 0.0.26.

## Betrieb 02.10.2026 — Livegang-Vorbereitung www.godelmann.de (Salient schaltet, Heike: Variante `dim`)

- **0.0.26 auf PROD 02.10. 09:45 Uhr** (Vollsicherung `backups/20261002-074547`, Dienst danach ein Prozess).
  Regression `verify-ai-channels --channel godelmann` auf godelmann-prod **7/7 gruen**.
- **Salient-Staging laedt bereits den Produktiv-Host** (`chatbot.godelmann.bot`), Tag `mode="drawer"
  launcher="none" overlay="dim"`, Chat-Seiten `mode="page"`. Im Browser gemessen: Abdunkelung sichtbar,
  Seitenbreite unveraendert, deutsche Frage mit Quellen + Kontaktweg beantwortet, `/en/` englisch.
- **Gegenprobe (zweiter Agent), kein Blocker.** Eingearbeitet: (1) die Vollsicherung enthaelt **kein**
  `dist` — Rueckfall-Bundle 0.0.25 neu gebaut und unter `backups/20261002-074547/dist-0.0.25/` abgelegt;
  (2) Chat-Limit je IP 10/10 min war fuer Firmenanschluesse zu eng → prod `CHATBOT_RATE_MAX=60` wie test;
  (3) iOS-Hoehe → 0.0.27.
- **Offen / an Godelmann + Salient gemeldet:** englische Datenschutzseite `/en/data-protection` erwaehnt den
  Chatbot nicht (deutsche schon); Salients CSP laeuft als Report-Only **ohne** `chatbot.godelmann.bot`
  (blockiert nichts, erzeugt Reports — vor einem Scharfschalten aufnehmen).
- **Offen (klein, nach dem Livegang):** keine Scroll-Sperre hinter der Abdunkelung; ESC schliesst nur bei
  Fokus im Panel, kein Fokus-Trap; ein offener Drawer oeffnet sich auf jeder Folgeseite wieder abgedunkelt
  (Zustand je Tab) — mit Godelmann/Salient klaeren, ob gewollt; Caddy-Snapshot `godelmann-prod.Caddyfile`
  im platform-control-Repo ist gegenueber dem Live-Gate veraltet → neu ziehen.

## Betrieb 02.10.2026 (Nachtrag) — 0.0.27 + Limit 60 auf PROD, zweite Gegenprobe

- **0.0.27 auf test + PROD 02.10. 10:01 Uhr** (Vollsicherung `backups/20261002-080138`), beide prod-Hosts und test
  byte-identisch (SHA-256 `8c4c9067…cd7653`, 98 799 Byte). Regression auf godelmann-prod nach dem Neustart erneut **7/7 gruen**.
- **prod `CHATBOT_RATE_MAX=60`** (`.env` Zeile 9, vorher Default 10; Sicherung `.env.bak-20261002`), vom laufenden Prozess geladen.
- **Staging mit 0.0.27 im Browser:** Link „Chat-Berater" (`data-gdm-chat-launcher`) oeffnet/schliesst den Drawer, Abdunkelung
  sichtbar, Panel = Fensterhoehe, Seite nicht geschoben.
- **Rueckfall auf 0.0.25** (nur statische Dateien, kein Neustart, **ohne `--delete`** — der Ordner hat keine `index.html`):
  `ssh godelmann-prod "rsync -a /opt/godelmann-chatbot/backups/20261002-074547/dist-0.0.25/ /opt/godelmann-chatbot/dist/"`;
  Wirkung wegen `max-age=3600` bis zu 1 h verzoegert.
- **Offen aus der zweiten Gegenprobe (kein Blocker):**
  - `chatbot.godelmann.net` hat **kein** `@apifremd`-Gate (fremder Origin: API 200, POST erreicht das Backend); nur `.bot`
    weist Fremde mit 403 ab. Salient laedt `.bot`. → Gate in den `.net`-vhost uebernehmen oder bewusst dokumentieren.
  - **Keine globale Tagesobergrenze / kein Tokenbudget**; Limiter nur im Arbeitsspeicher. Nach dem Livegang das
    `ai_logs`-Volumen taeglich ansehen, mittelfristig globale Obergrenze + Alarm.
  - Schwebender Standardmodus nutzt noch `max-height: calc(100vh - 120px)` (nicht die Salient-Einbindung) → `100dvh` nachziehen.
  - Versions-Watcher meldet `fe=godelmann-chatbot-unknown`; Expose-Header `.net`/`.bot` ungleich; Kommentar in `main.rs` Z. 41–43 veraltet.
  - Sprachwechsel der Website mitten im Gespraech: bisherige Nachrichten bleiben in der alten Sprache, Knoepfe wechseln.
  - Geraetetest iPhone-Safari steht aus (Dietmar, Staging).

## Release 0.0.26 (2026-09-28) — Drawer wahlweise ueber der Seite mit Abdunkelung (Salient, Kai Lochbaum 25.09.)

- Neues Attribut **`overlay="push" | "dim"`** (Default `push` = bisheriges Verhalten, v1-stabil): `dim`
  setzt keinen `margin-right` am `<html>`, legt den Drawer ueber die Seite und blendet eine
  Abdunkel-Flaeche im Shadow DOM ein (`--gdm-chat-backdrop`, Klick schliesst). Nur Desktop-Drawer;
  mobil bleibt das Vollflaechen-Panel, `page`/`floating` unveraendert. Reaktiv (Wechsel bei offenem Chat).
- Anlass: Salient will den Chat wie das Hamburger-Menue ueber die Seite legen und abdimmen; die Optik
  entscheidet GODELMANN. Beide Varianten auf test.godelmann.net vergleichbar: `?chat=dim` / `?chat=push`
  (Godelmann-Proxy merkt sich die Wahl im Browser).
- Doku: EINBINDUNG.md Attribut-Tabelle + Darstellungsformen.

## Betrieb 24.09.2026 — Prod-Vorbereitung godelmann.de-Livegang (Heike: „auf jeden Fall live schalten")

Gemessen 24.09. (kein Release):
- **Prod-Dienst gesund:** `chatbot.godelmann.bot` + `chatbot.godelmann.net` liefern Widget **0.0.24** (07.09.),
  Server-Binary vom 07.09. 19:43 (bis Commit `8de3a03`); Regressionslauf `verify-ai-channels --channel godelmann`
  auf godelmann-prod **7/7 gruen** (inkl. cs + Injection).
- **Origin-Gate prod:** godelmann.de/.com (mit und ohne www) + platform.sh-Suffix bekommen ACAO, fremde Origin 403.
- **Salient-Staging** (`www.release-stage-n72lepa-…platformsh.site`) antwortet wieder 200 (503 vom 06.09. behoben):
  Drawer-Tag auf allen DE-Seiten (`lang="de" mode="drawer" launcher="none" page-url="/de/chat-berater"`,
  `data-uc-allowed`), Vollseite `/de/chat-berater` mit `mode="page"`; Chat im Browser gegen prod-Backend
  gepruegt (Nutzungsbedingungen, Begruessung, Kontaktfrage beantwortet). **EN-Seiten ohne Tag, keine EN-Chatseite.**
  Datenschutzerklaerung auf Staging nennt den Chatbot (6 Treffer), live noch nicht.
- **godelmann.de live:** kein Tag; sendet `Content-Security-Policy-Report-Only` mit `default-src 'self' …`
  OHNE `chatbot.godelmann.bot` — bei Scharfschaltung waere Skript + API blockiert (an Salient gemeldet).
- **ERLEDIGT 24.09. 08:38 (Go Dietmar, Vollsicherung gocreate + godelmann-chatbot):** Migration `20260909120000` auf prod, 6 Innendienst-Kontakte, Server-Deploy, Widget 0.0.25 prod; `/api/contact?plz=92224` → Andreas Werner (Oberpfalz, Code 12). Zuvor: prod-DB ohne Migration `20260909120000`
  (`gebiete`, `webchat_site_settings`), nur 1 Kontakt (GRAVELLI Beratung) statt 8 (5 Innendienst + Zentrale),
  Server ohne `a411263`, Widget 0.0.24 statt 0.0.25 → Chat nennt auf prod die Hauptverwaltung statt des
  Innendienst-Teams. Rollout = Migration + Kontakte + `deploy-spass.sh godelmann-chatbot --prod` +
  `deploy-godelmann.sh chatbot --prod`, nur mit Go.
- Falle bestaetigt: `godelmann-chatbot-server --version` STARTET eine zweite Instanz (Memory) — Streuprozess
  auf prod sofort beendet, Dienst unbeeintraechtigt.
- Offen Godelmann: Servicehotline 0800 4633562 (Webseite nennt sie, Tester bestreitet sie) — der Bot
  uebernimmt sie aus dem Webinhalt.

## Release 0.0.25 (2026-09-09) — Ansprechpartner: Innendienst-Team der Region (Heike/Silvia 08.09., GDM-53)

- Der Server (`/api/contact`) nennt bei Kontaktweg „innendienst" (Standard) statt des Außendienstlers das
  Innendienst-Team der Region (`webchat_contacts.gebiete` = Verkäufercodes, Pflege in GoCreate). Das Widget
  rendert alle gelieferten Kontakte (bis zu 3) untereinander, Überschrift „Ihre Ansprechpartner" bei mehreren,
  neue Zeile „Erreichbar" aus `oeffnungszeiten`; de/en/cs (`contactHeadingPlural`, `contactHours`).
- PLZ-Abfrage und Land-Nachfrage unverändert; `ContactAntwort.kontaktweg` nur informativ.
- Doku: GoCreate `docs/KONTAKTDATEN.md` § Kontaktweg, WEBCHAT.md §7a.

## Betrieb 07.09.2026 — CORS-Freigabe Salient-Vorschau (kein Release)

- Heikes Meldung: Widget auf `https://www.release-stage-n72lepa-…platformsh.site` blockiert (kein
  `Access-Control-Allow-Origin`). Ursache in den Caddy-Freigaben (godelmann-prod, platform-test): das
  platform.sh-Muster erlaubte keine Unter-Labels (`www.`). Alle drei Hosts erweitert, `.net`/`-test` von
  Mehrfach-Wert-Matcher auf `header_regexp` umgestellt, Backups `Caddyfile.bak-20260907-*`.
  Details `docs/EINBINDUNG.md` §Autorisierte Domains. Widget-seitig (Suffix-Pruefung) war nichts noetig.

## Release 0.0.23 (2026-09-07) — Re-Test-Sweep

- **Echte Umlaute auch in den versteckten Chip-Prompts** (`ask:`-Felder, 14 Zeilen) und im
  Vergleichs-Prompt („übersichtlich", „Oberfläche/Farbe"): die Texte gehen ans Modell, das die
  Ersatzschreibweise sonst als Tabellenkopf echot (Befund Re-Test-Sweep 07.09.). Sichtbare Texte
  waren seit 0.0.22 sauber.
- Datenpflege ohne Release: Chip „Objektplanung" (`webchat_links`, test + prod) zeigte auf
  `/de/objektplanung` (404) — jetzt `/de/objektplanung/ausschreibung-planung/technische-hinweise`.

## Release 0.0.22 (2026-09-06) — SI-Lauf QS-Feedback

- **Produktvergleich: der Besucher waehlt die Produkte selbst** (QS-Feedback a483285d, 18.08.:
  „die beiden Produkte selbst eingeben koennen"): der Chip „Produkte vergleichen" (de/en/cs, Endkunde
  + Fachkunde) sendet keine Modellanfrage mehr, sondern eine kuratierte Nachfrage nach den zwei
  Produktnamen und dem Einsatzbereich plus drei Beispielpaare als Chips (`VERGLEICH_PAARE`:
  GDM.MOLINA stone vs. GDM.VIA stone, GDM.LIVA vs. GDM.MASSIMO, GDM.DRAIN vs. GDM.KLIMASTEIN).
  Ein Klick oder Freitext loest den Vergleich mit den genannten Produkten aus (`vergleichsAnfrage`).
  Englisch hatte den Chip bisher gar nicht — ergaenzt.
- **Link-Ziele in GoCreate (`webchat_links`) korrigiert/ergaenzt, test + prod:** Haendlersuche
  → `/de/fachhaendler` (war `/de/services-tools`), Mediathek → `/de/services-tools/tools/mediathek`,
  Inspirationen → `/de/referenzen` (altes Ziel `/de/objektplanung/themen-loesungen` = 404), neu
  Neuheiten → `/de/produkte/aktionen-highlights/aktionen/unsere-produkt-neuheiten`, Ideengarten →
  `/de/ideen-gaerten`; prod hatte gar keine Zeilen (Chips liefen alle ins Modell). URLs per HTTP
  gegen godelmann.de verifiziert.
- Server-Seite (spass `godelmann-chatbot-server`): Prompt-Regeln KONTAKTWEG (Beratung immer mit
  Telefon +49 9438 9404-0, Zeiten, Ideen-Gaerten-Link, Fachhaendler-Suche), PRODUKTAUSWAHL (alle
  passenden Familien nennen, z. B. GDM.KLIMASTEIN bei Versickerung), EINBAU (Fachbetrieb +
  technische Beratung), UNTERLAGEN (Verlegemuster/Versickerungsgutachten in der Mediathek).
  Belege und Abnahme: `GoCreate/docs/SI-LOG.md` (Lauf 06.09.).

## Release 0.0.21 (2026-09-06)

- **Ansprechpartner aus der NAV-Liste mit Land:** `GET /api/contact?plz=&land=` loest ueber
  GoCreate (`webchat_kontakt_lookup`) auf; liegt die PLZ in mehreren Laendern (1010 = Wien und
  Lausanne) und kein Land ist bekannt, fragt der Bot per Chips nach (Laendernamen in Chat-Sprache),
  die Wahl loest die Suche mit Land erneut aus; Eingaben wie `AT-1010` zerlegt der Server. Antwort:
  Name, „Vertrieb, Werk <Werk>", Region (Ort), Telefon, E-Mail. Neuer Text `contactCountryPrompt`
  (de/en/cs), Sitzungsfeld `pendingPlz`. Sichtpruefung test.godelmann.net: 1010 → Oesterreich →
  Ralf Sandner, Werk Maitenbeth.

## Release 0.0.20 (2026-09-06)

- **Layout = Gravelli-Chat (CR-26, Sabrina Ansicht 2/3), Godelmann-Farbschema:** Kopfzeile 56 px
  grau `#E5E5E5` mit Avatar, Titel „Ihr KI-Berater" (en „Your AI Advisor", cs „Váš AI poradce"),
  nur Reset (↺) + Schliessen (X) — Vollbild/Verkleinern entfallen (Entscheid Dietmar 06.09.);
  `page-url` bleibt als v1-Attribut akzeptiert, ohne Funktion. Akzent = Website-Rot Red 100
  `#E54F35` (Hover `#B33E29`), Text schwarz.
- **Avatar** = ein SVG (40x40): weisser Kreis, grauer Ring, Godelmann-G als Glyph per Transform auf
  die exakte Pfad-Bbox gesetzt (19 px hoch, Ecken der Glyph-Box auf konzentrischem Kreis, radialer
  Abstand rundum 7 px) — in Kopfzeile, an jeder Berater-Blase und an der Zustimmungskarte.
- **Blasen mit Spitze:** Berater weiss mit Rand `#E5E5E5`, Radius 8, Spitze oben links (12x11,
  nach der Blase gerendert); Begruessung rot gefuellt; Nutzer grau `#E5E5E5` mit Spitze unten rechts;
  Innenabstand 12/20, Avatar→Blase 8 px, Tipp-Indikator = drei pulsierende Punkte.
- **Feedback-Leiste** icon-only grau `#656A6D` links unter der Blase (Hover/aktiv rot); Weltkugel
  statt Flagge (Gravelli-Muster); Kommentar + Gehirn weiter test-only. Menues eckig.
- **Chips** eckig (Radius 4), schwarzer Rand, 14 px, linksbuendig an der Blasenkante.
- **Zustimmungskarte „Nutzungsbedingungen"** (Texte 1:1 Gravelli, de/en/cs) vor dem ersten
  Kontakt: bis „Chat starten" verlaesst KEINE Anfrage das Widget (keine Begruessung, kein ALTCHA,
  kein webchat-config, kein QS); „Abbrechen" schliesst (Vollseite: zurueck); Zustimmung liegt in der
  sessionStorage-Sitzung (`consent`) und ueberlebt „Neue Unterhaltung"; neues Ereignis
  `gdm-chat:consented`.
- **Eingabe:** Feld grau 52 px / 16 px Schrift, Papierflieger rot IM Feld (24 px, Strich 1,5,
  14 px vom rechten Rand); darunter ZWEI einzeilige, feldbreite Hinweiszeilen mit gemeinsamer
  Auto-Fit-Schriftgroesse (max. 11 px): „KI-Berater – Angaben ohne Gewaehr … Kontaktformular."
  (Link je Sprache: de `/de/unternehmen/kontakt`, en `/en/company/contact-us`, cs → en) und
  „Anonymer Chat – bitte keine personenbezogenen Daten eingeben. Datenschutz" (de
  `/de/datenschutz`, en `/en/data-protection`).
- **Markdown:** `#`-Ueberschriften (z. B. „### Quellen:") als fette Absatzzeile statt Rohtext.
- Gates: `tsc` 0, ESLint 0, Bundle 26 kB gzip (< 80 kB). Sichtpruefung Dev-Preview gegen
  Ansicht 2/3 (Masse per DOM: Kopf 56, Avatar 40, Feld 52, Flieger 24, Chips 42 hoch).

## Release 0.0.19 (2026-09-06)

- **Test-only Modellwahl je Chat (dgx CR-0033):** `GET /api/webchat-config`
  liefert zusaetzlich `modelle_waehlbar: string[]` (test: die freigegebenen
  Slugs; prod: `[]`) und `modell_standard`. Nur wenn die Liste nicht leer ist
  (= Testumgebung), bekommt die Feedback-Leiste zwei weitere Elemente:
  den Kommentar-Knopf (ab jetzt test-only, wie bei Gravelli) und ein
  Gehirn-Symbol (lucide `brain`), das ein Menue mit einer Radio-Zeile je
  Modell oeffnet (Standard als `<slug> (Standard)` markiert, Hinweiszeile
  „nur Testumgebung"). Die Wahl gilt je Chat (Session `modell`, endet mit
  „Neue Unterhaltung"), geht als `modell` im `/api/chat`-Body mit; das
  effektive Modell kommt per Header `x-model-used` zurueck und wird je
  Antwort gespeichert sowie an `/api/qs/transcript` (Assistent-Zeilen) und
  `/api/qs/feedback` als `modell` gemeldet. HTTP 400 `model_not_allowed`
  setzt die Wahl zurueck. Reihenfolge der Leiste: Daumen hoch, Daumen
  runter, Kommentar, Modell, Flagge.

## Release 0.0.18 (2026-08-20)

- **Wirt-Pruefung SCHARF + Salient-Domains autorisiert** (Task #117 erledigt):
  Salient meldete 19.08. via Heike ihre Umgebungen — ddev
  (`god--ibexa.ddev.site`) als Domain, Platformsh-Previews
  (`<branch>-walegqvpxiy74.de-2.platformsh.site`) als projekt-gescopter
  SUFFIX (neue Liste `AUTORISIERTE_WIRT_SUFFIXE` — endsWith ohne
  Punkt-Grenze, die Subdomains vergibt Platform.sh nur an deren Projekt);
  `localhost` war schon immer erlaubt (Entscheid: dauerhaft).
  `WIRT_PRUEFUNG_AKTIV=true`; im selben Zug das Caddy-Origin-Gate auf
  chatbot.godelmann.bot scharf (godelmann-prod, Sicherung
  `Caddyfile.bak-20260820-salient-gate`). CADDY-FALLE dabei: der
  `header Origin v1 v2 ...`-Matcher mit MEHREREN Werten matchte NICHT als
  OR (alle erlaubten Origins bekamen 403, gemessen) -> `header_regexp`;
  ausserdem OPTIONS vom API-Gate ausgenommen (Preflight-Handle kam sonst
  nie dran). Verifikation: 12er-curl-Matrix (alle erlaubten 200 inkl.
  Branch-Wildcard, fremde/http/fremdes-Platformsh-Projekt/Suffix-Trick 403,
  ohne Origin 200, Preflight 204, ACAO nur fuer Erlaubte).
  EINBINDUNG.md §Autorisierte Domains auf den Scharf-Stand.

## Release 0.0.17 (2026-08-18)

- **Uebergangsmodus Wirt-Pruefung**: Laufzeit-Selbstcheck per Schalter
  `WIRT_PRUEFUNG_AKTIV=false` deaktiviert, damit Salient auf ihren Testsystemen
  sofort einbinden kann; Scharfschalten zusammen mit dem Caddy-Origin-Gate nach
  Meldung der Salient-Domains (Task #117). Konsolen-Hinweis ohne Firmen-/
  Kontaktnennung. EINBINDUNG.md v1.2->v1.3 (Salient-Haertung: Ziel-Einbindung
  Drawer wortgleich zur Proxy-Referenz, data-uc-allowed in allen Snippets +
  Usercentrics-Abschnitt, lang je Seitensprache + cs, Akzent-Defaults
  3F4549/2E3336 gemessen, Live-Vorschau + Chat-Icon-SVG).

## Release 0.0.16 (2026-08-18)

- **Laufzeit-Selbstcheck autorisierte Wirt-Domains** (`istAutorisierterHost`):
  Widget initialisiert nur auf godelmann.de/.com/.net/.bot (+Subdomains,
  localhost) — defense-in-depth; wirksamer Schutz ist das Origin-Gate am
  Server (chatbot.godelmann.bot, Caddy godelmann-prod). EINBINDUNG.md v1.2
  (Agentur-Host, Autorisierte Domains, CSP-Absatz).
> Maintainer: Dietmar Scharf

## Releases

- **0.0.15 (2026-08-04, test)** — **Mehrsprachigkeits-Haertung nach Chrome-Abnahme:**
  (1) Wechsel-Zusammenfassung nur noch bei ECHTER Modell-Antwort im sichtbaren Verlauf —
  die `conversation_id` lebt in localStorage tage-lang weiter, waehrend die Tab-Sitzung
  frisch ist; der Server fasste sonst ein altes, unsichtbares Gespraech zusammen.
  (2) Sprachreaktive Nachrichten (Begruessung) wechseln ihren Sprach-Stempel mit;
  `syncFeedbackBar` zieht die Flagge bestehender Leisten nach (vorher: cs-Text mit
  DE-Flagge).
- **0.0.14 (2026-08-04, test)** — **Mehrsprachigkeit Stufe 1 (Plan „Mehrsprachigkeit +
  Sprachumschaltung", AP3):** ChatSprache-Typ mit 8er-Set (de/en/fr/it/es/nl/pl/cs),
  freigeschaltet de/en/**cs** (AKTIVE_SPRACHEN-Flag; fr/it/es/nl/pl folgen nach
  Uebersetzungs-Review via en-Fallback-Tabellen). Farbige Miniflagge + Kuerzel als
  4. Element der Feedback-Zeile → Sprachmenue (menuitemradio, Esc/Aussenklick,
  Fokusrueckgabe); Wechsel stellt die GANZE Oberflaeche um (Texte, Weiche, Chips,
  Fehlermeldungen) und holt bei bestehendem Verlauf die Server-Zusammenfassung
  (`language_switch`, Divider-Pille im Verlauf, QS art `sprachwechsel`). Zweisprachige
  Geo-Begruessung + Sprachwahl-Chips aus `/api/webchat-config.geo` (nur frische Session;
  `geo:null` = heutiges Verhalten). `lang` additiv im /api/chat-Body; Session persistiert
  `chatLang` + Sprache je Nachricht; QS-Transcript meldet `sprache`. Tschechische
  Erstuebersetzung aller UI-Texte + Guided-Selling-Tabellen (`ask`-Anfragen bleiben
  bewusst deutsch — deutsche Wissensbasis-Embeddings; Review durch tschechische
  Kollegen offen). Bundle 22,6 kB gzip (Gate < 80 kB).
- **0.0.13 (2026-08-04, test)** — **Alle 6 CTAs als Icon + Text in EINER Formensprache:**
  Kopfzeile „Neue Unterhaltung" (+), „Vollbild" (maximize) / „Verkleinern" (minimize),
  „Schließen" (x); Feedback-Leiste „Hilfreich" / „Nicht hilfreich" / „Kommentar"
  (Daumen/Sprechblase als Outline). Icons exakt in der Technik der godelmann.de-Site-Icons
  (24×24, Stroke, currentColor, round caps; stroke-width 1.5 = optisch 1px bei 15px-Rendering).
  Text-Glyphen (↗ ↙ ×) und gefuellte Material-Icons entfallen; unter 520px icon-only.
  EN-Naming konsistent „Chat advisor". ARIA-Labels unveraendert ausfuehrlich; v1-API stabil.
- **0.0.12 (2026-08-04, test)** — **Seiten-Modus rahmenlos:** auf /chat weisser Grund statt
  grauer Flaeche, Berater-Blasen Anthracite-10 (die Vollseite wirkt nicht mehr als
  eingerahmte Karte; Drawer unveraendert). Letzter Rot-Rest (fb-actions-Hover Red 90) an
  neue Variable `--_accent-hover` gehaengt (Default dunkles Anthrazit).
- **0.0.11 (2026-08-04, test)** — **Drawer entrotet + Namens-Konsistenz:** Akzent-Default
  Anthrazit #3F4549 statt Godelmann-Rot (rotes Drawer-Design zu aufdringlich; Rot bleibt per
  `--gdm-chat-accent` setzbar), Titel + ARIA-Labels konsistent **"Chat-Berater"** (wie das
  Rail-Item im Proxy 0.1.2); Tipp-Punkte + PDF-Badge haengen jetzt am Akzent. Serverseitig
  gleichgezogen: Selbstbezeichnung im System-Prompt (spass `b353f6a`). Verify
  test.godelmann.net: frische Session antwortet "Ich bin der digitale Chat-Berater".
- **0.0.10 (2026-08-03, test)** — **Webchat-QS: Feedback + Transcript-Melder.** An jeder
  fertigen Assistent-Antwort eine dezente Feedback-Leiste (Daumen hoch/runter + Inline-
  Kommentar; Upsert `POST /api/qs/feedback` mit vollem Zustand, 300-ms-Debounce, Klick auf
  den aktiven Daumen = zuruecknehmen; Zustand persistiert im Sitzungs-Gedaechtnis und
  kommt nach Seitenwechsel zurueck). Transcript-Melder: jede FERTIGE Nachricht (mit Art
  begruessung|zielgruppe|frage|kuratiert|antwort|nachfrage|fehler, Latenz und den
  Vorschlags-Chips der letzten Antwort) gesammelt als Batch an `POST /api/qs/transcript`
  (Debounce 2 s, max 40/Batch, serverseitig idempotent je (sitzung_id, message_id)); bei
  `pagehide` Flush per `sendBeacon` (text/plain = preflight-frei). Neu: stabile `qsId` je
  Nachricht (crypto.randomUUID, zentral in appendMessage) + `sitzungId` je Unterhaltung
  („Neue Unterhaltung" vergibt eine frische und flusht die alte). Session-Restore ist
  self-healing (einmaliges idempotentes Nachsenden, Leisten kommen wieder, keine
  Doppel-Leisten). Bundle 18,1 kB gzip (Gate < 80 kB).
- **0.0.9 (2026-08-03, test)** — **Gespraech als echte KI-Konversation** (Paritaet zum
  Gravelli-Berater, Heike-Ablauf strikt): Begruessung + kuratierte Antworten als echte
  Bot-Bubbles mit simulierter Denkzeit (1,0-1,5 s Typing); Zielgruppen-Wahl als
  Nutzer-Echo ("Ich bin Fachkunde/Endkunde"); Button-Klicks erscheinen als ausformulierte
  natuerliche Frage (neues `frage`-Feld je Aktion); verbose Fliesstext-Intros;
  **Fortsetzungsfragen-Chips nach jeder Modell-Antwort** (Server-Zusatz-Event
  `spass_followups`, aufgefuellt mit dem Zweig-Menue, max 6, dedupliziert); Slot-Filling:
  einmalige, freundliche Zielgruppen-Nachfrage, wenn per Freitext uebersprungen (persistiertes
  Flag `zielgruppeGefragt`; der stumme endkunde-Default entfaellt); busy-Haertung fuer
  Chips/Zweig-Klicks waehrend laufender Antworten. PLZ-Ansprechpartner-Flow unveraendert.
- **0.0.8 (2026-08-02, test)** — **Drawer- und Seiten-Modus (Einbindung als Teil der
  Seite).** Bisher nur schwebende Bubble; jetzt drei Darstellungsformen ueber das neue
  Attribut `mode`: `floating` (unveraendert), **`drawer`** (rechter Seiten-Drawer, der die
  Seite via `margin-right` am `<html>` sanft schmaler schiebt — kein Abdunkeln, Seite
  bleibt bedienbar; Slide-in ~0,8 s; auf kleinen Displays automatisch Vollflaechen-Panel)
  und **`page`** (in-flow, fuellt einen Container als eigene Seite). Neu ausserdem:
  `launcher="none"` blendet die eigene Bubble aus und verdrahtet Host-Elemente mit
  `data-gdm-chat-launcher` automatisch (Klick -> Toggle, `aria-expanded` gespiegelt, kein
  Inline-JS -> CSP-freundlich); `page-url` (Default `/chat`) + Punchout aus dem Drawer;
  „Verkleinern" von der Seite zurueck in den Drawer (dieselbe Unterhaltung ueber gemeinsamen
  `sessionStorage`); oeffentliche API `open()/close()/toggle()` + Dokument-Ereignisse
  `gdm-chat:open|close|toggle`; `disconnectedCallback` nimmt alle Wirt-Mutationen sauber
  zurueck (html-Klasse/margin/overflow, Listener, Rail-Verdrahtung). CSS-Property
  `--gdm-chat-drawer-width` (Default 480px). aria-modal/Fokus-Trap bleiben auf `floating`
  beschraenkt (Drawer/Seite lassen den Wirt bedienbar). Alles **additiv unter v1**. Fuer
  godelmann.de bereitet der Godelmann-Proxy die volle Einbindung vor (Rail-Item + die eine
  CSS-Regel injiziert, Widget im Drawer-Modus, `/chat`-Vollseite). Agentur-Vertrag:
  `docs/EINBINDUNG.md` v1.1. Bundle 13,9 kB gzip (Gate < 80 kB).
- **0.0.7 (2026-08-01, LIVE test+PROD)** — 17 Befunde aus einem adversarialen Review
  behoben, davon zwei KRITISCHE, die das Sitzungs-Gedaechtnis ins Gegenteil verkehrt
  haetten: (1) fertige Bot-Antworten wurden nie gesichert — beim Seitenwechsel blieb die
  Frage OHNE Antwort stehen; (2) der rohe Modell-Text samt `<think>` wurde gespeichert und
  beim Wiederherstellen ungefiltert gerendert — der serverseitig abgestellte Reasoning-Leak
  waere im Kundenfenster zurueckgewesen. Ausserdem: Ansprechpartner-Ergebnis wurde nicht
  gesichert; „Neue Unterhaltung" liess den Entwurf stehen; ein abgebrochener Lauf schrieb
  seine Fehlermeldung in die FRISCHE Unterhaltung; `connectedCallback` war nicht idempotent;
  `aria-modal` wurde ohne Fokus behauptet (Screenreader sahen die Seite ausgeblendet); jede
  Folgeseite loeste ungefragt Rechenarbeit aus; Fehlermeldungen verloren ihren
  Wiederholen-Knopf. **Damit ist prod erstmals seit 0.0.1 (12.07.) wieder aktuell** —
  inklusive Reasoning-Strip, Zielgruppen-Weiche, PLZ-Ansprechpartner und Vorschau-Kette.
  ⚠ Der PLZ-Ansprechpartner antwortet auf prod noch „kein Ansprechpartner hinterlegt",
  solange `/api/contact` dort keine Datenquelle hat (Vertriebsliste steht aus).
- **0.0.6 (2026-08-01)** — **Chat ueberlebt Seitenwechsel und Neuladen.** godelmann.de
  laedt bei jedem Seitenwechsel komplett neu; ein Beratungsgespraech fing dadurch auf
  jeder Unterseite wieder bei der Begruessung an. Panel-Zustand, Verlauf, Stand der
  Zielgruppen-Weiche, PLZ-Erwartung und die angefangene Eingabe liegen jetzt im
  `sessionStorage` (Eingabe nach JEDEM Zeichen, samt Cursorposition). Der Schreibfokus
  kehrt nur zurueck, wenn er vorher im Feld lag — sonst wuerde der Chat ihn jemandem
  klauen, der gerade woanders tippt. Beim Wiederherstellen kommen die passenden
  Auswahl-Schaltflaechen zurueck; eine leere Bot-Blase (Neuladen mitten in der Antwort)
  wird verworfen. Zwei Fallen dabei: `ShadowRoot.activeElement` zeigt beim blur noch aufs
  Feld (eigener Merker), und `open()` fokussierte grundsaetzlich (jetzt steuerbar).
  ⚠ **Widget-Auslieferung cacht 1 h** (`cache-control: public, max-age=3600`) — Updates
  erreichen Besucher entsprechend verzoegert; fuer dringende Korrekturen einplanen.
- **0.0.5** — Umlaut-/Modell-Angleich (siehe spass `godelmann-chatbot-server`).
- **0.0.4 (2026-07-29)** — Ansprechpartner-PLZ-Flow (deterministisch): „Ansprechpartner finden"
  fragt die PLZ ab und ruft `GET {apiBase}/api/contact?plz=` → Ansprechpartner-Karte (Name/Region +
  `tel:`/`mailto:`); Fallback wenn kein Treffer. Administrierbare Guided-Selling-Link-Ziele: laedt
  `GET /api/webchat-config` beim Oeffnen, Buttons oeffnen die hinterlegten godelmann.de-URLs (Fallback =
  geerdete AI-Frage). Renderer: Bilder `![](…)` inline + Markdown-Tabellen (Produktvergleich). Neue
  Quick-Action „Produkte vergleichen". Grundlage: Lastenheft + Ablaufplan Heike.

- **0.0.3 (2026-07-29)** — Zielgruppen-Weiche + Guided Selling (Ablaufplan Heike, 20.07.,
  `docs/ABLAUFPLAN-HEIKE-2026-07-20.md`). Begruessung fragt jetzt „Fachkunde oder Endkunde?"
  (Buttons + Freitext-Erkennung nach Heikes Stichwortlisten). Je Zielgruppe ein Guided-Selling-
  Menue (Endkunde: Produkte/Inspirationen/Gartenbuch/Neuheiten/Ideengarten/Haendlersuche/Hotline ·
  Fachkunde: Produkte/Objektplanung/Mediathek/Referenzen/Ansprechpartner). Die meisten Buttons
  stellen eine geerdete Frage an den Bot (echte godelmann.de-Quellen, keine hartkodierten Links);
  „Ansprechpartner finden" fragt die PLZ ab — Zuordnung **Platzhalter bis zur Vertriebs-Adressliste**.
  Rein im Widget (vor dem KI-Modell), Chip-Buttons im CI-Rot. Erste Praesentations-Version.

- **0.0.2 (2026-07-28)** — Reasoning-Leak behoben: DGX-Streaming liefert das
  Chain-of-Thought der Thinking-Modelle im `delta.content` (`<think>...</think>`),
  der abgespeckte Widget-Parser strippte es nicht → der interne Denk-Block
  erschien im Kundenfenster. `visibleAnswer()` + Suppression bis `</think>`
  (GoCreate-`dgx.ts`-Muster) rendern jetzt nur die fertige Antwort. Begleitend
  im Server (`spass/examples/godelmann-chatbot-server`) der Web-Chat-System-Prompt
  gegen Halluzination geschaerft (kein Raten von Produkt-/Oberflaechennamen/Normen,
  ehrlicher Wissensluecken-Ausweg statt Synthese).
>
> KI-Chat-Widget für godelmann.de — Web Component `<godelmann-chatbot>` (Vanilla TS, Shadow DOM). Eingebettet via versioniertem ES-Modul (Floating-Bubble, kein iFrame).
> Kontext + Sprint-Plan: GoCreate-Websites-Backlog, Sub-App 3
> ([`../../godelmann-gocreate/docs/BACKLOG.md`](../../godelmann-gocreate/docs/BACKLOG.md) → „Websites").
>
> Infrastruktur-BACKLOG: [`../../../docs/BACKLOG.md`](../../../docs/BACKLOG.md)


## Audit 2026-07-02 (Multi-Agent, verifiziert)

> Multi-Agent-Audit (Repo + Live Test/Prod, 2 Pässe). **Detail je Finding: eigene `docs/FINDING-<ID>.md`** (verlinkt).
> Ergebnis: **7 Findings** — P1: 0 · P2: 3 · P3: 4. Erledigt: **5/7** (Stand 2026-07-12, Widget-Release 0.0.1).

### 🟠 P2

| ID | Finding | Status |
|---|---|---|
| [CHATBOT-P2-01](FINDING-CHATBOT-P2-01.md) | Dev-Port-Konflikt: 5008 doppelt (Frahcs), Chatbot fehlt in PORTS.md, vite.config ohne Port | ✅ resolved (0.0.1: Dev-Port 5011 explizit + strictPort; zentrale Port-Registry aktualisiert) |
| [CHATBOT-P2-02](FINDING-CHATBOT-P2-02.md) | CLAUDE.md-Tech-Stack (React18/Tailwind/shadcn/SPASS/Supabase) weicht vom Ist-Stand (React 19, Vite-Scaffold) ab | ✅ resolved (0.0.1: CLAUDE.md = Vanilla-TS-Web-Component, Ist-Stand) |
| [CHATBOT-P2-03](FINDING-CHATBOT-P2-03.md) | npm audit fix: 1 high (vite 8.0.1, Dev-Server) + 4 weitere, alle via npm audit fix behebbar | ✅ resolved (0.0.1: npm audit fix → 0 vulnerabilities; React-Deps komplett entfernt) |

### 🟢 P3

| ID | Finding | Status |
|---|---|---|
| [CHATBOT-P3-01](FINDING-CHATBOT-P3-01.md) | README.md ist unveränderter Vite-Template-Text statt projektspezifisch | ✅ resolved (0.0.1: projektspezifisches README) |
| [CHATBOT-P3-02](FINDING-CHATBOT-P3-02.md) | index.html: lang="de" + deutscher Brand-Titel statt lang="en"/Platzhalter | ✅ resolved (0.0.1: lang="de" + Titel „GODELMANN Chatbot — Widget-Preview") |
| [CHATBOT-P3-03](FINDING-CHATBOT-P3-03.md) | /projects/CLAUDE.md Submodule-Liste um godelmann-chatbot + frahcs-mobilien ergaenzen | ⬚ offen (ausserhalb dieses Repos: platform-control) |
| [CHATBOT-P3-04](FINDING-CHATBOT-P3-04.md) | dgx-Proxy user_id-Spoofing nur durch ENV SPASS_JWT_VERIFY=enforce verhindert — Fail-open-Default (JwtVerifyMode::Off) | ⬚ offen (ausserhalb dieses Repos: spass) |

---

---

## Release-Historie

### 0.0.1 — 2026-07-12 · `<godelmann-chatbot>` Web Component (Erstrelease)

- **Repo-Umbau:** React/Vite-Scaffold → Vanilla-TypeScript-Widget-Repo (React/react-dom/@vitejs/plugin-react entfernt, `npm audit` 0 vulnerabilities).
- **`src/chatbot-widget.ts`:** Custom Element `<godelmann-chatbot>` (Shadow DOM open, WHATWG-Standard); reaktive Attribute `lang`/`position`/`api-base`/`greeting`; Floating-Bubble + Chat-Panel (Header „Godelmann-Assistent", Nachrichtenliste, Eingabezeile, „Neue Unterhaltung", Datenschutz-Hinweis mit Link).
- **API:** `POST {apiBase}/api/chat` (`{message, conversation_id?, altcha?, hp_website:""}`) → SSE-Stream (OpenAI-Delta, fetch+ReadableStream, `[DONE]`); Header `x-conversation-id` → localStorage `gdm-chat-conversation-id` (Folge-Nachrichten senden mit; „Neue Unterhaltung" löscht).
- **ALTCHA clientseitig:** `GET /altcha/challenge` → SHA-256-PoW via `crypto.subtle`, Payload Base64-JSON exakt im spass-captcha-Format; Vorlösen beim Panel-Öffnen + frische Lösung je Nachricht (Server-Replay-Schutz), 1 Auto-Retry bei 400 `captcha_required`.
- **Rendering/Sicherheit:** Streaming-Rendering, Markdown sanitized (HTML-escape zuerst; fett/Listen/http(s)-Links `target=_blank rel=noopener noreferrer`, Absätze).
- **Fehler:** 429 deutsche Rate-Limit-Meldung, Netzfehler + Retry-Button, Timeout 120 s.
- **A11y:** `role=dialog aria-modal`, Fokus-Trap, ESC, `aria-live=polite`, Bubble-`aria-label`.
- **Theming:** `--gdm-chat-accent` (#E52D12) / `--gdm-chat-z-index` (2147483000) / `--gdm-chat-font` (inherit); mobil vollflächig. Events `gdm-chat:opened/closed/message-sent/response-received/error` (bubbles+composed).
- **Build:** Vite lib-mode → `dist/chatbot-widget.v1.js` (ES, ein File, minified) — **7,4 kB gzip** (Gate < 80 kB); `npm run build` = `tsc --noEmit` + Vite; Dev-Port 5011.
- **Doku:** `docs/EINBINDUNG.md` (Snippet, Attribute, CSS-Props, Events, CSP inkl. SSE, Datenschutz-Baustein, Versionierungs-Politik, Ansprechpartner); README + CLAUDE.md auf Ist-Stand; `index.html` = Standalone-Preview.
- **Verifiziert:** Headless-E2E (Playwright/Chromium) gegen Mock-Server mit crate-identischer ALTCHA-Verifikation — 30/30 Checks grün (Streaming, Markdown/XSS, Conversation-Verlauf, Replay-frisches ALTCHA, 429, Events, Theming, A11y).
- Findings CHATBOT-P2-01 (Repo-Teil), P2-02, P2-03, P3-01, P3-02 resolved (siehe Audit-Tabelle oben).

---

## Offen

| Status | Aufgabe | Details |
|---|---|---|
| ✅ | Widget (Web Component) | 0.0.1 — `<godelmann-chatbot>` inkl. SSE, ALTCHA, EINBINDUNG.md (siehe Release-Historie). |
| ✅ | Deploy auf `chatbot-test.godelmann.net` (2026-07-12) | LIVE: `godelmann-chatbot-server` (SPASS :3011, systemd, ALTCHA+RateLimit), Caddy-vhost mit LE-Cert, SSE-flush, CORS nur godelmann.de inkl. Expose `x-conversation-id`. E2E bestanden: grounded Chat via knowledge_search (deutsch, Modell godelmann-gocreate-private-qwen-text), Folgefrage im selben Verlauf, Honeypot-FakeOk, ALTCHA-Negativtest 400. **Prod ebenfalls LIVE** (`https://chatbot.godelmann.net`, godelmann-prod :3011; eigener Web-Chat-System-Prompt deutsch + knowledge_search, Tenant-Inject via SPASS-Augment aus — dgx CR-0018; Rate-Limit-429 + RLS-Gegenprobe bestanden). |
| ⬚ | E2E-Abnahme laut ANFORDERUNGEN.md | Grounded-Antwort mit Quelle ueber den vhost, Rate-Limit-Negativtest (11. Nachricht → 429), CORS-Negativtest, Browser-E2E auf Test-Einbettungsseite. |
| ⬚ | Restliche Ausbaustufen | Siehe Sprint-Plan im GoCreate-Websites-Backlog (Sub-App 3: Reviews, Cost-Tracking). |

---

## Doku-Pflege (Pflicht)

Der `> Stand:`-Kopf MUSS die aktuelle `package.json`-Version nennen; jedes gelieferte Release wird hier
nachgetragen (vom `/do-everything`-Frontend-Release-Sync-Check erzwungen — Memory `feedback_frontend_backlog_version_sync`).


## Security-Audit (2026-07-12) — FINDINGS hinterlegt, Remediation offen

**Status:** KEINE FINDINGS. Teil des Fleet-Audits (AUDIT-FLEET-2026-07-12). **0 Findings** (0).

- Belege: `docs/FINDINGS-2026-07-12.md` · Ticket/Tracker: `docs/AUDIT-2026-07-12.md` · Org-Register: `BLUEITS-GmbH/.xoder/FINDINGS.md`

**Naechster Schritt:** User-Review → Priorisierung → Fix; Jira erst nach Review. Erledigtes als „resolved" markieren.
