/**
 * «Cómo quieres enterarte» (P-32): which avisos reach a member in the portal
 * and by email. WhatsApp is designed but not delivered, so it has no channel
 * here yet. **A critical aviso cannot be switched off** — the matrix shows it
 * locked, and the rule refuses regardless.
 *
 * Stored per member as a sparse map of overrides; everything unset takes its
 * type's default, so a new type needs no migration.
 */

export type Canal = 'portal' | 'correo';

export const TIPOS_DE_AVISO = [
  {
    tipo: 'discrepancia_caja',
    label: 'Discrepancia en caja',
    critico: true,
    portal: true,
    correo: true,
  },
  {
    tipo: 'registros_no_enviados',
    label: 'Registros no enviados',
    critico: true,
    portal: true,
    correo: true,
  },
  { tipo: 'stock_bajo', label: 'Stock bajo', critico: false, portal: true, correo: false },
  {
    tipo: 'gasto_recurrente',
    label: 'Gasto recurrente confirmado',
    critico: false,
    portal: true,
    correo: false,
  },
  {
    tipo: 'cambio_operadores',
    label: 'Cambio de operadores',
    critico: false,
    portal: true,
    correo: false,
  },
  {
    tipo: 'funcion_cambiada',
    label: 'Función activada o desactivada',
    critico: false,
    portal: true,
    correo: false,
  },
] as const;

export type TipoAviso = (typeof TIPOS_DE_AVISO)[number]['tipo'];

export type PreferenciasGuardadas = Partial<Record<TipoAviso, Partial<Record<Canal, boolean>>>>;

export interface FilaPreferencia {
  readonly tipo: TipoAviso;
  readonly label: string;
  readonly critico: boolean;
  readonly portal: boolean;
  readonly correo: boolean;
}

export class AvisoObligatorioError extends Error {
  readonly code = 'AVISO_OBLIGATORIO' as const;

  constructor() {
    super('Este aviso es obligatorio: siempre te llega.');
    this.name = 'AvisoObligatorioError';
  }
}

/** The full matrix: defaults, then the member's overrides; critical rows forced on. */
export function preferenciasEfectivas(guardadas: PreferenciasGuardadas): FilaPreferencia[] {
  return TIPOS_DE_AVISO.map((t) => {
    const o = t.critico ? {} : (guardadas[t.tipo] ?? {});
    return {
      tipo: t.tipo,
      label: t.label,
      critico: t.critico,
      portal: o.portal ?? t.portal,
      correo: o.correo ?? t.correo,
    };
  });
}

/** The stored map after one switch; refuses touching a critical type. */
export function cambiarCanal(
  guardadas: PreferenciasGuardadas,
  tipo: TipoAviso,
  canal: Canal,
  on: boolean,
): PreferenciasGuardadas {
  const t = TIPOS_DE_AVISO.find((x) => x.tipo === tipo);
  if (t === undefined) throw new TypeError(`Tipo de aviso desconocido: ${String(tipo)}`);
  if (t.critico) throw new AvisoObligatorioError();
  return { ...guardadas, [tipo]: { ...guardadas[tipo], [canal]: on } };
}
