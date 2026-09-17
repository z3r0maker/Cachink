/**
 * useKeyboardHeight — how far the soft keyboard covers the bottom of the
 * screen, so bottom sheets can sit above it (A-16: on the iPad the keyboard
 * covered the whole Cancelar venta sheet, title and submit included).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Keyboard } from 'react-native';
import { act, renderHook } from '@testing-library/react';
import { useKeyboardHeight } from '../src/hooks/use-keyboard-height';

type Handler = (e: { endCoordinates: { height: number } }) => void;

function captureListeners(): Map<string, Handler> {
  const handlers = new Map<string, Handler>();
  vi.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, cb: Handler) => {
    handlers.set(event, cb);
    return { remove: () => handlers.delete(event) };
  }) as never);
  return handlers;
}

describe('useKeyboardHeight', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is 0 while no keyboard is shown', () => {
    captureListeners();
    const { result } = renderHook(() => useKeyboardHeight());
    expect(result.current).toBe(0);
  });

  it('reports the keyboard height when it shows and 0 when it hides', () => {
    const handlers = captureListeners();
    const { result } = renderHook(() => useKeyboardHeight());
    const show = [...handlers.entries()].find(([k]) => k.includes('Show'))![1];
    const hide = [...handlers.entries()].find(([k]) => k.includes('Hide'))![1];
    act(() => show({ endCoordinates: { height: 420 } }));
    expect(result.current).toBe(420);
    act(() => hide({ endCoordinates: { height: 0 } }));
    expect(result.current).toBe(0);
  });

  it('removes its listeners on unmount', () => {
    const handlers = captureListeners();
    const { unmount } = renderHook(() => useKeyboardHeight());
    expect(handlers.size).toBe(2);
    unmount();
    expect(handlers.size).toBe(0);
  });
});
