'use client';

import { useState } from 'react';
import { colors } from '@xangarro/tokens';

import * as h from '../shell/actions.css';
import * as hh from '../shell/header.css';
import { HeaderAction } from '../shell/shell';
import { OpMain } from '../ui/parts';
import * as c from './catalogo.css';
import { useAtajosCaja } from './atajos';
import { Catalogo } from './catalogo';
import { NuevoProducto } from './nuevo';
import type { Comprobante } from './receipt';
import { Share } from './share';
import { TicketBar, TicketPanel } from './ticket-panel';
import type { CajaScreenProps, Producto } from './types';
import { useCaja } from './use-caja';
import { VentaHechaCard } from './venta-hecha';

/**
 * Operador · Cobrar, the screen that defines the rest (README §4, ADR-107):
 * catalogue first, the ticket always in reach, checkout inside the ticket, and
 * the change due left in the corner after the sale.
 */
export function CajaScreen({ state, data, paso, nuevoCliente = true }: CajaScreenProps) {
  const caja = useCaja(data, paso);
  useAtajosCaja(caja);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [compartir, setCompartir] = useState<Comprobante | null>(null);
  const comprobante = () => {
    const venta = caja.toast.venta;
    if (venta) setCompartir({ negocio: data.negocio, folio: data.siguienteFolio, venta });
    caja.toast.dismiss();
  };
  const agregar = (p: Producto) => {
    caja.add(p);
    setNuevoOpen(false);
  };
  return (
    <OpMain top={22} caja>
      <VentasDelTurno n={data.ventasTurno} />
      <div className={c.layout} data-cobrando={enPaso(caja.paso) ? '' : undefined}>
        <Catalogo caja={caja} state={state} onNuevo={() => setNuevoOpen(true)} />
        <TicketPanel caja={caja} data={data} permitirNuevo={nuevoCliente} />
      </div>
      <TicketBar caja={caja} />
      <NuevoProducto open={nuevoOpen} onClose={() => setNuevoOpen(false)} onAdd={agregar} />
      <VentaHechaCard caja={caja} onComprobante={comprobante} />
      <Share
        key={compartir ? 'open' : 'closed'}
        comprobante={compartir}
        onClose={() => setCompartir(null)}
      />
    </OpMain>
  );
}

/** While cash or fiado is being taken, the catalogue steps back. */
const enPaso = (paso: CajaScreenProps['paso']): boolean =>
  paso === 'efectivo' || paso === 'credito';

/** Caja's header shows the turno's sale count where other screens show the bell. */
function VentasDelTurno({ n }: { readonly n: number }) {
  return (
    <HeaderAction>
      <div className={h.stat}>
        <span className={hh.syncLabel} style={{ color: colors.gray600 }}>
          Ventas del turno
        </span>
        <span className={h.statValue}>{n}</span>
      </div>
    </HeaderAction>
  );
}
