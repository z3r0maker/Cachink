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
import { phaseOf, renderBoard } from './plan-board-render.js';
import { kindOf } from './plan-board-kinds.js';
import { esBloqueante, ordenPrioridad, prioridadDe } from './plan-board-prioridad.js';
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
| O-2 | [alta] [bloq] Turn **Data API** off | Supabase |
| O-3 | **Hecho 2026-11-03:** PITR on. | Supabase |
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

  it('reads owner-action rows, done when the row says so, in either language', () => {
    const o1 = items.find((i) => i.id === 'O-1');
    const o2 = items.find((i) => i.id === 'O-2');
    const o3 = items.find((i) => i.id === 'O-3');
    assert.equal(o1?.status, 'done');
    assert.equal(o2?.status, 'open');
    assert.equal(o2?.title, 'Turn Data API off');
    assert.equal(o2?.line, 30);
    // O-4…O-6 y O-13 se cerraron en español el 2026-11-03 y siguieron
    // contando como abiertos: el detector sólo conocía `**Done`.
    assert.equal(o3?.status, 'done');
    assert.deepEqual(o2?.tags, ['alta', 'bloq']);
  });

  it('never invents items from prose or numbered decision tables', () => {
    assert.equal(items.length, 8);
  });
});

describe('phaseOf', () => {
  const at = (source: string, section: string): Item => ({
    source,
    section,
    tags: [],
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
    assert.equal(phaseOf(at('09-next-features.md', '2. Launch blockers')), 'Lanzamiento');
    assert.equal(phaseOf(at('09-next-features.md', '3. Post-launch')), 'Post-lanzamiento');
    assert.equal(phaseOf(at('07-launch.md', '')), 'Lanzamiento');
    assert.equal(
      phaseOf(at('11-pre-launch-and-deferred.md', '1. Pre-launch actions')),
      'Lanzamiento',
    );
    assert.equal(phaseOf(at('08-post-launch.md', '')), 'Post-lanzamiento');
    assert.equal(phaseOf(at('../launch/production-readiness.md', '1. Legal texts')), 'Lanzamiento');
    assert.equal(
      phaseOf(at('../launch/production-readiness.md', '9. Deferred by decision')),
      'Post-lanzamiento',
    );
    assert.equal(phaseOf(at('03-backend.md', '')), 'Colas de tracks');
  });
});

describe('kindOf', () => {
  const item = (over: Partial<Item>): Item => ({
    source: '09-next-features.md',
    section: '3. Post-launch',
    tags: [],
    line: 1,
    id: null,
    title: 't',
    status: 'open',
    trigger: null,
    blockedBy: null,
    blocks: null,
    remaining: null,
    ...over,
  });

  it('routes ids to the four kinds, with a surface for code only', () => {
    assert.deepEqual(kindOf(item({ id: 'N-24' })), {
      kind: 'Código y técnico',
      surface: 'Teléfono',
    });
    assert.equal(kindOf(item({ id: 'O-17' })).kind, 'Corporativo, legal y terceros');
    assert.equal(kindOf(item({ id: 'X-01' })).kind, 'Infra y consolas');
    assert.equal(kindOf(item({ id: 'Z-05' })).kind, 'Espera datos reales');
    assert.equal(kindOf(item({ id: 'O-17' })).surface, null);
  });

  it('routes the id-less production-readiness rows by section and title prefix', () => {
    const pr = (title: string, section: string): Item =>
      item({ source: '../launch/production-readiness.md', section, id: null, title });
    assert.equal(
      kindOf(pr('BLOQUEANTE — Razón social constituida.', '0. The one thing')).kind,
      'Corporativo, legal y terceros',
    );
    assert.equal(
      kindOf(pr('BLOQUEANTE — Cancelar en un clic', '4. Subscriptions')).surface,
      'Privacidad y LFPC',
    );
    assert.equal(
      kindOf(pr('DPAs firmados: Supabase', '6. Third parties')).kind,
      'Corporativo, legal y terceros',
    );
    assert.equal(
      kindOf(pr('ANTES DE STORES — Apple Privacy', '5. Stores')).kind,
      'Infra y consolas',
    );
    assert.equal(kindOf(pr('En la app «Desvincular y borrar', '3. Rights')).surface, 'Teléfono');
  });

  it('throws on an unclassified item — a new task needs its bucket the day it is written', () => {
    assert.throws(() => kindOf(item({ id: 'T-99' })), /No bucket for T-99.*plan-board-kinds/);
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
    tags: [],
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

  it('lists only open work, in the four kinds, citing a line per item', () => {
    const board = readFileSync(join(ROOT, BOARD), 'utf8');
    for (const h of [
      '## Siguiente',
      '## Código y técnico',
      '## Corporativo, legal y terceros',
      '## Infra y consolas',
      '## Espera datos reales',
    ])
      assert.ok(board.includes(h), h);
    assert.ok(!board.includes('## Lanzamiento ('), 'the phase lists are gone');
    const lines = board.split('\n').filter((l) => /^- \[/.test(l));
    assert.ok(lines.length > 0);
    for (const line of lines) {
      assert.doesNotMatch(line, /^- \[x\]/);
      assert.match(line, /`[^`]+\.md:\d+`$/);
    }
  });

  it('classifies every open item — an unlisted task fails the board, not just the reader', () => {
    const open = collect(ROOT).filter((i) => i.status !== 'done');
    assert.ok(open.length > 100);
    for (const i of open) assert.doesNotThrow(() => kindOf(i), `${i.id ?? i.title}`);
  });

  it('da un nivel a cada tarea abierta — sin él, el tablero no se lee por urgencia', () => {
    // El eje de prioridad llegó el 2026-09-28 y lo escribió sobre las 162
    // tareas de entonces. Las 61 que nacieron después se quedaron sin nivel y
    // la lista volvió a no decir qué hacer primero. Esta prueba es lo que
    // impide que vuelva a pasar: el nivel se escribe el día que se escribe la
    // tarea, igual que su tipo de trabajo (`kindOf` arriba).
    const sin = collect(ROOT)
      .filter((i) => i.status !== 'done' && prioridadDe(i) === null)
      .map((i) => `  ${i.id ?? i.title.slice(0, 48)} · ${i.source}:${i.line}`);
    assert.deepEqual(
      sin,
      [],
      `${sin.length} tareas abiertas sin [critica]/[alta]/[media]/[baja] (docs/plan/00-README.md §3):\n${sin.join('\n')}`,
    );
  });
});

describe('prioridad', () => {
  const con = (...tags: string[]): Item => ({
    tags,
    source: '09-next-features.md',
    section: '',
    line: 1,
    id: 'T-1',
    title: 't',
    status: 'open',
    trigger: null,
    blockedBy: null,
    blocks: null,
    remaining: null,
  });

  it('lee el nivel y el bloqueo de las etiquetas, no del texto', () => {
    assert.equal(prioridadDe(con('deuda', 'alta', 'bloq')), 'alta');
    assert.equal(esBloqueante(con('alta', 'bloq')), true);
    assert.equal(esBloqueante(con('critica')), false);
  });

  it('deja sin nivel lo que nadie juzgó, y lo ordena al final', () => {
    // Un `null` a propósito: una tarea que nadie pesó no es una tarea ligera,
    // así que no se filtra sola entre las `baja`.
    assert.equal(prioridadDe(con('deuda')), null);
    assert.ok(ordenPrioridad(con()) > ordenPrioridad(con('baja')));
    assert.deepEqual(
      [con('baja'), con(), con('critica'), con('media')]
        .sort((a, b) => ordenPrioridad(a) - ordenPrioridad(b))
        .map(prioridadDe),
      ['critica', 'media', 'baja', null],
    );
  });
});

describe('etiquetas de estructura', () => {
  const uno = (track: string): Item => {
    const [item] = parseTrack('09-next-features.md', track);
    return item as Item;
  };

  it('las lee con y sin comillas invertidas', () => {
    // El pase de traducción de 2026-10 se las quitó. Mientras el patrón las
    // exigió, 88 renglones del tablero imprimieron `[critica]` como título.
    assert.deepEqual(uno('### T-1 Título `[critica]` `[bloq]`\n\n- [ ] Status\n').tags, [
      'critica',
      'bloq',
    ]);
    assert.deepEqual(uno('### T-1 Título [critica] [bloq]\n\n- [ ] Status\n').tags, [
      'critica',
      'bloq',
    ]);
  });

  it('nunca las deja dentro del título', () => {
    for (const forma of ['`[alta]`', '[alta]']) {
      assert.equal(
        uno(`### T-1 Entorno de staging ${forma}\n\n- [ ] Status\n`).title,
        'Entorno de staging',
      );
    }
  });

  it('tampoco dentro de «Blocked by», que se lee de la línea cruda', () => {
    // N-24 imprimía «… las fases restantes del track del `[alta]` `[bloq]`».
    const it1 = uno(
      '### T-1 Título\n\n- [ ] Status · **Blocked by:** M-10 y M-11 `[alta]` `[bloq]`\n',
    );
    assert.equal(it1.blockedBy, 'M-10 y M-11');
    assert.deepEqual(it1.tags, ['alta', 'bloq']);
  });

  it('no deja espacios de más donde estaban, para que prettier no reescriba el tablero', () => {
    // N-24 salía con tres espacios («…mostrador.md`)   móvil…»): prettier los
    // juntaba en uno y el tablero ya no era el que genera `pnpm plan:board`.
    const it1 = uno(
      '### T-1 Título\n\n- [ ] Status · **Blocked by:** M-10 y M-11 `[alta]` `[bloq]`\n  y el rework de A-16\n',
    );
    assert.equal(it1.blockedBy, 'M-10 y M-11 y el rework de A-16');
    assert.equal(
      uno('### T-1 Uno `[alta]` dos [bloq]tres\n\n- [ ] Status\n').title,
      'Uno dos tres',
    );
  });

  it('las lee cuando abren el renglón, que es donde caben en un bullet que envuelve', () => {
    // Al final de la primera línea física caían a media frase; el peor caso
    // las metió entre dos marcadores de plantilla del aviso: «Still open:
    // `[RFC]`, `[TELÉFONO]`, `[critica]` `[bloq]`, `[CORREO SOPORTE]`…».
    const [item] = parseTrack(
      '../launch/production-readiness.md',
      '- [ ] [critica] [bloq] **BLOQUEANTE — Razón social constituida.** Falta `[RFC]`\n      y el `[TELÉFONO]`.\n',
    );
    assert.deepEqual(item?.tags, ['critica', 'bloq']);
    assert.equal(item?.title, 'BLOQUEANTE — Razón social constituida. Falta `[RFC]`');
    // Un `[PAÍS]` o un `[RFC]` no son etiquetas: el vocabulario va enumerado.
    assert.deepEqual(uno('### T-1 Celdas `[PAÍS]` y `[PLAZO]` [media]\n\n- [ ] Status\n').tags, [
      'media',
    ]);
  });

  it('deja en paz a `[LAUNCH]`, que sí se muestra', () => {
    // Es la fase de lanzamiento que `plan-board-kinds.ts` conserva a propósito.
    const it1 = uno('### T-1 Auditoría `[LAUNCH]` `[alta]`\n\n- [ ] Status\n');
    assert.equal(it1.title, 'Auditoría `[LAUNCH]`');
    assert.deepEqual(it1.tags, ['alta']);
  });

  it('el tablero publicado no imprime ninguna', () => {
    const board = readFileSync(join(ROOT, BOARD), 'utf8');
    const sueltas = board
      .split('\n')
      .filter((l) => l.startsWith('- [') && /\[(critica|alta|media|baja|bloq)\]/.test(l));
    assert.deepEqual(sueltas, [], `renglones con etiqueta impresa: ${sueltas.length}`);
  });
});
