/**
 * TextDecoder polyfill — maps unsupported encodings to utf-8.
 *
 * React Native's TextDecoder polyfill only supports 'utf-8' and
 * 'utf-16le'. Libraries like `@react-pdf/renderer` request 'ascii'
 * encoding which throws "Unknown encoding: ascii". Since ASCII is a
 * strict subset of UTF-8, we can safely map it.
 *
 * Must be imported BEFORE any library that uses TextDecoder with
 * non-standard encodings (i.e., before @react-pdf/renderer loads).
 */

const OriginalTextDecoder = globalThis.TextDecoder;

if (OriginalTextDecoder) {
  globalThis.TextDecoder = class PatchedTextDecoder extends OriginalTextDecoder {
    constructor(label?: string, options?: TextDecoderOptions) {
      const normalized = (label ?? 'utf-8').toLowerCase().trim();
      const safe =
        normalized === 'ascii' || normalized === 'us-ascii'
          ? 'utf-8'
          : normalized;
      super(safe, options);
    }
  } as typeof TextDecoder;
}
