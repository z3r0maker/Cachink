import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import { SHELL_FIXTURE } from '@/operador/fixtures';
import { OperadorShell } from '@/operador/shell/shell';

export const metadata: Metadata = { title: 'Caja · Xangarro!' };

/**
 * The operator's register (Track O). The shell lives in the layout so it never
 * re-mounts between screens (O-11 gate). Data is the design fixture until the
 * register runtime (O-06) supplies the linked device's own.
 */
export default function OperadorLayout({ children }: { readonly children: ReactNode }) {
  return <OperadorShell data={SHELL_FIXTURE}>{children}</OperadorShell>;
}
