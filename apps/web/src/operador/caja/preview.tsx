'use client';

import { formatMoney } from '@xangarro/domain';
import { portalFontSizes, typography } from '@xangarro/tokens';

import * as l from '../turno/lists.css';
import * as u from '../ui/ui.css';
import type { Comprobante } from './receipt';
import * as s from './share.css';
import { importe } from './ticket';

/** The receipt as the customer will see it. */
export function Preview({ c }: { readonly c: Comprobante }) {
  return (
    <div className={s.preview}>
      <PreviewHead c={c} />
      <div className={s.rule} />
      <PreviewLines c={c} />
      <div className={s.rule} />
      <div className={s.row}>
        <span className={u.eyebrow}>{c.venta.metodo}</span>
        <span
          className={s.lineAmount}
          style={{ marginLeft: 'auto', fontSize: portalFontSizes.xl3, letterSpacing: '-0.02em' }}
        >
          {formatMoney(c.venta.total)}
        </span>
      </div>
    </div>
  );
}

function PreviewLines({ c }: { readonly c: Comprobante }) {
  return (
    <>
      {c.venta.lines.map((x) => (
        <div key={x.productoId} className={s.row}>
          <span className={s.small} style={{ flex: 'none' }}>
            {x.cantidad}×
          </span>
          <span className={s.lineText} style={{ flex: 1, minWidth: 0 }}>
            {x.nombre}
          </span>
          <span className={s.lineAmount}>{formatMoney(importe(x))}</span>
        </div>
      ))}
    </>
  );
}

function PreviewHead({ c }: { readonly c: Comprobante }) {
  return (
    <div className={s.row} style={{ alignItems: 'center', gap: 9 }}>
      <span className={s.coin}>
        <svg
          viewBox="0 0 24 24"
          width="60%"
          height="60%"
          fill="none"
          stroke="currentColor"
          strokeWidth={4.6}
          aria-hidden="true"
        >
          <path d="M5 5l14 14M19 5 5 19" />
        </svg>
      </span>
      <span className={l.name} style={{ fontSize: portalFontSizes.md, letterSpacing: '-0.01em' }}>
        {c.negocio}
      </span>
      <span className={s.small} style={{ marginLeft: 'auto', fontWeight: typography.weights.bold }}>
        {c.folio}
      </span>
    </div>
  );
}
