# CHATBOT-P2-02: CLAUDE.md Tech-Stack an Ist-Stand angleichen

| | |
|---|---|
| **Projekt** | CHATBOT |
| **Schweregrad** | P2 |
| **Bereich** | Dokumentation / Tech-Stack |
| **Entdeckt** | 2026-07-02 (Multi-Agent-Audit) |
| **Status** | OPEN |

## Symptom
`CLAUDE.md` beschreibt einen Tech-Stack, der im Repo nicht existiert. Zeile 13 nennt „React 18 + Vite + TypeScript + Tailwind + shadcn/ui + SPASS", Zeile 14 „Shared Supabase mit GoCreate (Port 8010)". Tatsaechlich laeuft das Projekt auf React 19.2.4, ohne Tailwind, ohne shadcn/ui, ohne SPASS-Anbindung; `src/` ist unveraendertes Vite-Counter-Template. Eine Supabase-/GoCreate-Anbindung ist nirgends im Code vorhanden.

## Root Cause
Die `CLAUDE.md` wurde als Zielbild/Vorlage aus den bestehenden Godelmann-Frontends (GoCreate, Gravelli) uebernommen, aber das Repo befindet sich noch im Scaffold-Zustand (frischer Vite-React-TS-Init). Die Doku wurde nicht als „geplant" markiert und weicht damit vom Ist-Stand ab.

## Beleg
`CLAUDE.md`:
```
13: - React 18 + Vite + TypeScript + Tailwind + shadcn/ui + SPASS
14: - Shared Supabase mit GoCreate (Port 8010)
```

`package.json` (tatsaechliche Dependencies — kein Tailwind/shadcn/SPASS/Supabase, React 19):
```
"dependencies": {
  "react": "^19.2.4",
  "react-dom": "^19.2.4"
}
```
devDependencies enthalten nur `@vitejs/plugin-react`, `vite ^8.0.1`, `typescript ~5.9.3`, ESLint — keine `tailwindcss`, keine `@radix-ui`/shadcn-Pakete, kein `@supabase/*`, kein SPASS-Client.

`src/`-Inhalt (Vite-Counter-Template, kein App-Code):
```
App.css  App.tsx  assets/  index.css  main.tsx
```
`src/App.tsx` (Datum 2026-03-30, unveraendert seit Scaffold) enthaelt die Vite-Zaehler-Demo, keine Chat-Widget-, Tailwind- oder Supabase-Logik.

## Auswirkung
Keine Sicherheits- oder Laufzeitfolge (Doku-only, kein Deploy). Betrieblich irrefuehrend: Agenten und Entwickler treffen falsche Annahmen (z. B. Tailwind-Klassen, shadcn-Komponenten, SPASS-Tunnel, Supabase-Port 8010 als vorhanden), was zu Fehlgriffen bei kuenftiger Arbeit fuehrt. Betrifft ausschliesslich das Repo, keine Test-/Prod-Stage (das Frontend ist noch nicht deployt).

## Reproduktion
1. `grep -n "React\|Tailwind\|shadcn\|SPASS\|8010" CLAUDE.md` → nennt Stack aus Zeile 13/14.
2. `grep -A3 '"dependencies"' package.json` → nur `react`/`react-dom` 19.2.4.
3. `ls src/` → Vite-Template-Dateien, kein Chat-/Supabase-Code.

## Fix-Vorschlag
Zwei gleichwertige Optionen — Entscheidung durch Projektverantwortlichen:

- **Option A (Zielbild kennzeichnen, empfohlen)**: Zeile 13/14 in `CLAUDE.md` unter eine Ueberschrift „Geplanter Tech-Stack (Zielbild)" verschieben und den Ist-Stand explizit ergaenzen:
  ```
  ## Ist-Stand (2026-07-02)
  - React 19.2.4 + Vite 8 + TypeScript 5.9 (Vite-Scaffold)
  - Noch KEIN Tailwind / shadcn/ui / SPASS / Supabase angebunden

  ## Zielbild
  - React + Vite + TypeScript + Tailwind + shadcn/ui + SPASS
  - Shared Supabase mit GoCreate (Port 8010)
  ```
- **Option B (auf Ist-Stand korrigieren)**: Zeile 13 auf „React 19 + Vite + TypeScript (Scaffold)" aendern und Zeile 14 (Supabase/GoCreate 8010) entfernen, bis eine Anbindung tatsaechlich existiert.

Reine Doku-Aenderung — keine Migration, kein Deploy erforderlich.

## Referenzen
- [docs/BACKLOG.md](BACKLOG.md)
- `CLAUDE.md` Zeile 13–14
- `package.json` (Ist-Dependencies), `src/App.tsx` (Scaffold-Beleg)
