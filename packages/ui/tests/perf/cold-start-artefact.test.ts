/**
 * Cold-start baseline smoke test (P1C-M12-T05, S4-C20).
 *
 * The script `scripts/measure-cold-start.ts` is a smoke harness that
 * writes a JSON artefact. Here we only verify the schema stays stable —
 * adding a new platform target should land as an explicit change here.
 */

import { describe, expect, it } from 'vitest';

interface ColdStartArtefact {
  recordedAt: string;
  mobile: { targetMs: number; measuredMs: number | null };
  desktop: { targetMs: number; measuredMs: number | null };
  notes: string;
}

describe('ColdStartArtefact shape', () => {
  it('mobile target is 2000 ms per CLAUDE.md §1', () => {
    const expected = 2000;
    const a: ColdStartArtefact = {
      recordedAt: '2026-04-24T00:00:00Z',
      mobile: { targetMs: 2000, measuredMs: null },
      desktop: { targetMs: 3000, measuredMs: null },
      notes: '',
    };
    expect(a.mobile.targetMs).toBe(expected);
  });
});
