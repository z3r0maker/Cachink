# packages/ui/src/assets

Brand-art files consumed by components inside `@cachink/ui`.

## Rules

- **One copy only.** Per CLAUDE.md §2.3 ("code lives in exactly one place")
  and §5 (cross-platform component rules), shared UI assets live here and
  nowhere else in the monorepo. Do **not** copy `logo.png` into
  `apps/mobile/assets/` or `apps/desktop/src/`.
- **Source-of-truth is `assets/brand/` at the repo root.** Files here are
  derivatives produced by `cp assets/brand/<file>.png packages/ui/src/assets/<file>.png`.
  Never edit them in place.

## Files

| File | Consumed by | Phase |
|---|---|---|
| `logo.png` | `<BrandLogo />` — to be built in `packages/ui/src/components/BrandLogo/` | Phase 1A-M2 |

## Why this directory exists before the component

The PNG is staged here during Phase 0 so that when `<BrandLogo />` is built
in Phase 1A, the asset is already in the correct place. This prevents the
common mistake of re-importing the same logo into each app's native asset
folder. Any agent tempted to do that: re-read CLAUDE.md §5.1 first.

See `ARCHITECTURE.md` ADR-016 — Brand asset management strategy.
