/**
 * Cloud auth — provider-agnostic surface that Phase 1E's UI consumes
 * (ADR-035).
 *
 * The `SupabaseAuthConnector` in `./supabase-auth.ts` is the only
 * implementation shipped today; Neon-with-Clerk and self-hosted variants
 * can plug in later without touching the UI layer.
 *
 * Every method is async; every error propagates as an `Error` with a
 * user-facing `.message` (no error codes sprinkled through the UI).
 */

export interface CloudCredentials {
  /** JWT delivered to PowerSync in the `Authorization: Bearer …` header. */
  readonly accessToken: string;
  /** Stable identifier for the signed-in user. */
  readonly userId: string;
  /** ULID of the business the JWT grants access to. */
  readonly businessId: string;
  /** Role claim baked into the JWT (`Operativo` or `Director`). */
  readonly role: 'Operativo' | 'Director';
  /** Monotonic expiry — the connector refreshes the token before this. */
  readonly expiresAt: number;
}

export interface SignInPayload {
  readonly email: string;
  readonly password: string;
}

export interface SignUpPayload {
  readonly email: string;
  readonly password: string;
  /** Business name seeded into the new `businesses` row. */
  readonly businessName: string;
}

export interface CloudAuth {
  signIn(payload: SignInPayload): Promise<CloudCredentials>;
  signUp(payload: SignUpPayload): Promise<CloudCredentials>;
  signInMagicLink(email: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  /** Returns `null` when no session is persisted or it has expired. */
  getSession(): Promise<CloudCredentials | null>;
  /** PowerSync connector hook — returns live credentials for the upload queue. */
  fetchCredentials(): Promise<CloudCredentials | null>;
  /** Subscribe to auth state changes (sign-in / sign-out / token refresh). */
  onAuthStateChange(listener: (creds: CloudCredentials | null) => void): () => void;
}

export interface CloudAuthConfig {
  readonly projectUrl: string;
  readonly anonKey: string;
  readonly powersyncUrl?: string | null;
}
