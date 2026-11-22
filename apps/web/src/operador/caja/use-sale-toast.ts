'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Money } from '@xangarro/domain';

import type { LineaTicket } from '@xangarro/caja/caja';

export interface VentaHecha {
  readonly lines: readonly LineaTicket[];
  readonly total: Money;
  readonly metodo: string;
  /** Shown in 40 px when the sale was cash. */
  readonly cambio: Money | null;
  readonly nota: string;
  /** The fiado client's id, when the sale is on credit (O-33). */
  readonly clienteId?: string;
  /** The folio the register gave it (`V-0001`), once the sale is in its database. */
  readonly folio?: string;
  /** Its ticket in the register's database, which «Deshacer» cancels. */
  readonly ticketId?: string;
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

  /**
   * The sale as registered: its folio for the receipt, its ticket for
   * «Deshacer». Only the sale still on the card takes it.
   */
  const conRegistro = useCallback(
    (de: VentaHecha, r: { readonly folio: string; readonly ticketId: string }) => {
      setVenta((v) => (v === de ? { ...v, ...r } : v));
    },
    [],
  );

  useEffect(() => stop, [stop]);
  return { venta, progress, show, dismiss, conRegistro };
}
