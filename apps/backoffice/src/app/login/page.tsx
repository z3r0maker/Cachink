import { Trastienda, Vale } from '@/components/trastienda/trastienda';

import { LoginForm } from './form';

export default function LoginPage() {
  return (
    <Trastienda mood="idle">
      <Vale
        eyebrow="Vale de entrada · Paso 1 de 2"
        title="Pásale a la trastienda."
        titleId="login-title"
        intro="Solo para el equipo de Xangarro. Después de entrar te pedimos tu código de verificación en dos pasos."
      >
        <LoginForm />
      </Vale>
    </Trastienda>
  );
}
