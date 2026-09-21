/**
 * The animation's clock arithmetic (P-02), pure so a unit test can pin the
 * scene boundaries the design file specifies: 6 s / 3.5 s / 5 s / 5.5 s over
 * a 20 s loop.
 */

const DURACIONES = [6000, 3500, 5000, 5500] as const;
const TOTAL = 20_000;

/** Which scene does `ms` fall in, and how far into it (0–1)? */
export function escenaEn(ms: number): { readonly i: number; readonly p: number } {
  let t = ((ms % TOTAL) + TOTAL) % TOTAL;
  let i = 0;
  while (i < 3 && t >= (DURACIONES[i] ?? 0)) {
    t -= DURACIONES[i] ?? 0;
    i += 1;
  }
  return { i, p: t / (DURACIONES[i] ?? 6000) };
}

export const TOTAL_MS = TOTAL;
