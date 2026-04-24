/**
 * `useBarcodeDetector` — hook that wires `getUserMedia` + the
 * `BarcodeDetector` Shape Detection API into a `<video>` ref and
 * fires `onScan(code)` once per unique detected code.
 *
 * Returns a tuple of:
 *   - a ref to attach to the `<video>` element
 *   - a `status` flag: 'unavailable' | 'initializing' | 'scanning' | 'denied'
 *   - a `stop()` function to release the camera + detection loop
 *
 * When BarcodeDetector isn't available (Safari/WebKit, older
 * browsers) `status` is `'unavailable'` and consumers fall back to
 * manual entry.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScannerStatus = 'unavailable' | 'initializing' | 'scanning' | 'denied';

interface NavigatorMediaLike {
  mediaDevices?: {
    getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  };
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorClass {
  new (init?: { formats?: string[] }): {
    detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
  };
}

function isBarcodeDetectorAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'BarcodeDetector' in window;
}

export interface UseBarcodeDetector {
  readonly videoRef: (el: HTMLVideoElement | null) => void;
  readonly status: ScannerStatus;
  readonly stop: () => void;
}

function makeDetector(formats: readonly string[]): InstanceType<BarcodeDetectorClass> {
  const Detector = (window as unknown as { BarcodeDetector: BarcodeDetectorClass }).BarcodeDetector;
  return new Detector({ formats: [...formats] });
}

interface LoopDeps {
  readonly videoElRef: React.MutableRefObject<HTMLVideoElement | null>;
  readonly loopRef: React.MutableRefObject<number | null>;
  readonly lastCodeRef: React.MutableRefObject<string | null>;
  readonly detector: InstanceType<BarcodeDetectorClass>;
  readonly onScan: (code: string) => void;
  readonly cancelledRef: React.MutableRefObject<boolean>;
}

function startDetectLoop(deps: LoopDeps): void {
  const tick = async (): Promise<void> => {
    if (deps.cancelledRef.current || !deps.videoElRef.current) return;
    try {
      const codes = await deps.detector.detect(deps.videoElRef.current);
      const first = codes[0]?.rawValue;
      if (first && first !== deps.lastCodeRef.current) {
        deps.lastCodeRef.current = first;
        deps.onScan(first);
      }
    } catch {
      /* frame-level failures are non-fatal; keep looping */
    }
    deps.loopRef.current = requestAnimationFrame(() => void tick());
  };
  void tick();
}

async function initStream(
  cancelledRef: React.MutableRefObject<boolean>,
  streamRef: React.MutableRefObject<MediaStream | null>,
  videoElRef: React.MutableRefObject<HTMLVideoElement | null>,
): Promise<boolean> {
  const nav = (typeof navigator !== 'undefined' ? navigator : null) as
    | (NavigatorMediaLike & Navigator)
    | null;
  if (!nav?.mediaDevices?.getUserMedia) return false;
  const stream = await nav.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  if (cancelledRef.current) {
    stream.getTracks().forEach((t) => t.stop());
    return false;
  }
  streamRef.current = stream;
  const video = videoElRef.current;
  if (video) {
    video.srcObject = stream;
    await video.play();
  }
  return true;
}

interface DetectorRefs {
  readonly videoElRef: React.MutableRefObject<HTMLVideoElement | null>;
  readonly streamRef: React.MutableRefObject<MediaStream | null>;
  readonly loopRef: React.MutableRefObject<number | null>;
  readonly lastCodeRef: React.MutableRefObject<string | null>;
  readonly cancelledRef: React.MutableRefObject<boolean>;
}

function useDetectorRefs(): DetectorRefs {
  return {
    videoElRef: useRef<HTMLVideoElement | null>(null),
    streamRef: useRef<MediaStream | null>(null),
    loopRef: useRef<number | null>(null),
    lastCodeRef: useRef<string | null>(null),
    cancelledRef: useRef(false),
  };
}

async function runDetectorLifecycle(
  refs: DetectorRefs,
  formats: readonly string[],
  onScan: (code: string) => void,
  setStatus: (next: ScannerStatus) => void,
): Promise<void> {
  try {
    const ok = await initStream(refs.cancelledRef, refs.streamRef, refs.videoElRef);
    if (!ok) {
      setStatus('unavailable');
      return;
    }
    setStatus('scanning');
    startDetectLoop({
      videoElRef: refs.videoElRef,
      loopRef: refs.loopRef,
      lastCodeRef: refs.lastCodeRef,
      detector: makeDetector(formats),
      onScan,
      cancelledRef: refs.cancelledRef,
    });
  } catch {
    setStatus('denied');
  }
}

function useStopCallback(refs: DetectorRefs): () => void {
  return useCallback((): void => {
    if (refs.loopRef.current !== null) {
      cancelAnimationFrame(refs.loopRef.current);
      refs.loopRef.current = null;
    }
    refs.streamRef.current?.getTracks().forEach((t) => t.stop());
    refs.streamRef.current = null;
  }, [refs]);
}

export function useBarcodeDetector(
  open: boolean,
  onScan: (code: string) => void,
  formats: readonly string[] = ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a'],
): UseBarcodeDetector {
  const [status, setStatus] = useState<ScannerStatus>(
    isBarcodeDetectorAvailable() ? 'initializing' : 'unavailable',
  );
  const refs = useDetectorRefs();
  const stop = useStopCallback(refs);
  const videoRef = useCallback(
    (el: HTMLVideoElement | null): void => {
      refs.videoElRef.current = el;
    },
    [refs],
  );

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    if (!isBarcodeDetectorAvailable()) {
      setStatus('unavailable');
      return;
    }
    refs.cancelledRef.current = false;
    void runDetectorLifecycle(refs, formats, onScan, setStatus);
    return () => {
      refs.cancelledRef.current = true;
      stop();
    };
  }, [open, onScan, formats, stop, refs]);

  return { videoRef, status, stop };
}
