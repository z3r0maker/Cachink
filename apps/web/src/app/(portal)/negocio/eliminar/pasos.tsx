import { Lock, X } from 'lucide-react';

import type { EliminarData } from '@/server/cuenta/pagina';

import { fechaLarga } from '../../suscripcion/fecha';
import { DescargarTodo } from '../descargar-todo';
import * as s from './eliminar.css';

/** The first two cards of «Eliminar tu cuenta» (ElEliminar): download, and what happens. */
export function Cabeza(props: {
  readonly n: number;
  readonly titulo: string;
  readonly sub?: string;
}) {
  return (
    <div className={s.cabeza}>
      <span className={s.numero} aria-hidden="true">
        {props.n}
      </span>
      <span className={s.negocioTexto}>
        <h2 className={s.pasoTitulo}>{props.titulo}</h2>
        {props.sub ? <span className={s.sub}>{props.sub}</span> : null}
      </span>
    </div>
  );
}

export function Descarga({
  data,
  actual,
}: {
  readonly data: EliminarData;
  readonly actual: string;
}) {
  return (
    <section className={s.pasoFuerte} aria-label="Descarga tus datos">
      <Cabeza
        n={1}
        titulo="Descarga tus datos"
        sub="Un .zip por negocio: el Excel de ventas, gastos, productos, movimientos y empleados, y un JSON con todo. Es opcional."
      />
      {data.negocios.map((n) => (
        <div key={n.id} className={s.negocio} data-testid="eliminar-negocio">
          <span className={s.negocioTexto}>
            <span className={s.negocioNombre}>{n.nombre}</span>
            <span className={s.sub}>{n.plan}</span>
          </span>
          <DescargarTodo negocio={n.id === actual ? undefined : n.id} />
        </div>
      ))}
    </section>
  );
}

const BORRA = [
  'Ventas, gastos, inventario y estados financieros',
  'Clientes, empleados y operadores',
  'Catálogo, logo e importaciones',
  'Tu cuenta y tu acceso al portal',
];
const GUARDA = [
  'Facturas y pagos de tu suscripción (CFDI)',
  'Tu comprobante de cancelación y tus consentimientos',
  'Nombre, RFC y correo, para identificarlos',
];

function Lista(p: { readonly items: readonly string[]; readonly icono: 'x' | 'lock' }) {
  return p.items.map((t) => (
    <span key={t} className={s.item}>
      {p.icono === 'x' ? <X size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
      {t}
    </span>
  ));
}

export function QuePasa({ data }: { readonly data: EliminarData }) {
  return (
    <section className={s.paso} aria-label="Qué pasa al eliminar">
      <Cabeza n={2} titulo="Qué pasa al eliminar" />
      <div className={s.columnas}>
        <div className={s.columna}>
          <span className={s.cejaBorra}>Se borra el {fechaLarga(data.eraseAt)}</span>
          <Lista items={BORRA} icono="x" />
        </div>
        <div className={s.columnaGuarda}>
          <span className={s.cejaGuarda}>Se guarda 10 años, bloqueado</span>
          <Lista items={GUARDA} icono="lock" />
          <span className={s.sub}>
            Lo pide la ley a Xangarro (Código de Comercio art. 38, CFF art. 30). Nadie lo usa, y se
            borra solo al cumplir 10 años.
          </span>
        </div>
      </div>
      {data.planQueRenueva === null ? null : (
        <p className={s.plan} data-testid="eliminar-plan">
          Tu plan {data.planQueRenueva} ya no se renueva y no se te cobra más. No hay reembolso del
          periodo pagado. Si cancelas la eliminación, tu plan sigue igual.
        </p>
      )}
    </section>
  );
}
