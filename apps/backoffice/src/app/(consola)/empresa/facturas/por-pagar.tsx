'use client';

import { useRef, useState } from 'react';

import type { FilaFactura, PorPagarDestino } from '@/server/empresa/facturas-view';
import * as mf from '@/styles/mostrador-facturas.css';
import * as p from '@/styles/mostrador-facturas-paneles.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Celdas, COLUMNAS } from './celdas';
import { PanelCancelar, PanelPago } from './por-pagar-paneles';

/**
 * An invoice on credit still owed (owner decision 9): «Registrar pago» and
 * «Cancelar» each open their panel under the row (boards CD-06e and CD-06f),
 * and «No, regresar» closes it and puts the focus back on its button.
 */
type Abierto = 'pago' | 'cancelar' | null;

interface Props {
  readonly f: FilaFactura;
  readonly destino: PorPagarDestino;
  readonly hoy: string;
  readonly mes: string;
}

function Acciones({
  proveedor,
  abrir,
  volverA,
}: {
  readonly proveedor: string;
  readonly abrir: (a: 'pago' | 'cancelar') => void;
  readonly volverA: React.RefObject<Abierto>;
}) {
  const enfocar = (a: Abierto) => (el: HTMLButtonElement | null) => {
    if (el !== null && volverA.current === a) {
      el.focus();
      volverA.current = null;
    }
  };
  return (
    <>
      <button
        ref={enfocar('pago')}
        className={m.boton.primario}
        type="button"
        aria-label={`Registrar pago a ${proveedor}`}
        onClick={() => abrir('pago')}
      >
        Registrar pago
      </button>
      <button
        ref={enfocar('cancelar')}
        className={m.boton.secundario}
        type="button"
        aria-label={`Cancelar la factura de ${proveedor}`}
        onClick={() => abrir('cancelar')}
      >
        Cancelar
      </button>
    </>
  );
}

export function FilaPorPagar({ f, destino, hoy, mes }: Props) {
  const [abierto, setAbierto] = useState<Abierto>(null);
  const volverA = useRef<Abierto>(null);
  const regresar = () => {
    volverA.current = abierto;
    setAbierto(null);
  };
  const panel = { destino, proveedor: f.proveedor, mes, onRegresar: regresar };
  return (
    <>
      <tr className={abierto === null ? d.rowOpen : p.filaAbierta} data-testid="factura-recibida">
        <Celdas f={f} />
        <td className={d.td}>
          <div className={mf.porPagar}>
            <span className={`${m.tagBase} ${mf.tono.aviso}`}>Por pagar</span>
            {abierto === null ? (
              <Acciones proveedor={f.proveedor} abrir={setAbierto} volverA={volverA} />
            ) : null}
          </div>
        </td>
      </tr>
      {abierto === null ? null : (
        <tr className={p.filaAbierta}>
          <td className={p.celdaPanel} colSpan={COLUMNAS}>
            {abierto === 'pago' ? <PanelPago {...panel} hoy={hoy} /> : <PanelCancelar {...panel} />}
          </td>
        </tr>
      )}
    </>
  );
}
