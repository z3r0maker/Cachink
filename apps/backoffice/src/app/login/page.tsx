import { body, card, centered, heading } from '@/styles/ui.css';

import { LoginForm } from './form';

export default function LoginPage() {
  return (
    <main className={centered}>
      <section className={card} aria-labelledby="login-title">
        <h1 id="login-title" className={heading}>
          Consola interna
        </h1>
        <p className={body}>
          Solo para el equipo de Xangarro. Después de entrar te pediremos tu código de verificación
          en dos pasos.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
