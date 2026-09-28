'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { ICONS } from '@xangarro/caja';
import { SinResultados } from '../ui/filters';
import { OpMain } from '../ui/parts';
import { Buscador, Filtros, Resumenes } from '../ui/resumen';
import * as t from '../ui/title.css';
import { Toast } from '../ui/toast';
import { AbonosHoy } from './abonos-hoy';
import * as c from './cobranza.css';
import { CuentaLateral } from './cuenta';
import { abonosDeHoy, filtrar, resumen, type CobranzaScreenProps } from '@xangarro/caja/cobranza';
import { Tarjeta } from './tarjeta';
import { useCobranza, type Cobranza } from './use-cobranza';

const FILTROS = ['Todos', 'Con saldo', 'Atrasados'] as const;

/** Operador · Fiado y abonos: who owes, the account in a side panel, and today's abonos. */
export function CobranzaScreen({ state, data }: CobranzaScreenProps) {
  const x = useCobranza(data);
  const modo = x.cargando ? 'loading' : state;
  return (
    <OpMain top={24}>
      <NuevaVenta />
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Fiado y abonos</h1>
        <span className={t.pageSub}>Quién te debe y quién ya abonó</span>
      </div>
      <Kpis x={x} />
      <div className={c.barra}>
        <Buscador
          label="Buscar cliente"
          placeholder="Busca por nombre o teléfono"
          value={x.query}
          onChange={x.setQuery}
        />
        <Filtros
          label="Filtrar clientes"
          options={FILTROS}
          value={x.filtro}
          onChange={x.setFiltro}
        />
      </div>
      {modo === 'happy' ? (
        <Cuerpo x={x} />
      ) : (
        <OperadorEstado
          mode={modo}
          icon={ICONS.cobranza}
          emptyTitle="Nadie te debe nada"
          emptyBody="Cuando cobres una venta fiada, el cliente aparece aquí con su saldo y podrás recibirle abonos."
          errorTitle="No pudimos cargar el fiado"
        />
      )}
      <Capas x={x} negocio={data.negocio} />
    </OpMain>
  );
}

function Kpis({ x }: { readonly x: Cobranza }) {
  const r = resumen(x.cuentas, x.hoy);
  return (
    <Resumenes
      label="Resumen de fiado"
      items={[
        {
          label: 'Por cobrar',
          value: formatMoney(r.porCobrar),
          color: colors.warningText,
          hint: r.conSaldo,
        },
        {
          label: 'Abonos de hoy',
          value: formatMoney(r.abonado),
          color: colors.greenText,
          hint: r.recibidos,
        },
        {
          label: 'En efectivo',
          value: formatMoney(r.efectivo),
          color: colors.black,
          hint: 'Entró a tu caja y se cuenta al cerrar',
        },
      ]}
    />
  );
}

function Cuerpo({ x }: { readonly x: Cobranza }) {
  const visibles = filtrar(x.cuentas, x.filtro, x.query);
  return (
    <>
      <div className={c.cards}>
        {visibles.map((cl) => (
          <Tarjeta
            key={cl.id}
            x={cl}
            abierta={x.cliente?.id === cl.id}
            onAbonar={() => x.abrir(cl.id, true)}
            onVer={() => x.abrir(cl.id)}
          />
        ))}
      </div>
      {visibles.length === 0 ? (
        <div className={c.hoy}>
          <SinResultados body="No hay clientes con ese filtro." />
        </div>
      ) : null}
      <AbonosHoy abonos={abonosDeHoy(x.cuentas, x.hoy)} />
    </>
  );
}

function Capas({ x, negocio }: { readonly x: Cobranza; readonly negocio: string }) {
  const cl = x.cliente;
  return (
    <>
      {cl ? (
        <CuentaLateral
          key={cl.id}
          c={cl}
          negocio={negocio}
          foco={x.abonar}
          recordar={x.recordar}
          setRecordar={x.setRecordar}
          onClose={() => x.abrir(null)}
          onSave={x.registrar}
        />
      ) : null}
      {x.toast ? (
        <Toast
          title="Abono registrado"
          body={x.toast}
          tint={colors.greenSoft}
          width={360}
          onClose={x.closeToast}
        />
      ) : null}
    </>
  );
}
