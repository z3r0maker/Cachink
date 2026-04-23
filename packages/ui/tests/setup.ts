/**
 * Vitest setup file for `@cachink/ui`.
 *
 * Loaded once before any test file. Imports the Tamagui config so
 * `createTamagui(...)` runs at module-eval time and Tamagui's global
 * config registry is populated before any component renders.
 *
 * Also wires `@testing-library/jest-dom` matchers (`toBeInTheDocument`,
 * `toHaveTextContent`, etc.) into Vitest's `expect`.
 */

import '@testing-library/jest-dom/vitest';
import '../src/tamagui.config';
