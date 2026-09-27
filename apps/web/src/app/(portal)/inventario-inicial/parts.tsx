'use client';

import { useRouter } from 'next/navigation';

import { EmptyState } from '@/components';

import { Aviso } from '../_primeros/aviso';
import { Encabezado } from '../_primeros/encabezado';
import * as p from '../_primeros/primeros.css';
import { Barra, Cabecera, Pie } from './barra';
import { Capturado, SUBTITULO } from './capturado';
import { Resumen } from './resumen';
import { TablaFilas } from './tabla';
import { useInventario, type Inventario, type ProductoGrid } from './use-inventario';

export type { ProductoGrid };

/**
 * «Inventario inicial» (N-17, `CfgInventarioInicial.dc.html`): one-time. The
 * grid writes apertura movements (excluded from the monthly limit, feeding
 * the opening Balance's inventory line). A second visit shows the done
 * state, never a re-capture.
 */
export interface InventarioView {
  readonly mayWrite: boolean;
  readonly yaCapturado: boolean;
  readonly hoy: string;
  readonly productos: readonly ProductoGrid[];
}

export function InventarioInicialScreen(view: InventarioView) {
  const inv = useInventario(view.productos, view.hoy);
  // The capture's own revalidation re-renders this with `yaCapturado`; the
  // confirmation must survive that swap, so the done state carries it.
  if (view.yaCapturado) {
    return <Capturado confirmacion={inv.aviso?.tono === 'success' ? inv.aviso.texto : null} />;
  }
  if (view.productos.length === 0) return <SinProductos />;
  return (
    <>
      <Encabezado aqui="Inventario inicial" titulo="Inventario inicial" subtitulo={SUBTITULO} />
      <div className={p.dosColumnas}>
        <Trabajo inv={inv} view={view} />
        <Resumen
          total={inv.total}
          fecha={inv.fecha}
          contados={inv.validas.length}
          productos={inv.filas.length}
          mayWrite={view.mayWrite}
          pendiente={inv.pendiente}
          onGuardar={inv.capturar}
        />
      </div>
    </>
  );
}

function Trabajo({ inv, view }: { readonly inv: Inventario; readonly view: InventarioView }) {
  return (
    <div className={p.columna}>
      <Barra
        fecha={inv.fecha}
        hoy={view.hoy}
        editable={view.mayWrite}
        onFecha={inv.setFecha}
        onArchivo={(f) => void inv.alArchivo(f)}
      />
      {inv.aviso !== null ? (
        <Aviso tono={inv.aviso.tono} onCerrar={() => inv.setAviso(null)}>
          {inv.aviso.texto}
        </Aviso>
      ) : null}
      <section className={p.panel} aria-label="Productos a contar">
        <Cabecera />
        <TablaFilas filas={inv.filas} editable={view.mayWrite} setFilas={inv.setFilas} />
        <Pie total={inv.total} />
      </section>
    </div>
  );
}

function SinProductos() {
  const router = useRouter();
  return (
    <>
      <Encabezado aqui="Inventario inicial" titulo="Inventario inicial" subtitulo={SUBTITULO} />
      <EmptyState
        title="Primero agrega tus productos"
        body="El inventario inicial se cuenta sobre tu catálogo. Agrégalos uno por uno o impórtalos desde Excel."
        action={{
          label: 'Importar productos',
          onClick: () => router.push('/importar?plantilla=productos'),
        }}
      />
    </>
  );
}
