// Breaks the api <-> auth import cycle:
// the auth store registers itself here, api.ts reads the token lazily.

let getToken: () => string | null = () => null

export function registerTokenProvider(fn: () => string | null): void {
  getToken = fn
}

export function currentToken(): string | null {
  try {
    return getToken()
  } catch {
    return null
  }
}
