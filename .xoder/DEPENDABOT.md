# DEPENDABOT — Godelmann-Chatbot

**Stand:** 09.09.2026 (XODER-Lauf, gemessen) · **Policy/Historie:** [`DEPENDENCIES.md`](DEPENDENCIES.md)
· Verfahren: node-weiter Skill `/XODER-dependency-update --here`

## Steckbrief (bestimmt, welche Spuren ein Dependency-Lauf faehrt)

| Feld | Wert | Folge |
|---|---|---|
| **Sprache / Oekosystem** | TypeScript · **npm** (`package.json`, `package-lock.json` — ein einziges Lockfile) | npm-Kommandotabelle |
| **Deno-Flaeche** | keine (`supabase/functions` existiert nicht) | Spur D entfaellt |
| **Cloudflare** | keine `wrangler.*` | Spur C entfaellt |
| **Lovable** | nein — kein Bot-Push, Default-Branch `main` wird nur von Hand bespielt | Spur L entfaellt |
| **CI-Workflow** | **keiner** (`.github/workflows/` fehlt) — Gates `npm run build` (tsc + Vite) und `npm run lint` laufen nur von Hand | Befund, s. [`TESTING.md`](TESTING.md) |
| **Fassung** | `package.json` 0.0.25, `release:patch`, `version.json` neben dem Bundle | [`VERSIONING.md`](VERSIONING.md) |

## Ist-Zustand des Bots

| Feld | Wert |
|---|---|
| Oekosysteme | npm (`package.json`, `package-lock.json`) |
| Bot + Config | Dependabot · [`.github/dependabot.yml`](../.github/dependabot.yml) (versioniert seit 04.08.2026, Commit 7a5b5f1) |
| PR-Basis | `main` (= Default-Branch, per `gh api repos/Godelmann/Godelmann-Chatbot` gemessen) |
| Cooldown | Patch **3 d** · Minor **7 d** · Major **14 d** (`cooldown.default-days/semver-minor-days/semver-major-days`); Sicherheits-Updates ohne Cooldown |
| Zeitplan | woechentlich Montag 06:00 Europe/Berlin, `open-pull-requests-limit: 5` |
| Auto-Merge | keiner (kein CI, das ein Auto-Merge absichern koennte); **Majors immer manuell** |
| Zuletzt geprueft | **09.09.2026** — offene Bot-PRs: **5** (= Limit, der Bot legt keine weiteren an) · offene Dependabot-Alerts: **0** |

## Befunde 09.09.2026

- **PR-Stau am Limit:** 5 offene Bot-PRs bei Limit 5 — neue Updates bleiben unsichtbar, bis die
  vorhandenen gemergt oder geschlossen sind. Entstauen ueber `/XODER-dependency-update --here`
  (Cooldown-Pflicht, Majors manuell, Range-erhalten-Regel).
- **Kein CI:** Bot-PRs koennen nicht automatisch geprueft werden; jeder Merge braucht den manuellen
  Gate-Lauf (`npm run build && npm run lint`) auf dem Merge-Stand.

## Ausnahmen

- keine.
