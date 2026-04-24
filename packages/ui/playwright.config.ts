/**
 * Playwright config for Storybook visual regression.
 *
 * Builds a static Storybook bundle, serves it on port 6007, and runs the
 * snapshot suite under `tests/visual/`. Baseline PNGs live next to the tests
 * in `__snapshots__/` and are checked into git. See ADR-017.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/__snapshots__',
  // Drop Playwright's default `-{platform}` suffix on baselines — we commit
  // a single canonical set and rely on Chromium rendering identically on
  // macOS and Linux (CI). The 1% `maxDiffPixelRatio` below absorbs the
  // sub-pixel jitter that does occur.
  snapshotPathTemplate: '{snapshotDir}/{testFileName}-snapshots/{arg}{ext}',
  webServer: {
    // `http-server` preserves Storybook's `/iframe.html` URL scheme (vs
    // `serve` which 301-strips `.html`). `-c-1` disables its default 1 h
    // cache so re-runs always hit a fresh bundle.
    command: 'pnpm build-storybook && npx --yes http-server storybook-static -p 6007 -c-1 -s',
    url: 'http://localhost:6007',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:6007' },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
});
