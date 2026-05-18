/**
 * Desktop route adapter for /ventas — tap-to-cart POS.
 *
 * Mirrors the mobile route with `navigate` in place of `useRouter`.
 */
import { type ReactElement } from 'react';
import { CajaGateBanner, CorteHomeCard, useOpenCajaTurno, useRole } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';
import { useVentasRouteState, VentasMainContent, VentasSheets } from './ventas-route-state';

export function VentasRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const { openTurno, isLoading: turnoLoading } = useOpenCajaTurno();
  const role = useRole();
  const s = useVentasRouteState();

  if (!turnoLoading && openTurno === null) {
    return (
      <DesktopAppShellWrapper activeTabKey="ventas">
        <CajaGateBanner onGoToCaja={() => navigate('/caja')} />
      </DesktopAppShellWrapper>
    );
  }

  return (
    <DesktopAppShellWrapper activeTabKey="ventas">
      {role === 'operativo' && <CorteHomeCard testID="corte-home-card-ventas" />}
      <VentasMainContent state={s} onGoToProductos={() => navigate('/productos')} />
      <VentasSheets state={s} />
    </DesktopAppShellWrapper>
  );
}
