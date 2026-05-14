/**
 * CajaContent — shared cash-drawer UI used by both mobile and
 * desktop route adapters.
 *
 * Handles open/closed turn logic, AbrirCajaModal, CajaStatusCard,
 * and CerrarCajaModal. Route files become thin wrappers.
 *
 * Extracted per CLAUDE.md §6 (40-line budget).
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, CajaTurno, UserId } from '@cachink/domain';
import { AbrirCajaModal } from './abrir-caja-modal';
import { CajaStatusCard } from './caja-status-card';
import { CerrarCajaModal } from './cerrar-caja-modal';
import { useAbrirCaja } from '../../hooks/use-abrir-caja';
import { useCerrarCaja } from '../../hooks/use-cerrar-caja';
import { useCajaTurnosRepository } from '../../app/repository-provider';
import { useCurrentBusinessId, useUserId } from '../../app-config/use-app-config';
import { cajaKeys } from '../../hooks/query-keys';
import { useTranslation } from '../../i18n/index';
import { Btn } from '../../components/Btn/btn';

export interface CajaContentProps {
  readonly testID?: string;
}

function useOpenCajaTurno() {
  const businessId = useCurrentBusinessId();
  const userId = useUserId();
  const turnosRepo = useCajaTurnosRepository();
  const openTurnoQ = useQuery({
    queryKey: [...cajaKeys.openByUser(businessId as BusinessId | null), userId],
    queryFn: () => (userId ? turnosRepo.findOpenByUser(userId) : null),
    enabled: userId !== null,
  });
  return { userId, openTurno: openTurnoQ.data ?? null };
}

export function CajaContent(_props: CajaContentProps): ReactElement {
  const { t } = useTranslation();
  const { userId, openTurno } = useOpenCajaTurno();
  const abrir = useAbrirCaja();
  const cerrar = useCerrarCaja();
  const [showCerrar, setShowCerrar] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text fontWeight="900" fontSize={28} color="$color">
        {t('caja.title')}
      </Text>
      {openTurno === null && !showCerrar && (
        <CajaOpenTurnView userId={userId as UserId | null} abrir={abrir} />
      )}
      {openTurno !== null && !showCerrar && (
        <CajaActiveTurnView turno={openTurno} onCerrar={() => setShowCerrar(true)} />
      )}
      {showCerrar && openTurno !== null && (
        <CerrarCajaModal
          onSubmit={(monto, reason, explicacion) => {
            cerrar.mutate(
              {
                turnoId: openTurno.id,
                montoCierreCentavos: monto,
                discrepancyReason: reason,
                explicacion,
              },
              { onSuccess: () => setShowCerrar(false) },
            );
          }}
          submitting={cerrar.isPending}
        />
      )}
    </ScrollView>
  );
}

// --- Sub-components (keep each under 40 lines) ---

interface CajaOpenTurnViewProps {
  readonly userId: UserId | null;
  readonly abrir: ReturnType<typeof useAbrirCaja>;
}

function CajaOpenTurnView(props: CajaOpenTurnViewProps): ReactElement {
  return (
    <AbrirCajaModal
      suggestedAmount={null}
      onSubmit={(apertura, adicional) => {
        if (!props.userId) return;
        props.abrir.mutate({
          userId: props.userId,
          montoAperturaCentavos: apertura,
          efectivoAdicionalCentavos: adicional,
        });
      }}
      submitting={props.abrir.isPending}
    />
  );
}

interface CajaActiveTurnViewProps {
  readonly turno: CajaTurno;
  readonly onCerrar: () => void;
}

function CajaActiveTurnView(props: CajaActiveTurnViewProps): ReactElement {
  const { t } = useTranslation();

  return (
    <View gap={12}>
      <CajaStatusCard turno={props.turno} onCerrar={props.onCerrar} />
      <Btn variant="dark" onPress={props.onCerrar} fullWidth testID="caja-cerrar-btn">
        {t('caja.cerrarTitle')}
      </Btn>
    </View>
  );
}
