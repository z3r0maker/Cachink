/**
 * useCachinkSound hook tests.
 *
 * Validates that the hook respects the `cachinkSoundEnabled` setting
 * and delegates to the injected player correctly.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { useCachinkSound } from '../../src/hooks/use-cachink-sound';

function makeMockPlayer() {
  return { play: vi.fn(), seekTo: vi.fn() };
}

describe('useCachinkSound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppConfigStore.setState({ cachinkSoundEnabled: true });
  });

  it('calls seekTo(0) and play() when sound is enabled', () => {
    const player = makeMockPlayer();
    const { result } = renderHook(() => useCachinkSound(player));
    act(() => result.current.play());
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it('does not play when cachinkSoundEnabled is false', () => {
    useAppConfigStore.setState({ cachinkSoundEnabled: false });
    const player = makeMockPlayer();
    const { result } = renderHook(() => useCachinkSound(player));
    act(() => result.current.play());
    expect(player.play).not.toHaveBeenCalled();
    expect(player.seekTo).not.toHaveBeenCalled();
  });

  it('does not play when no player is provided', () => {
    const { result } = renderHook(() => useCachinkSound(null));
    // Should not throw
    act(() => result.current.play());
  });

  it('seekTo is called before play for rapid re-triggers', () => {
    const player = makeMockPlayer();
    const { result } = renderHook(() => useCachinkSound(player));
    act(() => result.current.play());
    expect(player.seekTo).toHaveBeenCalledWith(0);
    const seekOrder = player.seekTo.mock.invocationCallOrder[0] ?? 0;
    const playOrder = player.play.mock.invocationCallOrder[0] ?? 0;
    expect(seekOrder).toBeLessThan(playOrder);
  });
});
