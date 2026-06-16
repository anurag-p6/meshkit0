/**
 * Side-effect polyfills for React Native. Import once at app entry, before Meshkit:
 *
 * ```ts
 * import '@ipfs-meshkit/react-native/polyfills';
 * ```
 *
 * Install peer dependencies in your app:
 *
 * ```bash
 * npm install react-native-get-random-values react-native-url-polyfill \
 *   react-native-fetch-api web-streams-polyfill fast-text-encoding
 * ```
 */

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { TextDecoder, TextEncoder } from 'fast-text-encoding';
import { fetch, Headers, Request, Response } from 'react-native-fetch-api';
import { ReadableStream } from 'web-streams-polyfill';

const globals = globalThis as Record<string, unknown>;

if (globals.TextEncoder === undefined) {
  globals.TextEncoder = TextEncoder;
}
if (globals.TextDecoder === undefined) {
  globals.TextDecoder = TextDecoder;
}
if (globals.ReadableStream === undefined) {
  globals.ReadableStream = ReadableStream;
}
if (globals.fetch === undefined) {
  globals.fetch = fetch;
}
if (globals.Headers === undefined) {
  globals.Headers = Headers;
}
if (globals.Request === undefined) {
  globals.Request = Request;
}
if (globals.Response === undefined) {
  globals.Response = Response;
}
