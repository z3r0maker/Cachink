/**
 * Desktop route adapter for /ventas — tap-to-cart POS.
 *
 * Mirrors the mobile route with `navigate` in place of `useRouter`.
 */
import { type ReactElement } from 'react';
import { CajaGateBanner, CorteHomeCard, ProductosGateBanner, useOpenCajaTurno, useRole } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';
import { useVentasRouteState, VentasMainContent, VentasSheets } from './ventas-route-state';

export function VentasRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const { openTurno, isLoading: turnoLoading } = useOpenCajaTurno();
  const role = useRole();
  const s = useVentasRouteState();

  if (!turnoLoading && openTurno === null) {
    // Products gate takes priority: no products → nothing to sell
    const hasNoProducts = s.productosQ.data !== undefined && s.productosQ.data.length === 0;
    return (
      <DesktopAppShellWrapper activeTabKey="ventas">
        {hasNoProducts ? (
          <ProductosGateBanner onGoToProductos={() => navigate('/productos')} />
        ) : (
          <CajaGateBanner onGoToCaja={() => navigate('/caja')} />
        )}
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
