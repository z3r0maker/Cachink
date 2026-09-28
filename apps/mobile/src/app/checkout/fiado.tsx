/**
 * Expo Router entry for /checkout/fiado (Track M, M-07; board MvFiado):
 * «Anótalo a su cuenta». A new client is created first (the owner reviews
 * it), then the ticket goes on the client's account as a Crédito ticket.
 */
import { useRef, type ReactElement } from 'react';
import type { ClientId } from '@xangarro/domain';
import {
  FiadoScreen,
  resumenTicket,
  useClientesFiado,
  useCrearClienteFiado,
  useDueno,
  useSiguienteFolio,
  type AQuien,
} from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';
import { mensajeDeError, useRegistrarCobro } from './_cobro-hooks';

export default function FiadoRoute(): ReactElement {
  const back = useBackTo('/checkout');
  const c = useRegistrarCobro();
  const clientes = useClientesFiado();
  const crear = useCrearClienteFiado();
  // A retry after a failed sale reuses the client it already created.
  const creado = useRef<{ nombre: string; id: ClientId } | null>(null);
  const { total } = resumenTicket(c.lines);
  const nuevo = async (nombre: string, telefono: string) => {
    if (creado.current?.nombre !== nombre) {
      const k = await crear.mutateAsync({ nombre, telefono });
      creado.current = { nombre, id: k.id };
    }
    return { id: creado.current.id, nombre, saldo: 0n };
  };
  const anotar = async (a: AQuien): Promise<void> => {
    try {
      const cliente =
        a.tipo === 'cliente'
          ? { id: a.cliente.id as ClientId, nombre: a.cliente.nombre, saldo: a.cliente.saldo }
          : await nuevo(a.nombre, a.telefono);
      await c.registrar({ metodo: 'Fiado', recibido: null, cliente });
    } catch (err) {
      c.setError(mensajeDeError(err));
    }
  };
  return (
    <AppShellWrapper onBack={back} title="Cobro" backLabel="Volver al cobro">
      <FiadoScreen
        folio={useSiguienteFolio()}
        total={total}
        clientes={clientes.data ?? null}
        cargando={clientes.isLoading}
        registrando={c.registrando || crear.isPending}
        error={c.error}
        dueno={useDueno()}
        onAnotar={(a) => void anotar(a)}
      />
    </AppShellWrapper>
  );
}
