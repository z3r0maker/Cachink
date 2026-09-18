import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The dev email outbox (B-14): without `RESEND_API_KEY` the portal writes each
 * message as an `.eml` under `apps/portal/.email-outbox/`. The newest one to
 * `to`, with its base64 parts decoded, or null.
 */
const DIR = join(process.cwd(), '.email-outbox');

export async function latestMailTo(to: string): Promise<string | null> {
  const names = (await readdir(DIR).catch(() => [])).filter((n) => n.endsWith('.eml'));
  const mails = await Promise.all(
    names.map(async (n) => ({
      raw: await readFile(join(DIR, n), 'utf8'),
      at: (await stat(join(DIR, n))).mtimeMs,
    })),
  );
  const mine = mails.filter(
    (m) => m.raw.includes(`\nTo: ${to}\r`) || m.raw.includes(`\nTo: ${to}\n`),
  );
  const newest = mine.sort((a, b) => b.at - a.at)[0];
  if (newest === undefined) return null;
  const blocks = newest.raw.split(/\r?\n\r?\n/).slice(1);
  return blocks
    .map((b) => Buffer.from(b.replace(/\s+/g, ''), 'base64').toString('utf8'))
    .join('\n');
}

/** The emailed link's path and token, e.g. `/login/entrar?t=…`. */
export async function linkIn(to: string, path: string): Promise<string | null> {
  const body = await latestMailTo(to);
  const m = body?.match(new RegExp(`${path.replace(/\//g, '\\/')}\\?t=[A-Za-z0-9_-]{43}`));
  return m?.[0] ?? null;
}
