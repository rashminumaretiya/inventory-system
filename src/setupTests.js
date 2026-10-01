// Adds the DOM matchers used across the test suite, e.g.
// expect(element).toBeInTheDocument() and .toHaveValue().
import "@testing-library/jest-dom";

// This jsdom build ships neither SubtleCrypto nor TextEncoder, both of which
// the PIN lock uses. Browsers have had them for years.
import { webcrypto } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
