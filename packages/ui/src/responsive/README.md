# `@cachink/ui` Responsive Contract

> The breakpoint contract that governs every responsive decision in
> `packages/ui`. Read this before adding any width-conditional layout.

This document is the source of truth for **how Cachink decides between
phone, tablet, and desktop layouts**. Every responsive primitive
(`<SplitPane>`, the Director Home grid, future split-list-detail screens)
routes through these rules.

---

## TL;DR

```ts
import { useMedia } from '@tamagui/core';

function MyScreen() {
  const media = useMedia();
  if (media.gtMd) return <TabletLandscapeLayout />;
  return <PhoneLayout />;
}
```

Use `media.gtMd` for "tablet-landscape and bigger" decisions. That covers
~80 % of Phase 1's responsive needs.

---

## The breakpoints

The scale lives in [`packages/ui/src/theme.ts`](../theme.ts) under the
`breakpoints` constant. **Do not hardcode pixel widths anywhere else.**

| Range (px width) | Tamagui key | Form factor                                 |
| ---------------- | ----------- | ------------------------------------------- |
| 0 – 480          | `sm`        | Phone portrait (iPhone, small Android)      |
| 481 – 768        | `gtSm`      | Phone landscape, small tablet portrait      |
| 769 – 1280       | `gtMd`      | **Tablet landscape, iPad Pro 11", desktop** |
| 1281+            | `gtLg`      | Wide desktop, iPad Pro 12.9" landscape      |

The `gt*` ("greater-than") prefix mirrors Tamagui's convention: `gtMd` is
"greater than the medium breakpoint", i.e. tablet landscape and up.

### Cumulative ladder

The `gt*` keys form a **cumulative ladder**: at 1500 px viewport width,
`gtSm`, `gtMd`, and `gtLg` are all `true`. `sm` is the only exclusive
key — it only applies under 481 px.

Components decide on the **highest-applicable key**, not on exact
ranges:

```ts
const media = useMedia();
// ✅ Pick the most specific layout you have a design for
if (media.gtLg) return <UltraWideLayout />;
if (media.gtMd) return <TabletLandscapeLayout />;
if (media.gtSm) return <PhoneLandscapeLayout />;
return <PhonePortraitLayout />;
```

---

## When to branch on which key

| Need                                                       | Key             |
| ---------------------------------------------------------- | --------------- |
| Stack vertically on phones, side-by-side on tablet/desktop | `gtMd`          |
| Director Home grid: 1 / 2 / 3 columns                      | `gtSm` / `gtMd` |
| Show a sidebar drawer (vs bottom-tab nav)                  | `gtMd`          |
| Split-pane list-left / detail-right                        | `gtMd`          |
| Phone-only override (e.g. force single column)             | `sm`            |
| Wide desktop (4-column dashboards)                         | `gtLg`          |

### Don't

- ❌ **Don't** use raw window measurements (`Dimensions.get('window').width`).
  That bypasses Tamagui's reactive system; the layout won't update on
  rotation.
- ❌ **Don't** invent new breakpoint values inline (`width >= 800` etc).
  If a screen needs a different threshold, add a new key to
  `breakpoints` in `theme.ts` first.
- ❌ **Don't** use `gtSm` for split-pane mounts. The 481-px boundary is
  too narrow — at that width the panes squeeze inputs / buttons. Use
  `gtMd` (the 769-px tablet-landscape threshold) instead.
- ❌ **Don't** mix `useMedia()` with media-query CSS. Tamagui's
  `useMedia()` is the only sanctioned source of truth. CSS media
  queries don't propagate to React Native and will diverge between
  platforms.

### Do

- ✅ **Do** call `useMedia()` once near the top of the component and
  destructure the keys you need.
- ✅ **Do** always provide a phone-portrait fallback. Cachink ships
  on phones; the `else`-branch must work.
- ✅ **Do** test responsive components at every breakpoint in
  Storybook (`<Story args={{ width: 480 }} />`, etc).

---

## How it's wired

`tamagui.config.ts` consumes the `breakpoints` constant from `theme.ts`
and exposes it as the `media` setting on `createTamagui`:

```ts
const media = {
  sm: { maxWidth: breakpoints.gtSm - 1 },
  gtSm: { minWidth: breakpoints.gtSm },
  gtMd: { minWidth: breakpoints.gtMd },
  gtLg: { minWidth: breakpoints.gtLg },
};
```

`useMedia()` reads from a Tamagui-internal store that subscribes to
viewport-resize events on web and `Dimensions` change events on native.
Any component that calls `useMedia()` re-renders when a key flips.

---

## Testing

Tests for components that use `useMedia()` need to mock the viewport.
The canonical pattern is:

```ts
import { matchMediaMock } from '../../testing/match-media-mock';

test('renders side-by-side on tablet landscape', () => {
  matchMediaMock(800); // viewport width in px
  render(<MyScreen />);
  expect(screen.getByTestId('split-pane-right')).toBeInTheDocument();
});
```

The helper sets `window.matchMedia` for jsdom and triggers a Tamagui
re-evaluation. See `tests/perf/use-media.test.tsx` for a worked
example.

---

## References

- CLAUDE.md §1 — tablet portrait is the primary form factor.
- CLAUDE.md §5 — cross-platform component rules; one implementation per
  component, responsive via Tamagui tokens.
- ROADMAP.md M-1-PR5.5-T01 — the audit task this contract closes.
- The April 2026 mobile-first UI/UX audit, sections 4.3 (responsive
  density) + 4.4 (split-pane on tablet landscape).
- [`packages/ui/src/theme.ts`](../theme.ts) — `breakpoints` constant.
- [`packages/ui/src/tamagui.config.ts`](../tamagui.config.ts) — `media`
  wiring.
- [`packages/ui/src/components/SplitPane/`](../components/SplitPane/) —
  the canonical primitive that uses `gtMd`.
