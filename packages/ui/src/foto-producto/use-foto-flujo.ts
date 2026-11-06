/**
 * The photo's steps on one product (M-13, boards MvFoto*): a tap on a square
 * with no photo opens the camera, one with a photo opens «Cambiar o quitar»;
 * a long press goes to the gallery. A shot or a pick is lifted and encoded
 * («Listo», or «Guardar así» when the background stayed), and saving writes
 * the row. «Quitar foto» asks first, then writes the tombstone.
 */
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProductIcon } from '@xangarro/caja';
import type { BusinessId } from '@xangarro/domain';
import { useRepositoriesOrNull } from '../app/repository-provider';
import { useCurrentBusinessId } from '../app-config/use-app-config';
import { fotosKey, useFotoProducto, useFotoPuertos, type FotoVista } from './fotos-context';
import {
  guardarFoto,
  mensajeDe,
  precioDe,
  procesarFoto,
  quitarFoto,
  type FotoLista,
} from './foto-acciones';

export interface FotoSujeto {
  readonly id: string;
  readonly nombre: string;
  readonly icono: ProductIcon;
  readonly tint: string;
}

export type FotoPaso =
  | { readonly paso: 'camara' }
  | { readonly paso: 'procesando' }
  | { readonly paso: 'listo'; readonly foto: FotoLista }
  | { readonly paso: 'error'; readonly mensaje: string }
  | { readonly paso: 'cambiar' }
  | { readonly paso: 'quitar' };

interface Estado {
  readonly s: FotoSujeto;
  readonly paso: FotoPaso;
  readonly precio: bigint | null;
}

export interface FotoAbierta extends Estado {
  /** The photo the product shows now, for «Cambiar o quitar». */
  readonly actual: FotoVista | null;
}

export interface FotoFlujo {
  readonly abierta: FotoAbierta | null;
  readonly guardando: boolean;
  /** The square's tap: the camera, or «Cambiar o quitar» when it has a photo. */
  readonly abrir: (s: FotoSujeto, conFoto: boolean) => void;
  /** The square's long press, or «Elegir de la galería». */
  readonly galeria: (s?: FotoSujeto) => void;
  /** «Tomar otra foto» / «Otra foto». */
  readonly camara: () => void;
  /** The shutter's file. */
  readonly tomada: (uri: string) => void;
  readonly guardar: () => void;
  readonly pedirQuitar: () => void;
  readonly quitar: () => void;
  /** «Mejor no»: back to «Cambiar o quitar». */
  readonly volver: () => void;
  readonly cerrar: () => void;
}

type Poner = (f: (e: Estado | null) => Estado | null) => void;

const conPaso = (paso: FotoPaso) => (e: Estado | null) => (e === null ? null : { ...e, paso });

/** The step, only if the sheet is still on that product (a late lift never lands on another). */
const enProducto = (id: string, paso: FotoPaso) => (e: Estado | null) =>
  e?.s.id === id ? { ...e, paso } : e;

/** The file goes through the lift and the encoder; the sheet follows along. */
function useProcesar(set: Poner) {
  const puertos = useFotoPuertos();
  return useCallback(
    (uri: string, id: string) => {
      if (puertos === null) return;
      set(enProducto(id, { paso: 'procesando' }));
      procesarFoto(puertos, uri).then(
        (foto) => set(enProducto(id, { paso: 'listo', foto })),
        (e: unknown) => set(enProducto(id, { paso: 'error', mensaje: mensajeDe(e) })),
      );
    },
    [puertos, set],
  );
}

/** Opening on a product: its price arrives for the preview tile. */
function useAbrir(set: Poner) {
  const repos = useRepositoriesOrNull();
  return useCallback(
    (s: FotoSujeto, paso: FotoPaso) => {
      set(() => ({ s, paso, precio: null }));
      if (repos === null) return;
      void precioDe(repos, s.id).then((precio) =>
        set((e) => (e?.s.id === s.id ? { ...e, precio } : e)),
      );
    },
    [repos, set],
  );
}

/** The gallery: a pick goes to the lift; backing out keeps what was open. */
function useGaleria(
  estado: Estado | null,
  set: Poner,
  procesar: (uri: string, id: string) => void,
) {
  const puertos = useFotoPuertos();
  const abrir = useAbrir(set);
  return useCallback(
    (s?: FotoSujeto) => {
      const sujeto = s ?? estado?.s;
      if (puertos === null || sujeto === undefined) return;
      void puertos.elegirDeGaleria().then((uri) => {
        if (uri === null) return;
        if (estado?.s.id !== sujeto.id) abrir(sujeto, { paso: 'procesando' });
        procesar(uri, sujeto.id);
      });
    },
    [abrir, estado, procesar, puertos],
  );
}

/** Saving and removing: the use case, then every tile refreshes. */
function useEscrituras(estado: Estado | null, set: Poner) {
  const repos = useRepositoriesOrNull();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const [guardando, setGuardando] = useState(false);
  const correr = useCallback(
    (escribir: (r: NonNullable<typeof repos>, id: string) => Promise<void>) => {
      if (estado === null || repos === null) return;
      setGuardando(true);
      escribir(repos, estado.s.id)
        .then(() => queryClient.invalidateQueries({ queryKey: fotosKey(businessId) }))
        .then(
          () => set(() => null),
          (e: unknown) => set(conPaso({ paso: 'error', mensaje: mensajeDe(e) })),
        )
        .finally(() => setGuardando(false));
    },
    [businessId, estado, queryClient, repos, set],
  );
  const foto = estado?.paso.paso === 'listo' ? estado.paso.foto : null;
  return {
    guardando,
    guardar: () => (foto ? correr((r, id) => guardarFoto(r, id, foto)) : undefined),
    quitar: () => correr((r, id) => quitarFoto(r, id)),
  };
}

export function useFotoFlujo(): FotoFlujo {
  const [estado, setEstado] = useState<Estado | null>(null);
  const set = setEstado as Poner;
  const actual = useFotoProducto(estado?.s.id);
  const abrirEn = useAbrir(set);
  const procesar = useProcesar(set);
  const galeria = useGaleria(estado, set, procesar);
  const { guardando, guardar, quitar } = useEscrituras(estado, set);
  const abierta = useMemo(() => (estado ? { ...estado, actual } : null), [estado, actual]);
  return {
    abierta,
    guardando,
    abrir: (s, conFoto) => abrirEn(s, { paso: conFoto ? 'cambiar' : 'camara' }),
    galeria,
    camara: () => set(conPaso({ paso: 'camara' })),
    tomada: (uri) => (estado ? procesar(uri, estado.s.id) : undefined),
    guardar,
    pedirQuitar: () => set(conPaso({ paso: 'quitar' })),
    quitar,
    volver: () => set(conPaso({ paso: 'cambiar' })),
    cerrar: () => set(() => null),
  };
}
