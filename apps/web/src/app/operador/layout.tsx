import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import { SHELL_FIXTURE } from '@/operador/fixtures';
import { AccesoGate } from '@/operador/acceso/gate';
import { OperadorShell } from '@/operador/shell/shell';

export const metadata: Metadata = { title: 'Caja · Xangarro!' };

/**
 * The operator's register (Track O). The gate (O-12) stands before everything:
 * an unlinked browser sees only Acceso. The shell lives in the layout so it
 * never re-mounts between screens (O-11 gate). Data is the design fixture
 * until the register screens read the linked device's own (O-14+).
 */
export default function OperadorLayout({ children }: { readonly children: ReactNode }) {
  return (
    <AccesoGate>
      <OperadorShell data={SHELL_FIXTURE}>{children}</OperadorShell>
    </AccesoGate>
  );
}
