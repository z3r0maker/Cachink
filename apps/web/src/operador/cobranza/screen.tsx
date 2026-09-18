'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { ICONS } from '../shell/nav';
import { FilterChips, SearchBox, SinResultados } from '../ui/filters';
import * as fc from '../ui/filters.css';
import { KpiRow, OpMain } from '../ui/parts';
import * as t from '../ui/title.css';
import { Toast } from '../ui/toast';
import * as u from '../ui/ui.css';
import { RecibirAbono } from './abono';
import { AbonosHoy } from './abonos-hoy';
import * as c from './cobranza.css';
import { vistaAbono } from './cliente/abono';
import { estadoCuenta } from './cliente/derive';
import { abonosDeHoy, filtrar, resumen, saldo } from './derive';
import { Tarjeta } from './tarjeta';
import type { CobranzaScreenProps } from './types';
import { useCobranza, type Cobranza } from './use-cobranza';

const FILTROS = ['Todos', 'Con saldo', 'Atrasados'] as const;

/** Operador · Cobranza: who owes, abonos from the oldest ticket, and today's abonos. */
export function CobranzaScreen({ state, data }: CobranzaScreenProps) {
  const x = useCobranza(data);
  return (
    <OpMain top={22}>
      <NuevaVenta />
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Cobranza</h1>
        <span className={t.pageSub}>Quién debe y quién abonó en tu turno</span>
      </div>
      <Kpis x={x} />
      <div className={fc.bar}>
        <SearchBox
          label="Buscar cliente"
          placeholder="Buscar cliente por nombre o teléfono"
          value={x.query}
          onChange={x.setQuery}
        />
        <FilterChips options={FILTROS} value={x.filtro} onChange={x.setFiltro} />
      </div>
      {state === 'happy' ? (
        <Cuerpo x={x} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={ICONS.cobranza}
          emptyTitle="Nadie te debe nada"
          emptyBody="Cuando cobres una venta fiada, el cliente aparece aquí con su saldo y podrás recibirle abonos."
          errorTitle="No pudimos cargar tu cobranza"
        />
      )}
      <Capas x={x} />
    </OpMain>
  );
}

function Kpis({ x }: { readonly x: Cobranza }) {
  const r = resumen(x.cuentas, x.hoy);
  return (
    <KpiRow
      min={220}
      valueSize={32}
      items={[
        {
          label: 'Por cobrar',
          value: formatMoney(r.porCobrar),
          color: colors.black,
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
          hint: 'Entró a tu caja y cuenta al cerrar',
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
          <Tarjeta key={cl.id} x={cl} onAbonar={() => x.setSel(cl.id)} />
        ))}
      </div>
      {visibles.length === 0 ? (
        <div className={u.listCard}>
          <SinResultados body="Ningún cliente coincide con lo que buscas." />
        </div>
      ) : null}
      <AbonosHoy abonos={abonosDeHoy(x.cuentas, x.hoy)} />
    </>
  );
}

function Capas({ x }: { readonly x: Cobranza }) {
  const cl = x.cliente;
  return (
    <>
      {cl ? (
        <RecibirAbono
          nombre={cl.nombre}
          total={saldo(cl)}
          vista={(m) => vistaAbono(cl, estadoCuenta(cl), m, true)}
          variante="cobranza"
          onClose={() => x.setSel(null)}
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
