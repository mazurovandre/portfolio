import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
    env: {
      // The end-to-end tests boot a server on 127.0.0.1. If the environment
      // sets HTTP_PROXY (a corporate network, a sandboxed CI), the request
      // would be routed to the proxy and never reach our own server — so
      // local addresses are excluded.
      NO_PROXY: '127.0.0.1,localhost,::1',
      no_proxy: '127.0.0.1,localhost,::1',
    },
  },
})
