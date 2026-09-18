'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Money } from '@xangarro/domain';

import type { LineaTicket } from './types';

export interface VentaHecha {
  readonly lines: readonly LineaTicket[];
  readonly total: Money;
  readonly metodo: string;
  /** Shown in 40 px when the sale was cash. */
  readonly cambio: Money | null;
  readonly nota: string;
}

const DURATION_MS = 8000;
const TICK_MS = 120;

/**
 * The corner card after a sale: change, Deshacer, Comprobante, and a bar that
 * empties over ~8 s (README «Después de cobrar»).
 */
export function useSaleToast() {
  const [venta, setVenta] = useState<VentaHecha | null>(null);
  const [progress, setProgress] = useState(100);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const show = useCallback(
    (v: VentaHecha) => {
      stop();
      setVenta(v);
      setProgress(100);
      const started = Date.now();
      timer.current = setInterval(() => {
        const left = Math.max(0, 100 - ((Date.now() - started) / DURATION_MS) * 100);
        if (left > 0) return setProgress(left);
        stop();
        setVenta(null);
      }, TICK_MS);
    },
    [stop],
  );

  const dismiss = useCallback(() => {
    stop();
    setVenta(null);
  }, [stop]);

  useEffect(() => stop, [stop]);
  return { venta, progress, show, dismiss };
}
