import { LoadingState } from '@/components';
import { column, page } from '@/onboarding/ui/onboarding.css';

/** The loading state of every onboarding page (the four states, ADR-058). */
export default function OnboardingLoading() {
  return (
    <main className={page}>
      <div className={column}>
        <LoadingState blocks={[48, 14, 320]} />
      </div>
    </main>
  );
}
