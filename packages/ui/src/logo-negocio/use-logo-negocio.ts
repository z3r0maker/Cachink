/**
 * The business logo for the comprobante (N-19), from the phone's own copy so
 * it shows offline. Keyed on the business row: a pull that changes the row
 * (a new logo, a removed one, any branding edit) re-checks the copy once;
 * otherwise the copy is read and nothing touches the network.
 *
 * A failed refresh keeps showing the copy held and is re-tried on the next
 * mount, so a phone that was offline at the change catches up when it is not.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RefrescarLogoNegocioUseCase, type LogoGuardado } from '@xangarro/application';
import type { Business } from '@xangarro/domain';
import { cargarLogoAlmacen } from './logo-almacen';

/**
 * Raster kinds only: the receipt preview is react-native-svg, whose `<image>`
 * draws PNG and JPG but not an SVG, so an SVG logo keeps the monogram there.
 */
const DIBUJABLES: ReadonlySet<string> = new Set(['image/png', 'image/jpeg']);

/** The copy as the comprobante's `logoDataUrl`; null for the no-logo look. */
export function logoParaComprobante(logo: LogoGuardado | null): string | null {
  if (logo === null || !DIBUJABLES.has(logo.mime)) return null;
  return `data:${logo.mime};base64,${logo.base64}`;
}

interface Lectura {
  readonly uri: string | null;
  readonly fallo: boolean;
}

export function useLogoNegocio(business: Business | null): string | null {
  const q = useQuery<Lectura>({
    queryKey: [
      'logo-negocio',
      business?.id ?? null,
      business?.logoUrl ?? null,
      business?.updatedAt,
    ],
    enabled: business !== null,
    placeholderData: keepPreviousData,
    staleTime: (query) => (query.state.data?.fallo === true ? 0 : Infinity),
    queryFn: async () => {
      const almacen = await cargarLogoAlmacen();
      if (almacen === null || business === null) return { uri: null, fallo: false };
      const r = await new RefrescarLogoNegocioUseCase(almacen, almacen).execute({
        logoUrl: business.logoUrl,
        revision: business.updatedAt,
      });
      return { uri: logoParaComprobante(r.logo), fallo: r.estado === 'fallo' };
    },
  });
  return q.data?.uri ?? null;
}
