/**
 * The report sheet over the app (M-23, ADR-162): the shared `ReportarHost`
 * with the build this phone runs, which only the app shell knows. Mounted
 * with the overlays, so the help button on any tab opens the same sheet.
 */
import type { ReactElement } from 'react';
import { ReportarHost } from '@xangarro/ui';
import { useMobileDeviceContext } from './use-device-context';

export function ReportarSheetHost(): ReactElement {
  return <ReportarHost deviceContext={useMobileDeviceContext()} />;
}
