/**
 * Renders `docs/plan/PENDIENTES.md` from parsed items (see `plan-board.ts`).
 *
 * The board is grouped by **category**, not by file — the owner's ask of
 * 2026-09-23: three lists instead of seven files. A category is decided from
 * the source file and its `## ` section, so a task never has to move to be
 * counted where it belongs.
 */

import { nextUp } from './plan-board-next.js';
import type { Item, Status } from './plan-board-parse.js';

export const CATEGORIES = ['Lanzamiento', 'Post-lanzamiento', 'Colas de tracks'] as const;
export type Category = (typeof CATEGORIES)[number];

const OPEN: readonly Status[] = ['open', 'progress', 'blocked'];
const MARK: Readonly<Record<Status, string>> = {
  open: '[ ]',
  progress: '[~]',
  blocked: '[!]',
  done: '[x]',
};

const BLURB: Readonly<Record<Category, string>> = {
  Lanzamiento:
    'Lo que la X-10 espera: los `[LAUNCH]` de Track N, las X-, las acciones del dueño y la preparación legal.',
  'Post-lanzamiento': 'Cada tarea tiene un disparador; no se empieza antes de que sea cierto.',
  'Colas de tracks':
    'Sobrantes de tracks casi cerrados. Se verifican contra el código y se cierran o se archivan.',
};

/** Which list an item belongs to. Keyed on file + section so specs stay put. */
export function categoryOf(item: Item): Category {
  const { source, section } = item;
  if (source === '07-launch.md' || source === '11-pre-launch-and-deferred.md') return 'Lanzamiento';
  if (source === '09-next-features.md')
    return section.startsWith('3.') ? 'Post-lanzamiento' : 'Lanzamiento';
  if (source === '08-post-launch.md') return 'Post-lanzamiento';
  if (source.endsWith('production-readiness.md')) {
    return section.startsWith('9.') ? 'Post-lanzamiento' : 'Lanzamiento';
  }
  return 'Colas de tracks';
}

function renderItem(item: Item): string {
  const id = item.id ? `**${item.id}** ` : '';
  const tail = [
    item.blockedBy ? `Blocked by: ${item.blockedBy}` : null,
    item.trigger ? `Trigger: ${item.trigger}` : null,
    item.remaining ? `Falta: ${item.remaining}` : null,
  ]
    .filter((s) => s !== null)
    .join(' · ');
  return `- ${MARK[item.status]} ${id}${item.title}${tail ? ` — ${tail}` : ''} · \`${item.source}:${item.line}\``;
}

function groupKey(item: Item): string {
  return item.section ? `\`${item.source}\` · ${item.section}` : `\`${item.source}\``;
}

function renderCategory(category: Category, items: readonly Item[]): string[] {
  const open = items.filter((i) => OPEN.includes(i.status));
  const out = [`## ${category} (${open.length})`, '', BLURB[category], ''];
  if (open.length === 0) return [...out, '_Nada abierto._', ''];
  let key: string | null = null;
  for (const item of open) {
    const k = groupKey(item);
    if (k !== key) {
      key = k;
      if (out.at(-1) !== '') out.push('');
      out.push(`### ${k}`, '');
    }
    out.push(renderItem(item));
  }
  out.push('');
  return out;
}

function count(items: readonly Item[], status: Status): number {
  return items.filter((i) => i.status === status).length;
}

function renderSummary(items: readonly Item[]): string[] {
  const bySource = new Map<string, Item[]>();
  for (const item of items) bySource.set(item.source, [...(bySource.get(item.source) ?? []), item]);
  const out = ['## Por archivo', ''];
  for (const [source, list] of bySource) {
    const open = list.filter((i) => OPEN.includes(i.status)).length;
    const state = open === 0 ? 'todo cerrado — archivar' : `${open} abiertos`;
    out.push(
      `- \`${source}\` — ${state} (${count(list, 'progress')} en curso, ${count(list, 'blocked')} bloqueados, ${count(list, 'done')} hechos)`,
    );
  }
  out.push('');
  return out;
}

const NEXT_LIMIT = 15;

/** Ready tasks (no open blocker), ranked by what they unblock. */
function renderNext(items: readonly Item[]): string[] {
  const rows = nextUp(items, NEXT_LIMIT);
  const out = [
    `## Siguiente (${rows.length})`,
    '',
    'Derivado de **Blocked by** / **Blocks**: tareas sin bloqueo abierto, ordenadas por cuántas',
    'tareas abiertas destraban (transitivamente). Se recalcula con cada `pnpm plan:board`.',
    '',
  ];
  for (const { item, unblocks } of rows) {
    const chain =
      unblocks.length > 0
        ? ` — destraba ${unblocks.length}: ${unblocks.slice(0, 6).join(', ')}${unblocks.length > 6 ? ', …' : ''}`
        : '';
    out.push(
      `- **${item.id ?? ''}** ${item.title} (${categoryOf(item)})${chain} · \`${item.source}:${item.line}\``,
    );
  }
  out.push('');
  return out;
}

const HEAD = [
  '# Pendientes — tablero generado',
  '',
  '> **Generado por `pnpm plan:board`. No se edita a mano.** Cada línea viene de una casilla',
  '> `- [ ]` / `- [~]` / `- [!]` en un track de `docs/plan` (o de una fila `| O-n |` en',
  '> `11-pre-launch-and-deferred.md`). Para cambiar un estado, edita el track y regenera;',
  '> `pnpm test:scripts` falla cuando este archivo quedó viejo. Las especificaciones, los pasos y las',
  '> líneas Done siguen en cada track: aquí sólo está lo que falta, en tres listas, con su disparador',
  '> o bloqueo y la línea exacta de donde viene. «Siguiente» es el orden de trabajo, derivado de las',
  '> dependencias.',
  '',
];

export function renderBoard(items: readonly Item[]): string {
  const byCategory = new Map<Category, Item[]>(CATEGORIES.map((c) => [c, []]));
  for (const item of items) byCategory.get(categoryOf(item))?.push(item);
  const body = CATEGORIES.flatMap((c) => renderCategory(c, byCategory.get(c) ?? []));
  return (
    [...HEAD, ...renderNext(items), ...body, ...renderSummary(items)].join('\n').trimEnd() + '\n'
  );
}
