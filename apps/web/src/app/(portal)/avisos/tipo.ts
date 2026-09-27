import { colors } from '@xangarro/tokens';

/**
 * What an aviso is about, for its tile and the small caps over its title.
 * `notices` has no type column: the small caps name the area the aviso points
 * to (or where it came from), and the tile pairs the severity's tone with its
 * own glyph, so colour never carries the severity alone.
 */
const AREAS: readonly (readonly [string, string])[] = [
  ['/cortes', 'Cortes'],
  ['/productos', 'Productos'],
  ['/inventario', 'Productos'],
  ['/movimientos', 'Ventas y gastos'],
  ['/sincronizacion', 'Sincronización'],
  ['/negocio', 'Mi negocio'],
  ['/suscripcion', 'Plan y pagos'],
  ['/equipo', 'Equipo y nómina'],
];

const ALERTA =
  'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01';
const CIRCULO = 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0';

const SEVERIDAD = {
  critical: { bg: colors.redSoft, fg: colors.redText, icono: ALERTA },
  warning: { bg: colors.warningSoft, fg: colors.warningText, icono: `M12 8v4M12 16h.01${CIRCULO}` },
  info: { bg: colors.blueSoft, fg: colors.blueText, icono: `M12 16v-4M12 8h.01${CIRCULO}` },
  success: { bg: colors.greenSoft, fg: colors.greenText, icono: 'M20 6 9 17l-5-5' },
} as const;

const FUENTE: Record<string, string> = { sistema: 'Sistema', operacion: 'Operación' };

export interface TipoAviso {
  readonly ceja: string;
  readonly icono: string;
  readonly bg: string;
  readonly fg: string;
}

export function tipoDe(n: {
  readonly severity: string;
  readonly source: string;
  readonly ctaHref: string | null;
}): TipoAviso {
  const sev =
    n.severity in SEVERIDAD ? SEVERIDAD[n.severity as keyof typeof SEVERIDAD] : SEVERIDAD.info;
  const area = AREAS.find(([pre]) => n.ctaHref?.startsWith(pre));
  return { ceja: area?.[1] ?? FUENTE[n.source] ?? 'Xangarro', ...sev };
}
