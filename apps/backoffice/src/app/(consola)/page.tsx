import { CapacityCard } from '@/components/capacity-card';
import type { CapacityReading } from '@/server/capacity/port';
import { drizzleCapacityProbe } from '@/server/db/capacity';
import { db } from '@/server/db/client';
import { requireStaffPage } from '@/server/staff';
import { body, card, heading, muted, stack } from '@/styles/ui.css';

import { RevisarForm } from './revisar-form';

/** The capacity card measures on every visit: it must never be a cached number. */
export const dynamic = 'force-dynamic';

async function measure(): Promise<CapacityReading | null> {
  try {
    return await drizzleCapacityProbe(db()).read();
  } catch (error) {
    // The home page stays usable; the card says it could not measure.
    console.error('capacity probe failed', error);
    return null;
  }
}

export default async function InicioPage() {
  await requireStaffPage();
  const reading = await measure();
  return (
    <div className={stack}>
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
      <CapacityCard reading={reading} />
    </div>
  );
}
