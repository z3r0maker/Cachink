/**
 * «Siguiente» — the work-next order for `docs/plan/PENDIENTES.md`.
 *
 * Derived, never hand-set (owner decision 2026-09-23): from every open task's
 * **Blocked by** / **Blocks** lines, a task is *ready* when none of its
 * blockers is still open, and ranks by how many open tasks it unblocks
 * transitively. A blocker that is done, or is not a task id at all
 * («logo work (external)»), does not hold a task back. Ranges such as
 * `B-01…B-10` expand; `P-\*` and similar wildcards are ignored.
 */

import type { Item } from './plan-board-parse.js';

const ID = /([A-Z]{1,2})-(\d+)/g;
const RANGE = /([A-Z]{1,2})-(\d+)…(?:\1-)?(\d+)/g;

/** Task ids named in a Blocked by / Blocks line, ranges expanded. */
export function idsIn(text: string | null): string[] {
  if (!text) return [];
  const out = new Set<string>();
  const expanded = text.replace(RANGE, (_m, p: string, a: string, b: string) => {
    const width = a.length;
    const ids: string[] = [];
    for (let n = Number(a); n <= Number(b); n += 1)
      ids.push(`${p}-${String(n).padStart(width, '0')}`);
    return ids.join(', ');
  });
  for (const m of expanded.matchAll(ID)) out.add(`${m[1]}-${m[2]}`);
  return [...out];
}

export interface NextRow {
  readonly item: Item;
  /** Open tasks this one unblocks, transitively, nearest first. */
  readonly unblocks: readonly string[];
}

const OPEN = new Set(['open', 'progress', 'blocked']);

/** `blocks` edges: id → the open ids it holds back, from both directions of the notes. */
function edges(open: ReadonlyMap<string, Item>): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const add = (from: string, to: string): void => {
    if (from === to || !open.has(from) || !open.has(to)) return;
    out.set(from, (out.get(from) ?? new Set()).add(to));
  };
  for (const [id, item] of open) {
    for (const b of idsIn(item.blockedBy)) add(b, id);
    for (const t of idsIn(item.blocks)) add(id, t);
  }
  return out;
}

function downstream(id: string, graph: ReadonlyMap<string, Set<string>>): string[] {
  const seen = new Set<string>();
  const queue = [...(graph.get(id) ?? [])];
  while (queue.length > 0) {
    const next = queue.shift();
    if (next === undefined || seen.has(next)) continue;
    seen.add(next);
    queue.push(...(graph.get(next) ?? []));
  }
  return [...seen];
}

/** Ready tasks ranked by how much they unblock; ties by id so the order is stable. */
export function nextUp(items: readonly Item[], limit: number): NextRow[] {
  const open = new Map<string, Item>();
  for (const item of items) if (item.id && OPEN.has(item.status)) open.set(item.id, item);
  const graph = edges(open);
  const blockedIds = new Set([...graph.values()].flatMap((s) => [...s]));
  return [...open.values()]
    .filter((item) => item.id !== null && !blockedIds.has(item.id))
    .map((item) => ({ item, unblocks: downstream(item.id ?? '', graph) }))
    .sort(
      (a, b) =>
        b.unblocks.length - a.unblocks.length || (a.item.id ?? '').localeCompare(b.item.id ?? ''),
    )
    .slice(0, limit);
}
