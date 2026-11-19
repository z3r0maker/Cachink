/**
 * «Agregar foto» on a saved gasto (M-18, board CgDespues): the receipt that
 * arrived after the cash left. The camera (or the gallery) hands a file, the
 * app's port encodes it, `AgregarComprobanteGastoUseCase` writes the row the
 * outbox carries, and the list rereads: the row says «Con foto» and the
 * toast «Foto guardada. Se manda al dueño.» A receipt is never replaced, so
 * the button only shows on a gasto without one.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AgregarComprobanteGastoUseCase } from '@xangarro/application';
import type { BusinessId, ExpenseId } from '@xangarro/domain';
import { useExpenseReceiptsRepository, useExpensesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/use-app-config';
import { cajaKeys } from '../hooks/query-keys';
import { useFotoPuertos } from '../foto-producto/fotos-context';

export interface AvisoFoto {
  readonly ok: boolean;
  readonly titulo: string;
  readonly cuerpo: string;
}

export interface AgregarFoto {
  /** False where the app has no camera (web, tests): the button is omitted. */
  readonly disponible: boolean;
  /** The gasto whose camera is open, with the title it shows. */
  readonly abierta: { readonly id: string; readonly titulo: string } | null;
  readonly guardando: boolean;
  readonly aviso: AvisoFoto | null;
  readonly abrir: (id: string, titulo: string) => void;
  readonly tomada: (archivo: string) => void;
  readonly galeria: () => void;
  readonly cerrar: () => void;
  readonly cerrarAviso: () => void;
}

const GUARDADA: AvisoFoto = { ok: true, titulo: 'Foto guardada', cuerpo: 'Se manda al dueño.' };

const fallo = (e: unknown): AvisoFoto => ({
  ok: false,
  titulo: 'No se pudo guardar la foto',
  cuerpo: e instanceof Error && e.message ? e.message : 'Toma otra.',
});

/** File → gray WebP → the receipt row → the list rereads. */
function useGuardarComprobante(): (gastoId: string, archivo: string) => Promise<void> {
  const puertos = useFotoPuertos();
  const expenses = useExpensesRepository();
  const receipts = useExpenseReceiptsRepository();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const queryClient = useQueryClient();
  return async (gastoId, archivo) => {
    if (puertos === null || businessId === null) return;
    const foto = await puertos.codificarComprobante(archivo);
    await new AgregarComprobanteGastoUseCase(expenses, receipts).execute({
      gastoId: gastoId as ExpenseId,
      businessId,
      bytes: foto.base64,
      width: foto.width,
      height: foto.height,
    });
    await queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) });
  };
}

export function useAgregarFoto(): AgregarFoto {
  const puertos = useFotoPuertos();
  const guardar = useGuardarComprobante();
  const [abierta, setAbierta] = useState<AgregarFoto['abierta']>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<AvisoFoto | null>(null);

  /** A file for `gasto`: the camera closes, the receipt saves (null: backed out). */
  const procesar = (gasto: AgregarFoto['abierta'], archivo: string | null): void => {
    if (gasto === null || archivo === null) return;
    setAbierta(null);
    setGuardando(true);
    void guardar(gasto.id, archivo)
      .then(
        () => setAviso(GUARDADA),
        (e: unknown) => setAviso(fallo(e)),
      )
      .finally(() => setGuardando(false));
  };

  return {
    disponible: puertos !== null,
    abierta,
    guardando,
    aviso,
    abrir: (id, titulo) => {
      setAviso(null);
      setAbierta({ id, titulo });
    },
    tomada: (archivo) => procesar(abierta, archivo),
    // The picker opens over the camera, which closes after the pick: iOS will
    // not present it while the camera's sheet is going away.
    galeria: () => void puertos?.elegirDeGaleria().then((a) => procesar(abierta, a)),
    cerrar: () => setAbierta(null),
    cerrarAviso: () => setAviso(null),
  };
}
