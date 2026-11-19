/**
 * «Cancelar venta» (MvVentas, rule 6; RvCancelar, M2): a reason is required,
 * nothing is deleted — the ticket stays, marked. The operator's NIP first,
 * checked with their permission as soon as the fourth digit lands, so a
 * refusal stops there; then the board's dialog (in `venta-cancelar-partes`),
 * and for a cash sale the cash it hands back, said only once the cancel is
 * allowed. The write itself is the caller's (the ticket use case).
 */
import { useState, type ReactElement } from 'react';
import type { VentaTurno } from '@xangarro/caja/ventas';
import { Modal } from '../../components/index';
import { CashConfirmStep, PinStep } from '../Cancelaciones/cancellation-steps';
import type { VerificacionCancelar } from './cancelar-con-nip';
import { Aviso, MotivoStep, SinPermiso } from './venta-cancelar-partes';

export interface CancelarVentaDialogProps {
  readonly venta: VentaTurno;
  /** The owner's name for the consequence line; «el dueño» until the phone knows it. */
  readonly dueno?: string;
  readonly onClose: () => void;
  /**
   * Checks the NIP and the permission before anything else (M2): null when
   * the cancel may go on. Without it the check waits for the write.
   */
  readonly onVerificar?: (pin: string) => Promise<VerificacionCancelar>;
  /**
   * Cancels through `CancelarTicketUseCase`. Resolves the sentence that says
   * what went wrong (null when it went through); the dialog closes itself.
   */
  readonly onConfirm: (motivo: string, pin: string) => Promise<string | null>;
}

type Step = 'pin' | 'sin-permiso' | 'motivo' | 'efectivo';

/** The NIP step: checked at once when the caller can; a refusal clears it. */
function useNip(p: CancelarVentaDialogProps, irA: (s: Step) => void) {
  const [pin, setPin] = useState('');
  const [intento, setIntento] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const fallo = (texto: string): void => {
    setError(texto);
    setIntento((n) => n + 1);
    irA('pin');
  };
  const alPaso = async (nip: string): Promise<void> => {
    setError(null);
    setVerificando(true);
    const r = p.onVerificar ? await p.onVerificar(nip).catch(() => null) : null;
    setVerificando(false);
    if (r !== null && r.sinPermiso) return irA('sin-permiso');
    if (r !== null) return fallo(r.texto);
    setPin(nip);
    irA('motivo');
  };
  return { pin, intento, error, verificando, alPaso, fallo };
}

/** NIP → motivo (→ the cash a cash sale hands back) → through; a refusal starts over. */
function usePasos(p: CancelarVentaDialogProps) {
  const [step, setStep] = useState<Step>('pin');
  const [motivo, setMotivo] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const nip = useNip(p, setStep);
  const confirmar = (): void => {
    if (motivo === null || enviando) return;
    if (p.venta.metodo === 'Efectivo' && step === 'motivo') return setStep('efectivo');
    const completo = nota.trim() === '' ? motivo : `${motivo}: ${nota.trim()}`;
    setEnviando(true);
    void p
      .onConfirm(completo, nip.pin)
      .then((e) => {
        setEnviando(false);
        // `!= null` also catches undefined (a missing return), and String()
        // keeps whatever a caller resolves renderable.
        if (e != null) nip.fallo(String(e));
      })
      .catch(() => {
        setEnviando(false);
        nip.fallo('No se pudo cancelar. Inténtalo de nuevo.');
      });
  };
  return { step, motivo, nota, enviando, nip, setMotivo, setNota, confirmar };
}

export function CancelarVentaDialog(p: CancelarVentaDialogProps): ReactElement {
  const f = usePasos(p);
  const dueno = p.dueno ?? 'el dueño';
  return (
    <Modal
      open
      onClose={p.onClose}
      title={`Cancelar venta ${p.venta.folio}`}
      testID="venta-cancelar"
    >
      {f.step === 'pin' ? (
        <PinStep key={f.nip.intento} onSubmit={(nip) => void f.nip.alPaso(nip)} />
      ) : f.step === 'sin-permiso' ? (
        <SinPermiso dueno={dueno} onEntendido={p.onClose} />
      ) : f.step === 'efectivo' ? (
        <CashConfirmStep amount={p.venta.monto} onConfirm={f.confirmar} submitting={f.enviando} />
      ) : (
        <MotivoStep
          venta={p.venta}
          dueno={dueno}
          motivo={f.motivo}
          nota={f.nota}
          enviando={f.enviando}
          onMotivo={f.setMotivo}
          onNota={f.setNota}
          onCancelar={f.confirmar}
          onVolver={p.onClose}
        />
      )}
      {f.nip.error ? <Aviso texto={f.nip.error} error /> : null}
    </Modal>
  );
}
