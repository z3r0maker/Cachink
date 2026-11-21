/**
 * Vincular (MvVincular): the camera (drawn without a camera in the web
 * preview), the typed code, and the «Código leído» sheet: waiting for the
 * preview, «¿Es tu negocio?» with the business, and a refused code (N-25).
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { ActivationScreen } from './activation-screen';
import { VincularEscanear } from './vincular-escanear';
import { VincularLeido, type VistaPrevia } from './vincular-leido';

initI18n();

type Vista = 'escanear' | 'codigo' | 'leido' | 'cargando' | 'vencido';

const PREVIAS: Record<'leido' | 'cargando' | 'vencido', VistaPrevia> = {
  leido: {
    estado: 'listo',
    negocio: {
      businessName: 'Taquería Don Pedro',
      ownerFirstName: 'Pedro',
      ownerEmail: 'pedro@taqueriadonpedro.mx',
    },
  },
  cargando: { estado: 'cargando' },
  vencido: { estado: 'error', errorKey: 'activate.errors.codeExpired' },
};

function Pantalla({ vista }: { vista: Vista }): ReactElement {
  if (vista !== 'escanear' && vista !== 'codigo') {
    return (
      <Marco>
        <VincularEscanear onToken={() => undefined} leyendo={false} onEscribir={() => undefined} />
        <VincularLeido
          open
          vista={PREVIAS[vista]}
          onConectar={() => undefined}
          onVolver={() => undefined}
          submitting={false}
          errorKey={null}
        />
      </Marco>
    );
  }
  return (
    <Marco>
      <ActivationScreen
        onSubmit={() => undefined}
        onScan={() => undefined}
        submitting={false}
        vistaInicial={vista}
      />
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Vincular',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Escanear: Story = { args: { vista: 'escanear' } };
export const EscribirCodigo: Story = { args: { vista: 'codigo' } };
export const CodigoLeido: Story = { args: { vista: 'leido' } };
export const CodigoLeidoCargando: Story = { args: { vista: 'cargando' } };
export const CodigoLeidoVencido: Story = { args: { vista: 'vencido' } };
