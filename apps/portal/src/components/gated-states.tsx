import { Button } from './button';
import { Tag } from './tag';
import { stateAction, stateBody, stateCard, stateTitle, tile, tileEmpty } from './states.css';

export interface LockedStateProps {
  readonly title: string;
  readonly body: string;
  /** The plan that unlocks it, shown so the upsell is concrete. */
  readonly plan: string;
}

/**
 * Plan gating. Xangarrito sees this instead of the NIF statements (ADR-059).
 *
 * It reuses the empty-state card shape deliberately: the screen is not broken
 * and nothing is missing, it simply is not included yet.
 */
export function LockedState({ title, body, plan }: LockedStateProps) {
  return (
    <div className={stateCard}>
      <div className={`${tile} ${tileEmpty}`} aria-hidden="true">
        <svg
          width={34}
          height={34}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M4 10h16v11H4V10Zm4 0V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h2 className={stateTitle}>{title}</h2>
      <p className={stateBody}>{body}</p>
      <div className={stateAction}>
        <Button>Conoce {plan}</Button>
      </div>
    </div>
  );
}

export interface ProximamenteStateProps {
  readonly title: string;
  readonly body: string;
}

/**
 * The production gate on anything that makes an LLM call (ADR-059).
 *
 * Locally nothing is gated, so this renders only in production builds. There
 * is no call to action: it is not something the customer can unlock.
 */
export function ProximamenteState({ title, body }: ProximamenteStateProps) {
  return (
    <div className={stateCard}>
      <div className={`${tile} ${tileEmpty}`} aria-hidden="true">
        <svg
          width={34}
          height={34}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
        </svg>
      </div>
      <h2 className={stateTitle}>{title}</h2>
      <p className={stateBody}>{body}</p>
      <div className={stateAction}>
        <Tag tone="soft">Próximamente</Tag>
      </div>
    </div>
  );
}
