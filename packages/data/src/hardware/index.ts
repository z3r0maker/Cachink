/**
 * Hardware integration interfaces. Phase 2 per CLAUDE.md §11.
 *
 * Phase 1 code may reference these interfaces via NoopImplementation so the
 * UI can wire up print/scan/payment actions that are guaranteed to exist.
 * Real implementations land in Phase 2 with platform-specific variants
 * following the platform-extension pattern (CLAUDE.md §5.3).
 */

export interface ReceiptPrinter {
  isAvailable(): Promise<boolean>;
  printReceipt(content: string): Promise<void>;
}

export interface BarcodeScanner {
  isAvailable(): Promise<boolean>;
  scan(): Promise<string | null>;
}

export interface PaymentTerminal {
  isAvailable(): Promise<boolean>;
  charge(amountCentavos: bigint): Promise<{ ok: boolean; reference?: string }>;
}

/** Noop implementations for Phase 1. All return "unavailable" so callers gracefully degrade. */
export const NoopReceiptPrinter: ReceiptPrinter = {
  isAvailable: async () => false,
  printReceipt: async () => {
    throw new Error('No receipt printer configured in Phase 1.');
  },
};

export const NoopBarcodeScanner: BarcodeScanner = {
  isAvailable: async () => false,
  scan: async () => null,
};

export const NoopPaymentTerminal: PaymentTerminal = {
  isAvailable: async () => false,
  charge: async () => ({ ok: false }),
};
