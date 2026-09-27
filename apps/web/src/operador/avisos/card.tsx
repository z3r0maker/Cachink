'use client';

import Link from 'next/link';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as p from '../ui/panel.css';
import * as a from './avisos.css';
import { Enviada, Reply } from './reply';
import type { Aviso } from './types';

export interface AvisoCardProps {
  readonly aviso: Aviso;
  readonly dueno: string;
  readonly draft: string;
  readonly onDraft: (text: string) => void;
  readonly onSend: () => void;
  readonly onRead: () => void;
}

/** Money inside a sentence, bold (and red on an alert). */
export function ConCifras({ text, rojo }: { readonly text: string; readonly rojo?: boolean }) {
  const style = rojo ? { color: colors.redText } : undefined;
  return (
    <>
      {text.split(/(\$[\d,]+\.\d{2})/).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={a.cifra} style={style}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** A message from the owner: the strip says who and whether it was read. */
export function AvisoCard(props: AvisoCardProps) {
  const { aviso } = props;
  const strong = aviso.responder !== undefined || aviso.tono === 'alerta';
  const estadoColor = aviso.leido
    ? colors.gray600
    : aviso.tono === 'alerta'
      ? colors.redText
      : colors.warningText;
  const stripBg = strong ? (aviso.leido ? colors.gray100 : colors.redSoft) : undefined;
  return (
    <article
      aria-labelledby={`av-${aviso.id}`}
      className={strong ? `${a.card} ${a.cardStrong}` : a.card}
    >
      <div
        className={strong ? `${a.strip} ${a.stripStrong}` : a.strip}
        style={stripBg ? { background: stripBg } : undefined}
      >
        <span className={a.avatar}>
          <Icon path={aviso.icono} size={15} strokeWidth={2.4} />
        </span>
        <span className={a.de}>{aviso.tipo}</span>
        <span className={a.de} style={{ color: estadoColor }}>
          · {aviso.leido ? 'Leído' : 'Sin leer'}
        </span>
        <span className={a.hora}>{aviso.hora}</span>
      </div>
      {strong ? <Cuerpo {...props} /> : <CuerpoCorto {...props} />}
    </article>
  );
}

function Cuerpo({ aviso, dueno, draft, onDraft, onSend, onRead }: AvisoCardProps) {
  const canReply = aviso.responder !== undefined && !aviso.respuesta;
  return (
    <div className={a.body}>
      <div className={a.textsCol}>
        <h2 id={`av-${aviso.id}`} className={`${a.title} ${a.titleStrong}`}>
          {aviso.titulo}
        </h2>
        <p className={`${a.text} ${a.textStrong}`}>
          <ConCifras text={aviso.cuerpo} rojo={aviso.tono === 'alerta'} />
        </p>
      </div>
      {aviso.respuesta ? <Enviada dueno={dueno} texto={aviso.respuesta} /> : null}
      {canReply ? (
        <Reply
          id={aviso.id}
          dueno={dueno}
          draft={draft}
          onDraft={onDraft}
          onSend={onSend}
          onRead={aviso.leido ? undefined : onRead}
        />
      ) : null}
      {!canReply && !aviso.leido ? (
        <div className={a.actions}>
          <button type="button" className={p.quietBtn} onClick={onRead}>
            Marcar leído
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CuerpoCorto({ aviso, onRead }: AvisoCardProps) {
  return (
    <div className={a.bodyRow}>
      <div className={a.texts}>
        <h2 id={`av-${aviso.id}`} className={a.title}>
          <ConCifras text={aviso.titulo} />
        </h2>
        <p className={a.text}>{aviso.cuerpo}</p>
      </div>
      {aviso.cta ? (
        <Link href={aviso.cta.href} className={p.outlineBtn} style={{ boxShadow: 'none' }}>
          {aviso.cta.label}
        </Link>
      ) : null}
      {aviso.leido ? null : (
        <button type="button" className={p.quietBtn} onClick={onRead}>
          Marcar leído
        </button>
      )}
    </div>
  );
}
