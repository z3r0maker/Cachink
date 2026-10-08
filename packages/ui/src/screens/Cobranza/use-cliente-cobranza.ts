/**
 * One client's account for its route (MvCobranza's client view): the account
 * out of the shared read, the business's name for the reminder, and the
 * abono write, which resolves once the use case has recorded it.
 */
import type { CuentaCliente, MetodoAbono } from '@xangarro/caja/cobranza';
import type { Money } from '@xangarro/domain';
import { useTranslation } from '../../i18n/index';
import { useShellData } from '../AppShell/use-shell-data';
import { useCuentas } from './use-cuentas';
import { useRegistrarAbono } from './use-registrar-abono';

export interface ClienteCobranza {
  readonly state: 'loading' | 'error' | 'happy';
  readonly cuenta: CuentaCliente | null;
  readonly hoy: string;
  readonly negocio: string;
  readonly recibir: (metodo: MetodoAbono, monto: Money) => Promise<void>;
  readonly refetch: () => void;
}

export function useClienteCobranza(clienteId: string): ClienteCobranza {
  const { t } = useTranslation();
  const vivas = useCuentas();
  const shell = useShellData();
  const abono = useRegistrarAbono();
  return {
    state: vivas.state,
    cuenta: vivas.cuentas.find((c) => c.id === clienteId) ?? null,
    hoy: vivas.hoy,
    negocio: shell.negocio ?? shell.caja ?? t('shell.cajaSinNombre'),
    recibir: async (metodo, monto) => {
      await abono.mutateAsync({ clienteId, metodo, monto });
    },
    refetch: vivas.refetch,
  };
}
