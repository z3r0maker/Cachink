import type { Money } from '@xangarro/domain';

/** Something an operator created at the counter so the sale would not stop (ADR-074 §2). */
interface CreadoEnCaja {
  readonly id: string;
  readonly nombre: string;
  /** «Ana Robledo · Caja 1 · hoy 13:20 · vendido 4 veces desde entonces». */
  readonly detalle: string;
  readonly tint: string;
  /** The existing record it looks like, offered for a merge. */
  readonly pareceA?: string;
  /** The duplicate's id — where a merge's facts move. */
  readonly pareceAId?: string;
}

export interface ProductoCaja extends CreadoEnCaja {
  readonly precio: Money;
}

export interface ClienteCaja extends CreadoEnCaja {
  readonly telefono: string;
  /** Credit already given since it was created. */
  readonly fiado: Money;
}

export type Pestana = 'productos' | 'clientes';

export interface RevisionData {
  readonly productos: readonly ProductoCaja[];
  readonly clientes: readonly ClienteCaja[];
  /** Sales of unreviewed products, which carry no cost and no margin yet. */
  readonly vendidoSinCosto: Money;
}
