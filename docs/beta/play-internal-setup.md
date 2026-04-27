# Google Play internal testing track

_Human-gated task — the agent lands this doc as the runbook._

## One-time

1. **Google Play Developer** account — one-time $25 fee.
2. Create the "Cachink!" app record with package name `mx.cachink.mobile`.
3. Choose "Tablets and phones" for device support.

## Service account (for EAS submit)

Create a Google Cloud service account with the **Release Manager**
role on the Cachink app. Export the JSON key to
`apps/mobile/fastlane/service-account.json`.

> ⚠️ **Never commit the JSON key.** It's listed in `.gitignore`.

## Per build

1. `eas build -p android --profile preview` — EAS produces an `.aab`.
2. `eas submit -p android --latest` uploads it to the internal testing
   track.
3. In Play Console → Testing → Internal testing, paste invitee emails
   or a Google group.

## Invitee CSV template

```csv
email,first_name,last_name,role
maria@ejemplo.mx,María,Pérez,emprendedora
juan@ejemplo.mx,Juan,López,emprendedor
```

## Feedback loop

Same `mailto:feedback@cachink.mx` flow as TestFlight. Play doesn't have
an equivalent in-track feedback widget.

## Promotion to Production

After ~2 weeks of internal testing and no P1 bugs, promote the build
from Internal → Production in Play Console → Releases.
