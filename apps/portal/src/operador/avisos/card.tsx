'use client';

import Link from 'next/link';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as u from '../ui/ui.css';
import * as a from './avisos.css';
import * as r from './reply.css';
import type { Aviso, AvisoTono } from './types';

const TONO: Record<AvisoTono, string> = {
  alerta: colors.redSoft,
  dueno: colors.yellowSoft,
  atencion: colors.warningSoft,
  info: colors.blueSoft,
  hecho: colors.greenSoft,
};

/** Phrases so the operator can answer without typing, with a queue waiting. */
const SUGERENCIAS = ['Di cambio de más', 'Cobré y no capturé', 'Salió un vale', 'No sé qué pasó'];

export interface AvisoCardProps {
  readonly aviso: Aviso;
  readonly draft: string;
  readonly onDraft: (text: string) => void;
  readonly onSend: () => void;
  readonly onRead: () => void;
}

export function AvisoCard({ aviso, draft, onDraft, onSend, onRead }: AvisoCardProps) {
  const canReply = aviso.responder !== undefined && !aviso.respuesta;
  return (
    <article className={a.card} data-read={aviso.leido ? '' : undefined}>
      <div className={a.head} style={{ background: TONO[aviso.tono] }}>
        <span className={a.headIcon}>
          <Icon path={aviso.icono} size={18} strokeWidth={2.4} />
        </span>
        <span className={a.kind}>{aviso.tipo}</span>
        {aviso.leido ? null : <span className={a.unread}>Sin leer</span>}
        <span className={a.time}>{aviso.hora}</span>
      </div>
      <div className={a.body}>
        <div className={a.title}>{aviso.titulo}</div>
        <div className={a.text}>{aviso.cuerpo}</div>
        {aviso.respuesta ? (
          <div className={r.replied}>
            <div className={a.kind}>Tu respuesta</div>
            <div className={r.repliedText}>«{aviso.respuesta}»</div>
          </div>
        ) : null}
        {canReply ? <Reply id={aviso.id} draft={draft} onDraft={onDraft} /> : null}
        <Buttons
          aviso={aviso}
          canReply={canReply}
          canSend={draft.trim().length > 3}
          onSend={onSend}
          onRead={onRead}
        />
      </div>
    </article>
  );
}

function Reply({
  id,
  draft,
  onDraft,
}: {
  readonly id: string;
  readonly draft: string;
  readonly onDraft: (t: string) => void;
}) {
  const inputId = `respuesta-${id}`;
  return (
    <div className={r.reply}>
      <label htmlFor={inputId} className={u.eyebrow}>
        Tu respuesta
      </label>
      <input
        id={inputId}
        className={r.input}
        type="text"
        placeholder="Cuéntale qué pasó, con tus palabras"
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
      />
      <div className={r.suggestions}>
        {SUGERENCIAS.map((s) => (
          <button key={s} type="button" className={r.suggestion} onClick={() => onDraft(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Buttons(props: {
  readonly aviso: Aviso;
  readonly canReply: boolean;
  readonly canSend: boolean;
  readonly onSend: () => void;
  readonly onRead: () => void;
}) {
  const { aviso, canReply, canSend } = props;
  return (
    <div className={a.buttons}>
      {canReply ? (
        <button
          type="button"
          className={a.send}
          style={{ background: canSend ? colors.yellow : colors.gray100 }}
          disabled={!canSend}
          onClick={props.onSend}
          data-onyellow=""
        >
          Enviar respuesta
        </button>
      ) : null}
      {aviso.cta ? (
        <Link href={aviso.cta.href} className={a.link}>
          {aviso.cta.label}
        </Link>
      ) : null}
      {aviso.leido ? null : (
        <button type="button" className={a.markRead} onClick={props.onRead}>
          Marcar leído
        </button>
      )}
    </div>
  );
}
