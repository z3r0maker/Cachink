/**
 * Install a width-aware `window.matchMedia` mock BEFORE Tamagui's
 * `matchMedia.mjs` is first imported.
 *
 * Tamagui captures `window.matchMedia` once at module-init time
 * (see `node_modules/@tamagui/web/dist/esm/helpers/matchMedia.mjs`).
 * jsdom does not provide `matchMedia` by default, so without this
 * mock Tamagui falls back to a stub that always returns
 * `matches: false` — `useMedia()` would never resolve any breakpoint
 * key true.
 *
 * This module is a **side-effect import**: its top-level statements
 * install the mock the moment the module is first evaluated. Tests
 * that need to drive viewport width call `setMockViewport(w)` from
 * `./match-media-mock`. The default starting width is 0 (phone
 * portrait) so the mock matches Tamagui's fallback behaviour at
 * config time.
 */

import {
  _currentWidth,
  evaluateQuery,
  fireListeners,
  registerListener,
  unregisterListener,
} from './match-media-mock';

if (typeof window !== 'undefined' && typeof (window as Window).matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: function matchMediaShim(query: string): MediaQueryList {
      const mql: Partial<MediaQueryList> & {
        match?: (a: string, b: string) => boolean;
        addListener: (cb: () => void) => void;
        removeListener: (cb: () => void) => void;
      } = {
        media: query,
        get matches(): boolean {
          return evaluateQuery(query, _currentWidth());
        },
        onchange: null,
        addListener(cb: () => void): void {
          registerListener(query, cb);
        },
        removeListener(cb: () => void): void {
          unregisterListener(query, cb);
        },
        addEventListener(_type: string, cb: EventListener): void {
          registerListener(query, cb as () => void);
        },
        removeEventListener(_type: string, cb: EventListener): void {
          unregisterListener(query, cb as () => void);
        },
        dispatchEvent(_ev: Event): boolean {
          fireListeners();
          return true;
        },
      };
      return mql as MediaQueryList;
    },
  });
}
