import type { Json } from './validate.ts';

/**
 * A validated input as a table row: camelCase keys become the snake_case
 * columns, and absent values become `null` (F-10). One mapping for both
 * tables, instead of two hand-written copies of every column name.
 */
const snake = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export function toRow(input: object): Json {
  return Object.fromEntries(Object.entries(input).map(([k, v]) => [snake(k), v ?? null]));
}

/** sha256(errorName|operation|first 100 chars of the message), hex. */
export async function computeFingerprint(
  errorName: string,
  operation: string | undefined,
  errorMessage: string,
): Promise<string> {
  const input = `${errorName}|${operation ?? ''}|${errorMessage.slice(0, 100)}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
