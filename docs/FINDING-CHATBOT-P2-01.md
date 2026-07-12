# CHATBOT-P2-01: Dev-Port-Konflikt 5008 aufloesen + PORTS.md-Eintrag

| | |
|---|---|
| **Projekt** | CHATBOT |
| **Schweregrad** | P2 |
| **Bereich** | Dev-Ports / Konfiguration |
| **Entdeckt** | 2026-07-02 (Multi-Agent-Audit) |
| **Status** | RESOLVED (Repo-Teil, 2026-07-12 · 0.0.1: `vite.config.ts` setzt `server.port: 5008` + `strictPort`, CLAUDE.md konsistent; PORTS.md-Registry-Eintrag in platform-control bleibt offen) |

## Symptom
Die Chatbot-`CLAUDE.md` verspricht den lokalen Dev-Server auf `http://localhost:5008`. Dieser Port ist in der zentralen Port-Registry `platform-control/docs/PORTS.md` jedoch bereits Frahcs Mobilien zugewiesen. Startet man beide Frontends parallel, kollidieren sie am selben Port. Zusätzlich fehlt der Chatbot vollständig in `PORTS.md` (kein eigenes 5xxx/9xxx-Paar), und `vite.config.ts` setzt gar keinen Port — Vite fällt daher tatsächlich auf den Default 5173 zurück, nicht auf das dokumentierte 5008.

## Root Cause
Drei Stellen widersprechen sich bzw. sind unvollständig:
1. `CLAUDE.md` dokumentiert einen Port (5008), der bereits vergeben ist.
2. `vite.config.ts` hat keinen `server.port`-Eintrag, sodass das dokumentierte Verhalten technisch nicht existiert (Default 5173).
3. Der Chatbot ist nicht in der Single-Source-of-Truth `platform-control/docs/PORTS.md` registriert.

## Beleg
```text
# CLAUDE.md:7  (godelmann-chatbot)
npm run dev          # Dev-Server auf http://localhost:5008

# platform-control/docs/PORTS.md:16
| 5008 | Frahcs Mobilien | `platform-control/frontends/frahcs-mobilien` |

# platform-control/docs/PORTS.md:40
| 9008 | frahcs-mobilien-server (sobald Binary existiert) | 5008 | dev |

# godelmann-chatbot/vite.config.ts  (grep "port"/"server" liefert KEINEN Treffer)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ ...  # kein server.port -> Vite-Default 5173
```
`grep -nE "^\| 50[0-9][0-9]" PORTS.md` zeigt 5001–5010 belegt (5008 = Frahcs), kein Chatbot-Eintrag. `grep -nE "^\| 90[0-9][0-9]"` zeigt 9001–9008 belegt.

## Auswirkung
Rein lokale Dev-Umgebung (kein Test/Prod-Bezug, kein Sicherheitsrisiko). Folge: Wer der Chatbot-`CLAUDE.md` folgt, startet Vite entweder mit einem Kollisionsport oder erreicht die App nicht unter 5008 (real 5173). Paralleles Arbeiten an Chatbot und Frahcs Mobilien schlägt am gemeinsamen Port fehl. Die Port-Registry verliert ihre Verlässlichkeit als Single-Source-of-Truth.

## Reproduktion
1. Frahcs Mobilien Dev-Server auf 5008 starten.
2. Im Chatbot `npm run dev` ausführen und laut `CLAUDE.md` `http://localhost:5008` öffnen.
3. Beobachten: Vite bindet real 5173 (oder meldet Kollision), 5008 zeigt die falsche App.

## Fix-Vorschlag
Freien Port **5011** (Dev-Server) mit Paar **9011** (spass dev binary) für den Chatbot reservieren — beide sind laut PORTS.md unbelegt (5001–5010 bzw. 9001–9008 vergeben).
1. `godelmann-chatbot/vite.config.ts` — expliziten Port setzen:
   ```ts
   export default defineConfig({
     plugins: [react()],
     server: { port: 5011 },
   })
   ```
2. `platform-control/docs/PORTS.md` — zwei Zeilen ergänzen:
   ```text
   | 5011 | Godelmann-Chatbot (godelmann-chatbot) | `platform-control/frontends/godelmann-chatbot` |
   ...
   | 9011 | godelmann-chatbot-server (sobald Binary existiert) | 5011 | dev |
   ```
3. `godelmann-chatbot/CLAUDE.md:7` — `5008` → `5011` korrigieren.

Kein Deploy und keine Migration nötig (reine lokale Dev-Konfiguration). Portwahl 5011/9011 ggf. mit der PORTS.md-Konvention abgleichen, falls dort inzwischen weitere Ports vergeben wurden.

## Referenzen
- [docs/BACKLOG.md](BACKLOG.md)
- `platform-control/docs/PORTS.md` (Zeilen 16, 40 — Frahcs-Belegung 5008/9008)
- `godelmann-chatbot/CLAUDE.md:7` (falsche Port-Angabe)
- `godelmann-chatbot/vite.config.ts` (fehlender `server.port`)
- Memory: `reference_dev_ports.md` (Dev-Server-Ports 5001–5010 pro Frontend)
