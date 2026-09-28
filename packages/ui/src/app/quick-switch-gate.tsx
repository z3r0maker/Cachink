/**
 * QuickSwitchGate — the post-activation sign-in step (A-05; Track M, M-06).
 *
 *   caja locked by someone (MvBloqueo) → BloqueoScreen for that person
 *   otherwise                          → AccesoScreen («¿Quién va a cobrar?»)
 *
 * Operators are created in the portal and arrive by sync. Until the first
 * one exists the screen says where to create it and offers «Actualizar».
 */

import type { ReactElement } from 'react';
import type { BusinessId, User } from '@xangarro/domain';
import { Btn, EmptyState, FloatingCoinsBackground } from '../components/index';
import { useTranslation } from '../i18n/index';
import { AccesoScreen, type AccesoOperador } from '../screens/Login/index';
import { BloqueoScreen } from '../screens/Bloqueo/index';
import { inicialesDe } from '../screens/AppShell/use-shell-data';
import { AppLoadingSkeleton } from './app-loading-skeleton';
import { useCajaLock } from './caja-lock';
import { useCloudSync } from './cloud-sync-bridge';
import { useAccesoContexto, type AccesoContexto } from './use-acceso-contexto';
import { useQuickSwitchAuth, type QuickSwitchAuthResult } from './use-quick-switch-auth';

export interface QuickSwitchGateProps {
  readonly businessId: BusinessId;
}

function NoOperators(): ReactElement {
  const { t } = useTranslation();
  const { state, syncNow } = useCloudSync();
  return (
    <FloatingCoinsBackground testID="quick-switch-empty">
      <EmptyState
        icon="users"
        title={t('login.noOperatorsTitle')}
        description={t('login.noOperatorsBody')}
        action={
          <Btn
            variant="primary"
            onPress={syncNow}
            loading={state.phase === 'syncing'}
            testID="quick-switch-refresh"
          >
            {t('login.refresh')}
          </Btn>
        }
      />
    </FloatingCoinsBackground>
  );
}

function useOperadores(users: readonly User[], ctx: AccesoContexto): AccesoOperador[] {
  const { t } = useTranslation();
  return users.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    iniciales: inicialesDe(u.nombre),
    detalle:
      ctx.turno?.userId === u.id
        ? t('entrar.acceso.turnoDesde', { hora: ctx.turno.desde })
        : undefined,
  }));
}

function Bloqueo(props: {
  readonly o: AccesoOperador;
  readonly ctx: AccesoContexto;
  readonly auth: QuickSwitchAuthResult;
}): ReactElement {
  const soltar = useCajaLock((s) => s.soltar);
  const { o, ctx, auth } = props;
  return (
    <BloqueoScreen
      contexto={ctx.contexto ?? ''}
      userId={o.id as User['id']}
      operador={{ nombre: o.nombre, iniciales: o.iniciales, detalle: o.detalle }}
      onUnlock={auth.handleAuth}
      onCambiar={soltar}
      error={auth.error}
      submitting={auth.submitting}
    />
  );
}

export function QuickSwitchGate(props: QuickSwitchGateProps): ReactElement {
  const auth = useQuickSwitchAuth(props.businessId);
  const ctx = useAccesoContexto(props.businessId);
  const bloqueadaPor = useCajaLock((s) => s.bloqueadaPor);
  const operadores = useOperadores(auth.users, ctx);
  if (auth.loading) return <AppLoadingSkeleton />;
  if (auth.users.length === 0) return <NoOperators />;
  const bloqueo = operadores.find((o) => o.id === bloqueadaPor);
  if (bloqueo) return <Bloqueo o={bloqueo} ctx={ctx} auth={auth} />;
  return (
    <AccesoScreen
      operadores={operadores}
      contexto={ctx.contexto}
      fecha={ctx.fecha}
      dueno={ctx.dueno}
      onAuthenticate={auth.handleAuth}
      error={auth.error}
      submitting={auth.submitting}
    />
  );
}
