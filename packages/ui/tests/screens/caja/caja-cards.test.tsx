/**
 * CajaBalanceCard + CajaStatusCard tests.
 *
 * Covers balance breakdown rendering, formatted amounts, and status info.
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  BusinessId,
  CajaTurno,
  CajaTurnoId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  UserId,
} from '@cachink/domain';
import type { CajaBalanceResult } from '@cachink/domain';
import { CajaBalanceCard } from '../../../src/screens/Caja/caja-balance-card';
import { CajaStatusCard } from '../../../src/screens/Caja/caja-status-card';
import { initI18n } from '../../../src/i18n/index';
import { renderWithProviders, screen } from '../../test-utils';

initI18n();

const BALANCE: CajaBalanceResult = {
  efectivoEnCaja: 150000n,
  desglose: {
    apertura: 50000n,
    adicional: 0n,
    ventasEfectivo: 120000n,
    cambiosDados: 5000n,
    egresosEfectivo: 10000n,
    depositos: 0n,
    retiros: 5000n,
    cancelacionesEfectivo: 0n,
  },
};

const TURNO: CajaTurno = {
  id: '01JPHK0000000000000000TRN01' as CajaTurnoId,
  userId: '01JPHK0000000000000000USR1' as UserId,
  fecha: '2026-06-15' as IsoDate,
  aperturaAt: '2026-06-15T09:00:00.000Z' as IsoTimestamp,
  cierreAt: null,
  montoAperturaCentavos: 50000n,
  efectivoAdicionalCentavos: 0n,
  montoCierreCentavos: null,
  efectivoEsperadoCentavos: null,
  diferenciaCentavos: null,
  discrepancyReason: null,
  explicacion: null,
  totalTransferencias: 0n,
  totalTarjeta: 0n,
  totalQr: 0n,
  totalCredito: 0n,
  egresoAutoId: null,
  conteoCentavos: null,
  conteoAt: null,
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId,
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId,
  createdByUserId: null,
  createdAt: '2026-06-15T09:00:00.000Z' as IsoTimestamp,
  updatedAt: '2026-06-15T09:00:00.000Z' as IsoTimestamp,
  deletedAt: null,
};

describe('CajaBalanceCard', () => {
  it('renders with default testID caja-balance-card', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} />);
    expect(screen.getByTestId('caja-balance-card')).toBeInTheDocument();
  });

  it('displays the total efectivo en caja', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} />);
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
  });

  it('displays the apertura row', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} />);
    expect(screen.getByText('Apertura:')).toBeInTheDocument();
  });

  it('displays ventas efectivo row', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} />);
    expect(screen.getByText('Ventas efectivo:')).toBeInTheDocument();
  });

  it('displays cambios dados row', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} />);
    expect(screen.getByText('Cambios dados:')).toBeInTheDocument();
  });

  it('displays retiros row', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} />);
    expect(screen.getByText('Retiros:')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} testID="my-card" />);
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
  });

  it('hides adicional row when value is zero', () => {
    renderWithProviders(<CajaBalanceCard balance={BALANCE} />);
    expect(screen.queryByText('Adicional:')).toBeNull();
  });

  it('shows adicional row when value is > 0', () => {
    const withAdicional: CajaBalanceResult = {
      ...BALANCE,
      desglose: { ...BALANCE.desglose, adicional: 10000n },
    };
    renderWithProviders(<CajaBalanceCard balance={withAdicional} />);
    expect(screen.getByText('Adicional:')).toBeInTheDocument();
  });
});

describe('CajaStatusCard', () => {
  it('renders with default testID caja-status-card', () => {
    renderWithProviders(<CajaStatusCard turno={TURNO} onCerrar={vi.fn()} />);
    expect(screen.getByTestId('caja-status-card')).toBeInTheDocument();
  });

  it('displays the apertura amount', () => {
    renderWithProviders(<CajaStatusCard turno={TURNO} onCerrar={vi.fn()} />);
    // The card shows apertura in the format "$500.00"
    const card = screen.getByTestId('caja-status-card');
    expect(card.textContent).toContain('$500.00');
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <CajaStatusCard turno={TURNO} onCerrar={vi.fn()} testID="my-status" />,
    );
    expect(screen.getByTestId('my-status')).toBeInTheDocument();
  });
});
