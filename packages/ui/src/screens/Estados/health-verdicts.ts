/**
 * Health verdicts for financial statement key figures.
 *
 * Pure presentation logic: given a Money value, returns a tone + verdict
 * string. Used by ResumenCard and inline HealthIndicators.
 */

import { ZERO, type Money } from '@cachink/domain';
import type { HealthTone } from '../../components/HealthIndicator/index';

type T = (key: string, options?: Record<string, unknown>) => string;

export function utilidadNetaVerdict(
  value: Money,
  t: T,
): { tone: HealthTone; verdict: string } {
  if (value > ZERO) {
    return { tone: 'healthy', verdict: t('estados.verdictUtilidadNetaPositive') };
  }
  if (value === ZERO) {
    return { tone: 'warning', verdict: t('estados.verdictUtilidadNetaZero') };
  }
  return { tone: 'critical', verdict: t('estados.verdictUtilidadNetaNegative') };
}

export function utilidadBrutaVerdict(
  value: Money,
  t: T,
): { tone: HealthTone; verdict: string } | null {
  if (value < ZERO) {
    return { tone: 'critical', verdict: t('estados.verdictUtilidadBrutaNegative') };
  }
  return null; // No special verdict for positive bruta — the health is clear from the number.
}

export function utilidadOperativaVerdict(
  value: Money,
  t: T,
): { tone: HealthTone; verdict: string } {
  if (value > ZERO) {
    return { tone: 'healthy', verdict: t('estados.verdictUtilidadOperativaPositive') };
  }
  return { tone: 'critical', verdict: t('estados.verdictUtilidadOperativaNegative') };
}
