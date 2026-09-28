/**
 * Vincular (MvVincular): the camera (drawn without a camera in the web
 * preview), the typed code, and the «Código leído» sheet.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { ActivationScreen } from './activation-screen';
import { VincularEscanear } from './vincular-escanear';
import { VincularLeido } from './vincular-leido';

initI18n();

type Vista = 'escanear' | 'codigo' | 'leido';

function Pantalla({ vista }: { vista: Vista }): ReactElement {
  if (vista === 'leido') {
    return (
      <Marco>
        <VincularEscanear onToken={() => undefined} leyendo={false} onEscribir={() => undefined} />
        <VincularLeido
          open
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
