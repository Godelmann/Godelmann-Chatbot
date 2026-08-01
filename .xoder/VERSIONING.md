# VERSIONING — Godelmann-Chatbot

> **Ebene: Repo.** Wie die Fassung **dieser** Anwendung entsteht. Die verbindlichen Regeln für
> alle Godelmann-Anwendungen stehen org-weit in
> [`Godelmann/.xoder/VERSIONING.md`](../../.xoder/VERSIONING.md) — dieses Dokument wiederholt
> sie nicht, sondern nennt nur das Repo-Spezifische.
>
> **Stand: 2026-08-01.**

## Kurzfassung

| Punkt | Hier |
|---|---|
| Fassung steht in | `package.json` |
| Erhöhen | `npm run release:patch` |
| Build verändert die Fassung | **nein** (seit 01.08.2026) |
| Deploy erhöht die Fassung | **nein** — liefert aus, was im Repo steht |
| Ablesbar unter | `https://chatbot.godelmann.net/version.json` |

## Ablauf beim Ausliefern

```sh
# 1. fachliche Änderungen committen
npm run release:patch                     # 2. Fassung bewusst erhöhen (eigener Commit)
git push
# 3. auf control ausliefern:
./scripts/deploy-godelmann.sh chatbot [--prod]
```

Der Deploy meldet in der Abnahme die **ausgelieferte** Fassung zurück — stimmt sie nicht mit
der erwarteten überein, ist etwas schiefgegangen (Beleg 01.08.: so wurde ein wirkungsloser
Deploy entdeckt).

## Warum kein Auto-Bump mehr

Bis zum 01.08.2026 erhöhte `vite.config.ts` die Fassung bei **jedem** Build und sogar bei
`npm run dev`. Das brach die Reproduzierbarkeit, erzeugte Nummern ohne Aussagekraft und liess
test und Produktion bei identischem Code auseinanderlaufen. Begründung im Detail:
[`Godelmann/.xoder/VERSIONING.md`](../../.xoder/VERSIONING.md) §2.

## Verwandt

- [`DEPLOYMENT.md`](DEPLOYMENT.md) — wie ausgeliefert wird
- [`TESTING.md`](TESTING.md) — Gates dieser Anwendung
