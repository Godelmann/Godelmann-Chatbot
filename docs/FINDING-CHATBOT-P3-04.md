# CHATBOT-P3-04: dgx-Proxy user_id-Spoofing nur durch ENV SPASS_JWT_VERIFY=enforce verhindert — Fail-open-Default (JwtVerifyMode::Off)

| | |
|---|---|
| **Projekt** | CHATBOT |
| **Schweregrad** | P3 |
| **Bereich** | spass-dgx routes.rs + spass-auth jwt.rs (Fail-open Default) |
| **Entdeckt** | 2026-07-02 (Multi-Agent Gap-Audit, 2. Pass) |
| **Status** | OPEN |
| **Verdict** | PLAUSIBLE |

## Befund
Der dgx-Proxy leitet die User-Identity als SPASS-User-Id upstream weiter, abgeleitet aus der JWT-sub-Claim via extract_user_id, das die Signatur bewusst NICHT verifiziert. Die einzige Absicherung ist die jwt_verify_middleware, die nur bei jwt_mode==Enforce eine ungueltige Signatur ablehnt. JwtVerifyMode::from_env defaultet auf Off (spass-auth/src/jwt.rs:95-116: '_ => Self::Off', #[default] Off), und build_dgx_state im godelmann-gocreate-server faellt bei fehlendem SUPABASE_JWT_SECRET still auf Off zurueck (examples/godelmann-gocreate-server/src/main.rs:112-114 'mode ... aber SUPABASE_JWT_SECRET fehlt -> off'). Live-Check bestaetigt: GoCreate Test (10.0.0.4) UND Prod (49.12.77.51) haben SPASS_JWT_VERIFY=<set> + SUPABASE_JWT_SECRET=<set> -> aktuell mitigiert, KEIN Live-Leck. Aber die gesamte Cross-User-Absicherung (Cost-Attribution, Rate-Limiting, Conversation-Ownership auf dgx via SPASS-User-Id) haengt an einer einzelnen ENV mit unsicherem Default; ohne enforce koennte ein Client ein JWT mit beliebiger sub-Claim basteln und einen anderen User impersonieren. Empfehlung: bei gesetztem SUPABASE_JWT_SECRET Enforce erzwingen bzw. beim Deploy als Pflicht-Gate pruefen (Fail-closed statt Fail-open).

## Beleg
spass-auth/src/jwt.rs:95-116 (Default=Off, '_ => Self::Off'); examples/godelmann-gocreate-server/src/main.rs:112-114 (Fallback auf Off bei fehlendem Secret); SSH gocreate test+prod /opt/gocreate/.env: SPASS_JWT_VERIFY=<set> + SUPABASE_JWT_SECRET=<set> (mitigiert)

## Fix-Vorschlag
(siehe Befund oben)

## Referenzen
- [docs/BACKLOG.md](BACKLOG.md)
