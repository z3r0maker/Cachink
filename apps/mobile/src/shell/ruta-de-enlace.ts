/**
 * Where the router lands when a link opens the app (N-25). A pairing link
 * (`xangarro://activar#c=<token>`) names no screen: the activation gate reads
 * its token itself (`useEnlaceVinculacion`, through `Linking`), so the router
 * goes home instead of «Unmatched route», which is what a phone linked a
 * moment later would otherwise show. Any other path is left as it came. Pure.
 */

const VINCULAR = /(?:^|\/)activar(?:[/?#]|$)/;

export function rutaDeEnlace(path: string): string {
  return VINCULAR.test(path) ? '/' : path;
}
