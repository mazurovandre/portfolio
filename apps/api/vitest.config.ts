import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // mongodb-memory-server downloads its binary on the first run
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Each file boots its own in-memory Mongo and its own mongoose
    // connection — parallel workers would fight over it.
    fileParallelism: false,
  },
})
