/**
 * DirectorHomeRoute — smart wrapper both apps mount for the Director
 * tab's home content (P1C-M10-T01).
 *
 * Responsibility: compose `<DirectorHomeScreen />` with the M10 sub-card
 * smart components (UtilidadHero, HoyKpiStrip, CxCCard, ActividadReciente,
 * StockBajoCard, PendientesDirectorCard). Every sub-card owns its own
 * hook + rendering, so this file stays small.
 *
 * Navigation is delegated: the route accepts an `onNavigate(path)` the
 * child cards call when the user taps "Ver …".
 *
 * Commits 2-7 progressively fill the slots with real sub-components.
 * Phase 1D/1E may add a LAN / Cloud status hero — additive, not a
 * rewrite.
 */

import type { ReactElement } from 'react';
import { useNotificationsEnabled } from '../../app-config/index';
import { useFeatureFlag } from '../../hooks/use-feature-flags';
import { useScheduleStockLowCheck } from '../../hooks/use-schedule-stock-low-check';
import { useCorteHistorial } from '../../hooks/use-corte-historial';
import { useUnreadAlertCount } from '../../hooks/use-unread-alert-count';
import { useCheckCreditosVencidos } from '../../hooks/use-check-creditos-vencidos';
import { NotificationBadge } from '../../components/NotificationBadge/index';
import { CorteHomeCard } from '../CorteDeDia/corte-home-card';
import { CorteHistorialStrip } from '../CorteDeDia/corte-historial-strip';
import { DirectorHomeScreen } from './director-home-screen';
import { UtilidadHero } from './utilidad-hero';
import { HoyKpiStrip } from './hoy-kpi-strip';
import { CxCCard } from './cxc-card';
import { ActividadReciente } from './actividad-reciente';
import { StockBajoCard } from './stock-bajo-card';
import { PendientesDirectorCard } from './pendientes-director-card';
import { ConflictosRecientesCard } from './conflictos-recientes-card';

export interface DirectorHomeRouteProps {
  /**
   * Called when a sub-card routes away (e.g. "Ver ventas hoy" → `/ventas`,
   * "Ver bajo stock" → `/inventario?filter=bajoStock`). Apps wire this to
   * their router.
   */
  readonly onNavigate?: (path: string) => void;
  readonly testID?: string;
}

export function DirectorHomeRoute(props: DirectorHomeRouteProps): ReactElement {
  // C2 fills the hero slot. Subsequent commits replace each `undefined`
  // below with its smart component.
  const nav = props.onNavigate;
  const notificationsEnabled = useNotificationsEnabled();
  const ventasCredito = useFeatureFlag('ventasCredito');
  useScheduleStockLowCheck({ enabled: notificationsEnabled });
  useCheckCreditosVencidos();
  const historialQ = useCorteHistorial();
  const unreadCount = useUnreadAlertCount();
  return (
    <DirectorHomeScreen
      testID={props.testID ?? 'director-home-route'}
      notificationBadge={
        <NotificationBadge
          count={unreadCount.data ?? 0}
          onPress={() => nav?.('/notificaciones')}
        />
      }
      hero={<UtilidadHero onVerEstados={() => nav?.('/estados')} />}
      corte={<CorteHomeCard />}
      hoy={
        <HoyKpiStrip onVerVentas={() => nav?.('/ventas')} onVerEgresos={() => nav?.('/egresos')} />
      }
      cxc={ventasCredito ? <CxCCard onVerTodo={() => nav?.('/cuentas-por-cobrar')} /> : undefined}
      actividad={<ActividadReciente limit={6} />}
      stockBajo={<StockBajoCard onVerBajoStock={() => nav?.('/inventario?filter=bajoStock')} />}
      pendientes={<PendientesDirectorCard />}
      conflictos={<ConflictosRecientesCard />}
      historial={<CorteHistorialStrip cortes={historialQ.data ?? []} />}
    />
  );
}
