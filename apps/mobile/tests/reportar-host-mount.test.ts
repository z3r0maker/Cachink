import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

/**
 * Where the report sheet's host is mounted (M-23). `AppProviders` renders
 * `overlays` outside `ActivationProvider` and `CloudSyncBridge`: a host put
 * there has no device token, so every report «could not be sent», and no sync
 * state, so nothing waiting ever leaves. Maestro caught it on a simulator;
 * this pins the mount so a tidy-up does not move it back.
 */
const layout = readFileSync(new URL('../src/app/_layout.tsx', import.meta.url), 'utf8');

describe('the report sheet host in the root layout', () => {
  it('is mounted beside the navigator, inside the providers', () => {
    const stack = layout.indexOf('<MobileStack />', layout.indexOf('function MobileApp'));
    const host = layout.indexOf('<ReportarSheetHost />');
    assert.ok(stack > 0 && host > stack, 'the host follows the navigator as its sibling');
  });

  it('is not one of the overlays', () => {
    const start = layout.indexOf('overlays={');
    const end = layout.indexOf('</>', start);
    assert.ok(start > 0 && end > start);
    assert.equal(layout.slice(start, end).includes('ReportarSheetHost'), false);
  });
});
