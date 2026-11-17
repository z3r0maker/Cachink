# packages/ui/src/assets

Brand-art files consumed by components inside `@xangarro/ui`.

## Rules

- **One copy only.** Per CLAUDE.md §2.3 ("code lives in exactly one place")
  and §5 (cross-platform component rules), shared UI assets live here and
  nowhere else in the monorepo. Do **not** copy them into
  `apps/mobile/assets/`.
- **Source-of-truth is `assets/brand/` at the repo root.** Files here are
  derivatives produced by `cp assets/brand/<file>.png packages/ui/src/assets/<file>.png`.
  Never edit them in place.

## Files

| File                       | Consumed by                                                           | Phase     |
| -------------------------- | --------------------------------------------------------------------- | --------- |
| `role-director-dark.png`   | `<RoleIllustration>` in `AppShell` (Director on yellow bg fallback)   | Audit M-1 |
| `role-director-light.png`  | `<RoleIllustration>` in `AppShell` (Director on dark bg)              | Audit M-1 |
| `role-operativo-dark.png`  | `<RoleIllustration>` in `AppShell` (Operativo on yellow bg)           | Audit M-1 |
| `role-operativo-light.png` | `<RoleIllustration>` in `AppShell` (Operativo on dark bg fallback)    | Audit M-1 |
| `don/*.webp`               | `<Don>` — copies of `apps/web/src/components/don/poses/` (same names) | M-03      |

The brand logo is the coin in `assets/brand/icons/` (2026-11-17); no
component here needs a separate logo file.

See `ARCHITECTURE.md` ADR-016 — Brand asset management strategy.
