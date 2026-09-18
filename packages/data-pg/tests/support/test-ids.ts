import { randomInt } from 'node:crypto';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const PREFIX = '01HZ8XQN9GZJXV8AK'; // 17 chars; every test id is 26 like a ULID

/**
 * A fresh, run-unique id for a row a test creates. `tag` (one char, never
 * `Z`) keeps ids from different suites apart; 8 random chars keep reruns apart.
 * Never derive one id from another by editing a character — two derived ids
 * can collide with each other or with a row an earlier run left behind.
 */
export function testId(tag: string): string {
  if (tag.length !== 1 || tag === 'Z')
    throw new Error(`testId tag must be one char, not Z: ${tag}`);
  let rand = '';
  for (let i = 0; i < 8; i += 1) rand += CROCKFORD[randomInt(CROCKFORD.length)];
  return `${PREFIX}${tag}${rand}`;
}

/** An id no test ever creates (tag `Z` is reserved), for "absent row" cases. */
export const ABSENT_ID = `${PREFIX}ZZZZZZZZZ`;
