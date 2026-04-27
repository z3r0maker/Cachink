/**
 * `useSwipeState` — small generic hook that powers per-route
 * swipe-to-edit + swipe-to-delete bookkeeping (Audit Round 2 K).
 *
 * Each list route holds two pieces of selection state — the row
 * currently being edited and the row pending a delete confirmation
 * — and a pair of setters. Pulling them into a hook collapses the
 * route's render body so the file + function-line budgets stay
 * within CLAUDE.md §4.4.
 */
import { useState } from 'react';

export interface SwipeStateApi<T> {
  readonly editing: T | null;
  readonly setEditing: (v: T | null) => void;
  readonly confirmDelete: T | null;
  readonly setConfirmDelete: (v: T | null) => void;
}

export function useSwipeState<T>(): SwipeStateApi<T> {
  const [editing, setEditing] = useState<T | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);
  return { editing, setEditing, confirmDelete, setConfirmDelete };
}
