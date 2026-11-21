/**
 * The report sheet over the app (M-23, ADR-162): the shared `ReportarHost`
 * with the build this phone runs, which only the app shell knows. Mounted
 * beside the stack, inside the activation and sync providers (the overlays
 * sit outside them), so the help button on any tab opens the same sheet and
 * the sheet has the device token to send with.
 */
import type { ReactElement } from 'react';
import { ReportarHost } from '@xangarro/ui';
import { useMobileDeviceContext } from './use-device-context';

export function ReportarSheetHost(): ReactElement {
  return <ReportarHost deviceContext={useMobileDeviceContext()} />;
}
