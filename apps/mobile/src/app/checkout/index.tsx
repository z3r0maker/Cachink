/**
 * Expo Router entry for /checkout (Track M, M-07; board MvCobro): «¿Cómo
 * paga?». `metodo` preselects what the tablet's ticket chose; Fiado goes on
 * to /checkout/fiado. Back returns to the ticket.
 */
import type { ReactElement } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CobroScreen,
  METODOS_COBRO,
  metodosDisponibles,
  resumenTicket,
  useEnabledPaymentMethods,
  useSiguienteFolio,
  type MetodoCobro,
} from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';
import { useRegistrarCobro } from './_cobro-hooks';

function metodoDe(param: string | undefined): MetodoCobro {
  return METODOS_COBRO.find((m) => m === param) ?? 'Efectivo';
}

export default function CheckoutRoute(): ReactElement {
  const router = useRouter();
  const { metodo } = useLocalSearchParams<{ metodo?: string }>();
  const back = useBackTo('/cobrar');
  const c = useRegistrarCobro();
  const metodos = metodosDisponibles(useEnabledPaymentMethods());
  const { piezas, total } = resumenTicket(c.lines);
  return (
    <AppShellWrapper onBack={back} title="Ticket" backLabel="Volver al ticket">
      <CobroScreen
        folio={useSiguienteFolio()}
        piezas={piezas}
        total={total}
        metodos={metodos}
        metodoInicial={metodoDe(metodo)}
        registrando={c.registrando}
        error={c.error}
        onCobrar={({ metodo: m, recibido }) => void c.registrar({ metodo: m, recibido })}
        onFiado={() => router.push('/checkout/fiado' as never)}
      />
    </AppShellWrapper>
  );
}
