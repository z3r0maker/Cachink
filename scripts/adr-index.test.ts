/**
 * Two guarantees for the `ARCHITECTURE.md` index:
 *   1. the parser reads every header shape the log actually uses (the log has
 *      four, and a title it cannot read becomes a blank row nobody notices);
 *   2. the committed index equals the ADRs in the file right now — the failure
 *      this exists for, found on 2026-09-23 with 98 ADRs and 48 rows.
 */

import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'vitest';
import { type Adr, parseLog, rebuild, renderIndex } from './adr-index.js';

const ROOT = join(import.meta.dirname, '..');

/** One of each shape the log has grown: labelled, wrapped, `###`, and bold-line with inline Status. */
const FIXTURE = `# Log

## ADR-001

### Tauri 2 over Electron

**Date:** 2026-04-23
**Status:** Accepted

### Context

Prose that mentions Status: not a field.

## ADR-051

**Title:** First run drops the wizard

**Date:** 2026-08-18

**Status:** Accepted — amends ADR-039

**Context**

## ADR-091

**Title:** Infrastructure failures become form state,
not an unhandled throw

**Date:** 2026-09-22

**Status:** Accepted

**Context**

## ADR-099

**Date:** 2026-09-20 · **Status:** Accepted · **Track:** N-20

### One SVG renderer for the receipts

#### Context
`;

function byId(adrs: readonly Adr[], id: string): Adr {
  const hit = adrs.find((a) => a.id === id);
  assert.ok(hit, `no ADR-${id} parsed`);
  return hit;
}

describe('parseLog', () => {
  const adrs = parseLog(FIXTURE);

  it('reads all four header shapes', () => {
    assert.equal(adrs.length, 4);
    assert.equal(byId(adrs, '001').title, 'Tauri 2 over Electron');
    assert.equal(byId(adrs, '051').title, 'First run drops the wizard');
    assert.equal(byId(adrs, '099').title, 'One SVG renderer for the receipts');
  });

  it('joins a title that wraps across lines', () => {
    assert.equal(
      byId(adrs, '091').title,
      'Infrastructure failures become form state, not an unhandled throw',
    );
  });

  it('reads a Status that shares the Date line', () => {
    assert.equal(byId(adrs, '099').status, 'Accepted');
    assert.equal(byId(adrs, '099').date, '2026-09-20');
  });

  it('keeps the status scannable, dropping the amendment clause', () => {
    assert.equal(byId(adrs, '051').status, 'Accepted');
  });

  it('does not mistake the word Status in the prose for the field', () => {
    assert.equal(byId(adrs, '001').status, 'Accepted');
  });
});

describe('the committed index', () => {
  it('matches the ADRs in ARCHITECTURE.md', () => {
    const { current, next } = rebuild(ROOT);
    assert.equal(current, next, 'ARCHITECTURE.md index is stale — run pnpm adr:index');
  });

  it('gives every ADR in the log a row', () => {
    const { current } = rebuild(ROOT);
    const adrs = parseLog(current);
    const rows = renderIndex(adrs).split('\n').slice(2);
    assert.equal(rows.length, adrs.length);
    // A row with no date or no title means the parser met a shape it cannot
    // read; a blank cell in a table of contents is invisible until someone
    // needs that decision.
    for (const adr of adrs) {
      assert.ok(adr.date !== '', `ADR-${adr.id} has no date`);
      assert.ok(adr.title !== '', `ADR-${adr.id} has no title`);
    }
  });
});
