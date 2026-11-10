import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  MAX_PIN_FAILURES,
  NO_LOCKOUT,
  NO_LOCKOUTS,
  PIN_LOCKOUT_KEY,
  attemptNip,
  lockoutOf,
  nipGuardOver,
  parsePinLockouts,
  type NipCheck,
  type NipGuardDeps,
} from '../src/nip';

const t0 = new Date('2026-09-16T12:00:00.000Z');

/** Whose NIP is being checked: the supervisor's, and a coworker's own. */
const S = '01JPRS00000000000000000002';
const A = '01JPRS00000000000000000001';

/** One device: one stored map of lockouts and one clock, shared by every NIP path. */
function device(initial: string | null = null) {
  let raw = initial;
  let now = t0;
  let writes = 0;
  const deps: NipGuardDeps = {
    store: {
      read: async () => raw,
      write: async (value) => {
        raw = value;
        writes += 1;
      },
    },
    now: async () => now,
  };
  return {
    deps,
    raw: () => raw,
    of: (subject: string) => lockoutOf(parsePinLockouts(raw), subject),
    subjects: () => Object.keys(parsePinLockouts(raw).by),
    writes: () => writes,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
  };
}

const wrong = async (): Promise<NipCheck<string>> => ({ ok: false });
const right = async (): Promise<NipCheck<string>> => ({ ok: true, value: 'in' });

async function miss(d: ReturnType<typeof device>, subject: string, times: number): Promise<void> {
  for (let i = 0; i < times; i += 1) await attemptNip(d.deps, subject, wrong);
}

describe('attemptNip: one subject', () => {
  it('hands back the value of a right NIP and leaves a clean state untouched', async () => {
    const d = device();
    assert.deepEqual(await attemptNip(d.deps, S, right), { status: 'ok', value: 'in' });
    assert.equal(d.writes(), 0);
  });

  it('counts a wrong NIP and says so without locking', async () => {
    const d = device();
    assert.deepEqual(await attemptNip(d.deps, S, wrong), { status: 'wrong', lockedMs: 0 });
    assert.equal(d.of(S).failures, 1);
  });

  it('starts the lockout on the fifth wrong NIP', async () => {
    const d = device();
    await miss(d, S, MAX_PIN_FAILURES - 1);
    assert.deepEqual(await attemptNip(d.deps, S, wrong), { status: 'wrong', lockedMs: 30_000 });
  });

  it('refuses while locked without running the check, by the injected clock', async () => {
    const d = device();
    await miss(d, S, MAX_PIN_FAILURES);
    d.advance(10_000);
    let checked = 0;
    const result = await attemptNip(d.deps, S, async () => {
      checked += 1;
      return right();
    });
    assert.deepEqual(result, { status: 'locked', lockedMs: 20_000 });
    assert.equal(checked, 0);
    d.advance(20_000);
    assert.equal((await attemptNip(d.deps, S, right)).status, 'ok');
  });

  it('is one count for every path that checks the same NIP', async () => {
    const d = device();
    const signIn = (): Promise<unknown> => attemptNip(d.deps, S, wrong);
    const cancel = (): Promise<unknown> => attemptNip(d.deps, S, wrong);
    await signIn();
    await cancel();
    await signIn();
    await cancel();
    assert.deepEqual(await signIn(), { status: 'wrong', lockedMs: 30_000 });
    assert.equal((await attemptNip(d.deps, S, right)).status, 'locked');
  });

  it('clears the subject’s count and level with their own right NIP', async () => {
    const d = device();
    await miss(d, S, MAX_PIN_FAILURES);
    d.advance(30_000);
    await miss(d, S, 2);
    assert.deepEqual([d.of(S).failures, d.of(S).level], [2, 1]);
    assert.equal((await attemptNip(d.deps, S, right)).status, 'ok');
    assert.deepEqual(d.of(S), NO_LOCKOUT);
    await miss(d, S, MAX_PIN_FAILURES - 1);
    assert.deepEqual(await attemptNip(d.deps, S, wrong), { status: 'wrong', lockedMs: 30_000 });
  });

  it('lets a failure that is not a wrong NIP through, counting nothing', async () => {
    const d = device();
    await miss(d, S, 2);
    const refused = new Error('No tienes permiso para cancelar ventas');
    await assert.rejects(
      attemptNip(d.deps, S, async () => {
        throw refused;
      }),
      (e) => e === refused,
    );
    assert.equal(d.of(S).failures, 2);
  });
});

describe('attemptNip: per NIP owner', () => {
  it('a coworker’s own right NIP does not reset the guesses at someone else’s', async () => {
    const d = device();
    await miss(d, S, MAX_PIN_FAILURES - 1);
    assert.deepEqual(await attemptNip(d.deps, A, right), { status: 'ok', value: 'in' });
    assert.equal(d.of(S).failures, MAX_PIN_FAILURES - 1, 'A signing in left S as it was');
    assert.deepEqual(await attemptNip(d.deps, S, wrong), { status: 'wrong', lockedMs: 30_000 });
    assert.equal((await attemptNip(d.deps, S, right)).status, 'locked');
  });

  it('repeated, the alternating attack climbs the subject’s ladder', async () => {
    const d = device();
    const waits: number[] = [];
    for (let round = 0; round < 6; round += 1) {
      await miss(d, S, MAX_PIN_FAILURES - 1);
      assert.equal((await attemptNip(d.deps, A, right)).status, 'ok');
      const fifth = await attemptNip(d.deps, S, wrong);
      waits.push(fifth.status === 'wrong' ? fifth.lockedMs : -1);
      assert.equal(d.of(S).level, round + 1);
      d.advance(waits[round] ?? 0);
    }
    assert.deepEqual(waits, [30_000, 60_000, 300_000, 900_000, 3_600_000, 3_600_000]);
  });

  it('locks the subject only: everyone else keeps working', async () => {
    const d = device();
    await miss(d, S, MAX_PIN_FAILURES);
    let checked = 0;
    const result = await attemptNip(d.deps, A, async () => {
      checked += 1;
      return right();
    });
    assert.deepEqual([result.status, checked], ['ok', 1]);
    assert.deepEqual(await attemptNip(d.deps, A, wrong), { status: 'wrong', lockedMs: 0 });
    assert.equal(d.of(A).failures, 1);
    assert.equal((await attemptNip(d.deps, S, right)).status, 'locked');
  });

  it('a right NIP clears that subject’s entry and nobody else’s', async () => {
    const d = device();
    await miss(d, S, 3);
    await miss(d, A, 2);
    assert.equal((await attemptNip(d.deps, A, right)).status, 'ok');
    assert.deepEqual(d.subjects(), [S]);
    assert.equal(d.of(S).failures, 3);
    assert.equal((await attemptNip(d.deps, S, right)).status, 'ok');
    assert.deepEqual(parsePinLockouts(d.raw()), NO_LOCKOUTS);
  });

  it('stores the versioned map, with no clean entry in it', async () => {
    const d = device();
    await miss(d, S, 1);
    await attemptNip(d.deps, A, right);
    assert.deepEqual(JSON.parse(d.raw() ?? ''), {
      v: 2,
      by: { [S]: { failures: 1, lockedUntil: null, level: 0 } },
    });
  });
});

describe('attemptNip: what an older build left in the store', () => {
  const until = new Date(t0.getTime() + 12_000).toISOString();

  it('reads the pre-ladder shape as no lockouts and writes the map over it', async () => {
    const d = device(JSON.stringify({ failures: 4, lockedUntil: until }));
    assert.deepEqual(await attemptNip(d.deps, S, wrong), { status: 'wrong', lockedMs: 0 });
    assert.deepEqual(JSON.parse(d.raw() ?? ''), {
      v: 2,
      by: { [S]: { failures: 1, lockedUntil: null, level: 0 } },
    });
  });

  it('reads the device-wide ladder shape as no lockouts', async () => {
    const d = device(JSON.stringify({ failures: 0, lockedUntil: until, level: 3 }));
    assert.deepEqual(await attemptNip(d.deps, S, right), { status: 'ok', value: 'in' });
    assert.equal(d.writes(), 0, 'nothing of S to clear');
  });
});

describe('nipGuardOver', () => {
  it('keeps the map in app_config under the key the phone always used', async () => {
    const rows = new Map<string, string>();
    const config = {
      get: async (key: string) => rows.get(key) ?? null,
      set: async (key: string, value: string) => void rows.set(key, value),
    };
    const deps = nipGuardOver(config, async () => t0);
    assert.equal(PIN_LOCKOUT_KEY, 'pinLockout');
    await attemptNip(deps, S, wrong);
    assert.deepEqual([...rows.keys()], ['pinLockout']);
    assert.equal(lockoutOf(parsePinLockouts(rows.get('pinLockout') ?? null), S).failures, 1);
  });
});
