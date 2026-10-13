/**
 * Mi turno and Cierre (Track M, M-09) in their board states — turno,
 * con-registros-por-enviar, sin-turno; cierre cuadra, falta,
 * con-registros-por-enviar; hecho-cuadro, hecho-faltante, hecho-sobrante —
 * for review against the boards Operador Turno and Operador Cierre de
 * turno. Fed the caja package's design fixtures; the live tab reads
 * `useMiTurno()` and the cierre route `useCierreTurno()`.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { estadoDelConteo, type EstadoConteo } from '@xangarro/caja/cierre';
import { CIERRE_FIXTURE, CONTEO_CUADRA, CONTEO_FALTA, CONTEO_SOBRA } from '@xangarro/caja/cierre';
import { TURNO_FIXTURE } from '@xangarro/caja/turno';
import { initI18n } from '../../i18n/index';
import { Marco } from '../Inicio/story-marco';
import { CierreHecho } from './cierre-hecho';
import { CierreScreen } from './cierre-screen';
import { MiTurnoScreen } from './mi-turno-screen';

initI18n();

const COLA = {
  porEnviar: 0,
  reintentando: 0,
  sinRed: false,
  enviando: false,
  onReintentar: () => undefined,
};
const COLA_POR_ENVIAR = {
  ...COLA,
  porEnviar: 3,
  reintentando: 1,
};

const ACCIONES = {
  onCerrar: () => undefined,
  onRetry: () => undefined,
  onIrAInicio: () => undefined,
  onVerVentas: () => undefined,
  onRegistrar: () => undefined,
};

/** The estado a count leaves: `estadoDelConteo` over the board's parts. */
function e(conteo: Parameters<typeof estadoDelConteo>[0]): EstadoConteo {
  return estadoDelConteo(conteo, CIERRE_FIXTURE.partes, 'Cambio mal dado', 'Se me fue el cambio');
}

function MiTurno(p: { readonly porEnviar?: boolean; readonly sinTurno?: boolean }): ReactElement {
  return (
    <Marco layout="phone" shell>
      <MiTurnoScreen
        state={p.sinTurno === true ? 'sin-turno' : 'happy'}
        data={p.sinTurno === true ? null : TURNO_FIXTURE}
        cola={p.porEnviar === true ? COLA_POR_ENVIAR : COLA}
        {...ACCIONES}
      />
    </Marco>
  );
}

function Cierre(p: {
  readonly conteo?: Parameters<typeof estadoDelConteo>[0];
  readonly porEnviar?: boolean;
}): ReactElement {
  return (
    <Marco layout="phone" shell>
      <CierreScreen
        state="happy"
        data={p.conteo === undefined ? CIERRE_FIXTURE : { ...CIERRE_FIXTURE, conteo: p.conteo }}
        cola={p.porEnviar === true ? COLA_POR_ENVIAR : COLA}
        onCerrar={async () => null}
        onRetry={() => undefined}
        onSalir={() => undefined}
        onCompartir={() => undefined}
      />
    </Marco>
  );
}

function Hecho(p: { readonly conteo: Parameters<typeof estadoDelConteo>[0] }): ReactElement {
  return (
    <Marco layout="phone" shell>
      <CierreHecho
        data={CIERRE_FIXTURE}
        e={e(p.conteo)}
        motivo="Cambio mal dado"
        porEnviar={0}
        onCompartir={() => undefined}
        onSalir={() => undefined}
      />
    </Marco>
  );
}

const meta: Meta = {
  title: 'Track M / Pantallas / Mi turno y cierre',
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj;

export const Turno: Story = { render: () => <MiTurno /> };
export const TurnoConRegistrosPorEnviar: Story = { render: () => <MiTurno porEnviar /> };
export const TurnoSinTurno: Story = { render: () => <MiTurno sinTurno /> };
export const CierreCuadra: Story = { render: () => <Cierre conteo={CONTEO_CUADRA} /> };
export const CierreFalta: Story = { render: () => <Cierre conteo={CONTEO_FALTA} /> };
export const CierreConRegistrosPorEnviar: Story = {
  render: () => <Cierre conteo={CONTEO_FALTA} porEnviar />,
};
export const HechoCuadro: Story = { render: () => <Hecho conteo={CONTEO_CUADRA} /> };
export const HechoFaltante: Story = { render: () => <Hecho conteo={CONTEO_FALTA} /> };
export const HechoSobrante: Story = { render: () => <Hecho conteo={CONTEO_SOBRA} /> };
