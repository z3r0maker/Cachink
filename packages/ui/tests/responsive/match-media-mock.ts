/**
 * Width-aware `window.matchMedia` mock for `useMedia()` tests.
 *
 * Pair with `./install-match-media-mock` (the side-effect installer
 * imported by `tests/setup.ts`). The installer wires
 * `window.matchMedia` to read from this module's mutable
 * `currentWidth`; tests call `setMockViewport(w)` to update the
 * width and fan out to every Tamagui listener so `useMedia()` keys
 * re-evaluate.
 *
 * Usage:
 *
 *   import { setMockViewport } from '../responsive/match-media-mock';
 *
 *   it('renders side-by-side on tablet landscape', () => {
 *     setMockViewport(800);
 *     // …render and assert
 *   });
 *
 * The default width is 0 (phone portrait) so the mock matches
 * Tamagui's `matches: false` fallback the first time
 * `setupMediaListeners()` runs.
 */

import { act } from '@testing-library/react';

let currentWidth = 0;

interface RegisteredListener {
  readonly query: string;
  readonly callback: () => void;
}

const listeners: RegisteredListener[] = [];

/** Read the current mock width (used by `install-match-media-mock`). */
export function _currentWidth(): number {
  return currentWidth;
}

/**
 * Register a listener for a matchMedia query. Tamagui uses
 * `addListener` (the legacy API) on each query result.
 */
export function registerListener(query: string, callback: () => void): void {
  listeners.push({ query, callback });
}

export function unregisterListener(query: string, callback: () => void): void {
  const idx = listeners.findIndex((l) => l.query === query && l.callback === callback);
  if (idx >= 0) {
    listeners.splice(idx, 1);
  }
}

/**
 * Fire every registered listener. Tamagui's `setupMediaListeners`
 * registers an `update` callback per query; firing them all causes
 * Tamagui to re-evaluate `getMatch().matches` against the fresh
 * `currentWidth` and update its internal media state.
 */
export function fireListeners(): void {
  for (const { callback } of listeners) {
    callback();
  }
}

/**
 * Evaluate a `(min-width: …px)` / `(max-width: …px)` media query
 * against a width. Tamagui's `mediaObjectToString` produces queries
 * with at most one `min-width` and one `max-width` clause joined by
 * ` and `, so this string-parser is sufficient for every Cachink
 * breakpoint.
 */
export function evaluateQuery(query: string, width: number): boolean {
  const minMatch = query.match(/min-width:\s*(\d+)px/);
  const maxMatch = query.match(/max-width:\s*(\d+)px/);
  let result = true;
  if (minMatch !== null) {
    result = result && width >= Number(minMatch[1]);
  }
  if (maxMatch !== null) {
    result = result && width <= Number(maxMatch[1]);
  }
  return result;
}

/**
 * Set the mock viewport width and fire every Tamagui listener so the
 * media-state store re-evaluates. Wrapped in `act(...)` so React
 * flushes the resulting re-renders synchronously inside the test.
 */
export function setMockViewport(width: number): void {
  currentWidth = width;
  act(() => {
    fireListeners();
  });
}

/**
 * Reset the mock to its default phone-portrait width. Listeners are
 * **not** cleared because Tamagui registers them once at config-init
 * time (`setupMediaListeners` runs from `tamagui.config.ts`), and
 * removing them would silence every subsequent `setMockViewport`
 * call within the same test process. Use only when fully tearing
 * down the test environment.
 */
export function resetMockViewport(): void {
  setMockViewport(0);
}
