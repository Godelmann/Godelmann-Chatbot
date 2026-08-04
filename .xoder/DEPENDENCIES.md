# DEPENDENCIES.md — Godelmann-Chatbot

> Ebene: Repo. **Policy und Ausnahmen-Log** der Abhängigkeits-Pflege — *nicht* der
> Mechanismus. Der Mechanismus ist die Bot-Konfiguration (unten). Voller Prozess:
> node-weiter Skill `/XODER-dependency-update`.
>
> **Stand: 2026-08-04** (Erst-Einrichtung).

## Ökosystem

npm — `package-lock.json` — **ein** Lockfile, kein zweites daneben.

## Mechanismus (das Primäre)

| | |
|---|---|
| Bot | **Dependabot** — [`.github/dependabot.yml`](../.github/dependabot.yml) |
| Zeitplan | wöchentlich, montags 06:00 Europe/Berlin |
| PR-Basis | `main` (Default-Branch dieses Repos) |
| Offene PRs | höchstens 5 gleichzeitig |
| **Cooldown** | Patch **3 Tage** · Minor **7** · Major **14** — bei *Sicherheits*-Updates greift er bewusst **nicht** |
| Auto-Merge | **keiner.** Jeder PR wird gesehen und entschieden |

**Warum der Cooldown der eigentliche Schutz ist:** Ohne Wartezeit adoptiert man frisch
veröffentlichte Fassungen sofort — und genau in diesem Fenster liefen die npm-Lieferketten-Angriffe
2025 (chalk/debug am 08.09., Shai-Hulud am 11./12.09.; rund 2,5 Stunden bis zum Takedown). Ein Bot
ohne Cooldown ist deshalb kein Schutz, sondern ein automatischer Übernahmeweg.

**Warum Majors nie automatisch laufen:** Ein Major bricht per Definition etwas. Die PRs entstehen,
damit sie sichtbar sind — übernommen werden sie von Hand, nach Gates.

## Cadence

| Spur | Tempo |
|---|---|
| Sicherheit | Tage — cooldown-frei |
| Wartung (Lockfile-Auffrischung) | monatlich |
| Majors | bewusst, eigener Takt |

## Gates vor jedem Merge

```sh
npm run build   # = tsc --noEmit + Vite lib-Build, 0 Fehler
npm run lint    # 0 Errors
# Bundle-Gate: dist/chatbot-widget.v1.js < 80 kB gzip
```

## Run-Log — **nur Ausnahmen**

Routine-Merges stehen in git; hier nur, was zurückgestellt wurde, was gebrochen ist und welche
Majors von Hand kamen.

### 2026-08-04 — Erst-Einrichtung

- **Bot eingerichtet** (vorher keiner). **0 offene Meldungen** — das Widget hat bewusst kaum
  Abhängigkeiten (Vanilla TypeScript, kein Framework). Der Bot ist hier Vorsorge, keine Aufräumung.
