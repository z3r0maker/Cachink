import * as c from './controls.css';

/** A notice inside the vale: a bold first line and what to do next (boards CD-20, CD-20b). */
export function Notice({
  tone,
  title,
  children,
}: {
  readonly tone: 'aviso' | 'error' | 'ok';
  readonly title: string;
  readonly children?: React.ReactNode;
}) {
  return (
    <div role={tone === 'ok' ? 'status' : 'alert'} className={c.notice[tone]}>
      <span className={c.noticeTitle}>{title}</span>
      {children === undefined ? null : <span>{children}</span>}
    </div>
  );
}
