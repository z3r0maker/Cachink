import { DonCargando } from '@/components';
import { column, page } from '@/onboarding/ui/onboarding.css';

/** The loading state of every onboarding page (ADR-058), Don Cuentas counting (ADR-107). */
export default function OnboardingLoading() {
  return (
    <main className={page}>
      <div className={column}>
        <DonCargando />
      </div>
    </main>
  );
}
