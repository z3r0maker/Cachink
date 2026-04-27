# TestFlight beta setup

_Human-gated task — the agent lands this doc as the runbook._

## One-time

1. **Apple Developer account** — $99/year. Enrol the `mx.cachink` team.
2. **App Store Connect** — create the "Cachink!" record with bundle
   identifier `mx.cachink.mobile`.
3. **Certificates** — EAS Build handles these automatically (`eas
credentials`). No manual p12 juggling required.

## Per build

1. Run `eas build -p ios --profile preview`. EAS produces a signed
   `.ipa` bundled for internal distribution.
2. `eas submit -p ios --latest` uploads it to TestFlight.
3. In App Store Connect → TestFlight, add the beta testers' emails
   from `docs/beta/invitees.csv`.
4. Apple auto-emails the TestFlight invitation.

## Invitee CSV template

```csv
email,first_name,last_name,role
maria@ejemplo.mx,María,Pérez,emprendedora
juan@ejemplo.mx,Juan,López,emprendedor
```

## Collecting feedback

Testers can send feedback directly from the app via **Ajustes → Enviar
comentarios** (P1F-M3 C9). That action composes a `mailto:` to
`feedback@cachink.mx` with the app version + last 10 breadcrumbs
(only if Sentry consent was granted, per ADR-027).

## Closing the beta

When the beta ends, archive the build in App Store Connect. Nothing
to uninstall — TestFlight removes itself after 90 days of inactivity.
