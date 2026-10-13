/**
 * Renders `docs/plan/PENDIENTES.md` from parsed items (see `plan-board.ts`).
 *
 * The board is grouped by **kind of work** — the owner's ask of 2026-10-05:
 * who has to act (code, corporate/legal, console configuration, waiting on
 * real-world data), not when in the launch the work lands. The kind of every
 * item is decided in `plan-board-kinds.ts`; the launch phase survives as the
 * per-item tag in «Siguiente».
 */

import { KINDS, type Kind, SURFACES, kindOf } from './plan-board-kinds.js';
import { nextUp } from './plan-board-next.js';
import type { Item, Status } from './plan-board-parse.js';

export type Phase = 'Lanzamiento' | 'Post-lanzamiento' | 'Colas de tracks';

const OPEN: readonly Status[] = ['open', 'progress', 'blocked'];
const MARK: Readonly<Record<Status, string>> = {
  open: '[ ]',
  progress: '[~]',
  blocked: '[!]',
  done: '[x]',
};

const BLURB: Readonly<Record<Kind, string>> = {
  'Código y técnico':
    'Trabajo del repo, agrupado por superficie: pantallas, dominio, sync, contratos y tests. ' +
    'Nadie externo tiene que actuar; si una tarea no avanza, su bloqueo es código u otra tarea.',
  'Corporativo, legal y terceros':
    'Actúa el dueño fuera del repo: la razón social, abogado y contador, SAT/IMPI/INDAUTOR, ' +
    'seguros, Clip y Mercado Pago, y las decisiones de negocio.',
  'Infra y consolas':
    'Configuración en consolas de terceros — Vercel, Supabase, Stripe, Resend, DNS, GitHub, ' +
    'stores — y las llaves y regiones que viven ahí. El repo ya tiene lo que falta configurar.',
  'Espera datos reales':
    'No se empieza hasta que el mundo entrega: clientes reales, telemetría, umbral de escala o ' +
    'tiempo después del lanzamiento. Cada una dice su disparador.',
};

/** The launch phase an item belongs to — printed as the tag in «Siguiente». */
export function phaseOf(item: Item): Phase {
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
    item.blockedBy ? `Bloqueada por: ${item.blockedBy}` : null,
    item.trigger ? `Disparador: ${item.trigger}` : null,
    item.remaining ? `Falta: ${item.remaining}` : null,
  ]
    .filter((s) => s !== null)
    .join(' · ');
  return `- ${MARK[item.status]} ${id}${item.title}${tail ? ` — ${tail}` : ''} · \`${item.source}:${item.line}\``;
}

/** Código keeps its surface headers (Teléfono, Portal, …), in SURFACES order. */
function surfaceGroups(items: readonly Item[]): [string, Item[]][] {
  return SURFACES.map((surface) => [
    surface,
    items.filter((i) => kindOf(i).surface === surface),
  ]).filter(([, list]) => list.length > 0) as [string, Item[]][];
}

/** The other kinds keep their provenance: the track file and section. */
function provenanceGroups(items: readonly Item[]): [string, Item[]][] {
  const out: [string, Item[]][] = [];
  for (const item of items) {
    const key = item.section ? `\`${item.source}\` · ${item.section}` : `\`${item.source}\``;
    const last = out.at(-1);
    if (last && last[0] === key) last[1].push(item);
    else out.push([key, [item]]);
  }
  return out;
}

function renderKind(kind: Kind, items: readonly Item[]): string[] {
  const open = items.filter((i) => OPEN.includes(i.status));
  const out = [`## ${kind} (${open.length})`, '', BLURB[kind], ''];
  if (open.length === 0) return [...out, '_Nada abierto._', ''];
  const groups = kind === 'Código y técnico' ? surfaceGroups(open) : provenanceGroups(open);
  for (const [key, list] of groups) {
    out.push(`### ${key} (${list.length})`, '');
    for (const item of list) out.push(renderItem(item));
    out.push('');
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
    'Derivado de los campos **Blocked by** / **Blocks** de cada track: tareas sin bloqueo abierto,',
    'ordenadas por cuántas tareas abiertas destraban (transitivamente). Se recalcula con cada',
    '`pnpm plan:board`; el paréntesis es la fase de lanzamiento, el tipo de trabajo está en las',
    'listas de abajo.',
    '',
  ];
  for (const { item, unblocks } of rows) {
    const chain =
      unblocks.length > 0
        ? ` — destraba ${unblocks.length}: ${unblocks.slice(0, 6).join(', ')}${unblocks.length > 6 ? ', …' : ''}`
        : '';
    out.push(
      `- **${item.id ?? ''}** ${item.title} (${phaseOf(item)})${chain} · \`${item.source}:${item.line}\``,
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
  '> líneas Done siguen en cada track: aquí sólo está lo que falta, en cuatro listas por tipo de',
  '> trabajo — quién tiene que actuar —, con su disparador o bloqueo y la línea exacta de donde',
  '> viene. El tipo de cada tarea vive en `scripts/plan-board-kinds.ts`; una tarea sin tipo rompe',
  '> la generación. «Siguiente» es el orden de trabajo, derivado de las dependencias.',
  '',
];

export function renderBoard(items: readonly Item[]): string {
  // Done items are never rendered or ranked, so they carry no kind: the tables
  // in plan-board-kinds.ts only need to keep up with the open work.
  const open = items.filter((i) => OPEN.includes(i.status));
  const byKind = new Map<Kind, Item[]>(KINDS.map((k) => [k, []]));
  for (const item of open) byKind.get(kindOf(item).kind)?.push(item);
  const body = KINDS.flatMap((k) => renderKind(k, byKind.get(k) ?? []));
  return (
    [...HEAD, ...renderNext(items), ...body, ...renderSummary(items)].join('\n').trimEnd() + '\n'
  );
}
