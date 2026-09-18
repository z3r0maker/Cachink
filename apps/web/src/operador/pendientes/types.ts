import type { Money } from '@xangarro/domain';

import type { EstadoMode } from '../estado';

/** A record captured on this register and not yet accepted by the server. */
export interface RegistroEnCola {
  readonly id: string;
  readonly tipo: 'venta' | 'gasto';
  /** «Venta V-0412», «Gasto · Gas». */
  readonly titulo: string;
  readonly detalle: string;
  /** Always positive; a gasto shows with «−». */
  readonly monto: Money;
  readonly hora: string;
}

export interface PendientesScreenProps {
  readonly state: 'happy' | EstadoMode;
  readonly cola: readonly RegistroEnCola[];
}
