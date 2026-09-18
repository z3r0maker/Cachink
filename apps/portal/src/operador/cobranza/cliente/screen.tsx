'use client';

import { colors } from '@xangarro/tokens';

import { OperadorEstado } from '../../estado';
import { ICONS, OPERADOR_BASE } from '../../shell/nav';
import { Note } from '../../ui/note';
import { OpMain } from '../../ui/parts';
import { Toast } from '../../ui/toast';
import { RecibirAbono } from '../abono';
import { limiteNota, recordatorio, vista } from './derive';
import { Heroe, Indicadores } from './hero';
import { Abiertas, Movimientos } from './listas';
import { Recordar, RecordarBoton } from './recordar';
import type { CuentaCliente, DetalleClienteData, DetalleClienteProps } from './types';
import { useCliente } from './use-cliente';

/** Operador · Detalle de cliente: one account, derived from its tickets and abonos. */
export function DetalleClienteScreen({ state, data }: DetalleClienteProps) {
  const cuenta = data.cuenta;
  return (
    <OpMain top={24} narrow>
      {state === 'happy' && cuenta ? (
        <Cuenta key={cuenta.id} data={data} inicial={cuenta} />
      ) : (
        <OperadorEstado
          mode={state === 'happy' ? 'empty' : state}
          icon={ICONS.cobranza}
          emptyTitle="Este cliente no tiene cuenta abierta"
          emptyBody="No le has fiado nada todavía, o ya liquidó todo lo que debía."
          errorTitle="No pudimos cargar su estado de cuenta"
          cta="Ver cobranza"
          href={`${OPERADOR_BASE}/cobranza`}
        />
      )}
    </OpMain>
  );
}

function Cuenta({
  data,
  inicial,
}: {
  readonly data: DetalleClienteData;
  readonly inicial: CuentaCliente;
}) {
  const x = useCliente(inicial);
  const c = x.cuenta;
  return (
    <>
      <RecordarBoton onClick={() => x.setModal('recordar')} />
      <Heroe c={c} e={x.e} onAbonar={() => x.setModal('abono')} />
      <Indicadores c={c} e={x.e} dueno={data.dueno} />
      <Abiertas cuenta={c} e={x.e} />
      <Movimientos cuenta={c} e={x.e} />
      <Note bg={colors.yellowSoft} padding="14px 16px" textColor={colors.ink}>
        {limiteNota(c, x.e, data.dueno)}
      </Note>
      <Capas x={x} data={data} />
    </>
  );
}

function Capas({
  x,
  data,
}: {
  readonly x: ReturnType<typeof useCliente>;
  readonly data: DetalleClienteData;
}) {
  const c = x.cuenta;
  return (
    <>
      {x.modal === 'abono' ? (
        <RecibirAbono
          nombre={c.nombre}
          total={x.e.saldo}
          vista={(m) => vista(x.e, m)}
          variante="detalle"
          onClose={() => x.setModal(null)}
          onSave={x.registrar}
        />
      ) : null}
      {x.modal === 'recordar' ? (
        <Recordar
          telefono={c.telefono}
          mensaje={recordatorio(c, x.e, data.negocio)}
          onClose={() => x.setModal(null)}
        />
      ) : null}
      {x.toast ? (
        <Toast
          title="Abono registrado"
          body={x.toast}
          tint={colors.greenSoft}
          width={380}
          onClose={x.closeToast}
        />
      ) : null}
    </>
  );
}
