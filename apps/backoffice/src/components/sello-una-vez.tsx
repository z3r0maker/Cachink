'use client';

import { useEffect } from 'react';

import { PARAM_SELLO } from '@/server/empresa/sello';

/**
 * «Sello» lands once (ADR-161 §3): right after the action whose redirect
 * carried `?sello=`. This drops the flag from the address bar as soon as the
 * page arrives, without a request, so a reload, a bookmark or a later visit
 * shows the chip still. It moves nothing: the stamp itself is CSS.
 */
export function SelloUnaVez() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PARAM_SELLO)) return;
    url.searchParams.delete(PARAM_SELLO);
    window.history.replaceState(null, '', url);
  }, []);
  return null;
}
