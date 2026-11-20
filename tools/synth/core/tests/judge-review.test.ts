import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { reviewJudgement, type ReviewContext } from '../src/judge/review';
import { FindingSchema } from '../src/schemas/finding';

/**
 * The judge proposes; the script decides what stands (S-08's acceptance):
 * every finding cites the trace, an exit interview alone is not evidence, the
 * cut question decides `agent_failure`, and every bug candidate is accounted
 * for.
 */
const CTX: ReviewContext = {
  runId: 'taquero__primera-venta__task__r1',
  personaStatus: 'hypothesis',
  date: '2026-11-20',
  firstNumber: 1,
  stepCount: 9,
  files: new Set(['screenshots/step-004.png', 'screenshots/step-005.png']),
  consoleLines: 3,
  networkLines: 1,
  candidates: [
    { id: 'C1', source: 'console', ref: 'console.jsonl#L2', text: 'TypeError: x' },
    { id: 'C2', source: 'network', ref: 'network.jsonl#L1', text: 'POST /api: status 500' },
  ],
};

const finding = (over: Record<string, unknown> = {}) => ({
  category: 'friction',
  severity: 'minor',
  title: 'Tocar $500 escribe $8 cuando la pantalla se mueve',
  description: 'El teclado del fondo se desplazó bajo el toque.',
  evidence: { steps: [4, 5], screenshots: ['screenshots/step-004.png'], console: [], network: [] },
  repro: 'Abrir turno, tocar $500 mientras la pantalla se acomoda.',
  confidence: 'medium',
  dedupe_key: 'caja/fondo/toque-desplazado',
  human_would_hit: true,
  cut_reason: 'La pantalla se movió bajo el dedo; a una persona le pasaría igual.',
  ...over,
});
const dismissAll = [
  { candidate: 'C1', reason: 'un aviso de desarrollo, no visible' },
  { candidate: 'C2', reason: 'el reintento lo resolvió' },
];

describe('reviewJudgement', () => {
  it('keeps a finding that cites the trace, as a schema-valid Finding with the run’s id and persona status', () => {
    const r = reviewJudgement({ findings: [finding()], dismissed: dismissAll }, CTX);
    assert.equal(r.findings.length, 1);
    const f = r.findings[0];
    assert.deepEqual(FindingSchema.parse(f), f);
    assert.equal(f?.id, 'F-2026-11-20-001');
    assert.equal(f?.run_id, CTX.runId);
    assert.equal(f?.persona_status, 'hypothesis');
    assert.deepEqual(r.dropped, []);
  });

  it('keeps the cut question’s answer for every finding the judge proposed, kept or dropped', () => {
    const bare = finding({
      title: 'Sin evidencia',
      evidence: { steps: [], screenshots: [], console: [], network: [] },
    });
    const r = reviewJudgement({ findings: [finding(), bare], dismissed: dismissAll }, CTX);
    assert.deepEqual(r.cuts, [
      {
        title: 'Tocar $500 escribe $8 cuando la pantalla se mueve',
        human_would_hit: true,
        cut_reason: 'La pantalla se movió bajo el dedo; a una persona le pasaría igual.',
      },
      {
        title: 'Sin evidencia',
        human_would_hit: true,
        cut_reason: 'La pantalla se movió bajo el dedo; a una persona le pasaría igual.',
      },
    ]);
  });

  it('drops a finding that cites nothing in the trace: the exit interview alone is not evidence', () => {
    const bare = finding({ evidence: { steps: [], screenshots: [], console: [], network: [] } });
    const r = reviewJudgement({ findings: [bare], dismissed: dismissAll }, CTX);
    assert.equal(r.findings.length, 0);
    assert.match(r.dropped[0]?.reason ?? '', /no evidence in the trace/);
  });

  it('removes references the run does not have, and drops the finding when none remain', () => {
    const wrong = finding({
      evidence: {
        steps: [12],
        screenshots: ['screenshots/step-099.png'],
        console: ['console.jsonl#L9'],
        network: [],
      },
    });
    const r = reviewJudgement({ findings: [wrong], dismissed: dismissAll }, CTX);
    assert.equal(r.findings.length, 0);
    assert.match(r.dropped[0]?.reason ?? '', /step 12.*step-099.*console\.jsonl#L9/);
    const mixed = finding({
      evidence: { steps: [4, 12], screenshots: [], console: [], network: [] },
    });
    assert.deepEqual(
      reviewJudgement({ findings: [mixed], dismissed: dismissAll }, CTX).findings[0]?.evidence
        .steps,
      [4],
    );
  });

  it('lets the cut question decide: «no human would hit it» is agent_failure, whatever the judge called it', () => {
    const r = reviewJudgement(
      {
        findings: [
          finding({
            human_would_hit: false,
            cut_reason: 'El botón era visible y claro; el agente no lo encontró.',
          }),
        ],
        dismissed: dismissAll,
      },
      CTX,
    );
    assert.equal(r.findings[0]?.category, 'agent_failure');
    assert.match(r.notes.join(), /cut question/);
  });

  it('drops an agent_failure the judge itself says a human would hit, since it contradicts its own cut question', () => {
    const r = reviewJudgement(
      {
        findings: [finding({ category: 'agent_failure', human_would_hit: true })],
        dismissed: dismissAll,
      },
      CTX,
    );
    assert.equal(r.findings.length, 0);
    assert.match(r.dropped[0]?.reason ?? '', /contradicts its own cut question/);
  });

  it('accounts for every bug candidate: cited by a finding, dismissed with a reason, or added unreviewed', () => {
    const cites = finding({
      category: 'bug',
      evidence: { steps: [5], screenshots: [], console: ['console.jsonl#L2'], network: [] },
    });
    const r = reviewJudgement({ findings: [cites], dismissed: [] }, CTX);
    assert.equal(r.findings.length, 2, 'C1 is cited; C2 was neither cited nor dismissed');
    const added = r.findings[1];
    assert.equal(added?.category, 'bug');
    assert.equal(added?.confidence, 'low');
    assert.deepEqual(added?.evidence.network, ['network.jsonl#L1']);
    assert.deepEqual(r.unreviewed, ['C2']);
  });

  it('refuses output that is not the judge’s contract, naming what is wrong', () => {
    assert.throws(
      () => reviewJudgement({ findings: [finding({ severity: 'blocker' })], dismissed: [] }, CTX),
      /severity/,
    );
    assert.throws(() => reviewJudgement({ verdict: 'todo bien' }, CTX), /findings/);
  });

  it('numbers findings from firstNumber, so a corrida’s ids stay unique across runs', () => {
    const r = reviewJudgement(
      {
        findings: [finding(), finding({ dedupe_key: 'caja/cobrar/doble-toque' })],
        dismissed: dismissAll,
      },
      { ...CTX, firstNumber: 7 },
    );
    assert.deepEqual(
      r.findings.map((f) => f.id),
      ['F-2026-11-20-007', 'F-2026-11-20-008'],
    );
  });
});
