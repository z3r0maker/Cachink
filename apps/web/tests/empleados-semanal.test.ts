import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { salarioSemanal } from '@xangarro/domain';

/**
 * Personas reads in weeks (C-6).
 *
 * The table showed each employee's raw per-period figure while the KPI above
 * it showed the weekly total, so the column and the number over it could not
 * be reconciled by eye — a monthly $16,000 sat beside a weekly $2,000 and
 * neither added up to the payroll. Both are weekly now, and both go through
 * the **same** domain rule.
 *
 * That last part is the one worth holding: writing a second conversion in the
 * screen is easy, looks right, and drifts. (It nearly happened here.)
 */
const SCREEN = readFileSync(
  join(import.meta.dirname, '..', 'src', 'app', '(portal)', 'empleados', 'screen.tsx'),
  'utf8',
);

describe('C-6 — the weekly column and the weekly KPI share one rule', () => {
  it('the screen takes the conversion from the domain', () => {
    assert.ok(
      SCREEN.includes("salarioSemanal } from '@xangarro/domain'") ||
        SCREEN.includes('salarioSemanal,'),
      'the weekly figure must come from @xangarro/domain',
    );
  });

  it('and does not keep a second conversion of its own', () => {
    // Arithmetic only: `PERIODO_LABEL` names the periods and is not a
    // conversion. A local ratio is how the two figures drift apart again.
    for (const sospecha of ['/ 52n', '* 12n', '/ 15n', '* 7n', 'AL_ANO']) {
      assert.ok(
        !SCREEN.includes(sospecha),
        `${sospecha} looks like a second weekly conversion in the screen`,
      );
    }
  });

  it('uses it for both the column and the KPI', () => {
    assert.ok(
      (SCREEN.match(/salarioSemanal\(/g) ?? []).length >= 2,
      'one call means one of the two is still on the old figure',
    );
  });

  it('a quincena is half a month, not a fortnight', () => {
    // 24 pay periods a year, not 26: `salarioSemanal` splits 7/15, so a
    // $1,200 quincena is $560 a week. Getting this wrong overstates a year's
    // payroll by about 8%.
    assert.equal(salarioSemanal(120_000n, 'quincenal'), 56_000n);
    assert.equal(salarioSemanal(210_000n, 'semanal'), 210_000n);
  });
});
