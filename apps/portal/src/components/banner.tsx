import type { ReactNode } from 'react';

import { banner } from './banner.css';

export interface BannerProps {
  readonly tone?: 'critical' | 'warning' | 'info' | 'success';
  /** A short glyph. Severity must never be carried by colour alone. */
  readonly icon?: ReactNode;
  readonly title: string;
  readonly body?: string;
  readonly action?: ReactNode;
}

export function Banner({ tone = 'info', icon, title, body, action }: BannerProps) {
  return (
    <div className={banner({ tone })} role={tone === 'critical' ? 'alert' : 'status'}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <strong>{title}</strong>
        {body ? <div>{body}</div> : null}
      </div>
      {action ? <div style={{ marginLeft: 'auto' }}>{action}</div> : null}
    </div>
  );
}
