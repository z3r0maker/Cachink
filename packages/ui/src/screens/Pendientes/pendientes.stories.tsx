/**
 * Registros por enviar (Track M, M-09) for review against the board
 * MvPendientes, with the design's queue (`COLA_FIXTURE`); the live route
 * reads the phone's outbox and the refused rows.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { COLA_FIXTURE } from '@xangarro/caja/pendientes';
import type { RejectedRow } from '@xangarro/sync';
import { OfflineBanner } from '../../components/index';
import { initI18n } from '../../i18n/index';
import { MarcoDetalle } from '../Inventario/marco-detalle';
import { faseDe } from './pendientes-logica';
import { PendientesScreen } from './pendientes-screen';

initI18n();

type Vista = 'espera' | 'sinInternet' | 'enviando' | 'enviado' | 'rechazados' | 'cargando';

const RECHAZADA: RejectedRow = {
  tableName: 'sales',
  rowId: 'S1',
  code: 'FK_PRODUCT_MISSING',
  message: 'productoId not found',
  retryable: false,
  attempts: 1,
  lastAttemptAt: '2026-05-14T20:32:00.000Z',
  row: { monto: 12000n, concepto: 'Agua de horchata', fecha: '2026-05-14' },
};

function Demo({ vista }: { vista: Vista }): ReactElement {
  const cola = vista === 'enviado' ? [] : COLA_FIXTURE;
  const offline = vista === 'espera' || vista === 'sinInternet';
  return (
    <MarcoDetalle
      ruta="/pendientes"
      volver="Cobrar"
      headerStatus="static"
      banners={offline ? <OfflineBanner pendientes={cola.length} /> : null}
    >
      <PendientesScreen
        state={vista === 'cargando' ? 'loading' : 'happy'}
        cola={cola}
        rechazados={vista === 'rechazados' ? [RECHAZADA] : []}
        fase={faseDe(vista === 'enviando', cola)}
        offline={offline}
        sinInternet={vista === 'sinInternet'}
        onReintentar={() => undefined}
        onReintentarRechazados={() => undefined}
        onRetryLeer={() => undefined}
      />
    </MarcoDetalle>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Track M / Pantallas / Registros por enviar',
  component: Demo,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Demo>;

export const EnEspera: Story = { args: { vista: 'espera' } };
export const SinInternet: Story = { args: { vista: 'sinInternet' } };
export const Enviando: Story = { args: { vista: 'enviando' } };
export const TodoEnviado: Story = { args: { vista: 'enviado' } };
export const ConRechazados: Story = { args: { vista: 'rechazados' } };
export const Cargando: Story = { args: { vista: 'cargando' } };
