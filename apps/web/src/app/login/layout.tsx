import type { ReactNode } from 'react';

import { PanelAcceso } from './aside';
import { columna, rejilla } from './aside.css';

/**
 * Every `/login/*` page sits in the two-column frame (P-02): the yellow
 * panel with the animation on the left, the card centered in its column on
 * the right. Below 1024 px the panel folds away (the shell's own rule).
 */
export default function LoginLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className={rejilla}>
      <PanelAcceso />
      <div className={columna}>{children}</div>
    </div>
  );
}
