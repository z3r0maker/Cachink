# Third-Party Licenses

This file documents third-party assets bundled with Xangarro that are
not covered by the project's own license. It exists as a provenance
record — none of the licenses below require attribution, but we credit
contributors voluntarily.

---

## Sound Effects

### Cash Register Sale Sound

- **Files:**
  - `apps/mobile/assets/sounds/sale-confirm.mp3`
  - `packages/ui/src/assets/sounds/sale-confirm.mp3`
- **Author:** DRAGON-STUDIO
- **Source:** https://pixabay.com/sound-effects/cash-register-kaching-376867/
- **License:** [Pixabay Content License](https://pixabay.com/service/license-summary/)
  - Irrevocable, worldwide, non-exclusive, royalty-free
  - Free for commercial and non-commercial use
  - No attribution required (credited here voluntarily)
- **Downloaded:** 2026-05-14

---

## Map Data

### Mexico state boundaries (Natural Earth)

- **File:** `apps/backoffice/src/server/geo/mx-states.ts` (the `d` path strings)
- **Source:** Natural Earth, `ne_10m_admin_1_states_provinces`
  (https://www.naturalearthdata.com/), via
  https://github.com/nvkelso/natural-earth-vector
- **License:** Public domain (CC0)
  - "All versions of Natural Earth raster and vector map data found on this
    website are in the public domain. You may use the maps in any manner,
    including modifying the content and design."
  - No attribution required (credited here voluntarily)
- **Downloaded:** 2026-09-22
- **Modifications:** filtered to Mexico, the nameless `MX-X01~` placeholder
  feature dropped, `MX-DIF` remapped to the current `CMX`, small islands
  removed, simplified to 2% and projected to Lambert conformal conic. The exact
  `mapshaper` command is recorded at the top of `mx-states.ts`; mapshaper runs
  through `npx` and is not a dependency of any `package.json`.
