import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { scanServerActions, unguarded } from '@xangarro/testing/server-actions';
import { describe, it } from 'vitest';

/**
 * Every export of a `'use server'` file is an endpoint (audit F-03), in the
 * console as in the portal: Next answers a POST for it from anyone, with any
 * arguments. `src/proxy.ts` gates pages; an action is reached without one, so
 * each re-applies the gate itself (ADR-080) or is on the public list.
 *
 * The finding here was `archivoMapeado(fileId)`: a read exported from an
 * actions file with no gate at all, and no caller.
 */
const SRC = path.resolve(import.meta.dirname, '../src');

/**
 * `src/server/staff.ts` and `src/server/founder.ts`, and `auditedMutation`,
 * which is gate → mutation → audit row in one call (`src/server/audited.ts`).
 * `requireStaffPage` is the MFA steps' gate: it admits an allowlisted member
 * still at AAL1, on the one step the gate assigns them.
 */
const GUARDS = ['requireStaff', 'requireStaffPage', 'requireFounder', 'auditedMutation'];

/** Callable with no session, on purpose. */
const PUBLIC: Readonly<Record<string, string>> = {
  'server/actions/auth.ts#login':
    'the door. Throttled per address and per IP (`auth/sign-in.ts`), every refusal logged',
  'server/actions/auth.ts#logout': 'ends the caller’s own session; takes nothing',
};

const key = (a: { file: string; name: string }) => `${a.file}#${a.name}`;

/** Every `.ts`/`.tsx` under `src`, by its path from there. */
const sources = new Map(
  readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => [file.split(path.sep).join('/'), readFileSync(path.join(SRC, file), 'utf8')]),
);
const actions = scanServerActions(sources);
const open = unguarded(actions, GUARDS);

describe('server actions are guarded (audit F-03)', () => {
  it('finds the action files at all, the page’s inline one included', () => {
    assert.ok(actions.length > 30, `only ${actions.length} actions found under ${SRC}`);
    assert.ok(actions.some((a) => a.name.startsWith('inline:')));
  });

  it('every action re-applies the gate, or is on the public list', () => {
    const unexplained = open.map(key).filter((k) => !(k in PUBLIC));
    assert.deepEqual(
      unexplained,
      [],
      'an export of a use-server file with no gate: call requireStaff, or move a read ' +
        'helper to a server-only module',
    );
  });

  it('the public list names only actions that exist and are in fact ungated', () => {
    const names = new Set(open.map(key));
    const stale = Object.keys(PUBLIC).filter((k) => !names.has(k));
    assert.deepEqual(stale, [], 'remove these from PUBLIC: gated now, or gone');
  });
});
