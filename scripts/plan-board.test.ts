/**
 * Two guarantees for `docs/plan/PENDIENTES.md`:
 *   1. the parser reads every shape the tracks actually use (so a new task is
 *      never silently missing from the board);
 *   2. the committed board equals what the tracks say right now (so nobody
 *      plans from a stale one).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { type Item, parseTrack } from './plan-board-parse.js';
import { idsIn, nextUp } from './plan-board-next.js';
import { categoryOf, renderBoard } from './plan-board-render.js';
import { AREAS, AREA_TITLES, areaOf } from './plan-board-areas.js';
import {
  PRIORIDADES,
  PRIO_TITULO,
  esBloqueante,
  ordenPrioridad,
  prioridadDe,
} from './plan-board-prioridad.js';
import { BOARD, collect } from './plan-board.js';

const ROOT = join(import.meta.dirname, '..');

const FIXTURE = `# Track T

## 2. Launch blockers

### T-01 First task \`[LAUNCH]\`

- [~] Status · **Blocked by:** B-10, C-12 · **Blocks:** T-03

  - 2026-09-22 audit: shipped except one clause.
  - **Remaining (2026-09-23):** the nested-bullet form.

- **What:** irrelevant here.

### T-02 Second task

- [ ] Status · **Trigger:** launch + 30 days, or the first incident.
  **Blocked by:** T-01
  **Remaining (2026-09-23, verified):** the cron entry and the fixture tests.
- **What:** also irrelevant.

## 3. Post-launch

- [x] **T-55 · Phase 1 — the pipe.** Shipped.
- [!] **T-56 · Phase 2 — the table**, waiting on a decision.
- [ ] **BLOCKER — Legal entity named.** \`[RAZÓN SOCIAL]\` in five texts.

| ID  | Acción | Dónde |
| --- | ------ | ----- |
| O-1 | Test project | Supabase — **Done 2026-09-18**: applied. |
| O-2 | Turn **Data API** off | Supabase |
`;

describe('parseTrack', () => {
  const items = parseTrack('t.md', FIXTURE);

  it('reads the heading + Status shape with its blockers and trigger', () => {
    const [first, second] = items;
    assert.equal(first?.id, 'T-01');
    assert.equal(first?.title, 'First task `[LAUNCH]`');
    assert.equal(first?.status, 'progress');
    assert.equal(first?.blockedBy, 'B-10, C-12');
    assert.equal(first?.section, '2. Launch blockers');
    assert.equal(second?.id, 'T-02');
    assert.equal(second?.trigger, 'launch + 30 days, or the first incident.');
    assert.equal(second?.blockedBy, 'T-01');
    assert.equal(second?.remaining, 'the cron entry and the fixture tests.');
    assert.equal(first?.remaining, 'the nested-bullet form.');
  });

  it('reads the one-line bold shape and the plain shape', () => {
    const phase1 = items.find((i) => i.id === 'T-55');
    const phase2 = items.find((i) => i.id === 'T-56');
    const plain = items.find((i) => i.id === null && i.status === 'open');
    assert.equal(phase1?.status, 'done');
    assert.equal(phase1?.title, 'Phase 1 — the pipe.');
    assert.equal(phase2?.status, 'blocked');
    assert.equal(plain?.title, 'BLOCKER — Legal entity named. `[RAZÓN SOCIAL]` in five texts.');
    assert.equal(plain?.section, '3. Post-launch');
  });

  it('reads owner-action rows, done when the row says so', () => {
    const o1 = items.find((i) => i.id === 'O-1');
    const o2 = items.find((i) => i.id === 'O-2');
    assert.equal(o1?.status, 'done');
    assert.equal(o2?.status, 'open');
    assert.equal(o2?.title, 'Turn Data API off');
    assert.equal(o2?.line, 30);
  });

  it('never invents items from prose or numbered decision tables', () => {
    assert.equal(items.length, 7);
  });
});

describe('categoryOf', () => {
  const at = (source: string, section: string): Item => ({
    source,
    section,
    line: 1,
    id: null,
    title: 't',
    status: 'open',
    trigger: null,
    blockedBy: null,
    blocks: null,
    remaining: null,
  });

  it('splits Track N by section and routes the launch and post-launch files', () => {
    assert.equal(categoryOf(at('09-next-features.md', '2. Launch blockers')), 'Lanzamiento');
    assert.equal(categoryOf(at('09-next-features.md', '3. Post-launch')), 'Post-lanzamiento');
    assert.equal(categoryOf(at('07-launch.md', '')), 'Lanzamiento');
    assert.equal(
      categoryOf(at('11-pre-launch-and-deferred.md', '1. Pre-launch actions')),
      'Lanzamiento',
    );
    assert.equal(categoryOf(at('08-post-launch.md', '')), 'Post-lanzamiento');
    assert.equal(
      categoryOf(at('../launch/production-readiness.md', '1. Legal texts')),
      'Lanzamiento',
    );
    assert.equal(
      categoryOf(at('../launch/production-readiness.md', '9. Deferred by decision')),
      'Post-lanzamiento',
    );
    assert.equal(categoryOf(at('03-backend.md', '')), 'Colas de tracks');
  });
});

describe('nextUp', () => {
  const task = (
    id: string,
    status: Item['status'],
    blockedBy: string | null,
    blocks: string | null = null,
  ): Item => ({
    source: 's.md',
    section: '',
    line: 1,
    id,
    title: id,
    status,
    trigger: null,
    blockedBy,
    blocks,
    remaining: null,
  });

  it('expands ranges and ignores wildcards and prose', () => {
    assert.deepEqual(idsIn('B-01…B-03, P-\\*, logo work (external) · X-10'), [
      'B-01',
      'B-02',
      'B-03',
      'X-10',
    ]);
    assert.deepEqual(idsIn('N-26…29'), ['N-26', 'N-27', 'N-28', 'N-29']);
    assert.deepEqual(idsIn(null), []);
  });

  it('ranks ready tasks by what they unblock and hides blocked ones', () => {
    const items = [
      task('A-1', 'open', null, 'A-2'),
      task('A-2', 'open', 'A-1', 'A-4'),
      task('A-3', 'open', 'Z-9 (done long ago)'),
      task('A-4', 'progress', 'A-2, A-3'),
      task('Z-9', 'done', null),
      task('A-5', 'open', 'external logo work'),
    ];
    const rows = nextUp(items, 10).map((r) => [r.item.id, r.unblocks]);
    assert.deepEqual(rows, [
      ['A-1', ['A-2', 'A-4']],
      ['A-3', ['A-4']],
      ['A-5', []],
    ]);
  });
});

describe('the committed board', () => {
  it('matches the tracks (run `pnpm plan:board` when this fails)', () => {
    const expected = renderBoard(collect(ROOT));
    const actual = readFileSync(join(ROOT, BOARD), 'utf8');
    assert.equal(actual, expected);
  });

  it('lists only open work, grouped by area, citing a line per item', () => {
    const board = readFileSync(join(ROOT, BOARD), 'utf8');
    const h2 = board.split('\n').filter((l) => l.startsWith('## '));
    // Anchored: `includes('## Lanzamiento')` also matches the `### Lanzamiento`
    // sub-heading, so it passed while the board had no such H2 at all.
    assert.ok(h2.some((l) => l.startsWith('## Siguiente')));
    for (const area of AREAS)
      assert.ok(
        h2.some((l) => l.startsWith(`## ${AREA_TITLES[area]} (`)),
        `no H2 for ${area}`,
      );
    const lines = board.split('\n').filter((l) => /^- \[/.test(l));
    assert.ok(lines.length > 0);
    for (const line of lines) {
      assert.doesNotMatch(line, /^- \[x\]/);
      assert.match(line, /`[^`]+\.md:\d+`$/);
    }
  });

  it('never prints an area tag — it is structure, not prose', () => {
    const board = readFileSync(join(ROOT, BOARD), 'utf8');
    for (const area of AREAS) assert.ok(!board.includes(`\`[${area}]\``), area);
  });
});

describe('areaOf', () => {
  const item = (over: Partial<Item>): Item => ({
    source: '09-next-features.md',
    line: 1,
    tags: [],
    id: 'N-01',
    title: 'x',
    status: 'open',
    section: '2. Launch blockers',
    trigger: null,
    blockedBy: null,
    blocks: null,
    remaining: null,
    ...over,
  });

  it('takes the track\u2019s tag over what the file would have said', () => {
    assert.equal(areaOf(item({})), 'producto');
    assert.equal(areaOf(item({ tags: ['deuda'] })), 'deuda');
  });

  it('falls back to the file when the tag is not an area', () => {
    // A typo must not vanish an item from every list.
    assert.equal(areaOf(item({ tags: ['deudas'] })), 'producto');
  });

  it('reads the owner actions and the legal checklist from their sections', () => {
    assert.equal(
      areaOf(
        item({ source: '11-pre-launch-and-deferred.md', section: '1. Pre-launch actions (owner)' }),
      ),
      'papeleo',
    );
    const pr = '../launch/production-readiness.md';
    assert.equal(areaOf(item({ source: pr, section: '1. Legal texts' })), 'legal');
    assert.equal(areaOf(item({ source: pr, section: '5. Stores' })), 'tiendas');
    assert.equal(
      areaOf(item({ source: pr, section: '6. Third parties and contracts' })),
      'terceros',
    );
    // Sections 2/3/4/7 are engineering with a legal deadline, not paperwork.
    assert.equal(
      areaOf(item({ source: pr, section: '4. Subscriptions (LFPC art. 76 Bis)' })),
      'producto',
    );
  });

  it('survives a title longer than the board\u2019s clamp', () => {
    // The tag is stripped before the 110-char cut, so where it sits cannot
    // change the area — this is why the parser owns it and not the renderer.
    const largo = `### T-9 \`[infra]\` ${'a'.repeat(200)}\n\n- [ ] Status · **Blocks:** T-1\n`;
    const [parsed] = parseTrack('07-launch.md', largo);
    assert.deepEqual(parsed?.tags, ['infra']);
    assert.equal(areaOf(parsed as Item), 'infra');
    assert.ok((parsed?.title.length ?? 0) <= 110);
  });
});

describe('prioridad y bloqueo', () => {
  const item = (tags: string[]): Item => ({
    source: '09-next-features.md',
    line: 1,
    tags,
    id: 'N-01',
    title: 'x',
    status: 'open',
    section: '2. Launch blockers',
    trigger: null,
    blockedBy: null,
    blocks: null,
    remaining: null,
  });

  it('reads both axes off the same tag list', () => {
    const it = item(['deuda', 'critica', 'bloq']);
    assert.equal(areaOf(it), 'deuda');
    assert.equal(prioridadDe(it), 'critica');
    assert.equal(esBloqueante(it), true);
  });

  it('says «not judged» rather than guessing a level', () => {
    // An item nobody has weighed is not a low one, and must not sort as if it were.
    assert.equal(prioridadDe(item([])), null);
    assert.equal(esBloqueante(item([])), false);
    assert.ok(ordenPrioridad(item([])) > ordenPrioridad(item(['baja'])));
  });

  it('orders critical first', () => {
    const orden = [...PRIORIDADES].map((p) => ordenPrioridad(item([p])));
    assert.deepEqual(
      orden,
      [...orden].sort((a, b) => a - b),
    );
  });

  it('every open item on the board carries a level', () => {
    // The point of the axis is that nothing is unranked; a new task fails this
    // until somebody judges it, which is the reminder.
    const sin = collect(ROOT)
      .filter((i) => i.status !== 'done' && prioridadDe(i) === null)
      .map((i) => `${i.source}:${i.line}`);
    assert.deepEqual(sin, [], `sin prioridad: ${sin.join(', ')}`);
  });

  it('the board prints the blocker list and every level it uses', () => {
    const board = readFileSync(join(ROOT, BOARD), 'utf8');
    assert.ok(board.includes('## Bloquea producción ('));
    const items = collect(ROOT).filter((i) => i.status !== 'done');
    for (const p of PRIORIDADES) {
      if (!items.some((i) => prioridadDe(i) === p)) continue;
      assert.ok(board.includes(`\`${PRIO_TITULO[p]}\``), PRIO_TITULO[p]);
    }
    assert.equal(board.includes('`⛔ bloquea prod`'), items.some(esBloqueante));
  });
});
