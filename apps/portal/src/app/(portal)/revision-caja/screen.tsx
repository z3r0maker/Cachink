'use client';

import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { EmptyState, KpiCard, kpiGrid, SegmentedTabs } from '@/components';
import { Toast } from '@/operador/ui/toast';
import { Icon } from '@/shell/icon';

import { RevisarCliente } from './cliente';
import { fiadoSinLimite } from './derive';
import { Fila } from './fila';
import { RevisarProducto } from './producto';
import * as s from './revision.css';
import type { Pestana, RevisionData } from './types';
import { useRevision, type Revision } from './use-revision';

const INFO = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v.01M12 11v5';

/** Dueño · Revisión de caja: what operators created at the counter, to approve, merge or reject. */
export function RevisionScreen({
  data,
  tab,
}: {
  readonly data: RevisionData;
  readonly tab: Pestana;
}) {
  const r = useRevision(data, tab);
  return (
    <>
      <div>
        <h1 className={s.pageTitle}>Revisión de caja</h1>
        <p className={s.pageSubtitle}>
          Lo que tus operadores crearon en el mostrador para no detener la venta. Apruébalo,
          corrígelo o fusiónalo con lo que ya existe.
        </p>
      </div>
      <Kpis r={r} data={data} />
      <div>
        <SegmentedTabs
          ariaLabel="Revisión de caja"
          value={r.tab}
          onValueChange={(v) => r.cambiarTab(v === 'clientes' ? 'clientes' : 'productos')}
          tabs={[
            { value: 'productos', label: 'Productos', count: r.productos.length },
            { value: 'clientes', label: 'Clientes fiados', count: r.clientes.length },
          ]}
        />
      </div>
      <Lista r={r} />
      <Nota />
      <Capas r={r} />
    </>
  );
}

/** Why the inbox matters, and where the permission to create at the counter lives. */
function Nota() {
  return (
    <div className={s.nota}>
      <span style={{ flex: 'none', marginTop: 1, display: 'grid' }}>
        <Icon path={INFO} size={21} strokeWidth={2.4} />
      </span>
      <div>
        Mientras no lo revises, el producto se vende sin costo y no calcula margen, y el cliente
        fiado no tiene límite. Puedes quitarle el permiso de crear en caja a un operador desde{' '}
        <Link href="/equipo?tab=operadores" className={s.enlace}>
          Operadores y dispositivos
        </Link>
        .
      </div>
    </div>
  );
}

function Kpis({ r, data }: { readonly r: Revision; readonly data: RevisionData }) {
  const fiado = fiadoSinLimite(r.clientes);
  return (
    <div className={kpiGrid}>
      <KpiCard
        label="Por revisar"
        value={String(r.productos.length + r.clientes.length)}
        tone="warning"
        hint="Productos y clientes creados en el mostrador"
      />
      <KpiCard
        label="Vendido sin costo"
        value={formatMoney(data.vendidoSinCosto)}
        tone="negative"
        hint="No calcula margen hasta que pongas costo"
      />
      <KpiCard label="Fiado sin límite" value={formatMoney(fiado.monto)} hint={fiado.hint} />
    </div>
  );
}

function Lista({ r }: { readonly r: Revision }) {
  const items = r.tab === 'productos' ? r.productos : r.clientes;
  if (items.length === 0) {
    return r.tab === 'productos' ? (
      <EmptyState
        title="Nada por revisar en productos"
        body="Todo lo que tus operadores crearon en caja ya tiene costo, categoría y existencias."
      />
    ) : (
      <EmptyState
        title="Nada por revisar en clientes"
        body="Todos los clientes fiados tienen límite y plazo definidos por ti."
      />
    );
  }
  return (
    <div className={s.lista}>
      {items.map((x) => (
        <Fila key={x.id} x={x} onRevisar={() => r.setSel(x.id)} onRechazar={() => r.rechazar(x)} />
      ))}
    </div>
  );
}

/** The open review and the last toast. */
function Capas({ r }: { readonly r: Revision }) {
  const producto = r.productos.find((p) => p.id === r.sel);
  const cliente = r.clientes.find((c) => c.id === r.sel);
  const cerrar = () => r.setSel(null);
  return (
    <>
      {producto ? (
        <RevisarProducto
          x={producto}
          onClose={cerrar}
          onFusionar={() => r.fusionar(producto)}
          onAprobar={(b) => r.aprobar(producto.id, b, 'Producto aprobado')}
        />
      ) : null}
      {cliente ? (
        <RevisarCliente
          x={cliente}
          onClose={cerrar}
          onFusionar={() => r.fusionar(cliente)}
          onAprobar={(b) => r.aprobar(cliente.id, b, 'Cliente aprobado')}
        />
      ) : null}
      {r.aviso ? (
        <Toast
          title={r.aviso.title}
          body={r.aviso.body}
          tint={r.aviso.tint}
          check={colors.black}
          width={380}
          onClose={r.cerrarAviso}
        />
      ) : null}
    </>
  );
}
