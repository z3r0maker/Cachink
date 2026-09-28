/**
 * Renders `docs/plan/PENDIENTES.md` from parsed items (see `plan-board.ts`).
 *
 * Two axes, because they answer different questions and a list of 175 needs
 * both. **Area** is what kind of work it is and who can move it
 * (`plan-board-areas.ts`) — the owner's ask of 2026-09-28, after a board that
 * mixed «counsel reviews the aviso» with «build the ten Diagnóstico sections»
 * turned out not to be plannable. **Category** is when it happens relative to
 * the launch (`categoryOf`) — the owner's ask of 2026-09-23. Areas group, the
 * category labels each row, and neither is stored on a task: both are decided
 * from the file, the section and an optional tag, so a task never has to move
 * to be counted where it belongs.
 */

import { AREAS, AREA_BLURB, AREA_TITLES, areaOf, type Area } from './plan-board-areas.js';
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

/** Inside an area, the launch axis is what orders the work. */
function renderArea(area: Area, items: readonly Item[]): string[] {
  const open = items.filter((i) => OPEN.includes(i.status));
  const out = [`## ${AREA_TITLES[area]} (${open.length})`, '', AREA_BLURB[area], ''];
  if (open.length === 0) return [...out, '_Nada abierto._', ''];
  for (const category of CATEGORIES) {
    const rows = open.filter((i) => categoryOf(i) === category);
    if (rows.length === 0) continue;
    out.push(`### ${category} (${rows.length})`, '', ...rows.map(renderItem), '');
  }
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
  '> líneas Done siguen en cada track: aquí sólo está lo que falta, agrupado por **área** — qué clase',
  '> de trabajo es y quién puede moverlo — y dentro de cada área por momento de lanzamiento, con su',
  '> disparador o bloqueo y la línea exacta de donde viene. Un área se deduce del archivo y la',
  '> sección; una etiqueta `` `[área]` `` en el track manda sobre esa deducción. «Siguiente» es el',
  '> orden de trabajo, derivado de las dependencias.',
  '',
];

export function renderBoard(items: readonly Item[]): string {
  const byArea = new Map<Area, Item[]>(AREAS.map((a) => [a, []]));
  for (const item of items) byArea.get(areaOf(item))?.push(item);
  const body = AREAS.flatMap((a) => renderArea(a, byArea.get(a) ?? []));
  return (
    [...HEAD, ...renderNext(items), ...body, ...renderSummary(items)].join('\n').trimEnd() + '\n'
  );
}
