/**
 * ErrorToastStore — Zustand store for transient user-facing error toasts.
 *
 * The global mutation error handler in `buildQueryClient` pushes errors here.
 * `<GlobalErrorToast />` renders the toast stack above the tab bar.
 *
 * Max 5 toasts. Auto-dismiss after 4 seconds for warnings, 6 seconds for errors.
 */

import { create } from 'zustand';
import { ulid } from 'ulid';

export interface ErrorToastEntry {
  readonly id: string;
  readonly message: string;
  readonly operation?: string;
  readonly timestamp: number;
  readonly severity: 'error' | 'warning';
}

interface ErrorToastStore {
  readonly toasts: readonly ErrorToastEntry[];
  push: (entry: Omit<ErrorToastEntry, 'id' | 'timestamp'>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS_ERROR = 6_000;
const AUTO_DISMISS_MS_WARNING = 4_000;

export const useErrorToastStore = create<ErrorToastStore>((set) => ({
  toasts: [],

  push(entry) {
    const toast: ErrorToastEntry = {
      ...entry,
      id: ulid(),
      timestamp: Date.now(),
    };

    set((s) => ({
      toasts: [...s.toasts, toast].slice(-MAX_TOASTS),
    }));

    const delay = entry.severity === 'error' ? AUTO_DISMISS_MS_ERROR : AUTO_DISMISS_MS_WARNING;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toast.id) }));
    }, delay);
  },

  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clear() {
    set({ toasts: [] });
  },
}));
