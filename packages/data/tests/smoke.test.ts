import { describe, it, expect } from 'vitest';
import { NoopReceiptPrinter, NoopBarcodeScanner, NoopPaymentTerminal } from '../src/index.js';

describe('@cachink/data — hardware noop implementations', () => {
  it('ReceiptPrinter noop reports unavailable', async () => {
    expect(await NoopReceiptPrinter.isAvailable()).toBe(false);
  });

  it('ReceiptPrinter noop throws on printReceipt (Phase 2 feature)', async () => {
    await expect(NoopReceiptPrinter.printReceipt('x')).rejects.toThrow(
      /No receipt printer configured/,
    );
  });

  it('BarcodeScanner noop reports unavailable', async () => {
    expect(await NoopBarcodeScanner.isAvailable()).toBe(false);
  });

  it('BarcodeScanner noop returns null on scan', async () => {
    expect(await NoopBarcodeScanner.scan()).toBeNull();
  });

  it('PaymentTerminal noop reports unavailable', async () => {
    expect(await NoopPaymentTerminal.isAvailable()).toBe(false);
  });

  it('PaymentTerminal noop rejects charges', async () => {
    const result = await NoopPaymentTerminal.charge(1000n);
    expect(result.ok).toBe(false);
  });
});
