import type { CSSProperties, ReactNode } from 'react';
import { typography } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as n from './note.css';

const INFO = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v.01M12 11v5';

/** An «i» note; tint, padding and weight vary per file, so they are props. */
export function Note({
  bg,
  weight = 'semibold',
  padding,
  textColor,
  children,
}: {
  readonly bg: string;
  readonly weight?: 'semibold' | 'bold';
  readonly padding?: CSSProperties['padding'];
  readonly textColor?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={n.note} style={{ background: bg, padding }}>
      <span className={n.glyph}>
        <Icon path={INFO} size={20} strokeWidth={2.4} />
      </span>
      <div className={n.text} style={{ fontWeight: typography.weights[weight], color: textColor }}>
        {children}
      </div>
    </div>
  );
}
