/**
 * `user@host:port/db` of the console's `DATABASE_URL` — never the password —
 * so a log line or a dev-phase banner can say **which** database was
 * consulted. During environment setup that is the difference between "I
 * mistyped the password" and "this deployment points at the wrong database".
 */
export function dbFingerprint(url = process.env.DATABASE_URL): string {
  if (!url) return 'sin DATABASE_URL';
  try {
    const u = new URL(url);
    return `${decodeURIComponent(u.username)}@${u.host}${u.pathname}`;
  } catch {
    return 'DATABASE_URL no parseable';
  }
}
