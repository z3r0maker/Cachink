import { Suspense, lazy } from 'react';
import { HomeShell } from '../home/HomeShell.jsx';

// Below the fold loads after the hero is interactive; prerender (AppSSR.jsx)
// imports it eagerly so crawlers get the full page.
const BelowFold = lazy(() => import('../home/BelowFold.jsx'));

export default function App() {
  // The utm_* pass-through lives in src/utm.jsx, which main.jsx wraps around every route (N-57).
  return (
    <HomeShell>
      <Suspense fallback={null}>
        <BelowFold />
      </Suspense>
    </HomeShell>
  );
}
