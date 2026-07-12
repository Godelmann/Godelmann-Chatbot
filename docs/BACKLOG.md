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

> Multi-Agent-Audit (Repo + Live Test/Prod, 2 Pässe). **Detail je Finding: eigene `docs/FINDING-<ID>.md`** (verlinkt).
> Ergebnis: **7 Findings** — P1: 0 · P2: 3 · P3: 4. Erledigt: **0/7** (Stand 2026-07-02).

### 🟠 P2

| ID | Finding | Status |
|---|---|---|
| [CHATBOT-P2-01](FINDING-CHATBOT-P2-01.md) | Dev-Port-Konflikt: 5008 doppelt (Frahcs), Chatbot fehlt in PORTS.md, vite.config ohne Port | ⬚ offen |
| [CHATBOT-P2-02](FINDING-CHATBOT-P2-02.md) | CLAUDE.md-Tech-Stack (React18/Tailwind/shadcn/SPASS/Supabase) weicht vom Ist-Stand (React 19, Vite-Scaffold) ab | ⬚ offen |
| [CHATBOT-P2-03](FINDING-CHATBOT-P2-03.md) | npm audit fix: 1 high (vite 8.0.1, Dev-Server) + 4 weitere, alle via npm audit fix behebbar | ⬚ offen |

### 🟢 P3

| ID | Finding | Status |
|---|---|---|
| [CHATBOT-P3-01](FINDING-CHATBOT-P3-01.md) | README.md ist unveränderter Vite-Template-Text statt projektspezifisch | ⬚ offen |
| [CHATBOT-P3-02](FINDING-CHATBOT-P3-02.md) | index.html: lang="de" + deutscher Brand-Titel statt lang="en"/Platzhalter | ⬚ offen |
| [CHATBOT-P3-03](FINDING-CHATBOT-P3-03.md) | /projects/CLAUDE.md Submodule-Liste um godelmann-chatbot + frahcs-mobilien ergaenzen | ⬚ offen |
| [CHATBOT-P3-04](FINDING-CHATBOT-P3-04.md) | dgx-Proxy user_id-Spoofing nur durch ENV SPASS_JWT_VERIFY=enforce verhindert — Fail-open-Default (JwtVerifyMode::Off) | ⬚ offen |

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


## Security-Audit (2026-07-12) — FINDINGS hinterlegt, Remediation offen

**Status:** KEINE FINDINGS. Teil des Fleet-Audits (AUDIT-FLEET-2026-07-12). **0 Findings** (0).

- Belege: `docs/FINDINGS-2026-07-12.md` · Ticket/Tracker: `docs/AUDIT-2026-07-12.md` · Org-Register: `BLUEITS-GmbH/.xoder/FINDINGS.md`

**Naechster Schritt:** User-Review → Priorisierung → Fix; Jira erst nach Review. Erledigtes als „resolved" markieren.
