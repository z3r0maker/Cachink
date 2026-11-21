import { describe, expect, it } from 'vitest';
import { rutaDeEnlace } from '../../src/shell/ruta-de-enlace';
import { redirectSystemPath } from '../../src/app/+native-intent';

/** A pairing link lands the router at home; the gate reads the token (N-25). */
describe('rutaDeEnlace', () => {
  it('sends a pairing link home, by the app scheme or the https page', () => {
    expect(rutaDeEnlace('xangarro://activar#c=mockqrVALDK7M3xangarro')).toBe('/');
    expect(rutaDeEnlace('https://app.xangarro.mx/activar#c=mockqrVALDK7M3xangarro')).toBe('/');
    expect(rutaDeEnlace('/activar')).toBe('/');
  });

  it('leaves every other path as it came', () => {
    expect(rutaDeEnlace('/avisos')).toBe('/avisos');
    expect(rutaDeEnlace('xangarro://cobranza/c1')).toBe('xangarro://cobranza/c1');
  });

  it('does not take a path that merely contains the word', () => {
    expect(rutaDeEnlace('/activarlo')).toBe('/activarlo');
    expect(rutaDeEnlace('/productos/desactivar')).toBe('/productos/desactivar');
  });

  it('is what Expo Router calls for a link the OS opens', () => {
    expect(redirectSystemPath({ path: 'xangarro://activar#c=x', initial: true })).toBe('/');
  });
});
