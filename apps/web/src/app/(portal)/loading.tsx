import { LoadingState } from '@/components';

/**
 * The portal's loading state (S-1) — every route, one file.
 *
 * "Static gray blocks: `--gray-100` fills with the real borders and shadows in
 * place, sized to the content they replace, plus an uppercase «Cargando…»
 * line. **Never a shimmer or a spinner.**" — design handoff, "The four data
 * states". `LoadingState` is that, already built; until now nothing rendered
 * it and a portal navigation simply froze on the outgoing screen.
 *
 * The shell stays put: this fills `(portal)/layout.tsx`'s content area, so the
 * sidebar and header never move. The title is a block rather than text, which
 * is the one place this departs from "title stays" — during a route change the
 * incoming screen owns its title and has not rendered yet. Within a screen the
 * title does stay, because `ScreenBody` swaps the content area beneath it.
 *
 * The four heights stand in for what almost every portal screen puts there:
 * the title row, the tabs or filters, a wide card, and a second card below.
 */
export default function PortalLoading() {
  return <LoadingState blocks={[44, 56, 220, 140]} />;
}
