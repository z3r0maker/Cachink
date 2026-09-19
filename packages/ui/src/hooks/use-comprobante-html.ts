/**
 * `useComprobanteHtml` — memoized wrapper around the pure domain
 * `buildComprobanteHtml` renderer. Keeps the per-ticket HTML string
 * stable across re-renders so share handlers don't regenerate it.
 */

import { useMemo } from 'react';
import type { Business, Money, Ticket } from '@xangarro/domain';
import { buildComprobanteHtml } from '@xangarro/domain';
import { useTranslation } from '../i18n/index';

export function useComprobanteHtml(
  ticket: Ticket | null,
  total: Money,
  business: Business | null,
): string | null {
  const { t } = useTranslation();
  return useMemo(() => {
    if (!ticket || !business) return null;
    return buildComprobanteHtml({
      ticket,
      total,
      business,
      thankYou: t('comprobante.gracias'),
      labels: {
        comprobante: t('comprobante.title'),
        fecha: t('comprobante.fecha'),
        metodo: t('comprobante.metodo'),
        credito: t('comprobante.title'),
      },
    });
  }, [ticket, total, business, t]);
}
