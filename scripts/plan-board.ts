/**
 * plan-board.ts — regenerate `docs/plan/PENDIENTES.md`, the one place to read
 * what is still open across every plan track.
 *
 * The track files stay the source of truth (`00-README.md` §3); this only
 * collects their checkbox lines and the owner-action rows of
 * `11-pre-launch-and-deferred.md`. `plan-board.test.ts` fails when the
 * committed board no longer matches the tracks, so it cannot go stale
 * silently.
 *
 * Usage: `pnpm plan:board` (writes) · `pnpm plan:board --check` (exit 1 when stale).
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Item, parseTrack, type Status } from './plan-board-parse.js';

export const BOARD = 'docs/plan/PENDIENTES.md';

/** Files outside `docs/plan` that carry checkbox work. `launch-checklist.md` is pre-rebrand and stale; X-10 rewrites it. */
const EXTRA_SOURCES = ['docs/launch/production-readiness.md'] as const;
const SKIP = new Set(['00-README.md', basename(BOARD)]);
const OPEN: readonly Status[] = ['open', 'progress', 'blocked'];
const MARK: Readonly<Record<Status, string>> = {
  open: '[ ]',
  progress: '[~]',
  blocked: '[!]',
  done: '[x]',
};

export function collect(root: string): Item[] {
  const planDir = join(root, 'docs/plan');
  const planFiles = readdirSync(planDir)
    .filter((f) => f.endsWith('.md') && !SKIP.has(f))
    .sort()
    .map((f) => join(planDir, f));
  const files = [...planFiles, ...EXTRA_SOURCES.map((f) => join(root, f))];
  return files.flatMap((file) => {
    const source = relative(join(root, 'docs/plan'), file);
    return parseTrack(source, readFileSync(file, 'utf8'));
  });
}

function count(items: readonly Item[], status: Status): number {
  return items.filter((i) => i.status === status).length;
}

function renderItem(item: Item): string {
  const id = item.id ? `**${item.id}** ` : '';
  const tail = [
    item.blockedBy ? `Blocked by: ${item.blockedBy}` : null,
    item.trigger ? `Trigger: ${item.trigger}` : null,
  ]
    .filter((s) => s !== null)
    .join(' · ');
  const where = `\`${item.source}:${item.line}\``;
  return `- ${MARK[item.status]} ${id}${item.title}${tail ? ` — ${tail}` : ''} · ${where}`;
}

function renderSource(source: string, items: readonly Item[]): string[] {
  const open = items.filter((i) => OPEN.includes(i.status));
  if (open.length === 0) return [];
  const out = [`## \`${source}\``, ''];
  let section: string | null = null;
  for (const item of open) {
    if (item.section !== section) {
      section = item.section;
      if (section) {
        if (out.at(-1) !== '') out.push('');
        out.push(`### ${section}`, '');
      }
    }
    out.push(renderItem(item));
  }
  out.push('');
  return out;
}

function renderSummary(bySource: ReadonlyMap<string, Item[]>): string[] {
  const out = ['## Resumen', ''];
  for (const [source, items] of bySource) {
    const open = items.filter((i) => OPEN.includes(i.status)).length;
    const state = open === 0 ? 'todo cerrado' : `${open} abiertos`;
    out.push(
      `- \`${source}\` — ${state} (${count(items, 'progress')} en curso, ${count(items, 'blocked')} bloqueados, ${count(items, 'done')} hechos)`,
    );
  }
  out.push('');
  return out;
}

export function renderBoard(items: readonly Item[]): string {
  const bySource = new Map<string, Item[]>();
  for (const item of items) bySource.set(item.source, [...(bySource.get(item.source) ?? []), item]);
  const head = [
    '# Pendientes — tablero generado',
    '',
    '> **Generado por `pnpm plan:board`. No se edita a mano.** Cada línea viene de una casilla',
    '> `- [ ]` / `- [~]` / `- [!]` en un track de `docs/plan` (o de una fila `| O-n |` en',
    '> `11-pre-launch-and-deferred.md`). Para cambiar un estado, edita el track y regenera;',
    '> `pnpm test:scripts` falla cuando este archivo quedó viejo. Las especificaciones, los pasos y las',
    '> líneas Done siguen en cada track: aquí sólo está lo que falta, con su disparador o bloqueo.',
    '',
  ];
  const body = [...bySource].flatMap(([source, list]) => renderSource(source, list));
  return [...head, ...renderSummary(bySource), ...body].join('\n').trimEnd() + '\n';
}

function main(argv: readonly string[]): number {
  const root = join(fileURLToPath(import.meta.url), '../..');
  const target = join(root, BOARD);
  const next = renderBoard(collect(root));
  if (argv.includes('--check')) {
    const current = readFileSync(target, 'utf8');
    if (current === next) return 0;
    process.stderr.write(`${BOARD} is stale — run pnpm plan:board\n`);
    return 1;
  }
  writeFileSync(target, next);
  process.stdout.write(`wrote ${BOARD}\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
