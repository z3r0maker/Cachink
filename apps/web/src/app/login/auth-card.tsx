import Link from 'next/link';

import { Card } from '@/components';

import { tituloAcceso } from './auth-card.css';

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
    <div style={{ width: '100%', maxWidth: 460 }}>
      <Card>
        <h1 className={tituloAcceso}>{title}</h1>
        {children}
        {back === undefined ? null : (
          <p>
            <Link href={back.href}>{back.label}</Link>
          </p>
        )}
      </Card>
    </div>
  );
}
