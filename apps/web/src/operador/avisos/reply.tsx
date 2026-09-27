'use client';

import { Icon } from '../../shell/icon';
import * as p from '../ui/panel.css';
import * as r from './reply.css';
import { aDueno } from './vivo';

/** Quick answers: a short label, the sentence it writes for the operator. */
const RAPIDAS: readonly (readonly [string, string])[] = [
  ['Di cambio de más', 'Creo que di cambio de más a un cliente.'],
  ['Cobré y no capturé', 'Cobré una venta y no la capturé en la caja.'],
  ['Salió un vale', 'Salió un vale de la caja y no lo registré como gasto.'],
  ['No sé qué pasó', 'No sé qué pasó, no recuerdo nada fuera de lo normal.'],
];

const ENVIAR =
  'M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11zM21.85 2.15 10.91 13.09';

export interface ReplyProps {
  readonly id: string;
  readonly dueno: string;
  readonly draft: string;
  readonly onDraft: (text: string) => void;
  readonly onSend: () => void;
  /** Present while the message is unread. */
  readonly onRead?: () => void;
}

/** «Tu respuesta»: a note, the quick answers, and send. */
export function Reply({ id, dueno, draft, onDraft, onSend, onRead }: ReplyProps) {
  const inputId = `respuesta-${id}`;
  return (
    <div className={r.reply}>
      <label htmlFor={inputId} className={r.label}>
        Tu respuesta
      </label>
      <textarea
        id={inputId}
        className={r.input}
        rows={3}
        placeholder={`Cuéntale ${aDueno(dueno)} lo que recuerdas`}
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
      />
      <Rapidas draft={draft} onDraft={onDraft} />
      <div className={p.pageHead} style={{ alignItems: 'center', marginTop: 4 }}>
        <button
          type="button"
          className={`${p.primaryBtn} ${r.enviar}`}
          disabled={draft.trim().length <= 3}
          onClick={onSend}
        >
          <Icon path={ENVIAR} size={18} strokeWidth={2.2} />
          Enviar respuesta
        </button>
        {onRead ? (
          <button type="button" className={p.quietBtn} style={{ height: 52 }} onClick={onRead}>
            Marcar leído
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Rapidas({
  draft,
  onDraft,
}: {
  readonly draft: string;
  readonly onDraft: (text: string) => void;
}) {
  return (
    <div className={r.rapidas}>
      <span className={r.rapidasLabel}>Respuestas rápidas:</span>
      {RAPIDAS.map(([label, texto]) => (
        <button
          key={label}
          type="button"
          className={r.rapida}
          aria-pressed={draft === texto}
          onClick={() => onDraft(texto)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** What was sent, in green, where the form was. */
export function Enviada({ dueno, texto }: { readonly dueno: string; readonly texto: string }) {
  return (
    <div className={r.enviado}>
      <span className={r.enviadoTitle}>{`Le mandaste tu respuesta ${aDueno(dueno)}`}</span>
      <span className={r.enviadoText}>“{texto}”</span>
      <span className={r.enviadoNota}>Si te contesta, lo ves aquí mismo.</span>
    </div>
  );
}
