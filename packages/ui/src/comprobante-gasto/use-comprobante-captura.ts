/**
 * The receipt photo's draft (M-18, board CgHoja): the camera or the gallery
 * hands a file, the app's port turns it into the row's gray WebP, and the
 * field shows it until the gasto is saved. «Cambiar» opens the camera again;
 * «Quitar» drops the draft. Nothing is written here: the gasto's save (or
 * «Agregar foto») takes {@link ComprobanteCaptura.foto} with it.
 *
 * Without the app's ports (web, tests) there is no camera, and
 * {@link ComprobanteCaptura.disponible} is false: the field is omitted.
 */
import { useState } from 'react';
import { EXPENSE_RECEIPT_MIME } from '@xangarro/domain';
import { useFotoPuertos } from '../foto-producto/fotos-context';
import type { EncodedReceipt } from './encode';

export interface ComprobanteCaptura {
  readonly disponible: boolean;
  readonly camara: boolean;
  readonly procesando: boolean;
  readonly error: string | null;
  readonly foto: EncodedReceipt | null;
  /** The draft as a `data:` URI for the thumbnail. */
  readonly uri: string | null;
  readonly abrir: () => void;
  readonly galeria: () => void;
  readonly tomada: (archivo: string) => void;
  readonly cerrar: () => void;
  readonly quitar: () => void;
}

/** A thrown error as the field says it. */
function mensajeDe(e: unknown): string {
  return e instanceof Error && e.message ? e.message : 'No pude guardar la foto. Toma otra.';
}

export function useComprobanteCaptura(): ComprobanteCaptura {
  const puertos = useFotoPuertos();
  const [camara, setCamara] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foto, setFoto] = useState<EncodedReceipt | null>(null);

  const procesar = (archivo: string): void => {
    if (puertos === null) return;
    setProcesando(true);
    setError(null);
    void puertos
      .codificarComprobante(archivo)
      .then(setFoto, (e: unknown) => setError(mensajeDe(e)))
      .finally(() => setProcesando(false));
  };

  /** A file from the camera or the gallery: the camera closes, the draft encodes. */
  const recibir = (archivo: string): void => {
    setCamara(false);
    procesar(archivo);
  };

  return {
    disponible: puertos !== null,
    camara,
    procesando,
    error,
    foto,
    uri: foto === null ? null : `data:${EXPENSE_RECEIPT_MIME};base64,${foto.base64}`,
    abrir: () => setCamara(true),
    // Over the camera when it is open (it closes after the pick: iOS will not
    // present the picker while the camera's sheet is going away).
    // Backing out of the picker leaves whatever was open.
    galeria: () => void puertos?.elegirDeGaleria().then((a) => (a === null ? null : recibir(a))),
    tomada: recibir,
    cerrar: () => setCamara(false),
    quitar: () => {
      setFoto(null);
      setError(null);
    },
  };
}
