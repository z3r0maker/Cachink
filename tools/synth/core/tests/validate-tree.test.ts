import assert from 'node:assert/strict';

import { describe, it } from 'vitest';
import { stringify } from 'yaml';

import { formatIssue, validateTree, type SourceFile } from '../src/validate/tree';
import { CONFIG, LUPITA, PRIMERA_VENTA } from './fixtures';

/**
 * `validateTree` checks what no single schema can: ids against file names,
 * evidence files on disk, and the matrix's references. It reads nothing itself;
 * the CLI hands it the files and an `exists` for the evidence folder.
 */
const EVIDENCE = new Set(['personas/evidence/playstore-pos-reviews.md']);
const exists = (p: string) => EVIDENCE.has(p);

const TAQUERO = { ...LUPITA, id: 'taquero', business: { ...LUPITA.business, type: 'taqueria' } };
const MATRIX = {
  mode: 'smoke',
  repetitions: 1,
  runs: [
    { persona: 'lupita-abarrotes', scenario: 'primera-venta', style: 'task' },
    { persona: 'taquero', scenario: 'primera-venta', style: 'walkthrough' },
  ],
};

function tree(over: Record<string, unknown> = {}): SourceFile[] {
  const files: Record<string, unknown> = {
    'config.yaml': CONFIG,
    'personas/core/lupita-abarrotes.yaml': LUPITA,
    'personas/core/taquero.yaml': TAQUERO,
    'scenarios/primera-venta.yaml': PRIMERA_VENTA,
    'matrix/smoke.yaml': MATRIX,
    ...over,
  };
  return Object.entries(files)
    .filter(([, v]) => v !== undefined)
    .map(([path, v]) => ({ path, text: typeof v === 'string' ? v : stringify(v) }));
}

const report = (files: SourceFile[]) => validateTree(files, exists).map(formatIssue);

describe('validateTree', () => {
  it('passes a consistent tree', () => {
    assert.deepEqual(report(tree()), []);
  });

  it('reports a YAML syntax error with its file and line', () => {
    const broken = 'id: primera-venta\ntitle: Venta\nmission: cobra: en efectivo\nrunner: web\n';
    const out = report(tree({ 'scenarios/primera-venta.yaml': broken }));
    assert.equal(out.length, 1, 'a file that does not parse is not also reported as missing');
    assert.match(out[0] ?? '', /^scenarios\/primera-venta\.yaml: line 3: /);
    assert.doesNotMatch(out[0] ?? '', /at line \d+, column \d+/);
  });

  it('reports a schema failure with the file, the field path and the reason', () => {
    const bad = { ...LUPITA, behaviors: [{ trait: 'cobra rápido', source: 'blog/x.md' }] };
    const out = report(tree({ 'personas/core/lupita-abarrotes.yaml': bad }));
    assert.equal(out.length, 1);
    assert.match(out[0] ?? '', /^personas\/core\/lupita-abarrotes\.yaml: behaviors\.0\.source: /);
  });

  it('reports an evidence source whose file is not under personas/evidence/', () => {
    const bad = { ...LUPITA, behaviors: [{ trait: 'x', source: 'evidence/no-existe.md#L3' }] };
    assert.deepEqual(report(tree({ 'personas/core/lupita-abarrotes.yaml': bad })), [
      'personas/core/lupita-abarrotes.yaml: behaviors.0.source: personas/evidence/no-existe.md does not exist',
    ]);
  });

  it('reports an id that does not match its file name', () => {
    assert.deepEqual(
      report(tree({ 'personas/core/taquero.yaml': { ...TAQUERO, id: 'taquera' } })),
      [
        'personas/core/taquero.yaml: id: «taquera» must match the file name «taquero»',
        'matrix/smoke.yaml: runs.1.persona: no persona «taquero»',
      ],
    );
  });

  it('reports a matrix run whose persona or scenario does not exist', () => {
    const matrix = {
      ...MATRIX,
      runs: [{ persona: 'fantasma', scenario: 'corte-de-caja', style: 'task' }],
    };
    assert.deepEqual(report(tree({ 'matrix/smoke.yaml': matrix })), [
      'matrix/smoke.yaml: runs.0.persona: no persona «fantasma»',
      'matrix/smoke.yaml: runs.0.scenario: no scenario «corte-de-caja»',
    ]);
  });

  it('reports a run whose persona kind the scenario does not apply to', () => {
    const scenario = { ...PRIMERA_VENTA, applies_to: ['chaos'] };
    const out = report(tree({ 'scenarios/primera-venta.yaml': scenario }));
    assert.equal(out.length, 2);
    assert.match(
      out[0] ?? '',
      /^matrix\/smoke\.yaml: runs\.0: «primera-venta» does not apply to human personas/,
    );
  });

  it('reports a missing config.yaml and a YAML file it does not know', () => {
    assert.deepEqual(report(tree({ 'config.yaml': undefined, 'notas.yaml': 'a: 1' })), [
      'config.yaml: (file): missing',
      'notas.yaml: (file): not a config, persona, scenario or matrix file',
    ]);
  });

  it('reports two personas with one id in different folders', () => {
    const out = report(tree({ 'personas/pool/taquero.yaml': { ...TAQUERO, tier: 'pool' } }));
    assert.deepEqual(out, [
      'personas/pool/taquero.yaml: id: «taquero» is also personas/core/taquero.yaml',
    ]);
  });
});
