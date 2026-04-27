/**
 * useMedia tests — Phase B1 (audit M-1 PR 5.5-T01).
 *
 * Verifies that the Tamagui `useMedia()` hook resolves Cachink's
 * `breakpoints` scale correctly at three viewport widths. Width is
 * driven by `setMockViewport(w)` from `../responsive/match-media-mock`,
 * which fires every registered Tamagui media listener so the
 * media-state store re-evaluates against the new width.
 *
 * Coverage matrix:
 *   - 360 px (phone portrait) → only `sm` is true
 *   - 800 px (tablet landscape) → `gtSm` + `gtMd` are true
 *   - 1400 px (wide desktop) → `gtSm`, `gtMd`, and `gtLg` are true
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { useMedia } from '@tamagui/core';
import { renderWithProviders, screen } from '../test-utils';
import { resetMockViewport, setMockViewport } from '../responsive/match-media-mock';

interface MediaProbeProps {
  readonly testID: string;
}

function MediaProbe({ testID }: MediaProbeProps): ReactElement {
  const media = useMedia();
  // Stringify only the four Cachink keys so unrelated Tamagui-internal
  // keys don't leak into the assertion.
  const snapshot = JSON.stringify({
    sm: Boolean(media.sm),
    gtSm: Boolean(media.gtSm),
    gtMd: Boolean(media.gtMd),
    gtLg: Boolean(media.gtLg),
  });
  return <div data-testid={testID}>{snapshot}</div>;
}

afterEach(() => {
  resetMockViewport();
});

describe('useMedia — Cachink breakpoint contract', () => {
  it('phone portrait (360 px) sets only `sm`', () => {
    setMockViewport(360);
    renderWithProviders(<MediaProbe testID="media-phone" />);
    const snapshot = JSON.parse(screen.getByTestId('media-phone').textContent ?? '{}');
    expect(snapshot.sm).toBe(true);
    expect(snapshot.gtSm).toBe(false);
    expect(snapshot.gtMd).toBe(false);
    expect(snapshot.gtLg).toBe(false);
  });

  it('tablet landscape (800 px) sets `gtSm` and `gtMd` (and clears `sm`)', () => {
    setMockViewport(800);
    renderWithProviders(<MediaProbe testID="media-tablet" />);
    const snapshot = JSON.parse(screen.getByTestId('media-tablet').textContent ?? '{}');
    expect(snapshot.sm).toBe(false);
    expect(snapshot.gtSm).toBe(true);
    expect(snapshot.gtMd).toBe(true);
    expect(snapshot.gtLg).toBe(false);
  });

  it('wide desktop (1400 px) sets `gtSm`, `gtMd`, and `gtLg` (cumulative ladder)', () => {
    setMockViewport(1400);
    renderWithProviders(<MediaProbe testID="media-desktop" />);
    const snapshot = JSON.parse(screen.getByTestId('media-desktop').textContent ?? '{}');
    expect(snapshot.sm).toBe(false);
    expect(snapshot.gtSm).toBe(true);
    expect(snapshot.gtMd).toBe(true);
    expect(snapshot.gtLg).toBe(true);
  });
});
