'use server';

import { redirect } from 'next/navigation';

import { supabaseServer } from '../supabase/server';
import { field, type FormState } from './form-state';

/**
 * Email + password against Supabase Auth. Success only proves identity: the
 * redirect to `/` goes back through the proxy, which then applies the
 * allowlist and the AAL2 requirement (→ 403 or → /mfa).
 */
export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = field(form, 'email').toLowerCase();
  const password = form.get('password');
  if (email === '' || typeof password !== 'string' || password === '') {
    return { ok: false, message: 'Escribe tu correo y tu contraseña.' };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('admin login failed', error.code ?? error.message);
    // One message for unknown account and wrong password alike.
    return { ok: false, message: 'Correo o contraseña incorrectos.' };
  }
  redirect('/');
}

export async function logout(): Promise<never> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
