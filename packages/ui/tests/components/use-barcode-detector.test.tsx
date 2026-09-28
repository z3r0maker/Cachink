import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, waitFor } from '@testing-library/react';

/**
 * The scanner's engine wiring (Shape Detection + getUserMedia): the statuses
 * a consumer branches on and one delivered scan, through the real lifecycle —
 * camera asked, detector built, video played, code handed over.
 */

const { useBarcodeDetector } = await import('../../src/components/Scanner/use-barcode-detector');

const detect = vi.fn(async () => [{ rawValue: '7501234567890' }] as { rawValue: string }[]);
// A constructable function: the hook news it, and `new` refuses arrows.
const DetectorClase = vi.fn(function (this: unknown) {
  return { detect };
});

let streamDetenido = 0;
const stream = { getTracks: () => [{ stop: () => (streamDetenido += 1) }] };
const getUserMedia = vi.fn(async () => stream as unknown as MediaStream);
const play = vi.fn(async () => undefined);

beforeEach(() => {
  detect.mockReset();
  detect.mockResolvedValue([{ rawValue: '7501234567890' }]);
  DetectorClase.mockClear();
  streamDetenido = 0;
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue(stream as unknown as MediaStream);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  (window as unknown as { BarcodeDetector: unknown }).BarcodeDetector = DetectorClase;
  HTMLMediaElement.prototype.play = play as never;
});

afterEach(() => {
  delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
});

describe('useBarcodeDetector', () => {
  it('without the Shape Detection API the consumer falls back to manual entry', async () => {
    delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
    const { result } = renderHook(() => useBarcodeDetector(true, vi.fn()));
    await act(async () => {
      result.current.videoRef(document.createElement('video'));
    });
    expect(result.current.status).toBe('unavailable');
  });

  it('a camera the owner refuses is «denied»', async () => {
    getUserMedia.mockRejectedValue(new Error('NotAllowedError'));
    const { result } = renderHook(() => useBarcodeDetector(true, vi.fn()));
    await act(async () => {
      result.current.videoRef(document.createElement('video'));
    });
    await waitFor(() => expect(result.current.status).toBe('denied'));
  });

  it('a camera without the API on this navigator is «unavailable»', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {} });
    const { result } = renderHook(() => useBarcodeDetector(true, vi.fn()));
    await act(async () => {
      result.current.videoRef(document.createElement('video'));
    });
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
  });

  it('delivers a scanned code through the real lifecycle', async () => {
    const onScan = vi.fn();
    let estado = '';
    function Sonda(props: { readonly onScan: () => void }) {
      const escaner = useBarcodeDetector(true, props.onScan);
      estado = escaner.status;
      return <video ref={escaner.videoRef} />;
    }
    render(<Sonda onScan={onScan} />);
    await waitFor(() => expect(onScan).toHaveBeenCalledWith('7501234567890'));
    expect(getUserMedia).toHaveBeenCalled();
    expect(DetectorClase).toHaveBeenCalled();
    expect(play).toHaveBeenCalled();
    expect(['scanning', 'initializing']).toContain(estado);
  });

  it('closing the scanner stops the camera', async () => {
    function Sonda(props: { readonly open: boolean }) {
      const { videoRef } = useBarcodeDetector(props.open, vi.fn());
      return <video ref={videoRef} />;
    }
    const { rerender } = render(<Sonda open />);
    await waitFor(() => expect(play).toHaveBeenCalled());
    rerender(<Sonda open={false} />);
    expect(streamDetenido).toBeGreaterThanOrEqual(1);
  });
});
