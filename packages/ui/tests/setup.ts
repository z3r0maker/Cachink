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
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '../src/tamagui.config';

afterEach(() => {
  cleanup();
});
