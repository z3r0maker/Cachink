import 'server-only';

import { verifyPassword } from '@xangarro/auth-core';
import { loginLookup } from '@xangarro/data-pg';

import { db } from './db';

/**
 * The account, if the password is its (audit SEC-AUTH-02): the app role cannot
 * read `encrypted_password`, so `xangarro.login_lookup` returns one account's
 * hash, and an unknown address is compared against a dummy hash so the time
 * taken says nothing. Sign-in and «Eliminar mi cuenta» share it.
 */
export async function passwordMatches(email: string, password: string) {
  const user = await loginLookup(db(), email);
  return (await verifyPassword(password, user?.hash ?? null)) && user?.hash ? user : null;
}
