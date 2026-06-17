declare module 'react-native-url-polyfill/auto';

declare module 'fast-text-encoding' {
  export const TextEncoder: typeof globalThis.TextEncoder;
  export const TextDecoder: typeof globalThis.TextDecoder;
}

declare module 'react-native-fetch-api' {
  export const fetch: typeof globalThis.fetch;
  export const Headers: typeof globalThis.Headers;
  export const Request: typeof globalThis.Request;
  export const Response: typeof globalThis.Response;
}
