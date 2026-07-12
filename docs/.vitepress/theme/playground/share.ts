// Serializes playground code into a URL fragment so a session can be shared
// by link. lz-string's URI-safe variant keeps the fragment compact and free
// of characters that would need escaping.
// lz-string ships as CommonJS; import the default and destructure so the
// VitePress SSR (Node ESM) build resolves it.
import lzString from "lz-string";

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } =
  lzString;

export function encodeCode(source: string): string {
  return compressToEncodedURIComponent(source);
}

export function decodeCode(encoded: string): string | null {
  try {
    const out = decompressFromEncodedURIComponent(encoded);
    // lz-string returns "" for empty input and null for corrupt input; treat
    // anything that doesn't round-trip to real content as absent.
    return out ? out : null;
  } catch {
    return null;
  }
}
