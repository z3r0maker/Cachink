'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Don } from '@/components/don/don';

import { useDueno } from '../ui/use-dueno';
import { DialogoMostrador, DialogoTitulo } from '../ui/dialogo-mostrador';
import * as m from '../ui/mostrador.css';
import { Aviso, Motivos, Nip, Nota, type Motivo } from './cancelar-campos';
import * as c from './cancelar.css';
import { consecuencia } from './detalle/copy';
import type { VentaTurno } from './types';

export { MOTIVOS, type Motivo } from './cancelar-campos';

/**
 * Cancel a sale of the open turno (rule 6, OpCancelarVenta): a reason is
 * required, a note for the owner is optional, nothing is deleted. Rendered
 * only while a sale is chosen, so each opening starts clean.
 *
 * Design amendment (O-32): a linked register also asks for the operator's
 * NIP; the domain's CancelarTicketUseCase verifies it, the control against
 * cancelling cash sales on an unlocked caja. A refusal stays in the dialog.
 */
export function CancelarVenta(p: {
  readonly venta: VentaTurno;
  readonly conNip?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: Motivo, nip: string, nota: string) => Promise<string | null>;
}) {
  const f = useCancelar(p);
  const dueno = useDueno();
  const { venta } = p;
  return (
    <DialogoMostrador open onClose={p.onClose} width={540} alerta conDon>
      <div className={c.cuerpo}>
        <span className={c.don} aria-hidden="true">
          <Don pose="preocupado" size={104} />
        </span>
        <div className={c.titulos}>
          <DialogoTitulo className={c.titulo}>¿Cancelar la venta {venta.folio}?</DialogoTitulo>
          <p className={c.resumen}>
            <span className={c.monto}>{formatMoney(venta.monto)}</span> ·{' '}
            {venta.concepto.split(' · ').join(', ')} · {venta.metodo.toLowerCase()}
          </p>
        </div>
        <Motivos value={f.motivo} onChange={f.setMotivo} />
        <Nota value={f.nota} onChange={f.setNota} />
        {p.conNip ? <Nip value={f.nip} onChange={f.setNip} /> : null}
        <Aviso texto={consecuencia(venta.metodo, venta.monto, venta.cliente, dueno)} />
        {f.error ? <Aviso texto={f.error} error /> : null}
        <Pie f={f} onClose={p.onClose} />
      </div>
    </DialogoMostrador>
  );
}

function Pie({
  f,
  onClose,
}: {
  readonly f: ReturnType<typeof useCancelar>;
  readonly onClose: () => void;
}) {
  return (
    <div className={c.pie}>
      {f.pista ? <span className={c.pista}>{f.pista}</span> : null}
      <button type="button" className={m.boton.secundario} onClick={onClose}>
        Mejor no
      </button>
      <button
        type="button"
        className={m.boton.peligroLleno}
        disabled={f.pista !== null || f.enviando}
        onClick={f.confirmar}
      >
        {f.enviando ? 'Cancelando…' : 'Cancelar venta'}
      </button>
    </div>
  );
}

function useCancelar(p: Parameters<typeof CancelarVenta>[0]) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [nip, setNip] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const pista =
    motivo === null
      ? 'Elige un motivo para cancelar.'
      : p.conNip === true && !/^\d{4}$/.test(nip)
        ? 'Escribe tu NIP para cancelar.'
        : null;
  const confirmar = (): void => {
    if (motivo === null || pista !== null) return;
    setEnviando(true);
    setError(null);
    void p.onConfirm(motivo, nip, nota).then((e) => {
      setEnviando(false);
      if (e === null) return;
      setError(e);
      setNip('');
    });
  };
  return { motivo, setMotivo, nip, setNip, nota, setNota, error, enviando, pista, confirmar };
}
