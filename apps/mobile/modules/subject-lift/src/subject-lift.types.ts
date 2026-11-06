/**
 * What the lift hands back (M-13, ADR-134): a PNG on disk at most 1024 px a
 * side, and whether its background came off. `lifted: false` is a centred
 * square crop of the whole photo — iOS 16, no Play services, the model not
 * there yet, or no clear subject. Never an error.
 */
export interface SubjectLiftResult {
  /** `file://` URI of the PNG cutout (or square crop) in the cache. */
  readonly uri: string;
  readonly lifted: boolean;
  /** Pixel size of the PNG; 0 when no native module drew it (web). */
  readonly width: number;
  readonly height: number;
}

export interface SubjectLiftNative {
  /** Asks for the on-device model where one is downloaded (Android); true when lifting can work. */
  prepare(): Promise<boolean>;
  lift(uri: string): Promise<SubjectLiftResult>;
}
