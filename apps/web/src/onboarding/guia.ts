/**
 * P-36 D-2: until «Para vender» is done, every portal entry lands on
 * /como-empiezo. The owner can opt out for this browser; that is the cookie.
 */
export const GUIA_OMITIDA_COOKIE = 'xg-guia-omitida';

export function debeIrALaGuia(input: {
  readonly role: string;
  readonly complete: boolean;
  readonly omitida: boolean;
}): boolean {
  return input.role === 'owner' && !input.complete && !input.omitida;
}
