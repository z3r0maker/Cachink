/**
 * The pure rules of «Entrar y empezar» (Track M, M-06): the NIP keypad, the
 * lock hand-over, the pairing QR, the fondo keypad and the entry screens'
 * words about the day and the caja.
 */
import { describe, expect, it } from 'vitest';
import type { UserId } from '@xangarro/domain';
import { siguienteBloqueo, useCajaLock } from '../../../src/app/caja-lock';
import { useAppConfigStore } from '../../../src/app-config/use-app-config';
import {
  faltaParaConectar,
  sanitizeCode,
  tokenDeQr,
} from '../../../src/screens/Activation/activation-form';
import {
  centavosDe,
  etiquetaRapido,
  fondoDe,
  fondoVisible,
  teclearFondo,
  type FondoEstado,
  type TeclaFondo,
} from '../../../src/screens/AbrirTurno/fondo';
import { textoUltimo } from '../../../src/screens/AbrirTurno/ultimo-cierre';
import { contextoCaja, diaLargo } from '../../../src/screens/Inicio/sesion';
import { nipCompleto, primerNombreDe, teclearNip } from '../../../src/screens/Login/nip';

const ANA = 'ANA' as UserId;
const LUIS = 'LUIS' as UserId;

describe('teclearNip', () => {
  it('appends digits up to four and ignores a fifth', () => {
    const nip = ['4', '7', '1', '9', '3'].reduce((n, d) => teclearNip(n, d as '4'), '');
    expect(nip).toBe('4719');
    expect(nipCompleto(nip)).toBe(true);
  });
  it('«Borrar» drops the last digit and is harmless on an empty NIP', () => {
    expect(teclearNip('47', 'borrar')).toBe('4');
    expect(teclearNip('', 'borrar')).toBe('');
  });
  it('is not complete below four digits', () => {
    expect(nipCompleto('471')).toBe(false);
  });
  it('says the first name only', () => {
    expect(primerNombreDe('  Ana  Robledo ')).toBe('Ana');
  });
});

describe('the caja lock', () => {
  it('signing out records who was signed in; signing in clears it', () => {
    expect(siguienteBloqueo(null, ANA, null)).toBe(ANA);
    expect(siguienteBloqueo(ANA, null, LUIS)).toBeNull();
  });
  it('keeps the lock when nothing changes hands', () => {
    expect(siguienteBloqueo(ANA, null, null)).toBe(ANA);
    expect(siguienteBloqueo(null, null, null)).toBeNull();
  });
  it('follows the session store', () => {
    useAppConfigStore.getState().setUserId(ANA);
    useAppConfigStore.getState().setUserId(null);
    expect(useCajaLock.getState().bloqueadaPor).toBe(ANA);
    useCajaLock.getState().soltar();
    expect(useCajaLock.getState().bloqueadaPor).toBeNull();
    useAppConfigStore.getState().setUserId(LUIS);
    expect(useCajaLock.getState().bloqueadaPor).toBeNull();
    useAppConfigStore.getState().setUserId(null);
    expect(useCajaLock.getState().bloqueadaPor).toBe(LUIS);
    useCajaLock.getState().soltar();
  });
});

describe('linking', () => {
  const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';
  it('reads the token from the portal link fragment', () => {
    expect(tokenDeQr(`https://app.xangarro.mx/activar#c=${TOKEN}`)).toBe(TOKEN);
    expect(tokenDeQr(` https://app.xangarro.mx/activar#x=1&c=${TOKEN} `)).toBe(TOKEN);
  });
  it('refuses a product barcode, another app, or a short token', () => {
    expect(tokenDeQr('7501055363057')).toBeNull();
    expect(tokenDeQr(`https://otra.app/login#c=${TOKEN}`)).toBeNull();
    expect(tokenDeQr('https://app.xangarro.mx/activar#c=corto')).toBeNull();
    expect(tokenDeQr(`https://app.xangarro.mx/activar?c=${TOKEN}`)).toBeNull();
  });
  it('says what is missing, the correo first', () => {
    expect(faltaParaConectar('pedro@', 'K7M3')).toEqual({ que: 'correo' });
    expect(faltaParaConectar('pedro@taqueria.mx', 'K7M3')).toEqual({ que: 'letras', n: 4 });
    expect(faltaParaConectar('pedro@taqueria.mx', sanitizeCode('k7m3-dq9p'))).toBeNull();
  });
});

const teclear = (keys: readonly TeclaFondo[], from: FondoEstado = fondoDe(null)): FondoEstado =>
  keys.reduce(teclearFondo, from);

describe('the fondo keypad', () => {
  it('parses text into centavos without a float', () => {
    expect(centavosDe('800.00')).toBe(80_000n);
    expect(centavosDe('1234.5')).toBe(123_450n);
    expect(centavosDe('0')).toBe(0n);
    expect(centavosDe('7.')).toBe(700n);
  });
  it('is not an amount while empty or malformed', () => {
    expect(centavosDe('')).toBeNull();
    expect(centavosDe('.5')).toBeNull();
    expect(centavosDe('1.234')).toBeNull();
  });
  it('a suggestion or a chip is replaced by the next digit', () => {
    const e = teclear(['5', '0', '0'], fondoDe(80_000n));
    expect(e.raw).toBe('500');
  });
  it('one point, two decimals, six whole digits', () => {
    expect(teclear(['.', '5', '.', '0', '9']).raw).toBe('0.50');
    expect(teclear(['1', '2', '3', '4', '5', '6', '7']).raw).toBe('123456');
    expect(teclear(['0', '0', '4']).raw).toBe('4');
  });
  it('«Borrar» after a chip empties the figure', () => {
    expect(teclear(['borrar'], fondoDe(50_000n)).raw).toBe('');
  });
  it('groups the whole part and labels the chips', () => {
    expect(fondoVisible('12345.5')).toBe('12,345.5');
    expect(fondoVisible('')).toBe('0');
    expect(etiquetaRapido(100_000n)).toBe('$1,000');
  });
});

describe('the words around the entry', () => {
  const t = (k: string, o?: Record<string, unknown>) => `${k}${o ? JSON.stringify(o) : ''}`;
  const ahora = new Date(2026, 4, 14, 15, 0);
  it('says the last close as today, yesterday or its date', () => {
    expect(textoUltimo(t, { fecha: '2026-05-13', monto: 80_000n }, ahora)).toContain(
      'entrar.abrirTurno.ayer',
    );
    expect(textoUltimo(t, { fecha: '2026-05-14', monto: 80_000n }, ahora)).toContain(
      'entrar.abrirTurno.hoy',
    );
    expect(textoUltimo(t, { fecha: '2026-05-09', monto: 80_000n }, ahora)).toContain(
      '"dia":"9 may"',
    );
    expect(textoUltimo(t, null, ahora)).toBeNull();
  });
  it('names the day and the caja from the session', () => {
    expect(diaLargo(ahora)).toBe('Jueves 14 de mayo');
    expect(contextoCaja('Caja 1', 'Taquería Don Pedro')).toBe('Caja 1 · Taquería Don Pedro');
    expect(contextoCaja(null, 'Taquería Don Pedro')).toBe('Taquería Don Pedro');
    expect(contextoCaja(' ', null)).toBeNull();
  });
});
