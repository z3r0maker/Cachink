'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, Button, Card } from '@/components';
import { Stage } from '@/onboarding/ui/stage';
import { hint, question } from '@/onboarding/ui/stage.css';
import { TOTAL_STEPS } from '@/onboarding/wizard-steps';
import { actions, list, note, stack } from '@/onboarding/ui/onboarding.css';
import { aplicarCambios } from '@/server/actions/onboarding';

function useApply() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const apply = () =>
    startTransition(async () => {
      const r = await aplicarCambios();
      if (!r.ok) return setError(r.message);
      router.push('/como-empiezo');
    });
  return { error, pending, apply, router };
}

function Cambios({ lines }: { readonly lines: readonly string[] }) {
  return lines.length === 0 ? (
    <p className={note}>Todo queda igual.</p>
  ) : (
    <ul className={list} data-testid="review-changes">
      {lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/** N-15: every change listed before anything is applied; none means a no-op. */
export function ReviewScreen({ lines }: { readonly lines: readonly string[] }) {
  const { error, pending, apply, router } = useApply();
  const none = lines.length === 0;
  return (
    <Stage
      fase="Volver a configurar"
      paso="Revisión"
      done={TOTAL_STEPS}
      total={TOTAL_STEPS}
      don={
        none
          ? { pose: 'celebrando', text: 'Todo sigue igual. Tu negocio ya está como me dijiste.' }
          : {
              pose: 'pensando',
              text: 'Esto es lo que cambiaría. Nada se aplica hasta que tú digas.',
            }
      }
    >
      <h1 className={question}>{none ? 'No hay cambios' : 'Esto cambiará'}</h1>
      <p className={hint}>
        {none ? 'Tus respuestas coinciden con cómo está tu negocio.' : 'Revísalo antes de aplicar.'}
      </p>
      <Card>
        <div className={stack}>
          <Cambios lines={lines} />
          {error ? <Banner tone="critical" title={error} /> : null}
          <div className={actions}>
            <Button variant="ghost" onClick={() => router.push('/bienvenida?modo=reconfigurar')}>
              Cambiar respuestas
            </Button>
            <Button onClick={none ? () => router.push('/como-empiezo') : apply} disabled={pending}>
              {none ? 'Listo' : 'Aplicar cambios'}
            </Button>
          </div>
        </div>
      </Card>
    </Stage>
  );
}
