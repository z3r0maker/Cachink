/**
 * Abrir turno (MvAbrirTurno): the fondo sheet over Inicio with the turno
 * closed, starting on the last close. Example data for review only.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { INICIO_FIXTURE } from '@xangarro/caja/inicio';
import { initI18n } from '../../i18n/index';
import { InicioScreen } from '../Inicio/inicio-screen';
import { Marco } from '../Inicio/story-marco';
import { AbrirTurnoSheet } from './abrir-turno-sheet';

initI18n();

const HOY_NO = { ocultos: [], ocultar: () => undefined, mostrarTodo: () => undefined };

function Pantalla(props: { conUltimo: boolean }): ReactElement {
  const [open, setOpen] = useState(true);
  return (
    <Marco shell>
      <InicioScreen
        state="happy"
        data={{ ...INICIO_FIXTURE, situacion: 'turno-cerrado' }}
        hoyNo={HOY_NO}
        layout="phone"
        onNavigate={() => undefined}
        onAbrirTurno={() => setOpen(true)}
        onRetry={() => undefined}
      />
      <AbrirTurnoSheet
        open={open}
        onClose={() => setOpen(false)}
        nombre="Ana"
        ultimo={props.conUltimo ? 'Ayer terminaste con $800.00.' : null}
        sugerido={props.conUltimo ? 80_000n : null}
        onAbrir={() => setOpen(false)}
        submitting={false}
        error={null}
      />
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Abrir turno',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const ConUltimoCorte: Story = { args: { conUltimo: true } };
export const PrimerTurno: Story = { args: { conUltimo: false } };
