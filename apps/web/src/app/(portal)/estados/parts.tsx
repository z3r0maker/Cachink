'use client';

import { formatMoney, type IsrMetodo, type Money } from '@xangarro/domain';

import { Card, Verdict } from '@/components';
import { eyebrow } from '@/styles/text.css';

import { isrNotice, summaryFigure } from './estados.css';

export function Resumen({
  headline,
  figure,
  label,
}: {
  readonly headline: string;
  readonly figure: Money;
  readonly label: string;
}) {
  const positive = figure > 0n;
  return (
    <Card tone={positive ? 'success' : 'danger'}>
      <span className={eyebrow}>Resumen del periodo</span>
      <p style={{ margin: '10px 0 0', fontWeight: 700 }}>{headline}</p>
      <p className={summaryFigure}>{formatMoney(figure)}</p>
      <span className={eyebrow}>{label}</span>
      <div>
        <Verdict tone={positive ? 'healthy' : 'critical'}>
          {positive
            ? 'Tu negocio fue rentable este periodo.'
            : 'Tu negocio operó a pérdida este periodo.'}
        </Verdict>
      </div>
    </Card>
  );
}

/** This disclaimer must survive into production (design handoff, ADR-058). */
/**
 * The ISR notice survives into production (P-14). The rate is the one the owner
 * set in Negocio, not a constant; a period without utilidad says why there is
 * no estimate rather than showing a zero that looks like a calculation.
 */
export interface IsrNoticeModel {
  readonly isrTasa: number;
  readonly isr: bigint;
  /** ADR-089/125: the domain's method, so the notice names the base it used. */
  readonly metodo: IsrMetodo;
}

const DISCLAIMER =
  'Es una referencia calculada con las tablas publicadas del SAT. Para tus cifras y deducciones reales, consulta a tu contador.';

/** RESICO for a persona moral is profit on cash basis (Art. 211 LISR), not gross. */
const FLUJO_MORAL =
  'En RESICO, una persona moral paga 30% sobre lo que cobró menos lo que pagó en el año; aquí usamos la utilidad del periodo.';

const titulo = (metodo: IsrMetodo, isrTasa: number): string => {
  switch (metodo) {
    case 'resico':
      return 'ISR referencial (RESICO, sobre tus ingresos)';
    case 'resicoMoral':
      return 'ISR referencial (RESICO persona moral, 30% sobre tu utilidad)';
    case 'tarifa96':
      return 'ISR referencial (tarifa del SAT, sobre tu utilidad)';
    case 'tasa':
      return `ISR referencial (${isrTasa / 100}%)`;
  }
};

export function IsrNotice({ isrTasa, isr, metodo }: IsrNoticeModel) {
  // Only RESICO de personas físicas owes on gross: every other base is profit.
  const sinUtilidad = metodo !== 'resico' && isr === 0n;
  const disclaimer = metodo === 'resicoMoral' ? `${FLUJO_MORAL} ${DISCLAIMER}` : DISCLAIMER;
  const linea = sinUtilidad
    ? `En este periodo no hubo utilidad, así que no hay ISR estimado. ${disclaimer}`
    : disclaimer;
  return (
    <div className={isrNotice}>
      <div>
        <strong>{titulo(metodo, isrTasa)}</strong>
        <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{linea}</p>
      </div>
    </div>
  );
}
