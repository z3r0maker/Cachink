import Link from 'next/link';
import { colors } from '@xangarro/tokens';

import { Tile } from '../ui/panel';
import * as p from '../ui/panel.css';
import * as a from './avisos.css';
import type { Aviso, AvisoTono } from '@xangarro/caja/avisos';

const TINTE: Record<AvisoTono, string> = {
  alerta: colors.redSoft,
  dueno: colors.yellowSoft,
  atencion: colors.warningSoft,
  info: colors.blueSoft,
  hecho: colors.greenSoft,
};

/** A notice the register raised: kind · time · unread, then what to do. */
export function AvisoSistema({ aviso }: { readonly aviso: Aviso }) {
  return (
    <article aria-label={aviso.titulo} className={a.sistema}>
      <Tile icon={aviso.icono} tint={TINTE[aviso.tono]} size={52} glyph={22} />
      <div className={a.texts} style={{ gap: 4 }}>
        <div className={a.meta}>
          <span className={p.eyebrow}>{aviso.tipo}</span>
          <span className={a.metaHora}>· {aviso.hora}</span>
          {aviso.leido ? null : (
            <span className={a.sinLeer}>
              <span className={a.sinLeerDot} aria-hidden="true" />
              Sin leer
            </span>
          )}
        </div>
        <span className={a.sistemaTitle}>{aviso.titulo}</span>
        <span className={a.sistemaText}>{aviso.cuerpo}</span>
      </div>
      {aviso.cta ? (
        <Link href={aviso.cta.href} className={p.outlineBtn} style={{ boxShadow: 'none' }}>
          {aviso.cta.label}
        </Link>
      ) : null}
    </article>
  );
}
