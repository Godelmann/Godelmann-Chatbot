# CHATBOT-P2-03: npm audit fix: 1 high (vite 8.0.1) + 4 weitere

| | |
|---|---|
| **Projekt** | CHATBOT |
| **Schweregrad** | P2 |
| **Bereich** | Dependencies / Security |
| **Entdeckt** | 2026-07-02 (Multi-Agent-Audit) |
| **Status** | RESOLVED (2026-07-12 · 0.0.1: `npm audit fix` → 0 vulnerabilities; React-Toolchain komplett entfernt) |

## Symptom
`npm audit` im Repo `godelmann-chatbot` meldet 5 offene Verwundbarkeiten: 1 high, 3 moderate, 1 low. Die high-Meldung betrifft die installierte Dev-Toolchain `vite` (Bereich 8.0.0–8.0.15), zusaetzlich moderate/low-Advisories in transitiven Dev-Dependencies.

## Root Cause
`package.json` pinnt `"vite": "^8.0.1"`, wodurch eine verwundbare Vite-Version im Range 8.0.0–8.0.15 aufgeloest wird. Diese Vite-Versionen haben mehrere Dev-Server-Advisories:
- **GHSA-4w7w-66w2-5vf9** (high) — Path Traversal beim `.map`-Handling optimierter Deps
- **GHSA-v2wj-q39q-566r** — `server.fs.deny` per Query-String umgehbar
- **GHSA-p9ff-h696-f583** — Arbitrary File Read ueber den Vite-Dev-Server-WebSocket
- **GHSA-fx2h-pf6j-xcff** — `server.fs.deny`-Bypass ueber Windows-Alternate-Paths
- **GHSA-v6wh-96g9-6wx3** (transitiv `launch-editor`) — NTLMv2-Hash-Disclosure via UNC-Path (Windows)

Dazu die moderate/low-Advisories in weiteren (Dev-)Dependencies, u.a. `postcss` (<8.5.10, XSS via unescaped `</style>` — GHSA-qx2v-qp2m-jg93). Alle sind ausschliesslich zur Build-/Dev-Zeit relevant, nicht im ausgelieferten Prod-Bundle.

## Beleg
Pin in `package.json`:
```
28:    "vite": "^8.0.1"
```
`npm audit` (Repo `/projects/platform-control/frontends/godelmann-chatbot`, 2026-07-02):
```
vite  8.0.0 - 8.0.15
Severity: high
Vite Vulnerable to Path Traversal in Optimized Deps `.map` Handling - GHSA-4w7w-66w2-5vf9
Vite: `server.fs.deny` bypassed with queries - GHSA-v2wj-q39q-566r
Vite Vulnerable to Arbitrary File Read via Vite Dev Server WebSocket - GHSA-p9ff-h696-f583
launch-editor: NTLMv2 hash disclosure ... - GHSA-v6wh-96g9-6wx3
vite: `server.fs.deny` bypass on Windows alternate paths - GHSA-fx2h-pf6j-xcff
fix available via `npm audit fix`

postcss  <8.5.10  (moderate) - GHSA-qx2v-qp2m-jg93

5 vulnerabilities (1 low, 3 moderate, 1 high)
To address all issues, run: npm audit fix
```

## Auswirkung
Reines Dev-Server-/Build-Zeit-Risiko — das ausgelieferte Produktions-Bundle enthaelt weder `vite` noch `postcss` als Laufzeitcode, Prod-Stages sind nicht betroffen. Relevanz entsteht aber, weil der Dev-First-Workflow (Vite-HMR-Server, Ports 5xxx) direkt auf `platform-control` laeuft: Ein manipulierter Request an den lokalen Dev-Server koennte via Path Traversal / `server.fs.deny`-Bypass / Dev-Server-WebSocket beliebige Dateien der Maschine lesen. Kein Prod-Deploy-Blocker, aber Entwickler-Maschinen-Hygiene.

## Reproduktion
1. `cd /projects/platform-control/frontends/godelmann-chatbot`
2. `npm audit`
3. Ausgabe zeigt `1 high` (vite 8.0.0–8.0.15) plus 4 weitere.

## Fix-Vorschlag
`npm audit fix` im Repo ausfuehren — behebt laut Audit alle 5 Meldungen (kein `--force`/Major-Bump noetig, `^8.0.1` erlaubt Hochziehen auf eine gepatchte 8.0.x):
```bash
cd /projects/platform-control/frontends/godelmann-chatbot
npm audit fix
npm run build   # Verify: Build gruen
git add package.json package-lock.json && git commit -m "chore(deps): npm audit fix (vite high + 4 weitere)"
```
Danach `npm audit` erneut ausfuehren zur Bestaetigung (0 Vulnerabilities). Anschliessend regulaerer Strict-Gate (`tsc --noEmit`) vor Commit. Kein Server-Deploy erforderlich (Dev-Dependencies).

## Referenzen
- [docs/BACKLOG.md](BACKLOG.md)
- `package.json` (Zeile 28: `"vite": "^8.0.1"`)
- Doku `platform-control/docs/UPGRADE.md` (Dependency-Management, Overrides, Audit) und `spass/docs/DEV-STAGE.md` (Dev-First-Workflow auf platform-control)
