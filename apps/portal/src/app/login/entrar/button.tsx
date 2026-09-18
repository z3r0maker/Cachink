'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, Button } from '@/components';
import { entrarConEnlace } from '@/server/actions/auth-links';

import { AuthCard } from '../auth-card';

export function EnterButton({ token }: { readonly token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const enter = () =>
    startTransition(async () => {
      const r = await entrarConEnlace(token);
      if (!r.ok) return setError(r.message);
      router.replace('/');
      router.refresh();
    });

  return (
    <AuthCard
      title="Entra a tu portal"
      back={{ href: '/login/enlace', label: 'Pedir otro enlace' }}
    >
      {error === null ? null : <Banner tone="warning" title={error} />}
      <Button onClick={enter} disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </AuthCard>
  );
}
