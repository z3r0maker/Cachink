import { body, card, heading, muted } from '@/styles/ui.css';

import { RevisarForm } from './revisar-form';

export default function InicioPage() {
  return (
    <section className={card} aria-labelledby="inicio-title">
      <h1 id="inicio-title" className={heading}>
        Consola interna
      </h1>
      <p className={body}>
        Cada acción que cambia algo desde aquí queda registrada con tu nombre en la bitácora del
        equipo.
      </p>
      <p className={muted}>
        Prueba de la bitácora: este botón no cambia nada más que registrar que lo presionaste.
      </p>
      <RevisarForm />
    </section>
  );
}
