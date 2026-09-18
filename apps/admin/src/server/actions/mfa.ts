'use server';

import { redirect } from 'next/navigation';

import { MFA_PATH } from '../gate';
import { requireStaffPage } from '../staff';
import { supabaseServer } from '../supabase/server';
import { field, type FormState } from './form-state';

/**
 * Verify a 6-digit TOTP code against a factor. Used for both first-time
 * enrolment (verifying an unverified factor makes it verified) and for the
 * per-session challenge; either way success raises the session to AAL2.
 *
 * Only an allowlisted user can reach this: `requireStaffPage(MFA_PATH)` runs
 * the same gate as the proxy, which refuses non-staff before MFA is offered.
 */
export async function verifyTotp(_prev: FormState, form: FormData): Promise<FormState> {
  await requireStaffPage(MFA_PATH);
  const factorId = field(form, 'factorId');
  const code = field(form, 'code').replace(/\s/g, '');
  if (factorId === '' || !/^\d{6}$/.test(code)) {
    return { ok: false, message: 'Escribe los 6 dígitos de tu app de autenticación.' };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) {
    console.error('admin mfa verify failed', error.code ?? error.message);
    return { ok: false, message: 'El código no es válido o ya expiró. Intenta con el siguiente.' };
  }
  redirect('/');
}
