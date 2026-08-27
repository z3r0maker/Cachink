/**
 * CajaContent — orchestrator for the cash-drawer screen.
 *
 * State machine (Caja Overhaul):
 *   turno == null                        → AbrirCaja (numpad)
 *   turno.cierreAt == null &&
 *     turno.conteoCentavos == null        → Active turn (balance, deposit/withdraw)
 *   turno.cierreAt == null &&
 *     turno.conteoCentavos != null        → Step 2 (comparison + close form)
 *   turno.cierreAt != null               → Closed (new turn needed)
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import type { CajaMovimientoTipo, CajaTurno, Money, UserId } from '@cachink/domain';
import { CajaActiveTurnView } from './caja-active-turn';
import { CajaOpenTurnView } from './caja-open-turn-view';
import { MovimientoSheetWired } from './movimiento-sheet-wired';
import { CerrarCajaModal } from './cerrar-caja-modal';
import { useCerrarCaja } from '../../hooks/use-cerrar-caja';
import { useOpenCajaTurno } from '../../hooks/use-open-caja-turno';
import { useTranslation } from '../../i18n/index';
import { SettingsNavSection } from '../Settings/settings-nav-section';
import type { OtrosItem } from '../Otros/otros-items';

export interface CajaContentProps {
  readonly testID?: string;
  /**
   * Operativo tool grid absorbed from the retired Otros tab (review
   * item #7). Pass `operativoCajaToolItems(flags)` plus a navigator;
   * omit both for the Director, whose tools live in Configuración.
   */
  readonly toolItems?: readonly OtrosItem[];
  /** Required when `toolItems` is provided — receives the item `path`. */
  readonly onNavigateTool?: (path: string) => void;
}

function hasBlindCountPending(turno: CajaTurno | null): boolean {
  if (turno === null || turno.cierreAt !== null) return false;
  return (turno as CajaTurno & { conteoCentavos?: Money | null }).conteoCentavos != null;
}

/**
 * The Operativo tool grid that used to be the "Otros" tab (ADR-052).
 * Renders nothing for the Director, whose tools live in Configuración.
 */
function CajaToolsSection(props: {
  items?: readonly OtrosItem[];
  onNavigate?: (path: string) => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!props.items || !props.onNavigate) return null;
  return (
    <SettingsNavSection
      items={props.items}
      onNavigate={props.onNavigate}
      title={t('settings.herramientas')}
    />
  );
}

export function CajaContent(props: CajaContentProps): ReactElement {
  const { userId, openTurno } = useOpenCajaTurno();
  const cerrar = useCerrarCaja();
  const [showCerrar, setShowCerrar] = useState(false);
  const [movSheet, setMovSheet] = useState<CajaMovimientoTipo | null>(null);

  const shouldShowCerrar = showCerrar || hasBlindCountPending(openTurno);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {openTurno === null && !shouldShowCerrar && (
        <CajaOpenTurnView userId={userId as UserId | null} />
      )}
      {openTurno !== null && !shouldShowCerrar && (
        <CajaActiveTurnView
          turno={openTurno}
          onCerrar={() => setShowCerrar(true)}
          onDeposit={() => setMovSheet('deposito')}
          onWithdraw={() => setMovSheet('retiro')}
        />
      )}
      <CajaCloseSection
        shouldShow={shouldShowCerrar}
        openTurno={openTurno}
        cerrar={cerrar}
        onClose={() => setShowCerrar(false)}
      />
      {movSheet !== null && openTurno !== null && userId !== null && (
        <MovimientoSheetWired
          tipo={movSheet}
          turnoId={openTurno.id}
          userId={userId}
          onClose={() => setMovSheet(null)}
        />
      )}
      <CajaToolsSection items={props.toolItems} onNavigate={props.onNavigateTool} />
    </ScrollView>
  );
}

function CajaCloseSection(props: {
  shouldShow: boolean;
  openTurno: CajaTurno | null;
  cerrar: ReturnType<typeof useCerrarCaja>;
  onClose: () => void;
}): ReactElement | null {
  if (!props.shouldShow || props.openTurno === null) return null;

  return (
    <CerrarCajaModal
      onSubmit={(monto, reason, explicacion) => {
        props.cerrar.mutate(
          {
            turnoId: props.openTurno!.id,
            montoCierreCentavos: monto,
            discrepancyReason: reason,
            explicacion,
          },
          { onSuccess: props.onClose },
        );
      }}
      submitting={props.cerrar.isPending}
    />
  );
}
