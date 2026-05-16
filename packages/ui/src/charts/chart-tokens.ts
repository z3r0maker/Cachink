/**
 * Chart color palette and helper utilities consumed by all chart components.
 *
 * Three hex values (#8B5CF6, #0EA5E9, #EC4899) are introduced for category
 * differentiation. They complement the existing theme palette without clashing.
 * If adopted long-term, promote to theme.ts via an ADR.
 */

import { colors } from '../theme';
import type { Money } from '@cachink/domain';

/** 10-category chart fills — aligned with ExpenseCategory order. */
export const CHART_PALETTE = [
  colors.blue, // Materia Prima
  colors.green, // Inventario
  colors.red, // Nómina
  colors.warning, // Renta
  '#8B5CF6', // Publicidad (purple)
  '#0EA5E9', // Mantenimiento (sky)
  '#6366F1', // Servicios (indigo)
  '#EC4899', // Logística (pink)
  colors.gray600, // Impuestos
  colors.black, // Otro
] as const;

/** Semantic chart colors for income/expense/subtotal axes. */
export const SEMANTIC = {
  positive: colors.green,
  negative: colors.red,
  neutral: colors.gray400,
  income: colors.green,
  expense: colors.red,
  subtotal: colors.blue,
} as const;

/** Clamp a numeric value to 0–max range, returning a percentage 0–100. */
export function clampPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  const ratio = (value / max) * 100;
  return Math.max(0, Math.min(100, ratio));
}

/**
 * Convert a Money bigint (centavos) to a plain number for chart coordinates.
 * Display only — never stored or used in domain calculations.
 */
export function moneyToNumber(m: Money): number {
  return Number(m) / 100;
}

const PESO_SIGN = '$';

/**
 * Format a numeric amount into a compact chart label.
 * Examples: "$12.5K", "$1.2M", "$850", "$1.5"
 */
export function formatChartLabel(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    return sign + PESO_SIGN + millions.toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    return sign + PESO_SIGN + thousands.toFixed(1).replace(/\.0$/, '') + 'K';
  }
  if (Number.isInteger(abs)) {
    return sign + PESO_SIGN + String(abs);
  }
  const formatted = abs.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return sign + PESO_SIGN + formatted;
}
