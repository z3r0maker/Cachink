'use client';

import { formatMoney, formatMoneyEntero, type FlujoDeEfectivo } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Card } from '@/components';
import { eyebrow } from '@/styles/text.css';

import { FlujoBarrasSvg } from './flujo-barras';
import { filasDeFlujo } from './chart-geo';
import { flujoNeto, flujoNetoCifra, flujoNetoFila } from './charts.css';

/**
 * The Flujo tab's chart card (C-13): the diverging bars, then the period's
 * net movement ruled off beneath them, as the design closes the card.
 */
export function FlujoCard({ flujo }: { readonly flujo: FlujoDeEfectivo }) {
  const hablado = filasDeFlujo(flujo)
    .map((f) => `${f.label} ${f.entrada ? '' : 'menos '}${formatMoneyEntero(f.monto)}`)
    .join(', ');
  return (
    <Card>
      <div className={eyebrow}>Entradas y salidas del periodo</div>
      <div role="img" aria-label={`Entradas y salidas del periodo: ${hablado}.`}>
        <FlujoBarrasSvg flujo={flujo} />
      </div>
      <div className={flujoNetoFila}>
        <span className={flujoNeto}>Incremento neto en efectivo</span>
        <span
          className={flujoNetoCifra}
          style={{ color: flujo.total < 0n ? colors.redText : colors.greenText }}
        >
          {formatMoney(flujo.total)}
        </span>
      </div>
    </Card>
  );
}
