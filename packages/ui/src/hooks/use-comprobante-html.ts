/**
 * `useComprobanteHtml` — memoized wrapper around the pure domain
 * `buildComprobanteHtml` renderer. Keeps the per-Venta HTML string
 * stable across re-renders so share handlers don't regenerate it.
 */

import { useMemo } from 'react';
import type { Business, Sale } from '@cachink/domain';
import { buildComprobanteHtml } from '@cachink/domain';
import { useTranslation } from '../i18n/index';

export function useComprobanteHtml(sale: Sale | null, business: Business | null): string | null {
  const { t } = useTranslation();
  return useMemo(() => {
    if (!sale || !business) return null;
    return buildComprobanteHtml({
      sale,
      business,
      thankYou: t('comprobante.gracias'),
      labels: {
        comprobante: t('comprobante.title'),
        fecha: t('comprobante.fecha'),
        metodo: t('comprobante.metodo'),
        credito: t('comprobante.title'),
      },
    });
  }, [sale, business, t]);
}
