/**
 * CorteHistorialStrip tests (Slice 3 C6).
 */

import { describe, expect, it } from 'vitest';
import { CorteHistorialStrip } from '../../src/screens/index';
import { makeDayClose } from '@cachink/testing';
import type { DayClose, DayCloseId, IsoDate } from '@cachink/domain';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

function row(overrides: Partial<DayClose> = {}): DayClose {
  return makeDayClose({
    id: '01JPHK0000000000000000CD01' as DayCloseId,
    fecha: '2026-04-24' as IsoDate,
    efectivoEsperadoCentavos: 45000n,
    efectivoContadoCentavos: 45000n,
    diferenciaCentavos: 0n,
    ...overrides,
  });
}

describe('CorteHistorialStrip', () => {
  it('renders the empty card when cortes is empty', () => {
    renderWithProviders(<CorteHistorialStrip cortes={[]} />);
    expect(screen.getByTestId('corte-historial-empty')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay cortes guardados.')).toBeInTheDocument();
  });

  it('renders one row per corte, newest first as passed in', () => {
    const rows: readonly DayClose[] = [
      row({ id: '01JPHK0000000000000000CD03' as DayCloseId, fecha: '2026-04-24' as IsoDate }),
      row({ id: '01JPHK0000000000000000CD02' as DayCloseId, fecha: '2026-04-23' as IsoDate }),
      row({ id: '01JPHK0000000000000000CD01' as DayCloseId, fecha: '2026-04-22' as IsoDate }),
    ];
    renderWithProviders(<CorteHistorialStrip cortes={rows} />);
    expect(screen.getByTestId('corte-row-01JPHK0000000000000000CD03')).toBeInTheDocument();
    expect(screen.getByTestId('corte-row-01JPHK0000000000000000CD02')).toBeInTheDocument();
    expect(screen.getByTestId('corte-row-01JPHK0000000000000000CD01')).toBeInTheDocument();
  });

  it('shows Cuadra tag when diferencia is zero', () => {
    renderWithProviders(<CorteHistorialStrip cortes={[row({ diferenciaCentavos: 0n })]} />);
    expect(screen.getByText('Cuadra')).toBeInTheDocument();
  });

  it('shows Sobra tag (green) when diferencia > 0 and Falta (red) when diferencia < 0', () => {
    const rows: readonly DayClose[] = [
      row({ id: '01JPHK0000000000000000CDS1' as DayCloseId, diferenciaCentavos: 500n }),
      row({ id: '01JPHK0000000000000000CDF1' as DayCloseId, diferenciaCentavos: -500n }),
    ];
    renderWithProviders(<CorteHistorialStrip cortes={rows} />);
    expect(screen.getByText('Sobra')).toBeInTheDocument();
    expect(screen.getByText('Falta')).toBeInTheDocument();
  });
});
