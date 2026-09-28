/**
 * Cierre (MvCierre) and Turno cerrado (MvCierreHecho) for review against the
 * boards. Fed the caja package's design turno; the live screen reads
 * `useCierreMovil()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import type { CierreData } from '@xangarro/caja/cierre';
import { TURNO_FIXTURE as T } from '@xangarro/caja/turno';
import { diferenciaCorte, totalContado, type ConteoDenominaciones } from '@xangarro/domain';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { CierreScreen } from './cierre-screen';
import type { CierreHecho } from './cierre-tipos';
import { useConteoCierre } from './use-conteo-cierre';

initI18n();

/** $2,710.00, the design's expected cash. */
const CUADRA: ConteoDenominaciones = {
  'billete-1000': 2,
  'billete-500': 1,
  'billete-200': 1,
  'moneda-10': 1,
};
/** $2,640.00: $70.00 short. */
const FALTA: ConteoDenominaciones = {
  'billete-1000': 2,
  'billete-500': 1,
  'billete-100': 1,
  'billete-20': 2,
};
/** $2,760.00: $50.00 over. */
const SOBRA: ConteoDenominaciones = { ...CUADRA, 'billete-50': 1 };

const DATA: CierreData = {
  operador: T.operador,
  caja: T.caja,
  desde: T.desde,
  hasta: '21:04',
  dueno: 'Pedro',
  negocio: 'Taquería Don Pedro',
  partes: T,
  resumen: {
    ventas: T.ventas,
    cobrado: T.cobrado,
    canceladas: 1,
    cancelado: 90_00n,
    canceladaHora: '12:58',
    fiado: T.fiado,
    entradas: 3,
    mermas: 2,
  },
  conteo: {},
};

type Caso = 'cuadra' | 'falta' | 'porEnviar' | 'hechoCuadra' | 'hechoFaltante' | 'hechoSobrante';

const CONTEO: Record<Caso, ConteoDenominaciones> = {
  cuadra: CUADRA,
  falta: FALTA,
  porEnviar: CUADRA,
  hechoCuadra: CUADRA,
  hechoFaltante: FALTA,
  hechoSobrante: SOBRA,
};

function hechoDe(caso: Caso): CierreHecho | null {
  if (!caso.startsWith('hecho')) return null;
  const contado = totalContado(CONTEO[caso]);
  const dif = diferenciaCorte(contado, T.esperado);
  const motivo = dif.tipo === 'cuadra' ? null : 'Cambio mal dado';
  return { data: DATA, contado, esperado: T.esperado, dif, motivo, porEnviar: 0, fecha: '14 may' };
}

function Pantalla({ caso }: { caso: Caso }): ReactElement {
  const conteo = useConteoCierre({ ...DATA, conteo: CONTEO[caso] });
  const porEnviar = caso === 'porEnviar' ? 3 : 0;
  return (
    <Marco shell>
      <CierreScreen
        x={{
          state: 'happy',
          data: DATA,
          conteo,
          cola: {
            porEnviar,
            reintentando: 1,
            enviando: false,
            reintentar: () => undefined,
          },
          cerrar: () => undefined,
          cerrando: false,
          fallo: false,
          hecho: hechoDe(caso),
          refetch: () => undefined,
        }}
        onVerCuales={() => undefined}
        onCompartir={() => undefined}
        onSalir={() => undefined}
        onVolver={() => undefined}
      />
    </Marco>
  );
}

const meta: Meta<typeof Pantalla> = {
  title: 'Track M / Pantallas / Cierre',
  component: Pantalla,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Pantalla>;

export const Cuadra: Story = { args: { caso: 'cuadra' } };
export const Falta: Story = { args: { caso: 'falta' } };
export const ConRegistrosPorEnviar: Story = { args: { caso: 'porEnviar' } };
export const HechoCuadro: Story = { args: { caso: 'hechoCuadra' } };
export const HechoFaltante: Story = { args: { caso: 'hechoFaltante' } };
export const HechoSobrante: Story = { args: { caso: 'hechoSobrante' } };
