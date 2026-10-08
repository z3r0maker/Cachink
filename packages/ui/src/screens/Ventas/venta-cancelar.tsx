/**
 * «Cancelar venta» (MvVentas, rule 6): a reason is required, nothing is
 * deleted — the ticket stays, marked. The phone's established steps (the
 * Cancelaciones flow, M-05): the operator's PIN first, then the board's
 * dialog (in `venta-cancelar-partes`), and for a cash sale the cash it hands
 * back before it goes through. The write itself is the caller's (the ticket
 * use case).
 */
import { useState, type ReactElement } from 'react';
import type { VentaTurno } from '@xangarro/caja/ventas';
import { Modal } from '../../components/index';
import { CashConfirmStep, PinStep } from '../Cancelaciones/cancellation-steps';
import { Aviso, MotivoStep } from './venta-cancelar-partes';

export interface CancelarVentaDialogProps {
  readonly venta: VentaTurno;
  /** The owner's name for the consequence line; «Pedro» until the phone knows it. */
  readonly dueno?: string;
  readonly onClose: () => void;
  /**
   * Cancels through `CancelarTicketUseCase`. Resolves the sentence that says
   * what went wrong (null when it went through); the dialog closes itself.
   */
  readonly onConfirm: (motivo: string, pin: string) => Promise<string | null>;
}

type Step = 'pin' | 'motivo' | 'efectivo';

/** PIN → motivo (→ the cash a cash sale hands back) → through; a refusal starts over. */
function usePasos(p: CancelarVentaDialogProps) {
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [motivo, setMotivo] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const alPaso = (nip: string): void => {
    setPin(nip);
    setError(null);
    setStep('motivo');
  };
  const confirmar = (): void => {
    if (motivo === null || enviando) return;
    if (p.venta.metodo === 'Efectivo' && step === 'motivo') {
      setStep('efectivo');
      return;
    }
    const completo = nota.trim() === '' ? motivo : `${motivo}: ${nota.trim()}`;
    setEnviando(true);
    void p
      .onConfirm(completo, pin)
      .then((e) => {
        setEnviando(false);
        if (e != null) {
          // `!= null` also catches undefined (a missing return), and
          // String() keeps whatever a caller resolves renderable.
          setError(String(e));
          setStep('pin');
        }
      })
      .catch(() => {
        setEnviando(false);
        setError('No se pudo cancelar. Inténtalo de nuevo.');
        setStep('pin');
      });
  };
  return { step, motivo, nota, error, enviando, alPaso, setMotivo, setNota, confirmar };
}

export function CancelarVentaDialog(p: CancelarVentaDialogProps): ReactElement {
  const f = usePasos(p);
  return (
    <Modal
      open
      onClose={p.onClose}
      title={`Cancelar venta ${p.venta.folio}`}
      testID="venta-cancelar"
    >
      {f.step === 'pin' ? (
        <PinStep onSubmit={f.alPaso} />
      ) : f.step === 'efectivo' ? (
        <CashConfirmStep amount={p.venta.monto} onConfirm={f.confirmar} submitting={f.enviando} />
      ) : (
        <MotivoStep
          venta={p.venta}
          dueno={p.dueno ?? 'Pedro'}
          motivo={f.motivo}
          nota={f.nota}
          enviando={f.enviando}
          onMotivo={f.setMotivo}
          onNota={f.setNota}
          onCancelar={f.confirmar}
          onVolver={p.onClose}
        />
      )}
      {f.error ? <Aviso texto={f.error} error /> : null}
    </Modal>
  );
}
