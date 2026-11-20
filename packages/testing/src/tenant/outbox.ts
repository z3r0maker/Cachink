import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The dev email outbox (B-14): without `RESEND_API_KEY` the portal writes each
 * message as an `.eml` in a folder, `apps/web/.email-outbox/` or a Synth
 * corrida's own (`EMAIL_OUTBOX_DIR`). The portal's e2e and Synth's signup runs
 * (S-10) both read their links from here.
 */

/** The newest message in `dir` to `to`, with its base64 parts decoded, or null. */
export async function latestMailTo(dir: string, to: string): Promise<string | null> {
  const names = (await readdir(dir).catch(() => [])).filter((n) => n.endsWith('.eml'));
  const mails = await Promise.all(
    names.map(async (n) => ({
      raw: await readFile(join(dir, n), 'utf8'),
      at: (await stat(join(dir, n))).mtimeMs,
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

/** `text` matched literally inside a RegExp: every metacharacter escaped, the backslash too. */
const literal = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** The emailed link's path and token, e.g. `/login/entrar?t=…`, or null. */
export async function linkIn(dir: string, to: string, path: string): Promise<string | null> {
  const body = await latestMailTo(dir, to);
  const m = body?.match(new RegExp(`${literal(path)}\\?t=[A-Za-z0-9_-]{43}`));
  return m?.[0] ?? null;
}
