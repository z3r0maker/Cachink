/**
 * SupabaseAuthConnector — the only `CloudAuth` implementation shipped in
 * Phase 1E. Wraps `@supabase/supabase-js` with the Cachink-specific
 * JWT-claims extraction (`business_id`, `role`) so the UI gets a clean
 * `CloudCredentials` record on every sign-in / refresh (ADR-035).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  CloudAuth,
  CloudAuthConfig,
  CloudCredentials,
  SignInPayload,
  SignUpPayload,
} from './cloud-auth.js';

interface JwtClaims {
  business_id?: string;
  role?: 'Operativo' | 'Director';
  sub?: string;
  exp?: number;
}

function decodeClaims(jwt: string): JwtClaims {
  const payload = jwt.split('.')[1];
  if (!payload) return {};
  try {
    const json = globalThis.atob
      ? globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      : Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(json) as JwtClaims;
  } catch {
    return {};
  }
}

function toCredentials(accessToken: string): CloudCredentials | null {
  const claims = decodeClaims(accessToken);
  if (!claims.sub || !claims.business_id || !claims.role) return null;
  return {
    accessToken,
    userId: claims.sub,
    businessId: claims.business_id,
    role: claims.role,
    expiresAt: (claims.exp ?? 0) * 1000,
  };
}

export class SupabaseAuthConnector implements CloudAuth {
  readonly #client: SupabaseClient;

  constructor(config: CloudAuthConfig) {
    this.#client = createClient(config.projectUrl, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, flowType: 'pkce' },
    });
  }

  async signIn(payload: SignInPayload): Promise<CloudCredentials> {
    const { data, error } = await this.#client.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    if (error) throw new Error(error.message);
    const creds = data.session ? toCredentials(data.session.access_token) : null;
    if (!creds) throw new Error('Sesión inválida');
    return creds;
  }

  async signUp(payload: SignUpPayload): Promise<CloudCredentials> {
    const { data, error } = await this.#client.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: { data: { business_name: payload.businessName } },
    });
    if (error) throw new Error(error.message);
    const creds = data.session ? toCredentials(data.session.access_token) : null;
    if (!creds) throw new Error('No se pudo crear la cuenta');
    return creds;
  }

  async signInMagicLink(email: string): Promise<void> {
    const { error } = await this.#client.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    const { error } = await this.#client.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.#client.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }

  async getSession(): Promise<CloudCredentials | null> {
    const { data, error } = await this.#client.auth.getSession();
    if (error || !data.session) return null;
    return toCredentials(data.session.access_token);
  }

  async fetchCredentials(): Promise<CloudCredentials | null> {
    return this.getSession();
  }

  onAuthStateChange(listener: (creds: CloudCredentials | null) => void): () => void {
    const { data } = this.#client.auth.onAuthStateChange((_event, session) => {
      listener(session ? toCredentials(session.access_token) : null);
    });
    return () => data.subscription.unsubscribe();
  }
}
