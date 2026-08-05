/**
 * Every call to Fastify goes through here — from the Nuxt server, over the
 * internal address. The browser knows nothing about the API, so there is no
 * CORS and no publicly reachable admin route.
 */
export function apiFetch<T>(path: string, options: Parameters<typeof $fetch>[1] = {}) {
  const { apiInternalUrl } = useRuntimeConfig()

  return $fetch<T>(path, {
    baseURL: apiInternalUrl,
    timeout: 5_000,
    ...options,
  })
}
