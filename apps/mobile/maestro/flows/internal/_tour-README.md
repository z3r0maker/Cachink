# Fold-audit screen tours

Each `tour-*.yaml` navigates to ONE screen and stops. They exist so the fold
audit can compare the SAME screen across form factors without depending on the
full regression suite being green — a feature flow that fails halfway leaves the
app on an arbitrary screen, which makes a cross-device diff meaningless.

Kept in flows/internal/ so they are excluded from `flows/*.yaml` globs and from
full-regression.sh's run_flow discovery.

Precondition: demo data seeded (demo-mode-setup.yaml), app at QuickSwitch.
