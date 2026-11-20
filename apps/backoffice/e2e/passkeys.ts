import type { CDPSession, Page } from '@playwright/test';
import { softPasskey, type SoftPasskey } from '@xangarro/auth-core/testing';
import { passkeyUserHandle } from '@xangarro/auth-core';
import type postgres from 'postgres';

/**
 * Passkeys for the browser suites (ADR-160), through Chromium's virtual
 * authenticator (CDP `WebAuthn.*`): user verification always succeeds and
 * presence is simulated, so a tap is a click.
 *
 * A fixture seeds a member's passkey straight into `staff_passkeys` (as the
 * owner, the way a link would leave it) and keeps the private key here; a
 * spec then loads it into its page's authenticator. The auth suite registers
 * its own through the real link page instead.
 */
export const RP_ID = 'localhost';

const seeded = new Map<string, SoftPasskey>();
const authenticators = new WeakMap<Page, { cdp: CDPSession; id: string }>();

/** Gives the member one passkey, as a used link would have; the key stays in this worker. */
export async function seedPasskey(
  sql: postgres.Sql,
  staffId: string,
  email: string,
): Promise<void> {
  const key = softPasskey(passkeyUserHandle(staffId));
  await sql`
    INSERT INTO staff_passkeys (id, staff_id, public_key, counter, transports, aaguid, backed_up, nombre, origen)
    VALUES (${key.id}, ${staffId}, ${Buffer.from(key.cosePublicKey)}, 0, '{internal}',
            '00000000-0000-0000-0000-000000000000', false, 'Llave de este equipo', 'enlace')`;
  seeded.set(email.toLowerCase(), key);
}

/** The page's virtual authenticator: one per page, made on first use. */
export async function virtualAuthenticator(page: Page): Promise<{ cdp: CDPSession; id: string }> {
  const known = authenticators.get(page);
  if (known !== undefined) return known;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  const made = { cdp, id: authenticatorId };
  authenticators.set(page, made);
  return made;
}

const b64 = (base64url: string) => Buffer.from(base64url, 'base64url').toString('base64');

/**
 * Loads the member's seeded passkey into the page's authenticator, its
 * counter where the database left it (a counter that goes backwards is
 * refused, which is the point of it). Once per page.
 */
export async function loadPasskey(page: Page, email: string, counter: number): Promise<void> {
  const key = seeded.get(email.toLowerCase());
  if (key === undefined) throw new Error(`no passkey seeded for ${email} in this worker`);
  const { cdp, id } = await virtualAuthenticator(page);
  const { credentials } = await cdp.send('WebAuthn.getCredentials', { authenticatorId: id });
  if (credentials.some((c) => c.credentialId === b64(key.id))) return;
  await cdp.send('WebAuthn.addCredential', {
    authenticatorId: id,
    credential: {
      credentialId: b64(key.id),
      isResidentCredential: true,
      rpId: RP_ID,
      privateKey: key.pkcs8,
      userHandle: b64(key.userHandle),
      signCount: counter,
    },
  });
}

/** The seeded passkey's credential id (base64url, as `staff_passkeys.id`). */
export function seededPasskeyId(email: string): string {
  const key = seeded.get(email.toLowerCase());
  if (key === undefined) throw new Error(`no passkey seeded for ${email} in this worker`);
  return key.id;
}
