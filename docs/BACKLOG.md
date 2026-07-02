# Godelmann-Chatbot — BACKLOG

> Stand: 2026-06-15 (Paket-Version **v0.0.0** — Scaffold, noch kein Release)
> Maintainer: Dietmar Scharf
>
> KI-Chat-Widget für godelmann.de (React/Vite/TS). Eingebettet via JS-Widget (Floating-Bubble).
> Kontext + Sprint-Plan: GoCreate-Websites-Backlog, Sub-App 3
> ([`../../godelmann-gocreate/docs/BACKLOG.md`](../../godelmann-gocreate/docs/BACKLOG.md) → „Websites").
>
> Infrastruktur-BACKLOG: [`../../../docs/BACKLOG.md`](../../../docs/BACKLOG.md)


## Audit 2026-07-02 (Multi-Agent, verifiziert)

> Multi-Agent-Audit des Scaffolds (v0.0.0). Keine P1-Findings. Basis-Zustand ist sauber:
> `npm run build` (tsc -b + vite build) gruen, ESLint 0 Fehler, strict-TSC vorhanden,
> Branch `main` synchron mit `origin/main` (a88c304), Working Tree clean, BACKLOG-Kopf korrekt (v0.0.0/Scaffold).

### P2 — Zeitnah beheben

| Status | Aufgabe | Details |
|---|---|---|
| ⬚ | Dev-Port-Konflikt 5008 aufloesen + PORTS.md-Eintrag | `CLAUDE.md` verspricht Dev-Server auf `http://localhost:5008`, aber `docs/PORTS.md` weist 5008 bereits Frahcs Mobilien zu; `vite.config.ts` setzt gar keinen Port (Default 5173) und der Chatbot fehlt komplett in `platform-control/docs/PORTS.md` (kein 5xxx/9xxx-Paar). Freien Port waehlen, in `vite.config.ts` + `PORTS.md` + `CLAUDE.md` eintragen. |
| ⬚ | CLAUDE.md Tech-Stack an Ist-Stand angleichen | CLAUDE.md nennt „React 18 + Tailwind + shadcn/ui + SPASS" — tatsaechlich React 19.2.4, kein Tailwind/shadcn/SPASS (package.json: nur react/react-dom; `src/` = Vite-Counter-Template). Auch „Shared Supabase mit GoCreate (Port 8010)" ist im Code nicht angebunden. Entweder als Zielbild kennzeichnen oder auf Ist-Stand korrigieren. |
| ⬚ | npm audit fix: 1 high (vite 8.0.1) + 4 weitere | vite 8.0.0–8.0.15 hat 3 Advisories (Path Traversal `.map`, `server.fs.deny`-Bypass, Arbitrary File Read via Dev-Server-WebSocket, u.a. GHSA-4w7w-66w2-5vf9); dazu moderate in @babel/core, brace-expansion, js-yaml, postcss. Nur Dev-Server-Risiko, aber der Dev-First-Workflow laeuft auf dieser Maschine. Alle via `npm audit fix` behebbar. |

### P3 — Gelegenheit / Kosmetik

| Status | Aufgabe | Details |
|---|---|---|
| ⬚ | README.md projektspezifisch machen | README ist noch der unveraenderte Vite-Templatetext („React + TypeScript + Vite") — Widerspruch zur Repo-Konvention aussagekraeftiger READMEs. |
| ⬚ | index.html: `lang="de"` + Brand-Titel | Aktuell `lang="en"` und Titel „godelmann-chatbot" — fuer das deutsche GODELMANN-Widget spaeter `lang="de"` und Brand-Titel setzen. |
| ⬚ | /projects/CLAUDE.md Submodule-Liste ergaenzen | Die platform-control-Submodule-Aufzaehlung in `/projects/CLAUDE.md` endet bei godelmann-gravelli-salone; godelmann-chatbot (und frahcs-mobilien) fehlen, obwohl beide in `.gitmodules` und `platform-control/CLAUDE.md` registriert sind. |

---

---

## Release-Historie

_Noch kein Release — Projekt ist als Scaffold angelegt (v0.0.0)._

---

## Offen

| Status | Aufgabe | Details |
|---|---|---|
| ⬚ | Erste Ausbaustufe | Siehe Sprint-Plan im GoCreate-Websites-Backlog (Sub-App 3: Konfig, Public-Edge-Function, Knowledge via Ibexa-Crawler, Widget, Reviews, Cost-Tracking). |

---

## Doku-Pflege (Pflicht)

Der `> Stand:`-Kopf MUSS die aktuelle `package.json`-Version nennen; jedes gelieferte Release wird hier
nachgetragen (vom `/do-everything`-Frontend-Release-Sync-Check erzwungen — Memory `feedback_frontend_backlog_version_sync`).
