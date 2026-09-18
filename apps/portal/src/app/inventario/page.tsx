import { Buttons, Cards, Fields, States, Tags } from './sections';
import { Banners, Kpis } from './sections-data';
import { Interactive } from './sections-interactive';
import { Forms } from './sections-forms';
import { h1, page, subtitle } from './page.css';

/**
 * Fase 1 compuerta: compared side by side with the design system.
 *
 * It renders every primitive in every variant, including the press stamp, so a
 * reviewer can check geometry against `/design-reference/` at a glance. This is
 * development scaffolding, not a product screen.
 */
export default function InventarioPage() {
  return (
    <main className={page}>
      <div>
        <h1 className={h1}>Inventario de primitivas</h1>
        <p className={subtitle}>Fase 1 · todos los componentes, todas sus variantes</p>
      </div>
      <Buttons />
      <Tags />
      <Cards />
      <Kpis />
      <Banners />
      <Interactive />
      <Fields />
      <Forms />
      <States />
    </main>
  );
}
