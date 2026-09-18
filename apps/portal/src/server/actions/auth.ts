'use server';

import { compare } from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { Role } from '@/session/types';

import { db } from '../db';
import { SESSION_COOKIE, serializeSession, type SessionClaims } from '../session';

/**
 * Email + password sign-in.
 *
 * `auth.users` holds the identity in Supabase's own column shape, and the
 * password is bcrypt at cost 10 on both sides, so this check is identical
 * against either issuer. Adopting GoTrue replaces this function; nothing
 * downstream of the session cookie changes.
 *
 * The membership lookup runs **outside** any tenant transaction on purpose:
 * it is the query that decides *which* tenant, so it cannot be scoped by one.
 * It is also the only query in the portal that reads across tenants, which is
 * why it selects a single row by user id and returns nothing else.
 */
export type LoginResult = { ok: true } | { ok: false; message: string };

const WRONG = 'Correo o contraseña incorrectos.';

export async function login(email: string, password: string): Promise<LoginResult> {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0 || password.length === 0) {
    return { ok: false, message: 'Escribe tu correo y tu contraseña.' };
  }

  const rows = await db().execute<{ id: string; email: string; encrypted_password: string | null }>(
    sql`SELECT id::text, email, encrypted_password FROM auth.users WHERE email = ${trimmed}`,
  );
  const user = rows[0];

  // One message for "no such account" and "wrong password" alike: distinguishing
  // them tells an attacker which addresses are registered.
  if (!user?.encrypted_password) return { ok: false, message: WRONG };
  if (!(await compare(password, user.encrypted_password))) return { ok: false, message: WRONG };

  // Through `xangarro.memberships_for_user`, not a plain SELECT. Sign-in is the
  // query that decides *which* tenant, so it cannot be scoped to one — and with
  // no claim set, `tenant_isolation` correctly returns zero rows. The function
  // is SECURITY DEFINER with a surface of exactly one user id, which is far
  // narrower than handing the app a BYPASSRLS role for this one lookup.
  const members = await db().execute<{ business_id: string; role: Role }>(
    sql`SELECT business_id, role FROM xangarro.memberships_for_user(${user.id})`,
  );
  const member = members[0];

  if (!member) {
    return { ok: false, message: 'Tu cuenta aún no pertenece a ningún negocio.' };
  }

  const claims: SessionClaims = {
    sub: user.id,
    email: user.email,
    role: 'authenticated',
    business_id: member.business_id,
    member_role: member.role,
  };

  const jar = await cookies();
  jar.set(SESSION_COOKIE, serializeSession(claims), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function logout(): Promise<never> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/login');
}
