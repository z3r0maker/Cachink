'use client';

import { formatMoney, type Money } from '@xangarro/domain';

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
  /** ADR-089: 626 estimates on gross, 612 on the Art. 96 tariff, else the owner's rate. */
  readonly regimenSat: string | null;
}

const DISCLAIMER =
  'Es una referencia calculada con las tablas publicadas del SAT. Para tus cifras y deducciones reales, consulta a tu contador.';

export function IsrNotice({ isrTasa, isr, regimenSat }: IsrNoticeModel) {
  const titulo =
    regimenSat === '626'
      ? 'ISR referencial (RESICO, sobre tus ingresos)'
      : regimenSat === '612'
        ? 'ISR referencial (tarifa del SAT, sobre tu utilidad)'
        : `ISR referencial (${isrTasa / 100}%)`;
  const linea =
    regimenSat === '626'
      ? DISCLAIMER
      : isr > 0n
        ? DISCLAIMER
        : `En este periodo no hubo utilidad, así que no hay ISR estimado. ${DISCLAIMER}`;
  return (
    <div className={isrNotice}>
      <div>
        <strong>{titulo}</strong>
        <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{linea}</p>
      </div>
    </div>
  );
}
