/**
 * ErrorToastStore tests — Zustand store for error toasts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErrorToastStore } from '../../src/observability/error-toast-store';

describe('useErrorToastStore', () => {
  beforeEach(() => {
    useErrorToastStore.getState().clear();
    vi.useFakeTimers();
  });

  it('starts with empty toasts', () => {
    expect(useErrorToastStore.getState().toasts).toHaveLength(0);
  });

  it('push adds an error toast', () => {
    useErrorToastStore.getState().push({
      message: 'Something went wrong',
      severity: 'error',
    });
    const toasts = useErrorToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.message).toBe('Something went wrong');
    expect(toasts[0]!.severity).toBe('error');
    expect(toasts[0]!.id).toBeDefined();
    expect(toasts[0]!.timestamp).toBeGreaterThan(0);
  });

  it('push adds a warning toast with operation', () => {
    useErrorToastStore.getState().push({
      message: 'Network slow',
      severity: 'warning',
      operation: 'sync.lan.pair',
    });
    const toasts = useErrorToastStore.getState().toasts;
    expect(toasts[0]!.operation).toBe('sync.lan.pair');
  });

  it('limits to MAX_TOASTS (5)', () => {
    for (let i = 0; i < 7; i++) {
      useErrorToastStore.getState().push({
        message: `Error ${i}`,
        severity: 'error',
      });
    }
    expect(useErrorToastStore.getState().toasts).toHaveLength(5);
    // Should keep the last 5
    expect(useErrorToastStore.getState().toasts[0]!.message).toBe('Error 2');
  });

  it('dismiss removes a specific toast by id', () => {
    useErrorToastStore.getState().push({
      message: 'Error A',
      severity: 'error',
    });
    useErrorToastStore.getState().push({
      message: 'Error B',
      severity: 'error',
    });
    const id = useErrorToastStore.getState().toasts[0]!.id;
    useErrorToastStore.getState().dismiss(id);
    const remaining = useErrorToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.message).toBe('Error B');
  });

  it('clear removes all toasts', () => {
    useErrorToastStore.getState().push({ message: 'A', severity: 'error' });
    useErrorToastStore.getState().push({ message: 'B', severity: 'warning' });
    useErrorToastStore.getState().clear();
    expect(useErrorToastStore.getState().toasts).toHaveLength(0);
  });

  it('auto-dismisses error toast after 6 seconds', () => {
    useErrorToastStore.getState().push({
      message: 'Auto dismiss me',
      severity: 'error',
    });
    expect(useErrorToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(6_000);
    expect(useErrorToastStore.getState().toasts).toHaveLength(0);
  });

  it('auto-dismisses warning toast after 4 seconds', () => {
    useErrorToastStore.getState().push({
      message: 'Warning auto dismiss',
      severity: 'warning',
    });
    expect(useErrorToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(4_000);
    expect(useErrorToastStore.getState().toasts).toHaveLength(0);
  });
});
