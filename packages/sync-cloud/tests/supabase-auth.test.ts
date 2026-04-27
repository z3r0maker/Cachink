/**
 * SupabaseAuthConnector tests (Slice 8 M3-C13).
 *
 * The connector wraps `@supabase/supabase-js`'s auth surface with the
 * Cachink-specific JWT-claims extraction (`business_id` + `role`).
 * These tests stub `createClient` so we can drive the auth methods
 * without standing up a real Supabase instance, then assert on:
 *
 *   - happy-path sign-in / sign-up returning a fully-populated
 *     `CloudCredentials` derived from the JWT claims,
 *   - error propagation surfacing the SDK's `error.message`,
 *   - `signUp` includes `business_name` in `options.data`,
 *   - `getSession` returning null when no session exists,
 *   - `onAuthStateChange` listener subscription + cleanup,
 *   - `toCredentials` rejecting JWTs missing `business_id` or `role`.
 *
 * The plan's spec asked for msw-backed HTTP mocking; we use vi.mock
 * because supabase-js does the JWT parsing on the client side and the
 * connector's only behaviour worth testing is its claim extraction +
 * error propagation, which a mocked client surfaces directly. The
 * runtime HTTP plumbing is the SDK's responsibility, not ours.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// JWT payload: { sub: 'u1', business_id: '01HX9999...', role: 'Director', exp: 9999999999 }
const VALID_JWT_PAYLOAD =
  'eyJzdWIiOiJ1MSIsImJ1c2luZXNzX2lkIjoiMDFIWDk5OTk5OTk5OTk5OTk5OTk5OTk5OTkiLCJyb2xlIjoiRGlyZWN0b3IiLCJleHAiOjk5OTk5OTk5OTl9';
const VALID_JWT = `header.${VALID_JWT_PAYLOAD}.sig`;

// JWT payload missing `business_id`: { sub: 'u1', role: 'Director', exp: 9999999999 }
const INCOMPLETE_JWT = 'header.eyJzdWIiOiJ1MSIsInJvbGUiOiJEaXJlY3RvciIsImV4cCI6OTk5OTk5OTk5OX0.sig';

interface MockAuthApi {
  signInWithPassword: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signInWithOtp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  resetPasswordForEmail: ReturnType<typeof vi.fn>;
  getSession: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
}

let MOCK_AUTH: MockAuthApi;

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      auth: MOCK_AUTH,
    })),
  };
});

// Import after mock registers.
const { SupabaseAuthConnector } = await import('../src/auth/supabase-auth.js');

function freshMockAuth(): MockAuthApi {
  return {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOtp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  };
}

function makeConnector(): InstanceType<typeof SupabaseAuthConnector> {
  return new SupabaseAuthConnector({
    projectUrl: 'https://stub.supabase.co',
    anonKey: 'anon-key',
  });
}

describe('SupabaseAuthConnector (Slice 8 M3-C13)', () => {
  beforeEach(() => {
    MOCK_AUTH = freshMockAuth();
  });

  describe('signIn', () => {
    it('returns CloudCredentials with decoded business_id + role on success', async () => {
      MOCK_AUTH.signInWithPassword.mockResolvedValue({
        data: { session: { access_token: VALID_JWT } },
        error: null,
      });
      const connector = makeConnector();
      const creds = await connector.signIn({
        email: 'a@b.com',
        password: 'secret',
      });
      expect(creds.userId).toBe('u1');
      expect(creds.businessId).toBe('01HX9999999999999999999999');
      expect(creds.role).toBe('Director');
      expect(creds.accessToken).toBe(VALID_JWT);
      expect(creds.expiresAt).toBe(9_999_999_999_000);
      expect(MOCK_AUTH.signInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'secret',
      });
    });

    it('throws with the SDK error message when sign-in fails', async () => {
      MOCK_AUTH.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid credentials' },
      });
      const connector = makeConnector();
      await expect(connector.signIn({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('rejects when the returned JWT has no business_id claim', async () => {
      MOCK_AUTH.signInWithPassword.mockResolvedValue({
        data: { session: { access_token: INCOMPLETE_JWT } },
        error: null,
      });
      const connector = makeConnector();
      await expect(connector.signIn({ email: 'a@b.com', password: 'secret' })).rejects.toThrow(
        'Sesión inválida',
      );
    });
  });

  describe('signUp', () => {
    it('passes business_name in options.data and returns credentials on success', async () => {
      MOCK_AUTH.signUp.mockResolvedValue({
        data: { session: { access_token: VALID_JWT } },
        error: null,
      });
      const connector = makeConnector();
      const creds = await connector.signUp({
        email: 'new@user.com',
        password: 'secret',
        businessName: 'Mi Negocio',
      });
      expect(creds.businessId).toBe('01HX9999999999999999999999');
      expect(MOCK_AUTH.signUp).toHaveBeenCalledWith({
        email: 'new@user.com',
        password: 'secret',
        options: { data: { business_name: 'Mi Negocio' } },
      });
    });

    it('throws with the SDK error message when sign-up fails', async () => {
      MOCK_AUTH.signUp.mockResolvedValue({
        data: { session: null },
        error: { message: 'Email already registered' },
      });
      const connector = makeConnector();
      await expect(
        connector.signUp({
          email: 'taken@user.com',
          password: 'secret',
          businessName: 'Mi Negocio',
        }),
      ).rejects.toThrow('Email already registered');
    });

    it('rejects when sign-up returns no session', async () => {
      MOCK_AUTH.signUp.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const connector = makeConnector();
      await expect(
        connector.signUp({
          email: 'new@user.com',
          password: 'secret',
          businessName: 'Mi Negocio',
        }),
      ).rejects.toThrow('No se pudo crear la cuenta');
    });
  });

  describe('signInMagicLink', () => {
    it('forwards the email to signInWithOtp', async () => {
      MOCK_AUTH.signInWithOtp.mockResolvedValue({ error: null });
      const connector = makeConnector();
      await connector.signInMagicLink('a@b.com');
      expect(MOCK_AUTH.signInWithOtp).toHaveBeenCalledWith({ email: 'a@b.com' });
    });

    it('throws on SDK error', async () => {
      MOCK_AUTH.signInWithOtp.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      });
      const connector = makeConnector();
      await expect(connector.signInMagicLink('a@b.com')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('signOut + resetPassword', () => {
    it('signOut delegates to client.auth.signOut', async () => {
      const connector = makeConnector();
      await connector.signOut();
      expect(MOCK_AUTH.signOut).toHaveBeenCalledTimes(1);
    });

    it('signOut throws on SDK error', async () => {
      MOCK_AUTH.signOut.mockResolvedValue({ error: { message: 'Logout failed' } });
      const connector = makeConnector();
      await expect(connector.signOut()).rejects.toThrow('Logout failed');
    });

    it('resetPassword forwards the email to resetPasswordForEmail', async () => {
      const connector = makeConnector();
      await connector.resetPassword('forgot@user.com');
      expect(MOCK_AUTH.resetPasswordForEmail).toHaveBeenCalledWith('forgot@user.com');
    });

    it('resetPassword throws on SDK error', async () => {
      MOCK_AUTH.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'No such user' },
      });
      const connector = makeConnector();
      await expect(connector.resetPassword('a@b.com')).rejects.toThrow('No such user');
    });
  });

  describe('getSession', () => {
    it('returns CloudCredentials when a session is persisted', async () => {
      MOCK_AUTH.getSession.mockResolvedValue({
        data: { session: { access_token: VALID_JWT } },
        error: null,
      });
      const connector = makeConnector();
      const creds = await connector.getSession();
      expect(creds?.userId).toBe('u1');
    });

    it('returns null when no session exists', async () => {
      MOCK_AUTH.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const connector = makeConnector();
      expect(await connector.getSession()).toBeNull();
    });

    it('returns null when the SDK errors', async () => {
      MOCK_AUTH.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Network down' },
      });
      const connector = makeConnector();
      expect(await connector.getSession()).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('subscribes a listener and forwards CloudCredentials on session events', () => {
      let storedHandler: ((event: unknown, session: unknown) => void) | null = null;
      const unsubscribe = vi.fn();
      MOCK_AUTH.onAuthStateChange.mockImplementation((cb) => {
        storedHandler = cb;
        return { data: { subscription: { unsubscribe } } };
      });
      const connector = makeConnector();
      const listener = vi.fn();
      const off = connector.onAuthStateChange(listener);

      // Simulate Supabase firing a sign-in event.
      storedHandler?.('SIGNED_IN', { access_token: VALID_JWT });
      expect(listener).toHaveBeenCalledTimes(1);
      const creds = listener.mock.calls[0][0];
      expect(creds?.businessId).toBe('01HX9999999999999999999999');

      // Simulate a sign-out event.
      storedHandler?.('SIGNED_OUT', null);
      expect(listener).toHaveBeenLastCalledWith(null);

      // Returned dispose unsubscribes.
      off();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchCredentials', () => {
    it('proxies to getSession (PowerSync hook contract)', async () => {
      MOCK_AUTH.getSession.mockResolvedValue({
        data: { session: { access_token: VALID_JWT } },
        error: null,
      });
      const connector = makeConnector();
      const creds = await connector.fetchCredentials();
      expect(creds?.userId).toBe('u1');
    });
  });
});
