import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * The last error of a session (P-48, ADR-162 §8): kept with the session on
 * the server when an error is reported, read back when «Algo no funciona» is
 * sent. Keeping it is a courtesy to the report, so it must never fail the
 * request that was already failing.
 */
const noteSessionError = vi.fn();
const sessionLastError = vi.fn();
const sessionToken = vi.fn();
const after = vi.fn();

vi.mock('@xangarro/data-pg', () => ({ noteSessionError, sessionLastError }));
vi.mock('next/server', () => ({ after }));
vi.mock('../src/server/db', () => ({ db: () => 'the-db' }));
vi.mock('../src/server/session', () => ({ SESSION_COOKIE: 'xg_session', sessionToken }));

const { keepLastError, keepLastErrorFor, lastErrorOfSession, tokenFromCookieHeader } =
  await import('../src/server/observability/last-error');

/** 256 random bits in base64url, the shape `mintToken` hands out. */
const TOKEN = 'A'.repeat(43);
const EVENT = 'a3f1c2d4e5b60718293a4b5c6d7e8f90';

beforeEach(() => {
  vi.clearAllMocks();
  noteSessionError.mockResolvedValue(true);
  sessionToken.mockResolvedValue(TOKEN);
  after.mockImplementation((task: () => Promise<void>) => void task());
});

/** Lets the tasks `keepLastError` schedules run to their end. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('tokenFromCookieHeader', () => {
  it('finds the session cookie among the others', () => {
    assert.equal(tokenFromCookieHeader(`tema=oscuro; xg_session=${TOKEN}; otra=1`), TOKEN);
    assert.equal(tokenFromCookieHeader([`a=b`, `xg_session=${TOKEN}`]), TOKEN);
  });

  it('is null without the cookie, without a header, and for a value that is not a token', () => {
    assert.equal(tokenFromCookieHeader('tema=oscuro'), null);
    assert.equal(tokenFromCookieHeader(undefined), null);
    assert.equal(tokenFromCookieHeader('xg_session=corto'), null);
    assert.equal(tokenFromCookieHeader(`no_xg_session=${TOKEN}`), null);
  });
});

describe('keepLastErrorFor', () => {
  it('keeps the event with the session the token names', async () => {
    await keepLastErrorFor(TOKEN, EVENT);
    assert.deepEqual(noteSessionError.mock.calls, [['the-db', TOKEN, EVENT]]);
  });

  it('keeps nothing without a session or without an event', async () => {
    await keepLastErrorFor(null, EVENT);
    await keepLastErrorFor(TOKEN, undefined);
    assert.equal(noteSessionError.mock.calls.length, 0);
  });

  it('a database that is down is one log line, never a second failure', async () => {
    const line = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    noteSessionError.mockRejectedValue(new Error('connection refused'));
    await keepLastErrorFor(TOKEN, EVENT);
    assert.equal(line.mock.calls.length, 1);
    assert.match(String(line.mock.calls[0]?.[0]), /last_error_not_kept/);
    line.mockRestore();
  });
});

describe('keepLastError, from inside a server action', () => {
  it('keeps the event after the response, under the request’s own session', async () => {
    keepLastError(EVENT);
    assert.equal(after.mock.calls.length, 1);
    await settled();
    assert.deepEqual(noteSessionError.mock.calls, [['the-db', TOKEN, EVENT]]);
  });

  it('does nothing at all when nothing was reported', async () => {
    keepLastError(undefined);
    await settled();
    assert.equal(after.mock.calls.length, 0);
    assert.equal(sessionToken.mock.calls.length, 0);
  });

  it('outside a request it neither throws nor keeps anything', async () => {
    after.mockImplementation(() => {
      throw new Error('`after` was called outside a request scope');
    });
    sessionToken.mockRejectedValue(new Error('`cookies` was called outside a request scope'));
    assert.doesNotThrow(() => keepLastError(EVENT));
    await settled();
    assert.equal(noteSessionError.mock.calls.length, 0);
  });
});

describe('lastErrorOfSession', () => {
  it('reads what the request’s session was last shown', async () => {
    const last = { eventId: EVENT, at: '2026-11-20T18:03:11.000Z' };
    sessionLastError.mockResolvedValue(last);
    assert.deepEqual(await lastErrorOfSession(), last);
    assert.deepEqual(sessionLastError.mock.calls, [['the-db', TOKEN]]);
  });

  it('is null without a session, and never asks the database', async () => {
    sessionToken.mockResolvedValue(null);
    assert.equal(await lastErrorOfSession(), null);
    assert.equal(sessionLastError.mock.calls.length, 0);
  });

  it('a read that fails is no error to attach: the report still goes', async () => {
    const line = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sessionLastError.mockRejectedValue(new Error('timeout'));
    assert.equal(await lastErrorOfSession(), null);
    assert.match(String(line.mock.calls[0]?.[0]), /last_error_not_read/);
    line.mockRestore();
  });
});
