/** The topics «Ayuda» files its answers and guides under (ADR-107). */
export type TemaId = 'empezar' | 'ventas' | 'productos' | 'cajas' | 'estados' | 'plan';

export interface Tema {
  readonly id: TemaId;
  readonly label: string;
}

export const TEMAS: readonly Tema[] = [
  { id: 'empezar', label: 'Para empezar' },
  { id: 'ventas', label: 'Ventas y cortes' },
  { id: 'productos', label: 'Productos e inventario' },
  { id: 'cajas', label: 'Cajas y sincronización' },
  { id: 'estados', label: 'Estados financieros' },
  { id: 'plan', label: 'Tu plan y pagos' },
];
