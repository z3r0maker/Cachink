/**
 * useActiveTabKey unit tests (UXD-R3 E2, ADR-047).
 *
 * These test the pure PATH_TO_TAB mapping without mounting React.
 * The hook wraps usePathname which is mocked here.
 */

import { describe, expect, it, vi } from 'vitest';

// Mock expo-router's usePathname
vi.mock('expo-router', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'expo-router';
import { useActiveTabKey } from '../../src/shell/use-active-tab-key';

const mockUsePathname = usePathname as ReturnType<typeof vi.fn>;

function tabKeyFor(pathname: string): string {
  mockUsePathname.mockReturnValue(pathname);
  return useActiveTabKey();
}

describe('useActiveTabKey', () => {
  it('maps / to home', () => {
    expect(tabKeyFor('/')).toBe('home');
  });

  it('maps /ventas to ventas', () => {
    expect(tabKeyFor('/ventas')).toBe('ventas');
  });

  it('maps /ventas/avanzada to ventas', () => {
    expect(tabKeyFor('/ventas/avanzada')).toBe('ventas');
  });

  it('maps /egresos to egresos', () => {
    expect(tabKeyFor('/egresos')).toBe('egresos');
  });

  it('maps /productos to productos', () => {
    expect(tabKeyFor('/productos')).toBe('productos');
  });

  it('maps /productos/movimientos to productos', () => {
    expect(tabKeyFor('/productos/movimientos')).toBe('productos');
  });

  it('maps /clientes to ventas (reached from Ventas)', () => {
    expect(tabKeyFor('/clientes')).toBe('ventas');
  });

  it('maps /cuentas-por-cobrar to home (reached from Director Home)', () => {
    expect(tabKeyFor('/cuentas-por-cobrar')).toBe('home');
  });

  it('maps /estados to estados', () => {
    expect(tabKeyFor('/estados')).toBe('estados');
  });

  it('maps /settings to ajustes', () => {
    expect(tabKeyFor('/settings')).toBe('ajustes');
  });

  it('maps /wizard to empty string (no shell)', () => {
    expect(tabKeyFor('/wizard')).toBe('');
  });

  it('maps unknown sub-paths to parent tab via first segment fallback', () => {
    expect(tabKeyFor('/ventas/some-deep-path')).toBe('ventas');
  });

  it('returns empty string for unknown routes', () => {
    expect(tabKeyFor('/unknown-route')).toBe('');
  });
});
