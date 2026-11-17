import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: { type: "session" },
})

export function api<T>(path: string, init?: { method?: string; body?: unknown; query?: Record<string, unknown> }) {
  return sdk.client.fetch<T>(path, {
    method: init?.method,
    body: init?.body as any,
    query: init?.query,
  })
}
