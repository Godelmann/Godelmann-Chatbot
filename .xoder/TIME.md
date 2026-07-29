# TIME.md — Zeit, Zeitzonen & NTP (Godelmann-Chatbot)

> **XODER-Pflichtdokument.** SSoT fuer *jede* zeitbezogene Einstellung dieses Repos: OS-/Komponenten-
> Zeitzonen, NTP-Sync und **wann zuletzt validiert**. Dieses Repo ist ein **Browser-Widget** ohne eigene
> Uhr; zeitrelevant ist nur der Backend-Dienst `godelmann-chatbot-server` auf den geteilten Godelmann-Hosts.
>
> **Letzte Voll-Validierung: 2026-07-29** (Ist-Stand von den geteilten Hosts uebernommen; der Chatbot-Server
> teilt sich die Hosts mit GoCreate — SSoT dort: [`../../GoCreate/.xoder/TIME.md`](../../GoCreate/.xoder/TIME.md)).
> Naechste Pflicht-Validierung: **bei jedem Provisioning/Server-Wechsel**, sonst **quartalsweise**.

## 1. Grundsatz / Zielbild

Der Godelmann-Chatbot besteht aus **zwei** Teilen mit unterschiedlichem Zeitbezug:

| Teil | Zeitzone | Warum |
|---|---|---|
| **Widget** (`dist/chatbot-widget.v1.js`, Browser-ES-Modul) | **client-seitig** (Browser-Locale des Besuchers) | Keine eigene Uhr; Zeitstempel im Chatverlauf werden vom Browser lokal formatiert. Kein Server-TZ-Einfluss. |
| **`godelmann-chatbot-server`** (SPASS, Rust, :3011) | **UTC** (kein TZ-Pin) | Rust rechnet intern in UTC/`chrono`; laeuft auf Cloud-OS = UTC. Kein JVM-Default-TZ-Problem. |

> Der Chatbot hat **keine** serverseitigen Crons mit deutscher Wall-Clock. Die flottenweite
> „App-JVM = `Europe/Berlin`"-Pin-Regel ist **nicht anwendbar** (kein JVM, reiner UTC-Fall wie GoCreate).

**Zeitfenster im Server (alle wall-clock-relativ, TZ-unabhaengig):**
- **IP-Rate-Limit** 10 Nachrichten / **10 min** je IP — gleitendes Fenster auf `Instant`/monotone Uhr, keine TZ.
- **ALTCHA-Challenge** — kurzlebiges PoW, kein Kalenderbezug.
- **Contact-/Config-Cache** (`/api/contact`, `/api/webchat-config`) — **5-min-TTL**, monotone Uhr.
- **eval-Log-Zeitstempel** (`ai_log_entries`) — absolute **UTC**-Stempel (`created_at`), Anzeige lokal im GoCreate-Frontend.

## 2. Host-Inventar (Stand 2026-07-29)

Der Chatbot-Server laeuft als systemd-Unit `godelmann-chatbot.service` auf **denselben** Hosts wie GoCreate
(kein eigener Server). Zeit/NTP werden daher dort verwaltet:

| Host | Rolle | OS-TZ | NTP | Sync |
|---|---|---|---|---|
| **`platform-test`** (10.0.0.4, Hetzner nbg1; nur ueber control) | **TEST** (`godelmann-chatbot` :3011, `chatbot-test.godelmann.net`) | **`Etc/UTC`** | systemd-timesyncd [PRUEFEN: exakter Upstream] | ✅ ja |
| **`godelmann-prod`** (49.12.77.51, Hetzner fsn1) | **PROD** (`godelmann-chatbot` :3011, `chatbot.godelmann.net`) | **`Etc/UTC`** | systemd-timesyncd [PRUEFEN: exakter Upstream] | ✅ ja |

**Muster:** Cloud = UTC + `systemd-timesyncd` (Hetzner-Default `ntp.hetzner.com` erwartet — bei Bedarf
`timedatectl show-timesync` gegenpruefen). Das Server-Drop-in setzt **keine** `TZ`.

## 3. Re-Check-Kommandos

```bash
# OS-TZ + NTP-Sync je Host (2-Hop ueber control):
ssh -i ~/.ssh/cockpit_plus_ed25519 root@control.cockpit.plus 'ssh platform-test  "timedatectl"'
ssh -i ~/.ssh/cockpit_plus_ed25519 root@control.cockpit.plus 'ssh godelmann-prod "timedatectl"'
# Server-Unit-TZ (darf KEIN TZ= setzen):
ssh -i ~/.ssh/cockpit_plus_ed25519 root@control.cockpit.plus 'ssh platform-test "systemctl show godelmann-chatbot -p Environment"'
```

## 4. Offene Punkte

- [ ] **[PRUEFEN]** exakter NTP-Upstream je Host (`timedatectl show-timesync`) — im GoCreate-TIME.md
  gemeinsam pflegen (geteilte Hosts). Bisher Hetzner-Default angenommen, nicht live bestaetigt.
