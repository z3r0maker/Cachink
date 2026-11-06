import type { ReactNode } from 'react';

import { MarcoPublico } from '../_publico/marco';

/** The yellow panel of every `/eliminacion` page (ElProgramada). */
export function MarcoEliminacion({ children }: { readonly children: ReactNode }) {
  return (
    <MarcoPublico
      pose="quieto"
      titulo="Tus datos, tu decisión."
      bajada="Te avisamos antes de borrar, y durante 30 días puedes arrepentirte."
    >
      {children}
    </MarcoPublico>
  );
}
