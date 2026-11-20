/**
 * Opening WhatsApp from the phone. The regression this guards: TestFlight
 * 1.0.0 (2) said «No se pudo abrir WhatsApp» on every iPhone, because
 * `canOpenURL('whatsapp://…')` REJECTS on iOS when the scheme is not declared
 * in LSApplicationQueriesSchemes. The opener must never depend on it.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { Linking } from 'react-native';
import { abrirChatWhatsApp, enlacesDeChat } from '../../src/app/abrir-whatsapp';
import { porWhatsApp } from '../../src/screens/Checkout/comprobante-acciones';
import { recordarPorWhatsApp } from '../../src/screens/Cobranza/recordar-acciones';

const APP_SIN_NUMERO = 'whatsapp://send?text=Hola%20t%C3%BA';
const WEB_SIN_NUMERO = 'https://wa.me/?text=Hola%20t%C3%BA';
const APP_AL_NUMERO = 'whatsapp://send?phone=525512447903&text=Hola';
const WEB_AL_NUMERO = 'https://wa.me/525512447903?text=Hola';

let abre: MockInstance<typeof Linking.openURL>;
let puede: MockInstance<typeof Linking.canOpenURL>;

/** The phone as iOS leaves it: only the URLs listed open. */
function abrenSolo(...urls: readonly string[]): void {
  abre.mockImplementation((url: string) =>
    urls.includes(url) ? Promise.resolve() : Promise.reject(new Error(`Unable to open ${url}`)),
  );
}

beforeEach(() => {
  abre = vi.spyOn(Linking, 'openURL');
  puede = vi
    .spyOn(Linking, 'canOpenURL')
    .mockRejectedValue(new Error('Add whatsapp to LSApplicationQueriesSchemes'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('enlacesDeChat', () => {
  it('encodes the text, with no number so WhatsApp asks for the contact', () => {
    expect(enlacesDeChat({ texto: 'Hola tú' })).toEqual({
      app: APP_SIN_NUMERO,
      web: WEB_SIN_NUMERO,
    });
  });

  it('points both links at the number when there is one', () => {
    expect(enlacesDeChat({ texto: 'Hola', numero: '525512447903' })).toEqual({
      app: APP_AL_NUMERO,
      web: WEB_AL_NUMERO,
    });
  });
});

describe('abrirChatWhatsApp', () => {
  it('opens the app directly and never asks canOpenURL', async () => {
    abrenSolo(APP_SIN_NUMERO);
    await expect(abrirChatWhatsApp({ texto: 'Hola tú' })).resolves.toBe('app');
    expect(abre).toHaveBeenCalledTimes(1);
    expect(puede).not.toHaveBeenCalled();
  });

  it('falls back to wa.me when the app scheme does not open', async () => {
    abrenSolo(WEB_SIN_NUMERO);
    await expect(abrirChatWhatsApp({ texto: 'Hola tú' })).resolves.toBe('enlace');
    expect(abre.mock.calls.map(([url]) => url)).toEqual([APP_SIN_NUMERO, WEB_SIN_NUMERO]);
  });

  it('keeps the number on the wa.me fallback', async () => {
    abrenSolo(WEB_AL_NUMERO);
    await expect(abrirChatWhatsApp({ texto: 'Hola', numero: '525512447903' })).resolves.toBe(
      'enlace',
    );
  });

  it('reports the failure when neither link opens', async () => {
    abrenSolo();
    await expect(abrirChatWhatsApp({ texto: 'Hola tú' })).resolves.toBe('fallo');
    expect(abre).toHaveBeenCalledTimes(2);
  });
});

describe('the comprobante line', () => {
  it('confirms when WhatsApp opened', async () => {
    abrenSolo('whatsapp://send?text=Hola');
    await expect(porWhatsApp('Hola')).resolves.toBe(
      'Se abrió WhatsApp. Escoge el contacto y dale enviar.',
    );
  });

  it('does not claim WhatsApp opened when only the link did', async () => {
    abrenSolo('https://wa.me/?text=Hola');
    await expect(porWhatsApp('Hola')).resolves.toBe(
      'Abrimos el enlace de WhatsApp. Si no tienes la app, usa Mensajes o Copiar o compartir.',
    );
  });

  it('points to the other options when nothing opened', async () => {
    abrenSolo();
    await expect(porWhatsApp('Hola')).resolves.toBe(
      'No se pudo abrir WhatsApp en este teléfono. Usa Mensajes o Copiar o compartir.',
    );
  });
});

describe('the reminder from a client account', () => {
  it('opens the chat on the client number', async () => {
    abrenSolo(APP_AL_NUMERO);
    await expect(recordarPorWhatsApp('55 1244 7903', 'Hola')).resolves.toBe(
      'Se abrió WhatsApp con el mensaje listo. Dale enviar.',
    );
  });

  it('falls back to wa.me on the same number', async () => {
    abrenSolo(WEB_AL_NUMERO);
    await expect(recordarPorWhatsApp('55 1244 7903', 'Hola')).resolves.toBe(
      'Abrimos el enlace de WhatsApp. Si no tienes la app, usa Mensajes o Compartir.',
    );
  });

  it('points to the other options when nothing opened', async () => {
    abrenSolo();
    await expect(recordarPorWhatsApp('55 1244 7903', 'Hola')).resolves.toBe(
      'No se pudo abrir WhatsApp en este teléfono. Usa Mensajes o Compartir.',
    );
  });
});
