/**
 * Mi turno (MvTurno) for review against the board. Fed the caja package's
 * design fixture; the live screen reads `useMiTurno()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { TURNO_FIXTURE } from '@xangarro/caja/turno';
import { Btn } from '../../components/index';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { MiTurnoScreen } from './mi-turno-screen';
import { filasVivas, type MiTurnoVista } from './mi-turno-vista';

initI18n();

const GAS = { id: 'gas', nombre: 'Gas', detalle: 'Cada semana', monto: 620_00n, vence: 0 };

const VISTA: MiTurnoVista = {
  turno: { ...TURNO_FIXTURE, pendientes: [GAS] },
  iniciales: 'AR',
  dia: 'jueves 14 de mayo',
  abonos: 550_00n,
  stock: [
    { id: 'p', nombre: 'Pastor', existencias: 3, umbral: 5 },
    { id: 'b', nombre: 'Bistec', existencias: 2, umbral: 5 },
    { id: 'q', nombre: 'Queso oaxaca', existencias: 1, umbral: 3 },
    { id: 'a', nombre: 'Agua', existencias: 4, umbral: 6 },
  ],
};

type Caso = 'turno' | 'porEnviar' | 'sinTurno';

function Pantalla({ caso }: { caso: Caso }): ReactElement {
  const cola = { porEnviar: caso === 'porEnviar' ? 3 : 0, rechazados: 0 };
  const abierto = caso !== 'sinTurno';
  return (
    <Marco shell>
      <MiTurnoScreen
        state={abierto ? 'happy' : 'sin-turno'}
        vista={abierto ? VISTA : null}
        vivas={abierto ? filasVivas(VISTA, cola) : {}}
        onNavigate={() => undefined}
        onCerrar={() => undefined}
        onBloquear={() => undefined}
        onRetry={() => undefined}
        sinTurno={
          <Btn variant="primary" size="xl" fullWidth onPress={() => undefined}>
            Abrir turno
          </Btn>
        }
      />
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Mi turno',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Turno: Story = { args: { caso: 'turno' } };
export const ConRegistrosPorEnviar: Story = { args: { caso: 'porEnviar' } };
export const SinTurno: Story = { args: { caso: 'sinTurno' } };
