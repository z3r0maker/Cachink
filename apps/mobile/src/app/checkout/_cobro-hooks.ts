/**
 * The cobro's registration for /checkout and /checkout/fiado (Track M,
 * M-07): the ticket in progress goes through `useCobrarTicket` as one
 * ticket; on success the ticket empties, «Venta hecha» is set for the
 * Cobrar tab, the sale sound plays and the stack pops back to Cobrar.
 * Underscore prefix: Expo Router ignores this file.
 */
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { CajaNoAbiertaError, PlanLimitError } from '@xangarro/domain';
import {
  useCobrarTicket,
  useSaleSound,
  useTicketEnCurso,
  useVentaHecha,
  type CobrarTicketInput,
} from '@xangarro/ui';
import { useSaleSoundPlayer } from '../../shell/use-sale-sound-player';

/** The operator's words for what went wrong; null when a sheet already explains it. */
export function mensajeDeError(err: unknown): string | null {
  // The plan-limit sheet already explains a PlanLimitError (A-10).
  if (err instanceof PlanLimitError) return null;
  if (err instanceof CajaNoAbiertaError) return 'Abre tu turno para poder cobrar.';
  return 'No se pudo guardar la venta. Vuelve a intentarlo.';
}

export function useRegistrarCobro() {
  const router = useRouter();
  const lines = useTicketEnCurso((s) => s.lines);
  const vaciar = useTicketEnCurso((s) => s.vaciar);
  const mostrar = useVentaHecha((s) => s.mostrar);
  const cobrar = useCobrarTicket();
  const { play } = useSaleSound(useSaleSoundPlayer());
  const [error, setError] = useState<string | null>(null);
  // A button smash lands on the same ticket: one ticket, one sale.
  const enCurso = useRef(false);
  const registrar = async (input: Omit<CobrarTicketInput, 'lines'>): Promise<void> => {
    if (enCurso.current || lines.length === 0) return;
    enCurso.current = true;
    setError(null);
    try {
      const venta = await cobrar.mutateAsync({ ...input, lines });
      vaciar();
      mostrar(venta);
      play();
      router.dismissAll();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      enCurso.current = false;
    }
  };
  return { lines, registrar, registrando: cobrar.isPending, error, setError };
}
