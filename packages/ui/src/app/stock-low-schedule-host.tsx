/**
 * StockLowScheduleHost — keeps the 19:00 stock-low reminder scheduled for
 * as long as the app runs (A-13). Renders nothing; mount it among the app
 * overlays so it lives outside the sign-in gate.
 */

import { useScheduleStockLowCheck } from '../hooks/use-schedule-stock-low-check';

export function StockLowScheduleHost(): null {
  useScheduleStockLowCheck();
  return null;
}
