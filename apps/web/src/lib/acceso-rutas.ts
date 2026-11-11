/**
 * Where a sign-in goes next (N-83). The server actions answer with `next`
 * (`server/acceso/aplicar.ts`); the screens turn it into a route here, so the
 * four doors (password, sign-in link, reset, confirmation) agree.
 */
export type Siguiente =
  | { readonly next: 'portal' | 'segundo-paso' | 'confirmar' }
  | { readonly next: 'nueva-contrasena'; readonly reset: string };

export const RUTA_VERIFICAR = '/login/verificar';
export const RUTA_REVISA = '/signup/revisa';
export const RUTA_CONFIRMAR = '/signup/confirmar';
export const RUTA_SEGURIDAD = '/seguridad';

/** `confirmado=1` makes «Crea una contraseña nueva» say why the old password is gone. */
export function rutaSiguiente(s: Siguiente, portal = '/'): string {
  switch (s.next) {
    case 'portal':
      return portal;
    case 'segundo-paso':
      return RUTA_VERIFICAR;
    case 'confirmar':
      return `${RUTA_REVISA}?desde=entrar`;
    case 'nueva-contrasena':
      return `/login/restablecer?t=${s.reset}&confirmado=1`;
  }
}
