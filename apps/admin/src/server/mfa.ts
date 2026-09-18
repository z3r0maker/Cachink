import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { mfaStep, type Aal } from './gate';

/**
 * What the /mfa page renders, from the user's factors (Supabase `auth.mfa`).
 *
 * Enrolment creates an **unverified** TOTP factor each time it runs, so any
 * stale unverified ones from an abandoned attempt are removed first — they
 * would otherwise pile up and, at Supabase's per-user factor cap, block a
 * staff member from ever enrolling.
 */
export type MfaView =
  | {
      readonly step: 'enrol';
      readonly factorId: string;
      readonly qr: string;
      readonly secret: string;
    }
  | { readonly step: 'challenge'; readonly factorId: string }
  | { readonly step: 'done' }
  | { readonly step: 'error'; readonly message: string };

const FAILED: MfaView = {
  step: 'error',
  message: 'No pudimos preparar la verificación en dos pasos. Recarga la página.',
};

async function enrol(client: SupabaseClient): Promise<MfaView> {
  const list = await client.auth.mfa.listFactors();
  for (const f of list.data?.all ?? []) {
    if (f.factor_type === 'totp' && f.status === 'unverified') {
      await client.auth.mfa.unenroll({ factorId: f.id });
    }
  }
  const { data, error } = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `Consola Xangarro ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) {
    console.error('admin mfa enroll failed', error?.code ?? error?.message);
    return FAILED;
  }
  return { step: 'enrol', factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function prepareMfa(client: SupabaseClient, aal: Aal | null): Promise<MfaView> {
  const { data, error } = await client.auth.mfa.listFactors();
  if (error || !data) {
    console.error('admin mfa listFactors failed', error?.code ?? error?.message);
    return FAILED;
  }
  const verified = data.totp.filter((f) => f.status === 'verified');
  const step = mfaStep({ aal, verifiedFactors: verified.length });
  if (step === 'done') return { step };
  if (step === 'challenge' && verified[0]) return { step, factorId: verified[0].id };
  return enrol(client);
}
