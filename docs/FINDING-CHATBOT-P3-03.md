# CHATBOT-P3-03: /projects/CLAUDE.md Submodule-Liste ergaenzen

| | |
|---|---|
| **Projekt** | CHATBOT |
| **Schweregrad** | P3 |
| **Bereich** | Dokumentation / Submodules |
| **Entdeckt** | 2026-07-02 (Multi-Agent-Audit) |
| **Status** | OPEN |

## Symptom
Die Submodule-Aufzählung in `/projects/CLAUDE.md` (Abschnitt platform-control) endet bei `godelmann-gravelli-salone`. Die tatsächlich registrierten Submodule `godelmann-chatbot` und `frahcs-mobilien` fehlen in der Aufzählung, obwohl beide als eigenständige Frontends existieren und in `.gitmodules` sowie in `platform-control/CLAUDE.md` gelistet sind.

## Root Cause
Die Zeile mit der Submodule-Liste in `/projects/CLAUDE.md` wurde beim Hinzufügen der beiden neueren Frontends nicht nachgezogen. Die Doku ist gegenüber `.gitmodules` (Single Source of Truth der Submodule-Registrierung) veraltet.

## Beleg
`/projects/CLAUDE.md:47`:
```
- Submodules: platform-frontend, platform-backend (Root), canari-me, companies-cockpit, godelmann-gocreate, godelmann-gravelli, godelmann-gravelli-salone (`frontends/`)
```
Registrierte, aber nicht aufgeführte Submodule in `/projects/platform-control/.gitmodules`:
```
29:[submodule "frontends/godelmann-chatbot"]
30:	path = frontends/godelmann-chatbot
41:[submodule "frontends/frahcs-mobilien"]
42:	path = frontends/frahcs-mobilien
```

## Auswirkung
Rein dokumentarisch, keine Laufzeit-/Sicherheitsfolge. Für Test und Prod ohne Wirkung. Konsequenz: Onboarding-/Übersichtsdoku ist unvollständig; Claude-Agenten und Menschen erhalten aus `/projects/CLAUDE.md` ein unvollständiges Bild der Submodule-Struktur, was zu übersehenen Frontends bei repo-weiten Arbeiten führen kann.

## Reproduktion
1. `grep -n "Submodules:" /projects/CLAUDE.md` → Zeile 47, endet bei `godelmann-gravelli-salone`.
2. `grep -n "chatbot\|frahcs" /projects/platform-control/.gitmodules` → beide Submodule vorhanden.
3. Differenz sichtbar: 2 Submodule fehlen in der Doku.

## Fix-Vorschlag
Zeile 47 in `/projects/CLAUDE.md` um die beiden fehlenden Frontends erweitern:
```
- Submodules: platform-frontend, platform-backend (Root), canari-me, companies-cockpit, godelmann-gocreate, godelmann-gravelli, godelmann-gravelli-salone, godelmann-chatbot, frahcs-mobilien (`frontends/`)
```
Kein Deploy, keine Migration nötig — reine Doku-Änderung. Optional: `.gitmodules` als Referenz gegenprüfen, damit die Liste künftig bei jedem neuen Submodule synchron gehalten wird.

## Referenzen
- [docs/BACKLOG.md](BACKLOG.md)
- `/projects/CLAUDE.md:47` (Submodule-Liste)
- `/projects/platform-control/.gitmodules:29,41` (registrierte Submodule)
- `/projects/platform-control/CLAUDE.md` (vollständige Submodule-Registrierung)
