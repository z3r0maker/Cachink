import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { mergeFindings } from '../src/judge/merge';
import type { Finding } from '../src/schemas/finding';

const finding = (id: string, run_id: string): Finding => ({
  id,
  run_id,
  category: 'friction',
  severity: 'minor',
  title: 't',
  description: 'd',
  evidence: { steps: [1], screenshots: [], console: [], network: [] },
  persona_status: 'hypothesis',
  repro: 'r',
  confidence: 'medium',
  dedupe_key: 'caja/cobrar/x',
});
const A = 'taquero__primera-venta__task__r1';
const B = 'taquero__primera-venta-telefono__task__r1';

describe('mergeFindings', () => {
  it('numbers a first judgement from 1', () => {
    assert.deepEqual(mergeFindings([], [], A, '2026-11-19').findings, []);
    assert.equal(mergeFindings([], [], A, '2026-11-19').firstNumber, 1);
  });

  it('keeps other runs’ findings and continues after the day’s highest number', () => {
    const existing = [finding('F-2026-11-19-001', B), finding('F-2026-11-19-004', B)];
    const fresh = [finding('F-2026-11-19-005', A)];
    const m = mergeFindings(existing, fresh, A, '2026-11-19');
    assert.equal(m.firstNumber, 5);
    assert.deepEqual(
      m.findings.map((f) => f.id),
      ['F-2026-11-19-001', 'F-2026-11-19-004', 'F-2026-11-19-005'],
    );
  });

  it('replaces the run’s own earlier findings when it is judged again', () => {
    const existing = [finding('F-2026-11-19-001', A), finding('F-2026-11-19-002', B)];
    const m = mergeFindings(existing, [], A, '2026-11-19');
    assert.deepEqual(
      m.findings.map((f) => f.id),
      ['F-2026-11-19-002'],
    );
  });

  it('ignores another day’s numbers when it numbers today’s', () => {
    const m = mergeFindings([finding('F-2026-11-18-009', B)], [], A, '2026-11-19');
    assert.equal(m.firstNumber, 1);
  });
});
