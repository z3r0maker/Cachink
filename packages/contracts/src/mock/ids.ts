/** Deterministic, valid ULIDs for fixtures. The alphabet excludes I, L, O, U — so do the kind tags. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export type IdKind = 'BZN' | 'PRS' | 'PRD' | 'CNT' | 'EMP' | 'REC' | 'DEV' | 'SAE';

function base32(n: number, width: number): string {
  let out = '';
  let v = n;
  for (let i = 0; i < width; i += 1) {
    out = ALPHABET[v % 32] + out;
    v = Math.floor(v / 32);
  }
  return out;
}

/** `01J` + a 3-char kind tag + 20 base32 digits = 26 chars. */
export function ulidOf(kind: IdKind, n: number): string {
  return `01J${kind}${base32(n, 20)}`;
}
