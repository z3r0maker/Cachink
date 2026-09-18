import { pending } from './pending-screen.css';

/**
 * A screen whose task has not run yet: the content area, empty. No filler text
 * (plan §7) — only the shell, so navigation can be checked before content lands.
 */
export function PendingScreen() {
  return <main className={pending} />;
}
