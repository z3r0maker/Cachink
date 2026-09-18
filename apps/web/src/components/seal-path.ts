/**
 * The *sello* geometry.
 *
 * A polygon stamp, not a trophy or a star — the shape is the brand's own
 * metaphor held still. Every pressable element in this product stamps; an award
 * for a goal is the same gesture.
 *
 * Ported from the design's own generator so the geometry matches rather than
 * approximates it. Kept in a `.ts` file, separate from the component, so it is
 * testable without a JSX transform.
 */
export function sealPath(cx: number, cy: number, r: number, n: number): string {
  const pts: readonly (readonly [number, number])[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
  const rr = (r * Math.sin(Math.PI / n) * 1.08).toFixed(1);
  const first = pts[0] ?? ([cx, cy] as const);
  let d = `M${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
  for (let i = 1; i <= n; i += 1) {
    const p = pts[i % n] ?? first;
    d += ` A${rr} ${rr} 0 0 1 ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }
  return `${d} Z`;
}
