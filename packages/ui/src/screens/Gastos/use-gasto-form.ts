/**
 * The registrar form's state (M-08): what was bought, how much and the
 * category are required — the web drawer's rules — and who was paid is
 * optional. A prefill from a due recurring gasto fills every field; the
 * amount field holds pesos and parses to centavos.
 */
import { useState } from 'react';
import { parseRecibido } from '@xangarro/caja/caja';
import {
  montoCrudo,
  type CategoriaGasto,
  type NuevoGasto,
  type PrefillGasto,
} from '@xangarro/caja/gastos';

/** Digits and one decimal point only; the form parses to centavos. */
const limpio = (raw: string): string => raw.replace(/[^0-9.]/g, '');

export function useGastoForm(pre: PrefillGasto | null) {
  const [raw, setRawRaw] = useState(pre === null ? '' : montoCrudo(pre.monto));
  const [concepto, setConcepto] = useState(pre?.concepto ?? '');
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(pre?.categoria ?? null);
  const [quien, setQuien] = useState(pre?.proveedor ?? '');
  const monto = parseRecibido(raw);
  const listo = monto !== null && monto > 0n && concepto.trim() !== '' && categoria !== null;
  const payload = (): NuevoGasto | null => {
    if (monto === null || categoria === null || !listo) return null;
    return {
      monto,
      concepto: concepto.trim(),
      categoria,
      proveedor: quien.trim() === '' ? null : quien.trim(),
      foto: null,
      ...(pre === null ? {} : { recurrenteId: pre.recurrenteId }),
    };
  };
  return {
    raw,
    setRaw: (v: string) => setRawRaw(limpio(v)),
    concepto,
    setConcepto,
    categoria,
    setCategoria,
    quien,
    setQuien,
    monto,
    listo,
    payload,
  };
}

export type GastoForm = ReturnType<typeof useGastoForm>;

export interface GuardarHoja {
  readonly guardando: boolean;
  readonly error: boolean;
  readonly guardar: (n: NuevoGasto | null) => Promise<void>;
}

/** Save through the route's write: close on success, say so on failure. */
export function useGuardarHoja(
  onGuardar: (n: NuevoGasto) => Promise<void>,
  onListo: () => void,
): GuardarHoja {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const guardar = async (n: NuevoGasto | null): Promise<void> => {
    if (n === null || guardando) return;
    setGuardando(true);
    setError(false);
    try {
      await onGuardar(n);
      onListo();
    } catch {
      setError(true);
    } finally {
      setGuardando(false);
    }
  };
  return { guardando, error, guardar };
}
