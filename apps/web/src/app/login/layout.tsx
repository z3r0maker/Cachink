import type { ReactNode } from 'react';

import { PanelAcceso } from './aside';
import { columna, rejilla } from './aside.css';
import { CortinaProvider } from './cortina';

/**
 * Every `/login/*` page sits in the two-column frame (P-02): the yellow
 * panel with the storefront on the left, the card centered in its column on
 * the right. Below 1024 px the panel shrinks to a band above the card. The
 * provider lets the doors and the form move the panel's shutter.
 */
export default function LoginLayout({ children }: { readonly children: ReactNode }) {
  return (
    <CortinaProvider>
      <div className={rejilla}>
        <PanelAcceso />
        <div className={columna}>{children}</div>
      </div>
    </CortinaProvider>
  );
}
