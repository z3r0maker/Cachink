'use client';

import { useState, useTransition } from 'react';

import { subirLogo } from '@/server/actions/comprobantes';

import type { Aviso, ComprobantesView } from './use-comprobantes';

/**
 * The logo upload (N-19): saved at once, its extracted colour proposed in the
 * picker, and the preview's <img> re-fetched under the same URL.
 */
export function useSubirLogo(
  view: ComprobantesView,
  cb: {
    readonly color: (v: string) => void;
    readonly setAviso: (a: Aviso) => void;
    readonly bump: () => void;
  },
) {
  const [logoUrl, setLogoUrl] = useState<string | null>(view.logoUrl);
  const [subiendo, startSubida] = useTransition();
  const subir = (file: File | null) => {
    if (file === null) return;
    const data = new FormData();
    data.append('logo', file);
    startSubida(async () => {
      const r = await subirLogo(data);
      if (!r.ok) return cb.setAviso({ tono: 'mal', texto: r.message });
      if (r.brandColor !== null) cb.color(r.brandColor);
      cb.setAviso({ tono: 'ok', texto: 'Logo guardado.' });
      cb.bump();
      // The bytes changed under the same URL; the version keeps the <img>
      // honest until the ETag takes over.
      setLogoUrl(`/api/logos/${view.businessId}?v=${Date.now()}`);
    });
  };
  return { logoUrl, subiendo, subir };
}
