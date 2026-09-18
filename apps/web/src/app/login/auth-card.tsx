import Link from 'next/link';

import { Card } from '@/components';

/** The narrow signed-out card every `/login/*` page sits in, with its way back. */
export function AuthCard({
  title,
  back,
  children,
}: {
  readonly title: string;
  readonly back?: { readonly href: string; readonly label: string };
  readonly children: React.ReactNode;
}) {
  return (
    <main style={{ maxWidth: 460, margin: '10vh auto', padding: '0 16px' }}>
      <Card>
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        {children}
        {back === undefined ? null : (
          <p>
            <Link href={back.href}>{back.label}</Link>
          </p>
        )}
      </Card>
    </main>
  );
}
