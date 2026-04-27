/**
 * Vitest setup file for `@cachink/ui`.
 *
 * Loaded once before any test file. Imports the Tamagui config so
 * `createTamagui(...)` runs at module-eval time and Tamagui's global
 * config registry is populated before any component renders.
 *
 * Also wires `@testing-library/jest-dom` matchers (`toBeInTheDocument`,
 * `toHaveTextContent`, etc.) into Vitest's `expect`, and registers an
 * automatic DOM cleanup after every test — so portal-rendered components
 * (Modal / Dialog) don't leak previous renders and collide on shared
 * internal testIDs (`modal-close`, `modal-backdrop`, …).
 */

import '@testing-library/jest-dom/vitest';
// Install width-aware `window.matchMedia` BEFORE `tamagui.config` is
// imported. Tamagui captures the matchMedia function once at module-init
// time (see `node_modules/@tamagui/web/.../matchMedia.mjs`); without this
// pre-import jsdom returns `undefined` and Tamagui falls back to a stub
// that always reports `matches: false`. See `tests/responsive/README` for
// the full mock contract.
import './responsive/install-match-media-mock';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '../src/tamagui.config';

// React 18+ requires this flag to be true for `act(...)` to work without
// a "current testing environment is not configured to support act(...)"
// warning. @testing-library/react sets it automatically for `render(...)`,
// but `renderHook(...)` paths and bare `act(...)` calls outside a
// rendered tree need the flag set globally.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});
