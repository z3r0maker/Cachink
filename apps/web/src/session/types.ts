import type { FeatureFlagKey, PlanCapabilities, PlanId } from '@xangarro/domain';

/**
 * What a screen needs to know about who is looking at it.
 *
 * Roles come from `business_members` (ADR-053 Q11). Operators are not portal
 * members and never appear here.
 */
export type Role = 'owner' | 'admin' | 'viewer';

export const ROLE_LABEL: Readonly<Record<Role, string>> = {
  owner: 'Dueño',
  admin: 'Administrador',
  viewer: 'Solo lectura',
};

/**
 * Plan-level gates with no tenant switch (ADR-059).
 *
 * Re-exported from `@xangarro/domain` rather than redeclared: the shape rides
 * in the signed entitlement, so a second definition here would be a second
 * source of truth (CLAUDE.md §2.3).
 */
export type Capabilities = PlanCapabilities;

export interface Session {
  readonly role: Role;
  readonly businessId: string;
  readonly businessName: string;
  readonly planId: PlanId;
  readonly capabilities: Capabilities;
  /** Tenant-toggleable business capabilities, already resolved three ways. */
  readonly features: Readonly<Record<FeatureFlagKey, boolean>>;
}

/**
 * The lifecycle of a screen's data, as a closed set.
 *
 * `locked` is plan gating (ADR-059); `proximamente` is the production gate on
 * anything that makes an LLM call. Both render instead of content, like the
 * other four, which is why they live in the same union.
 */
export type ScreenState = 'happy' | 'loading' | 'empty' | 'error' | 'locked' | 'proximamente';
