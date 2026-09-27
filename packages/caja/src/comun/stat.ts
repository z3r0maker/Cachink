/** One figure of a stat grid (Inicio's KPIs, Mi turno's cards). */
export interface StatItem {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  /** A token colour for the figure. */
  readonly color: string;
  /** The one figure to act on: soft yellow with a black edge. */
  readonly strong?: boolean;
}
